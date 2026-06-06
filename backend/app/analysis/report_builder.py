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

        # 3b. Generate classification-based insights (from topic_name/unit_name fields)
        unit_distribution_classified = self._build_unit_distribution(questions)
        most_asked_topics = self._build_most_asked_topics(questions)
        coverage_analysis = self._build_coverage_analysis(questions)
        high_probability_topics_classified = self._build_high_probability_topics(questions)
        study_priority_order = self._build_study_priority(questions)

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
            # Original analyzers
            "unit_distribution": unit_dist,
            "topic_frequency": topic_freq,
            "question_frequency": question_freq,
            "trend_heatmap": heatmap,
            "repeated_questions": repeated,
            "high_probability_topics": high_prob_topics,
            "predicted_questions": predicted_questions,
            # NEW: Classification-based insights
            "unit_distribution_classified": unit_distribution_classified,
            "most_asked_topics": most_asked_topics,
            "coverage_analysis": coverage_analysis,
            "high_probability_topics_classified": high_probability_topics_classified,
            "study_priority_order": study_priority_order,
        }

        # 6. Persist to analysis_reports
        self._store_report(report)

        return report

    # ------------------------------------------------------------------
    # Classification-based analysis methods
    # ------------------------------------------------------------------

    def _build_unit_distribution(self, questions: list[dict]) -> dict:
        """
        Unit Distribution from classified questions.
        Returns: {"Unit I": {"count": 45, "percentage": 18}, ...}
        """
        unit_counts = {}
        classified_count = 0
        
        for q in questions:
            unit = q.get('unit_name')
            if unit:
                unit_counts[unit] = unit_counts.get(unit, 0) + 1
                classified_count += 1
        
        # Calculate percentages
        result = {}
        for unit, count in sorted(unit_counts.items()):
            percentage = round((count / classified_count * 100), 1) if classified_count > 0 else 0
            result[unit] = {
                "count": count,
                "percentage": percentage
            }
        
        return result

    def _build_most_asked_topics(self, questions: list[dict]) -> list[dict]:
        """
        Most Asked Topics ranked by frequency.
        Returns top 10: [{"topic": "...", "count": X, "unit": "...", "percentage": Y}, ...]
        """
        topic_counts = {}
        classified_count = 0
        
        for q in questions:
            topic = q.get('topic_name')
            unit = q.get('unit_name')
            if topic:
                if topic not in topic_counts:
                    topic_counts[topic] = {"count": 0, "unit": unit}
                topic_counts[topic]["count"] += 1
                classified_count += 1
        
        # Sort by frequency, take top 10
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1]["count"], reverse=True)[:10]
        
        result = []
        for topic, data in sorted_topics:
            percentage = round((data["count"] / classified_count * 100), 1) if classified_count > 0 else 0
            result.append({
                "topic": topic,
                "count": data["count"],
                "unit": data["unit"],
                "percentage": percentage,
                "priority": "Very High" if data["count"] >= 50 else "High" if data["count"] >= 20 else "Medium"
            })
        
        return result

    def _build_coverage_analysis(self, questions: list[dict]) -> dict:
        """
        Coverage Analysis - which units are covered, which are most important.
        Returns: {
            "covered_units": ["Unit I", "Unit II", ...],
            "uncovered_units": ["Unit IV"],
            "most_important_unit": "Unit II",
            "classification_coverage": 0.75
        }
        """
        units_seen = set()
        classified_count = 0
        total_count = len(questions)
        
        for q in questions:
            unit = q.get('unit_name')
            if unit:
                units_seen.add(unit)
                classified_count += 1
        
        # Expected units (I-V)
        all_units = {"Unit I", "Unit II", "Unit III", "Unit IV", "Unit V"}
        uncovered = all_units - units_seen
        
        # Most important = highest question count
        unit_counts = {}
        for q in questions:
            unit = q.get('unit_name')
            if unit:
                unit_counts[unit] = unit_counts.get(unit, 0) + 1
        
        most_important = max(unit_counts.items(), key=lambda x: x[1])[0] if unit_counts else None
        
        return {
            "covered_units": sorted(list(units_seen)),
            "uncovered_units": sorted(list(uncovered)),
            "most_important_unit": most_important,
            "classification_coverage": round(classified_count / total_count, 2) if total_count > 0 else 0,
            "total_questions": total_count,
            "classified_questions": classified_count
        }

    def _build_high_probability_topics(self, questions: list[dict]) -> list[dict]:
        """
        High Probability Topics based on frequency + historical appearance.
        Returns top 10 with evidence.
        """
        topic_counts = {}
        topic_papers = {}
        
        for q in questions:
            topic = q.get('topic_name')
            paper_id = q.get('paper_id')
            if topic:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
                if topic not in topic_papers:
                    topic_papers[topic] = set()
                if paper_id:
                    topic_papers[topic].add(paper_id)
        
        # Sort by frequency
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        result = []
        for topic, count in sorted_topics:
            paper_count = len(topic_papers.get(topic, set()))
            probability = "Very High" if count >= 30 else "High" if count >= 15 else "Medium"
            
            result.append({
                "topic": topic,
                "question_count": count,
                "paper_count": paper_count,
                "probability": probability,
                "confidence": round(min(count / 50, 1.0), 2)  # Max confidence at 50+ questions
            })
        
        return result

    def _build_study_priority(self, questions: list[dict]) -> list[dict]:
        """
        Study Priority Order: Units and topics ranked by historical frequency.
        Returns: [{"unit": "Unit II", "priority": 1, "question_count": 120, "top_topics": [...]}, ...]
        """
        unit_data = {}
        
        for q in questions:
            unit = q.get('unit_name')
            topic = q.get('topic_name')
            if unit:
                if unit not in unit_data:
                    unit_data[unit] = {"count": 0, "topics": {}}
                unit_data[unit]["count"] += 1
                if topic:
                    unit_data[unit]["topics"][topic] = unit_data[unit]["topics"].get(topic, 0) + 1
        
        # Sort units by question count
        sorted_units = sorted(unit_data.items(), key=lambda x: x[1]["count"], reverse=True)
        
        result = []
        for i, (unit, data) in enumerate(sorted_units, 1):
            # Top 3 topics in this unit
            sorted_topics = sorted(data["topics"].items(), key=lambda x: x[1], reverse=True)[:3]
            top_topics = [{"topic": t, "count": c} for t, c in sorted_topics]
            
            result.append({
                "unit": unit,
                "priority": i,
                "question_count": data["count"],
                "percentage": round((data["count"] / len(questions) * 100), 1) if questions else 0,
                "top_topics": top_topics,
                "recommendation": f"Focus on this unit - {data['count']} questions ({round((data['count'] / len(questions) * 100), 1)}% of exam)" if i <= 2 else "Standard coverage"
            })
        
        return result

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
        log.info(f"[DEBUG] _fetch_questions: subject_id={subject_id}, regulation={regulation}, exam_category={exam_category}, exam_attempt={exam_attempt}")
        
        query = (
            self.db.table("v_questions_regulated")
            .select("*")
            .eq("subject_id", subject_id)
            .eq("paper_regulation", regulation)
        )
        if branch_id:
            query = query.eq("branch_id", branch_id)
        if exam_category:
            query = query.eq("exam_category", exam_category)
        if exam_attempt:
            query = query.eq("exam_type", exam_attempt)

        # Apply year filters only when explicit (many papers have NULL exam_year —
        # filtering on them would silently return 0 rows).
        # We use OR to keep NULL-year rows alongside year-filtered rows.
        # Supabase PostgREST: use "or" filter to include NULLs.
        if year_from:
            query = query.or_(f"exam_year.gte.{year_from},exam_year.is.null")
        if year_to:
            query = query.or_(f"exam_year.lte.{year_to},exam_year.is.null")

        result = query.execute()
        rows = result.data or []
        
        log.info(f"[DEBUG] Query returned {len(rows)} rows")

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
