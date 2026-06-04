"""
Pydantic models for parsed questions.
Every field is traceable back to the source document.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import uuid


class QuestionType(str, Enum):
    DEFINITION   = "definition"    # "Define X", "What is X"
    THEORY       = "theory"        # "Explain X", "Describe X", "Discuss X"
    PROOF        = "proof"         # "Prove X", "Show that X", "Verify X"
    NUMERICAL    = "numerical"     # "Solve X", "Find X", "Calculate X"
    PROBLEM      = "problem"       # "Determine X", "Apply X", complex multi-step
    CONSTRUCTION = "construction"  # "Draw X", "Construct X", "Sketch X"
    COMPARISON   = "comparison"    # "Compare X and Y", "Differentiate X from Y"
    UNKNOWN      = "unknown"


class QuestionSection(str, Enum):
    PART_A = "Part A"   # 1-mark / 2-mark short answers
    PART_B = "Part B"   # 5-mark / 10-mark long answers
    UNKNOWN = "Unknown"


class ParsedQuestion(BaseModel):
    # Identity
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    paper_id: str
    subject_id: Optional[str] = None

    # Position in paper
    question_number: str = ""       # "1a", "2", "Q5b", "OR"
    section: QuestionSection = QuestionSection.UNKNOWN
    is_or_question: bool = False    # True if this is the "OR" alternative

    # Content
    question_text: str
    raw_snippet: str = ""           # exact slice from raw_text for traceability

    # Classification
    question_type: QuestionType = QuestionType.UNKNOWN
    type_confidence: float = 0.0    # 0.0–1.0

    # Marks
    marks: Optional[int] = None
    marks_text: str = ""            # original marks string e.g. "5M", "7M", "10M"

    # Academic metadata
    co: Optional[str] = None        # Course Outcome e.g. "CO1"
    bloom_level: Optional[str] = None  # "BL1"–"BL5"
    unit_number: Optional[int] = None  # populated in M4

    # Dedup
    normalized_text: str = ""       # lowercase stripped for matching
    question_hash: str = ""         # SHA-256 of normalized_text

    # Parse confidence
    parse_confidence: float = 1.0   # overall parser confidence for this question

    class Config:
        use_enum_values = True


class ParseResult(BaseModel):
    """Full output of QuestionParser.parse() for one paper."""
    paper_id: str
    questions: List[ParsedQuestion]
    total_questions: int
    part_a_count: int
    part_b_count: int
    parse_warnings: List[str] = Field(default_factory=list)
