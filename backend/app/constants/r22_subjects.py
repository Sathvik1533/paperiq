"""
R22 CSE Subject Master Registry
================================

OFFICIAL MLRIT R22 CSE subject mapping - single source of truth.
All scripts must import from this file to ensure consistency.

Verified By: Academic Office + Official Autonomous Syllabus Scheme
"""
from __future__ import annotations
from typing import Optional

# ── Semester 2-1 (II B.Tech I Semester) ────────────────────────────────────────

R22_SEMESTER_2_1 = {
    "A6CS03": {
        "name": "Object Oriented Programming through Java",
        "semester": 1,
        "year": 2,
        "branch": "CSE",
        "short": "OOPS",
        "credits": 3.0,
        "category": "PCC",
    },
    "A6CS01": {
        "name": "Digital Electronics and Computer Organization",
        "semester": 1,
        "year": 2,
        "branch": "CSE",
        "short": "DECO",
        "credits": 3.0,
        "category": "PCC",
    },
    "A6CS05": {
        "name": "Data Structures",
        "semester": 1,
        "year": 2,
        "branch": "CSE",
        "short": "DS",
        "credits": 3.0,
        "category": "PCC",
    },
    "A6CS10": {
        "name": "Software Engineering",
        "semester": 1,
        "year": 2,
        "branch": "CSE",
        "short": "SE",
        "credits": 3.0,
        "category": "PCC",
    },
    "A6BS04": {
        "name": "Computer Oriented Statistical Methods",
        "semester": 1,
        "year": 2,
        "branch": "BS",
        "short": "COSM",
        "credits": 3.0,
        "category": "BSC",
    },
    # Deployed DB code aliases
    "A6CS28": {
        "name": "Digital Electronics and Computer Organization",
        "semester": 1,
        "year": 2,
        "branch": "CSE",
        "short": "DECO",
        "credits": 3.0,
        "category": "PCC",
        "alias_of": "A6CS01",
    },
    "A6CS07": {
        "name": "Software Engineering",
        "semester": 1,
        "year": 2,
        "branch": "CSE",
        "short": "SE",
        "credits": 3.0,
        "category": "PCC",
        "alias_of": "A6CS10",
    },
    "A6BS03": {
        "name": "Computer Oriented Statistical Methods",
        "semester": 1,
        "year": 2,
        "branch": "BS",
        "short": "COSM",
        "credits": 3.0,
        "category": "BSC",
        "alias_of": "A6BS04",
    },
    "A6IT02": {
        "name": "Object Oriented Programming through Java",
        "semester": 1,
        "year": 2,
        "branch": "CSE",
        "short": "OOPS",
        "credits": 3.0,
        "category": "PCC",
        "alias_of": "A6CS03",
    },
}

# ── Semester 2-2 (II B.Tech II Semester) ───────────────────────────────────────

R22_SEMESTER_2_2 = {
    "A6BS05": {
        "name": "Business Economics and Financial Analysis",
        "semester": 2,
        "year": 2,
        "branch": "BS",
        "short": "BEFA",
        "credits": 3.0,
        "category": "HSMC",
    },
    "A6CS08": {
        "name": "Discrete Mathematics",
        "semester": 2,
        "year": 2,
        "branch": "CSE",
        "short": "DM",
        "credits": 3.0,
        "category": "PCC",
    },
    "A6CS09": {
        "name": "Database Management Systems",
        "semester": 2,
        "year": 2,
        "branch": "CSE",
        "short": "DBMS",
        "credits": 3.0,
        "category": "PCC",
    },
    "A6CS11": {
        "name": "Operating System",
        "semester": 2,
        "year": 2,
        "branch": "CSE",
        "short": "OS",
        "credits": 3.0,
        "category": "PCC",
    },
    "A6CS13": {
        "name": "Software Testing Fundamentals",
        "semester": 2,
        "year": 2,
        "branch": "CSE",
        "short": "STF",
        "credits": 3.0,
        "category": "PCC",
    },
    # Deployed DB code aliases
    "A6HS08": {
        "name": "Business Economics and Financial Analysis",
        "semester": 2,
        "year": 2,
        "branch": "BS",
        "short": "BEFA",
        "credits": 3.0,
        "category": "HSMC",
        "alias_of": "A6BS05",
    },
}

