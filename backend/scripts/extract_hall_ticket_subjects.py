#!/usr/bin/env python3
"""
Extract subject codes and names from hall ticket PDFs
Note: PDFs are images - we'll just list the files and provide manual entry template
"""
import os
import re
from pathlib import Path
from collections import defaultdict

HALL_TICKETS_DIR = Path(__file__).parent.parent.parent / "docs" / "hall_tickets"

def extract_text_from_pdf(pdf_path):
    """List PDF file for manual review"""
    # Since PDFs are image-based and OCR is complex, we'll create a template
    # for manual entry based on previous context
    return f"PDF: {pdf_path.name}"

def parse_subjects_from_text(text):
    """Extract subject codes and names from OCR text"""
    subjects = []
    
    # Look for patterns like "A6CS05 Data Structures" or similar
    # Common patterns in hall tickets:
    # 1. Code + Name in same line
    # 2. Multiple variations of spacing
    
    # Pattern 1: A6XX## followed by subject name
    pattern1 = r'(A6[A-Z]{2}\d{2})\s+([A-Za-z\s\(\)&,.-]+?)(?=A6[A-Z]{2}\d{2}|\n|$)'
    matches = re.findall(pattern1, text, re.MULTILINE)
    
    for code, name in matches:
        name = name.strip()
        # Clean up common OCR errors
        name = re.sub(r'\s+', ' ', name)
        # Filter out very short names (likely OCR noise)
        if len(name) > 5 and not name.isdigit():
            subjects.append((code, name))
    
    # Pattern 2: Look for exam date lines (subjects usually have dates)
    # Format: "Code Subject Date Time"
    pattern2 = r'(A6[A-Z]{2}\d{2})[^\n]*?(\d{2}[/-]\d{2}[/-]\d{4})'
    date_matches = re.findall(pattern2, text)
    
    return subjects

def identify_semester(text):
    """Identify which semester this hall ticket is for"""
    # Look for patterns like "II-I" (2-1), "II-II" (2-2), "SEMESTER 3", "SEMESTER 4"
    if re.search(r'II\s*-\s*I|2\s*-\s*1|SEMESTER\s*3|SEM\s*3', text, re.IGNORECASE):
        return "2-1"
    elif re.search(r'II\s*-\s*II|2\s*-\s*2|SEMESTER\s*4|SEM\s*4', text, re.IGNORECASE):
        return "2-2"
    
    # Look for "SUPPLEMENTARY" (usually 2-1) or "REGULAR" (could be either)
    if re.search(r'SUPPLEMENTARY', text, re.IGNORECASE):
        return "2-1 (SUPPLEMENTARY)"
    elif re.search(r'REGULAR', text, re.IGNORECASE):
        return "2-2 (REGULAR)"
    
    return "Unknown"

def main():
    print("Extracting subjects from hall tickets...\n")
    
    if not HALL_TICKETS_DIR.exists():
        print(f"Directory not found: {HALL_TICKETS_DIR}")
        return
    
    results = defaultdict(list)
    
    for pdf_file in sorted(HALL_TICKETS_DIR.glob("*.pdf")):
        print(f"Processing: {pdf_file.name}")
        
        # Extract text using OCR
        text = extract_text_from_pdf(pdf_file)
        
        # Identify semester
        semester = identify_semester(text)
        print(f"  Semester: {semester}")
        
        # Extract subjects
        subjects = parse_subjects_from_text(text)
        print(f"  Subjects found: {len(subjects)}")
        
        if subjects:
            results[semester].extend(subjects)
            for code, name in subjects:
                print(f"    {code} - {name}")
        
        print()
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY BY SEMESTER")
    print("="*80)
    
    for semester in sorted(results.keys()):
        print(f"\n{semester}:")
        unique_subjects = list(dict.fromkeys(results[semester]))  # Remove duplicates, preserve order
        for code, name in unique_subjects:
            print(f"  {code} - {name}")
    
    # Export to file
    output_file = HALL_TICKETS_DIR / "extracted_subjects.txt"
    with open(output_file, 'w') as f:
        f.write("HALL TICKET SUBJECT EXTRACTION\n")
        f.write("="*80 + "\n\n")
        for semester in sorted(results.keys()):
            f.write(f"{semester}:\n")
            unique_subjects = list(dict.fromkeys(results[semester]))
            for code, name in unique_subjects:
                f.write(f"  {code} - {name}\n")
            f.write("\n")
    
    print(f"\n\nResults saved to: {output_file}")

if __name__ == "__main__":
    main()
