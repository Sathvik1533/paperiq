from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from typing import Optional
import os, shutil

from app.jobs.extract_job import run_extract_job
from app.extractors.syllabus_ingester import ingest_syllabus
from app.config import settings
from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)


@router.post("/extract/trigger")
async def trigger_extraction(background_tasks: BackgroundTasks, paper_id: Optional[str] = None):
    background_tasks.add_task(run_extract_job, paper_id)
    return {"success": True, "data": {"message": f"Extraction queued for {'paper ' + paper_id if paper_id else 'all pending papers'}"}}


@router.post("/extract/run")
async def run_extraction_sync(paper_id: Optional[str] = None):
    result = await run_extract_job(paper_id)
    return {"success": True, "data": result}


@router.get("/extract/status")
async def extraction_status():
    db = get_db()
    result = db.table("papers").select("extraction_status").execute()
    counts: dict = {}
    for row in result.data:
        s = row["extraction_status"]
        counts[s] = counts.get(s, 0) + 1
    return {"success": True, "data": counts}


@router.post("/syllabus/upload")
async def upload_syllabus(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    regulation: str = Form(...),
):
    allowed = {".pdf", ".docx", ".doc"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {allowed}")

    upload_dir = os.path.join(settings.scraper_download_dir, "syllabi")
    os.makedirs(upload_dir, exist_ok=True)
    dest = os.path.join(upload_dir, file.filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        syllabus_id = ingest_syllabus(file_path=dest, subject_id=subject_id, regulation=regulation)
    except Exception as e:
        raise HTTPException(500, f"Syllabus ingestion failed: {e}")

    db = get_db()
    syllabus = db.table("syllabi").select("id, regulation, parsed_units").eq("id", syllabus_id).single().execute()
    units = syllabus.data.get("parsed_units", [])
    return {"success": True, "data": {"syllabus_id": syllabus_id, "units_found": len(units),
            "total_topics": sum(len(u.get("topics", [])) for u in units), "units": units}}


@router.get("/syllabus")
async def list_syllabi(subject_id: Optional[str] = None, regulation: Optional[str] = None):
    db = get_db()
    q = db.table("syllabi").select("id, subject_id, regulation, source_type, created_at, parsed_units")
    if subject_id:
        q = q.eq("subject_id", subject_id)
    if regulation:
        q = q.eq("regulation", regulation)
    return {"success": True, "data": q.execute().data}


@router.get("/syllabus/{syllabus_id}/topics")
async def get_syllabus_topics(syllabus_id: str):
    db = get_db()
    result = db.table("syllabus_topics").select("*").eq("syllabus_id", syllabus_id).order("unit_number").execute()
    return {"success": True, "data": result.data}
