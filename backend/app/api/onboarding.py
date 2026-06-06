"""
Onboarding API — handles profile creation from manual input or hall ticket upload
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import io
from pypdf import PdfReader
from PIL import Image
import pytesseract

from app.database import get_db
from app.extractors.hall_ticket_parser import parse_hall_ticket
from app.logger import get_logger

log = get_logger(__name__)
router = APIRouter(tags=["onboarding"])


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
    db = Depends(get_db)
):
    """
    Method 1: Manual onboarding (existing flow)
    User selects everything manually
    """
    log.info(f"Creating profile manually: {profile.branch} {profile.regulation} Y{profile.year}S{profile.semester}")
    
    # TODO: Create learner_profile in database
    # For now, return success
    return {
        "success": True,
        "method": "manual",
        "profile": profile.dict()
    }


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
        
        # Extract text based on file type
        text = ""
        
        if file.content_type == "application/pdf":
            # PDF extraction
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        
        elif file.content_type in ["image/png", "image/jpeg", "image/jpg"]:
            # Image OCR
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image)
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Use PDF or image."
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
    db = Depends(get_db)
):
    """
    Confirm and save profile extracted from hall ticket
    Called after user reviews and approves the parsed data
    """
    log.info(f"Confirming hall ticket profile: {profile.branch} {profile.regulation}")
    
    # TODO: Create learner_profile in database
    # Map subject_codes to subject_ids from subjects table
    
    return {
        "success": True,
        "method": "hall_ticket",
        "profile": profile.dict()
    }
