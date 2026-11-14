"""
PaperIQ AI Companion API Router.
Provides conversational endpoints, conversation persistence, and specialist orchestration.
Protected with JWT authentication, per-user rate limiting, and ownership verification.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List

from app.auth import get_current_user_id, verify_resource_access
from app.limiter import limiter
from app.companion.models import (
    ChatRequest, ChatResponse, ConversationSummary,
    CompanionConversation, SpecialistCapabilityInfo
)
from app.companion.orchestrator import get_companion_orchestrator
from app.companion.store import CompanionStore
from app.logger import get_logger

router = APIRouter(prefix="/companion", tags=["Companion"])
log = get_logger(__name__)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat_with_companion(
    request: Request,
    req: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Main conversational vertical slice:
    Student sends message → Authenticated request → Intent Routing → Specialist Execution
    → Grounded Response → Conversation Persisted → Response Delivered.
    """
    try:
        orchestrator = get_companion_orchestrator()
        response = await orchestrator.process_chat(
            user_id=user_id,
            message_text=req.message,
            conversation_id=req.conversation_id,
            subject_code=req.subject_code,
            regulation=req.regulation,
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"[CompanionChat] Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Companion error: {str(e)}")


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_user_conversations(
    user_id: str = Depends(get_current_user_id),
):
    """List all previous study sessions for the authenticated student."""
    return CompanionStore.list_conversations(user_id=user_id)


@router.get("/conversations/{conversation_id}", response_model=CompanionConversation)
async def get_conversation_history(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Retrieve full message history for a conversation. Enforces user ownership."""
    conv = CompanionStore.get_conversation(user_id=user_id, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    verify_resource_access(conv.user_id, user_id, is_public=False, resource_type="companion conversation")
    return conv


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a conversation session. Enforces user ownership."""
    conv = CompanionStore.get_conversation(user_id=user_id, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    verify_resource_access(conv.user_id, user_id, is_public=False, resource_type="companion conversation")

    success = CompanionStore.delete_conversation(user_id=user_id, conversation_id=conversation_id)
    return {"success": success, "conversation_id": conversation_id}


@router.get("/specialists", response_model=List[SpecialistCapabilityInfo])
async def get_specialist_capabilities():
    """Information on the 5 specialist intelligence capabilities."""
    return [
        SpecialistCapabilityInfo(
            id="academic_tutor",
            name="AI Academic Tutor",
            description="Concept walkthroughs, algorithm steps, formulas, and Part A (2M) & Part B (10M) exam-grade solutions.",
            sample_queries=[
                "Explain Banker's Algorithm with a numeric example.",
                "Derive the time complexity of Kruskal's algorithm.",
                "What is the difference between paging and segmentation?",
            ],
            badge_color="orange",
        ),
        SpecialistCapabilityInfo(
            id="syllabus_intelligence",
            name="Syllabus & Curriculum Intelligence",
            description="Official R22 curriculum breakdowns, Unit 1-5 topic mappings, Course Outcomes, and subject credits.",
            sample_queries=[
                "What topics are covered in Operating Systems Unit 3?",
                "Show me all R22 2-2 semester subjects.",
                "What are the Course Outcomes for Computer Organization?",
            ],
            badge_color="purple",
        ),
        SpecialistCapabilityInfo(
            id="exam_prep_analyst",
            name="Exam Pattern Analyst",
            description="Repeated question trends, high-probability exam predictions, and marks distributions across past papers.",
            sample_queries=[
                "What questions appear most frequently in DBMS?",
                "Which topics have the highest probability in Mid-1?",
                "Show me the marks distribution between Part A and Part B.",
            ],
            badge_color="blue",
        ),
        SpecialistCapabilityInfo(
            id="planner_coach",
            name="Study Planner Coach",
            description="Personalized study schedules, daily preparation targets, revision pacing, and Exam Readiness tracking.",
            sample_queries=[
                "I have my OS exam in 7 days, how should I schedule my study?",
                "How can I improve my Exam Readiness Score to 85%?",
                "Which units should I prioritize first for maximum marks?",
            ],
            badge_color="emerald",
        ),
        SpecialistCapabilityInfo(
            id="document_retriever",
            name="Academic Document Retriever",
            description="Searches and retrieves verified past question papers, official syllabus copies, and exam documents.",
            sample_queries=[
                "Show me the 2024 Semester paper for Java.",
                "Where can I download past papers for Discrete Math?",
                "Find questions on process scheduling from previous exams.",
            ],
            badge_color="cyan",
        ),
    ]
