"""
Tests for Milestone 5 — Personalized Study Planner, Readiness Scorer, Mock Exam Generator.

Covers:
  - PriorityRanker: bucket assignment, frequency thresholds, evidence enforcement
  - ScheduleBuilder: last 2 days revision, mock exam day, total days, warnings
  - MockExamGenerator: evidence enforcement, total_marks=60, format, regulation check
  - ReadinessScorer: score bounds, grade thresholds, factor weights, recommendations
"""
import pytest
from datetime import date, timedelta
from unittest.mock import patch, MagicMock

from app.planner.priority_ranker import PriorityRanker
from app.planner.schedule_builder import ScheduleBuilder
from app.planner.mock_generator import MockExamGenerator
from app.planner.readiness_scorer import ReadinessScorer, GRADE_THRESHOLDS, WEIGHTS


# ---------------------------------------------------------------------------
# Shared fixtures / helpers
# ---------------------------------------------------------------------------

def _make_topic(name, frequency, paper_count=None, unit=1, marks_weight=20, appears_every_year=False):
    count = paper_count if paper_count is not None else frequency
    return {
        "topic": name,
        "unit_number": unit,
        "frequency": frequency,
        "paper_ids": [f"p{i}" for i in range(count)],
        "marks_weight": marks_weight,
        "appears_every_year": appears_every_year,
    }


def _make_analysis_report(topics=None, predicted=None, high_prob=None):
    return {
        "regulation": "R20",
        "subject_id": "sub1",
        "topic_frequency": topics or [],
        "predicted_questions": predicted or [],
        "high_probability_topics": high_prob or [],
        "unit_distribution": {
            "1": {"total_marks": 20},
            "2": {"total_marks": 20},
            "3": {"total_marks": 20},
            "4": {"total_marks": 20},
            "5": {"total_marks": 20},
        },
    }


def _make_predicted_q(unit, text="Explain X", evidence=None):
    return {
        "question_text": text,
        "unit_number": unit,
        "unit": unit,
        "confidence": 0.8,
        "evidence": evidence if evidence is not None else [
            {"paper_id": "p1", "year": 2022, "exam_type": "regular"}
        ],
    }


def _make_high_prob(name, unit=1, evidence_papers=None):
    return {
        "topic": name,
        "name": name,
        "unit_number": unit,
        "probability": 0.9,
        "marks_weight": 20,
        "evidence_papers": evidence_papers if evidence_papers is not None else [
            {"paper_id": "p1", "year": 2022, "exam_type": "regular"}
        ],
    }


def _future_date(days=14):
    return (date.today() + timedelta(days=days)).isoformat()


# ---------------------------------------------------------------------------
# PriorityRanker tests
# ---------------------------------------------------------------------------

