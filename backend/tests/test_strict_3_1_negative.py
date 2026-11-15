"""
PaperIQ Strict MLRIT Autonomous R22 — 3-1 Mandatory Negative Testing Suite
==========================================================================
Validates that unsupported semesters (2-1, 2-2, 3-2), Operating Systems (A6CS11),
and Database Management Systems (A6CS09) are strictly rejected or excluded from
academic offerings, APIs, question bank retrievals, and frequency calculations.
"""
import pytest
from fastapi import HTTPException

from app.constants.r22_3_1_allowlist import (
    validate_3_1_subject_code,
    is_supported_3_1_code,
    get_3_1_subjects_list,
    OFFICIAL_3_1_SUBJECTS,
    PROHIBITED_SUBJECT_NAMES,
)
from app.intelligence.academic_question_intel import AcademicQuestionIntelligence


class TestStrict31AllowlistValidation:
    """Test API and service level allowlist rejection of non-3-1 subjects."""

    def test_rejects_operating_systems_a6cs11(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_3_1_subject_code("A6CS11")
        assert exc_info.value.status_code == 400
        assert "Operating Systems" in exc_info.value.detail or "A6CS11" in exc_info.value.detail
        assert "3-1" in exc_info.value.detail

    def test_rejects_database_management_systems_a6cs09(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_3_1_subject_code("A6CS09")
        assert exc_info.value.status_code == 400
        assert "Database Management Systems" in exc_info.value.detail or "A6CS09" in exc_info.value.detail
        assert "3-1" in exc_info.value.detail

    def test_rejects_2_1_data_structures_a6cs05(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_3_1_subject_code("A6CS05")
        assert exc_info.value.status_code == 400
        assert "Data Structures" in exc_info.value.detail or "A6CS05" in exc_info.value.detail

    def test_rejects_2_1_java_oops_a6it02(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_3_1_subject_code("A6IT02")
        assert exc_info.value.status_code == 400

    def test_rejects_3_2_artificial_intelligence_a6it39(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_3_1_subject_code("A6IT39")
        assert exc_info.value.status_code == 400

    def test_accepts_all_official_3_1_subjects(self):
        valid_codes = ["A6CS15", "A6IT13", "A6CS18", "A6IT26", "A6AI14"]
        for code in valid_codes:
            assert validate_3_1_subject_code(code) == code
            assert is_supported_3_1_code(code) is True

    def test_allowlist_subjects_list_contains_only_3_1(self):
        subjects = get_3_1_subjects_list()
        assert len(subjects) == 5
        codes = {s["code"] for s in subjects}
        assert codes == {"A6CS15", "A6IT13", "A6CS18", "A6IT26", "A6AI14"}
        for s in subjects:
            assert s["semester"] == 1
            assert s["year"] == 3
            assert s["regulation"] == "R22"
            assert s["code"] not in PROHIBITED_SUBJECT_NAMES


class TestAcademicIntelligence31Scoping:
    """Test that AcademicQuestionIntelligence excludes unsupported subjects."""

    def test_eligible_60m_questions_contain_no_unsupported_subjects(self):
        qs = AcademicQuestionIntelligence.get_eligible_60m_questions()
        for q in qs:
            assert is_supported_3_1_code(q.subject_code), (
                f"Question {q.id} has prohibited subject code {q.subject_code}"
            )
            assert q.subject_code not in {"A6CS11", "A6CS09", "A6CS05", "A6CS08"}

    def test_curated_questions_contain_no_unsupported_subjects(self):
        qs = AcademicQuestionIntelligence.get_all_curated_questions()
        for q in qs:
            assert is_supported_3_1_code(q.subject_code)

    def test_os_query_does_not_match_curated_exam_question(self):
        match = AcademicQuestionIntelligence.find_matching_question(
            query="Explain Banker's Algorithm with safe state and allocation matrix",
            subject_code="A6CS11",
            regulation="R22",
        )
        assert match.is_verified_exam_question is False
        assert match.matched_question is None

    def test_dbms_query_does_not_match_curated_exam_question(self):
        match = AcademicQuestionIntelligence.find_matching_question(
            query="Explain 3NF and BCNF normalization with functional dependencies",
            subject_code="A6CS09",
            regulation="R22",
        )
        assert match.is_verified_exam_question is False
        assert match.matched_question is None

    def test_3_1_daa_query_successfully_matches(self):
        match = AcademicQuestionIntelligence.find_matching_question(
            query="Explain 0/1 Knapsack using LC Branch and Bound with state-space tree",
            subject_code="A6CS15",
            regulation="R22",
        )
        assert match.is_verified_exam_question is True
        assert match.matched_question is not None
        assert match.matched_question.subject_code == "A6CS15"
        assert match.matched_question.marks == 10
