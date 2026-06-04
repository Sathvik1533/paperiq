"""
Analysis API endpoints.

POST /analysis/run          — trigger analysis, returns {report_id}
GET  /analysis/{report_id}  — full report
GET  /analysis/{report_id}/status
GET  /analysis/cached       — look up cached report
GET  /syllabus/{syllabus_id}/coverage  — placeholder for M4b
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database import get_db
from app.jobs.analysis_job import run_analysis_job
from app.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class RunAnalysisRequest(BaseModel):
    subject_id: str
    regulation: str
    branch_id: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None


class RunAnalysisResponse(BaseModel):
    report_id: str
    status: str = "processing"


# ---------------------------------------------------------------------------
# In-memory job tracker (report_id → status/result)
# For production, this would live in Redis or the DB.
# ---------------------------------------------------------------------------
_job_store: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/analysis/run", response_model=RunAnalysisResponse, status_code=202)
async def run_analysis(req: RunAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Trigger an analysis job. Returns report_id immediately.
    The heavy work runs in background.
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
            )
            # Use the DB-assigned report id
            actual_id = report.get("id", report_id)
            _job_store[report_id] = {"status": "ready", "report": report, "actual_id": actual_id}
        except Exception as e:
            log.error(f"Analysis job {report_id} failed: {e}")
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
):
    """
    Returns the most recent non-expired cached report matching the params.
    """
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

    result = query.execute()
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="No cached report found")

    return rows[0].get("report_data") or rows[0]


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
async def get_syllabus_coverage(syllabus_id: str):
    """Placeholder for M4b — syllabus coverage analysis."""
    return {"syllabus_id": syllabus_id, "coverage": {}}
