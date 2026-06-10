"""
Analysis API endpoints.

POST /analysis/run          — trigger analysis, returns {report_id}
GET  /analysis/{report_id}  — full report
GET  /analysis/{report_id}/status
GET  /analysis/cached       — look up cached report
GET  /syllabus/{syllabus_id}/coverage  — evidence-based coverage (Gap #6)
POST /topics/map            — map questions→syllabus topics (Gap #7)
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.jobs.analysis_job import run_analysis_job
from app.intelligence.coverage_analyzer import compute_coverage
from app.intelligence.topic_mapper import map_questions_to_topics
from app.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

# Global job store (In-memory for basic tracking, replace with Redis for scale)
_job_store = {}

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class RunAnalysisRequest(BaseModel):
    subject_id: str
    regulation: str
    branch_id: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    exam_category: Optional[str] = None
    exam_attempt: Optional[str] = None


class SimplifiedAnalysisRequest(BaseModel):
    """
    Simplified analysis request for normal users.
    Auto-infers context from user profile.
    """
    user_id: str
    subject_id: str
    exam_category: str  # "Mid-1" | "Mid-2" | "Semester"
    exam_attempt: str = "Regular"  # "Regular" | "Supplementary"


class RunAnalysisResponse(BaseModel):
    report_id: str
    status: str = "processing"


# ---------------------------------------------------------------------------
# Supabase-backed caching (persists across restarts)
# ---------------------------------------------------------------------------
from app.database import get_admin_db

def _get_cache_key(kwargs: dict) -> str:
    return "|".join(f"{k}:{v}" for k, v in sorted(kwargs.items()) if v is not None)

async def _get_from_cache(key: str) -> Optional[dict]:
    try:
        db = get_admin_db()
        result = db.table("analysis_cache").select("data, expires_at").eq("cache_key", key).single().execute()
        if result.data:
            expires_at = result.data["expires_at"]
            if datetime.now(timezone.utc) < datetime.fromisoformat(expires_at):
                return result.data["data"]
            else:
                # Expired, delete it
                db.table("analysis_cache").delete().eq("cache_key", key).execute()
        return None
    except Exception as e:
        log.warning(f"Cache read failed: {e}")
        return None

async def _set_to_cache(key: str, val: dict, ttl_seconds: int = 3600):
    try:
        db = get_admin_db()
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)).isoformat()
        db.table("analysis_cache").upsert({
            "cache_key": key,
            "data": val,
            "expires_at": expires_at
        }).execute()
    except Exception as e:
        log.warning(f"Cache write failed: {e}")



# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/analysis/generate")
async def generate_analysis(req: RunAnalysisRequest):
    """
    Beta Student Experience: Synchronous analysis generation.
    Returns complete report immediately (no background job).
    """
    from app.analysis.report_builder import ReportBuilder
    
    try:
        builder = ReportBuilder()
        report = builder.build(
            subject_id=req.subject_id,
            regulation=req.regulation,
            branch_id=req.branch_id,
            year_from=req.year_from,
            year_to=req.year_to,
            exam_category=req.exam_category,
            exam_attempt=req.exam_attempt,
        )
        return {"success": True, "data": report}
    except Exception as e:
        log.warning(f"Database anomaly in Analysis generation: {e}")
        # Return a structured fallback schema so frontend stays completely active
        return {
            "success": False,
            "error": str(e),
            "data": {
                "unit_distribution_classified": {},
                "most_asked_topics": [],
                "high_probability_topics_classified": [],
                "study_priority_order": [],
                "repeated_questions": [],
                "question_count": 0,
                "coverage_analysis": {
                    "classification_coverage": 0,
                    "total_questions": 0,
                    "classified_questions": 0
                },
                "marks_distribution": None
            }
        }


@router.post("/analysis/run", response_model=RunAnalysisResponse, status_code=202)
async def run_analysis(req: RunAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Trigger an analysis job. Returns report_id immediately.
    The heavy work runs in background.
    
    Use this endpoint for manual/advanced analysis with full control.
    For normal users, use POST /analysis/simple instead.
    """
    import uuid
    report_id = str(uuid.uuid4())
    _job_store[report_id] = {"status": "processing", "report": None, "error": None}

    async def _run():
        try:
            report = await run_analysis_job(
                subject_id=req.subject_id,
                regulation=req.regulation,
                branch_id=req.branch_id,
                year_from=req.year_from,
                year_to=req.year_to,
                exam_category=req.exam_category,
                exam_attempt=req.exam_attempt,
            )
            # Use the DB-assigned report id
            actual_id = report.get("id", report_id)
            _job_store[report_id] = {"status": "ready", "report": report, "actual_id": actual_id}
        except Exception as e:
            log.error(f"Analysis job {report_id} failed: {e}")
            _job_store[report_id] = {"status": "failed", "report": None, "error": str(e)}

    background_tasks.add_task(_run)
    return RunAnalysisResponse(report_id=report_id)


