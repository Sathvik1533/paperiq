from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class PaperMeta(BaseModel):
    """Lightweight descriptor returned by scraper list_papers()."""
    url: str
    file_name: str
    exam_year: int
    exam_month: str
    exam_type: str          # Regular | Supplementary
    btech_year: int
    label: str              # Human-readable label from portal
    archive_type: str = "rar"  # rar | zip


class Paper(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    college_id: str
    subject_id: Optional[str] = None
    branch_id: Optional[str] = None
    source_id: Optional[str] = None

    title: str
    exam_type: Optional[str] = None
    exam_month: Optional[str] = None
    exam_year: Optional[int] = None
    semester: Optional[int] = None
    btech_year: Optional[int] = None
    regulation: Optional[str] = None
    max_marks: Optional[int] = None

    original_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_hash: Optional[str] = None
    storage_path: Optional[str] = None

    extraction_status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
