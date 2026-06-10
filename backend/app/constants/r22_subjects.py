"""
R22 CSE Subject Master Registry
================================

OFFICIAL MLRIT R22 CSE subject mapping - single source of truth.
All scripts must import from this file to ensure consistency.

Last Updated: June 7, 2026
Verified By: Academic Office + Student Hall Tickets
"""

# ── Semester 2-1 (II B.Tech I Semester) ────────────────────────────────────────

R22_SEMESTER_2_1 = {
    "A6CS03": {
        "name": "Object Oriented Programming through Java",
        "semester": 1,
        "branch": "CSE",
        "short": "OOPS"
    },
    "A6CS01": {
        "name": "Digital Electronics and Computer Organization",
        "semester": 1,
        "branch": "CSE",
        "short": "DECO"
    },
    "A6CS05": {
        "name": "Data Structures",
        "semester": 1,  # DB value for 2-1
        "branch": "CSE",
        "short": "DS"
    },
    "A6CS10": {
        "name": "Software Engineering",
        "semester": 1,
        "branch": "CSE",
        "short": "SE"
    },
    "A6BS04": {
        "name": "Computer Oriented Statistical Methods",
        "semester": 1,
        "branch": "BS",
        "short": "COSM"
    },
}

# ── Semester 2-2 (II B.Tech II Semester) ───────────────────────────────────────

R22_SEMESTER_2_2 = {
    "A6BS05": {
        "name": "Business Economics and Financial Analysis",
        "semester": 2,  # DB value for 2-2
        "branch": "BS",
        "short": "BEFA"
    },
    "A6CS08": {
        "name": "Discrete Mathematics",
        "semester": 2,
        "branch": "CSE",
        "short": "DM"
    },
    "A6CS09": {
        "name": "Database Management Systems",
        "semester": 2,
        "branch": "CSE",
        "short": "DBMS"
    },
    "A6CS11": {
        "name": "Operating System",
        "semester": 2,
        "branch": "CSE",
        "short": "OS"
    },
    "A6CS13": {
        "name": "Software Testing Fundamentals",
        "semester": 2,
        "branch": "CSE",
        "short": "STF"
    },
}

# ── Combined Registry ──────────────────────────────────────────────────────────

ALL_R22_SUBJECTS = {**R22_SEMESTER_2_1, **R22_SEMESTER_2_2}

# Simplified name-only maps (for backwards compatibility)
R22_2_1_NAMES = {code: info["name"] for code, info in R22_SEMESTER_2_1.items()}
R22_2_2_NAMES = {code: info["name"] for code, info in R22_SEMESTER_2_2.items()}
ALL_R22_NAMES = {code: info["name"] for code, info in ALL_R22_SUBJECTS.items()}

# ── Lookup Helpers ─────────────────────────────────────────────────────────────

def get_subject_info(code: str) -> dict | None:
    """Get full subject info by code"""
    return ALL_R22_SUBJECTS.get(code)


def get_subject_name(code: str) -> str:
    """Get subject name by code"""
    info = ALL_R22_SUBJECTS.get(code)
    return info["name"] if info else "Unknown Subject"


def get_semester_subjects(semester: int) -> dict:
    """Get all subjects for a semester (1 or 2)"""
    if semester == 1:
        return R22_SEMESTER_2_1
    elif semester == 2:
        return R22_SEMESTER_2_2
    else:
        return {}


def get_subject_codes_for_semester(semester: int) -> list[str]:
    """Get list of subject codes for a semester"""
    return list(get_semester_subjects(semester).keys())


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
TOTAL_SUBJECTS = 10  # 5 per semester
SUBJECTS_PER_SEMESTER = 5

# Academic year mapping
SEMESTER_DISPLAY = {
    1: "II B.Tech I Semester (2-1)",
    2: "II B.Tech II Semester (2-2)",
}
