"""
Shared auth dependencies for protected endpoints.
"""
from fastapi import Header, HTTPException, Depends
from typing import Optional

from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)


def require_admin_api_key(x_admin_key: Optional[str] = Header(None)):
    """
    Dependency: validates the X-Admin-Key header against ADMIN_API_KEY env var.
    Apply to any endpoint that should only be callable by admins.
    """
    if not settings.admin_api_key:
        log.warning("[AdminAuth] ADMIN_API_KEY not configured — rejecting all admin requests")
        raise HTTPException(
            status_code=503,
            detail="Admin API key not configured. Set ADMIN_API_KEY in environment.",
        )
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing admin API key.",
        )
    return True
