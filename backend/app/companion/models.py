"""
Data models and schemas for the PaperIQ AI Companion 2.0.
Supports exam-aware academic question intelligence, mark calibrations (1M, 5M, 10M, Detailed),
and tone controls (Exam-ready English, Simple English, Detailed Conceptual).
"""
from __future__ import annotations
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone


class CompanionIntent(str, Enum):
    ACADEMIC_TUTOR = "academic_tutor"
    SYLLABUS_INTELLIGENCE = "syllabus_intelligence"
    EXAM_PREPARATION = "exam_preparation"
    PLANNING_PROGRESS = "planning_progress"
    DOCUMENT_RETRIEVAL = "document_retrieval"
    GENERAL_GUIDANCE = "general_guidance"


class SpecialistType(str, Enum):
    ACADEMIC_TUTOR = "academic_tutor"
    SYLLABUS_INTELLIGENCE = "syllabus_intelligence"
    EXAM_PREP_ANALYST = "exam_prep_analyst"
    PLANNER_COACH = "planner_coach"
    DOCUMENT_RETRIEVER = "document_retriever"
    GENERAL_MENTOR = "general_mentor"


class MessageRole(str, Enum):
    STUDENT = "student"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class AnswerFormat(str, Enum):
    AUTO = "auto"
    ONE_MARK = "1_mark"
    FIVE_MARKS = "5_marks"
    TEN_MARKS = "10_marks"
    DETAILED = "detailed"


class TonePreference(str, Enum):
    EXAM_READY = "exam_ready"       # Formal academic university phrasing aligned with evaluation rubrics
    SIMPLE = "simple"               # Clear, accessible English with intuitive analogies
    CONCEPTUAL = "conceptual"       # In-depth theory, proofs, and rigorous conceptual derivations


class Citation(BaseModel):
    source_type: str = Field(description="paper | syllabus | question | topic | schedule")
    reference_id: Optional[str] = None
    title: str
    url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SuggestedAction(BaseModel):
    label: str
    action_type: str = Field(description="navigate | query | filter")
    payload: str


class CompanionMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: MessageRole
    content: str
    intent: Optional[CompanionIntent] = None
    specialist: Optional[SpecialistType] = None
    citations: List[Citation] = Field(default_factory=list)
    suggested_actions: List[SuggestedAction] = Field(default_factory=list)
    provider: Optional[str] = Field(default=None, description="Active provider (groq | fallback)")
    model_used: Optional[str] = Field(default=None, description="Model ID used or 'deterministic_fallback'")
    is_fallback: bool = Field(default=False, description="True if response used deterministic fallback due to LLM failure")
    answer_format: Optional[str] = Field(default=None, description="1_mark | 5_marks | 10_marks | detailed")
    is_verified_exam_question: bool = Field(default=False, description="True if matched a verified past exam question")
    source_reference: Optional[str] = Field(default=None, description="Citation string from verified past paper")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CompanionConversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str = "New Study Session"
    subject_code: Optional[str] = None
    regulation: str = "R22"
    answer_format: str = "auto"     # "auto" | "1_mark" | "5_marks" | "10_marks" | "detailed"
    tone_preference: str = "exam_ready" # "exam_ready" | "simple" | "conceptual"
    unit_number: Optional[int] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    messages: List[CompanionMessage] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: Optional[str] = None
    subject_code: Optional[str] = None
    regulation: str = "R22"
    answer_format: Optional[str] = None      # Optional override: "auto", "1_mark", "5_marks", "10_marks", "detailed"
    tone_preference: Optional[str] = None    # Optional override: "exam_ready", "simple", "conceptual"
    unit_number: Optional[int] = None        # Optional active unit filter (1-5)


class ChatResponse(BaseModel):
    conversation_id: str
    message: CompanionMessage
    specialist_badge: str
    specialist_description: str
    suggested_actions: List[SuggestedAction] = Field(default_factory=list)
    provider: Optional[str] = Field(default=None, description="Active provider (groq | fallback)")
    model_used: Optional[str] = Field(default=None, description="Model ID used or 'deterministic_fallback'")
    is_fallback: bool = Field(default=False, description="True if response used deterministic fallback due to LLM failure")
    resolved_format: str = "detailed"       # Resolved mark format for this answer
    resolved_tone: str = "exam_ready"       # Resolved tone for this answer
    is_verified_exam_question: bool = False # Flag indicating genuine past exam match
    matched_exam_marks: Optional[int] = None # Verified marks from past paper (e.g. 1, 5, 10)
    matched_exam_year: Optional[int] = None  # Examination year of past occurrence
    source_reference: Optional[str] = None  # Exact source paper reference citation


class ConversationSummary(BaseModel):
    id: str
    title: str
    subject_code: Optional[str] = None
    regulation: str
    answer_format: str = "auto"
    tone_preference: str = "exam_ready"
    unit_number: Optional[int] = None
    message_count: int
    last_message_preview: Optional[str] = None
    created_at: str
    updated_at: str


class SpecialistCapabilityInfo(BaseModel):
    id: str
    name: str
    description: str
    sample_queries: List[str]
    badge_color: str