class TestPriorityRanker:
    def setup_method(self):
        self.ranker = PriorityRanker()

    def test_must_study_has_frequency_at_least_4_intermediate(self):
        """must_study topics must have frequency >= 4 at intermediate level."""
        topics = [_make_topic("Dijkstra", 5, paper_count=5)]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "intermediate")
        assert len(result["must_study"]) == 1
        assert result["must_study"][0]["frequency"] >= 4

    def test_low_has_frequency_1(self):
        """low topics must have frequency == 1."""
        topics = [_make_topic("Prim", 1, paper_count=1)]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "intermediate")
        assert len(result["low"]) == 1
        assert result["low"][0]["frequency"] == 1

    def test_high_bucket_frequency_3(self):
        """frequency=3 → high at intermediate level."""
        topics = [_make_topic("BFS", 3, paper_count=3)]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "intermediate")
        assert len(result["high"]) == 1

    def test_medium_bucket_frequency_2(self):
        """frequency=2 → medium at intermediate level."""
        topics = [_make_topic("DFS", 2, paper_count=2)]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "intermediate")
        assert len(result["medium"]) == 1

    def test_beginner_lower_threshold(self):
        """beginner level: threshold for must_study is lower (3 papers)."""
        topics = [_make_topic("Floyd", 3, paper_count=3)]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "beginner")
        assert len(result["must_study"]) == 1

    def test_advanced_higher_threshold(self):
        """advanced level: must_study requires 5+ papers."""
        topics = [
            _make_topic("Topic4", 4, paper_count=4),
            _make_topic("Topic5", 5, paper_count=5),
        ]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "advanced")
        # 4-paper topic should NOT be must_study at advanced level
        must_names = [t["topic"] for t in result["must_study"]]
        assert "Topic4" not in must_names
        assert "Topic5" in must_names

    def test_appears_every_year_forces_must_study(self):
        """appears_every_year=True always goes to must_study regardless of count."""
        topics = [_make_topic("Kruskal", 2, paper_count=2, appears_every_year=True)]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "intermediate")
        assert any(t["topic"] == "Kruskal" for t in result["must_study"])

    def test_topic_without_paper_ids_excluded(self):
        """Topics with empty paper_ids are excluded (evidence enforcement)."""
        topics = [
            {"topic": "Ghost", "unit_number": 1, "frequency": 10, "paper_ids": [], "marks_weight": 20},
        ]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "intermediate")
        all_topics = (
            result["must_study"] + result["high"] + result["medium"] + result["low"]
        )
        assert not any(t["topic"] == "Ghost" for t in all_topics)

    def test_result_has_all_four_buckets(self):
        """Result always contains all four bucket keys."""
        report = _make_analysis_report()
        result = self.ranker.rank_topics(report, "intermediate")
        assert set(result.keys()) == {"must_study", "high", "medium", "low"}

    def test_unknown_preparation_level_defaults_to_intermediate(self):
        """Unknown level silently falls back to intermediate without raising."""
        topics = [_make_topic("Heap", 4, paper_count=4)]
        report = _make_analysis_report(topics=topics)
        result = self.ranker.rank_topics(report, "expert")   # unknown level
        assert len(result["must_study"]) == 1


# ---------------------------------------------------------------------------
# ScheduleBuilder tests
# ---------------------------------------------------------------------------

class TestScheduleBuilder:
    def setup_method(self):
        self.builder = ScheduleBuilder()

    def _priority_map(self):
        return {
            "must_study": [
                {"topic": "Graphs", "marks_weight": 20, "_allocated_hours": 0},
                {"topic": "Trees", "marks_weight": 15, "_allocated_hours": 0},
            ],
            "high": [{"topic": "Sorting", "marks_weight": 10, "_allocated_hours": 0}],
            "medium": [{"topic": "Hashing", "marks_weight": 10, "_allocated_hours": 0}],
            "low": [{"topic": "Recursion", "marks_weight": 5, "_allocated_hours": 0}],
        }

    def test_last_two_days_are_revision(self):
        exam = _future_date(14)
        result = self.builder.build(self._priority_map(), exam, 4.0)
        plan = result["daily_plan"]
        assert plan[-1]["day_type"] == "revision"
        assert plan[-2]["day_type"] == "revision"

    def test_day_before_revision_is_mock_exam(self):
        exam = _future_date(14)
        result = self.builder.build(self._priority_map(), exam, 4.0)
        plan = result["daily_plan"]
        assert plan[-3]["day_type"] == "mock_exam"

    def test_total_days_matches_exam_date_gap(self):
        days = 14
        exam = _future_date(days)
        result = self.builder.build(self._priority_map(), exam, 4.0)
        assert result["total_days"] == days

    def test_revision_days_contain_must_study_topics(self):
        exam = _future_date(14)
        result = self.builder.build(self._priority_map(), exam, 4.0)
        plan = result["daily_plan"]
        revision_topics = plan[-1]["topics"] + plan[-2]["topics"]
        assert "Graphs" in revision_topics or "Trees" in revision_topics

    def test_past_exam_date_returns_empty_plan(self):
        past = (date.today() - timedelta(days=1)).isoformat()
        result = self.builder.build(self._priority_map(), past, 4.0)
        assert result["daily_plan"] == []
        assert result["total_days"] == 0

    def test_drop_low_priority_when_not_enough_days(self):
        """With only 5 days and many topics, low priority should be dropped with a warning."""
        big_map = {
            "must_study": [{"topic": f"Must{i}", "marks_weight": 20, "_allocated_hours": 0} for i in range(10)],
            "high": [{"topic": f"High{i}", "marks_weight": 15, "_allocated_hours": 0} for i in range(10)],
            "medium": [{"topic": f"Med{i}", "marks_weight": 10, "_allocated_hours": 0} for i in range(10)],
            "low": [{"topic": f"Low{i}", "marks_weight": 5, "_allocated_hours": 0} for i in range(10)],
        }
        exam = _future_date(5)
        result = self.builder.build(big_map, exam, 2.0)
        # Should have warnings about dropped topics
        assert len(result["warnings"]) > 0

    def test_study_days_count_correct(self):
        days = 10
        exam = _future_date(days)
        result = self.builder.build(self._priority_map(), exam, 4.0)
        # study_days = total - 2 revision - 1 mock = 7
        assert result["study_days"] == days - 3


