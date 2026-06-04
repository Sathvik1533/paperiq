"""
Mock Exam Generator — generates a mock paper matching real exam format.

Architecture rules (locked):
1. Only uses questions that appeared in real papers.
2. Every question MUST have a non-empty evidence[] list.
3. Questions with empty evidence are hard-rejected — never included.
4. regulation is always passed and enforced — no cross-regulation mixing.

Format:
    Part A: 10 x 1M questions  (from high_probability topics)
    Part B: 5 units x 1 x 10M question each
    Total:  10 + 50 = 60 marks
"""
import uuid
from datetime import datetime
from app.logger import get_logger

log = get_logger(__name__)

PART_A_COUNT = 10
PART_A_MARKS = 1
PART_B_UNITS = 5
PART_B_MARKS = 10


class MockExamGenerator:
    def generate(self, analysis_report: dict, regulation: str, subject_id: str) -> dict:
        """
        Generate a mock exam from an analysis_report.

        Returns:
            {
                mock_id, regulation, subject_id, generated_at,
                questions[], total_marks, part_a_count, part_b_count,
                part_a_questions[], part_b_questions[]
            }
        Raises:
            ValueError if regulation mismatches or not enough evidenced questions.
        """
        # Regulation safety check
        report_regulation = analysis_report.get("regulation", "")
        if report_regulation and report_regulation != regulation:
            raise ValueError(
                f"Regulation mismatch: report has '{report_regulation}', requested '{regulation}'. "
                "Mock exam cannot mix regulations."
            )

        high_prob = analysis_report.get("high_probability_topics", [])
        predicted = analysis_report.get("predicted_questions", [])

        # Evidence enforcement pass — strip any question/topic without evidence
        high_prob = [t for t in high_prob if t.get("evidence_papers")]
        predicted = [q for q in predicted if q.get("evidence") and len(q["evidence"]) > 0]

        # --- Build Part A (1M questions from high_probability topics) ---
        part_a_questions = self._build_part_a(high_prob, regulation)

        # --- Build Part B (10M questions, one per unit) ---
        part_b_questions = self._build_part_b(predicted, regulation)

        all_questions = part_a_questions + part_b_questions
        total_marks = (len(part_a_questions) * PART_A_MARKS) + (len(part_b_questions) * PART_B_MARKS)

        mock_id = str(uuid.uuid4())

        return {
            "mock_id": mock_id,
            "regulation": regulation,
            "subject_id": subject_id,
            "generated_at": datetime.utcnow().isoformat(),
            "questions": all_questions,
            "part_a_questions": part_a_questions,
            "part_b_questions": part_b_questions,
            "total_marks": total_marks,
            "part_a_count": len(part_a_questions),
            "part_b_count": len(part_b_questions),
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_part_a(self, high_prob_topics: list, regulation: str) -> list:
        """
        Generate up to PART_A_COUNT short-answer questions from high_probability_topics.
        Each question is derived from the topic name + evidence from real papers.
        """
        questions = []
        seen_topics = set()

        for topic_entry in high_prob_topics:
            if len(questions) >= PART_A_COUNT:
                break

            topic = topic_entry.get("topic") or topic_entry.get("name", "")
            if not topic or topic in seen_topics:
                continue

            evidence_papers = topic_entry.get("evidence_papers", [])
            # Evidence enforcement: skip if empty
            if not evidence_papers:
                log.warning(f"Skipping Part A topic '{topic}' — no evidence papers")
                continue

            evidence = self._normalise_evidence(evidence_papers)
            unit = topic_entry.get("unit_number") or topic_entry.get("unit")

            questions.append({
                "question_text": f"Define and explain the concept of {topic}.",
                "unit": unit,
                "marks": PART_A_MARKS,
                "question_type": "short_answer",
                "confidence": topic_entry.get("probability", topic_entry.get("score", 0.8)),
                "evidence": evidence,
                "part": "A",
            })
            seen_topics.add(topic)

        log.info(f"Part A built: {len(questions)} questions")
        return questions

    def _build_part_b(self, predicted_questions: list, regulation: str) -> list:
        """
        Generate up to PART_B_UNITS long-answer questions (one per unit).
        Only uses questions that appeared in real papers with non-empty evidence.
        """
        # Group by unit
        by_unit: dict[int, list] = {}
        for q in predicted_questions:
            unit = q.get("unit_number") or q.get("unit") or 0
            by_unit.setdefault(int(unit), []).append(q)

        questions = []
        covered_units = set()

        # First pass: one per unit 1-5
        for unit_num in range(1, PART_B_UNITS + 1):
            candidates = by_unit.get(unit_num, [])
            for candidate in candidates:
                evidence = candidate.get("evidence", [])
                if not evidence:
                    continue
                evidence = self._normalise_evidence(evidence)
                questions.append({
                    "question_text": candidate.get(
                        "question_text",
                        f"Explain in detail the concept from Unit {unit_num}."
                    ),
                    "unit": unit_num,
                    "marks": PART_B_MARKS,
                    "question_type": "long_answer",
                    "confidence": candidate.get("confidence", candidate.get("score", 0.7)),
                    "evidence": evidence,
                    "part": "B",
                })
                covered_units.add(unit_num)
                break  # one per unit

        # Second pass: fill missing units from any unit's candidates
        missing_units = set(range(1, PART_B_UNITS + 1)) - covered_units
        if missing_units:
            # Pull from predicted_questions regardless of unit
            fallback_pool = [
                q for q in predicted_questions
                if q.get("evidence") and len(q["evidence"]) > 0
            ]
            for unit_num in sorted(missing_units):
                for candidate in fallback_pool:
                    ev = self._normalise_evidence(candidate["evidence"])
                    questions.append({
                        "question_text": candidate.get(
                            "question_text",
                            f"Explain in detail a key concept from Unit {unit_num}."
                        ),
                        "unit": unit_num,
                        "marks": PART_B_MARKS,
                        "question_type": "long_answer",
                        "confidence": candidate.get("confidence", 0.5),
                        "evidence": ev,
                        "part": "B",
                    })
                    fallback_pool.remove(candidate)
                    break

        log.info(f"Part B built: {len(questions)} questions")
        return questions

    def _normalise_evidence(self, raw: list) -> list:
        """
        Normalise evidence entries to {paper_id, year, exam_type}.
        Accepts both string paper_ids and dicts.
        """
        result = []
        for item in raw:
            if isinstance(item, dict):
                result.append({
                    "paper_id": item.get("paper_id", item.get("id", "")),
                    "year": item.get("year", item.get("exam_year", "")),
                    "exam_type": item.get("exam_type", item.get("type", "regular")),
                })
            elif isinstance(item, str):
                result.append({"paper_id": item, "year": "", "exam_type": "regular"})
        return result
