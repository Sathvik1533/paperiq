"""
Planner API — Milestone 5 endpoints.

POST /planner/generate       — generate a study plan from an analysis report
GET  /planner/{plan_id}      — fetch a stored plan

POST /readiness/calculate    — compute readiness score
GET  /readiness              — fetch latest readiness score for subject+regulation

POST /mock/generate          — generate a mock exam
GET  /mock/{mock_id}         — fetch a stored mock exam

POST /activity               — log a user activity event
GET  /activity/summary       — summarised activity for subject+regulation
"""
import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.database import get_db
from app.planner.priority_ranker import PriorityRanker
from app.planner.schedule_builder import ScheduleBuilder
from app.planner.mock_generator import MockExamGenerator
from app.planner.readiness_scorer import ReadinessScorer
from app.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GeneratePlanRequest(BaseModel):
    report_id: str
    exam_date: str                      # ISO date string: "2026-06-20"
    hours_per_day: float = 4.0
    target_grade: Optional[str] = None
    regulation: str
    syllabus_id: str
    subject_id: str
    preparation_level: str = "intermediate"


class ReadinessRequest(BaseModel):
    user_id: str
    subject_id: str
    regulation: str
    study_plan_id: Optional[str] = None


class MockGenerateRequest(BaseModel):
    report_id: str
    regulation: str
    subject_id: str


class LogActivityRequest(BaseModel):
    user_id: str
    activity_type: str          # "study" | "practice" | "mock_exam" | "quiz"
    subject_id: str
    regulation: str
    reference_id: Optional[str] = None
    metadata: Optional[dict] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fetch_report(report_id: str, regulation: str) -> dict:
    """Fetch an analysis_report from DB and enforce regulation match."""
    db = get_db()
    result = (
        db.table("analysis_reports")
        .select("*")
        .eq("id", report_id)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail=f"Analysis report '{report_id}' not found")

    row = rows[0]
    report = row.get("report_data") or row

    # Regulation safety gate
    report_reg = report.get("regulation", "")
    if report_reg and report_reg != regulation:
        raise HTTPException(
            status_code=400,
            detail=f"Regulation mismatch: report has '{report_reg}', request has '{regulation}'.",
        )

    return report


# ---------------------------------------------------------------------------
# Study Plan endpoints
# ---------------------------------------------------------------------------

@router.post("/planner/generate", status_code=201)
async def generate_plan(req: GeneratePlanRequest):
    """
    Generate a personalised study plan from an analysis report.
    The report must belong to the same regulation as the request.
    """
    report = _fetch_report(req.report_id, req.regulation)

    ranker = PriorityRanker()
    priority_map = ranker.rank_topics(report, req.preparation_level)

    builder = ScheduleBuilder()
    schedule = builder.build(priority_map, req.exam_date, req.hours_per_day, req.preparation_level)

    plan_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    plan_record = {
        "id": plan_id,
        "subject_id": req.subject_id,
        "regulation": req.regulation,
        "syllabus_id": req.syllabus_id,
        "report_id": req.report_id,
        "exam_date": req.exam_date,
        "hours_per_day": req.hours_per_day,
        "preparation_level": req.preparation_level,
        "target_grade": req.target_grade,
        "plan_data": {
            "daily_plan": schedule["daily_plan"],
            "priority_map": priority_map,
            "warnings": schedule.get("warnings", []),
        },
        "created_at": now,
        "status": "active",
    }

    # Persist
    try:
        db = get_db()
        db.table("study_plans").insert(plan_record).execute()
    except Exception as e:
        log.warning(f"Could not persist study plan: {e}")

    return {
        "plan_id": plan_id,
        "daily_plan": schedule["daily_plan"],
        "priority_map": priority_map,
        "exam_date": req.exam_date,
        "total_days": schedule["total_days"],
        "study_days": schedule["study_days"],
        "warnings": schedule.get("warnings", []),
    }


@router.get("/planner/{plan_id}")
async def get_plan(plan_id: str):
    db = get_db()
    result = db.table("study_plans").select("*").eq("id", plan_id).limit(1).execute()
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return rows[0]


# ---------------------------------------------------------------------------
# Readiness Score endpoints
# ---------------------------------------------------------------------------

