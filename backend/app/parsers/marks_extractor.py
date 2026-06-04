"""
Extracts marks value from question text or table cell strings.
Handles: "5M", "10M", "7M", "5 Marks", "10 marks", "(5)", "(10M)"
"""
import re
from typing import Optional

# Patterns in priority order
_MARKS_PATTERNS = [
    re.compile(r"\b(\d{1,2})[Mm]\b"),                   # 5M, 10M, 7M
    re.compile(r"\((\d{1,2})[Mm]\)"),                   # (5M), (10M)
    re.compile(r"\b(\d{1,2})\s*[Mm]arks?\b", re.I),    # 5 marks, 5 Mark
    re.compile(r"\((\d{1,2})\)"),                        # (5), (10)
    re.compile(r"\b(\d{1,2})\s*[Mm]\s*$"),              # trailing "5 M"
]

# Valid mark values for academic papers
_VALID_MARKS = {1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 15, 20}


def extract_marks(text: str) -> tuple[Optional[int], str]:
    """
    Returns (marks_int, original_marks_string).
    Returns (None, "") if no marks found.
    """
    if not text:
        return None, ""

    for pattern in _MARKS_PATTERNS:
        m = pattern.search(text)
        if m:
            val = int(m.group(1))
            if val in _VALID_MARKS:
                return val, m.group(0).strip()

    return None, ""


def infer_marks_from_section(section: str, question_number: str) -> Optional[int]:
    """
    Fallback: infer marks from section/context when not explicitly stated.
    Part A questions are typically 1M or 2M.
    Part B questions are typically 5M or 10M.
    """
    s = section.lower()
    if "part a" in s or "section a" in s:
        return 1
    if "part b" in s or "section b" in s:
        return 5
    return None
