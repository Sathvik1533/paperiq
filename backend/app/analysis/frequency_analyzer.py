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

    def question_frequency(self, separate_mark_types: bool = True) -> list[dict]:
        """
        Groups questions by normalised-text similarity.
        When separate_mark_types is True (mandatory 60-mark rule),
        direct 10M questions and 5M subquestions are NOT mixed together.
        
        Returns list sorted by count desc.
        Each: {canonical_text, count, marks, mark_type, years[], appearances[{paper_id,year,marks,question_id,part,question_number}]}
        """
        groups: dict[str, dict] = {}

        for q in self.questions:
            text = q.get("question_text", "")
            norm = _normalise(text)
            if not norm:
                continue

            marks = q.get("marks")
            # Determine mark type: 1m, 10m_direct, 5m_sub, or other
            if marks == 1:
                mark_type = "1_mark"
            elif marks == 10:
                mark_type = "10_marks_direct"
            elif marks == 5:
                mark_type = "5_marks_sub"
            else:
                mark_type = f"{marks}_marks" if marks else "unspecified"

            # In 60-mark evaluation, group key includes mark_type so 10M direct
            # and 5M subquestions are NEVER conflated or mixed.
            group_key = f"{norm}::{mark_type}" if separate_mark_types else norm

            if group_key not in groups:
                groups[group_key] = {
                    "canonical_text": text,
                    "count": 0,
                    "marks": marks,
                    "mark_type": mark_type,
                    "years": [],
                    "appearances": [],
                    "source_papers": [],
                }
            entry = groups[group_key]
            entry["count"] += 1
            year = q.get("exam_year")
            if year and year not in entry["years"]:
                entry["years"].append(year)
            
            paper_id = q.get("paper_id")
            part = q.get("part") or q.get("section") or ("Part A" if marks == 1 else "Part B")
            q_num = str(q.get("question_number") or "").strip()
            p_title = q.get("paper_title") or q.get("title") or f"Paper {paper_id}"
            
            appearance_info = {
                "paper_id": paper_id,
                "paper_title": p_title,
                "year": year,
                "marks": marks,
                "mark_type": mark_type,
                "question_id": q.get("id"),
                "part": part,
                "question_number": q_num,
                "source_reference": f"{p_title} — {part} Q{q_num} ({marks}M)" if q_num else f"{p_title} — {part} ({marks}M)",
            }
            entry["appearances"].append(appearance_info)
            entry["source_papers"].append(appearance_info)

        result = sorted(groups.values(), key=lambda x: x["count"], reverse=True)
        return result

    def question_frequency_by_mark_type(self) -> dict[str, list[dict]]:
        """
        Returns segregated frequency distributions for:
        - 1-mark questions (Part A)
        - direct 10-mark questions (Part B)
        - 5-mark subquestions (Part B)
        """
        all_freq = self.question_frequency(separate_mark_types=True)
        return {
            "one_mark": [q for q in all_freq if q["mark_type"] == "1_mark"],
            "direct_10m": [q for q in all_freq if q["mark_type"] == "10_marks_direct"],
            "subquestion_5m": [q for q in all_freq if q["mark_type"] == "5_marks_sub"],
        }

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
