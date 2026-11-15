"""
Test MLRIT Autonomous R22 60-Mark Exam Pattern and Eligibility
==============================================================

Validates:
1. Identification of eligible 60-mark regular papers (2024–2025).
2. Part A (10 x 1M = 10M) and Part B (direct 10M + 5M pairs = 50M) structure.
3. Total evaluated marks add up to exactly 60.
4. Exclusion of 70-mark papers (Part A 2M questions).
5. Exclusion of supplementary / supply papers.
6. Exclusion of papers outside 2024–2025.
7. Flagging of missing, unreadable, and inconsistent papers.
8. Separation of direct 10M questions from 5M subquestions in frequency analysis.
9. Exact source paper traceability for repeated questions.
"""
import pytest
from app.utils.exam_pattern_validator import (
    validate_paper_60m_structure,
    analyze_60m_question_frequencies,
    classify_question_mark_type,
    PaperEligibilityStatus,
)
from app.intelligence.academic_question_intel import (
    AcademicQuestionIntelligence,
    VerifiedQuestion,
)
from app.analysis.frequency_analyzer import FrequencyAnalyzer


def test_classify_question_mark_types():
    """Verify distinct classification of 1M, direct 10M, and 5M subquestions."""
    q_1m = {"marks": 1, "part": "Part A", "question_number": "1a"}
    q_10m = {"marks": 10, "part": "Part B", "question_number": "4"}
    q_5m = {"marks": 5, "part": "Part B", "question_number": "5a"}
    q_legacy_2m = {"marks": 2, "part": "Part A", "question_number": "1a"}

    assert classify_question_mark_type(q_1m) == "1m"
    assert classify_question_mark_type(q_10m) == "10m_direct"
    assert classify_question_mark_type(q_5m) == "5m_sub"
    assert classify_question_mark_type(q_legacy_2m) == "2m_legacy"


def test_eligible_60m_paper_structure_2_direct_3_pairs():
    """
    Test eligible 60M structure:
    - Part A: 10 questions x 1M = 10M
    - Part B: 2 direct 10M questions + 3 pairs of 5M questions (6 subquestions)
    - Total evaluated marks: 10 + 50 = 60 marks
    """
    paper = {
        "id": "paper-test-60m-1",
        "title": "MLRIT R22 Regular Exam Dec 2024",
        "regulation": "R22",
        "exam_year": 2024,
        "exam_type": "Regular",
    }
    questions = []
    # Part A: 10 x 1M
    for i in range(1, 11):
        questions.append({
            "id": f"q-a-{i}", "part": "Part A", "question_number": f"1{chr(96+i)}",
            "marks": 1, "question_text": f"Define short concept {i}"
        })
    # Part B: 2 direct 10M questions
    questions.append({
        "id": "q-b-1", "part": "Part B", "question_number": "2",
        "marks": 10, "question_text": "Explain Branch and Bound knapsack algorithm"
    })
    questions.append({
        "id": "q-b-2", "part": "Part B", "question_number": "3",
        "marks": 10, "question_text": "Explain Floyd Warshall all pairs shortest path"
    })
    # Part B: 3 pairs of 5M subquestions (6 questions)
    for pair_idx in range(1, 4):
        questions.append({
            "id": f"q-b-sub-{pair_idx}a", "part": "Part B", "question_number": f"{pair_idx+3}a",
            "marks": 5, "question_text": f"Explain mechanism part A {pair_idx}"
        })
        questions.append({
            "id": f"q-b-sub-{pair_idx}b", "part": "Part B", "question_number": f"{pair_idx+3}b",
            "marks": 5, "question_text": f"Explain mechanism part B {pair_idx}"
        })

    result = validate_paper_60m_structure(paper, questions)

    assert result["is_eligible"] is True
    assert result["status"] == PaperEligibilityStatus.ELIGIBLE_60M
    assert result["max_marks"] == 60
    assert result["part_a"]["one_mark_count"] == 10
    assert result["part_b"]["direct_10m_count"] == 2
    assert result["part_b"]["sub_5m_count"] == 6
    assert result["part_b"]["five_mark_pairs_count"] == 3
    assert result["marks_validation"]["total_marks"] == 60


