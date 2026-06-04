"""
Trend Analyzer — year-over-year topic trends and repeated question grouping.
"""
from collections import defaultdict
from app.logger import get_logger

log = get_logger(__name__)


class TrendAnalyzer:
    """
    Analyzes temporal trends in a regulation-filtered question list.

    Expected question dict shape:
        id, paper_id, question_text, marks, exam_year,
        unit_number, topic_tags (list[str]), question_type
    """

    def __init__(self, questions: list[dict]):
        self.questions = questions

    def trend_by_year(self, topic: str) -> dict[int, int]:
        """
        Returns {year: count} for the given topic name.
        """
        counts: dict[int, int] = defaultdict(int)
        topic_lower = topic.lower()
        for q in self.questions:
            tags = [t.lower() for t in (q.get("topic_tags") or [])]
            year = q.get("exam_year")
            if year and topic_lower in tags:
                counts[year] += 1
        return dict(sorted(counts.items()))

    def topic_heatmap(self) -> list[dict]:
        """
        Returns list of {topic, by_year: {2021: n, 2022: n, ...}}.
        Useful for rendering a topic × year heatmap.
        """
        # Gather all unique topics and years
        topic_years: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))
        for q in self.questions:
            tags = q.get("topic_tags") or []
            year = q.get("exam_year")
            if not year:
                continue
            for tag in tags:
                topic_years[tag][year] += 1

        result = []
        for topic, year_counts in sorted(topic_years.items()):
            result.append({
                "topic": topic,
                "by_year": dict(sorted(year_counts.items())),
            })
        return result

    def repeated_questions(self) -> dict[str, list[dict]]:
        """
        Groups repeated questions by type: definitions, proofs, numericals.
        A question is "repeated" if it appears in 2+ different years.

        Returns {definitions: [...], proofs: [...], numericals: [...]}
        Each item: {canonical_text, years[], count, question_ids[], paper_ids[]}
        """
        from app.analysis.frequency_analyzer import FrequencyAnalyzer, _normalise

        freq = FrequencyAnalyzer(self.questions)
        q_freq = freq.question_frequency()

        definitions: list[dict] = []
        proofs: list[dict] = []
        numericals: list[dict] = []

        for group in q_freq:
            # Only include questions that appeared in 2+ years
            if len(set(a["year"] for a in group["appearances"] if a["year"])) < 2:
                continue

            # Determine question type from appearances
            qids = [a["question_id"] for a in group["appearances"] if a["question_id"]]
            paper_ids = list({a["paper_id"] for a in group["appearances"] if a["paper_id"]})
            years = sorted(set(a["year"] for a in group["appearances"] if a["year"]))

            entry = {
                "canonical_text": group["canonical_text"],
                "years": years,
                "count": group["count"],
                "question_ids": qids,
                "paper_ids": paper_ids,
            }

            text_lower = group["canonical_text"].lower()
            if any(kw in text_lower for kw in ["define", "definition", "what is", "what are"]):
                definitions.append(entry)
            elif any(kw in text_lower for kw in ["prove", "proof", "show that", "verify", "demonstrate"]):
                proofs.append(entry)
            elif any(kw in text_lower for kw in ["find", "solve", "calculate", "compute",
                                                  "determine", "evaluate"]):
                numericals.append(entry)
            else:
                # default bucket for theory / explanation questions
                definitions.append(entry)

        return {
            "definitions": definitions,
            "proofs": proofs,
            "numericals": numericals,
        }
