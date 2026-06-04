"""
Stores parsed questions into the database.
Handles dedup via question_hash across papers.
Maintains full traceability: paper_id -> question.
"""
from app.parsers.models import ParseResult, ParsedQuestion
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)


def store_parse_result(result: ParseResult) -> dict:
    """
    Upsert all questions from a ParseResult into the DB.
    Returns summary: {inserted, skipped_duplicate, failed}
    """
    db = get_db()
    inserted = 0
    skipped = 0
    failed = 0

    for q in result.questions:
        try:
            # Check if this exact question already exists for this paper
            existing = db.table("questions") \
                .select("id") \
                .eq("paper_id", q.paper_id) \
                .eq("question_hash", q.question_hash) \
                .execute()

            if existing.data:
                skipped += 1
                continue

            db.table("questions").insert({
                "paper_id"       : q.paper_id,
                "subject_id"     : q.subject_id,
                "question_number": q.question_number,
                "part"           : q.section,
                "question_text"  : q.question_text,
                "question_type"  : q.question_type,
                "marks"          : q.marks,
                "co"             : q.co,
                "bloom_level"    : q.bloom_level,
                "is_or_question" : q.is_or_question,
                "normalized_text": q.normalized_text,
                "question_hash"  : q.question_hash,
                # unit_number left NULL — populated in M4
                "topic_tags"     : [],
            }).execute()
            inserted += 1

        except Exception as e:
            failed += 1
            log.error(f"[QuestionStore] Failed to store question: {e}")

    log.info(
        f"[QuestionStore] paper={result.paper_id} "
        f"inserted={inserted} skipped={skipped} failed={failed}"
    )
    return {"inserted": inserted, "skipped_duplicate": skipped, "failed": failed}


def get_questions_for_paper(paper_id: str) -> list[dict]:
    db = get_db()
    result = db.table("questions") \
        .select("*") \
        .eq("paper_id", paper_id) \
        .order("question_number") \
        .execute()
    return result.data


def get_questions_for_subject(
    subject_id: str,
    question_type: str | None = None,
    marks: int | None = None,
    section: str | None = None,
) -> list[dict]:
    db = get_db()
    q = db.table("questions").select(
        "id, paper_id, question_number, part, question_text, "
        "question_type, marks, co, is_or_question, question_hash"
    ).eq("subject_id", subject_id)

    if question_type:
        q = q.eq("question_type", question_type)
    if marks:
        q = q.eq("marks", marks)
    if section:
        q = q.eq("part", section)

    return q.execute().data
