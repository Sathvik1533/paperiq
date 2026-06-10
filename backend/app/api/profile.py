"""
Profile API — Learner Profile & Onboarding
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_db, get_admin_db, _verified_user_id
from app.intelligence.learner_profiler import compute_learner_profile
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)

def verify_user_access(requested_user_id: str):
    """Enforce strict authentication to prevent race conditions and spoofing."""
    verified_id = _verified_user_id.get()
    if not verified_id:
        raise HTTPException(401, "Authentication required: Invalid or expired token")
    if verified_id != requested_user_id:
        raise HTTPException(403, "Forbidden: Cannot access another user's profile")


class OnboardingRequest(BaseModel):
    """
    Simplified onboarding — collect only essential data.
    
    For MLRIT R22 CSE students:
    - College, branch, regulation inferred automatically
    - Subject list auto-populated from knowledge base
    - Skill level auto-detected from CGPA and backlogs
    """
    user_id: str
    current_semester: int  # 2-1 → 3, 2-2 → 4
    current_cgpa: float
    backlogs_count: int
    upcoming_exam_type: str  # "Mid-1" | "Mid-2" | "Semester"
    study_hours_per_day: float


@router.post("/onboarding")
async def complete_onboarding(req: OnboardingRequest):
    """
    Simplified onboarding for MLRIT R22 CSE students.
    
    Automatic context resolution:
    - College: MLRIT (fixed)
    - Branch: CSE (fixed for now)
    - Regulation: R22 (inferred from semester)
    - Year: Inferred from semester (2-1/2-2 → Year 2)
    
    AI auto-detects:
    - Skill level from CGPA and backlogs
    - Academic risk level
    - Study intensity needs
    
    Returns learner profile with inferred characteristics.
    """
    verify_user_access(req.user_id)
    db = get_db()
    
    # Resolve college and branch
    college_result = db.table("colleges").select("id").eq("name", "MLRIT").execute()
    if not college_result.data:
        raise HTTPException(500, "College not found — knowledge base not initialized")
    college_id = college_result.data[0]["id"]
    
    branch_result = db.table("branches").select("id").eq(
        "name", "CSE"
    ).eq("college_id", college_id).execute()
    if not branch_result.data:
        raise HTTPException(500, "Branch not found — knowledge base not initialized")
    branch_id = branch_result.data[0]["id"]
    
    # Infer year and regulation from semester
    # 2-1 → semester 3, year 2
    # 2-2 → semester 4, year 2
    current_year = 2  # Fixed for MVP
    regulation = "R22"  # Fixed for MVP
    
    # Auto-detect skill level based on CGPA and backlogs
    if req.current_cgpa >= 8.0 and req.backlogs_count == 0:
        detected_skill_level = "Advanced"
    elif req.current_cgpa >= 6.5 or req.backlogs_count <= 2:
        detected_skill_level = "Intermediate"
    else:
        detected_skill_level = "Beginner"
    
    # Auto-detect target CGPA (aim for +0.5 improvement or maintain if already high)
    target_cgpa = min(10.0, req.current_cgpa + 0.5) if req.current_cgpa < 9.0 else req.current_cgpa
    
    log.info(f"[Onboarding] User {req.user_id}: CGPA={req.current_cgpa}, Backlogs={req.backlogs_count} → {detected_skill_level}")
    
    # Store user profile
    try:
        db.table("user_profiles").upsert({
            "id": req.user_id,
            "college_id": college_id,
            "branch_id": branch_id,
            "regulation": regulation,
            "current_year": current_year,
            "current_semester": req.current_semester,
            "current_cgpa": req.current_cgpa,
            "target_cgpa": target_cgpa,
            "study_hours_per_day": req.study_hours_per_day,
        }).execute()
    except Exception as e:
        log.error(f"Failed to store user profile: {e}")
        raise HTTPException(500, f"Failed to store profile: {e}")
    
    # Store initial learner profile
    try:
        db.table("learner_profiles").upsert({
            "user_id": req.user_id,
            "college_id": college_id,
            "branch_id": branch_id,
            "regulation": regulation,
            "current_year": current_year,
            "current_semester": req.current_semester,
            "current_cgpa": req.current_cgpa,
            "target_cgpa": target_cgpa,
            "study_hours_per_day": req.study_hours_per_day,
            "detected_skill_level": detected_skill_level,
            "consistency_score": 50.0,  # Neutral baseline
            "learning_pace": "Medium",  # Default
        }).execute()
    except Exception as e:
        log.error(f"Failed to store learner profile: {e}")
        raise HTTPException(500, f"Failed to store profile: {e}")
    
    # Compute full learner profile
    try:
        profile = compute_learner_profile(req.user_id)
    except Exception as e:
        log.error(f"Failed to compute learner profile: {e}")
        # Return basic profile if computation fails
        profile = {
            "detected_skill_level": detected_skill_level,
            "current_cgpa": req.current_cgpa,
            "target_cgpa": target_cgpa,
            "backlogs_count": req.backlogs_count,
            "upcoming_exam": req.upcoming_exam_type,
        }
    
    return {
        "success": True,
        "data": {
            "message": "Onboarding complete",
            "learner_profile": profile,
            "inferred_context": {
                "college": "MLRIT",
                "branch": "CSE",
                "regulation": regulation,
                "year": current_year,
                "skill_level": detected_skill_level,
            }
        }
    }


@router.get("/profile/{user_id}")
async def get_learner_profile(user_id: str):
    """
    Get current learner profile.
    Re-computes on every request to ensure fresh data.
    """
    verify_user_access(user_id)
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
    verify_user_access(user_id)
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
    verify_user_access(user_id)
    db = get_db()
    try:
        result = db.table("user_profiles").select(
            "college_id, branch_id, regulation, current_year, current_semester, "
            "current_cgpa, target_cgpa, study_hours_per_day, preparation_level"
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


@router.get("/profile/{user_id}/subjects")
async def get_user_subjects(user_id: str):
    """
    Get subjects available for user's semester.
    Auto-filtered by regulation, branch, semester from onboarding.
    
    Returns list of subjects user can select from.
    """
    verify_user_access(user_id)
    db = get_db()
    
    # Get user context
    try:
        profile_result = db.table("user_profiles").select(
            "college_id, branch_id, regulation, current_semester"
        ).eq("id", user_id).single().execute()
        
        if not profile_result.data:
            raise HTTPException(404, "User profile not found")
        
        profile = profile_result.data
        
    except Exception as e:
        log.error(f"Failed to fetch user profile: {e}")
        raise HTTPException(500, f"Failed to fetch profile: {e}")
    
    # Fetch subjects for user's context
    try:
        subjects_result = db.table("subjects").select(
            "id, code, name, semester, regulation"
        ).eq("college_id", profile["college_id"]).eq(
            "branch_id", profile["branch_id"]
        ).eq("regulation", profile["regulation"]).eq(
            "semester", profile["current_semester"]
        ).order("code").execute()
        
        return {
            "success": True,
            "data": {
                "subjects": subjects_result.data or [],
                "semester": profile["current_semester"],
                "regulation": profile["regulation"]
            }
        }
    
    except Exception as e:
        log.error(f"Failed to fetch subjects: {e}")
        raise HTTPException(500, f"Failed to fetch subjects: {e}")


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    regulation: Optional[str] = None
    current_semester: Optional[int] = None
    current_cgpa: Optional[float] = None
    target_cgpa: Optional[float] = None
    study_hours_per_day: Optional[float] = None
    preparation_level: Optional[str] = None
    has_completed_tour: Optional[bool] = None


@router.put("/profile/{user_id}")
async def upsert_profile(user_id: str, req: ProfileUpdateRequest):
    """Upsert user profile — updates only provided fields."""
    verify_user_access(user_id)
    db = get_admin_db()
    try:
        update_fields = {k: v for k, v in req.model_dump().items() if v is not None}
        if not update_fields:
            raise HTTPException(400, "No fields to update")
        
        update_fields["id"] = user_id
        db.table("user_profiles").upsert(update_fields).execute()
        
        result = db.table("user_profiles").select("*").eq("id", user_id).single().execute()
        return {"success": True, "data": result.data}
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to upsert profile for {user_id}: {e}")
        raise HTTPException(500, f"Failed to update profile: {e}")


@router.delete("/profile/{user_id}")
async def delete_profile(user_id: str):
    """Delete user account — removes user_profiles and learner_profiles."""
    verify_user_access(user_id)
    db = get_admin_db()
    try:
        db.table("learner_profiles").delete().eq("user_id", user_id).execute()
        db.table("user_profiles").delete().eq("id", user_id).execute()
        return {"success": True, "data": {"message": "Account deleted"}}
    except Exception as e:
        log.error(f"Failed to delete profile for {user_id}: {e}")
        raise HTTPException(500, f"Failed to delete account: {e}")


@router.get("/subjects/filter")
async def filter_subjects(semester: int, regulation: str):
    """Get subjects by semester+regulation (no college_id required)."""
    db = get_admin_db()
    try:
        result = db.table("subjects").select(
            "id, code, name, semester, regulation"
        ).eq("semester", semester).eq("regulation", regulation).order("code").execute()
        
        return {"success": True, "data": result.data or []}
    except Exception as e:
        log.error(f"Failed to filter subjects: {e}")
        raise HTTPException(500, f"Failed to fetch subjects: {e}")
