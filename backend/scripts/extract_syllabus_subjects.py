#!/usr/bin/env python3
"""
Extract theory subjects from MLRIT R22 CSE syllabus
Source: https://files.mlrit.ac.in/curriculum/133-links/B.Tech-(CSE)MLR22-SYLLABUS.pdf
"""
import sys
import os
import re
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.extractors.pdf_extractor import PDFExtractor

def extract_subjects_from_raw_text():
    """Parse syllabus PDF and extract 2nd year theory subjects"""
    
    pdf_path = '/tmp/mlrit_r22_cse_syllabus.pdf'
    extractor = PDFExtractor()
    doc = extractor.extract(pdf_path)
    
    lines = doc.raw_text.splitlines()
    
    subjects_2_1 = []
    subjects_2_2 = []
    
    # Find II B.Tech.- I Semester section
    sem1_start = None
    sem1_end = None
    sem2_start = None
    sem2_end = None
    
    for i, line in enumerate(lines):
        if 'II B.Tech.- I Semester' in line:
            sem1_start = i
        elif 'II B.Tech.- II Semester' in line:
            sem1_end = i
            sem2_start = i
        elif 'III B.Tech.' in line and sem2_start is not None:
            sem2_end = i
            break
    
    # Extract 2-1 subjects
    if sem1_start and sem1_end:
        for i in range(sem1_start, sem1_end):
            line = lines[i].strip()
            # Pattern: A6CS05 (starts with subject code)
            if re.match(r'^A6[A-Z]{2}\d{2}', line):
                # Get code
                code = line.split()[0]
                # Get name from next line
                if i + 1 < len(lines):
                    name = lines[i + 1].strip()
                    
                    # Skip labs, skills, MC courses
                    if 'Lab' not in name and 'Skill' not in name and code not in ['A6HS05']:
                        subjects_2_1.append({
                            'code': code,
                            'name': name,
                            'year': 2,
                            'semester': 1
                        })
    
    # Extract 2-2 subjects
    if sem2_start and sem2_end:
        for i in range(sem2_start, sem2_end):
            line = lines[i].strip()
            if re.match(r'^A6[A-Z]{2}\d{2}', line):
                code = line.split()[0]
                if i + 1 < len(lines):
                    name = lines[i + 1].strip()
                    
                    # Skip labs, skills, MC courses, projects
                    if ('Lab' not in name and 'Skill' not in name and 
                        code not in ['A6HS06', 'A6CS14']):
                        subjects_2_2.append({
                            'code': code,
                            'name': name,
                            'year': 2,
                            'semester': 2
                        })
    
    return subjects_2_1, subjects_2_2

def main():
    print("=" * 70)
    print("EXTRACTING FROM OFFICIAL MLRIT R22 CSE SYLLABUS")
    print("=" * 70)
    print()
    
    subjects_2_1, subjects_2_2 = extract_subjects_from_raw_text()
    
    print("YEAR II SEMESTER I (2-1) - THEORY SUBJECTS")
    print("-" * 70)
    for s in subjects_2_1:
        print(f"{s['code']} - {s['name']}")
    
    print()
    print("YEAR II SEMESTER II (2-2) - THEORY SUBJECTS")
    print("-" * 70)
    for s in subjects_2_2:
        print(f"{s['code']} - {s['name']}")
    
    print()
    print("=" * 70)
    print(f"2-1 Theory Subjects: {len(subjects_2_1)}")
    print(f"2-2 Theory Subjects: {len(subjects_2_2)}")
    print(f"Total 2nd Year Theory: {len(subjects_2_1) + len(subjects_2_2)}")
    print("=" * 70)
    
    # Save to JSON
    import json
    output = {
        '2-1': subjects_2_1,
        '2-2': subjects_2_2
    }
    
    with open('/tmp/mlrit_r22_year2_verified.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print("\n✅ Verified subjects saved to: /tmp/mlrit_r22_year2_verified.json")
    print("\nREADY FOR VERIFICATION")
    print("Confirm these subjects match the official syllabus before continuing.")

if __name__ == "__main__":
    main()
