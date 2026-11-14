"""
Rate limiter configuration for PaperIQ API.

Provides defense-in-depth rate limiting:
1. Per-User Rate Limiting for Authenticated Endpoints:
   - Authenticated students are keyed on `user:<user_id>`.
   - Guarantees one student's activity cannot exhaust limits for other students,
     even behind reverse proxies or shared university Wi-Fi / NAT.
2. Trusted Reverse-Proxy Client Identification behind Render:
   - Detects Render and trusted proxy environments (via RENDER env or Render proxy headers).
   - Extracts real client IP from Cloudflare (`CF-Connecting-IP`) or the trusted edge hop
     appended by Render at the end of `X-Forwarded-For`.
   - Client-injected leftmost spoofed IPs in `X-Forwarded-For` are ignored.
   - For direct (non-proxy) connections, forwarded headers are completely ignored.
3. Shared Storage Backend:
   - Configurable shared storage via `settings.redis_url` / `REDIS_URL`.
   - Enables synchronized rate limits across multi-worker Gunicorn processes on Render.
   - Gracefully defaults to in-memory storage when Redis is not configured.
"""
import os
import ipaddress
from fastapi import Request
from slowapi import Limiter
from app.config import settings
from app.database import _verified_user_id
from app.logger import get_logger

log = get_logger(__name__)


def is_trusted_proxy_host(host: str) -> bool:
    """
    Check if a direct connection host is in the trusted proxies configuration.
    Accepts exact IPs and CIDR networks.
    """
    if not host:
        return False

    try:
        ip_obj = ipaddress.ip_address(host)
    except ValueError:
        return False

    proxies = [p.strip() for p in settings.trusted_proxies.split(",") if p.strip()]
    for proxy in proxies:
        try:
            if "/" in proxy:
                if ip_obj in ipaddress.ip_network(proxy):
                    return True
            else:
                if ip_obj == ipaddress.ip_address(proxy):
                    return True
        except ValueError:
            continue
    return False


def is_trusted_proxy_environment(request: Request) -> bool:
    """
    Check if the current request is received through a trusted reverse proxy (e.g. Render).
    Render automatically sets RENDER=true in the container environment.
    Alternatively, direct connections from configured trusted proxy IPs are trusted.
    Never trusts client-injected HTTP headers to determine proxy trust.
    """
    if os.environ.get("RENDER") == "true":
        return True
    if request.client and is_trusted_proxy_host(request.client.host):
        return True
    return False


def get_client_ip(request: Request) -> str:
    """
    Extract reliable client IP taking Render's reverse proxy into account.
    Prevents blind trust of arbitrary X-Forwarded-For headers from untrusted clients.
    """
    direct_host = request.client.host if request.client else "127.0.0.1"

    # Only inspect forwarded proxy headers if request arrived through trusted proxy (Render / configured proxy)
    if not is_trusted_proxy_environment(request):
        return direct_host

    # 1. Cloudflare edge header (sanitized by Cloudflare at Render edge)
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip and cf_ip.strip():
        cleaned_cf = cf_ip.strip()
        try:
            ipaddress.ip_address(cleaned_cf)
            return cleaned_cf
        except ValueError:
            log.warning(f"[Limiter] Invalid CF-Connecting-IP format: {cleaned_cf}")

    # 2. X-Forwarded-For behind Render:
    # Render's reverse proxy appends the connecting client's true IP to the end of X-Forwarded-For.
    # An attacker can only inject leading (leftmost) entries. The rightmost valid entry is the IP
    # that contacted Render's reverse proxy edge.
    xff = request.headers.get("x-forwarded-for")
    if xff:
        hops = [ip.strip() for ip in xff.split(",") if ip.strip()]
        for hop in reversed(hops):
            try:
                ipaddress.ip_address(hop)
                return hop
            except ValueError:
                continue

    return direct_host


def get_client_identifier(request: Request) -> str:
    """
    Primary rate limit key function:
    - If user is authenticated, isolate by user ID (prevents cross-user rate limit exhaustion).
    - If unauthenticated, isolate by trusted client IP.
    """
    user_id = _verified_user_id.get()
    if user_id:
        return f"user:{user_id}"

    # Also check if user_id was set on request state
    state_user_id = getattr(request.state, "user_id", None)
    if state_user_id:
        return f"user:{state_user_id}"

    return f"ip:{get_client_ip(request)}"


# Configure storage URI (Redis if configured, memory:// fallback)
storage_uri = settings.redis_url if settings.redis_url else "memory://"

try:
    limiter = Limiter(
        key_func=get_client_identifier,
        storage_uri=storage_uri,
    )
    if settings.redis_url:
        log.info(f"[Limiter] Configured shared rate-limit storage via Redis: {storage_uri.split('@')[-1]}")
    else:
        log.info("[Limiter] Configured in-memory rate-limit storage")
except Exception as e:
    log.warning(f"[Limiter] Failed to initialize storage '{storage_uri}': {e}. Falling back to memory://")
    limiter = Limiter(
        key_func=get_client_identifier,
        storage_uri="memory://",
    )
