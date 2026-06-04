import time
from app.llm.base import LLMProvider, LLMResponse, TaskType, RateLimitError, ProviderUnavailableError
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)


class GroqProvider(LLMProvider):
    name = "groq"

    def __init__(self):
        self.tier_models = {
            "fast"      : settings.groq_model_fast,
            "medium"    : settings.groq_model_medium,
            "reasoning" : settings.groq_model_reasoning,
        }

    async def health_check(self) -> bool:
        return bool(settings.groq_api_key)

    async def complete(self, prompt: str, task: TaskType) -> LLMResponse:
        if not settings.groq_api_key:
            raise ProviderUnavailableError("GROQ_API_KEY not set")
        try:
            from groq import Groq, RateLimitError as GroqRateLimit
            client = Groq(api_key=settings.groq_api_key)
            model = self.model_for(task)
            t0 = time.monotonic()
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=4096,
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
        except Exception as e:
            err = str(e).lower()
            if "rate" in err or "429" in err:
                raise RateLimitError(f"Groq rate limit: {e}") from e
            raise ProviderUnavailableError(f"Groq error: {e}") from e