def test_eligible_60m_paper_structure_3_direct_2_pairs():
    """
    Test eligible 60M structure:
    - Part A: 10 questions x 1M = 10M
    - Part B: 3 direct 10M questions + 2 pairs of 5M questions (4 subquestions)
    - Total evaluated marks: 10 + 50 = 60 marks
    """
    paper = {
        "id": "paper-test-60m-2",
        "title": "MLRIT R22 Regular Exam June 2025",
        "regulation": "R22",
        "exam_year": 2025,
        "exam_type": "Regular",
    }
    questions = []
    # Part A: 10 x 1M
    for i in range(1, 11):
        questions.append({
            "id": f"q-a-{i}", "part": "Part A", "question_number": f"1{chr(96+i)}",
            "marks": 1, "question_text": f"Define term {i}"
        })
    # Part B: 3 direct 10M questions
    for i in range(1, 4):
        questions.append({
            "id": f"q-b-10m-{i}", "part": "Part B", "question_number": f"{i+1}",
            "marks": 10, "question_text": f"Detailed question {i}"
        })
    # Part B: 2 pairs of 5M subquestions (4 questions)
    for pair_idx in range(1, 3):
        questions.append({
            "id": f"q-b-sub-{pair_idx}a", "part": "Part B", "question_number": f"{pair_idx+4}a",
            "marks": 5, "question_text": f"Sub question {pair_idx}a"
        })
        questions.append({
            "id": f"q-b-sub-{pair_idx}b", "part": "Part B", "question_number": f"{pair_idx+4}b",
            "marks": 5, "question_text": f"Sub question {pair_idx}b"
        })

    result = validate_paper_60m_structure(paper, questions)

    assert result["is_eligible"] is True
    assert result["status"] == PaperEligibilityStatus.ELIGIBLE_60M
    assert result["part_a"]["one_mark_count"] == 10
    assert result["part_b"]["direct_10m_count"] == 3
    assert result["part_b"]["sub_5m_count"] == 4
    assert result["part_b"]["five_mark_pairs_count"] == 2
    assert result["marks_validation"]["total_marks"] == 60


def test_exclude_70m_paper():
    """Exclude 70-mark paper (where Part A has 2-mark questions)."""
    paper = {
        "id": "paper-70m-legacy",
        "title": "MLRIT Legacy 70M Paper",
        "regulation": "R22",
        "exam_year": 2024,
        "exam_type": "Regular",
    }
    questions = []
    # Part A: 10 x 2M = 20M
    for i in range(1, 11):
        questions.append({
            "id": f"q-a-2m-{i}", "part": "Part A", "question_number": f"1{chr(96+i)}",
            "marks": 2, "question_text": f"Explain 2 mark question {i}"
        })
    # Part B: 5 x 10M = 50M
    for i in range(2, 7):
        questions.append({
            "id": f"q-b-{i}", "part": "Part B", "question_number": str(i),
            "marks": 10, "question_text": f"Long question {i}"
        })

    result = validate_paper_60m_structure(paper, questions)

    assert result["is_eligible"] is False
    assert result["status"] == PaperEligibilityStatus.EXCLUDED_70M
    assert "70-mark structure" in result["reason"]


def test_exclude_supplementary_paper():
    """Exclude supplementary/supply papers from current analysis."""
    paper = {
        "id": "paper-supp-1",
        "title": "MLRIT R22 Supplementary Examinations August 2024",
        "regulation": "R22",
        "exam_year": 2024,
        "exam_type": "Supplementary",
    }
    questions = [{"marks": 1, "part": "Part A"}] * 10

    result = validate_paper_60m_structure(paper, questions)

    assert result["is_eligible"] is False
    assert result["status"] == PaperEligibilityStatus.EXCLUDED_SUPPLEMENTARY
    assert "Supplementary papers are excluded" in result["reason"]


def test_exclude_years_outside_2024_2025():
    """Exclude papers from 2021, 2022, 2023."""
    for yr in [2021, 2022, 2023]:
        paper = {
            "id": f"paper-old-{yr}",
            "title": f"MLRIT R22 Exam {yr}",
            "regulation": "R22",
            "exam_year": yr,
            "exam_type": "Regular",
        }
        result = validate_paper_60m_structure(paper, [])
        assert result["is_eligible"] is False
        assert result["status"] == PaperEligibilityStatus.EXCLUDED_YEAR


def test_flag_missing_unreadable_marks():
    """Flag papers with all None / unreadable marks for manual review."""
    paper = {
        "id": "paper-ocr-fail",
        "title": "MLRIT R22 Exam Unreadable Marks",
        "regulation": "R22",
        "exam_year": 2025,
        "exam_type": "Regular",
    }
    questions = [
        {"id": f"q-{i}", "marks": None, "question_text": f"Text {i}"}
        for i in range(20)
    ]

    result = validate_paper_60m_structure(paper, questions)

    assert result["is_eligible"] is False
    assert result["status"] == PaperEligibilityStatus.FLAGGED_MISSING_MARKS
    assert "unreadable or missing marks" in result["reason"]


