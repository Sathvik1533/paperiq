"""
Syllabus Ingestion — Milestone 2 scope.

Accepts PDF or DOCX syllabus upload, extracts raw text,
attempts to parse unit/topic structure, stores in syllabi + syllabus_topics.

Syllabus MAPPING (questions -> topics) is Milestone 4b.
This module ONLY ingests and structures the syllabus document.
"""
import os
import re
from dataclasses import dataclass, field
from typing import List, Optional

from app.extractors.extractor_factory import extract
from app.extractors.text_normalizer import normalize
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)


@dataclass
class SyllabusTopic:
    topic_name: str
    subtopics: List[str] = field(default_factory=list)


@dataclass
class SyllabusUnit:
    unit_number: int
    unit_name: str
    topics: List[SyllabusTopic] = field(default_factory=list)


@dataclass
class ParsedSyllabus:
    units: List[SyllabusUnit]
    raw_text: str
    source_file: str


# ── Patterns that identify unit headers ──────────────────────────────────────
_UNIT_PATTERNS = [
    re.compile(r"^UNIT[\s\-]*([IVX\d]+)[:\s]+(.+)$", re.I),
    re.compile(r"^Unit[\s\-]*(\d+)[:\s]+(.+)$", re.I),
    re.compile(r"^MODULE[\s\-]*(\d+)[:\s]+(.+)$", re.I),
]

_ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5,
          "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}


def _roman_to_int(s: str) -> int:
    return _ROMAN.get(s.upper(), 0)


def _parse_unit_number(s: str) -> int:
    try:
        return int(s)
    except ValueError:
        return _roman_to_int(s)


def parse_syllabus_text(raw_text: str) -> List[SyllabusUnit]:
    """
    Best-effort parser for syllabus documents.
    Detects UNIT/MODULE headers and groups topic lines beneath them.
    """
    units: List[SyllabusUnit] = []
    current_unit: Optional[SyllabusUnit] = None
    current_topics: List[str] = []

    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Check if this line is a unit header
        matched_unit = False
        for pattern in _UNIT_PATTERNS:
            m = pattern.match(line)
            if m:
                # Save previous unit
                if current_unit is not None:
                    current_unit.topics = [
                        SyllabusTopic(topic_name=t) for t in current_topics if t
                    ]
                    units.append(current_unit)

                unit_num = _parse_unit_number(m.group(1))
                unit_name = m.group(2).strip().rstrip(":").strip()
                current_unit = SyllabusUnit(unit_number=unit_num, unit_name=unit_name)
                current_topics = []
                matched_unit = True
                break

        if not matched_unit and current_unit is not None:
            # Lines under a unit header are topics
            # Split on commas and semicolons for multi-topic lines
            for part in re.split(r"[,;]", line):
                part = part.strip().strip(".")
                if len(part) > 3:  # skip noise
                    current_topics.append(part)

    # Don't forget last unit
    if current_unit is not None:
        current_unit.topics = [
            SyllabusTopic(topic_name=t) for t in current_topics if t
        ]
        units.append(current_unit)

    return units


def ingest_syllabus(
    file_path: str,
    subject_id: str,
    regulation: str,
    uploaded_by: Optional[str] = None,
) -> str:
    """
    Extract text from syllabus file, parse unit/topic structure,
    store in DB. Returns syllabus_id.
    """
    log.info(f"[SyllabusIngester] Ingesting: {os.path.basename(file_path)}")

    doc = extract(file_path)
    raw_text = normalize(doc.raw_text)
    units = parse_syllabus_text(raw_text)

    parsed_units_json = [
        {
            "unit_number": u.unit_number,
            "unit_name": u.unit_name,
            "topics": [
                {"name": t.topic_name, "subtopics": t.subtopics}
                for t in u.topics
            ],
        }
        for u in units
    ]

    db = get_db()

    # Insert into syllabi table
    result = db.table("syllabi").insert({
        "subject_id": subject_id,
        "regulation": regulation,
        "source_type": "upload",
        "raw_text": raw_text,
        "parsed_units": parsed_units_json,
        "uploaded_by": uploaded_by,
    }).execute()

    syllabus_id = result.data[0]["id"]
    log.info(f"[SyllabusIngester] Stored syllabus {syllabus_id} — {len(units)} units")

    # Insert individual topics
    topic_rows = []
    for unit in units:
        for topic in unit.topics:
            topic_rows.append({
                "syllabus_id": syllabus_id,
                "unit_number": unit.unit_number,
                "unit_name": unit.unit_name,
                "topic_name": topic.topic_name,
                "subtopics": topic.subtopics,
            })

    if topic_rows:
        db.table("syllabus_topics").insert(topic_rows).execute()
        log.info(f"[SyllabusIngester] Stored {len(topic_rows)} syllabus topics")

    return syllabus_id
