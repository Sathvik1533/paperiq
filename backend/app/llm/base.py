from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class TaskType(str, Enum):
    QUESTION_CLASSIFICATION = "question_classification"
    TOPIC_EXTRACTION        = "topic_extraction"
    PATTERN_ANALYSIS        = "pattern_analysis"
    SYLLABUS_MAPPING        = "syllabus_mapping"
    STUDY_PLAN_GENERATION   = "study_plan_generation"
    MOCK_EXAM_GENERATION    = "mock_exam_generation"
    EXAM_INSIGHTS           = "exam_insights"
    READINESS_SCORING       = "readiness_scoring"


# Task -> model tier mapping (provider-agnostic)
TASK_TIER: dict[TaskType, str] = {
    TaskType.QUESTION_CLASSIFICATION : "fast",
    TaskType.TOPIC_EXTRACTION        : "fast",
    TaskType.PATTERN_ANALYSIS        : "medium",
    TaskType.SYLLABUS_MAPPING        : "medium",
    TaskType.STUDY_PLAN_GENERATION   : "reasoning",
    TaskType.MOCK_EXAM_GENERATION    : "reasoning",
    TaskType.EXAM_INSIGHTS           : "reasoning",
    TaskType.READINESS_SCORING       : "fast",
}


@dataclass
class LLMResponse:
    content: str
    model_used: str
    provider: str
    tokens_used: int
    latency_ms: int


class LLMProviderError(Exception):
    pass

class RateLimitError(LLMProviderError):
    pass

class ProviderUnavailableError(LLMProviderError):
    pass

class AllProvidersUnavailableError(LLMProviderError):
    pass


class LLMProvider(ABC):
    name: str = "base"
    tier_models: dict  # {"fast": "...", "medium": "...", "reasoning": "..."}

    def model_for(self, task: TaskType) -> str:
        tier = TASK_TIER.get(task, "fast")
        return self.tier_models.get(tier, self.tier_models.get("fast", ""))

    @abstractmethod
    async def complete(self, prompt: str, task: TaskType) -> LLMResponse:
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        ...

    # ── Domain methods (implemented by subclasses via complete()) ────

    async def classify_questions(self, questions: list[str]) -> list[dict]:
        raise NotImplementedError

    async def extract_topics(self, text: str, subject: str) -> list[str]:
        raise NotImplementedError

    async def analyze_patterns(self, questions: list[dict], years: list[int]) -> dict:
        raise NotImplementedError

    async def map_to_syllabus(self, questions: list[dict], syllabus: dict) -> dict:
        raise NotImplementedError

    async def generate_study_plan(self, analysis: dict, constraints: dict) -> dict:
        raise NotImplementedError

    async def generate_mock_exam(self, analysis: dict, pattern: dict) -> dict:
        raise NotImplementedError

    async def generate_exam_insights(self, analysis: dict) -> dict:
        raise NotImplementedError

    async def score_readiness(self, user_activity: dict, analysis: dict) -> dict:
        raise NotImplementedError
