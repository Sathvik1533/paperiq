"""
Tests for exam classification utilities.
"""
import pytest
from app.utils.exam_classifier import (
    detect_exam_category,
    detect_regulation,
    detect_exam_type,
    classify_paper_from_label,
)


class TestExamCategoryDetection:
    """Test Mid-1, Mid-2, Semester detection."""
    
    def test_mid_1_detection(self):
        assert detect_exam_category("II-B.Tech I Semester Mid-1 Examinations, August-2024") == "Mid-1"
        assert detect_exam_category("II B.Tech Mid-I Exam February 2024") == "Mid-1"
        assert detect_exam_category("First Mid Term Exam") == "Mid-1"
    
    def test_mid_2_detection(self):
        assert detect_exam_category("II-B.Tech I Semester Mid-2 Examinations, October-2024") == "Mid-2"
        assert detect_exam_category("II B.Tech Mid-II Exam March 2024") == "Mid-2"
        assert detect_exam_category("Second Mid Term Exam") == "Mid-2"
    
    def test_semester_detection(self):
        assert detect_exam_category("II B.Tech I Semester Regular Examinations, February-2024") == "Semester"
        assert detect_exam_category("II-BTECH End Sem Exam August 2024") == "Semester"
        assert detect_exam_category("Final Semester Examination") == "Semester"
    
    def test_unknown_category(self):
        assert detect_exam_category("Some Random Label") == "Unknown"


class TestRegulationDetection:
    """Test R22, R20, R18 detection."""
    
    def test_standard_format(self):
        assert detect_regulation("R22 Discrete Mathematics") == "R22"
        assert detect_regulation("R20 Data Structures") == "R20"
        assert detect_regulation("R18 DBMS") == "R18"
    
    def test_with_dash(self):
        assert detect_regulation("R-22 Algorithms") == "R22"
        assert detect_regulation("R.20 OS") == "R20"
    
    def test_case_insensitive(self):
        assert detect_regulation("r22 subject") == "R22"
        assert detect_regulation("r20 Subject") == "R20"
    
    def test_no_regulation(self):
        assert detect_regulation("Some paper without regulation") is None


class TestExamTypeDetection:
    """Test Regular vs Supplementary detection."""
    
    def test_regular_detection(self):
        assert detect_exam_type("II B.Tech Regular Examinations") == "Regular"
        assert detect_exam_type("Regular Exam February 2024") == "Regular"
    
    def test_supplementary_detection(self):
        assert detect_exam_type("II B.Tech Supplementary Examinations") == "Supplementary"
        assert detect_exam_type("Supply Exam August 2024") == "Supplementary"
        assert detect_exam_type("Supple Exam") == "Supplementary"
        assert detect_exam_type("Backlog Examination") == "Supplementary"


class TestFullClassification:
    """Test complete classification pipeline."""
    
    def test_complete_mlrit_label(self):
        label = "II-B.Tech I Semester Mid-1 Regular Examinations, August-2024 (R22)"
        result = classify_paper_from_label(label)
        
        assert result["exam_category"] == "Mid-1"
        assert result["exam_type"] == "Regular"
        assert result["regulation"] == "R22"
    
    def test_semester_regular_r22(self):
        label = "II B.Tech I Semester Regular Examinations, February-2024 R22"
        result = classify_paper_from_label(label)
        
        assert result["exam_category"] == "Semester"
        assert result["exam_type"] == "Regular"
        assert result["regulation"] == "R22"
    
    def test_mid_2_supplementary_r20(self):
        label = "II-BTECH Mid-2 Supplementary Exam R20 October 2024"
        result = classify_paper_from_label(label)
        
        assert result["exam_category"] == "Mid-2"
        assert result["exam_type"] == "Supplementary"
        assert result["regulation"] == "R20"
    
    def test_partial_info(self):
        label = "Semester Exam 2024"
        result = classify_paper_from_label(label)
        
        assert result["exam_category"] == "Semester"
        assert result["exam_type"] == "Regular"  # default
        assert result["regulation"] is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
