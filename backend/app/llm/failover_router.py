import asyncio
import time
from app.llm.base import (
    LLMProvider, TaskType, LLMResponse,
    RateLimitError, ProviderUnavailableError, AllProvidersUnavailableError
)
from app.logger import get_logger

log = get_logger(__name__)


class FailoverRouter:
    """
    Tries LLM providers in priority order.
    Circuit breaker per provider: trips on rate-limit/unavailable,
    cools down for COOLDOWN_SECONDS, then retries.
    Users never manually switch providers.
    """

    def __init__(self, providers: list[LLMProvider], cooldown_seconds: int = 60):
        self.providers = providers
        self._cooldown = cooldown_seconds
        self._tripped: dict[str, float] = {}   # provider.name -> cooldown_until

    def _available(self, p: LLMProvider) -> bool:
        return time.monotonic() > self._tripped.get(p.name, 0)

    def _trip(self, p: LLMProvider) -> None:
        self._tripped[p.name] = time.monotonic() + self._cooldown
        log.warning(f"[FailoverRouter] Tripped {p.name} for {self._cooldown}s")

    @property
    def active_provider(self) -> str | None:
        for p in self.providers:
            if self._available(p):
                return p.name
        return None

    async def complete(self, prompt: str, task: TaskType) -> LLMResponse:
        for p in self.providers:
            if not self._available(p):
                continue
            try:
                result = await asyncio.wait_for(
                    p.complete(prompt, task),
                    timeout=60,
                )
                log.info(f"[FailoverRouter] OK via {p.name} model={result.model_used}")
                return result
            except (RateLimitError, ProviderUnavailableError) as e:
                log.warning(f"[FailoverRouter] {p.name} failed: {e}")
                self._trip(p)
            except asyncio.TimeoutError:
                log.warning(f"[FailoverRouter] {p.name} timed out")
                self._trip(p)
        raise AllProvidersUnavailableError("All LLM providers are currently unavailable.")

    async def health_status(self) -> list[dict]:
        statuses = []
        for p in self.providers:
            available = self._available(p)
            statuses.append({
                "name": p.name,
                "status": "available" if available else "cooling_down",
                "models": p.tier_models,
            })
        return statuses

    # ── Delegate domain methods ────────────────────────────────────────

    async def _delegate(self, method: str, *args, **kwargs):
        for p in self.providers:
            if not self._available(p):
                continue
            try:
                return await asyncio.wait_for(
                    getattr(p, method)(*args, **kwargs), timeout=60
                )
            except (RateLimitError, ProviderUnavailableError, asyncio.TimeoutError):
                self._trip(p)
        raise AllProvidersUnavailableError(f"All providers failed for {method}")

    async def classify_questions(self, questions):
        return await self._delegate("classify_questions", questions)

    async def extract_topics(self, text, subject):
        return await self._delegate("extract_topics", text, subject)

    async def generate_study_plan(self, analysis, constraints):
        return await self._delegate("generate_study_plan", analysis, constraints)

    async def generate_mock_exam(self, analysis, pattern):
        return await self._delegate("generate_mock_exam", analysis, pattern)

    async def generate_exam_insights(self, analysis):
        return await self._delegate("generate_exam_insights", analysis)

    async def score_readiness(self, user_activity, analysis):
        return await self._delegate("score_readiness", user_activity, analysis)
