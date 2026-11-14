"""
Groq LLM Provider implementation using the official Groq Python SDK.
Supports non-blocking async execution via AsyncGroq, dynamic model tier resolution,
and comprehensive error mapping (rate limits, timeouts, authentication, unsupported models).
"""
import time
import asyncio
from typing import Optional

from app.llm.base import (
    LLMProvider, LLMResponse, TaskType,
    RateLimitError, ProviderUnavailableError
)
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)


class GroqProvider(LLMProvider):
    name = "groq"

    def __init__(self):
        # Dynamically read configured production models from settings / environment variables
        primary_model = getattr(settings, "groq_model", "") or getattr(settings, "groq_model_medium", "") or "openai/gpt-oss-120b"
        fast_model = getattr(settings, "groq_model_fast", "") or "openai/gpt-oss-20b"
        reasoning_model = getattr(settings, "groq_model_reasoning", "") or "openai/gpt-oss-120b"

        self.default_model = primary_model
        self.tier_models = {
            "fast"      : fast_model,
            "medium"    : primary_model,
            "reasoning" : reasoning_model,
        }

    def model_for(self, task: TaskType) -> str:
        """
        Resolve appropriate Groq model for the given task.
        Fast tier: QUESTION_CLASSIFICATION, TOPIC_EXTRACTION, READINESS_SCORING (openai/gpt-oss-20b)
        Reasoning tier: STUDY_PLAN_GENERATION, MOCK_EXAM_GENERATION, EXAM_INSIGHTS (openai/gpt-oss-120b)
        Primary tier: PATTERN_ANALYSIS, SYLLABUS_MAPPING, and general queries (openai/gpt-oss-120b).
        """
        # Re-check settings in case of dynamic environment variable override
        fast_model = getattr(settings, "groq_model_fast", "") or self.tier_models.get("fast", "openai/gpt-oss-20b")
        reasoning_model = getattr(settings, "groq_model_reasoning", "") or self.tier_models.get("reasoning", "openai/gpt-oss-120b")
        primary_model = getattr(settings, "groq_model", "") or getattr(settings, "groq_model_medium", "") or self.tier_models.get("medium", "openai/gpt-oss-120b")

        if task in (TaskType.QUESTION_CLASSIFICATION, TaskType.TOPIC_EXTRACTION, TaskType.READINESS_SCORING):
            return fast_model
        if task in (TaskType.STUDY_PLAN_GENERATION, TaskType.MOCK_EXAM_GENERATION, TaskType.EXAM_INSIGHTS):
            return reasoning_model
        return primary_model

    async def health_check(self) -> bool:
        """Verify that GROQ_API_KEY is configured."""
        return bool(settings.groq_api_key and settings.groq_api_key.strip())

    async def complete(self, prompt: str, task: TaskType) -> LLMResponse:
        """
        Execute completion with the official Groq SDK asynchronously.
        Catches rate limits, timeouts, and API exceptions with explicit error hierarchy.
        """
        if not settings.groq_api_key or not settings.groq_api_key.strip():
            raise ProviderUnavailableError("GROQ_API_KEY not set")

        timeout_sec = float(getattr(settings, "llm_request_timeout_seconds", 30))
        model = self.model_for(task)

        try:
            from groq import (
                AsyncGroq,
                RateLimitError as GroqRateLimit,
                APITimeoutError as GroqTimeoutError,
                APIConnectionError as GroqConnectionError,
                AuthenticationError as GroqAuthError,
                NotFoundError as GroqNotFoundError,
                BadRequestError as GroqBadRequestError,
                GroqError,
            )

            client = AsyncGroq(
                api_key=settings.groq_api_key.strip(),
                timeout=timeout_sec,
            )
            t0 = time.monotonic()

            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are PaperIQ, an expert academic tutor and exam intelligence assistant "
                            "for engineering students under MLRIT autonomous R22 curriculum. "
                            "Ground all explanations strictly in official curriculum, syllabus topics, "
                            "and textbook standards. Never hallucinate non-existent course codes or past papers."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4096,
                temperature=0.3,
            )

            latency = int((time.monotonic() - t0) * 1000)
            content = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0

            return LLMResponse(
                content=content,
                model_used=model,
                provider=self.name,
                tokens_used=tokens,
                latency_ms=latency,
            )

        except (GroqNotFoundError, GroqBadRequestError) as e:
            err_msg = str(e).lower()
            log.error(f"[GroqProvider] Model compatibility error for '{model}': {e}")
            raise ProviderUnavailableError(f"Groq unsupported or deprecated model '{model}': {e}") from e

        except GroqRateLimit as e:
            log.warning(f"[GroqProvider] Rate limit encountered on model '{model}': {e}")
            raise RateLimitError(f"Groq rate limit: {e}") from e

        except (GroqTimeoutError, asyncio.TimeoutError) as e:
            log.warning(f"[GroqProvider] Timeout on model '{model}' after {timeout_sec}s: {e}")
            raise ProviderUnavailableError(f"Groq request timed out after {timeout_sec}s: {e}") from e

        except GroqAuthError as e:
            log.error(f"[GroqProvider] Authentication error: {e}")
            raise ProviderUnavailableError(f"Groq authentication failed (check GROQ_API_KEY): {e}") from e

        except (GroqConnectionError, GroqError) as e:
            log.warning(f"[GroqProvider] API error on model '{model}': {e}")
            raise ProviderUnavailableError(f"Groq API error: {e}") from e

        except Exception as e:
            err = str(e).lower()
            if "rate" in err or "429" in err:
                raise RateLimitError(f"Groq rate limit: {e}") from e
            log.error(f"[GroqProvider] Unexpected error on model '{model}': {e}")
            raise ProviderUnavailableError(f"Groq error: {e}") from e
