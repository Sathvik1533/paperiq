"""
Profile API — Learner Profile & Onboarding
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.intelligence.learner_profiler import compute_learner_profile
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)


class OnboardingRequest(BaseModel):
    """
    Collect academic context only.
    NO manual skill level selection — auto-detected.
    """
    user_id: str
    college_id: str
    branch_id: str
    regulation: str
    current_year: int
    current_semester: int
    current_cgpa: float
    target_cgpa: float
    study_hours_per_day: float


@router.post("/onboarding")
async def complete_onboarding(req: OnboardingRequest):
    """
    Store user academic context and compute initial learner profile.
    
    Returns:
        {
            "success": true,
            "learner_profile": {
                "detected_skill_level": "Intermediate",
                "consistency_score": 50,
                "learning_pace": "Medium",
                ...
            }
        }
    """
    db = get_db()
    
    # Store user profile
    try:
        db.table("user_profiles").upsert({
            "id": req.user_id,
            "college_id": req.college_id,
            "branch_id": req.branch_id,
            "regulation": req.regulation,
            "current_year": req.current_year,
            "current_semester": req.current_semester,
            "current_cgpa": req.current_cgpa,
            "target_cgpa": req.target_cgpa,
            "study_hours_per_day": req.study_hours_per_day,
        }).execute()
    except Exception as e:
        log.error(f"Failed to store user profile: {e}")
        raise HTTPException(500, f"Failed to store profile: {e}")
    
    # Compute initial learner profile
    try:
        profile = compute_learner_profile(req.user_id)
    except Exception as e:
        log.error(f"Failed to compute learner profile: {e}")
        raise HTTPException(500, f"Failed to compute profile: {e}")
    
    return {
        "success": True,
        "data": {
            "message": "Onboarding complete",
            "learner_profile": profile,
        }
    }


@router.get("/profile/{user_id}")
async def get_learner_profile(user_id: str):
    """
    Get current learner profile.
    Re-computes on every request to ensure fresh data.
    """
    try:
        profile = compute_learner_profile(user_id)
        return {
            "success": True,
            "data": profile
        }
    except Exception as e:
        log.error(f"Failed to get learner profile: {e}")
        raise HTTPException(500, f"Failed to get profile: {e}")


@router.post("/profile/{user_id}/refresh")
async def refresh_learner_profile(user_id: str):
    """
    Force refresh learner profile.
    Call this after:
    - Mock exam completion
    - Readiness score calculation
    - Major study session
    """
    try:
        profile = compute_learner_profile(user_id)
        return {
            "success": True,
            "data": {
                "message": "Profile refreshed",
                "profile": profile
            }
        }
    except Exception as e:
        log.error(f"Failed to refresh profile: {e}")
        raise HTTPException(500, f"Failed to refresh: {e}")


@router.get("/profile/{user_id}/context")
async def get_user_context(user_id: str):
    """
    Get user academic context for filtering.
    """
    db = get_db()
    try:
        result = db.table("user_profiles").select(
            "college_id, branch_id, regulation, current_year, current_semester, "
            "current_cgpa, target_cgpa, study_hours_per_day"
        ).eq("id", user_id).single().execute()
        
        if not result.data:
            raise HTTPException(404, "User profile not found")
        
        return {
            "success": True,
            "data": result.data
        }
    except Exception as e:
        log.error(f"Failed to fetch user context: {e}")
        raise HTTPException(500, f"Failed to fetch context: {e}")
