from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from app.jobs.parse_job import run_parse_job
from app.parsers.question_store import get_questions_for_paper, get_questions_for_subject
from app.parsers.question_parser import QuestionParser
from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)
_parser = QuestionParser()


@router.post("/parse/trigger")
async def trigger_parsing(
    background_tasks: BackgroundTasks,
    paper_id: Optional[str] = None,
):
    """Queue question parsing for one paper or all extracted papers."""
    background_tasks.add_task(run_parse_job, paper_id)
    return {
        "success": True,
        "data": {
            "message": f"Parsing queued for {'paper ' + paper_id if paper_id else 'all extracted papers'}"
        }
    }


@router.post("/parse/run")
async def run_parsing_sync(paper_id: Optional[str] = None):
    """Synchronous parse — waits for result (use for testing)."""
    result = await run_parse_job(paper_id)
    return {"success": True, "data": result}


@router.get("/parse/preview")
async def preview_parse(paper_id: str):
    """
    Parse a paper in memory and return structured questions WITHOUT storing.
    Useful for verifying parse quality before committing to DB.
    """
    db = get_db()
    paper = db.table("papers") \
        .select("id, subject_id, raw_text, title") \
        .eq("id", paper_id) \
        .single().execute()

    if not paper.data:
        raise HTTPException(404, f"Paper {paper_id} not found")

    raw_text = paper.data.get("raw_text") or ""
    if not raw_text:
        raise HTTPException(400, "Paper has no extracted text. Run extraction first.")

    result = _parser.parse(
        raw_text=raw_text,
        paper_id=paper_id,
        subject_id=paper.data.get("subject_id"),
    )

    return {
        "success": True,
        "data": {
            "paper_id": paper_id,
            "paper_title": paper.data.get("title"),
            "total_questions": result.total_questions,
            "part_a_count": result.part_a_count,
            "part_b_count": result.part_b_count,
            "warnings": result.parse_warnings,
            "questions": [q.model_dump() for q in result.questions],
        }
    }


@router.get("/questions")
async def list_questions(
    subject_id: Optional[str] = None,
    paper_id: Optional[str] = None,
    question_type: Optional[str] = None,
    marks: Optional[int] = None,
    section: Optional[str] = None,
):
    """List questions with filters. Returns evidence trail (paper_id on each)."""
    if paper_id:
        data = get_questions_for_paper(paper_id)
    elif subject_id:
        data = get_questions_for_subject(
            subject_id=subject_id,
            question_type=question_type,
            marks=marks,
            section=section,
        )
    else:
        raise HTTPException(400, "Provide subject_id or paper_id")

    return {
        "success": True,
        "data": data,
        "meta": {"total": len(data)}
    }


class BatchQuestionsRequest(BaseModel):
    paper_ids: List[str]


@router.post("/questions/batch")
async def batch_questions(req: BatchQuestionsRequest):
    """Get questions for multiple papers in one call."""
    db = get_db()
    try:
        result = db.table("questions").select("*").in_("paper_id", req.paper_ids).execute()
        return {
            "success": True,
            "data": result.data or [],
            "meta": {"total": len(result.data or [])}
        }
    except Exception as e:
        log.error(f"Failed to fetch batch questions: {e}")
        raise HTTPException(500, f"Failed to fetch questions: {e}")


@router.get("/questions/{question_id}")
async def get_question(question_id: str):
    """
    Single question with full evidence trail:
    question -> paper -> original_url
    """
    db = get_db()
    q_result = db.table("questions").select("*").eq("id", question_id).single().execute()
    if not q_result.data:
        raise HTTPException(404, "Question not found")

    q = q_result.data
    # Attach paper context for evidence trail
    paper = db.table("papers") \
        .select("id, title, exam_year, exam_month, exam_type, original_url, regulation") \
        .eq("id", q["paper_id"]) \
        .single().execute()

    return {
        "success": True,
        "data": {
            **q,
            "evidence": {
                "paper_id"   : q["paper_id"],
                "paper_title": paper.data.get("title") if paper.data else None,
                "exam_year"  : paper.data.get("exam_year") if paper.data else None,
                "exam_month" : paper.data.get("exam_month") if paper.data else None,
                "exam_type"  : paper.data.get("exam_type") if paper.data else None,
                "original_url": paper.data.get("original_url") if paper.data else None,
            }
        }
    }


@router.get("/parse/stats")
async def parse_stats():
    """Returns question counts by type, section, marks."""
    db = get_db()
    questions = db.table("questions").select(
        "question_type, part, marks"
    ).execute().data

    by_type: dict = {}
    by_section: dict = {}
    by_marks: dict = {}

    for q in questions:
        t = q.get("question_type") or "unknown"
        s = q.get("part") or "Unknown"
        m = str(q.get("marks") or "?")
        by_type[t]    = by_type.get(t, 0) + 1
        by_section[s] = by_section.get(s, 0) + 1
        by_marks[m]   = by_marks.get(m, 0) + 1

    return {
        "success": True,
        "data": {
            "total": len(questions),
            "by_type": by_type,
            "by_section": by_section,
            "by_marks": by_marks,
        }
    }
