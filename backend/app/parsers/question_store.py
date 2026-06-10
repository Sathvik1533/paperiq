"""
Stores parsed questions into the database.
Gap #4 fix: writes regulation, college_id, branch_id, semester, exam_year
directly on insert from the parent paper — no backfill dependency.
"""
from app.parsers.models import ParseResult
from app.database import get_admin_db
from app.logger import get_logger

log = get_logger(__name__)


def _fetch_paper_meta(db, paper_id: str) -> dict:
    """Fetch regulation + academic context from the parent paper."""
    try:
        result = db.table("papers").select(
            "regulation, college_id, branch_id, semester, exam_year"
        ).eq("id", paper_id).single().execute()
        return result.data or {}
    except Exception:
        return {}


def store_parse_result(result: ParseResult) -> dict:
    """
    Upsert all questions from a ParseResult into the DB.
    Writes regulation, college_id, branch_id, semester, exam_year from
    the parent paper on every insert — no backfill dependency.
    Returns: {inserted, skipped_duplicate, failed}
    """
    db = get_admin_db()

    # Fetch parent paper metadata once for the whole batch
    paper_meta = _fetch_paper_meta(db, result.paper_id)
    regulation  = paper_meta.get("regulation")
    college_id  = paper_meta.get("college_id")
    branch_id   = paper_meta.get("branch_id")
    semester    = paper_meta.get("semester")
    exam_year   = paper_meta.get("exam_year")

    inserted = 0
    skipped  = 0
    failed   = 0

    # Batch duplicate check: fetch all existing hashes for this paper in one query
    all_hashes = [q.question_hash for q in result.questions if q.question_hash]
    existing_hashes: set[str] = set()
    if all_hashes:
        existing = (
            db.table("questions")
            .select("question_hash")
            .eq("paper_id", result.paper_id)
            .in_("question_hash", all_hashes)
            .execute()
        )
        if existing.data:
            existing_hashes = {row["question_hash"] for row in existing.data}

    for q in result.questions:
        try:
            if q.question_hash and q.question_hash in existing_hashes:
                skipped += 1
                continue

            db.table("questions").insert({
                "paper_id"        : q.paper_id,
                "subject_id"      : q.subject_id,
                "question_number" : q.question_number,
                "part"            : q.section,
                "question_text"   : q.question_text,
                "question_type"   : q.question_type,
                "marks"           : q.marks,
                "co"              : q.co,
                "bloom_level"     : q.bloom_level,
                "is_or_question"  : q.is_or_question,
                "normalized_text" : q.normalized_text,
                "question_hash"   : q.question_hash,
                "topic_tags"      : [],
                # Gap #4: written from parent paper, not deferred to backfill
                "regulation"      : regulation,
                "college_id"      : college_id,
                "branch_id"       : branch_id,
                "semester"        : semester,
                "exam_year"       : exam_year,
            }).execute()
            inserted += 1

        except Exception as e:
            failed += 1
            log.error(f"[QuestionStore] Failed to store question: {e}")

    log.info(
        f"[QuestionStore] paper={result.paper_id} reg={regulation} "
        f"inserted={inserted} skipped={skipped} failed={failed}"
    )
    return {"inserted": inserted, "skipped_duplicate": skipped, "failed": failed}


def get_questions_for_paper(paper_id: str) -> list[dict]:
    db = get_admin_db()
    return (
        db.table("questions")
        .select("*")
        .eq("paper_id", paper_id)
        .order("question_number")
        .execute()
        .data
    )


def get_questions_for_subject(
    subject_id: str,
    question_type: str | None = None,
    marks: int | None = None,
    section: str | None = None,
    regulation: str | None = None,
) -> list[dict]:
    db = get_admin_db()
    q = db.table("questions").select(
        "id, paper_id, question_number, part, question_text, "
        "question_type, marks, co, is_or_question, question_hash, "
        "regulation, unit_number, topic_tags"
    ).eq("subject_id", subject_id)

    if regulation:
        q = q.eq("regulation", regulation)
    if question_type:
        q = q.eq("question_type", question_type)
    if marks:
        q = q.eq("marks", marks)
    if section:
        q = q.eq("part", section)

    return q.execute().data
