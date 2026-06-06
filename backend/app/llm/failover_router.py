"""
FailoverRouter — tries providers in order, with exponential backoff + full jitter.

Two layers of resilience:
  1. Per-provider retry with exponential backoff + jitter (handles transient rate limits
     within one provider — retries Groq up to 3 times with spreading delays)
  2. Circuit breaker per provider (if a provider fails after all retries, it cools
     down for N seconds and the router moves to the next provider)

This means:
  - A single rate limit from Groq does NOT immediately fall back to OpenRouter.
    It retries Groq 3 times with jitter, giving Groq a chance to recover.
  - If Groq is genuinely unavailable (all 3 retries failed), the circuit trips
    and OpenRouter takes over instantly.
  - When 20 students all get rate-limited simultaneously, each waits a DIFFERENT
    random duration → they stagger their retries → Groq handles them smoothly.
"""
import asyncio
import time
from app.llm.base import (
    LLMProvider, TaskType, LLMResponse,
    RateLimitError, ProviderUnavailableError, AllProvidersUnavailableError
)
from app.llm.retry import with_exponential_backoff, RetryConfig
from app.logger import get_logger

log = get_logger(__name__)

# Retry config for transient errors within one provider
# base=1s, max=16s, 3 attempts — fast enough for students, enough spread for jitter
_RETRY_CONFIG = RetryConfig(base_seconds=1.0, max_seconds=16.0, max_attempts=3)


class FailoverRouter:
    """
    Tries LLM providers in priority order.
    Per-provider: exponential backoff + full jitter on RateLimitError.
    Per-provider: circuit breaker — trips on repeated failure, cools for COOLDOWN_SECONDS.
    """

    def __init__(self, providers: list[LLMProvider], cooldown_seconds: int = 60):
        self.providers = providers
        self._cooldown = cooldown_seconds
        self._tripped: dict[str, float] = {}  # provider.name -> cooldown_until timestamp

    def _available(self, p: LLMProvider) -> bool:
        """Returns True if this provider is not in cooldown."""
        return time.monotonic() > self._tripped.get(p.name, 0)

    def _trip(self, p: LLMProvider) -> None:
        """Trip the circuit breaker — provider goes into cooldown."""
        self._tripped[p.name] = time.monotonic() + self._cooldown
        log.warning(f"[FailoverRouter] Circuit tripped: {p.name} cooling for {self._cooldown}s")

    @property
    def active_provider(self) -> str | None:
        for p in self.providers:
            if self._available(p):
                return p.name
        return None

    async def complete(self, prompt: str, task: TaskType) -> LLMResponse:
        """
        Complete a prompt, trying providers in order.
        Each provider gets up to 3 attempts with exponential backoff + jitter.
        If a provider exhausts all retries, it gets circuit-tripped and the next provider is tried.
        """
        for p in self.providers:
            if not self._available(p):
                log.info(f"[FailoverRouter] Skipping {p.name} — in cooldown")
                continue

            try:
                # Wrap each provider call in exponential backoff with full jitter.
                # Only retries on RateLimitError — a genuine API error (ProviderUnavailableError)
                # fails immediately and trips the circuit.
                result = await with_exponential_backoff(
                    fn=lambda provider=p: asyncio.wait_for(
                        provider.complete(prompt, task), timeout=60
                    ),
                    config=_RETRY_CONFIG,
                    retryable_exceptions=(RateLimitError,),
                    label=f"{p.name}.complete",
                )
                log.info(f"[FailoverRouter] OK via {p.name} model={result.model_used} latency={result.latency_ms}ms")
                return result

            except RateLimitError as e:
                # Exhausted all retries for this provider — trip circuit, try next
                log.warning(f"[FailoverRouter] {p.name} rate-limited after all retries: {e}")
                self._trip(p)

            except ProviderUnavailableError as e:
                # Hard failure (bad key, network error) — trip immediately, no retry needed
                log.warning(f"[FailoverRouter] {p.name} unavailable: {e}")
                self._trip(p)

            except asyncio.TimeoutError:
                log.warning(f"[FailoverRouter] {p.name} timed out after 60s")
                self._trip(p)

        raise AllProvidersUnavailableError(
            "All LLM providers are currently unavailable. Please try again in a minute."
        )

    async def health_status(self) -> list[dict]:
        statuses = []
        for p in self.providers:
            available = self._available(p)
            cooldown_remaining = max(0, self._tripped.get(p.name, 0) - time.monotonic())
            statuses.append({
                "name": p.name,
                "status": "available" if available else "cooling_down",
                "cooldown_remaining_seconds": round(cooldown_remaining, 1) if not available else 0,
                "models": p.tier_models,
            })
        return statuses

    # ── Delegate domain methods — all use the same backoff-protected complete() ──

    async def _delegate(self, method: str, *args, **kwargs):
        """
        Delegates to the first available provider.
        Uses the same circuit-breaker logic as complete().
        """
        for p in self.providers:
            if not self._available(p):
                continue
            try:
                return await with_exponential_backoff(
                    fn=lambda provider=p: asyncio.wait_for(
                        getattr(provider, method)(*args, **kwargs), timeout=60
                    ),
                    config=_RETRY_CONFIG,
                    retryable_exceptions=(RateLimitError,),
                    label=f"{p.name}.{method}",
                )
            except (RateLimitError, ProviderUnavailableError, asyncio.TimeoutError) as e:
                log.warning(f"[FailoverRouter] {p.name}.{method} failed: {e}")
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
