"""
Base class and utilities for PaperIQ AI Companion Specialists.
"""
from __future__ import annotations
import re
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple
from app.companion.models import Citation, SuggestedAction, SpecialistType
from app.constants.r22_subjects import ALL_R22_SUBJECTS
from app.llm.provider_factory import get_llm_router
from app.llm.base import TaskType
from app.logger import get_logger

log = get_logger(__name__)


def resolve_subject(query: str, context: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """
    Resolve subject code and metadata from context and natural language query.
    Prioritizes explicit subject mentions in the query over default context.
    Handles official MLRIT R22 codes (e.g. A6CS15), short names (DAA, OS, DBMS),
    and full course titles.
    """
    query_lower = query.lower()

    # 1. Exact subject code match in query (e.g. A6CS15, A6CS11, A6CS09)
    code_match = re.search(r"\b(A[0-9][A-Z0-9]{4})\b", query, re.IGNORECASE)
    if code_match and code_match.group(1).upper() in ALL_R22_SUBJECTS:
        found_code = code_match.group(1).upper()
        return found_code, ALL_R22_SUBJECTS[found_code]

    # 2. Specific keyword mappings (High-priority acronyms) in query
    if re.search(r"\b(daa|algorithms?|design and analysis of algorithms?|knapsack|branch and bound)\b", query_lower):
        return "A6CS15", ALL_R22_SUBJECTS.get("A6CS15", {
            "name": "Design and Analysis of Algorithms",
            "short": "DAA",
            "year": 3,
            "semester": 1,
            "credits": 3.0,
            "category": "PCC",
        })

    if re.search(r"\b(os|operating systems?|deadlock|banker|paging)\b", query_lower):
        return "A6CS11", ALL_R22_SUBJECTS.get("A6CS11", {
            "name": "Operating System",
            "short": "OS",
            "year": 2,
            "semester": 2,
            "credits": 3.0,
            "category": "PCC",
        })

    if re.search(r"\b(dbms|database|sql|normalization|acid)\b", query_lower):
        return "A6CS09", ALL_R22_SUBJECTS.get("A6CS09", {
            "name": "Database Management Systems",
            "short": "DBMS",
            "year": 2,
            "semester": 2,
            "credits": 3.0,
            "category": "PCC",
        })

    if re.search(r"\b(cn|networks?|computer networks?|osi|tcp|ip)\b", query_lower):
        return "A6CS18", ALL_R22_SUBJECTS.get("A6CS18", {
            "name": "Computer Networks",
            "short": "CN",
            "year": 3,
            "semester": 1,
            "credits": 3.0,
            "category": "PCC",
        })

    if re.search(r"\b(cd|devops|cloud|cloud and devops|docker|kubernetes)\b", query_lower):
        return "A6IT13", ALL_R22_SUBJECTS.get("A6IT13", {
            "name": "Cloud and DevOps",
            "short": "CD",
            "year": 3,
            "semester": 1,
            "credits": 3.0,
            "category": "PCC",
        })

    # 3. Search query for subject name or short name across all registered subjects
    for c, info in ALL_R22_SUBJECTS.items():
        if info.get("name", "").lower() in query_lower:
            return c, info
        short_name = info.get("short", "").lower()
        if short_name and len(short_name) >= 2 and re.search(r"\b" + re.escape(short_name) + r"\b", query_lower):
            return c, info

    # 4. Context check if query didn't explicitly specify
    code = context.get("subject_code")
    if code and code.upper() in ALL_R22_SUBJECTS:
        return code.upper(), ALL_R22_SUBJECTS[code.upper()]

    # 5. Default to A6CS15 (DAA)
    return "A6CS15", ALL_R22_SUBJECTS.get("A6CS15", {
        "name": "Design and Analysis of Algorithms",
        "short": "DAA",
        "year": 3,
        "semester": 1,
        "credits": 3.0,
        "category": "PCC",
    })


class BaseSpecialist(ABC):
    specialist_type: SpecialistType
    badge: str
    description: str

    @abstractmethod
    async def handle(
        self,
        query: str,
        context: Dict[str, Any],
    ) -> Tuple[str, List[Citation], List[SuggestedAction]]:
        """
        Execute specialist capability.
        Returns:
            - response_markdown: str
            - citations: list[Citation]
            - suggested_actions: list[SuggestedAction]
        """
        pass

    async def call_llm_response(self, prompt: str, task_type: TaskType = TaskType.EXAM_INSIGHTS):
        """Call LLM router with fallback resilience, returning LLMResponse or None."""
        try:
            router = get_llm_router()
            return await router.complete(prompt, task_type)
        except Exception as e:
            log.warning(f"[Specialist {self.specialist_type}] LLM completion failed, triggering deterministic fallback: {e}")
            return None

    async def call_llm(self, prompt: str, task_type: TaskType = TaskType.EXAM_INSIGHTS) -> str:
        """Call LLM router with fallback resilience."""
        resp = await self.call_llm_response(prompt, task_type)
        return resp.content.strip() if resp else ""

