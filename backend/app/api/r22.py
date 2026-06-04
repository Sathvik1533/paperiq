"""
R22 2-2 Auto-Pipeline API.

Single endpoint: POST /r22/analyze
  - User provides: subject_code (e.g. "A6CS09")
  - System does everything: crawl → extract → parse → analyze → return report_id
  - No file uploads required
  - No manual pipeline steps

GET /r22/subjects  — list all R22 2-2 subjects
GET /r22/status/{subject_code}  — papers and questions found so far
"""
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from app.scrapers.colleges.mlrit_r22 import R22_SUBJECTS
from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)

MLRIT_COLLEGE_ID = "a0000000-0000-0000-0000-000000000001"


class AnalyzeRequest(BaseModel):
    subject_code: str
    year_from: int = 2021
    year_to: int = 2025
    force_refresh: bool = False


@router.get("/r22/subjects")
async def list_r22_subjects(branch: Optional[str] = None):
    """
    List all R22 2-2 subjects known to PaperIQ.
    Optionally filter by branch (CSE, IT, ECE, EEE, MECH, AI, DS, CY, ALL).
    """
    subjects = []
    for code, info in R22_SUBJECTS.items():
        if branch and info["branch"] not in (branch.upper(), "ALL") and branch.upper() != "ALL":
            continue
        # Check how many papers we already have
        db = get_db()
        try:
            pcount = db.table("papers").select("id", count="exact").eq("regulation", "R22").execute()
            qcount = db.table("questions").select("id", count="exact").eq("regulation", "R22").execute()
        except Exception:
            pcount = None
            qcount = None

        subjects.append({
            "code"        : code,
            "name"        : info["name"],
            "branch"      : info["branch"],
            "short"       : info["short"],
            "regulation"  : "R22",
            "semester"    : 2,
            "btech_year"  : 2,
        })

    return {"success": True, "data": subjects, "meta": {"total": len(subjects)}}


@router.get("/r22/subjects/{subject_code}")
async def get_r22_subject(subject_code: str):
    """Get subject info and available paper count."""
    code = subject_code.upper()
    info = R22_SUBJECTS.get(code)
    if not info:
        raise HTTPException(404, f"Unknown R22 subject code: {code}")

    db = get_db()
    # Find subject_id
    sub = db.table("subjects").select("id").eq("code", code).limit(1).execute()
    subject_id = sub.data[0]["id"] if sub.data else None

    paper_count = 0
    question_count = 0
    if subject_id:
        papers = db.table("papers").select("id").eq("subject_id", subject_id).execute()
        paper_count = len(papers.data or [])
        questions = db.table("questions").select("id").eq("subject_id", subject_id).execute()
        question_count = len(questions.data or [])

    return {
        "success": True,
        "data": {
            "code"          : code,
            "name"          : info["name"],
            "branch"        : info["branch"],
            "short"         : info["short"],
            "regulation"    : "R22",
            "semester"      : 2,
            "btech_year"    : 2,
            "subject_id"    : subject_id,
            "papers_available": paper_count,
            "questions_parsed": question_count,
            "ready_for_analysis": question_count > 0,
        }
    }


@router.post("/r22/analyze")
async def analyze_r22_subject(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Full auto-pipeline for one R22 2-2 subject.

    Steps (all automatic):
    1. Crawl MLRIT portal → download matching archives
    2. Extract docx files matching subject_code
    3. Parse questions
    4. Run analysis
    5. Return report_id

    Returns {job_id, status, subject_code, subject_name}
    """
    code = req.subject_code.upper()
    info = R22_SUBJECTS.get(code)
    if not info:
        raise HTTPException(400, f"Unknown subject code '{code}'. Use GET /r22/subjects to see valid codes.")

    from app.jobs.job_manager import create_job
    job = create_job(
        college_id=MLRIT_COLLEGE_ID,
        subject_id=None,
    )

    async def _run_pipeline():
        from app.scrapers.colleges.mlrit_r22_crawler import crawl_r22_22
        from app.jobs.job_manager import update_job, advance_stage, complete_job, fail_job
        from app.models.job import JobStage, JobStatus
        from app.jobs.analysis_job import run_analysis_job
        from datetime import datetime

        update_job(job.id, status=JobStatus.RUNNING, started_at=datetime.utcnow())

        try:
            # Step 1-4: crawl + extract + parse
            advance_stage(job.id, JobStage.DISCOVERING, 10)
            crawl_result = await crawl_r22_22(
                subject_code=code,
                college_id=MLRIT_COLLEGE_ID,
                year_from=req.year_from,
                year_to=req.year_to,
                force_refresh=req.force_refresh,
            )
            log.info(f"[R22Pipeline] Crawl: {crawl_result}")

            if crawl_result["questions_stored"] == 0 and crawl_result["papers_cached"] == 0:
                log.warning(f"[R22Pipeline] No papers found for {code}")

            # Step 5: resolve subject_id
            db = get_db()
            sub = db.table("subjects").select("id").eq("code", code).limit(1).execute()
            subject_id = sub.data[0]["id"] if sub.data else None
            update_job(job.id, subject_id=subject_id)

            if not subject_id:
                fail_job(job.id, f"No subject found for code {code}")
                return

            # Step 6: run analysis
            advance_stage(job.id, JobStage.ANALYSING, 80)
            report = await run_analysis_job(
                subject_id=subject_id,
                regulation="R22",
                year_from=req.year_from,
                year_to=req.year_to,
            )

            complete_job(
                job.id,
                papers_found=crawl_result["papers_found"],
                papers_new=crawl_result["papers_new"],
                papers_cached=crawl_result["papers_cached"],
            )

            # Store report_id in job for polling
            update_job(job.id, **{"error_log": [{"report_id": report.get("id"), "subject_code": code}]})
            log.info(f"[R22Pipeline] Complete. report_id={report.get('id')}")

        except Exception as e:
            from app.jobs.job_manager import fail_job
            log.error(f"[R22Pipeline] Failed: {e}")
            fail_job(job.id, str(e))

    background_tasks.add_task(_run_pipeline)

    return {
        "success": True,
        "data": {
            "job_id"      : job.id,
            "status"      : "running",
            "subject_code": code,
            "subject_name": info["name"],
            "message"     : f"Auto-crawling and analyzing {info['name']} (R22, 2-2 semester)",
        }
    }


@router.get("/r22/job/{job_id}")
async def get_r22_job_status(job_id: str):
    """Poll job status. When status=completed, check error_log[0].report_id for the analysis."""
    from app.jobs.job_manager import get_job

    job = get_job(job_id)
    if not job:
        db = get_db()
        result = db.table("scraping_jobs").select("*").eq("id", job_id).single().execute()
        if not result.data:
            raise HTTPException(404, "Job not found")
        return {"success": True, "data": result.data}

    report_id = None
    if job.error_log:
        for entry in job.error_log:
            if isinstance(entry, dict) and "report_id" in entry:
                report_id = entry["report_id"]

    return {
        "success": True,
        "data": {
            "job_id"      : job.id,
            "status"      : job.status.value if hasattr(job.status, "value") else job.status,
            "stage"       : job.stage.value if job.stage and hasattr(job.stage, "value") else job.stage,
            "progress_pct": job.progress_pct,
            "papers_found": job.papers_found,
            "papers_new"  : job.papers_new,
            "report_id"   : report_id,
        }
    }
