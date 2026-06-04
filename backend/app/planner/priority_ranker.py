"""
Priority Ranker — classifies topics into must_study / high / medium / low
based on how frequently they appeared across real exam papers.

Architecture rule: always called with an analysis_report already scoped
to a specific regulation + syllabus_id. Never mixes regulations.
"""
from app.logger import get_logger

log = get_logger(__name__)

# Thresholds by preparation level
_THRESHOLDS = {
    "beginner": {"must": 3, "high": 2, "medium": 1},
    "intermediate": {"must": 4, "high": 3, "medium": 2},
    "advanced": {"must": 5, "high": 4, "medium": 3},
}


class PriorityRanker:
    def rank_topics(self, analysis_report: dict, preparation_level: str = "intermediate") -> dict:
        """
        Rank topics from an analysis_report into priority buckets.

        Returns:
            {
                must_study: [{topic, unit, reason, frequency, marks_weight}],
                high: [...],
                medium: [...],
                low: [...]
            }
        """
        level = preparation_level.lower()
        if level not in _THRESHOLDS:
            log.warning(f"Unknown preparation_level '{level}', defaulting to intermediate")
            level = "intermediate"

        thresholds = _THRESHOLDS[level]

        topic_freq = analysis_report.get("topic_frequency", [])
        high_prob = analysis_report.get("high_probability_topics", [])
        unit_dist = analysis_report.get("unit_distribution", {})

        # Build a lookup: topic -> high_prob entry for marks_weight
        hp_lookup = {}
        for hp in high_prob:
            name = hp.get("topic") or hp.get("name", "")
            if name:
                hp_lookup[name] = hp

        # Calculate total marks for weight computation
        total_marks = sum(
            unit_data.get("total_marks", 0)
            for unit_data in (unit_dist.values() if isinstance(unit_dist, dict) else [])
        ) or 1

        must_study, high, medium, low = [], [], [], []

        for entry in topic_freq:
            topic = entry.get("topic") or entry.get("name", "")
            if not topic:
                continue

            # Evidence enforcement: skip topics with no paper_ids
            if not entry.get("paper_ids"):
                continue

            frequency = entry.get("frequency", len(entry.get("paper_ids", [])))
            unit = entry.get("unit_number") or entry.get("unit")
            paper_count = len(set(entry.get("paper_ids", [])))

            hp_data = hp_lookup.get(topic, {})
            marks_weight = hp_data.get("marks_weight", 0)
            if not marks_weight:
                # Estimate from unit distribution
                unit_key = str(unit) if unit else "1"
                unit_data = unit_dist.get(unit_key, {}) if isinstance(unit_dist, dict) else {}
                unit_marks = unit_data.get("total_marks", 0)
                marks_weight = round(unit_marks / total_marks * 100, 1) if total_marks else 0

            item = {
                "topic": topic,
                "unit": unit,
                "frequency": paper_count,
                "marks_weight": marks_weight,
                "reason": "",
            }

            # Classify: check "every year" appearance first
            all_years = entry.get("years", [])
            appears_every_year = entry.get("appears_every_year", False)

            if appears_every_year or paper_count >= thresholds["must"]:
                item["reason"] = (
                    "Appears every year" if appears_every_year
                    else f"Appeared in {paper_count} papers — extremely high probability"
                )
                must_study.append(item)
            elif paper_count >= thresholds["high"]:
                item["reason"] = f"Appeared in {paper_count} papers — high probability"
                high.append(item)
            elif paper_count >= thresholds["medium"]:
                item["reason"] = f"Appeared in {paper_count} papers — moderate probability"
                medium.append(item)
            else:
                item["reason"] = f"Appeared in {paper_count} paper(s) — low probability"
                low.append(item)

        # Sort each bucket by frequency desc, then marks_weight desc
        for bucket in (must_study, high, medium, low):
            bucket.sort(key=lambda x: (-x["frequency"], -x["marks_weight"]))

        log.info(
            f"Priority ranking complete: must={len(must_study)} high={len(high)} "
            f"medium={len(medium)} low={len(low)} level={level}"
        )

        return {
            "must_study": must_study,
            "high": high,
            "medium": medium,
            "low": low,
        }
