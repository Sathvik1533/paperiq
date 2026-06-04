from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter()


@router.get("/colleges")
async def list_colleges():
    db = get_db()
    result = db.table("colleges").select("*").eq("is_active", True).execute()
    return {"success": True, "data": result.data}


@router.get("/colleges/{college_id}/branches")
async def list_branches(college_id: str):
    db = get_db()
    result = db.table("branches").select("*").eq("college_id", college_id).execute()
    return {"success": True, "data": result.data}


@router.get("/colleges/{college_id}/subjects")
async def list_subjects(college_id: str):
    db = get_db()
    result = db.table("subjects").select("*").eq("college_id", college_id).execute()
    return {"success": True, "data": result.data}


@router.get("/subjects")
async def search_subjects(
    college: str | None = None,
    branch: str | None = None,
    year: int | None = None,
    regulation: str | None = None,
):
    db = get_db()
    q = db.table("subjects").select("*")
    if college:
        q = q.eq("college_id", college)
    if year:
        q = q.eq("year", year)
    if regulation:
        q = q.eq("regulation", regulation)
    result = q.execute()
    return {"success": True, "data": result.data}
