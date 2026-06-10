"""
Feedback API — User feedback submission
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_admin_db, _verified_user_id
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)

class FeedbackRequest(BaseModel):
    page: str
    rating: int
    hours_saved: Optional[str] = None
    trigger: Optional[str] = None

@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    """Submit user feedback. Works for both authenticated and anonymous users."""
    db = get_admin_db()
    user_id = _verified_user_id.get()
    
    try:
        db.table("feedback").insert({
            "user_id": user_id,
            "page": req.page,
            "rating": req.rating,
            "hours_saved": req.hours_saved,
            "trigger": req.trigger,
        }).execute()
        
        return {"success": True, "data": {"message": "Feedback submitted"}}
    except Exception as e:
        log.error(f"Failed to submit feedback: {e}")
        raise HTTPException(500, f"Failed to submit feedback: {e}")
