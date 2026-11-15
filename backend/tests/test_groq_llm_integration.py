"""
Comprehensive Unit Tests for Groq LLM Integration in PaperIQ AI Companion.
Verifies:
- All three model tier configurations (GROQ_MODEL, GROQ_MODEL_FAST, GROQ_MODEL_REASONING)
- Dynamic environment variable binding in Settings
- Task-tier resolution across all supported tasks
- Unsupported / deprecated model error mapping
- Visible fallback reporting in logs and response metadata (no silent fallbacks)
- Zero external network calls (100% mocked SDK calls)
"""
import pytest
import asyncio
import os
from unittest.mock import AsyncMock, MagicMock, patch
from dataclasses import dataclass

from app.config import settings, Settings
from app.llm.base import TaskType, LLMResponse, RateLimitError, ProviderUnavailableError
from app.llm.groq_provider import GroqProvider
from app.llm.failover_router import FailoverRouter
from app.companion.orchestrator import CompanionOrchestrator
from app.companion.specialists.academic_tutor import AcademicTutorSpecialist
from app.companion.specialists.general_guidance import GeneralGuidanceSpecialist
from app.companion.store import _memory_conversations
from app.llm import provider_factory
from groq import (
    RateLimitError as GroqRateLimit,
    APITimeoutError as GroqTimeoutError,
    AuthenticationError as GroqAuthError,
    APIConnectionError as GroqConnectionError,
    NotFoundError as GroqNotFoundError,
    BadRequestError as GroqBadRequestError,
)
import httpx


@pytest.fixture(autouse=True)
def reset_store_and_settings(monkeypatch):
    """Ensure clean isolated state for each test with production models."""
    _memory_conversations.clear()
    provider_factory._router = None
    monkeypatch.setattr(settings, "groq_api_key", "gsk_mock_test_key_12345")
    monkeypatch.setattr(settings, "groq_model", "openai/gpt-oss-120b")
    monkeypatch.setattr(settings, "groq_model_fast", "openai/gpt-oss-20b")
    monkeypatch.setattr(settings, "groq_model_medium", "openai/gpt-oss-120b")
    monkeypatch.setattr(settings, "groq_model_reasoning", "openai/gpt-oss-120b")
    monkeypatch.setattr(settings, "llm_request_timeout_seconds", 15)


def make_mock_groq_response(content: str = "Mocked Groq Answer", model: str = "openai/gpt-oss-120b", tokens: int = 150):
    """Build a mock ChatCompletion object resembling official Groq SDK response."""
    mock_choice = MagicMock()
    mock_choice.message.content = content
    mock_usage = MagicMock()
    mock_usage.total_tokens = tokens

    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]
    mock_resp.usage = mock_usage
    mock_resp.model = model
    return mock_resp


# ============================================================================
# 1. Groq Configuration & Environment Variable Binding Tests
# ============================================================================

class TestGroqConfiguration:
    def test_default_production_models_configured(self):
        """Verify the currently supported production model IDs are configured by default."""
        provider = GroqProvider()
        assert provider.name == "groq"
        assert provider.default_model == "openai/gpt-oss-120b"
        assert provider.tier_models["fast"] == "openai/gpt-oss-20b"
        assert provider.tier_models["medium"] == "openai/gpt-oss-120b"
        assert provider.tier_models["reasoning"] == "openai/gpt-oss-120b"

    def test_env_vars_read_all_three_models_from_environment(self, monkeypatch):
        """Verify GROQ_MODEL, GROQ_MODEL_FAST and GROQ_MODEL_REASONING are all read from env."""
        monkeypatch.setenv("GROQ_API_KEY", "gsk_custom_key_xyz")
        monkeypatch.setenv("GROQ_MODEL", "custom/primary-model-120b")
        monkeypatch.setenv("GROQ_MODEL_FAST", "custom/fast-model-20b")
        monkeypatch.setenv("GROQ_MODEL_REASONING", "custom/reasoning-model-70b")

        custom_settings = Settings()
        assert custom_settings.groq_api_key == "gsk_custom_key_xyz"
        assert custom_settings.groq_model == "custom/primary-model-120b"
        assert custom_settings.groq_model_fast == "custom/fast-model-20b"
        assert custom_settings.groq_model_reasoning == "custom/reasoning-model-70b"

    def test_groq_model_tier_resolution_across_all_tasks(self):
        """Verify model-tier resolver uses correct model for each task."""
        provider = GroqProvider()

        # Fast tier tasks -> openai/gpt-oss-20b
        assert provider.model_for(TaskType.QUESTION_CLASSIFICATION) == "openai/gpt-oss-20b"
        assert provider.model_for(TaskType.TOPIC_EXTRACTION) == "openai/gpt-oss-20b"
        assert provider.model_for(TaskType.READINESS_SCORING) == "openai/gpt-oss-20b"

        # Reasoning tier tasks -> openai/gpt-oss-120b
        assert provider.model_for(TaskType.STUDY_PLAN_GENERATION) == "openai/gpt-oss-120b"
        assert provider.model_for(TaskType.MOCK_EXAM_GENERATION) == "openai/gpt-oss-120b"
        assert provider.model_for(TaskType.EXAM_INSIGHTS) == "openai/gpt-oss-120b"

        # Primary / Medium tier tasks -> openai/gpt-oss-120b
        assert provider.model_for(TaskType.PATTERN_ANALYSIS) == "openai/gpt-oss-120b"
        assert provider.model_for(TaskType.SYLLABUS_MAPPING) == "openai/gpt-oss-120b"

    @pytest.mark.asyncio
    async def test_groq_health_check_true_when_key_present(self):
        provider = GroqProvider()
        assert await provider.health_check() is True

    @pytest.mark.asyncio
    async def test_groq_health_check_false_when_key_empty(self, monkeypatch):
        monkeypatch.setattr(settings, "groq_api_key", "")
        provider = GroqProvider()
        assert await provider.health_check() is False


