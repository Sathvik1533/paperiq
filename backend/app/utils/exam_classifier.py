"""
Exam Classification Utilities
Detects exam category (Mid-1, Mid-2, Semester), regulation, and exam dates from paper labels.
"""
import re
from typing import Optional, Tuple


def detect_exam_category(label: str) -> str:
    """
    Extract exam category from portal label or paper title.
    
    Returns: "Mid-1" | "Mid-2" | "Semester" | "Unknown"
    """
    label_lower = label.lower()

    # Mid-2 must be checked BEFORE Mid-1 — "mid-ii" contains "mid-i" as substring
    if any(p in label_lower for p in ['mid-2', 'mid 2', 'mid-ii', 'mid ii', 'second mid', 'midterm-2', 'midterm2']):
        return 'Mid-2'

    # Mid-1 patterns
    if any(p in label_lower for p in ['mid-1', 'mid 1', 'mid-i', 'mid i ', 'first mid', 'midterm-1', 'midterm1']):
        return 'Mid-1'
    
    # Semester patterns
    if any(p in label_lower for p in ['semester', 'sem exam', 'end sem', 'final exam']):
        return 'Semester'
    
    return 'Unknown'


def detect_regulation(label: str) -> Optional[str]:
    """
    Extract regulation code from label.
    
    Patterns: R22, R20, R18, R16, R13, etc.
    Returns: "R22" | "R20" | None
    """
    # Pattern: R followed by 2 digits
    match = re.search(r'\b(R\d{2})\b', label, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    
    # Alternative pattern: R-22, R.22
    match = re.search(r'\b(R[-.]?\d{2})\b', label, re.IGNORECASE)
    if match:
        code = match.group(1).upper()
        return code.replace('-', '').replace('.', '')
    
    return None


def detect_exam_type(label: str) -> str:
    """
    Detect exam attempt type (Regular or Supplementary).
    
    Returns: "Regular" | "Supplementary"
    """
    label_lower = label.lower()
    
    # Supplementary patterns
    if any(w in label_lower for w in ["supply", "supple", "supplementary", "backlog"]):
        return "Supplementary"
    
    return "Regular"


def detect_exam_year_month(label: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Extract exam year and month from label.
    
    Patterns:
    - "May 2024" → (2024, "May")
    - "2024 May" → (2024, "May")
    - "Dec-2023" → (2023, "December")
    - "2024" → (2024, None)
    
    Returns: (year, month) tuple where both can be None
    """
    # Month names mapping
    months = {
        'jan': 'January', 'january': 'January',
        'feb': 'February', 'february': 'February',
        'mar': 'March', 'march': 'March',
        'apr': 'April', 'april': 'April',
        'may': 'May',
        'jun': 'June', 'june': 'June',
        'jul': 'July', 'july': 'July',
        'aug': 'August', 'august': 'August',
        'sep': 'September', 'september': 'September', 'sept': 'September',
        'oct': 'October', 'october': 'October',
        'nov': 'November', 'november': 'November',
        'dec': 'December', 'december': 'December',
    }
    
    year = None
    month = None
    
    # Extract year (2020-2029)
    year_match = re.search(r'\b(202[0-9])\b', label)
    if year_match:
        year = int(year_match.group(1))
    
    # Extract month
    label_lower = label.lower()
    for month_pattern, month_name in months.items():
        if re.search(r'\b' + month_pattern + r'\b', label_lower):
            month = month_name
            break
    
    return year, month


def classify_paper_from_label(label: str) -> dict:
    """
    Extract all classification metadata from a paper label.
    
    Returns:
        {
            "exam_category": "Mid-1" | "Mid-2" | "Semester" | "Unknown",
            "exam_type": "Regular" | "Supplementary",
            "regulation": "R22" | None,
            "exam_year": 2024 | None,
            "exam_month": "May" | None
        }
    """
    year, month = detect_exam_year_month(label)
    
    return {
        "exam_category": detect_exam_category(label),
        "exam_type": detect_exam_type(label),
        "regulation": detect_regulation(label),
        "exam_year": year,
        "exam_month": month,
    }
