"""
MLRIT R22 — Subject Registry and Archive Catalogue.

Covers both II B.Tech semesters:
  - Semester 2-1 (II B.Tech I Semester)  — DB semester value = 1
  - Semester 2-2 (II B.Tech II Semester) — DB semester value = 2

Archive selection rules (from portal inspection):
  - II-B.Tech archives contain both 2-1 and 2-2 semester papers
  - Archives from February/March/June/July exams → 2-2 semester
  - Archives from August/September/December → 2-1 semester
  - Folder structure: <root>/2-2/ OR <root>/Reg/ (Jun2025+)
  - R22 subject files identified by code pattern A6xxxx

Subject identification:
  - filename contains A6XXNN → R22 subject code
  - Subject code maps to canonical name via R22_SUBJECTS
"""
import os
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from app.logger import get_logger

log = get_logger(__name__)

# ── Portal constants ──────────────────────────────────────────────────────────
BASE_URL    = "https://exams.mlrinstitutions.ac.in/Old_Qp"
PORTAL_URL  = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"

# ── OFFICIAL R22 CSE Subject Registry ─────────────────────────────────────────
# EXACTLY 10 subjects: 5 for 2-1, 5 for 2-2
# Source: MLRIT official syllabus + student hall tickets
#
# ⚠️  DO NOT add:
#   - 3rd/4th year subjects (e.g. A6CS15 DAA, A6CS18 CN)
#   - Other branch subjects (ECE, EEE, MECH, AI, DS, CY)
#   - Wrong codes (A6CS28, A6CS13 as SE, etc.)
#
R22_SUBJECTS: dict[str, dict] = {
    # ── Semester 2-1 (II B.Tech I Semester) — DB semester = 1 ────────────────
    "A6CS05": {"name": "Data Structures",                               "branch": "CSE", "short": "DS",   "semester": 1},
    "A6IT02": {"name": "Object Oriented Programming through Java",      "branch": "IT",  "short": "OOPS", "semester": 1},
    "A6CS02": {"name": "Digital Electronics and Computer Organization", "branch": "CSE", "short": "DECO", "semester": 1},
    "A6CS07": {"name": "Software Engineering",                          "branch": "CSE", "short": "SE",   "semester": 1},
    "A6BS03": {"name": "Computer Oriented Statistical Methods",         "branch": "BS",  "short": "COSM", "semester": 1},
    # ── Semester 2-2 (II B.Tech II Semester) — DB semester = 2 ───────────────
    "A6HS08": {"name": "Business Economics and Financial Analysis",     "branch": "HS",  "short": "BEFA", "semester": 2},
    "A6CS08": {"name": "Discrete Mathematics",                          "branch": "CSE", "short": "DM",   "semester": 2},
    "A6CS09": {"name": "Database Management Systems",                   "branch": "CSE", "short": "DBMS", "semester": 2},
    "A6CS11": {"name": "Operating System",                              "branch": "CSE", "short": "OS",   "semester": 2},
    "A6CS13": {"name": "Software Testing Fundamentals",                 "branch": "CSE", "short": "STF",  "semester": 2},
}

# ── Archive catalogue ──────────────────────────────────────────────────────────
# Archives confirmed to contain II B.Tech papers.
# Feb/Mar/Jun/Jul archives → 2-2 semester papers
# Aug/Sep/Dec archives     → 2-1 semester papers
R22_ARCHIVES: list[dict] = [
    # Format: {file, label, year, month, type, folder}
    {"file": "2-B.Tech(Dec25).rar",     "label": "II-B.Tech-December2025", "year": 2025, "month": "December", "type": "Regular",       "folder": ""},
    {"file": "2-BTech(June25).rar",      "label": "II-B.Tech-June2025",     "year": 2025, "month": "June",     "type": "Regular",       "folder": "2-BTech(June25)/Reg"},
    {"file": "II-BTECH-Dec24.rar",       "label": "II-B.Tech-December2024", "year": 2024, "month": "December", "type": "Regular",       "folder": "II-BTECH(Dec24)/2-2 Supple"},
    {"file": "II-B.Tech-August2024.rar", "label": "II-B.Tech-August2024",   "year": 2024, "month": "August",   "type": "Supplementary", "folder": "II-B.Tech-Regular_Supple(August2024)/2-2 Regular & Supple/Regular"},
    {"file": "II-B.Tech(Feb24).rar",     "label": "II-B.Tech-February2024", "year": 2024, "month": "February", "type": "Regular",       "folder": "2-1 & 2-2 Regular & Suppe Feb-2024/2-2"},
    {"file": "II-B.Tech-August2023.rar", "label": "II-B.Tech-August2023",   "year": 2023, "month": "August",   "type": "Regular",       "folder": "II-B.Tech-August2023/2-2/Regular"},
    {"file": "B.Tech-February2023.rar",  "label": "II-B.Tech-February2023", "year": 2023, "month": "February", "type": "Regular",       "folder": "2-1 & 2-2 Regular & Suppe Feb-2023/2-2"},
    {"file": "B.Tech-June2022.rar",      "label": "II-B.Tech-June2022",     "year": 2022, "month": "June",     "type": "Regular",       "folder": "B.Tech-June2022/2-2/Regular/DMM1"},
    {"file": "B.Tech-December2021.rar",  "label": "II-B.Tech-December2021", "year": 2021, "month": "December", "type": "Regular",       "folder": "B.Tech-December2021/II-II Supply"},
]

