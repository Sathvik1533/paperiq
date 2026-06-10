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

def extract_dynamic_marks(raw_text: str) -> Optional[float]:
    """
    Scans the extracted raw_text of a paper for section markers (Part A, Part B, etc.)
    and dynamic mark totals (e.g., '10 x 2 = 20' or '5 x 10M = 50Marks').
    Adds them together to find the true max_evaluation_marks (e.g. 20 + 50 = 70).
    Falls back to 'Max. Marks: 60' or similar headers if section math is missing.
    """
    if not raw_text:
        return None
        
    # Example format: 10 x 2 = 20 or 5 x 10M = 50Marks
    # We look for equations matching: <number> x <number>[M] = <total>
    matches = re.findall(r'\d+\s*[xX*]\s*\d+[a-zA-Z]*\s*=\s*(\d+)', raw_text)
    
    # We typically expect 2 parts (Part A and Part B).
    if matches and len(matches) >= 2:
        try:
            total = sum(int(m) for m in matches[:2])
            if total > 0:
                return float(total)
        except ValueError:
            pass
            
    # Fallback to header "Max. Marks: 70" or "Max Marks: 60"
    m = re.search(r'Max\.?\s*Marks:\s*(\d+)', raw_text, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
            
    return None