@router.post("/readiness/calculate", status_code=201)
async def calculate_readiness(req: ReadinessRequest):
    scorer = ReadinessScorer()
    result = scorer.score(
        user_id=req.user_id,
        subject_id=req.subject_id,
        regulation=req.regulation,
        study_plan_id=req.study_plan_id,
    )

    record_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    record = {
        "id": record_id,
        "user_id": req.user_id,
        "subject_id": req.subject_id,
        "regulation": req.regulation,
        "study_plan_id": req.study_plan_id,
        "score_data": result,
        "score": result["score"],
        "grade_prediction": result["grade_prediction"],
        "calculated_at": now,
    }

    try:
        db = get_db()
        db.table("readiness_scores").insert(record).execute()
    except Exception as e:
        log.warning(f"Could not persist readiness score: {e}")

    return {**result, "id": record_id}


@router.get("/readiness")
async def get_readiness(
    subject_id: str = Query(...),
    regulation: str = Query(...),
    user_id: str = Query(...),
):
    db = get_db()
    result = (
        db.table("readiness_scores")
        .select("*")
        .eq("subject_id", subject_id)
        .eq("regulation", regulation)
        .eq("user_id", user_id)
        .order("calculated_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="No readiness score found")
    return rows[0]


# ---------------------------------------------------------------------------
# Mock Exam endpoints
# ---------------------------------------------------------------------------

@router.post("/mock/generate", status_code=201)
async def generate_mock(req: MockGenerateRequest):
    report = _fetch_report(req.report_id, req.regulation)

    generator = MockExamGenerator()
    try:
        mock = generator.generate(report, req.regulation, req.subject_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.utcnow().isoformat()
    record = {
        "id": mock["mock_id"],
        "subject_id": req.subject_id,
        "regulation": req.regulation,
        "report_id": req.report_id,
        "mock_data": mock,
        "total_marks": mock["total_marks"],
        "part_a_count": mock["part_a_count"],
        "part_b_count": mock["part_b_count"],
        "created_at": now,
    }

    try:
        db = get_db()
        db.table("mock_exams").insert(record).execute()
    except Exception as e:
        log.warning(f"Could not persist mock exam: {e}")

    return {
        "mock_id": mock["mock_id"],
        "questions": mock["questions"],
        "total_marks": mock["total_marks"],
        "part_a_count": mock["part_a_count"],
        "part_b_count": mock["part_b_count"],
    }


@router.get("/mock/{mock_id}")
async def get_mock(mock_id: str):
    db = get_db()
    result = db.table("mock_exams").select("*").eq("id", mock_id).limit(1).execute()
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Mock exam not found")
    return rows[0]


# ---------------------------------------------------------------------------
# Activity logging endpoints
# ---------------------------------------------------------------------------

@router.post("/activity", status_code=201)
async def log_activity(req: LogActivityRequest):
    activity_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    record = {
        "id": activity_id,
        "user_id": req.user_id,
        "activity_type": req.activity_type,
        "subject_id": req.subject_id,
        "regulation": req.regulation,
        "reference_id": req.reference_id,
        "metadata": req.metadata or {},
        "created_at": now,
    }

    try:
        db = get_db()
        db.table("user_activity").insert(record).execute()
    except Exception as e:
        log.warning(f"Could not persist activity: {e}")

    return {"id": activity_id}


@router.get("/activity/summary")
async def get_activity_summary(
    subject_id: str = Query(...),
    regulation: str = Query(...),
    user_id: str = Query(...),
):
    try:
        db = get_db()
        result = (
            db.table("user_activity")
            .select("*")
            .eq("user_id", user_id)
            .eq("subject_id", subject_id)
            .eq("regulation", regulation)
            .order("created_at", desc=True)
            .execute()
        )
        activities = result.data or []
    except Exception as e:
        log.warning(f"Could not fetch activities: {e}")
        activities = []

    # Summarise by type
    summary: dict[str, int] = {}
    for a in activities:
        atype = a.get("activity_type", "unknown")
        summary[atype] = summary.get(atype, 0) + 1

    return {
        "user_id": user_id,
        "subject_id": subject_id,
        "regulation": regulation,
        "total_activities": len(activities),
        "by_type": summary,
        "recent": activities[:10],
    }
