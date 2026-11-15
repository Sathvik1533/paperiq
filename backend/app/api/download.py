"""
Supabase Storage Download & View API

Strictly adheres to the Official Document Rule:
- /papers/{id}/download -> Original DOC/DOCX/PDF as attachment
- /papers/{id}/view -> Viewable PDF inline (or appropriate media type for DOCX/DOC)
No on-the-fly archive extraction.
"""
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.database import get_db
from app.logger import get_logger
from app.intelligence.academic_question_intel import resolve_paper_id

router = APIRouter()
log = get_logger(__name__)

@router.get("/papers/{paper_id}/download")
async def download_paper(paper_id: str):
    """
    Downloads the EXACT original file uploaded by MLRIT (DOCX, DOC, or PDF).
    Supports lookup whether paper_id is provided as UUID or slug.
    """
    canonical_id = resolve_paper_id(paper_id)
    if not canonical_id:
        raise HTTPException(400, "Invalid paper ID format")

    db = get_db()
    
    paper_result = db.table('papers').select('*').eq('id', canonical_id).execute()
    if not paper_result.data and paper_id != canonical_id:
        try:
            uuid.UUID(str(paper_id))
            paper_result = db.table('papers').select('*').eq('id', paper_id).execute()
        except ValueError:
            pass

    if not paper_result.data:
        raise HTTPException(404, "Paper not found")
    
    paper = paper_result.data[0]
    
    # Check explicitly for original_storage_path first, fallback to storage_path
    storage_path = paper.get('original_storage_path') or paper.get('storage_path')
    storage_bucket = paper.get('storage_bucket', 'papers')
    
    if not storage_path:
        raise HTTPException(404, "Original document is not available in storage. This paper was ingested before storage preservation was enabled.")
        
    source_filename = paper.get('source_filename') or paper.get('file_name') or f"document_{paper_id}"
    
    try:
        file_bytes = db.storage.from_(storage_bucket).download(storage_path)
    except Exception as e:
        log.error(f"Failed to download original document from storage: {e}")
        raise HTTPException(503, "Failed to retrieve original document from storage.")
        
    media_type = "application/octet-stream"
    if source_filename.lower().endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif source_filename.lower().endswith(".doc"):
        media_type = "application/msword"
    elif source_filename.lower().endswith(".pdf"):
        media_type = "application/pdf"
    elif file_bytes and file_bytes[:4] == b'%PDF':
        media_type = "application/pdf"
    elif file_bytes and file_bytes[:2] == b'PK':
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{source_filename}"'}
    )

@router.get("/papers/{paper_id}/view")
async def view_paper(paper_id: str):
    """
    Views the browser-friendly PDF or DOCX version of the paper.
    If original was DOCX, serves appropriate OpenXML document mime type or converted PDF.
    Supports lookup whether paper_id is provided as UUID or slug.
    """
    canonical_id = resolve_paper_id(paper_id)
    if not canonical_id:
        raise HTTPException(400, "Invalid paper ID format")

    db = get_db()
    
    paper_result = db.table('papers').select('*').eq('id', canonical_id).execute()
    if not paper_result.data and paper_id != canonical_id:
        try:
            uuid.UUID(str(paper_id))
            paper_result = db.table('papers').select('*').eq('id', paper_id).execute()
        except ValueError:
            pass

    if not paper_result.data:
        raise HTTPException(404, "Paper not found")
    
    paper = paper_result.data[0]
    
    # Check explicitly for viewable_storage_path first, fallback to storage_path
    storage_path = paper.get('viewable_storage_path') or paper.get('storage_path')
    storage_bucket = paper.get('storage_bucket', 'papers')
    
    if not storage_path:
        raise HTTPException(404, "Viewable document is not available in storage.")
        
    view_filename = storage_path.split("/")[-1]
    
    try:
        file_bytes = db.storage.from_(storage_bucket).download(storage_path)
    except Exception as e:
        log.error(f"Failed to download viewable document from storage: {e}")
        raise HTTPException(503, "Failed to retrieve viewable document from storage.")
        
    media_type = "application/octet-stream"
    if view_filename.lower().endswith(".pdf"):
        media_type = "application/pdf"
    elif view_filename.lower().endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif view_filename.lower().endswith(".doc"):
        media_type = "application/msword"
    elif file_bytes and file_bytes[:4] == b'%PDF':
        media_type = "application/pdf"
    elif file_bytes and file_bytes[:2] == b'PK':
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{view_filename}"'}
    )