# ── Semester 3-1 (III B.Tech I Semester) ───────────────────────────────────────

R22_SEMESTER_3_1 = {
    "A6CS15": {
        "name": "Design and Analysis of Algorithms",
        "semester": 1,
        "year": 3,
        "branch": "CSE",
        "short": "DAA",
        "credits": 3.0,
        "category": "PCC",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6IT13": {
        "name": "Cloud and DevOps",
        "semester": 1,
        "year": 3,
        "branch": "CSE",
        "short": "CD",
        "credits": 3.0,
        "category": "PCC",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6CS18": {
        "name": "Computer Networks",
        "semester": 1,
        "year": 3,
        "branch": "CSE",
        "short": "CN",
        "credits": 3.0,
        "category": "PCC",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6IT26": {
        "name": "Information Retrieval Systems",
        "semester": 1,
        "year": 3,
        "branch": "CSE",
        "short": "IRS",
        "credits": 3.0,
        "category": "PEC",
        "elective_type": "PE-I",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6AI14": {
        "name": "Natural Language Processing",
        "semester": 1,
        "year": 3,
        "branch": "CSE",
        "short": "NLP",
        "credits": 3.0,
        "category": "PEC",
        "elective_type": "PE-II",
        "cie_marks": 40,
        "see_marks": 60,
    },
    # JNTUH draft alias
    "A6CS14": {
        "name": "Design and Analysis of Algorithms",
        "semester": 1,
        "year": 3,
        "branch": "CSE",
        "short": "DAA",
        "credits": 3.0,
        "category": "PCC",
        "alias_of": "A6CS15",
    },
}

# ── Semester 3-2 (III B.Tech II Semester) ───────────────────────────────────────

R22_SEMESTER_3_2 = {
    "A6IT39": {
        "name": "Introduction to Artificial Intelligence",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "AI",
        "credits": 3.0,
        "category": "PCC",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6IT11": {
        "name": "Automata and Compiler Design",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "ACD",
        "credits": 3.0,
        "category": "PCC",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6CS16": {
        "name": "Data Mining and Machine Learning",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "DMML",
        "credits": 3.0,
        "category": "PCC",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6CS44": {
        "name": "Big Data Analytics",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "BDA",
        "credits": 3.0,
        "category": "PEC",
        "elective_type": "PE-III",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6AI17": {
        "name": "Deep Learning",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "DL",
        "credits": 3.0,
        "category": "PEC",
        "elective_type": "PE-III",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6CS31": {
        "name": "Smart Contract Development and Audit",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "SCDA",
        "credits": 3.0,
        "category": "PEC",
        "elective_type": "PE-III",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6CS17": {
        "name": "Data Mining and Machine Learning Lab",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "DMML Lab",
        "credits": 1.5,
        "category": "PCC",
        "cie_marks": 40,
        "see_marks": 60,
    },
    "A6CS21": {
        "name": "Industry Oriented Mini Project / Internship",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "Mini Project",
        "credits": 2.0,
        "category": "PWC",
        "cie_marks": 0,
        "see_marks": 100,
    },
    "A6BS11": {
        "name": "Environmental Science",
        "semester": 2,
        "year": 3,
        "branch": "BS",
        "short": "ES",
        "credits": 0.0,
        "category": "ES",
        "cie_marks": 50,
        "see_marks": 0,
    },
    # JNTUH draft aliases
    "A6AI02": {
        "name": "Introduction to Artificial Intelligence",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "AI",
        "credits": 3.0,
        "category": "PCC",
        "alias_of": "A6IT39",
    },
    "A6CS20": {
        "name": "Automata and Compiler Design",
        "semester": 2,
        "year": 3,
        "branch": "CSE",
        "short": "ACD",
        "credits": 3.0,
        "category": "PCC",
        "alias_of": "A6IT11",
    },
}

