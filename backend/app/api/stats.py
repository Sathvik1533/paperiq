"""
Stats API — Public landing page statistics
"""
from fastapi import APIRouter
from app.database import get_admin_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)

@router.get("/stats")
async def get_stats():
    """
    Public endpoint — returns aggregate counts for landing page.
    Uses admin client since this is public and doesn't need user context.
    """
    db = get_admin_db()
    try:
        papers = db.table("papers").select("*", count="exact", head=True).execute()
        questions = db.table("questions").select("*", count="exact", head=True).execute()
        subjects = db.table("subjects").select("*", count="exact", head=True).execute()
        
        return {
            "success": True,
            "data": {
                "papers": papers.count or 0,
                "questions": questions.count or 0,
                "subjects": subjects.count or 0,
            }
        }
    except Exception as e:
        log.error(f"Failed to fetch stats: {e}")
        # Return defaults if query fails — landing page should never break
        return {
            "success": True,
            "data": {
                "papers": 72,
                "questions": 5730,
                "subjects": 10,
            }
        }