# ---------------------------------------------------------------------------
# MockExamGenerator tests
# ---------------------------------------------------------------------------

class TestMockExamGenerator:
    def setup_method(self):
        self.gen = MockExamGenerator()

    def _full_report(self):
        high_prob = [_make_high_prob(f"Topic{i}", unit=(i % 5) + 1) for i in range(15)]
        predicted = [_make_predicted_q(unit=u) for u in range(1, 6)]
        return _make_analysis_report(high_prob=high_prob, predicted=predicted)

    def test_total_marks_equals_60(self):
        report = self._full_report()
        result = self.gen.generate(report, "R20", "sub1")
        assert result["total_marks"] == 60

    def test_part_a_count_is_10(self):
        report = self._full_report()
        result = self.gen.generate(report, "R20", "sub1")
        assert result["part_a_count"] == 10

    def test_part_b_count_is_5(self):
        report = self._full_report()
        result = self.gen.generate(report, "R20", "sub1")
        assert result["part_b_count"] == 5

    def test_all_questions_have_evidence(self):
        """Every question in the mock must have a non-empty evidence list."""
        report = self._full_report()
        result = self.gen.generate(report, "R20", "sub1")
        for q in result["questions"]:
            assert q["evidence"], f"Question has empty evidence: {q['question_text']}"

    def test_empty_evidence_question_rejected(self):
        """Questions with empty evidence[] must never appear in the mock."""
        high_prob = [
            {
                "topic": "BadTopic",
                "name": "BadTopic",
                "unit_number": 1,
                "probability": 0.9,
                "marks_weight": 20,
                "evidence_papers": [],   # empty — must be rejected
            },
            _make_high_prob("GoodTopic", unit=1),
        ]
        predicted = [_make_predicted_q(unit=u) for u in range(1, 6)]
        report = _make_analysis_report(high_prob=high_prob, predicted=predicted)
        result = self.gen.generate(report, "R20", "sub1")
        topics_in_mock = [q["question_text"] for q in result["questions"]]
        assert not any("BadTopic" in t for t in topics_in_mock)

    def test_regulation_mismatch_raises(self):
        """Passing wrong regulation must raise ValueError."""
        report = self._full_report()
        report["regulation"] = "R18"
        with pytest.raises(ValueError, match="Regulation mismatch"):
            self.gen.generate(report, "R20", "sub1")

    def test_mock_id_is_unique(self):
        report = self._full_report()
        r1 = self.gen.generate(report, "R20", "sub1")
        r2 = self.gen.generate(report, "R20", "sub1")
        assert r1["mock_id"] != r2["mock_id"]

    def test_part_a_questions_have_1_mark(self):
        report = self._full_report()
        result = self.gen.generate(report, "R20", "sub1")
        for q in result["part_a_questions"]:
            assert q["marks"] == 1

    def test_part_b_questions_have_10_marks(self):
        report = self._full_report()
        result = self.gen.generate(report, "R20", "sub1")
        for q in result["part_b_questions"]:
            assert q["marks"] == 10

    def test_predicted_question_with_empty_evidence_excluded(self):
        """predicted_questions with empty evidence must be excluded from Part B."""
        predicted_bad = [{"question_text": "Ghost Q", "unit_number": 1, "unit": 1, "evidence": []}]
        predicted_good = [_make_predicted_q(unit=u) for u in range(1, 6)]
        high_prob = [_make_high_prob(f"T{i}", unit=i) for i in range(1, 11)]
        report = _make_analysis_report(high_prob=high_prob, predicted=predicted_bad + predicted_good)
        result = self.gen.generate(report, "R20", "sub1")
        part_b_texts = [q["question_text"] for q in result["part_b_questions"]]
        assert "Ghost Q" not in part_b_texts


