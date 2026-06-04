from app.database import get_db
from app.parsers.question_parser import QuestionParser
from app.parsers.question_store import store_parse_result
from app.logger import get_logger

log = get_logger(__name__)
_parser = QuestionParser()


async def run_parse_job(paper_id: str | None = None) -> dict:
    db = get_db()
    if paper_id:
        papers = db.table("papers") \
            .select("id, subject_id, raw_text, title, exam_year, exam_type") \
            .eq("id", paper_id).eq("extraction_status", "success").execute().data
    else:
        extracted = db.table("papers") \
            .select("id, subject_id, raw_text, title, exam_year, exam_type") \
            .eq("extraction_status", "success").execute().data
        parsed_ids = {r["paper_id"] for r in db.table("questions").select("paper_id").execute().data}
        papers = [p for p in extracted if p["id"] not in parsed_ids]

    log.info(f"[ParseJob] {len(papers)} papers to parse")
    total_questions = 0
    success = 0
    failed = 0

    for paper in papers:
        pid = paper["id"]
        raw_text = paper.get("raw_text") or ""
        if not raw_text.strip():
            failed += 1
            continue
        try:
            result = _parser.parse(raw_text=raw_text, paper_id=pid, subject_id=paper.get("subject_id"))
            store_result = store_parse_result(result)
            total_questions += store_result["inserted"]
            success += 1
            log.info(f"[ParseJob] OK: {paper.get('title', pid)} q={result.total_questions} stored={store_result['inserted']}")
        except Exception as e:
            failed += 1
            log.error(f"[ParseJob] FAIL: {pid} — {e}")

    return {"papers_processed": len(papers), "papers_success": success,
            "papers_failed": failed, "total_questions_stored": total_questions}
