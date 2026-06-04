"""
Frequency Analyzer — computes topic frequency, question repetition, and unit distribution
from a regulation-filtered list of question dicts.
"""
import re
from collections import defaultdict
from typing import Optional
from app.analysis.unit_classifier import UNIT_NAMES
from app.logger import get_logger

log = get_logger(__name__)

# Stop words to ignore when normalising question text for deduplication
_STOP = {"a", "an", "the", "of", "in", "on", "with", "and", "or", "is", "are",
         "for", "to", "what", "find", "explain", "define", "describe", "prove",
         "show", "that", "it", "its", "given", "following", "write", "state",
         "discuss", "solve", "determine", "compute"}


def _normalise(text: str) -> str:
    """Lower-case, strip punctuation, remove stop words, sort tokens for fuzzy dedup."""
    text = re.sub(r"[^\w\s]", " ", text.lower())
    tokens = [t for t in text.split() if t not in _STOP and len(t) > 2]
    return " ".join(sorted(tokens))


class FrequencyAnalyzer:
    """
    Analyzes a list of question dicts (already regulation-filtered from DB).

    Expected question dict shape:
        id, paper_id, subject_id, question_text, marks, exam_year,
        unit_number, topic_tags (list[str])
    """

    def __init__(self, questions: list[dict]):
        self.questions = questions

    # ------------------------------------------------------------------
    # Topic frequency
    # ------------------------------------------------------------------

    def topic_frequency(self) -> list[dict]:
        """
        Returns list sorted by count desc.
        Each: {topic, unit, count, years[], paper_ids[], question_ids[]}
        """
        topic_map: dict[str, dict] = {}

        for q in self.questions:
            tags = q.get("topic_tags") or []
            unit = q.get("unit_number")
            year = q.get("exam_year")
            paper_id = q.get("paper_id")
            qid = q.get("id")

            for topic in tags:
                if topic not in topic_map:
                    topic_map[topic] = {
                        "topic": topic,
                        "unit": unit,
                        "count": 0,
                        "years": [],
                        "paper_ids": [],
                        "question_ids": [],
                    }
                entry = topic_map[topic]
                entry["count"] += 1
                if year and year not in entry["years"]:
                    entry["years"].append(year)
                if paper_id and paper_id not in entry["paper_ids"]:
                    entry["paper_ids"].append(paper_id)
                if qid and qid not in entry["question_ids"]:
                    entry["question_ids"].append(qid)

        result = sorted(topic_map.values(), key=lambda x: x["count"], reverse=True)
        return result

    # ------------------------------------------------------------------
    # Question frequency (repeated questions)
    # ------------------------------------------------------------------

    def question_frequency(self) -> list[dict]:
        """
        Groups questions by normalised-text similarity.
        Returns list sorted by count desc.
        Each: {canonical_text, count, years[], appearances[{paper_id,year,marks,question_id}]}
        """
        groups: dict[str, dict] = {}

        for q in self.questions:
            text = q.get("question_text", "")
            norm = _normalise(text)
            if not norm:
                continue

            if norm not in groups:
                groups[norm] = {
                    "canonical_text": text,
                    "count": 0,
                    "years": [],
                    "appearances": [],
                }
            entry = groups[norm]
            entry["count"] += 1
            year = q.get("exam_year")
            if year and year not in entry["years"]:
                entry["years"].append(year)
            entry["appearances"].append({
                "paper_id": q.get("paper_id"),
                "year": year,
                "marks": q.get("marks"),
                "question_id": q.get("id"),
            })

        result = sorted(groups.values(), key=lambda x: x["count"], reverse=True)
        return result

    # ------------------------------------------------------------------
    # Unit distribution
    # ------------------------------------------------------------------

    def unit_distribution(self) -> list[dict]:
        """
        Returns per-unit stats.
        Each: {unit_number, unit_name, question_count, marks_total, pct}
        """
        unit_counts: dict[int, int] = defaultdict(int)
        unit_marks: dict[int, int] = defaultdict(int)
        total = 0

        for q in self.questions:
            unit = q.get("unit_number")
            if unit is None:
                continue
            marks = q.get("marks") or 0
            unit_counts[unit] += 1
            unit_marks[unit] += marks
            total += 1

        result = []
        for unit in sorted(unit_counts.keys()):
            count = unit_counts[unit]
            result.append({
                "unit_number": unit,
                "unit_name": UNIT_NAMES.get(unit, f"Unit {unit}"),
                "question_count": count,
                "marks_total": unit_marks[unit],
                "pct": round(count / total * 100, 1) if total else 0.0,
            })
        return result
