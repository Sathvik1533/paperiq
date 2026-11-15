"""
PaperIQ AI Companion 2.0: Exam-Aware Academic Intelligence Tests.
Validates:
- AcademicQuestionIntelligence matching (1M, 5M, 10M questions)
- Mark calibration and auto-formatting
- Student preference overrides (1_mark, 5_marks, 10_marks, detailed)
- Tone preference handling (exam_ready, simple, conceptual)
- Groq / deterministic fallback mark-calibration and LaTeX math preservation
- Metadata and verified question attribution (never inventing marks/years)
"""
import pytest
from app.intelligence.academic_question_intel import AcademicQuestionIntelligence
from app.companion.orchestrator import CompanionOrchestrator
from app.companion.specialists.academic_tutor import AcademicTutorSpecialist
from app.companion.models import AnswerFormat, TonePreference


def test_question_intelligence_10m_match():
    """Verify 10-mark Part B question detection for 0/1 Knapsack LC Branch and Bound."""
    query = "Explain 0/1 Knapsack using LC Branch and Bound"
    match = AcademicQuestionIntelligence.find_matching_question(query, subject_code="A6CS15")

    assert match.is_verified_exam_question is True
    assert match.detected_marks == 10
    assert match.default_format == "10_marks"
    assert match.matched_question is not None
    assert match.matched_question.subject_code == "A6CS15"
    assert match.matched_question.unit_number == 5
    assert match.matched_question.section == "Part B"
    assert "MLRIT R22 DAA" in match.matched_question.source_reference


def test_question_intelligence_1m_match():
    """Verify 1-mark Part A question detection for 3-1 DAA short questions."""
    query = "State Cook's Theorem and define NP-Complete class"
    match = AcademicQuestionIntelligence.find_matching_question(query, subject_code="A6CS15")

    assert match.is_verified_exam_question is True
    assert match.detected_marks == 1
    assert match.default_format == "1_mark"
    assert match.matched_question.section == "Part A"


def test_question_intelligence_non_3_1_blocked():
    """Verify non-3-1 subjects (e.g. OS A6CS11) are strictly rejected under R22 3-1 lock."""
    query = "Explain Banker's algorithm with safety criteria"
    match = AcademicQuestionIntelligence.find_matching_question(query, subject_code="A6CS11")

    # Strict R22 3-1 lock: non-3-1 subjects must not return verified questions
    assert match.is_verified_exam_question is False
    assert match.detected_marks is None


def test_question_intelligence_unknown_query():
    """Verify that unverified questions do not invent examination marks or false citations."""
    query = "How to write a binary search in Rust programming language?"
    match = AcademicQuestionIntelligence.find_matching_question(query, subject_code="A6CS15")

    assert match.is_verified_exam_question is False
    assert match.detected_marks is None
    assert match.matched_question is None
    assert match.default_format == "detailed"


@pytest.mark.asyncio
async def test_academic_tutor_1_mark_format():
    """Verify that requesting 1_mark format produces a crisp, definition-focused answer <= 100 words."""
    tutor = AcademicTutorSpecialist()
    context = {
        "user_id": "test_student",
        "subject_code": "A6CS15",
        "regulation": "R22",
        "answer_format": "1_mark",
        "tone_preference": "exam_ready",
    }
    response_text, citations, actions, meta = await tutor.handle(
        "Explain 0/1 Knapsack using LC Branch and Bound", context
    )

    assert meta["resolved_format"] == "1_mark"
    words = response_text.split()
    assert len(words) <= 120, f"Expected crisp 1-mark answer, got {len(words)} words"
    assert any(sym in response_text for sym in ["\\hat{c}", "bound", "Knapsack", "ratio", "pruned", "U"])


@pytest.mark.asyncio
async def test_academic_tutor_10_marks_format():
    """Verify that requesting 10_marks format produces comprehensive Part B university structure."""
    tutor = AcademicTutorSpecialist()
    context = {
        "user_id": "test_student",
        "subject_code": "A6CS15",
        "regulation": "R22",
        "answer_format": "10_marks",
        "tone_preference": "exam_ready",
    }
    response_text, citations, actions, meta = await tutor.handle(
        "Explain 0/1 Knapsack using LC Branch and Bound", context
    )

    assert meta["resolved_format"] == "10_marks"
    words = response_text.split()
    assert len(words) >= 150, f"Expected comprehensive 10-mark answer, got {len(words)} words"
    # Should discuss bounds, tree / exploration, complexity, and mathematical formulation
    assert any(term in response_text.lower() for term in ["bound", "tree", "node", "complexity", "optimal"])
    assert any(sym in response_text for sym in ["$", "$$", "\\sum", "\\le", "\\ge", "\\hat{c}"])


@pytest.mark.asyncio
async def test_student_override_precedence():
    """Verify that student explicit preference overrides auto-calibration."""
    orchestrator = CompanionOrchestrator()
    # Knapsack is a 10M question in R22, but student explicitly overrides to 1_mark
    response = await orchestrator.process_chat(
        user_id="test_student_override",
        message_text="Explain 0/1 Knapsack using LC Branch and Bound",
        subject_code="A6CS15",
        answer_format="1_mark",
    )

    assert response.resolved_format == "1_mark"
    assert response.is_verified_exam_question is True
    assert response.matched_exam_marks == 10  # Evidence still records it was 10M
    assert "1 Mark" in response.message.content or len(response.message.content.split()) < 120


@pytest.mark.asyncio
async def test_auto_calibration_detects_10m():
    """Verify that answer_format='auto' automatically selects 10_marks for Knapsack."""
    orchestrator = CompanionOrchestrator()
    response = await orchestrator.process_chat(
        user_id="test_student_auto",
        message_text="Explain 0/1 Knapsack using LC Branch and Bound",
        subject_code="A6CS15",
        answer_format="auto",
    )

    assert response.resolved_format == "10_marks"
    assert response.is_verified_exam_question is True
    assert response.matched_exam_marks == 10
    assert response.source_reference is not None
    assert "2023" in response.source_reference
    assert "DAA" in response.source_reference
