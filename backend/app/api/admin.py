"""
Admin API — System Management & Knowledge Base Operations
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.jobs.knowledge_base_builder import (
    auto_build_mlrit_r22_knowledge_base,
    check_knowledge_base_exists,
    trigger_paper_discovery
)
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)


class KnowledgeBaseStatus(BaseModel):
    """Knowledge base status response"""
    exists: bool
    college: str
    regulation: str
    message: str


@router.get("/knowledge-base/status")
async def get_knowledge_base_status(
    college: str = "MLRIT",
    regulation: str = "R22"
):
    """
    Check if knowledge base exists for given college and regulation.
    """
    exists = await check_knowledge_base_exists(college, regulation)
    
    return {
        "success": True,
        "data": {
            "exists": exists,
            "college": college,
            "regulation": regulation,
            "message": "Knowledge base exists" if exists else "Knowledge base not found"
        }
    }


@router.post("/knowledge-base/build")
async def build_knowledge_base():
    """
    Trigger automatic knowledge base build for MLRIT R22 CSE.
    
    This endpoint:
    1. Downloads syllabus PDF
    2. Parses subjects
    3. Creates database records
    4. Triggers paper discovery
    
    Safe to call multiple times — skips if already exists.
    """
    log.info("[Admin] Manual knowledge base build triggered")
    
    try:
        result = await auto_build_mlrit_r22_knowledge_base()
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        log.error(f"[Admin] Knowledge base build failed: {e}")
        raise HTTPException(500, f"Knowledge base build failed: {e}")


@router.post("/knowledge-base/discover-papers")
async def discover_papers(
    college_id: str,
    branch_id: str,
    regulation: str,
    btech_year: int = 2
):
    """
    Manually trigger paper discovery for given context.
    
    Use this to re-run paper discovery if initial run failed.
    """
    log.info(f"[Admin] Manual paper discovery triggered for {regulation}")
    
    try:
        result = await trigger_paper_discovery(
            college_id=college_id,
            branch_id=branch_id,
            regulation=regulation,
            btech_year=btech_year
        )
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        log.error(f"[Admin] Paper discovery failed: {e}")
        raise HTTPException(500, f"Paper discovery failed: {e}")
