"""
Shared pagination dependencies for API endpoints.
"""
from fastapi import Query
from typing import Optional


class PaginationParams:
    """Standard pagination parameters for list endpoints."""

    def __init__(
        self,
        limit: int = Query(50, ge=1, le=200, description="Max items to return"),
        offset: int = Query(0, ge=0, description="Number of items to skip"),
    ):
        self.limit = limit
        self.offset = offset

    def apply(self, query):
        """Apply pagination to a Supabase query builder."""
        return query.range(self.offset, self.offset + self.limit - 1)


def paginated_response(data: list, total: int, pagination: PaginationParams) -> dict:
    """Wrap paginated data in a standard envelope."""
    return {
        "success": True,
        "data": data,
        "meta": {
            "total": total,
            "limit": pagination.limit,
            "offset": pagination.offset,
            "has_more": pagination.offset + pagination.limit < total,
        },
    }
