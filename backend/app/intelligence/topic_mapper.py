"""
Topic Mapper — Gap #7.

Maps questions to syllabus topics and populates the question_topics
junction table with confidence scores.

Pipeline position:
  questions.topic_tags[] → fuzzy match → syllabus_topics → question_topics

Called after:
  1. backfill_questions() sets topic_tags on questions
  2. Syllabus has been uploaded and syllabus_topics are populated
"""
from typing import Optional
from rapidfuzz import fuzz
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

# Confidence thresholds
HIGH_CONFIDENCE   = 90   # exact or near-exact match
MEDIUM_CONFIDENCE = 72   # token-level match


def _compute_confidence(tag: str, topic_name: str) -> float:
    """
    Compute a 0.0–1.0 confidence score between a question tag and a syllabus topic.
    Uses token_set_ratio (handles word order) scaled to [0,1].
    """
    score = fuzz.token_set_ratio(tag.lower(), topic_name.lower())
    return round(score / 100.0, 3)


def map_questions_to_topics(
    subject_id: str,
    regulation: str,
    branch_id: Optional[str] = None,
    syllabus_id: Optional[str] = None,
) -> dict:
    """
    For every question in subject+regulation:
      - Match topic_tags[] against syllabus_topics
      - Insert best matches into question_topics with confidence score
      - Skip questions already mapped (idempotent)

    Returns summary: {mapped, skipped_already_mapped, no_syllabus_match, failed}
    """
    db = get_db()

    # 1. Load syllabus topics
    if syllabus_id:
        st_q = db.table("syllabus_topics").select("id, topic_name, unit_number").eq("syllabus_id", syllabus_id)
    else:
        st_q = (
            db.table("syllabus_topics")
            .select("id, topic_name, unit_number")
            .eq("subject_id", subject_id)
            .eq("regulation", regulation)
        )
    syllabus_topics = st_q.execute().data or []

    if not syllabus_topics:
        log.warning(f"[TopicMapper] No syllabus topics for subject={subject_id} reg={regulation}")
        return {"mapped": 0, "skipped_already_mapped": 0, "no_syllabus_match": 0, "failed": 0,
                "warning": "No syllabus uploaded — upload a syllabus first"}

    # 2. Load questions
    q_query = (
        db.table("questions")
        .select("id, topic_tags, unit_number")
        .eq("subject_id", subject_id)
        .eq("regulation", regulation)
    )
    if branch_id:
        q_query = q_query.eq("branch_id", branch_id)
    questions = q_query.execute().data or []

    log.info(
        f"[TopicMapper] Mapping {len(questions)} questions → "
        f"{len(syllabus_topics)} syllabus topics "
        f"(subject={subject_id}, reg={regulation})"
    )

    # 3. Load already-mapped question_ids to avoid re-inserting
    existing_mappings: set[str] = set()
    try:
        existing = db.table("question_topics").select("question_id").execute().data or []
        existing_mappings = {row["question_id"] for row in existing}
    except Exception as e:
        log.warning(f"[TopicMapper] Could not fetch existing mappings: {e}")

    mapped               = 0
    skipped_already      = 0
    no_match             = 0
    failed               = 0

    for question in questions:
        qid  = question["id"]
        tags = question.get("topic_tags") or []

        if qid in existing_mappings:
            skipped_already += 1
            continue

        if not tags:
            no_match += 1
            continue

        # Find best-matching syllabus topic for each tag
        best_matches: dict[str, float] = {}  # topic_id → confidence

        for tag in tags:
            for st in syllabus_topics:
                conf = _compute_confidence(tag, st["topic_name"])
                if conf >= (MEDIUM_CONFIDENCE / 100.0):
                    topic_id = st["id"]
                    if topic_id not in best_matches or conf > best_matches[topic_id]:
                        best_matches[topic_id] = conf

        if not best_matches:
            no_match += 1
            continue

        # Insert into question_topics (top 3 matches max per question)
        top_matches = sorted(best_matches.items(), key=lambda x: x[1], reverse=True)[:3]
        any_inserted = False

        for topic_id, confidence in top_matches:
            try:
                db.table("question_topics").upsert({
                    "question_id": qid,
                    "topic_id"   : topic_id,
                    "confidence" : confidence,
                }).execute()
                any_inserted = True
            except Exception as e:
                log.warning(f"[TopicMapper] upsert failed q={qid} t={topic_id}: {e}")
                failed += 1

        if any_inserted:
            mapped += 1

    log.info(
        f"[TopicMapper] Done — mapped={mapped} skipped={skipped_already} "
        f"no_match={no_match} failed={failed}"
    )
    return {
        "mapped"               : mapped,
        "skipped_already_mapped": skipped_already,
        "no_syllabus_match"    : no_match,
        "failed"               : failed,
    }
