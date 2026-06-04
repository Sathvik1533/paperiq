from app.config import settings
from app.llm.groq_provider import GroqProvider
from app.llm.openrouter_provider import OpenRouterProvider
from app.llm.ollama_provider import OllamaProvider
from app.llm.failover_router import FailoverRouter
from app.logger import get_logger

log = get_logger(__name__)

_router: FailoverRouter | None = None


def build_llm_router() -> FailoverRouter:
    order = settings.llm_provider_list
    provider_map = {
        "groq"       : GroqProvider,
        "openrouter" : OpenRouterProvider,
        "ollama"     : OllamaProvider,
    }
    providers = []
    for name in order:
        cls = provider_map.get(name)
        if cls:
            providers.append(cls())
            log.info(f"[LLM] Registered provider: {name}")

    if not providers:
        raise RuntimeError("No LLM providers configured. Set at least GROQ_API_KEY.")

    return FailoverRouter(
        providers=providers,
        cooldown_seconds=settings.llm_failover_cooldown_seconds,
    )


def get_llm_router() -> FailoverRouter:
    global _router
    if _router is None:
        _router = build_llm_router()
    return _router
