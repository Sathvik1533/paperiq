"""
Test Dynamic Marks Calculator
==============================

Validates year and regulation-based marks calculation against official MLRIT standards.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.marks_calculator import (
    calculate_max_marks_by_regulation,
    get_part_distribution,
    validate_paper_marks
)


def test_r22_papers_return_60_marks():
    """R22 papers should always return 60 marks"""
    result = calculate_max_marks_by_regulation(
        regulation="R22",
        exam_year=2025,
        calculated_marks=0
    )
    assert result == 60, f"Expected 60 for R22, got {result}"
    print("✅ R22 papers return 60 marks")


def test_r20_papers_return_70_marks():
    """R20/R19 papers should always return 70 marks"""
    for reg in ["R20", "R19", "R18"]:
        result = calculate_max_marks_by_regulation(
            regulation=reg,
            exam_year=2023,
            calculated_marks=0
        )
        assert result == 70, f"Expected 70 for {reg}, got {result}"
    print("✅ R19/R20/R18 papers return 70 marks")


def test_year_2025_returns_60_marks():
    """2025+ papers should return 60 marks even without regulation"""
    result = calculate_max_marks_by_regulation(
        regulation=None,
        exam_year=2025,
        calculated_marks=0
    )
    assert result == 60, f"Expected 60 for year 2025, got {result}"
    print("✅ Year 2025+ returns 60 marks")


def test_year_2023_returns_70_marks():
    """2022-2024 papers should return 70 marks"""
    for year in [2022, 2023, 2024]:
        result = calculate_max_marks_by_regulation(
            regulation=None,
            exam_year=year,
            calculated_marks=0
        )
        assert result == 70, f"Expected 70 for year {year}, got {result}"
    print("✅ Years 2022-2024 return 70 marks")


def test_calculated_marks_takes_priority():
    """Calculated marks from questions should take priority"""
    result = calculate_max_marks_by_regulation(
        regulation="R22",
        exam_year=2025,
        calculated_marks=58  # Actual sum from questions
    )
    assert result == 58, f"Expected 58 (calculated), got {result}"
    print("✅ Calculated marks take priority over regulation")


def test_default_fallback_is_70():
    """Default fallback should be 70 marks"""
    result = calculate_max_marks_by_regulation(
        regulation=None,
        exam_year=None,
        calculated_marks=0
    )
    assert result == 70, f"Expected 70 (default), got {result}"
    print("✅ Default fallback is 70 marks")


def test_part_distribution_60_marks():
    """60-mark papers should have 10M + 50M distribution"""
    part_a, part_b = get_part_distribution(60)
    assert part_a == 10, f"Expected Part A = 10M, got {part_a}"
    assert part_b == 50, f"Expected Part B = 50M, got {part_b}"
    print("✅ 60-mark papers: Part A = 10M, Part B = 50M")


def test_part_distribution_70_marks():
    """70-mark papers should have 20M + 50M distribution"""
    part_a, part_b = get_part_distribution(70)
    assert part_a == 20, f"Expected Part A = 20M, got {part_a}"
    assert part_b == 50, f"Expected Part B = 50M, got {part_b}"
    print("✅ 70-mark papers: Part A = 20M, Part B = 50M")


def test_validate_paper_marks():
    """Test complete paper validation"""
    paper_data = {
        "regulation": "R22",
        "exam_year": 2025,
        "parsed_questions": [
            {"marks": 1}, {"marks": 1}, {"marks": 10}
        ]
    }
    
    validated = validate_paper_marks(paper_data)
    
    # Should use calculated marks (1+1+10=12)
    assert validated["max_marks"] == 12, f"Expected 12, got {validated['max_marks']}"
    # For custom 12 marks, it uses 30/70 split: 3.6 → 3, and 12-3 = 9
    assert validated["part_a_max_marks"] == 3
    assert validated["part_b_max_marks"] == 9
    print("✅ Paper validation works correctly")


def test_official_mlrit_document_case():
    """
    Test case based on official MLRIT PYQ document:
    - Course: A6HS08 Business Economics
    - Regulation: R22
    - Part A: 10 × 1M = 10M
    - Part B: 5 × 10M = 50M
    - Total: 60M
    """
    result = calculate_max_marks_by_regulation(
        regulation="R22",
        exam_year=2025,
        calculated_marks=0
    )
    assert result == 60, f"Official MLRIT R22 paper should be 60M, got {result}"
    
    part_a, part_b = get_part_distribution(60)
    assert part_a == 10 and part_b == 50, "R22 distribution should be 10M + 50M"
    
    print("✅ Official MLRIT R22 document case: 60 marks (10M + 50M)")


def run_all_tests():
    print("="*70)
    print("MARKS CALCULATOR TEST SUITE")
    print("="*70)
    
    try:
        test_r22_papers_return_60_marks()
        test_r20_papers_return_70_marks()
        test_year_2025_returns_60_marks()
        test_year_2023_returns_70_marks()
        test_calculated_marks_takes_priority()
        test_default_fallback_is_70()
        test_part_distribution_60_marks()
        test_part_distribution_70_marks()
        test_validate_paper_marks()
        test_official_mlrit_document_case()
        
        print("="*70)
        print("✅ ALL TESTS PASSED")
        print("="*70)
        print("\nMarks Calculator is production-ready:")
        print("  - R22 papers: 60 marks (10M + 50M)")
        print("  - R19/R20 papers: 70 marks (20M + 50M)")
        print("  - Year-based fallback: 2025+ = 60M, 2022-2024 = 70M")
        print("  - Calculated marks take priority")
        print("  - Default fallback: 70 marks")
        
        return True
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
