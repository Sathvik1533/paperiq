#!/usr/bin/env python3
"""
Parse official MLRIT R22 CSE syllabus PDF
Extract semester-wise theory subjects only
"""
import sys
import os
import re
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.extractors.pdf_extractor import PDFExtractor

def parse_syllabus():
    """Extract theory subjects from official syllabus PDF"""
    
    pdf_path = "/tmp/mlrit_r22_cse_syllabus.pdf"
    extractor = PDFExtractor()
    doc = extractor.extract(pdf_path)
    
    text = doc.raw_text
    lines = text.split('\n')
    
    # Pattern: A6CS05 or similar subject codes
    code_pattern = re.compile(r'^([A-Z]\d[A-Z]{2}\d{2})\s*(.+?)(?:\s+\d+\s+\d+\s+\d+\s+\d+)?$')
    
    # Semester markers
    semester_pattern = re.compile(r'(1[-\s]1|1[-\s]2|2[-\s]1|2[-\s]2|3[-\s]1|3[-\s]2|4[-\s]1|4[-\s]2)')
    
    subjects = []
    current_semester = None
    current_year = None
    
    # Skip these keywords
    skip_keywords = ['lab', 'laboratory', 'mini project', 'internship', 'seminar', 
                     'audit', 'elective', 'skill', 'honors']
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Detect semester
        sem_match = semester_pattern.search(line)
        if sem_match:
            sem_str = sem_match.group(1).replace(' ', '-')
            year, semester = sem_str.split('-')
            current_year = int(year)
            current_semester = int(semester)
            continue
        
        # Extract subject code and name
        code_match = code_pattern.match(line)
        if code_match and current_semester and current_year:
            code = code_match.group(1)
            name = code_match.group(2).strip()
            
            # Clean name
            name = re.sub(r'\s+\d+\s+\d+\s+\d+\s+\d+\s*$', '', name).strip()
            
            # Skip non-theory subjects
            name_lower = name.lower()
            if any(skip in name_lower for skip in skip_keywords):
                continue
            
            # Skip if name too short
            if len(name) < 5:
                continue
            
            subjects.append({
                'code': code,
                'name': name,
                'year': current_year,
                'semester': current_semester
            })
    
    return subjects

def main():
    print("=" * 60)
    print("PARSING MLRIT R22 CSE SYLLABUS")
    print("=" * 60)
    print()
    
    subjects = parse_syllabus()
    
    # Filter for 2nd year only
    year2_subjects = [s for s in subjects if s['year'] == 2]
    
    # Group by semester
    sem1 = [s for s in year2_subjects if s['semester'] == 1]
    sem2 = [s for s in year2_subjects if s['semester'] == 2]
    
    print("2-1 SUBJECTS (Theory Only)")
    print("-" * 60)
    for s in sem1:
        print(f"{s['code']} - {s['name']}")
    
    print()
    print("2-2 SUBJECTS (Theory Only)")
    print("-" * 60)
    for s in sem2:
        print(f"{s['code']} - {s['name']}")
    
    print()
    print("=" * 60)
    print(f"Total 2-1 subjects: {len(sem1)}")
    print(f"Total 2-2 subjects: {len(sem2)}")
    print("=" * 60)
    
    # Save to file for verification
    import json
    output = {
        '2-1': sem1,
        '2-2': sem2
    }
    
    with open('/tmp/mlrit_r22_2nd_year.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print("\n✅ Saved to: /tmp/mlrit_r22_2nd_year.json")

if __name__ == "__main__":
    main()
