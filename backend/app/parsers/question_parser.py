import re
import hashlib
from typing import List, Tuple, Optional

from app.parsers.models import (
    ParsedQuestion, ParseResult, QuestionSection, QuestionType
)
from app.parsers.question_type_classifier import classify_question_type
from app.parsers.marks_extractor import extract_marks, infer_marks_from_section
from app.logger import get_logger

log = get_logger(__name__)

_PART_A_RE = re.compile(r"PART[\s\-]*A|SECTION[\s\-]*A", re.I)
_PART_B_RE = re.compile(r"PART[\s\-]*B|SECTION[\s\-]*B", re.I)
_OR_RE     = re.compile(r"^\s*OR\s*$", re.I)
_TABLE_ROW_RE = re.compile(r"^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$")
_QNUM_RE   = re.compile(r"^(?:Q\.?\s*)?(\d+|[IVXivx]+)\s*[\.\.)]\s*([a-zA-Z]?[\.\.)]?)\s*(.+)$")
_SIMPLE_NUM_RE = re.compile(r"^(\d+)\s*[\.\.)]\s*(.+)$")
_CO_RE = re.compile(r"\bCO\s*([1-5])\b", re.I)
_BL_RE = re.compile(r"\bBL\s*([1-6])\b", re.I)
_NOISE_RE = re.compile(
    r"^(time|max\.?\s*marks|note:|answer any|all questions|page \d|---+|===+|"
    r"part[\s\-]*[ab]|section[\s\-]*[ab]|\*+|mlr institute|autonomous|"
    r"regular|supplementary|examination|course code|h\.?t\.? no\.?|r\d\d)$",
    re.I
)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())

def _hash(text: str) -> str:
    return hashlib.sha256(_normalize(text).encode()).hexdigest()

def _extract_co_bl(text: str) -> Tuple[Optional[str], Optional[str]]:
    co = _CO_RE.search(text)
    bl = _BL_RE.search(text)
    return (f"CO{co.group(1)}" if co else None, f"BL{bl.group(1)}" if bl else None)

def _is_noise(line: str) -> bool:
    stripped = line.strip()
    if not stripped or len(stripped) < 3:
        return True
    return bool(_NOISE_RE.match(stripped))


