import re
from typing import Optional

_MARKS_PATTERNS = [
    re.compile(r"\b(\d{1,2})[Mm]\b"),
    re.compile(r"\((\d{1,2})[Mm]\)"),
    re.compile(r"\b(\d{1,2})\s*[Mm]arks?\b", re.I),
    re.compile(r"\((\d{1,2})\)"),
    re.compile(r"\b(\d{1,2})\s*[Mm]\s*$"),
]

_VALID_MARKS = {1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 15, 20}


def extract_marks(text: str) -> tuple[Optional[int], str]:
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
    s = section.lower()
    if "part a" in s or "section a" in s:
        return 1
    if "part b" in s or "section b" in s:
        return 5
    return None
