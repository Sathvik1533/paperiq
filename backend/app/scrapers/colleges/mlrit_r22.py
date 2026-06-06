"""
MLRIT R22 2-2 Semester — Targeted Crawler.

Knows exactly which archives from the MLRIT portal contain
II B.Tech II Semester (2-2) R22 papers, and how to identify
individual subject files within them.

Archive selection rules (from portal inspection):
  - II-B.Tech archives contain both 2-1 and 2-2 semester papers
  - Archives from February/March/June/July exams = 2-2 semester
  - Archives from August/September/December = 2-1 semester
  - Folder structure: <root>/2-2/ OR <root>/Reg/ (Jun2025+)
  - R22 subject files identified by code pattern A6xxxx

Subject identification:
  - filename contains A6XXNN → R22 subject code
  - Subject code maps to canonical name via SUBJECT_REGISTRY
"""
from typing import Optional

PORTAL_URL = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"
BASE_URL   = "https://exams.mlrinstitutions.ac.in/Old_Qp"

# ── R22 2-2 Semester subject registry ────────────────────────────────────────
# Key: subject code (A6XXNN)
# Value: {name, branch, short_name}
R22_SUBJECTS: dict[str, dict] = {
    # CSE core (2-2)
    "A6CS05": {"name": "Data Structures",                           "branch": "CSE", "short": "DS"},
    "A6CS08": {"name": "Discrete Mathematics",                      "branch": "CSE", "short": "DM"},
    "A6CS09": {"name": "Database Management Systems",               "branch": "CSE", "short": "DBMS"},
    "A6CS13": {"name": "Software Engineering",                      "branch": "CSE", "short": "SE"},
    "A6CS15": {"name": "Design and Analysis of Algorithms",         "branch": "CSE", "short": "DAA"},
    # IT
    "A6IT02": {"name": "Object Oriented Programming through Java",  "branch": "IT",  "short": "OOPS"},
    "A6IT05": {"name": "Software Engineering and Design",           "branch": "IT",  "short": "SED"},
    "A6IT06": {"name": "Data Structures through Java",              "branch": "IT",  "short": "DSJ"},
    # ECE
    "A6EC11": {"name": "Internet of Things and Applications",       "branch": "ECE", "short": "IoT"},
    "A6EC12": {"name": "Digital System Design",                     "branch": "ECE", "short": "DSD"},
    "A6EC13": {"name": "Analog and Digital Communications",         "branch": "ECE", "short": "ADC"},
    "A6EC14": {"name": "Electromagnetic and Transmission Lines",    "branch": "ECE", "short": "EMTL"},
    # EEE
    "A6EE09": {"name": "Electrical Machines II",                    "branch": "EEE", "short": "EM2"},
    "A6EE10": {"name": "Power Systems I",                           "branch": "EEE", "short": "PS1"},
    "A6EE11": {"name": "Electrical Measurement and Instrumentation","branch": "EEE", "short": "EMI"},
    # MECH
    "A6ME16": {"name": "Fluid Mechanics and Hydraulic Machines",    "branch": "MECH","short": "FMHM"},
    "A6ME18": {"name": "Thermal Engineering I",                     "branch": "MECH","short": "TE1"},
    # AI/DS/CY
    "A6AI02": {"name": "Artificial Intelligence",                   "branch": "AI",  "short": "AI"},
    "A6DS02": {"name": "Data Analytics Using R",                    "branch": "DS",  "short": "DA"},
    "A6CY03": {"name": "Operating Systems and Security",            "branch": "CY",  "short": "OSS"},
    # Common
    "A6BS05": {"name": "Probability, Statistics and Complex Analysis","branch": "ALL","short": "PSCA"},
    "A6EE60": {"name": "Basic Electrical and Electronics Engineering","branch": "ALL","short": "BEEE"},
}

# ── Archive catalogue ─────────────────────────────────────────────────────────
# Archives confirmed to contain II B.Tech 2-2 papers.
# Semester determination:
#   Feb/Mar/Jun/Jul archives → contain 2-2 papers
#   Aug/Sep/Dec archives     → contain 2-1 papers
#
# Folder path within extracted archive → 2-2 papers are in:
#   "2-2/" subfolder (older archives)
#   "Reg/" root (Jun 2025+)

R22_ARCHIVES: list[dict] = [
    # Format: {filename, label, exam_year, exam_month, exam_type, semester_folder}
    {"file": "2-BTech(June25).rar",       "label": "II-B.Tech-June2025",       "year": 2025, "month": "June",     "type": "Regular",       "folder": "2-BTech(June25)/Reg"},
    {"file": "II-BTECH-Dec24.rar",        "label": "II-B.Tech-December2024",   "year": 2024, "month": "December", "type": "Regular",       "folder": "II-BTECH(Dec24)/2-2 Supple"},
    {"file": "II-B.Tech-August2024.rar",  "label": "II-B.Tech-August2024",     "year": 2024, "month": "August",   "type": "Supplementary", "folder": "II-B.Tech-Regular_Supple(August2024)/2-2 Regular & Supple/Regular"},
    {"file": "II-B.Tech(Feb24).rar",      "label": "II-B.Tech-February2024",   "year": 2024, "month": "February", "type": "Regular",       "folder": "2-1 & 2-2 Regular & Suppe Feb-2024/2-2"},
    {"file": "II-B.Tech-August2023.rar",  "label": "II-B.Tech-August2023",     "year": 2023, "month": "August",   "type": "Regular",       "folder": "II-B.Tech-August2023/2-2/Regular"},
    {"file": "B.Tech-February2023.rar",   "label": "II-B.Tech-February2023",   "year": 2023, "month": "February", "type": "Regular",       "folder": "2-1 & 2-2 Regular & Suppe Feb-2023/2-2"},
    {"file": "B.Tech-June2022.rar",       "label": "II-B.Tech-June2022",       "year": 2022, "month": "June",     "type": "Regular",       "folder": "B.Tech-June2022/2-2/Regular/DMM1"},
    {"file": "B.Tech-December2021.rar",   "label": "II-B.Tech-December2021",   "year": 2021, "month": "December", "type": "Regular",       "folder": "B.Tech-December2021/II-II Supply"},
]


def get_subject_info(code: str) -> Optional[dict]:
    """Return subject metadata for a known R22 code, or None."""
    return R22_SUBJECTS.get(code.upper())


def identify_subject_from_filename(filename: str) -> Optional[str]:
    """
    Extract R22 subject code from a docx/doc filename.
    Returns 'A6XXNN' or None.
    """
    import re
    m = re.search(r'\b(A6[A-Z]{2}\d{2})\b', filename, re.I)
    if m:
        code = m.group(1).upper()
        if code in R22_SUBJECTS:
            return code
    return None


def get_all_subjects_for_branch(branch: str) -> list[dict]:
    """Return all R22 2-2 subjects for a given branch (or ALL)."""
    result = []
    for code, info in R22_SUBJECTS.items():
        if info["branch"] in (branch.upper(), "ALL"):
            result.append({"code": code, **info})
    return result
