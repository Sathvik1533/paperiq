"""
File upload validation utilities.
Uses python-magic for MIME type detection to prevent extension spoofing.
"""
import magic
from fastapi import HTTPException
from typing import Optional

from app.logger import get_logger

log = get_logger(__name__)

# Allowed MIME types per upload purpose
SYLLABUS_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

HALL_TICKET_MIME = {
    "application/pdf",
    "image/png",
    "image/jpeg",
}

CROSS_REFERENCE_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "image/png",
    "image/jpeg",
    "text/plain",
}

# Max file sizes in bytes
MAX_SYLLABUS_SIZE = 20 * 1024 * 1024      # 20MB
MAX_HALL_TICKET_SIZE = 5 * 1024 * 1024     # 5MB
MAX_CROSS_REFERENCE_SIZE = 20 * 1024 * 1024 # 20MB


def validate_upload_magic(file_bytes: bytes, allowed_mimes: set[str], purpose: str) -> str:
    """
    Validate file content using python-magic (magic bytes, not extension).
    Returns the detected MIME type.
    Raises HTTPException if the file type is not allowed.
    """
    detected_mime = magic.from_buffer(file_bytes[:2048], mime=True)

    if detected_mime not in allowed_mimes:
        log.warning(f"[UploadValidation] {purpose}: rejected MIME '{detected_mime}'")
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{detected_mime}' for {purpose}. Allowed: {', '.join(sorted(allowed_mimes))}",
        )

    return detected_mime


def validate_upload_size(file_bytes: bytes, max_bytes: int, purpose: str) -> None:
    """Validate file size is within limits."""
    if len(file_bytes) > max_bytes:
        size_mb = len(file_bytes) / (1024 * 1024)
        max_mb = max_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"{purpose} file too large: {size_mb:.1f}MB (max {max_mb:.0f}MB)",
        )
