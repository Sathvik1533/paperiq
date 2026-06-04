from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum
import uuid


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobStage(str, Enum):
    DISCOVERING = "discovering"
    DOWNLOADING = "downloading"
    EXTRACTING = "extracting"
    PARSING = "parsing"
    ANALYSING = "analysing"
    DONE = "done"


class ScrapingJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    college_id: str
    subject_id: Optional[str] = None
    source_id: Optional[str] = None

    status: JobStatus = JobStatus.QUEUED
    scraper_used: Optional[str] = None

    stage: Optional[JobStage] = None
    total_files: int = 0
    processed_files: int = 0
    failed_files: int = 0
    progress_pct: float = 0.0

    papers_found: int = 0
    papers_new: int = 0
    papers_cached: int = 0
    error_log: List[dict] = Field(default_factory=list)

    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ScrapeRequest(BaseModel):
    college_id: str
    subject_id: Optional[str] = None
    year_from: int = 2021
    year_to: int = 2025
    force_refresh: bool = False
    btech_year: int = 2