def test_direct_10m_and_5m_subquestions_never_mixed():
    """
    Do not mix direct 10M questions with 5M subquestions when calculating their individual frequencies.
    Show exact source papers for every repeated question.
    """
    questions = [
        # Paper 1: Direct 10M question on Knapsack
        {
            "id": "q1",
            "paper_id": "p1",
            "marks": 10,
            "part": "Part B",
            "question_number": "8",
            "exam_year": 2024,
            "question_text": "Explain 0/1 Knapsack problem using LC Branch and Bound technique with state space tree",
        },
        # Paper 2: Exact Repeated Direct 10M question on Knapsack
        {
            "id": "q2",
            "paper_id": "p2",
            "marks": 10,
            "part": "Part B",
            "question_number": "9a",
            "exam_year": 2024,
            "question_text": "Explain 0/1 Knapsack problem using LC Branch and Bound technique with state space tree",
        },
        # Paper 3: 5M Subquestion on Knapsack (Greedy fractional)
        {
            "id": "q3",
            "paper_id": "p3",
            "marks": 5,
            "part": "Part B",
            "question_number": "4a",
            "exam_year": 2024,
            "question_text": "Explain Fractional Knapsack problem using Greedy method",
        },
        # Paper 4: 5M Subquestion on Knapsack
        {
            "id": "q4",
            "paper_id": "p4",
            "marks": 5,
            "part": "Part B",
            "question_number": "5b",
            "exam_year": 2024,
            "question_text": "Explain Fractional Knapsack problem using Greedy method",
        },
        # Paper 1: 1M Part A question on Knapsack
        {
            "id": "q5",
            "paper_id": "p1",
            "marks": 1,
            "part": "Part A",
            "question_number": "1d",
            "exam_year": 2024,
            "question_text": "State the 0/1 Knapsack problem formulation",
        },
    ]

    paper_lookup = {
        "p1": {"id": "p1", "title": "MLRIT DAA Dec 2024 Regular", "exam_year": 2024},
        "p2": {"id": "p2", "title": "MLRIT DAA Feb 2024 Regular", "exam_year": 2024},
        "p3": {"id": "p3", "title": "MLRIT DAA May 2024 Regular", "exam_year": 2024},
        "p4": {"id": "p4", "title": "MLRIT DAA July 2024 Regular", "exam_year": 2024},
    }

    result = analyze_60m_question_frequencies(questions, paper_lookup=paper_lookup)

    summary = result["summary"]
    assert summary["direct_10m_questions_count"] == 2
    assert summary["subquestions_5m_count"] == 2
    assert summary["one_mark_questions_count"] == 1

    # Frequency analysis by mark type
    direct_10m_group = result["direct_10m_questions"]
    sub_5m_group = result["subquestions_5m"]
    one_mark_group = result["one_mark_questions"]

    # Direct 10M questions grouped together: count == 2
    assert direct_10m_group[0]["frequency"] == 2
    assert direct_10m_group[0]["mark_type"] == "10_marks_direct"
    assert direct_10m_group[0]["marks"] == 10

    # 5M subquestions grouped together: count == 2
    assert sub_5m_group[0]["frequency"] == 2
    assert sub_5m_group[0]["mark_type"] == "5_marks_sub"
    assert sub_5m_group[0]["marks"] == 5

    # 1M question: count == 1
    assert one_mark_group[0]["frequency"] == 1
    assert one_mark_group[0]["mark_type"] == "1_mark"
    assert one_mark_group[0]["marks"] == 1

    # Verify exact source papers are preserved and traceable
    src_papers_10m = direct_10m_group[0]["source_papers"]
    assert len(src_papers_10m) == 2
    assert any("Dec 2024" in s["paper_title"] for s in src_papers_10m)
    assert any("Feb 2024" in s["paper_title"] for s in src_papers_10m)
    assert any("Q8" in s["source_reference"] for s in src_papers_10m)


def test_frequency_analyzer_separate_mark_types():
    """Verify FrequencyAnalyzer does not merge 10M direct with 5M subquestions."""
    questions = [
        {"id": "1", "question_text": "Explain Banker's Algorithm with example", "marks": 10, "exam_year": 2024, "paper_id": "p1"},
        {"id": "2", "question_text": "Explain Banker's Algorithm with example", "marks": 5, "exam_year": 2024, "paper_id": "p2"},
    ]
    analyzer = FrequencyAnalyzer(questions)
    # Default separate_mark_types=True preserves mark isolation
    freq = analyzer.question_frequency(separate_mark_types=True)

    # They should be two separate entries because one is 10M direct and one is 5M subquestion!
    assert len(freq) == 2
    mark_types = {item["mark_type"] for item in freq}
    assert "10_marks_direct" in mark_types
    assert "5_marks_sub" in mark_types


