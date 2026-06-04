import time
from app.llm.base import LLMProvider, LLMResponse, TaskType, ProviderUnavailableError
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)


class OllamaProvider(LLMProvider):
    name = "ollama"

    def __init__(self):
        self.tier_models = {
            "fast"      : settings.ollama_model_fast,
            "medium"    : settings.ollama_model_medium,
            "reasoning" : settings.ollama_model_reasoning,
        }

    async def health_check(self) -> bool:
        if not settings.ollama_base_url:
            return False
        try:
            import httpx
            async with httpx.AsyncClient(timeout=3) as c:
                r = await c.get(f"{settings.ollama_base_url}/api/tags")
                return r.status_code == 200
        except Exception:
            return False

    async def complete(self, prompt: str, task: TaskType) -> LLMResponse:
        try:
            import ollama as ol
            model = self.model_for(task)
            t0 = time.monotonic()
            response = ol.chat(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            latency = int((time.monotonic() - t0) * 1000)
            content = response["message"]["content"]
            return LLMResponse(
                content=content,
                model_used=model,
                provider=self.name,
                tokens_used=0,
                latency_ms=latency,
            )
        except Exception as e:
            raise ProviderUnavailableError(f"Ollama error: {e}") from e