# ── Combined Registry ──────────────────────────────────────────────────────────

ALL_R22_SUBJECTS = {
    **R22_SEMESTER_2_1,
    **R22_SEMESTER_2_2,
    **R22_SEMESTER_3_1,
    **R22_SEMESTER_3_2,
}

# Simplified name-only maps (for backwards compatibility)
R22_2_1_NAMES = {code: info["name"] for code, info in R22_SEMESTER_2_1.items()}
R22_2_2_NAMES = {code: info["name"] for code, info in R22_SEMESTER_2_2.items()}
R22_3_1_NAMES = {code: info["name"] for code, info in R22_SEMESTER_3_1.items()}
R22_3_2_NAMES = {code: info["name"] for code, info in R22_SEMESTER_3_2.items()}
ALL_R22_NAMES = {code: info["name"] for code, info in ALL_R22_SUBJECTS.items()}

# ── Lookup Helpers ─────────────────────────────────────────────────────────────

def get_subject_info(code: str) -> dict | None:
    """Get full subject info by code"""
    return ALL_R22_SUBJECTS.get(code)


def get_subject_name(code: str) -> str:
    """Get subject name by code"""
    info = ALL_R22_SUBJECTS.get(code)
    return info["name"] if info else "Unknown Subject"


def get_semester_subjects(semester: int, year: int = None) -> dict:
    """
    Get all subjects for a semester:
    - semester=1, year=2 or semester=3 (global) -> 2-1
    - semester=2, year=2 or semester=4 (global) -> 2-2
    - semester=1, year=3 or semester=5 (global) -> 3-1
    - semester=2, year=3 or semester=6 (global) -> 3-2
    """
    if year == 2:
        return R22_SEMESTER_2_1 if semester == 1 else R22_SEMESTER_2_2 if semester == 2 else {}
    elif year == 3:
        return R22_SEMESTER_3_1 if semester == 1 else R22_SEMESTER_3_2 if semester == 2 else {}
    
    # Global semester resolution
    if semester in (1, 3):
        return R22_SEMESTER_2_1
    elif semester in (2, 4):
        return R22_SEMESTER_2_2
    elif semester == 5:
        return R22_SEMESTER_3_1
    elif semester == 6:
        return R22_SEMESTER_3_2
    else:
        return {}


def get_subject_codes_for_semester(semester: int, year: int = None) -> list[str]:
    """Get list of subject codes for a semester"""
    return list(get_semester_subjects(semester, year).keys())


# ── Validation ─────────────────────────────────────────────────────────────────

def validate_subject_code(code: str) -> bool:
    """Check if a subject code is valid R22 CSE"""
    return code in ALL_R22_SUBJECTS


def get_all_codes() -> list[str]:
    """Get all valid R22 CSE subject codes"""
    return list(ALL_R22_SUBJECTS.keys())


# ── Constants ──────────────────────────────────────────────────────────────────

REGULATION = "R22"
BRANCH = "CSE"
TOTAL_2ND_YEAR_SUBJECTS = 10
TOTAL_3RD_YEAR_SUBJECTS = 14
TOTAL_SUBJECTS = len(ALL_R22_SUBJECTS)

# Academic year mapping
SEMESTER_DISPLAY = {
    1: "II B.Tech I Semester (2-1)",
    2: "II B.Tech II Semester (2-2)",
    3: "II B.Tech I Semester (2-1)",
    4: "II B.Tech II Semester (2-2)",
    5: "III B.Tech I Semester (3-1)",
    6: "III B.Tech II Semester (3-2)",
}
