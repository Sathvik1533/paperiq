from fastapi import APIRouter
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)
router = APIRouter()


@router.get("/stats")
async def get_stats():
    """
    Return platform statistics for landing page counter.
    Ground-truth rule: Never present invented numbers as live academic statistics.
    When live database counts are available, returns actual counts with is_live=True.
    When unavailable, returns explicit failure/unavailable state.
    """
    try:
        db = get_db()
        papers = db.table("papers").select("id", count="exact", head=True).execute()
        questions = db.table("questions").select("id", count="exact", head=True).execute()
        subjects = db.table("subjects").select("id", count="exact", head=True).execute()

        paper_count = papers.count if papers.count is not None else 0
        question_count = questions.count if questions.count is not None else 0
        subject_count = subjects.count if subjects.count is not None else 0

        return {
            "success": True,
            "data": {
                "papers": paper_count,
                "questions": question_count,
                "subjects": subject_count,
                "is_live": True,
                "source": "database",
            },
        }
    except Exception as e:
        log.warning(f"Failed to fetch live stats from DB: {e}")
        return {
            "success": False,
            "data": {
                "papers": None,
                "questions": None,
                "subjects": None,
                "is_live": False,
                "source": "unavailable",
                "message": "Live database statistics currently unavailable",
            },
        }