# ============================================================================
# 2. Mocked Groq Completion, Error Mapping & Deprecation Handling Tests
# ============================================================================

class TestGroqCompletionMocked:
    @pytest.mark.asyncio
    async def test_groq_successful_completion(self):
        provider = GroqProvider()
        mock_response = make_mock_groq_response(
            content="### 0/1 Knapsack Solution\nDynamic programming recurrence.",
            model="openai/gpt-oss-120b",
            tokens=240
        )

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
            mock_client_cls.return_value = mock_client

            resp = await provider.complete("Explain knapsack", TaskType.EXAM_INSIGHTS)

            assert isinstance(resp, LLMResponse)
            assert resp.provider == "groq"
            assert resp.model_used == "openai/gpt-oss-120b"
            assert "0/1 Knapsack Solution" in resp.content
            assert resp.tokens_used == 240
            assert resp.latency_ms >= 0

            # Verify prompt and system message passed to SDK
            mock_client.chat.completions.create.assert_awaited_once()
            call_kwargs = mock_client.chat.completions.create.await_args.kwargs
            assert call_kwargs["model"] == "openai/gpt-oss-120b"
            assert len(call_kwargs["messages"]) == 2
            assert call_kwargs["messages"][0]["role"] == "system"
            assert call_kwargs["messages"][1]["content"] == "Explain knapsack"

    @pytest.mark.asyncio
    async def test_groq_unsupported_or_deprecated_model_error_mapping(self):
        """Verify 404 / 400 deprecated model errors are clearly caught and mapped."""
        provider = GroqProvider()
        mock_request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        mock_response = httpx.Response(404, request=mock_request, json={"error": {"message": "The model `llama-old-deprecated` does not exist"}})
        sdk_err = GroqNotFoundError("The model `llama-old-deprecated` does not exist", response=mock_response, body=None)

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=sdk_err)
            mock_client_cls.return_value = mock_client

            with pytest.raises(ProviderUnavailableError, match="unsupported or deprecated model"):
                await provider.complete("Explain knapsack", TaskType.EXAM_INSIGHTS)

    @pytest.mark.asyncio
    async def test_groq_rate_limit_error_mapping(self):
        provider = GroqProvider()
        mock_request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        mock_response = httpx.Response(429, request=mock_request, json={"error": {"message": "Rate limit reached"}})
        sdk_err = GroqRateLimit("Rate limit reached", response=mock_response, body=None)

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=sdk_err)
            mock_client_cls.return_value = mock_client

            with pytest.raises(RateLimitError, match="Groq rate limit"):
                await provider.complete("Explain knapsack", TaskType.EXAM_INSIGHTS)

    @pytest.mark.asyncio
    async def test_groq_timeout_error_mapping(self):
        provider = GroqProvider()
        mock_request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        sdk_err = GroqTimeoutError(mock_request)

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=sdk_err)
            mock_client_cls.return_value = mock_client

            with pytest.raises(ProviderUnavailableError, match="timed out"):
                await provider.complete("Explain knapsack", TaskType.EXAM_INSIGHTS)

    @pytest.mark.asyncio
    async def test_groq_auth_error_mapping(self):
        provider = GroqProvider()
        mock_request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        mock_response = httpx.Response(401, request=mock_request, json={"error": {"message": "Invalid API Key"}})
        sdk_err = GroqAuthError("Invalid API Key", response=mock_response, body=None)

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=sdk_err)
            mock_client_cls.return_value = mock_client

            with pytest.raises(ProviderUnavailableError, match="authentication failed"):
                await provider.complete("Explain knapsack", TaskType.EXAM_INSIGHTS)


# ============================================================================
# 3. Failover Router with Groq Tests
# ============================================================================

