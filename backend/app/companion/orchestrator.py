"""
Intent Routing and Orchestration Engine for PaperIQ AI Companion.
Classifies student intent and dispatches queries to specialist capabilities.
"""
import re
from typing import Dict, Any, Tuple, List

from app.companion.models import (
    CompanionIntent, SpecialistType, CompanionMessage, MessageRole,
    Citation, SuggestedAction, ChatResponse
)
from app.intelligence.academic_question_intel import AcademicQuestionIntelligence
from app.companion.specialists.base import BaseSpecialist
from app.companion.specialists.academic_tutor import AcademicTutorSpecialist
from app.companion.specialists.syllabus_intelligence import SyllabusIntelligenceSpecialist
from app.companion.specialists.exam_prep_analyst import ExamPrepAnalystSpecialist
from app.companion.specialists.planner_coach import PlannerCoachSpecialist
from app.companion.specialists.document_retriever import DocumentRetrieverSpecialist
from app.companion.specialists.general_guidance import GeneralGuidanceSpecialist
from app.companion.store import CompanionStore
from app.logger import get_logger

log = get_logger(__name__)


class CompanionOrchestrator:
    """Orchestrates intent classification and specialist dispatch."""

    def __init__(self):
        self._specialists: Dict[SpecialistType, BaseSpecialist] = {
            SpecialistType.ACADEMIC_TUTOR: AcademicTutorSpecialist(),
            SpecialistType.SYLLABUS_INTELLIGENCE: SyllabusIntelligenceSpecialist(),
            SpecialistType.EXAM_PREP_ANALYST: ExamPrepAnalystSpecialist(),
            SpecialistType.PLANNER_COACH: PlannerCoachSpecialist(),
            SpecialistType.DOCUMENT_RETRIEVER: DocumentRetrieverSpecialist(),
            SpecialistType.GENERAL_MENTOR: GeneralGuidanceSpecialist(),
        }

    def classify_intent(self, message: str) -> Tuple[CompanionIntent, SpecialistType]:
        text = message.lower().strip()

        # 1. Greetings & general help
        first_word = text.split()[0].rstrip(",.!?") if text.split() else ""
        if (
            text in {"hi", "hello", "hey", "help", "who are you", "what can you do", "start", "menu"}
            or first_word in {"hi", "hello", "hey"}
            or "what can you do" in text
            or "who are you" in text
        ):
            return CompanionIntent.GENERAL_GUIDANCE, SpecialistType.GENERAL_MENTOR

        # 2. Document Retrieval (past papers, downloads, files)
        doc_patterns = [
            r"\b(find|get|give|show|download|retrieve|open|fetch|share|list|access)\b.*?\b(paper|papers|qp|qps|pdf|file|pyq|pyqs)\b",
            r"\b(past|previous|old|sample|model|exam|semester|mid)\s+(year\s+)?(question\s+)?(paper|papers|qp|qps|pyq|pyqs)\b",
            r"\b(question\s+paper|question\s+papers|pyq|pyqs)\b",
            r"\b20[12][0-9]\s+(semester|mid|paper|exam)\b",
        ]
        if any(re.search(pat, text) for pat in doc_patterns):
            return CompanionIntent.DOCUMENT_RETRIEVAL, SpecialistType.DOCUMENT_RETRIEVER

        # 3. Planning & Progress (schedule, plan, readiness, days left)
        plan_patterns = [
            r"\b(study plan|schedule|routine|timetable|pacing)\b",
            r"\b(readiness|readiness score|score prediction)\b",
            r"\b(how should i prepare|days left|days remaining|how to study|revision plan)\b",
            r"\b([0-9]+\s*days?)\b.*?\b(prepare|study|cover|complete|plan|schedule)\b",
            r"\b(prepare|study|plan)\b.*?\b([0-9]+\s*days?)\b",
            r"\b(seven|7|five|5|ten|10|14|30|three|3|\d+)[ -]days?\b",
            r"\b(preparation plan|prep plan|masterplan|study plan|revision plan)\b",
            r"\b(prepare|prep|plan)\b.*?\b(plan|schedule|masterplan)\b",
            r"\bcreate\b.*?\bplan\b",
        ]
        if any(re.search(pat, text) for pat in plan_patterns):
            return CompanionIntent.PLANNING_PROGRESS, SpecialistType.PLANNER_COACH

        # 4. Exam Preparation & Pattern Analysis (repeated, frequency, predictions, marks breakdown, important questions)
        # Checked before syllabus so "important questions in unit 1" routes to Exam Prep Analyst
        exam_patterns = [
            r"\b(repeat|repeated|frequent|frequency|most asked)\b",
            r"\b(prediction|predict|predicted|probability|high yield|hot topic|trends?)\b",
            r"\b(marks breakdown|marks distribution|part a|part b|weightage)\b",
            r"\b(imp|important|likely|expected)\b.*?\b(question|questions|topics?)\b",
            r"\bquestions?\b.*?\b(important|repeated|expected)\b",
        ]
        if any(re.search(pat, text) for pat in exam_patterns):
            return CompanionIntent.EXAM_PREPARATION, SpecialistType.EXAM_PREP_ANALYST

        # 5. Syllabus & Curriculum Intelligence (units, syllabus, COs, credits, regulation)
        syllabus_patterns = [
            r"\b(syllabus|curriculum|course outcomes?|cos?|co[1-5]|credits?)\b",
            r"\b(unit [1-5]|unit i|unit ii|unit iii|unit iv|unit v)\b",
            r"\b(which unit|what unit|units covered|topics in unit)\b",
            r"\b(2-1|2-2|3-1|3-2)\s*subjects?\b",
        ]
        if any(re.search(pat, text) for pat in syllabus_patterns):
            return CompanionIntent.SYLLABUS_INTELLIGENCE, SpecialistType.SYLLABUS_INTELLIGENCE

        # 6. Academic Questions & Tutoring (concepts, algorithms, code, derivations, explanations)
        tutor_patterns = [
            r"\b(explain|derive|what is|how does|define|algorithm|solution|solve|proof|example|difference between|pseudocode|code)\b",
            r"\b(banker|deadlock|semaphore|paging|segmentation|b-tree|kruskal|prim|hasse|relational algebra|normal form|scheduling)\b",
        ]
        if any(re.search(pat, text) for pat in tutor_patterns):
            return CompanionIntent.ACADEMIC_TUTOR, SpecialistType.ACADEMIC_TUTOR

        # Default fallback: Academic Tutoring for content queries, General for unstructured
        if len(text.split()) > 3:
            return CompanionIntent.ACADEMIC_TUTOR, SpecialistType.ACADEMIC_TUTOR
        return CompanionIntent.GENERAL_GUIDANCE, SpecialistType.GENERAL_MENTOR

    async def process_chat(
        self,
        user_id: str,
        message_text: str,
        conversation_id: str | None = None,
        subject_code: str | None = None,
        regulation: str = "R22",
        answer_format: str | None = None,
        tone_preference: str | None = None,
        unit_number: int | None = None,
    ) -> ChatResponse:
        # 1. Get or create conversation record
        conv = CompanionStore.get_or_create_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
            subject_code=subject_code,
            regulation=regulation,
            answer_format=answer_format or "auto",
            tone_preference=tone_preference or "exam_ready",
            unit_number=unit_number,
        )

        # Resolve effective preferences: student request overrides conversation preferences
        eff_format = answer_format or conv.answer_format or "auto"
        eff_tone = tone_preference or conv.tone_preference or "exam_ready"
        eff_unit = unit_number if unit_number is not None else conv.unit_number
        eff_subject = subject_code or conv.subject_code

        # 2. Record student's incoming message
        student_msg = CompanionMessage(
            conversation_id=conv.id,
            role=MessageRole.STUDENT,
            content=message_text,
            answer_format=eff_format,
        )
        CompanionStore.add_message(user_id=user_id, conversation_id=conv.id, message=student_msg)

        # 3. Intent Classification
        intent, specialist_type = self.classify_intent(message_text)
        specialist = self._specialists.get(specialist_type, self._specialists[SpecialistType.GENERAL_MENTOR])

        # 4. Verified Academic Question Intelligence matching
        match_result = AcademicQuestionIntelligence.find_matching_question(
            query=message_text,
            subject_code=eff_subject,
            regulation=regulation,
        )

        # Resolve format if set to auto
        resolved_format = eff_format
        if resolved_format == "auto":
            resolved_format = match_result.default_format or "detailed"

        # 5. Context assembly
        context = {
            "user_id": user_id,
            "conversation_id": conv.id,
            "subject_code": eff_subject,
            "regulation": regulation,
            "history": conv.messages[-6:],
            "answer_format": resolved_format,
            "tone_preference": eff_tone,
            "unit_number": eff_unit,
            "question_match": match_result,
        }

        # 6. Execute Specialist
        res = await specialist.handle(message_text, context)
        if len(res) == 4:
            response_content, citations, suggested_actions, meta = res
        else:
            response_content, citations, suggested_actions = res
            meta = {}

        provider = meta.get("provider", "system")
        model_used = meta.get("model_used")
        is_fallback = meta.get("is_fallback", False)
        ans_format = meta.get("resolved_format", resolved_format)
        ans_tone = meta.get("resolved_tone", eff_tone)
        is_verified = meta.get("is_verified_exam_question", match_result.is_verified_exam_question)
        matched_marks = meta.get("matched_exam_marks", match_result.detected_marks)
        matched_year = meta.get("matched_exam_year", match_result.matched_question.exam_year if match_result.matched_question else None)
        source_ref = meta.get("source_reference", match_result.matched_question.source_reference if match_result.matched_question else None)

        # 7. Record assistant's response message
        assistant_msg = CompanionMessage(
            conversation_id=conv.id,
            role=MessageRole.ASSISTANT,
            content=response_content,
            intent=intent,
            specialist=specialist_type,
            citations=citations,
            suggested_actions=suggested_actions,
            provider=provider,
            model_used=model_used,
            is_fallback=is_fallback,
            answer_format=ans_format,
            is_verified_exam_question=is_verified,
            source_reference=source_ref,
        )
        CompanionStore.add_message(user_id=user_id, conversation_id=conv.id, message=assistant_msg)

        return ChatResponse(
            conversation_id=conv.id,
            message=assistant_msg,
            specialist_badge=specialist.badge,
            specialist_description=specialist.description,
            suggested_actions=suggested_actions,
            provider=provider,
            model_used=model_used,
            is_fallback=is_fallback,
            resolved_format=ans_format,
            resolved_tone=ans_tone,
            is_verified_exam_question=is_verified,
            matched_exam_marks=matched_marks,
            matched_exam_year=matched_year,
            source_reference=source_ref,
        )


_orchestrator: CompanionOrchestrator | None = None


def get_companion_orchestrator() -> CompanionOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = CompanionOrchestrator()
    return _orchestrator
