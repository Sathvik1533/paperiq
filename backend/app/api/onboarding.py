"""
Onboarding API — handles profile creation from manual input or hall ticket upload
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, List
import io
from pypdf import PdfReader
from PIL import Image
import pytesseract
import magic

from app.database import get_db, get_admin_db, auth_token, _verified_user_id
from app.extractors.hall_ticket_parser import parse_hall_ticket
from app.logger import get_logger
from app.config import settings

log = get_logger(__name__)
router = APIRouter(tags=["onboarding"])


def get_verified_user_id() -> str:
    """Get user_id from the verified middleware context."""
    user_id = _verified_user_id.get()
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_id

class ManualProfileCreate(BaseModel):
    """Manual profile creation (existing flow)"""
    college_id: str
    branch: str
    regulation: str
    year: int = Field(ge=1, le=4)
    semester: int = Field(ge=1, le=2)
    subject_ids: List[str]


class HallTicketParseResponse(BaseModel):
    """Hall ticket parse result"""
    branch: Optional[str]
    regulation: Optional[str]
    year: Optional[int]
    semester: Optional[int]
    semester_display: Optional[str]
    subject_codes: List[str]
    subjects: List[dict]
    confidence: str


@router.post("/manual", response_model=dict)
async def create_profile_manual(
    profile: ManualProfileCreate,
):
    """
    Method 1: Manual onboarding (existing flow)
    User selects everything manually
    """
    log.info(f"Creating profile manually: {profile.branch} {profile.regulation} Y{profile.year}S{profile.semester}")
    
    user_id = get_verified_user_id()
    db = get_db()
    
    # Create or update user profile
    try:
        db.table("user_profiles").upsert({
            "id": user_id,
            "college_id": profile.college_id,
            "branch_id": profile.branch_id if hasattr(profile, 'branch_id') else None,
            "regulation": profile.regulation,
            "current_year": profile.year,
            "current_semester": profile.semester,
            "onboarding_complete": True
        }).execute()
        
        log.info(f"Profile created/updated for user {user_id}")
        
        return {
            "success": True,
            "method": "manual",
            "profile": profile.dict()
        }
    except Exception as e:
        log.error(f"Failed to create profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")


@router.post("/parse-hall-ticket", response_model=HallTicketParseResponse)
async def parse_hall_ticket_endpoint(
    file: UploadFile = File(...)
):
    """
    Method 2: Hall ticket upload
    Extract profile data from uploaded PDF or image
    """
    log.info(f"Parsing hall ticket: {file.filename}, content_type={file.content_type}")
    
    try:
        # Read file content
        content = await file.read()
        
        # 5MB size limit
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (limit 5MB)")
            
        # Magic byte validation
        mime_type = magic.from_buffer(content, mime=True)
        allowed_types = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}
        if mime_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file format: {mime_type}. Use PDF or image.")
        
        # Extract text based on file type
        text = ""
        
        if mime_type == "application/pdf":
            # PDF extraction
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        
        elif mime_type in ["image/png", "image/jpeg", "image/jpg"]:
            # Image OCR
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image)
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {mime_type}. Use PDF or image."
            )
        
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from file. Please use a clear image or PDF."
            )
        
        # Parse the extracted text
        result = parse_hall_ticket(text)
        
        return HallTicketParseResponse(**result)
    
    except Exception as e:
        log.error(f"Failed to parse hall ticket: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse hall ticket: {str(e)}"
        )


@router.post("/confirm-hall-ticket", response_model=dict)
async def confirm_hall_ticket_profile(
    profile: HallTicketParseResponse,
):
    """
    Confirm and save profile extracted from hall ticket
    Called after user reviews and approves the parsed data
    """
    log.info(f"Confirming hall ticket profile: {profile.branch} {profile.regulation}")
    
    user_id = get_verified_user_id()
    db = get_db()
    
    # Map subject_codes to subject_ids from subjects table
    try:
        # Get branch_id from branch name
        branch_result = db.table("branches").select("id").eq("short_name", profile.branch).execute()
        branch_id = branch_result.data[0]["id"] if branch_result.data else None
        
        # Map subject codes to subject IDs
        subject_ids = []
        if profile.subject_codes:
            subjects_result = db.table("subjects").select("id").in_("code", profile.subject_codes).execute()
            subject_ids = [s["id"] for s in subjects_result.data] if subjects_result.data else []
        
        # Create or update user profile
        db.table("user_profiles").upsert({
            "id": user_id,
            "branch_id": branch_id,
            "regulation": profile.regulation,
            "current_year": profile.year,
            "current_semester": profile.semester,
            "onboarding_complete": True
        }).execute()
        
        log.info(f"Hall ticket profile created/updated for user {user_id}")
        
        return {
            "success": True,
            "method": "hall_ticket",
            "profile": profile.dict(),
            "subject_ids": subject_ids
        }
    except Exception as e:
        log.error(f"Failed to create hall ticket profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")
