"""
Persistence layer for PaperIQ AI Companion conversations and messages.
Provides user-isolated persistence with DB synchronization and resilient local fallback.
"""
import threading
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
from fastapi import HTTPException

from app.database import get_db
from app.logger import get_logger
from app.companion.models import (
    CompanionConversation, CompanionMessage, ConversationSummary,
    MessageRole, CompanionIntent, SpecialistType, Citation, SuggestedAction
)

log = get_logger(__name__)

# Fallback in-memory store: user_id -> dict[conv_id, CompanionConversation]
_conv_lock = threading.Lock()
_memory_conversations: Dict[str, Dict[str, CompanionConversation]] = {}


def _safe_get_db():
    try:
        return get_db()
    except Exception:
        return None


class CompanionStore:
    """Manages conversations and message history with multi-tenant user isolation."""

    @classmethod
    def conversation_exists_for_any_user(cls, conversation_id: str) -> bool:
        """Checks if a conversation ID exists for ANY user in memory or DB."""
        with _conv_lock:
            for user_convs in _memory_conversations.values():
                if conversation_id in user_convs:
                    return True

        db = _safe_get_db()
        if db:
            try:
                res = db.table("companion_conversations").select("id").eq("id", conversation_id).limit(1).execute()
                if res.data:
                    return True
            except Exception:
                pass
        return False

    @classmethod
    def get_or_create_conversation(
        cls,
        user_id: str,
        conversation_id: Optional[str] = None,
        subject_code: Optional[str] = None,
        regulation: str = "R22",
        title: Optional[str] = None,
    ) -> CompanionConversation:
        if conversation_id:
            # 1. First check in-memory store
            with _conv_lock:
                if user_id in _memory_conversations and conversation_id in _memory_conversations[user_id]:
                    conv = _memory_conversations[user_id][conversation_id]
                    if subject_code and not conv.subject_code:
                        conv.subject_code = subject_code
                    return conv

                # Cross-tenant check: if conversation belongs to another user, forbid access
                for other_user_id, convs in _memory_conversations.items():
                    if other_user_id != user_id and conversation_id in convs:
                        raise HTTPException(
                            status_code=403,
                            detail="Forbidden: Cannot access another user's conversation",
                        )

            # 2. Try fetching from DB
            db = _safe_get_db()
            if db:
                try:
                    # Check if conversation exists at all in DB
                    res_any = db.table("companion_conversations").select("id, user_id").eq("id", conversation_id).limit(1).execute()
                    if res_any.data:
                        owner = res_any.data[0].get("user_id")
                        if owner != user_id:
                            raise HTTPException(
                                status_code=403,
                                detail="Forbidden: Cannot access another user's conversation",
                            )
                        # Owner matches, load full conversation
                        res = db.table("companion_conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).limit(1).execute()
                        if res.data:
                            row = res.data[0]
                            msg_res = db.table("companion_messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
                            messages = [
                                CompanionMessage(
                                    id=m["id"],
                                    conversation_id=m["conversation_id"],
                                    role=MessageRole(m["role"]),
                                    content=m["content"],
                                    intent=CompanionIntent(m["intent"]) if m.get("intent") else None,
                                    specialist=SpecialistType(m["specialist"]) if m.get("specialist") else None,
                                    citations=[Citation(**c) for c in (m.get("citations") or [])],
                                    suggested_actions=[SuggestedAction(**a) for a in (m.get("suggested_actions") or [])],
                                    created_at=m["created_at"],
                                ) for m in (msg_res.data or [])
                            ]
                            conv = CompanionConversation(
                                id=row["id"],
                                user_id=row["user_id"],
                                title=row.get("title") or "Study Session",
                                subject_code=row.get("subject_code"),
                                regulation=row.get("regulation") or "R22",
                                created_at=row["created_at"],
                                updated_at=row["updated_at"],
                                messages=messages,
                            )
                            with _conv_lock:
                                if user_id not in _memory_conversations:
                                    _memory_conversations[user_id] = {}
                                _memory_conversations[user_id][conv.id] = conv
                            return conv
                except HTTPException:
                    raise
                except Exception as e:
                    log.debug(f"[CompanionStore] DB read fallback: {e}")

            # If a specific conversation_id was supplied by caller but not found, reject with 404
            raise HTTPException(
                status_code=404,
                detail=f"Conversation '{conversation_id}' not found",
            )

        # 3. Create brand new conversation with fresh unique UUID
        new_id = str(uuid.uuid4())
        initial_title = title or ("Study Session" if not subject_code else f"{subject_code.upper()} Prep Session")
        now_str = datetime.now(timezone.utc).isoformat()
        conv = CompanionConversation(
            id=new_id,
            user_id=user_id,
            title=initial_title,
            subject_code=subject_code,
            regulation=regulation,
            created_at=now_str,
            updated_at=now_str,
            messages=[],
        )

        with _conv_lock:
            if user_id not in _memory_conversations:
                _memory_conversations[user_id] = {}
            _memory_conversations[user_id][conv.id] = conv

        # Try persisting to DB
        db = _safe_get_db()
        if db:
            try:
                db.table("companion_conversations").insert({
                    "id": conv.id,
                    "user_id": conv.user_id,
                    "title": conv.title,
                    "subject_code": conv.subject_code,
                    "regulation": conv.regulation,
                    "created_at": conv.created_at,
                    "updated_at": conv.updated_at,
                }).execute()
            except Exception as e:
                log.debug(f"[CompanionStore] DB insert fallback for conv {conv.id}: {e}")

        return conv

    @classmethod
    def add_message(
        cls,
        user_id: str,
        conversation_id: str,
        message: CompanionMessage,
    ) -> CompanionMessage:
        conv = cls.get_or_create_conversation(user_id=user_id, conversation_id=conversation_id)
        with _conv_lock:
            conv.messages.append(message)
            conv.updated_at = datetime.now(timezone.utc).isoformat()
            # If title is generic and this is first user message, update title
            if conv.title in ("New Study Session", "Study Session") and message.role == MessageRole.STUDENT:
                preview = message.content[:40].strip()
                conv.title = f"{preview}..." if len(message.content) > 40 else preview

        # Try persisting to DB
        db = _safe_get_db()
        if db:
            try:
                db.table("companion_messages").insert({
                    "id": message.id,
                    "conversation_id": conversation_id,
                    "role": message.role.value,
                    "content": message.content,
                    "intent": message.intent.value if message.intent else None,
                    "specialist": message.specialist.value if message.specialist else None,
                    "citations": [c.dict() for c in message.citations],
                    "suggested_actions": [a.dict() for a in message.suggested_actions],
                    "created_at": message.created_at,
                }).execute()

                db.table("companion_conversations").update({
                    "title": conv.title,
                    "updated_at": conv.updated_at,
                }).eq("id", conversation_id).execute()
            except Exception as e:
                log.debug(f"[CompanionStore] DB insert message fallback: {e}")

        return message

    @classmethod
    def get_conversation(cls, user_id: str, conversation_id: str) -> Optional[CompanionConversation]:
        with _conv_lock:
            # Check if this belongs to another user in memory
            for other_user_id, convs in _memory_conversations.items():
                if other_user_id != user_id and conversation_id in convs:
                    raise HTTPException(
                        status_code=403,
                        detail="Forbidden: Cannot access another user's conversation",
                    )
            user_convs = _memory_conversations.get(user_id, {})
            if conversation_id in user_convs:
                return user_convs[conversation_id]

        # Try DB query with strict user_id check
        db = _safe_get_db()
        if db:
            try:
                res_any = db.table("companion_conversations").select("user_id").eq("id", conversation_id).limit(1).execute()
                if res_any.data:
                    owner = res_any.data[0].get("user_id")
                    if owner != user_id:
                        raise HTTPException(
                            status_code=403,
                            detail="Forbidden: Cannot access another user's conversation",
                        )
                res = db.table("companion_conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).limit(1).execute()
                if not res.data:
                    return None
                row = res.data[0]
                msg_res = db.table("companion_messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
                messages = [
                    CompanionMessage(
                        id=m["id"],
                        conversation_id=m["conversation_id"],
                        role=MessageRole(m["role"]),
                        content=m["content"],
                        intent=CompanionIntent(m["intent"]) if m.get("intent") else None,
                        specialist=SpecialistType(m["specialist"]) if m.get("specialist") else None,
                        citations=[Citation(**c) for c in (m.get("citations") or [])],
                        suggested_actions=[SuggestedAction(**a) for a in (m.get("suggested_actions") or [])],
                        created_at=m["created_at"],
                    ) for m in (msg_res.data or [])
                ]
                conv = CompanionConversation(
                    id=row["id"],
                    user_id=row["user_id"],
                    title=row.get("title") or "Study Session",
                    subject_code=row.get("subject_code"),
                    regulation=row.get("regulation") or "R22",
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                    messages=messages,
                )
                with _conv_lock:
                    if user_id not in _memory_conversations:
                        _memory_conversations[user_id] = {}
                    _memory_conversations[user_id][conv.id] = conv
                return conv
            except HTTPException:
                raise
            except Exception:
                return None

        return None

    @classmethod
    def list_conversations(cls, user_id: str) -> List[ConversationSummary]:
        summaries: List[ConversationSummary] = []
        with _conv_lock:
            user_convs = _memory_conversations.get(user_id, {})
            for conv in user_convs.values():
                last_msg = conv.messages[-1].content if conv.messages else None
                summaries.append(ConversationSummary(
                    id=conv.id,
                    title=conv.title,
                    subject_code=conv.subject_code,
                    regulation=conv.regulation,
                    message_count=len(conv.messages),
                    last_message_preview=last_msg[:60] if last_msg else None,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                ))

        # Sort descending by updated_at
        summaries.sort(key=lambda s: s.updated_at, reverse=True)
        return summaries

    @classmethod
    def delete_conversation(cls, user_id: str, conversation_id: str) -> bool:
        with _conv_lock:
            for other_user_id, convs in _memory_conversations.items():
                if other_user_id != user_id and conversation_id in convs:
                    raise HTTPException(
                        status_code=403,
                        detail="Forbidden: Cannot delete another user's conversation",
                    )
            user_convs = _memory_conversations.get(user_id, {})
            deleted = False
            if conversation_id in user_convs:
                del user_convs[conversation_id]
                deleted = True

        db = _safe_get_db()
        if db:
            try:
                res_any = db.table("companion_conversations").select("user_id").eq("id", conversation_id).limit(1).execute()
                if res_any.data:
                    owner = res_any.data[0].get("user_id")
                    if owner != user_id:
                        raise HTTPException(
                            status_code=403,
                            detail="Forbidden: Cannot delete another user's conversation",
                        )
                db.table("companion_messages").delete().eq("conversation_id", conversation_id).execute()
                db.table("companion_conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()
                deleted = True
            except HTTPException:
                raise
            except Exception:
                pass

        return deleted
