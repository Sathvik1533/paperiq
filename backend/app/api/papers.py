"""
Papers API — B7 fix: GET /papers now includes parsed questions per paper.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)


@router.get("/papers")
async def list_papers(
    subject_id: Optional[str] = None,
    year: Optional[int] = None,
    exam_type: Optional[str] = None,
    exam_category: Optional[str] = None,
    regulation: Optional[str] = None,
    college_id: Optional[str] = None,
):
    """
    Returns papers with their parsed questions included.
    B7 fix: joins questions so the Paper Viewer can display them.
    """
    db = get_db()
    q = db.table("papers").select(
        "id, title, exam_year, exam_month, exam_type, exam_category, regulation, "
        "max_marks, btech_year, file_type, extraction_status, subject_id, created_at"
    )
    if subject_id:
        q = q.eq("subject_id", subject_id)
    if year:
        q = q.eq("exam_year", year)
    if exam_type:
        q = q.eq("exam_type", exam_type)
    if exam_category:
        q = q.eq("exam_category", exam_category)
    if regulation:
        q = q.eq("regulation", regulation)
    if college_id:
        q = q.eq("college_id", college_id)

    result = q.order("exam_year", desc=True).execute()
    papers = result.data or []

    # Attach parsed questions for each paper (B7 fix)
    if papers:
        paper_ids = [p["id"] for p in papers]
        try:
            q_result = db.table("questions").select(
                "id, paper_id, question_number, part, question_text, "
                "question_type, marks, unit_number, co, is_or_question"
            ).in_("paper_id", paper_ids).execute()
            questions_by_paper: dict[str, list] = {}
            for q in (q_result.data or []):
                pid = q["paper_id"]
                questions_by_paper.setdefault(pid, []).append(q)
            for paper in papers:
                paper["parsed_questions"] = questions_by_paper.get(paper["id"], [])
        except Exception as e:
            log.warning(f"Could not fetch questions for papers: {e}")
            for paper in papers:
                paper["parsed_questions"] = []

    return {
        "success": True,
        "data": papers,
        "meta": {"total": len(papers)}
    }


@router.get("/papers/{paper_id}")
async def get_paper(paper_id: str):
    db = get_db()
    result = db.table("papers").select("*").eq("id", paper_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Paper not found")
    return {"success": True, "data": result.data}


@router.get("/papers/{paper_id}/questions")
async def get_paper_questions(paper_id: str):
    db = get_db()
    result = db.table("questions").select("*").eq("paper_id", paper_id).execute()
    return {"success": True, "data": result.data}
