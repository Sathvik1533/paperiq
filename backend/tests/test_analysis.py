"""
Tests for Milestone 4 — Pattern Analysis Engine.
Covers: unit_classifier, topic_classifier, frequency_analyzer,
        trend_analyzer, prediction_engine, and evidence enforcement.
"""
import pytest
from app.analysis.unit_classifier import classify_unit
from app.analysis.topic_classifier import classify_topics
from app.analysis.frequency_analyzer import FrequencyAnalyzer, _normalise
from app.analysis.trend_analyzer import TrendAnalyzer
from app.analysis.prediction_engine import PredictionEngine, _recency_weight


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_question(
    qid="q1", paper_id="p1", text="", marks=10,
    year=2022, unit=None, topics=None, co=None
):
    return {
        "id": qid,
        "paper_id": paper_id,
        "question_text": text,
        "marks": marks,
        "exam_year": year,
        "unit_number": unit,
        "topic_tags": topics or [],
        "co": co,
    }


# ---------------------------------------------------------------------------
# unit_classifier tests
# ---------------------------------------------------------------------------

class TestUnitClassifier:
    def test_co1_maps_to_unit_1(self):
        unit, conf = classify_unit("any text", co="CO1")
        assert unit == 1
        assert conf == 1.0

    def test_co3_maps_to_unit_3(self):
        unit, conf = classify_unit("any text", co="CO3")
        assert unit == 3
        assert conf == 1.0

    def test_co5_maps_to_unit_5(self):
        unit, conf = classify_unit("any text", co="CO5")
        assert unit == 5
        assert conf == 1.0

    def test_keyword_hasse_maps_to_unit_2(self):
        unit, conf = classify_unit("Draw the Hasse diagram for the poset", co=None)
        assert unit == 2
        assert conf > 0

    def test_keyword_graph_maps_to_unit_5(self):
        unit, conf = classify_unit("Find the chromatic number of the graph", co=None)
        assert unit == 5

    def test_keyword_recurrence_maps_to_unit_4(self):
        unit, conf = classify_unit("Solve the recurrence relation an = 5an-1 - 6an-2", co=None)
        assert unit == 4

    def test_keyword_pigeonhole_maps_to_unit_3(self):
        unit, conf = classify_unit("Apply the pigeonhole principle to prove", co=None)
        assert unit == 3

    def test_keyword_logic_maps_to_unit_1(self):
        unit, conf = classify_unit("Prove using rules of inference", co=None)
        assert unit == 1

    def test_no_match_returns_none(self):
        unit, conf = classify_unit("miscellaneous unrelated text xyz", co=None)
        assert unit is None
        assert conf == 0.0

    def test_co_overrides_keyword(self):
        # Text looks like unit 5 but CO says unit 2
        unit, conf = classify_unit("graph spanning tree kruskal", co="CO2")
        assert unit == 2
        assert conf == 1.0

    def test_co_lowercase_accepted(self):
        unit, conf = classify_unit("anything", co="co4")
        assert unit == 4

    def test_co_with_space_accepted(self):
        unit, conf = classify_unit("anything", co="CO 3")
        assert unit == 3


# ---------------------------------------------------------------------------
# topic_classifier tests
# ---------------------------------------------------------------------------

class TestTopicClassifier:
    def test_kruskal_maps_to_kruskal_algorithm(self):
        topics = classify_topics("Apply Kruskal's algorithm to find MST")
        assert "Kruskal's Algorithm" in topics

    def test_hasse_diagram_detected(self):
        topics = classify_topics("Draw the Hasse diagram for divisibility on {1,2,4,8}")
        assert "Hasse Diagram" in topics

    def test_tautology_detected(self):
        topics = classify_topics("Show that the formula is a tautology")
        assert "Tautology" in topics

    def test_pigeonhole_detected(self):
        topics = classify_topics("State and prove the Pigeonhole principle")
        assert "Pigeonhole Principle" in topics

    def test_spanning_tree_detected(self):
        topics = classify_topics("Find the minimum spanning tree using Kruskal's algorithm")
        assert "Spanning Tree" in topics

    def test_euler_graph_detected(self):
        topics = classify_topics("Determine if the given graph is Eulerian")
        assert "Euler Graph" in topics

    def test_recurrence_detected(self):
        topics = classify_topics("Solve the recurrence relation using characteristic roots")
        assert "Recurrence Relations" in topics or "Characteristic Roots" in topics

    def test_unit_filter_restricts_results(self):
        # "graph" keywords should not appear when unit=1 is forced
        topics = classify_topics("graph spanning tree", unit=1)
        assert "Kruskal's Algorithm" not in topics
        assert "Spanning Tree" not in topics

    def test_empty_text_returns_empty(self):
        topics = classify_topics("", unit=None)
        assert topics == []

    def test_multiple_topics_detected(self):
        topics = classify_topics("Find the chromatic number and check if the graph is planar")
        assert len(topics) >= 2


# ---------------------------------------------------------------------------
# frequency_analyzer tests
# ---------------------------------------------------------------------------

