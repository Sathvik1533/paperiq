"""
Rate limiting middleware for the scrape endpoint.

Strategy: in-memory dict keyed by client IP.
Limit: 5 scrape requests per IP per hour (rolling window).
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException

# {ip: [timestamp, timestamp, ...]}
_scrape_log: dict[str, list[float]] = defaultdict(list)

SCRAPE_LIMIT = 5
SCRAPE_WINDOW = 3600  # seconds (1 hour)


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting common proxy headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


def rate_limit_scrape(request: Request) -> None:
    """
    FastAPI dependency. Raises HTTP 429 if the client IP has exceeded
    SCRAPE_LIMIT requests within the last SCRAPE_WINDOW seconds.

    Usage:
        @router.post("/scrape/trigger")
        async def trigger_scrape(
            req: ScrapeRequest,
            background_tasks: BackgroundTasks,
            _: None = Depends(rate_limit_scrape),
        ):
    """
    ip = _get_client_ip(request)
    now = time.time()
    window_start = now - SCRAPE_WINDOW

    # Prune timestamps outside the rolling window
    _scrape_log[ip] = [t for t in _scrape_log[ip] if t > window_start]

    if len(_scrape_log[ip]) >= SCRAPE_LIMIT:
        oldest = _scrape_log[ip][0]
        retry_after = int(oldest + SCRAPE_WINDOW - now) + 1
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": f"Too many scrape requests. Max {SCRAPE_LIMIT} per hour per IP.",
                "retry_after_seconds": retry_after,
            },
        )

    _scrape_log[ip].append(now)
