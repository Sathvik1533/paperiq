"""
User authentication dependencies and ownership verification.
"""
from fastapi import Header, HTTPException, Depends
from typing import Optional
from app.database import _verified_user_id, auth_token
from app.auth.jwt_verifier import verify_supabase_jwt
from jose import JWTError
from app.logger import get_logger

log = get_logger(__name__)


async def get_current_user_id(
    authorization: Optional[str] = Header(None)
) -> str:
    """
    FastAPI dependency: retrieves and validates the authenticated user ID.
    Enforces authentication:
    - Missing Authorization header -> 401 Unauthorized
    - Malformed token -> 401 Unauthorized
    - Expired or invalid signature -> 401 Unauthorized
    - Valid credentials -> returns user_id (sub)
    """
    # 1. Check if auth_middleware already validated the token in this request context
    verified_id = _verified_user_id.get()
    if verified_id:
        return verified_id

    # 2. If not verified by middleware, inspect and verify Authorization header directly
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Missing or malformed authorization header",
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or not parts[1].strip():
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Malformed bearer token",
        )

    token = parts[1].strip()

    try:
        payload = await verify_supabase_jwt(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Authentication required: Token missing sub claim",
            )
        _verified_user_id.set(user_id)
        auth_token.set(token)
        return user_id
    except HTTPException:
        raise
    except (JWTError, RuntimeError, Exception) as e:
        log.warning(f"Authentication verification failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Invalid or expired token",
        )


def verify_user_ownership(requested_user_id: str, authenticated_user_id: str) -> None:
    """
    Enforces that authenticated_user_id owns the requested resource.
    Raises 403 Forbidden if not.
    """
    if not requested_user_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Access denied to unowned private resource",
        )
    if requested_user_id != authenticated_user_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cannot access another user's resources",
        )


def verify_resource_access(
    resource_owner_id: Optional[str],
    authenticated_user_id: str,
    *,
    is_public: bool = False,
    resource_type: str = "resource",
) -> None:
    """
    Enforces authorization for user-generated or system-owned resources:
    - If resource is explicitly public/system-owned (is_public=True), access is granted.
    - If resource_owner_id is NULL/empty and NOT public, access is explicitly rejected with 403 Forbidden.
    - If resource_owner_id != authenticated_user_id, access is rejected with 403 Forbidden.
    """
    if is_public:
        return

    if not resource_owner_id:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Access denied to unowned private {resource_type}",
        )

    if resource_owner_id != authenticated_user_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cannot access another user's resources",
        )
