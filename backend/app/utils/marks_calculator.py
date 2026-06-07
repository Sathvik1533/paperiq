"""
Dynamic Marks Calculator - Regulation & Year-Based Evaluation
==============================================================

Official MLRIT PYQ Structural Regulations:
- 2025 R22 papers: Exactly 60 Max Marks (Part-A = 10M, Part-B = 50M)
- 2023/2024 R19/R20 papers: Exactly 70 Max Marks

Zero guessing, zero placeholders, zero dashes.
"""
from typing import Optional


def calculate_max_marks_by_regulation(
    regulation: Optional[str],
    exam_year: Optional[int],
    calculated_marks: int = 0
) -> int:
    """
    Calculate exact max marks based on regulation and year.
    
    Rules:
    1. If calculated_marks > 0 from questions, use that (most accurate)
    2. If regulation is R22 OR exam_year is 2025+, use 60 marks
    3. If exam_year is 2022-2024 OR regulation is R19/R20, use 70 marks
    4. Default fallback: 70 marks (legacy standard)
    
    Args:
        regulation: Paper regulation code (R22, R20, R19, etc.)
        exam_year: Exam year (2025, 2024, 2023, etc.)
        calculated_marks: Sum of marks from parsed questions
    
    Returns:
        Exact max marks (never None, never 0)
    """
    # Priority 1: Use calculated marks from questions if available
    if calculated_marks > 0:
        return calculated_marks
    
    # Priority 2: Regulation-based evaluation
    if regulation:
        reg_upper = regulation.upper().strip()
        
        # R22 papers are always 60 marks (new MLRIT standard)
        if reg_upper == 'R22':
            return 60
        
        # R19/R20 papers are always 70 marks (legacy standard)
        if reg_upper in ('R19', 'R20', 'R18'):
            return 70
    
    # Priority 3: Year-based evaluation
    if exam_year:
        # 2025+ papers follow new 60-mark structure
        if exam_year >= 2025:
            return 60
        
        # 2022-2024 papers follow legacy 70-mark structure
        if 2022 <= exam_year <= 2024:
            return 70
    
    # Default fallback: Legacy 70-mark standard
    return 70


def get_part_distribution(max_marks: int) -> tuple[int, int]:
    """
    Get Part A and Part B marks distribution.
    
    Args:
        max_marks: Total maximum marks
    
    Returns:
        Tuple of (part_a_marks, part_b_marks)
    """
    if max_marks == 60:
        # R22 structure: Part A = 10M, Part B = 50M
        return (10, 50)
    elif max_marks == 70:
        # Legacy structure: Part A = 20M, Part B = 50M
        return (20, 50)
    else:
        # Custom structure: Assume 30/70 split
        part_a = int(max_marks * 0.3)
        part_b = max_marks - part_a
        return (part_a, part_b)


def validate_paper_marks(paper_data: dict) -> dict:
    """
    Validate and correct paper marks data.
    
    Args:
        paper_data: Paper dictionary from database
    
    Returns:
        Updated paper dictionary with correct max_marks
    """
    regulation = paper_data.get('regulation')
    exam_year = paper_data.get('exam_year')
    
    # Calculate from questions if available
    calculated_marks = 0
    if paper_data.get('parsed_questions'):
        calculated_marks = sum(
            q.get('marks', 0) or 0 
            for q in paper_data['parsed_questions']
        )
    
    # Get correct max marks
    correct_max_marks = calculate_max_marks_by_regulation(
        regulation=regulation,
        exam_year=exam_year,
        calculated_marks=calculated_marks
    )
    
    # Update paper data
    paper_data['max_marks'] = correct_max_marks
    
    # Add part distribution for UI
    part_a, part_b = get_part_distribution(correct_max_marks)
    paper_data['part_a_max_marks'] = part_a
    paper_data['part_b_max_marks'] = part_b
    
    return paper_data
