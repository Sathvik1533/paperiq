"""
Exam Classification Utilities
Detects exam category (Mid-1, Mid-2, Semester) and regulation from paper labels.
"""
import re
from typing import Optional


def detect_exam_category(label: str) -> str:
    """
    Extract exam category from portal label or paper title.
    
    Returns: "Mid-1" | "Mid-2" | "Semester" | "Unknown"
    """
    label_lower = label.lower()
    
    # Mid-2 patterns — check BEFORE Mid-1 to prevent 'mid-i' matching inside 'mid-ii'
    if any(p in label_lower for p in ['mid-2', 'mid 2', 'mid-ii', 'mid ii', 'second mid']):
        return 'Mid-2'

    # Mid-1 patterns
    if any(p in label_lower for p in ['mid-1', 'mid 1', 'mid i ', 'first mid']) or re.search(r'mid[-\s]i(?!i)\b', label_lower):
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


def classify_paper_from_label(label: str) -> dict:
    """
    Extract all classification metadata from a paper label.
    
    Returns:
        {
            "exam_category": "Mid-1" | "Mid-2" | "Semester" | "Unknown",
            "exam_type": "Regular" | "Supplementary",
            "regulation": "R22" | None
        }
    """
    return {
        "exam_category": detect_exam_category(label),
        "exam_type": detect_exam_type(label),
        "regulation": detect_regulation(label),
    }
