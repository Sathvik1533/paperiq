from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    # App
    environment: str = "development"
    secret_key: str = ""  # REQUIRED: Set in production via SECRET_KEY env var
    api_version: str = "v1"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    redis_url: str = ""  # Shared rate-limiting & cache storage URI (e.g. redis://...)
    trusted_proxies: str = "127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""
    supabase_storage_bucket: str = "papers"
    supabase_pool_size: int = 20  # Connection pool size for production

    # LLM
    llm_provider_order: str = "groq,openrouter,ollama"
    llm_failover_cooldown_seconds: int = 60
    llm_request_timeout_seconds: int = 30

    # Groq (Supported production models)
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_model_fast: str = "openai/gpt-oss-20b"
    groq_model_medium: str = "openai/gpt-oss-120b"
    groq_model_reasoning: str = "openai/gpt-oss-120b"

    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model_fast: str = "qwen/qwen-2.5-7b-instruct:free"
    openrouter_model_medium: str = "mistralai/mistral-7b-instruct:free"
    openrouter_model_reasoning: str = "deepseek/deepseek-r1:free"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model_fast: str = "qwen2.5:7b"
    ollama_model_medium: str = "qwen2.5:14b"
    ollama_model_reasoning: str = "deepseek-r1:14b"

    # Payments
    payment_provider: str = "free"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    stripe_secret_key: str = ""

    # Scraper
    scraper_timeout_seconds: int = 30
    scraper_max_retries: int = 3
    scraper_download_dir: str = "/tmp/paperiq_downloads"

    # Production Performance
    uvicorn_workers: int = 9
    uvicorn_limit_concurrency: int = 1000
    uvicorn_timeout_keep_alive: int = 5

    # Sentry
    sentry_dsn: str = ""

    # Admin API key for protected endpoints
    admin_api_key: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def llm_provider_list(self) -> List[str]:
        return [p.strip() for p in self.llm_provider_order.split(",")]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
