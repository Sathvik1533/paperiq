"""
Tests for MLRIT R22 CSE Subject Registry (2-1, 2-2, 3-1, 3-2).
Verifies complete academic alignment with the official autonomous curriculum.
"""
import pytest
from app.constants.r22_subjects import (
    R22_SEMESTER_2_1,
    R22_SEMESTER_2_2,
    R22_SEMESTER_3_1,
    R22_SEMESTER_3_2,
    ALL_R22_SUBJECTS,
    get_subject_info,
    get_subject_name,
    get_semester_subjects,
    validate_subject_code,
)


class TestR22CurriculumIntegrity:
    """Verifies complete academic structure for 2nd and 3rd year CSE."""

    def test_2_1_curriculum_preserved(self):
        codes = set(R22_SEMESTER_2_1.keys())
        # Must contain Core 2-1 courses
        assert "A6CS05" in codes  # DS
        assert "A6CS01" in codes or "A6CS28" in codes  # DECO
        assert "A6CS10" in codes or "A6CS07" in codes  # SE

    def test_2_2_curriculum_preserved(self):
        codes = set(R22_SEMESTER_2_2.keys())
        # Must contain Core 2-2 courses
        assert "A6CS08" in codes  # DM
        assert "A6CS09" in codes  # DBMS
        assert "A6CS11" in codes  # OS
        assert "A6CS13" in codes  # STF

    def test_3_1_curriculum_subjects(self):
        codes = set(R22_SEMESTER_3_1.keys())
        assert "A6CS15" in codes  # DAA
        assert "A6IT13" in codes  # Cloud & DevOps
        assert "A6CS18" in codes  # Computer Networks
        assert "A6IT26" in codes  # PE-I: IRS
        assert "A6AI14" in codes  # PE-II: NLP

        # Verify attributes
        daa = R22_SEMESTER_3_1["A6CS15"]
        assert daa["year"] == 3
        assert daa["semester"] == 1
        assert daa["credits"] == 3.0
        assert daa["category"] == "PCC"

    def test_3_2_curriculum_subjects(self):
        codes = set(R22_SEMESTER_3_2.keys())
        assert "A6IT39" in codes  # Intro to AI
        assert "A6IT11" in codes  # Automata & CD
        assert "A6CS16" in codes  # Data Mining & ML
        assert "A6CS44" in codes  # PE-III: Big Data
        assert "A6AI17" in codes  # PE-III: Deep Learning
        assert "A6CS31" in codes  # PE-III: Smart Contracts
        assert "A6CS17" in codes  # DMML Lab
        assert "A6CS21" in codes  # Mini Project
        assert "A6BS11" in codes  # Environmental Science

        # Verify attributes
        ai = R22_SEMESTER_3_2["A6IT39"]
        assert ai["year"] == 3
        assert ai["semester"] == 2
        assert ai["credits"] == 3.0

    def test_semester_resolution_helpers(self):
        # 3-1 subjects via global semester 5
        sub_5 = get_semester_subjects(5)
        assert "A6CS15" in sub_5

        # 3-2 subjects via global semester 6
        sub_6 = get_semester_subjects(6)
        assert "A6IT39" in sub_6
        assert "A6IT11" in sub_6
        assert "A6CS16" in sub_6

        # 2-1 via year=2, semester=1
        sub_2_1 = get_semester_subjects(1, year=2)
        assert "A6CS05" in sub_2_1

        # 3-1 via year=3, semester=1
        sub_3_1 = get_semester_subjects(1, year=3)
        assert "A6CS15" in sub_3_1

    def test_validation_helpers(self):
        assert validate_subject_code("A6CS15") is True
        assert validate_subject_code("A6IT39") is True
        assert validate_subject_code("INVALID999") is False
