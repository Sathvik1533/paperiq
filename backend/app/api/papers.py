from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)


@router.get("/papers")
async def list_papers(
    subject_id: Optional[str] = None,
    year: Optional[int] = None,
    exam_type: Optional[str] = None,
    regulation: Optional[str] = None,
    college_id: Optional[str] = None,
):
    db = get_db()
    q = db.table("papers").select(
        "id, title, exam_year, exam_month, exam_type, regulation, "
        "max_marks, btech_year, file_type, extraction_status, created_at"
    )
    if subject_id:
        q = q.eq("subject_id", subject_id)
    if year:
        q = q.eq("exam_year", year)
    if exam_type:
        q = q.eq("exam_type", exam_type)
    if regulation:
        q = q.eq("regulation", regulation)
    if college_id:
        q = q.eq("college_id", college_id)
    result = q.order("exam_year", desc=True).execute()
    return {
        "success": True,
        "data": result.data,
        "meta": {"total": len(result.data)}
    }


@router.get("/papers/{paper_id}")
async def get_paper(paper_id: str):
    db = get_db()
    result = db.table("papers").select("*").eq("id", paper_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Paper not found")
    return {"success": True, "data": result.data}


@router.get("/papers/{paper_id}/questions")
async def get_paper_questions(paper_id: str):
    db = get_db()
    result = db.table("questions").select("*").eq("paper_id", paper_id).execute()
    return {"success": True, "data": result.data}