def test_academic_question_intel_60m_filtering():
    """Test AcademicQuestionIntelligence filtering for 60M regular questions."""
    qs_10m = AcademicQuestionIntelligence.get_eligible_60m_questions(marks_type="10m_direct")
    assert len(qs_10m) > 0
    assert all(q.marks == 10 for q in qs_10m)
    assert all(q.is_direct_10m for q in qs_10m)
    assert all(q.exam_session == "Regular" for q in qs_10m)
    assert all(q.exam_year in (2024, 2025) for q in qs_10m)

    qs_5m = AcademicQuestionIntelligence.get_eligible_60m_questions(marks_type="5m_sub")
    assert len(qs_5m) > 0
    assert all(q.marks == 5 for q in qs_5m)
    assert all(q.is_subquestion_5m for q in qs_5m)

    qs_1m = AcademicQuestionIntelligence.get_eligible_60m_questions(marks_type="1m")
    assert len(qs_1m) > 0
    assert all(q.marks == 1 for q in qs_1m)


def test_mark_validation_adds_up_to_60():
    """Verify dynamic calculation that extracted Part A (10M) + Evaluated Part B (50M) = 60M."""
    paper = {
        "id": "paper-dyn-60m",
        "title": "MLRIT R22 Regular Exam Dec 2024",
        "regulation": "R22",
        "exam_year": 2024,
        "exam_type": "Regular",
    }
    questions = []
    # Part A: 10 questions x 1M = 10M
    for i in range(1, 11):
        questions.append({
            "id": f"qa-{i}", "part": "Part-A", "question_number": f"1{chr(96+i)}",
            "marks": 1, "unit_number": (i % 5) + 1, "question_text": f"Define term {i}"
        })
    # Part B: 5 units with internal choices
    # Unit 1: Q2 (10M) OR Q3 (5M + 5M)
    questions.append({"id": "qb-2", "part": "Part-B", "question_number": "2", "marks": 10, "unit_number": 1, "question_text": "Unit 1 direct 10M"})
    questions.append({"id": "qb-3a", "part": "Part-B", "question_number": "3a", "marks": 5, "unit_number": 1, "question_text": "Unit 1 sub 5M a"})
    questions.append({"id": "qb-3b", "part": "Part-B", "question_number": "3b", "marks": 5, "unit_number": 1, "question_text": "Unit 1 sub 5M b"})
    # Units 2-5: direct 10M questions
    for u in range(2, 6):
        questions.append({"id": f"qb-{u*2}", "part": "Part-B", "question_number": f"{u*2}", "marks": 10, "unit_number": u, "question_text": f"Unit {u} direct 10M"})
        questions.append({"id": f"qb-{u*2+1}", "part": "Part-B", "question_number": f"{u*2+1}", "marks": 10, "unit_number": u, "question_text": f"Unit {u} OR direct 10M"})

    val = validate_paper_60m_structure(paper, questions)
    assert val["is_eligible"] is True
    assert val["status"] == PaperEligibilityStatus.ELIGIBLE_60M
    m_val = val["marks_validation"]
    assert m_val["part_a_marks"] == 10
    assert m_val["part_b_marks"] == 50
    assert m_val["total_marks"] == 60
    assert m_val["is_valid_60m"] is True

    # Verify internal choices preserved
    choices = val["part_b"]["internal_choices"]
    assert len(choices) >= 5
    unit_1_choice = next(c for c in choices if c["unit"] == 1)
    assert "2" in unit_1_choice["choice_description"]
    assert "3a" in unit_1_choice["choice_description"] or "3b" in unit_1_choice["choice_description"]


def test_part_normalization_case_and_dashes():
    """Verify that 'Part-A', 'PART - A', 'Section A', 'Part-B' are all normalized properly."""
    paper = {
        "id": "paper-norm-test",
        "title": "MLRIT R22 Paper Normalization",
        "regulation": "R22",
        "exam_year": 2024,
        "exam_type": "Regular",
    }
    questions = [
        {"id": f"qa-{i}", "part": "PART - A", "marks": 1, "question_text": f"Part A Q{i}"}
        for i in range(10)
    ]
    for i in range(2, 7):
        questions.append({"id": f"qb-{i}", "part": "PART-B", "marks": 10, "question_text": f"Part B Q{i}"})

    val = validate_paper_60m_structure(paper, questions)
    assert val["is_eligible"] is True
    assert val["part_a"]["one_mark_count"] == 10
    assert val["part_b"]["direct_10m_count"] == 5


def test_academic_question_intel_60m_frequencies_source_titles():
    """Verify get_60m_question_frequencies produces readable paper titles and excludes 70M papers."""
    freq = AcademicQuestionIntelligence.get_60m_question_frequencies()
    assert "summary" in freq
    summary = freq["summary"]
    assert summary["one_mark_questions_count"] > 0
    assert summary["direct_10m_questions_count"] > 0
    assert summary["subquestions_5m_count"] > 0

    # Ensure all repeated questions carry valid source references with real titles
    for rep in freq["repeated_questions"]:
        for src in rep["source_papers"]:
            assert "MLRIT R22 Paper" in src["paper_title"] or len(src["paper_title"]) > 5
            assert "source_reference" in src
            assert len(src["source_reference"]) > 5
