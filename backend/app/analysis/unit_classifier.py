"""
Unit Classifier — maps CO tags and keyword patterns to unit numbers (1-5).
Covers Discrete Mathematics syllabus for R18/R22/R24.
"""
import re
from typing import Optional
from app.logger import get_logger

log = get_logger(__name__)

# CO → unit mapping
_CO_TO_UNIT: dict[str, int] = {
    "CO1": 1, "CO2": 2, "CO3": 3, "CO4": 4, "CO5": 5,
    "co1": 1, "co2": 2, "co3": 3, "co4": 4, "co5": 5,
}

# Keyword → unit number (lower-cased keywords)
_KEYWORD_UNIT: list[tuple[list[str], int]] = [
    (["logic", "proposition", "tautology", "contradiction", "pcnf", "pdnf",
      "logical equivalence", "rules of inference", "indirect proof",
      "converse", "contrapositive", "predicate", "quantifier"], 1),
    (["hasse", "lattice", "partial order", "equivalence relation",
      "binary relation", "function", "monoid", "group", "poset",
      "reflexive", "symmetric", "transitive", "closure",
      "relation on set", "relation on a set"], 2),
    (["combination", "permutation", "pigeonhole", "multinomial",
      "inclusion-exclusion", "binomial", "counting", "committee",
      "selection", "arrangement"], 3),
    (["recurrence", "generating function", "characteristic root",
      "homogeneous recurrence", "fibonacci", "linear recurrence"], 4),
    (["graph", "tree", "spanning", "chromatic", "planar", "euler",
      "hamiltonian", "kruskal", "prim", "bfs", "dfs", "isomorphism",
      "vertex", "edge", "degree sequence", "bipartite", "connected"], 5),
]

# Unit names
UNIT_NAMES: dict[int, str] = {
    1: "Mathematical Logic",
    2: "Relations & Lattices",
    3: "Combinatorics",
    4: "Recurrence Relations",
    5: "Graph Theory",
}


def classify_unit(question_text: str, co: Optional[str] = None) -> tuple[Optional[int], float]:
    """
    Returns (unit_number, confidence).
    confidence: 1.0 for CO match, 0.75 for keyword match, None/0.0 for unknown.
    """
    # CO tag is highest confidence
    if co:
        co_clean = co.strip().upper()
        # handle "CO1", "CO 1", "C01" etc.
        m = re.search(r"CO\s*(\d)", co_clean)
        if m:
            unit = int(m.group(1))
            if 1 <= unit <= 5:
                return unit, 1.0

    # Keyword fallback
    text_lower = question_text.lower()
    best_unit: Optional[int] = None
    best_hits = 0
    for keywords, unit in _KEYWORD_UNIT:
        hits = sum(1 for kw in keywords if kw in text_lower)
        if hits > best_hits:
            best_hits = hits
            best_unit = unit

    if best_unit is not None and best_hits > 0:
        conf = min(0.75, 0.4 + 0.1 * best_hits)
        return best_unit, conf

    return None, 0.0


# ---------------------------------------------------------------------------
# Backfill helper — updates questions.unit_number and questions.topic_tags
# ---------------------------------------------------------------------------

def backfill_questions(subject_id: str, regulation: str) -> dict:
    """
    Fetch all questions for subject+regulation, classify unit & topics,
    then bulk-update the DB rows.
    Returns {updated: N, skipped: N}.
    """
    from app.database import get_admin_db
    from app.analysis.topic_classifier import classify_topics

    db = get_admin_db()
    rows = (
        db.table("questions")
        .select("id, question_text, co, unit_number, topic_tags")
        .eq("subject_id", subject_id)
        .eq("regulation", regulation)
        .execute()
    ).data or []

    updated = 0
    skipped = 0
    for row in rows:
        unit, conf = classify_unit(row.get("question_text", ""), row.get("co"))
        topics = classify_topics(row.get("question_text", ""), unit)
        if unit == row.get("unit_number") and topics == (row.get("topic_tags") or []):
            skipped += 1
            continue
        db.table("questions").update(
            {"unit_number": unit, "topic_tags": topics}
        ).eq("id", row["id"]).execute()
        updated += 1

    log.info(f"backfill_questions: subject={subject_id} reg={regulation} updated={updated} skipped={skipped}")
    return {"updated": updated, "skipped": skipped}