class TestFailoverRouterWithGroq:
    @pytest.mark.asyncio
    async def test_router_retries_on_rate_limit_and_succeeds(self):
        provider = GroqProvider()
        mock_request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        mock_response_429 = httpx.Response(429, request=mock_request, json={"error": {"message": "Rate limit"}})
        rate_limit_err = GroqRateLimit("Rate limit", response=mock_response_429, body=None)
        success_response = make_mock_groq_response("Recovered answer on retry", "openai/gpt-oss-120b")

        router = FailoverRouter([provider], cooldown_seconds=60)

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            # Fail on first attempt, succeed on second attempt
            mock_client.chat.completions.create = AsyncMock(side_effect=[rate_limit_err, success_response])
            mock_client_cls.return_value = mock_client

            with patch("app.llm.failover_router._RETRY_CONFIG") as mock_config:
                mock_config.base_seconds = 0.01
                mock_config.max_seconds = 0.05
                mock_config.max_attempts = 3

                resp = await router.complete("Explain Banker's Algorithm", TaskType.EXAM_INSIGHTS)
                assert resp.content == "Recovered answer on retry"
                assert mock_client.chat.completions.create.await_count == 2


# ============================================================================
# 4. Visible Fallback Metadata & Non-Silent Degradation Tests
# ============================================================================

class TestCompanionVisibleMetadataAndFallback:
    @pytest.mark.asyncio
    async def test_groq_success_reports_real_provider_and_model_metadata(self):
        """When Groq succeeds, response metadata explicitly identifies groq and the actual model."""
        orchestrator = CompanionOrchestrator()
        groq_llm_markdown = (
            "### 📘 0/1 Knapsack Branch and Bound (Synthesized via Groq)\n\n"
            "#### 1. Core Principle\nLCBB uses a priority queue with bounding function $\\hat{c}(x)$."
        )
        mock_groq_resp = make_mock_groq_response(groq_llm_markdown, "openai/gpt-oss-120b")

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_groq_resp)
            mock_client_cls.return_value = mock_client

            chat_resp = await orchestrator.process_chat(
                user_id="student-groq-success",
                message_text="Explain the Knapsack problem using LC Branch and Bound.",
                subject_code="A6CS15",
                regulation="R22",
            )

            # Metadata must explicitly show groq success, NOT fallback
            assert chat_resp.provider == "groq"
            assert chat_resp.model_used == "openai/gpt-oss-120b"
            assert chat_resp.is_fallback is False
            assert chat_resp.message.provider == "groq"
            assert chat_resp.message.model_used == "openai/gpt-oss-120b"
            assert chat_resp.message.is_fallback is False

    @pytest.mark.asyncio
    async def test_groq_deprecated_model_triggers_visible_fallback_metadata(self):
        """
        When Groq fails due to a deprecated/unsupported model, the system MUST NOT silently
        report success. It must explicitly tag is_fallback: True and provider: 'fallback'.
        """
        orchestrator = CompanionOrchestrator()

        mock_request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        mock_response_404 = httpx.Response(404, request=mock_request, json={"error": {"message": "Model is deprecated"}})
        deprecated_err = GroqNotFoundError("Model is deprecated", response=mock_response_404, body=None)

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=deprecated_err)
            mock_client_cls.return_value = mock_client

            chat_resp = await orchestrator.process_chat(
                user_id="student-groq-fallback",
                message_text="Explain the Knapsack problem using LC Branch and Bound.",
                subject_code="A6CS15",
                regulation="R22",
            )

            # Metadata must clearly flag that deterministic fallback occurred
            assert chat_resp.provider == "fallback"
            assert chat_resp.model_used == "deterministic_fallback"
            assert chat_resp.is_fallback is True
            assert chat_resp.message.provider == "fallback"
            assert chat_resp.message.is_fallback is True

            # Content is still academically sound from pre-verified R22 curriculum
            assert "0/1 Knapsack Problem using LC Branch and Bound" in chat_resp.message.content
            assert "MLRIT R22 DAA Unit V" in chat_resp.message.content

    @pytest.mark.asyncio
    async def test_general_guidance_uses_groq_and_reports_metadata(self):
        orchestrator = CompanionOrchestrator()
        guidance_text = "### 🎯 Recommended Study Strategy for R22 Exams\nFocus on Unit 1 and Unit 3 high-yield topics."
        mock_groq_resp = make_mock_groq_response(guidance_text, "openai/gpt-oss-120b")

        with patch("groq.AsyncGroq") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_groq_resp)
            mock_client_cls.return_value = mock_client

            chat_resp = await orchestrator.process_chat(
                user_id="student-groq-guidance",
                message_text="Hello, what can you do to help me ace my autonomous examinations?",
                subject_code="A6CS15",
                regulation="R22",
            )

            assert "Recommended Study Strategy for R22 Exams" in chat_resp.message.content
            assert chat_resp.specialist_badge == "AI Companion Guide"
            assert chat_resp.provider == "groq"
            assert chat_resp.is_fallback is False
