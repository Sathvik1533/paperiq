"""
retry.py — Exponential backoff with full jitter

The pattern:
  wait = random(0, min(cap, base * 2^attempt))

"Full jitter" (the random() part) is the production-standard approach.
AWS, Google Cloud, Stripe, and every major API client use this exact formula.

WHY jitter matters for PaperIQ:
  Without jitter: 20 students all hit Groq rate limit → all wait 60s → all retry
                  at second 60 → rate limit again → all wait 120s → etc.
                  This is called a "thundering herd" — users DoS their own backend.

  With jitter:    20 students all hit rate limit → each waits a DIFFERENT random
                  amount between 0 and their cap → they naturally stagger across
                  the next 30-60 seconds → Groq sees a smooth trickle, not a spike.
                  Most users get through. Latency is spread, not amplified.

Parameters:
  base_seconds: starting wait (default 1s — short first retry)
  max_seconds:  ceiling on wait time (default 32s — never wait longer than this)
  max_attempts: how many times to retry before giving up (default 5)

Usage:
  from app.llm.retry import with_exponential_backoff, RetryConfig

  result = await with_exponential_backoff(
      fn=lambda: provider.complete(prompt, task),
      config=RetryConfig(max_attempts=5),
      retryable_exceptions=(RateLimitError,),
  )
"""
import asyncio
import random
import time
from dataclasses import dataclass
from typing import Callable, Awaitable, TypeVar, Type, Tuple

from app.logger import get_logger

log = get_logger(__name__)

T = TypeVar("T")


@dataclass
class RetryConfig:
    base_seconds: float = 1.0   # first retry waits 0–1s
    max_seconds: float = 32.0   # never wait more than 32s
    max_attempts: int = 5       # total tries (first call + 4 retries)


def _jitter_wait(attempt: int, config: RetryConfig) -> float:
    """
    Full-jitter exponential backoff.

    attempt 0 (first retry): wait = random(0, min(32, 1 * 2^1)) = random(0, 2)
    attempt 1:                wait = random(0, min(32, 1 * 2^2)) = random(0, 4)
    attempt 2:                wait = random(0, min(32, 1 * 2^3)) = random(0, 8)
    attempt 3:                wait = random(0, min(32, 1 * 2^4)) = random(0, 16)
    attempt 4:                wait = random(0, min(32, 1 * 2^5)) = random(0, 32)

    The key: every caller gets a DIFFERENT random value → they stagger naturally.
    No two students retry at the exact same moment.
    """
    cap = min(config.max_seconds, config.base_seconds * (2 ** (attempt + 1)))
    return random.uniform(0, cap)


async def with_exponential_backoff(
    fn: Callable[[], Awaitable[T]],
    config: RetryConfig = RetryConfig(),
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    label: str = "llm_call",
) -> T:
    """
    Call fn() with exponential backoff + full jitter on retryable_exceptions.

    On success: returns the result immediately.
    On retryable error: waits, then retries up to max_attempts times.
    After max_attempts: re-raises the last exception.

    The label is just for log messages — pass something descriptive.
    """
    last_exc: Exception = RuntimeError("No attempts made")

    for attempt in range(config.max_attempts):
        try:
            return await fn()

        except retryable_exceptions as e:
            last_exc = e
            is_last = attempt == config.max_attempts - 1

            if is_last:
                log.error(f"[Retry:{label}] All {config.max_attempts} attempts failed. Last error: {e}")
                raise

            wait = _jitter_wait(attempt, config)
            log.warning(
                f"[Retry:{label}] Attempt {attempt + 1}/{config.max_attempts} failed "
                f"({type(e).__name__}). Retrying in {wait:.2f}s..."
            )
            await asyncio.sleep(wait)

    raise last_exc  # unreachable, but makes type checker happy