class TestFrequencyAnalyzer:
    def _sample_questions(self):
        return [
            _make_question("q1", "p1", "Hasse diagram poset", 10, 2021, 2, ["Hasse Diagram"]),
            _make_question("q2", "p2", "Hasse diagram poset", 10, 2022, 2, ["Hasse Diagram"]),
            _make_question("q3", "p3", "Chromatic number graph", 10, 2021, 5, ["Chromatic Number"]),
            _make_question("q4", "p1", "Recurrence relation solve", 5, 2022, 4, ["Recurrence Relations"]),
            _make_question("q5", "p2", "Kruskal spanning tree", 10, 2023, 5, ["Kruskal's Algorithm", "Spanning Tree"]),
        ]

    def test_topic_frequency_sorted_desc(self):
        fa = FrequencyAnalyzer(self._sample_questions())
        result = fa.topic_frequency()
        counts = [r["count"] for r in result]
        assert counts == sorted(counts, reverse=True)

    def test_topic_frequency_has_evidence(self):
        fa = FrequencyAnalyzer(self._sample_questions())
        result = fa.topic_frequency()
        for entry in result:
            assert len(entry["paper_ids"]) > 0
            assert len(entry["question_ids"]) > 0

    def test_hasse_diagram_count_is_2(self):
        fa = FrequencyAnalyzer(self._sample_questions())
        result = fa.topic_frequency()
        hasse = next((r for r in result if r["topic"] == "Hasse Diagram"), None)
        assert hasse is not None
        assert hasse["count"] == 2

    def test_question_frequency_groups_duplicates(self):
        fa = FrequencyAnalyzer(self._sample_questions())
        result = fa.question_frequency()
        # q1 and q2 have same normalised text
        hasse_group = next((r for r in result if "hasse" in r["canonical_text"].lower()), None)
        assert hasse_group is not None
        assert hasse_group["count"] == 2

    def test_unit_distribution_has_pct(self):
        fa = FrequencyAnalyzer(self._sample_questions())
        result = fa.unit_distribution()
        total_pct = sum(r["pct"] for r in result)
        assert abs(total_pct - 100.0) < 1.0  # within rounding

    def test_normalise_strips_stop_words(self):
        n1 = _normalise("Define the Hasse diagram")
        n2 = _normalise("What is a Hasse diagram?")
        # Both should produce similar token sets
        assert "hasse" in n1
        assert "hasse" in n2


# ---------------------------------------------------------------------------
# prediction_engine tests
# ---------------------------------------------------------------------------

class TestPredictionEngine:
    def _questions_with_one_occurrence(self):
        return [
            _make_question("q1", "p1", "unique question about tautology contradiction", 10, 2021, 1,
                           ["Tautology"]),
        ]

    def _questions_with_repeated(self):
        return [
            _make_question("q1", "p1", "solve the recurrence relation", 10, 2021, 4,
                           ["Recurrence Relations"]),
            _make_question("q2", "p2", "solve the recurrence relation", 10, 2022, 4,
                           ["Recurrence Relations"]),
            _make_question("q3", "p3", "solve the recurrence relation", 10, 2023, 4,
                           ["Recurrence Relations"]),
        ]

    def test_no_prediction_for_single_occurrence(self):
        pe = PredictionEngine(self._questions_with_one_occurrence())
        predictions = pe.predict_questions(top_n=10)
        assert predictions == []

    def test_predictions_have_evidence(self):
        pe = PredictionEngine(self._questions_with_repeated())
        predictions = pe.predict_questions(top_n=10)
        for p in predictions:
            assert len(p["evidence"]) >= 1

    def test_recency_weight_recent_years(self):
        w = _recency_weight([2023, 2024], current_year=2025)
        assert w == 1.0

    def test_recency_weight_old_years(self):
        w = _recency_weight([2018, 2019], current_year=2025)
        assert w == 0.2

    def test_high_probability_topics_strips_empty_evidence(self):
        pe = PredictionEngine([])
        # freq_data with empty paper_ids — should be stripped
        freq_data = [
            {"topic": "Tautology", "unit": 1, "count": 5, "years": [2023], "paper_ids": [], "question_ids": []},
            {"topic": "Hasse Diagram", "unit": 2, "count": 3, "years": [2022, 2023], "paper_ids": ["p1"], "question_ids": ["q1"]},
        ]
        result = pe.high_probability_topics(freq_data, top_n=10)
        topics = [r["topic"] for r in result]
        assert "Tautology" not in topics
        assert "Hasse Diagram" in topics

    def test_score_topic_returns_0_to_1(self):
        qs = self._questions_with_repeated()
        pe = PredictionEngine(qs)
        freq_entry = {"topic": "Recurrence Relations", "count": 3, "years": [2021, 2022, 2023],
                      "paper_ids": ["p1", "p2", "p3"], "_max_freq": 3}
        score = pe.score_topic("Recurrence Relations", freq_entry, current_year=2025)
        assert 0.0 <= score <= 1.0


# ---------------------------------------------------------------------------
# Evidence enforcement integration test
# ---------------------------------------------------------------------------

class TestEvidenceEnforcement:
    def test_topic_frequency_no_empty_evidence(self):
        qs = [
            _make_question("q1", "p1", "hasse diagram", 10, 2021, 2, ["Hasse Diagram"]),
        ]
        fa = FrequencyAnalyzer(qs)
        result = fa.topic_frequency()
        for entry in result:
            assert entry["paper_ids"], f"Empty evidence for topic {entry['topic']}"

    def test_high_prob_topics_evidence_enforced(self):
        pe = PredictionEngine([])
        freq_data = [
            {"topic": "NoEvidence", "unit": 1, "count": 10, "years": [2023],
             "paper_ids": [], "question_ids": []},
        ]
        result = pe.high_probability_topics(freq_data)
        assert result == []