class QuestionParser:
    def parse(self, raw_text: str, paper_id: str,
              subject_id: Optional[str] = None) -> ParseResult:
        lines = raw_text.splitlines()
        questions: List[ParsedQuestion] = []
        warnings: List[str] = []
        current_section = QuestionSection.UNKNOWN
        pending_or = False

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            i += 1
            if not line:
                continue
            if _PART_A_RE.search(line):
                current_section = QuestionSection.PART_A
                continue
            if _PART_B_RE.search(line):
                current_section = QuestionSection.PART_B
                continue
            if _OR_RE.match(line):
                pending_or = True
                continue
            if _is_noise(line):
                continue

            table_match = _TABLE_ROW_RE.match(line)
            if table_match:
                q = self._parse_table_row(
                    table_match, line, paper_id, subject_id, current_section, pending_or
                )
                if q:
                    questions.append(q)
                    pending_or = False
                continue

            num_match = _QNUM_RE.match(line) or _SIMPLE_NUM_RE.match(line)
            if num_match:
                q = self._parse_numbered_line(
                    num_match, line, paper_id, subject_id, current_section, pending_or
                )
                if q:
                    questions.append(q)
                    pending_or = False
                continue

        questions = self._dedup(questions)
        part_a = sum(1 for q in questions if q.section == QuestionSection.PART_A)
        part_b = sum(1 for q in questions if q.section == QuestionSection.PART_B)
        if not questions:
            warnings.append("No questions extracted — check raw_text format")

        log.info(f"[QuestionParser] paper={paper_id} total={len(questions)} partA={part_a} partB={part_b}")
        return ParseResult(
            paper_id=paper_id, questions=questions,
            total_questions=len(questions),
            part_a_count=part_a, part_b_count=part_b,
            parse_warnings=warnings,
        )

    def _parse_table_row(self, match, raw_line, paper_id, subject_id, section, is_or):
        cells = [c.strip() for c in raw_line.split("|")]
        if len(cells) < 3:
            return None
        if all(c.upper() in ("OR", "") for c in cells):
            return None
        if any("page" in c.lower() for c in cells):
            return None

        q_num = cells[0].rstrip(".")
        question_text = ""
        marks_val = None
        marks_text_raw = ""
        co = None
        bl = None
        best_len = 0

        for idx, cell in enumerate(cells):
            if idx == 0:
                continue
            if re.match(r"^\d+[Mm]?$", cell):
                continue
            if re.match(r"^CO\d$", cell, re.I):
                co = cell.upper()
                continue
            if re.match(r"^BL\d$", cell, re.I):
                bl = cell.upper()
                continue
            if len(cell) > best_len and len(cell) > 4:
                best_len = len(cell)
                question_text = cell

        if not question_text or len(question_text) < 5:
            return None

        for cell in cells:
            v, t = extract_marks(cell)
            if v:
                marks_val = v
                marks_text_raw = t
                break

        if not co or not bl:
            co2, bl2 = _extract_co_bl(question_text)
            co = co or co2
            bl = bl or bl2

        # Marks-based section assignment (always takes priority for 1M/2M)
        if marks_val and marks_val <= 2:
            section = QuestionSection.PART_A
        elif marks_val and marks_val >= 5 and section == QuestionSection.UNKNOWN:
            section = QuestionSection.PART_B

        qt, conf = classify_question_type(question_text)
        norm = _normalize(question_text)
        return ParsedQuestion(
            paper_id=paper_id, subject_id=subject_id,
            question_number=q_num, section=section,
            is_or_question=is_or, question_text=question_text,
            raw_snippet=raw_line, question_type=qt,
            type_confidence=round(conf, 2), marks=marks_val,
            marks_text=marks_text_raw, co=co, bloom_level=bl,
            normalized_text=norm, question_hash=_hash(question_text),
            parse_confidence=round(min(conf + 0.05, 1.0), 2),
        )

    def _parse_numbered_line(self, match, raw_line, paper_id, subject_id, section, is_or):
        groups = match.groups()
        if len(groups) == 3:
            q_num = f"{groups[0]}{groups[1]}".strip(".) ")
            question_text = groups[2].strip()
        else:
            q_num = groups[0]
            question_text = groups[1].strip()

        if not question_text or len(question_text) < 5:
            return None

        marks_val, marks_text_raw = extract_marks(question_text)
        if not marks_val:
            marks_val = infer_marks_from_section(section.value, q_num)

        co, bl = _extract_co_bl(question_text)
        question_text_clean = re.sub(r"\s*\bCO\s*\d\b", "", question_text, flags=re.I)
        question_text_clean = re.sub(r"\s*\bBL\s*\d\b", "", question_text_clean, flags=re.I).strip()

        if marks_val and marks_val <= 2:
            section = QuestionSection.PART_A
        elif marks_val and marks_val >= 5 and section == QuestionSection.UNKNOWN:
            section = QuestionSection.PART_B

        qt, conf = classify_question_type(question_text_clean)
        norm = _normalize(question_text_clean)
        return ParsedQuestion(
            paper_id=paper_id, subject_id=subject_id,
            question_number=q_num, section=section,
            is_or_question=is_or, question_text=question_text_clean,
            raw_snippet=raw_line, question_type=qt,
            type_confidence=round(conf, 2), marks=marks_val,
            marks_text=marks_text_raw, co=co, bloom_level=bl,
            normalized_text=norm, question_hash=_hash(question_text_clean),
            parse_confidence=round(conf, 2),
        )

    def _dedup(self, questions):
        seen: set[str] = set()
        result = []
        for q in questions:
            if q.question_hash not in seen:
                seen.add(q.question_hash)
                result.append(q)
        return result