# ---------------------------------------------------------------------------
# ReadinessScorer tests
# ---------------------------------------------------------------------------

class TestReadinessScorer:
    """
    ReadinessScorer makes DB calls. We patch get_db() to return a mock client.
    """

    def _mock_db(self, activities=None, plan=None, syllabus=None):
        mock_client = MagicMock()

        def _table_chain(table_name):
            mock_table = MagicMock()
            mock_table.select.return_value = mock_table
            mock_table.eq.return_value = mock_table
            mock_table.order.return_value = mock_table
            mock_table.limit.return_value = mock_table

            if table_name == "user_activity":
                mock_table.execute.return_value = MagicMock(data=activities or [])
            elif table_name == "study_plans":
                mock_table.execute.return_value = MagicMock(data=[plan] if plan else [])
            elif table_name == "syllabus_topics":
                rows = [{"topic_name": t} for t in (syllabus or [])]
                mock_table.execute.return_value = MagicMock(data=rows)
            else:
                mock_table.execute.return_value = MagicMock(data=[])

            return mock_table

        mock_client.table.side_effect = _table_chain
        return mock_client

    def test_score_within_0_100(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            result = scorer.score("u1", "sub1", "R20")
            assert 0 <= result["score"] <= 100

    def test_grade_at_risk_when_score_low(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            result = scorer.score("u1", "sub1", "R20")
            # No activities → low score → At Risk
            assert result["grade_prediction"] == "At Risk"

    def test_grade_a_threshold(self):
        """Score >= 85 → grade A."""
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            assert scorer._predict_grade(85) == "A"
            assert scorer._predict_grade(100) == "A"

    def test_grade_b_plus_threshold(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            assert scorer._predict_grade(75) == "B+"
            assert scorer._predict_grade(84) == "B+"

    def test_grade_b_threshold(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            assert scorer._predict_grade(65) == "B"

    def test_grade_c_threshold(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            assert scorer._predict_grade(55) == "C"

    def test_grade_pass_threshold(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            assert scorer._predict_grade(40) == "Pass"

    def test_grade_at_risk_below_40(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            assert scorer._predict_grade(39) == "At Risk"
            assert scorer._predict_grade(0) == "At Risk"

    def test_result_has_required_keys(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            result = scorer.score("u1", "sub1", "R20")
            required = {
                "score", "grade_prediction", "topic_coverage_score",
                "practice_score", "plan_completion_score", "syllabus_coverage_score",
                "weak_areas", "recommendations",
            }
            assert required.issubset(result.keys())

    def test_weak_areas_are_unstudied_topics(self):
        syllabus = ["Dijkstra", "BFS", "DFS"]
        # Only studied Dijkstra
        activities = [
            {"activity_type": "study", "metadata": {"topic": "Dijkstra"}, "reference_id": ""}
        ]
        db = self._mock_db(activities=activities, syllabus=syllabus)
        with patch("app.planner.readiness_scorer.get_db", return_value=db):
            scorer = ReadinessScorer()
            result = scorer.score("u1", "sub1", "R20")
            assert "BFS" in result["weak_areas"]
            assert "DFS" in result["weak_areas"]
            assert "Dijkstra" not in result["weak_areas"]

    def test_recommendations_are_non_empty(self):
        with patch("app.planner.readiness_scorer.get_db", return_value=self._mock_db()):
            scorer = ReadinessScorer()
            result = scorer.score("u1", "sub1", "R20")
            assert len(result["recommendations"]) > 0

    def test_factor_weights_sum_to_1(self):
        total = sum(WEIGHTS.values())
        assert abs(total - 1.0) < 1e-9
