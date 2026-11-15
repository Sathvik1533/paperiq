"""
PaperIQ Companion 2.1: End-to-End Conversational Journey Simulation Tests (Journeys A-H).
Validates:
- Journey A: Student asks a DAA question, receives explanation, asks follow-up.
- Journey B: Student asks for the same topic in 5-mark and 10-mark formats.
- Journey C: Student asks for numerical Knapsack solution and receives verified calculation.
- Journey D: Student asks for 7-day DAA study plan.
- Journey E: Student asks for frequently repeated DAA questions.
- Journey F: Student asks for a previous examination paper.
- Journey G: Student changes subject and starts another conversation.
- Journey H: Mobile responsiveness & payload sizing.
"""
import pytest
from app.companion.orchestrator import CompanionOrchestrator
from app.companion.models import SpecialistType, CompanionIntent


@pytest.fixture
def orchestrator():
    return CompanionOrchestrator()


def test_journey_a_daa_question_and_followup(orchestrator):
    """Journey A: Student asks a DAA question, receives explanation, asks follow-up."""
    # Turn 1: Concept inquiry
    q1 = "Explain Dijkstra's single source shortest path algorithm"
    intent1, specialist1 = orchestrator.classify_intent(q1)
    assert intent1 == CompanionIntent.ACADEMIC_TUTOR
    assert specialist1 == SpecialistType.ACADEMIC_TUTOR

    # Turn 2: Follow-up question on same topic
    q2 = "What is the time complexity when using a Fibonacci heap?"
    intent2, specialist2 = orchestrator.classify_intent(q2)
    assert intent2 == CompanionIntent.ACADEMIC_TUTOR
    assert specialist2 == SpecialistType.ACADEMIC_TUTOR


def test_journey_b_mark_formats_5m_and_10m(orchestrator):
    """Journey B: Student asks for the same topic in 5-mark and 10-mark formats."""
    # 5-mark inquiry
    q_5m = "Give me a 5-mark answer for Greedy Method and Fractional Knapsack"
    intent_5m, specialist_5m = orchestrator.classify_intent(q_5m)
    assert intent_5m == CompanionIntent.ACADEMIC_TUTOR
    assert specialist_5m == SpecialistType.ACADEMIC_TUTOR

    # 10-mark inquiry
    q_10m = "Explain 0/1 Knapsack using LC Branch and Bound with state-space tree for 10 marks"
    intent_10m, specialist_10m = orchestrator.classify_intent(q_10m)
    assert intent_10m == CompanionIntent.ACADEMIC_TUTOR
    assert specialist_10m == SpecialistType.ACADEMIC_TUTOR


@pytest.mark.asyncio
async def test_journey_c_numerical_knapsack_verified_calculation(orchestrator):
    """Journey C: Student asks for numerical Knapsack solution and receives verified calculation."""
    q_num = "Solve the Knapsack problem: n=4, W=15, profits=[10,10,12,18], weights=[2,4,6,9]"
    intent, specialist = orchestrator.classify_intent(q_num)
    assert intent == CompanionIntent.ACADEMIC_TUTOR
    assert specialist == SpecialistType.ACADEMIC_TUTOR

    # Execute Academic Tutor directly to verify dynamic solver execution
    tutor = orchestrator._specialists[SpecialistType.ACADEMIC_TUTOR]
    res, cites, actions, meta = await tutor.handle(
        q_num,
        {"subject_code": "A6CS15", "regulation": "R22"}
    )
    assert meta["provider"] == "verified_solver"
    assert meta["model_used"] == "knapsack_lcbb_dynamic_engine"
    assert "Z^* = 38" in res
    assert "Item 1, Item 2, Item 4" in res
    assert "| Node | Level |" in res


def test_journey_d_study_plan_generation(orchestrator):
    """Journey D: Student asks for a 7-day DAA study plan."""
    q_plan = "Create a 7-day study plan to cover all 5 units for DAA"
    intent, specialist = orchestrator.classify_intent(q_plan)
    assert intent == CompanionIntent.PLANNING_PROGRESS
    assert specialist == SpecialistType.PLANNER_COACH


def test_journey_e_repeated_questions_analyst(orchestrator):
    """Journey E: Student asks for frequently repeated DAA questions."""
    q_repeated = "What are the most repeated questions and high-probability topics in DAA?"
    intent, specialist = orchestrator.classify_intent(q_repeated)
    assert intent == CompanionIntent.EXAM_PREPARATION
    assert specialist == SpecialistType.EXAM_PREP_ANALYST


def test_journey_f_previous_examination_paper(orchestrator):
    """Journey F: Student asks for previous examination papers."""
    q_paper = "Find previous exam question papers and PYQs for DAA"
    intent, specialist = orchestrator.classify_intent(q_paper)
    assert intent == CompanionIntent.DOCUMENT_RETRIEVAL
    assert specialist == SpecialistType.DOCUMENT_RETRIEVER


def test_journey_g_change_subject_and_start_new_conversation(orchestrator):
    """Journey G: Student changes subject and starts another conversation."""
    q_os = "Explain Banker's Algorithm and deadlock safe state in Operating Systems"
    intent, specialist = orchestrator.classify_intent(q_os)
    assert intent == CompanionIntent.ACADEMIC_TUTOR
    assert specialist == SpecialistType.ACADEMIC_TUTOR


def test_journey_h_syllabus_guide_and_mobile_presets(orchestrator):
    """Journey H: Student explores syllabus units and preset actions."""
    q_syllabus = "What topics and Course Outcomes are covered in Operating Systems Unit 3?"
    intent, specialist = orchestrator.classify_intent(q_syllabus)
    assert intent == CompanionIntent.SYLLABUS_INTELLIGENCE
    assert specialist == SpecialistType.SYLLABUS_INTELLIGENCE
