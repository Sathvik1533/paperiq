"""
MLRIT Autonomous R22 — 3-1 (Third Year, First Semester) Strict Canonical Allowlist
==================================================================================
MANDATORY PRODUCT RESTRICTION: Single Source of Truth for 3-1 Supported Curriculum.

Permitted Subjects:
- A6CS15: Design and Analysis of Algorithms (DAA) [Alias: A6CS14]
- A6IT13: Cloud and DevOps (CD)
- A6CS18: Computer Networks (CN)
- A6IT26: Information Retrieval Systems (IRS)
- A6AI14: Natural Language Processing (NLP)

Prohibited Semesters & Subjects:
- 2-1 (e.g. A6CS05 Data Structures, A6IT02 Java, A6CS01/A6CS02/A6CS28 DECO, A6CS10/A6CS07 SE, A6BS04/A6BS03 COSM)
- 2-2 (e.g. A6CS11 Operating Systems, A6CS09 Database Management Systems, A6BS05/A6HS08 BEFA, A6CS08 DM, A6CS13 STF)
- 3-2 (e.g. A6IT39 AI, A6IT11 ACD, A6CS16 DMML)
- Any other subject outside official 3-1.
"""
from typing import Dict, Any, List, Set, Optional
from fastapi import HTTPException

OFFICIAL_3_1_SUBJECTS: Dict[str, Dict[str, Any]] = {
    "A6CS15": {
        "id": "c3010000-0000-0000-0000-000000000001",
        "code": "A6CS15",
        "name": "Design and Analysis of Algorithms",
        "short": "DAA",
        "branch": "CSE",
        "year": 3,
        "semester": 1,
        "credits": 3.0,
        "category": "PCC",
        "regulation": "R22",
    },
    "A6IT13": {
        "id": "c3010000-0000-0000-0000-000000000002",
        "code": "A6IT13",
        "name": "Cloud and DevOps",
        "short": "CD",
        "branch": "CSE",
        "year": 3,
        "semester": 1,
        "credits": 3.0,
        "category": "PCC",
        "regulation": "R22",
    },
    "A6CS18": {
        "id": "c3010000-0000-0000-0000-000000000003",
        "code": "A6CS18",
        "name": "Computer Networks",
        "short": "CN",
        "branch": "CSE",
        "year": 3,
        "semester": 1,
        "credits": 3.0,
        "category": "PCC",
        "regulation": "R22",
    },
    "A6IT26": {
        "id": "c3010000-0000-0000-0000-000000000004",
        "code": "A6IT26",
        "name": "Information Retrieval Systems",
        "short": "IRS",
        "branch": "CSE",
        "year": 3,
        "semester": 1,
        "credits": 3.0,
        "category": "PEC",
        "regulation": "R22",
    },
    "A6AI14": {
        "id": "c3010000-0000-0000-0000-000000000005",
        "code": "A6AI14",
        "name": "Natural Language Processing",
        "short": "NLP",
        "branch": "CSE",
        "year": 3,
        "semester": 1,
        "credits": 3.0,
        "category": "PEC",
        "regulation": "R22",
    },
    "A6CS14": {
        "id": "c3010000-0000-0000-0000-000000000006",
        "code": "A6CS14",
        "name": "Design and Analysis of Algorithms",
        "short": "DAA",
        "branch": "CSE",
        "year": 3,
        "semester": 1,
        "credits": 3.0,
        "category": "PCC",
        "regulation": "R22",
        "alias_of": "A6CS15",
    },
}

SUPPORTED_3_1_CODES: Set[str] = set(OFFICIAL_3_1_SUBJECTS.keys())

# Prohibited known subjects explicitly mentioned in policy
PROHIBITED_SUBJECT_NAMES: Dict[str, str] = {
    "A6CS11": "Operating Systems (2-2)",
    "A6CS09": "Database Management Systems (2-2)",
    "A6CS05": "Data Structures (2-1)",
    "A6IT02": "Object Oriented Programming through Java (2-1)",
    "A6CS02": "Digital Electronics and Computer Organization (2-1)",
    "A6CS28": "Digital Electronics and Computer Organization (2-1)",
    "A6CS07": "Software Engineering (2-1)",
    "A6BS03": "Computer Oriented Statistical Methods (2-1)",
    "A6CS08": "Discrete Mathematics (2-2)",
    "A6CS13": "Software Testing Fundamentals (2-2)",
    "A6HS08": "Business Economics and Financial Analysis (2-2)",
    "A6BS05": "Business Economics and Financial Analysis (2-2)",
    "A6IT39": "Introduction to Artificial Intelligence (3-2)",
    "A6IT11": "Automata and Compiler Design (3-2)",
    "A6CS16": "Data Mining and Machine Learning (3-2)",
}


def is_supported_3_1_code(code: Optional[str]) -> bool:
    if not code:
        return False
    return code.strip().upper() in SUPPORTED_3_1_CODES


def validate_3_1_subject_code(code: Optional[str]) -> str:
    """Validate subject code against 3-1 allowlist or raise 400 Bad Request."""
    norm = (code or "").strip().upper()
    if not is_supported_3_1_code(norm):
        reason = PROHIBITED_SUBJECT_NAMES.get(norm, f"Subject {norm}")
        raise HTTPException(
            status_code=400,
            detail=(
                f"PaperIQ currently strictly supports MLRIT Autonomous R22 — 3-1 (Third Year, First Semester) only. "
                f"Access to {reason} is prohibited under the 3-1 active release scope."
            ),
        )
    return norm


def get_3_1_subjects_list() -> List[Dict[str, Any]]:
    """Return all primary 3-1 subjects (excluding draft aliases)."""
    return [
        info for code, info in OFFICIAL_3_1_SUBJECTS.items()
        if not info.get("alias_of")
    ]
