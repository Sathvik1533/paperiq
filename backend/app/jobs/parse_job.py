"""
Parse Job — Fix C: auto-triggers topic mapping after parsing.

Pipeline position:
  raw_text (M2) → ParsedQuestions (M3) → topic_mapper (auto) → Topics mapped
"""
from app.database import get_db
from app.parsers.question_parser import QuestionParser
from app.parsers.question_store import store_parse_result
from app.logger import get_logger

log = get_logger(__name__)
_parser = QuestionParser()


async def run_parse_job(paper_id: str | None = None) -> dict:
    """
    Parse questions for one paper or all unprocessed papers.
    After parsing, automatically runs topic mapping for each affected subject+regulation.
    """
    db = get_db()

    if paper_id:
        papers = (
            db.table("papers")
            .select("id, subject_id, raw_text, title, exam_year, exam_type, regulation")
            .eq("id", paper_id)
            .eq("extraction_status", "success")
            .execute().data
        )
    else:
        extracted = (
            db.table("papers")
            .select("id, subject_id, raw_text, title, exam_year, exam_type, regulation")
            .eq("extraction_status", "success")
            .execute().data
        )
        parsed_ids = {
            row["paper_id"]
            for row in db.table("questions").select("paper_id").execute().data
        }
        papers = [p for p in extracted if p["id"] not in parsed_ids]

    log.info(f"[ParseJob] {len(papers)} papers to parse")
    total_questions = 0
    success = 0
    failed = 0

    # Track which subject+regulation pairs got new questions — for auto topic mapping
    affected_pairs: set[tuple[str, str]] = set()

    for paper in papers:
        pid       = paper["id"]
        raw_text  = paper.get("raw_text") or ""
        subject   = paper.get("subject_id")
        regulation = paper.get("regulation")

        if not raw_text.strip():
            log.warning(f"[ParseJob] Skipping {pid} — empty raw_text")
            failed += 1
            continue

        try:
            result = _parser.parse(raw_text=raw_text, paper_id=pid, subject_id=subject)
            store_result = store_parse_result(result)
            total_questions += store_result["inserted"]
            success += 1
            log.info(
                f"[ParseJob] OK: {paper.get('title', pid)} "
                f"q={result.total_questions} stored={store_result['inserted']}"
            )
            if subject and regulation and store_result["inserted"] > 0:
                affected_pairs.add((subject, regulation))
        except Exception as e:
            failed += 1
            log.error(f"[ParseJob] FAIL: {pid} — {e}")

    # Fix C: auto-trigger topic mapping for each affected subject+regulation
    mapped_total = 0
    if affected_pairs:
        log.info(f"[ParseJob] Auto-mapping topics for {len(affected_pairs)} subject+regulation pairs")
        from app.intelligence.topic_mapper import map_questions_to_topics
        for subject_id, regulation in affected_pairs:
            try:
                mapping_result = map_questions_to_topics(
                    subject_id=subject_id,
                    regulation=regulation,
                )
                mapped_total += mapping_result.get("mapped", 0)
                log.info(
                    f"[ParseJob] Topic mapping: subject={subject_id} reg={regulation} "
                    f"mapped={mapping_result.get('mapped', 0)}"
                )
            except Exception as e:
                log.warning(f"[ParseJob] Topic mapping failed (non-fatal): subject={subject_id} {e}")

    return {
        "papers_processed": len(papers),
        "papers_success": success,
        "papers_failed": failed,
        "total_questions_stored": total_questions,
        "topics_mapped": mapped_total,
    }
