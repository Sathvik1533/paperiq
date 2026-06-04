"""
Coverage Analyzer — Gap #6.

Maps parsed questions → syllabus topics to compute evidence-based
coverage percentages per unit and overall.

Evidence rule: coverage is only counted when a question's topic_tags[]
contains a string that fuzzy-matches a syllabus_topics.topic_name.
No syllabus = no coverage (returns empty, not 100%).
"""
from typing import Optional
from rapidfuzz import fuzz
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

# Minimum fuzzy match score to consider a question covering a topic (0-100)
MATCH_THRESHOLD = 72


def _fuzzy_match(question_tags: list[str], syllabus_topic: str) -> tuple[bool, float]:
    """
    Returns (matched, best_score).
    Checks each tag against the syllabus topic name using token_set_ratio.
    """
    topic_lower = syllabus_topic.lower()
    best = 0.0
    for tag in question_tags:
        score = fuzz.token_set_ratio(tag.lower(), topic_lower)
        if score > best:
            best = score
    return best >= MATCH_THRESHOLD, round(best, 1)


def compute_coverage(
    subject_id: str,
    regulation: str,
    syllabus_id: Optional[str] = None,
    branch_id: Optional[str] = None,
) -> dict:
    """
    Compute syllabus coverage for a subject+regulation.

    Returns:
    {
      syllabus_id,
      overall_coverage_pct,
      total_topics,
      covered_topics,
      uncovered_topics,
      unit_coverage: [
        {
          unit_number, unit_name,
          coverage_pct, covered_topics[], uncovered_topics[],
          question_count
        }
      ],
      topic_mapping: [
        {
          syllabus_topic, unit_number, unit_name,
          covered: bool, match_score, matched_questions[]
        }
      ]
    }
    """
    db = get_db()

    # 1. Load syllabus topics for this subject+regulation
    if syllabus_id:
        q = db.table("syllabus_topics").select("*").eq("syllabus_id", syllabus_id)
    else:
        q = (
            db.table("syllabus_topics")
            .select("*")
            .eq("subject_id", subject_id)
            .eq("regulation", regulation)
        )
    syl_result = q.order("unit_number").execute()
    syllabus_topics = syl_result.data or []

    if not syllabus_topics:
        log.warning(
            f"[CoverageAnalyzer] No syllabus topics for "
            f"subject={subject_id} reg={regulation} — returning empty coverage"
        )
        return {
            "syllabus_id": syllabus_id,
            "overall_coverage_pct": 0.0,
            "total_topics": 0,
            "covered_topics": 0,
            "uncovered_topics": 0,
            "warning": "No syllabus uploaded for this regulation. Upload a syllabus to see coverage.",
            "unit_coverage": [],
            "topic_mapping": [],
        }

    # 2. Load all questions for this subject+regulation (with topic_tags)
    q_query = (
        db.table("questions")
        .select("id, question_text, topic_tags, unit_number, marks, question_type")
        .eq("subject_id", subject_id)
        .eq("regulation", regulation)
    )
    if branch_id:
        q_query = q_query.eq("branch_id", branch_id)
    questions = q_query.execute().data or []

    log.info(
        f"[CoverageAnalyzer] {len(syllabus_topics)} topics, "
        f"{len(questions)} questions for subject={subject_id} reg={regulation}"
    )

    # 3. Build topic_mapping: for each syllabus topic, find matching questions
    topic_mapping = []
    covered_count = 0

    for st in syllabus_topics:
        topic_name = st["topic_name"]
        unit_number = st.get("unit_number")
        unit_name = st.get("unit_name", "")

        matched_questions = []
        best_score = 0.0

        for q in questions:
            tags = q.get("topic_tags") or []
            matched, score = _fuzzy_match(tags, topic_name)
            if matched:
                matched_questions.append({
                    "question_id"  : q["id"],
                    "question_text": q["question_text"][:120],
                    "marks"        : q.get("marks"),
                    "match_score"  : score,
                })
                best_score = max(best_score, score)

        covered = len(matched_questions) > 0
        if covered:
            covered_count += 1

        topic_mapping.append({
            "syllabus_topic"   : topic_name,
            "unit_number"      : unit_number,
            "unit_name"        : unit_name,
            "covered"          : covered,
            "match_score"      : best_score,
            "matched_questions": matched_questions,
            "question_count"   : len(matched_questions),
        })

    # 4. Aggregate unit-level coverage
    unit_map: dict[int, dict] = {}
    for tm in topic_mapping:
        u = tm["unit_number"] or 0
        if u not in unit_map:
            unit_map[u] = {
                "unit_number"     : u,
                "unit_name"       : tm["unit_name"],
                "covered_topics"  : [],
                "uncovered_topics": [],
                "question_count"  : 0,
            }
        if tm["covered"]:
            unit_map[u]["covered_topics"].append(tm["syllabus_topic"])
            unit_map[u]["question_count"] += tm["question_count"]
        else:
            unit_map[u]["uncovered_topics"].append(tm["syllabus_topic"])

    unit_coverage = []
    for u_data in sorted(unit_map.values(), key=lambda x: x["unit_number"]):
        total = len(u_data["covered_topics"]) + len(u_data["uncovered_topics"])
        pct = (len(u_data["covered_topics"]) / total * 100) if total > 0 else 0.0
        unit_coverage.append({
            "unit_number"     : u_data["unit_number"],
            "unit_name"       : u_data["unit_name"],
            "coverage_pct"    : round(pct, 1),
            "covered_topics"  : u_data["covered_topics"],
            "uncovered_topics": u_data["uncovered_topics"],
            "question_count"  : u_data["question_count"],
        })

    total_topics = len(syllabus_topics)
    overall_pct = (covered_count / total_topics * 100) if total_topics > 0 else 0.0

    # Resolve syllabus_id from first topic if not given
    if not syllabus_id and syllabus_topics:
        syllabus_id = syllabus_topics[0].get("syllabus_id")

    return {
        "syllabus_id"         : syllabus_id,
        "overall_coverage_pct": round(overall_pct, 1),
        "total_topics"        : total_topics,
        "covered_topics"      : covered_count,
        "uncovered_topics"    : total_topics - covered_count,
        "unit_coverage"       : unit_coverage,
        "topic_mapping"       : topic_mapping,
    }