def fetch_archives_from_portal() -> list[dict]:
    """Scrape the MLRIT portal HTML to discover all R22 RAR archives.
    Returns a list of dicts with the same schema as R22_ARCHIVES.
    """
    try:
        resp = httpx.get(PORTAL_URL, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        log.error(f"Failed to fetch portal page: {e}")
        return []
    soup = BeautifulSoup(resp.text, "html.parser")
    archives = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        if not href.lower().endswith('.rar'):
            continue
        # Only pick II-B.Tech archives (skip I, III, IV, PG)
        link_text = a.get_text(strip=True).lower()
        filename_lower = href.lower()
        is_ii_btech = (
            filename_lower.startswith('2-b')
            or filename_lower.startswith('ii-b')
            or 'ii-b' in link_text
            or link_text.startswith('ii-')
        )
        if not is_ii_btech:
            continue
        # href may be relative; construct full URL later
        filename = os.path.basename(href)
        # Extract year: try 4-digit first, then 2-digit
        year_match = re.search(r'(19|20)\d{2}', filename)
        if year_match:
            year = int(year_match.group(0))
        else:
            # Try 2-digit year after a month name or separator
            yr2_match = re.search(r'(\d{2})(?:\.rar|$)', filename, re.I)
            if yr2_match:
                yr2 = int(yr2_match.group(1))
                year = 2000 + yr2 if yr2 < 50 else 1900 + yr2
            else:
                year = None

        # Month abbreviation map
        MONTH_ABBR = {
            'jan': 'January', 'feb': 'February', 'mar': 'March',
            'apr': 'April', 'may': 'May', 'jun': 'June',
            'jul': 'July', 'aug': 'August', 'sep': 'September',
            'oct': 'October', 'nov': 'November', 'dec': 'December',
        }
        # Try full month name first
        month_match = re.search(
            r'(January|February|March|April|May|June|July|August|September|October|November|December)',
            filename, re.I,
        )
        if month_match:
            month = month_match.group(0).capitalize()
        else:
            # Try 3-letter abbreviation
            abbr_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', filename, re.I)
            if abbr_match:
                month = MONTH_ABBR.get(abbr_match.group(0).lower(), None)
            else:
                month = None

        # Fallback: try to parse month from link text
        if not month:
            text = a.get_text(strip=True)
            month_match = re.search(
                r'(January|February|March|April|May|June|July|August|September|October|November|December)',
                text, re.I,
            )
            if month_match:
                month = month_match.group(0).capitalize()
            else:
                abbr_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', text, re.I)
                if abbr_match:
                    month = MONTH_ABBR.get(abbr_match.group(0).lower(), None)
        # Determine type (Regular vs Supplementary) heuristically
        typ = "Supplementary" if "supple" in filename.lower() else "Regular"
        label = f"MLRIT {month}{year}" if month and year else filename
        archives.append({
            "file": filename,
            "label": label,
            "year": year if year else 0,
            "month": month if month else "",
            "type": typ,
            "folder": ""
        })
    return archives

# Merge static list with discovered archives (avoid duplicates)
def get_all_archives() -> list[dict]:
    dynamic = fetch_archives_from_portal()
    # Filter out entries without year/month
    dynamic = [a for a in dynamic if a["year"] and a["month"]]
    # Combine, ensuring unique file names
    existing_files = {a["file"] for a in R22_ARCHIVES}
    combined = R22_ARCHIVES.copy()
    for a in dynamic:
        if a["file"] not in existing_files:
            combined.append(a)
    return combined

def get_subject_info(code: str) -> Optional[dict]:
    """Return subject metadata for a known R22 code, or None."""
    return R22_SUBJECTS.get(code.upper())


def identify_subject_from_filename(filename: str) -> Optional[str]:
    """
    Extract R22 subject code from a docx/doc filename.
    Returns 'A6XXNN' or None if not a known subject.
    """
    m = re.search(r'\b(A6[A-Z]{2}\d{2})\b', filename, re.I)
    if m:
        code = m.group(1).upper()
        if code in R22_SUBJECTS:
            return code
    return None


def get_all_subjects_for_semester(semester: int) -> list[dict]:
    """Return all subjects for a given semester (1 or 2)."""
    return [
        {"code": code, **info}
        for code, info in R22_SUBJECTS.items()
        if info["semester"] == semester
    ]
