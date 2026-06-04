"""
Report Builder — orchestrates all analyzers and stores result in analysis_reports.
Evidence enforcement: any insight without evidence[] is stripped before storage.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.analysis.unit_classifier import classify_unit, backfill_questions
from app.analysis.topic_classifier import classify_topics
from app.analysis.frequency_analyzer import FrequencyAnalyzer
from app.analysis.trend_analyzer import TrendAnalyzer
from app.analysis.prediction_engine import PredictionEngine
from app.logger import get_logger

log = get_logger(__name__)

CACHE_TTL_DAYS = 7


class ReportBuilder:
    def __init__(self):
        self.db = get_db()

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def build(
        self,
        subject_id: str,
        regulation: str,
        branch_id: Optional[str],
        year_from: Optional[int],
        year_to: Optional[int],
        exam_category: Optional[str] = None,
        exam_attempt: Optional[str] = None,
    ) -> dict:
        """
        Builds and stores a full AnalysisReport. Returns the report dict.
        """
        log.info(f"Building report: subject={subject_id} reg={regulation} "
                 f"branch={branch_id} years={year_from}-{year_to} "
                 f"category={exam_category} attempt={exam_attempt}")

        # 1. Backfill unit/topic tags for this subject+regulation
        try:
            backfill_questions(subject_id, regulation)
        except Exception as e:
            log.warning(f"backfill_questions failed (non-fatal): {e}")

        # 2. Fetch questions from v_questions_regulated view
        questions = self._fetch_questions(
            subject_id, regulation, branch_id, year_from, year_to,
            exam_category, exam_attempt
        )
        log.info(f"Fetched {len(questions)} questions for analysis")

        if not questions:
            log.warning("No questions found — returning empty report")

        # 3. Run all analyzers
        freq_analyzer = FrequencyAnalyzer(questions)
        trend_analyzer = TrendAnalyzer(questions)
        pred_engine = PredictionEngine(questions)

        topic_freq = freq_analyzer.topic_frequency()
        question_freq = freq_analyzer.question_frequency()
        unit_dist = freq_analyzer.unit_distribution()

        heatmap = trend_analyzer.topic_heatmap()
        repeated = trend_analyzer.repeated_questions()

        high_prob_topics = pred_engine.high_probability_topics(topic_freq, top_n=10)
        predicted_questions = pred_engine.predict_questions(top_n=10)

        # 4. Evidence enforcement — strip insights with empty evidence
        topic_freq = [t for t in topic_freq if t.get("paper_ids")]
        high_prob_topics = [t for t in high_prob_topics if t.get("evidence_papers")]
        predicted_questions = [q for q in predicted_questions if q.get("evidence")]

        # 5. Assemble report
        report_id = str(uuid.uuid4())
        now = datetime.utcnow()
        report = {
            "id": report_id,
            "subject_id": subject_id,
            "regulation": regulation,
            "branch_id": branch_id,
            "year_from": year_from,
            "year_to": year_to,
            "exam_category": exam_category,
            "exam_attempt": exam_attempt,
            "generated_at": now.isoformat(),
            "expires_at": (now + timedelta(days=CACHE_TTL_DAYS)).isoformat(),
            "status": "ready",
            "question_count": len(questions),
            "unit_distribution": unit_dist,
            "topic_frequency": topic_freq,
            "question_frequency": question_freq,
            "trend_heatmap": heatmap,
            "repeated_questions": repeated,
            "high_probability_topics": high_prob_topics,
            "predicted_questions": predicted_questions,
        }

        # 6. Persist to analysis_reports
        self._store_report(report)

        return report

    # ------------------------------------------------------------------
    # DB helpers
    # ------------------------------------------------------------------

    def _fetch_questions(
        self,
        subject_id: str,
        regulation: str,
        branch_id: Optional[str],
        year_from: Optional[int],
        year_to: Optional[int],
        exam_category: Optional[str] = None,
        exam_attempt: Optional[str] = None,
    ) -> list[dict]:
        """
        Always uses v_questions_regulated with WHERE paper_regulation = regulation.
        Never mixes regulations.
        Now supports exam_category and exam_attempt filtering.
        """
        query = (
            self.db.table("v_questions_regulated")
            .select("*")
            .eq("subject_id", subject_id)
            .eq("paper_regulation", regulation)
        )
        if branch_id:
            query = query.eq("branch_id", branch_id)
        if year_from:
            query = query.gte("exam_year", year_from)
        if year_to:
            query = query.lte("exam_year", year_to)
        if exam_category:
            query = query.eq("exam_category", exam_category)
        if exam_attempt:
            query = query.eq("exam_type", exam_attempt)

        result = query.execute()
        rows = result.data or []

        # Normalise: map paper_regulation → regulation for downstream code
        for row in rows:
            if "paper_regulation" in row and "regulation" not in row:
                row["regulation"] = row["paper_regulation"]

        return rows

    def _store_report(self, report: dict) -> None:
        """Upsert into analysis_reports table."""
        try:
            self.db.table("analysis_reports").upsert({
                "id": report["id"],
                "subject_id": report["subject_id"],
                "regulation": report["regulation"],
                "branch_id": report.get("branch_id"),
                "year_from": report.get("year_from"),
                "year_to": report.get("year_to"),
                "report_data": report,
                "status": "ready",
                "generated_at": report["generated_at"],
                "expires_at": report["expires_at"],
            }).execute()
            log.info(f"Stored analysis report {report['id']}")
        except Exception as e:
            log.error(f"Failed to store report: {e}")
