"""
Prediction Engine — scores topics and predicts high-probability exam questions.

Evidence rule: NEVER predict a question that appeared only once.
Every prediction must carry paper_id[] + question_id[] evidence.
"""
from typing import Optional
from app.logger import get_logger

log = get_logger(__name__)

_CURRENT_YEAR_DEFAULT = 2025


def _recency_weight(years: list[int], current_year: int) -> float:
    """Higher weight if topic appeared in the last 2 years."""
    if not years:
        return 0.0
    recent = [y for y in years if current_year - y <= 2]
    if len(recent) >= 2:
        return 1.0
    if len(recent) == 1:
        return 0.6
    # appeared but not recently
    return 0.2


def _marks_weight(topic: str, questions: list[dict]) -> float:
    """Higher weight for topics that appear in high-mark questions (10M+)."""
    topic_lower = topic.lower()
    total = 0
    high_mark = 0
    for q in questions:
        tags = [t.lower() for t in (q.get("topic_tags") or [])]
        if topic_lower in tags:
            total += 1
            if (q.get("marks") or 0) >= 10:
                high_mark += 1
    if total == 0:
        return 0.5
    return high_mark / total


class PredictionEngine:
    def __init__(self, questions: list[dict]):
        self.questions = questions

    def score_topic(
        self,
        topic: str,
        freq_data: dict,
        current_year: int = _CURRENT_YEAR_DEFAULT,
    ) -> float:
        """
        Score = (frequency/max_freq)*0.5 + recency_weight*0.3 + marks_weight*0.2
        Returns float in [0, 1].
        freq_data: single entry from FrequencyAnalyzer.topic_frequency()
        """
        # We need max_freq from the caller; accept it inside freq_data or default to count
        count = freq_data.get("count", 0)
        max_freq = freq_data.get("_max_freq", count) or 1
        freq_score = count / max_freq

        recency = _recency_weight(freq_data.get("years", []), current_year)
        marks = _marks_weight(topic, self.questions)

        score = freq_score * 0.5 + recency * 0.3 + marks * 0.2
        return round(min(score, 1.0), 4)

    def high_probability_topics(
        self,
        freq_data: list[dict],
        top_n: int = 10,
        current_year: int = _CURRENT_YEAR_DEFAULT,
    ) -> list[dict]:
        """
        Returns top_n topics sorted by probability.
        Each: {topic, unit, probability, reason, evidence_papers[], confidence}
        Strips any topic with empty evidence.
        """
        if not freq_data:
            return []

        max_freq = max((f.get("count", 0) for f in freq_data), default=1) or 1

        scored = []
        for entry in freq_data:
            # Evidence enforcement
            evidence = entry.get("paper_ids", [])
            if not evidence:
                log.debug(f"Skipping topic {entry.get('topic')} — no evidence")
                continue

            enriched = {**entry, "_max_freq": max_freq}
            prob = self.score_topic(entry["topic"], enriched, current_year)

            if prob >= 0.75:
                confidence = "very_high"
            elif prob >= 0.5:
                confidence = "high"
            else:
                confidence = "medium"

            years = entry.get("years", [])
            recent = [y for y in years if current_year - y <= 2]
            reasons = []
            if entry["count"] >= 3:
                reasons.append(f"appeared {entry['count']} times across papers")
            if recent:
                reasons.append(f"seen in recent years: {sorted(recent)}")
            reason = "; ".join(reasons) if reasons else f"frequency count: {entry['count']}"

            scored.append({
                "topic": entry["topic"],
                "unit": entry.get("unit"),
                "probability": prob,
                "reason": reason,
                "evidence_papers": evidence,
                "confidence": confidence,
            })

        scored.sort(key=lambda x: x["probability"], reverse=True)
        return scored[:top_n]

    def predict_questions(
        self,
        top_n: int = 10,
        current_year: int = _CURRENT_YEAR_DEFAULT,
    ) -> list[dict]:
        """
        Predicts specific questions likely to appear in the next exam.

        RULE: only predict if question appeared 2+ times. Never predict without evidence.
        Each: {question_text, unit, marks, confidence, evidence[{paper_id,year,question_id}]}
        """
        from app.analysis.frequency_analyzer import FrequencyAnalyzer

        freq = FrequencyAnalyzer(self.questions)
        q_freq = freq.question_frequency()

        predictions = []
        for group in q_freq:
            appearances = group.get("appearances", [])
            # Evidence rule: skip single-occurrence questions
            if group["count"] < 2:
                continue

            evidence = [
                {
                    "paper_id": a["paper_id"],
                    "year": a["year"],
                    "question_id": a["question_id"],
                }
                for a in appearances
                if a.get("paper_id")
            ]
            if not evidence:
                continue

            years = [a["year"] for a in appearances if a.get("year")]
            recency = _recency_weight(years, current_year)
            marks = max((a.get("marks") or 0) for a in appearances)

            # Simple score: count + recency
            score = group["count"] * 0.4 + recency * 0.6
            if score >= 0.8:
                confidence = "very_high"
            elif score >= 0.5:
                confidence = "high"
            else:
                confidence = "medium"

            # Find unit from one of the source questions
            unit = None
            for q in self.questions:
                if q.get("id") in [a["question_id"] for a in appearances]:
                    unit = q.get("unit_number")
                    break

            predictions.append({
                "question_text": group["canonical_text"],
                "unit": unit,
                "marks": marks or None,
                "confidence": confidence,
                "evidence": evidence,
            })

        predictions.sort(key=lambda x: len(x["evidence"]), reverse=True)
        return predictions[:top_n]
