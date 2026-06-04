from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import uuid


class QuestionType(str, Enum):
    DEFINITION   = "definition"
    THEORY       = "theory"
    PROOF        = "proof"
    NUMERICAL    = "numerical"
    PROBLEM      = "problem"
    CONSTRUCTION = "construction"
    COMPARISON   = "comparison"
    UNKNOWN      = "unknown"


class QuestionSection(str, Enum):
    PART_A  = "Part A"
    PART_B  = "Part B"
    UNKNOWN = "Unknown"


class ParsedQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    paper_id: str
    subject_id: Optional[str] = None
    question_number: str = ""
    section: QuestionSection = QuestionSection.UNKNOWN
    is_or_question: bool = False
    question_text: str
    raw_snippet: str = ""
    question_type: QuestionType = QuestionType.UNKNOWN
    type_confidence: float = 0.0
    marks: Optional[int] = None
    marks_text: str = ""
    co: Optional[str] = None
    bloom_level: Optional[str] = None
    unit_number: Optional[int] = None
    normalized_text: str = ""
    question_hash: str = ""
    parse_confidence: float = 1.0

    model_config = {"use_enum_values": True}


class ParseResult(BaseModel):
    paper_id: str
    questions: List[ParsedQuestion]
    total_questions: int
    part_a_count: int
    part_b_count: int
    parse_warnings: List[str] = Field(default_factory=list)