@router.post("/analysis/simple", response_model=RunAnalysisResponse, status_code=202)
async def run_simple_analysis(req: SimplifiedAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Simplified analysis for normal users.
    
    Auto-infers from user profile:
    - College, branch, regulation (from onboarding)
    - Year range (last 5 years)
    
    User only provides:
    - Subject ID (from dropdown)
    - Exam category (Mid-1, Mid-2, Semester)
    - Exam attempt (Regular/Supplementary)
    
    Everything else is automatic.
    """
    db = get_db()
    
    # Fetch user profile
    try:
        profile_result = db.table("user_profiles").select(
            "college_id, branch_id, regulation, current_cgpa, target_cgpa, study_hours_per_day, preparation_level"
        ).eq("id", req.user_id).single().execute()
        
        if not profile_result.data:
            raise HTTPException(404, "User profile not found — complete onboarding first")
        
        profile = profile_result.data
        college_id = profile["college_id"]
        branch_id = profile["branch_id"]
        regulation = profile["regulation"]
        
    except Exception as e:
        log.error(f"Failed to fetch user profile: {e}")
        raise HTTPException(500, f"Failed to fetch profile: {e}")
    
    # Auto-set year range (last 5 years)
    import datetime
    current_year = datetime.datetime.now().year
    year_from = current_year - 5
    year_to = current_year
    
    log.info(f"[SimplifiedAnalysis] User {req.user_id}: {regulation} {req.subject_id} {req.exam_category} {req.exam_attempt}")
    
    # Trigger analysis job with inferred context
    import uuid
    report_id = str(uuid.uuid4())
    _job_store[report_id] = {"status": "processing", "report": None, "error": None}

    async def _run():
        try:
            report = await run_analysis_job(
                subject_id=req.subject_id,
                regulation=regulation,
                branch_id=branch_id,
                year_from=year_from,
                year_to=year_to,
                exam_category=req.exam_category,
                exam_attempt=req.exam_attempt,
                user_profile=profile
            )
            actual_id = report.get("id", report_id)
            _job_store[report_id] = {"status": "ready", "report": report, "actual_id": actual_id}
        except Exception as e:
            log.error(f"Simple analysis job {report_id} failed: {e}")
            _job_store[report_id] = {"status": "failed", "report": None, "error": str(e)}

    background_tasks.add_task(_run)
    return RunAnalysisResponse(report_id=report_id)


@router.get("/analysis/cached")
async def get_cached_report(
    subject_id: str = Query(...),
    regulation: str = Query(...),
    branch_id: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    exam_category: Optional[str] = Query(None),
    exam_attempt: Optional[str] = Query(None),
):
    """
    Returns the most recent non-expired cached report matching the params.
    """
    # Check memory cache first
    cache_key = _get_cache_key({
        "subject_id": subject_id,
        "regulation": regulation,
        "branch_id": branch_id,
        "year_from": year_from,
        "year_to": year_to,
        "exam_category": exam_category,
        "exam_attempt": exam_attempt
    })
    
    mem_cached = _get_from_cache(cache_key)
    if mem_cached:
        log.info("Returned analysis from memory cache")
        return mem_cached

    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    query = (
        db.table("analysis_reports")
        .select("*")
        .eq("subject_id", subject_id)
        .eq("regulation", regulation)
        .eq("status", "ready")
        .gt("expires_at", now_iso)
        .order("generated_at", desc=True)
        .limit(1)
    )
    if branch_id:
        query = query.eq("branch_id", branch_id)
    if year_from:
        query = query.eq("year_from", year_from)
    if year_to:
        query = query.eq("year_to", year_to)
    if exam_category:
        query = query.eq("exam_category", exam_category)
    if exam_attempt:
        query = query.eq("exam_attempt", exam_attempt)

    result = query.execute()
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="No cached report found")

    report = rows[0].get("report_data") or rows[0]
    _set_to_cache(cache_key, report, ttl_seconds=3600)
    return report


@router.get("/analysis/{report_id}/status")
async def get_report_status(report_id: str):
    """Returns current status of an analysis job."""
    # Check in-memory store first
    if report_id in _job_store:
        entry = _job_store[report_id]
        return {"report_id": report_id, "status": entry["status"]}

    # Fall back to DB
    db = get_db()
    result = db.table("analysis_reports").select("id, status").eq("id", report_id).limit(1).execute()
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report_id": report_id, "status": rows[0]["status"]}


@router.get("/analysis/{report_id}")
async def get_report(report_id: str):
    """Returns the full analysis report."""
    # Check in-memory store for freshly generated reports
    if report_id in _job_store:
        entry = _job_store[report_id]
        if entry["status"] == "processing":
            return {"report_id": report_id, "status": "processing"}
        if entry["status"] == "failed":
            raise HTTPException(status_code=500, detail=entry.get("error", "Analysis failed"))
        if entry["status"] == "ready" and entry.get("report"):
            return entry["report"]

    # Fetch from DB
    db = get_db()
    result = db.table("analysis_reports").select("*").eq("id", report_id).limit(1).execute()
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Report not found")

    row = rows[0]
    return row.get("report_data") or row


@router.get("/syllabus/{syllabus_id}/coverage")
async def get_syllabus_coverage(
    syllabus_id: str,
    subject_id: str = Query(...),
    regulation: str = Query(...),
    branch_id: Optional[str] = Query(None),
):
    """
    Gap #6: Evidence-based syllabus coverage analysis.
    Maps questions with topic_tags to syllabus topics via fuzzy matching.
    Returns per-unit and overall coverage percentages backed by real question evidence.
    """
    coverage = compute_coverage(
        subject_id=subject_id,
        regulation=regulation,
        syllabus_id=syllabus_id,
        branch_id=branch_id,
    )
    return {"success": True, "data": coverage}


class MapTopicsRequest(BaseModel):
    subject_id: str
    regulation: str
    branch_id: Optional[str] = None
    syllabus_id: Optional[str] = None


@router.post("/topics/map")
async def map_topics(req: MapTopicsRequest):
    """
    Gap #7: Map questions → syllabus topics via fuzzy matching.
    Populates question_topics junction table with confidence scores.
    Idempotent — safe to re-run.
    """
    result = map_questions_to_topics(
        subject_id=req.subject_id,
        regulation=req.regulation,
        branch_id=req.branch_id,
        syllabus_id=req.syllabus_id,
    )
    return {"success": True, "data": result}
