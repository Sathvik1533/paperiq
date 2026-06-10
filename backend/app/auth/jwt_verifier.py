"""
JWT Verification for Supabase Auth Tokens.

Supabase uses RS256 JWTs signed with keys from their JWKS endpoint.
This module fetches and caches the JWKS, then verifies tokens.
"""

import httpx
from jose import jwt, JWTError
from typing import Optional
from functools import lru_cache
import time
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)

JWKS_CACHE_TTL = 3600
_jwks_cache: dict = {"keys": None, "fetched_at": 0}


async def fetch_jwks() -> dict:
    """Fetch JWKS from Supabase, with caching."""
    global _jwks_cache
    
    if _jwks_cache["keys"] and (time.time() - _jwks_cache["fetched_at"]) < JWKS_CACHE_TTL:
        return _jwks_cache["keys"]
    
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL not configured")
    if not settings.supabase_anon_key:
        raise RuntimeError("SUPABASE_ANON_KEY not configured")
    
    jwks_url = f"{settings.supabase_url}/auth/v1/jwks"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url, headers={"apikey": settings.supabase_anon_key})
        response.raise_for_status()
        _jwks_cache["keys"] = response.json()
        _jwks_cache["fetched_at"] = time.time()
        log.info("JWKS fetched and cached from Supabase")
        return _jwks_cache["keys"]


def get_signing_key(token: str, jwks: dict):
    """Extract the signing key from JWKS matching the token's kid."""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    
    if not kid:
        raise JWTError("Token missing 'kid' header")
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    
    raise JWTError(f"Unable to find signing key for kid: {kid}")


async def verify_supabase_jwt(token: str) -> dict:
    """
    Verify a Supabase JWT token by calling the user endpoint.
    Returns a payload with 'sub' if valid.
    """
    if not token:
        raise JWTError("No token provided")
    
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("Supabase config missing")
        
    url = f"{settings.supabase_url}/auth/v1/user"
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            url,
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {token}"
            }
        )
        if response.status_code != 200:
            raise JWTError("Invalid token")
        
        user_data = response.json()
        return {"sub": user_data.get("id")}


def verify_supabase_jwt_sync(token: str) -> dict:
    """
    Synchronous version for use in non-async contexts.
    """
    if not token:
        raise JWTError("No token provided")
    
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("Supabase config missing")
        
    url = f"{settings.supabase_url}/auth/v1/user"
    with httpx.Client(timeout=10.0) as client:
        response = client.get(
            url,
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {token}"
            }
        )
        if response.status_code != 200:
            raise JWTError("Invalid token")
            
        user_data = response.json()
        return {"sub": user_data.get("id")}


def extract_user_id_from_token(token: str) -> Optional[str]:
    """Extract user_id (sub claim) from token without full verification."""
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("sub")
    except JWTError:
        return None