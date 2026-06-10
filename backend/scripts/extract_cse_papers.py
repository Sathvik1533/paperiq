#!/usr/bin/env python3
"""
Extract and process CSE papers from RAR archives
"""
import os
import sys
import re
import subprocess
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
from app.extractors.extractor_factory import extract
from app.parsers.question_parser import QuestionParser
from app.parsers.marks_extractor import extract_dynamic_marks

load_dotenv()

# R22 CSE subject codes — ONLY the 10 official 2nd-year subjects
# 5 for Semester 2-1, 5 for Semester 2-2
CSE_CODES = {
    # Semester 2-1
    "A6CS05": "Data Structures",
    "A6IT02": "Object Oriented Programming through Java",
    "A6CS02": "Digital Electronics and Computer Organization",
    "A6CS07": "Software Engineering",
    "A6BS03": "Computer Oriented Statistical Methods",
    # Semester 2-2
    "A6HS08": "Business Economics and Financial Analysis",
    "A6CS08": "Discrete Mathematics",
    "A6CS09": "Database Management Systems",
    "A6CS11": "Operating System",
    "A6CS13": "Software Testing Fundamentals",
}

def extract_rar(rar_path, dest_dir):
    """Extract RAR using unar"""
    try:
        subprocess.run(['unar', '-q', '-o', dest_dir, rar_path], 
                      check=True, capture_output=True)
        return True
    except:
        return False

def extract_subject_code(filename):
    """Extract R22 subject code from filename"""
    match = re.search(r'(A6[A-Z]{2}\d{2})', filename)
    return match.group(1) if match else None

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    archive_dir = Path("/tmp/paperiq_full_ingestion")
    extract_dir = Path("/tmp/paperiq_cse_extracted")
    extract_dir.mkdir(exist_ok=True)
    
    print("=" * 60)
    print("EXTRACTING CSE PAPERS FROM RAR ARCHIVES")
    print("=" * 60)
    
    # Find B.Tech archives (not PG)
    rar_files = [f for f in archive_dir.glob("*.rar") 
                 if "B.Tech" in f.name or "BTech" in f.name or "BTECH" in f.name]
    rar_files = [f for f in rar_files if "PG" not in f.name]
    
    print(f"\nFound {len(rar_files)} B.Tech archives")
    
    all_cse_files = []
    for rar_file in rar_files:
        print(f"\nExtracting: {rar_file.name}")
        archive_extract_dir = extract_dir / rar_file.stem
        archive_extract_dir.mkdir(exist_ok=True)
        
        if extract_rar(str(rar_file), str(archive_extract_dir)):
            # Find CSE files (PDF or DOCX with A6CS codes)
            all_files = list(archive_extract_dir.rglob("*"))
            cse_files = []
            for f in all_files:
                if f.is_file() and (f.suffix.lower() in ['.pdf', '.docx', '.doc']):
                    code = extract_subject_code(f.name)
                    if code and code in CSE_CODES:
                        cse_files.append((f, code))
            
            print(f"  Found {len(cse_files)} CSE papers")
            all_cse_files.extend(cse_files)
        else:
            print(f"  ❌ Failed to extract")
    
    print(f"\n✅ Total CSE papers: {len(all_cse_files)}")
    
    # Get subject IDs from database
    subjects_result = supabase.table("subjects").select("id, code, name").execute()
    subject_map = {s['code']: s['id'] for s in subjects_result.data}
    
    print(f"✅ Found {len(subject_map)} subjects in database")
    
    # Process papers
    print("\n" + "=" * 60)
    print("PROCESSING CSE PAPERS")
    print("=" * 60)
    
    parser = QuestionParser()
    papers_added = 0
    questions_added = 0
    
    # Process first 20 papers for testing
    files_to_process = all_cse_files[:20]
    
    for i, (file_path, subject_code) in enumerate(files_to_process, 1):
        try:
            print(f"\n[{i}/{len(files_to_process)}] {file_path.name[:50]}")
            
            # Extract text
            doc = extract(str(file_path))
            if not doc or not doc.raw_text or len(doc.raw_text) < 100:
                print("  ⚠️ No text extracted")
                continue
            
            # Create or get paper first
            papers = supabase.table("papers").select("id").eq("file_name", file_path.name).execute()
            
            subject_id = subject_map.get(subject_code)
            if not subject_id:
                print(f"  ⚠️ No subject found for {subject_code}")
                continue
            
            # Extract year from rar_file.name (e.g., Aug-2023.rar -> 2023)
            year_match = re.search(r'(20\d{2})', rar_file.name)
            exam_year = int(year_match.group(1)) if year_match else None
            
            # Calculate dynamic max evaluation marks
            dyn_marks = extract_dynamic_marks(doc.raw_text)
            # Default to 70 for 2023-2025 R22, otherwise 75
            if dyn_marks is None:
                dyn_marks = 70.0 if exam_year in (2023, 2024, 2025) else 75.0
            
            if not papers.data:
                # Create paper
                paper_data = {
                    "title": CSE_CODES.get(subject_code, file_path.stem),
                    "file_name": file_path.name,
                    "file_type": file_path.suffix[1:],
                    "regulation": "R22",
                    "subject_id": subject_id,
                    "exam_year": exam_year,
                    "exam_type": "regular",
                    "exam_category": "Unknown",
                    "extraction_status": "complete",
                    "max_evaluation_marks": dyn_marks
                }
                paper_result = supabase.table("papers").insert(paper_data).execute()
                paper_id = paper_result.data[0]['id'] if paper_result.data else None
                papers_added += 1
                print(f"  ✅ Created paper (subject: {CSE_CODES[subject_code]}, year: {exam_year})")
            else:
                paper_id = papers.data[0]['id']
                # Update subject_id, year, and max_evaluation_marks
                supabase.table("papers").update({
                    "subject_id": subject_id, 
                    "exam_year": exam_year,
                    "max_evaluation_marks": dyn_marks
                }).eq("id", paper_id).execute()
                print(f"  ✅ Updated existing paper (year: {exam_year})")
            
            if not paper_id:
                continue
            
            # Parse questions with paper_id
            result = parser.parse(doc.raw_text, paper_id, subject_id)
            if not result.questions:
                print("  ⚠️ No questions parsed")
                continue
            
            print(f"  ✅ Parsed {len(result.questions)} questions")
            
            # Store questions
            for q in result.questions:
                q_data = {
                    "paper_id": paper_id,
                    "subject_id": subject_id,
                    "question_text": q.question_text,
                    "marks": q.marks,
                    "unit_name": None,
                    "question_type": q.question_type.value if hasattr(q.question_type, 'value') else str(q.question_type) if q.question_type else None,
                    "part": q.section.value if hasattr(q.section, 'value') else str(q.section) if q.section else None
                }
                try:
                    supabase.table("questions").insert(q_data).execute()
                    questions_added += 1
                except Exception as e:
                    pass
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print(f"\n✅ Added {papers_added} papers")
    print(f"✅ Added {questions_added} questions")
    
    # Final counts
    print("\n" + "=" * 60)
    print("FINAL DATABASE COUNTS")
    print("=" * 60)
    
    papers = supabase.table("papers").select("id", count="exact").execute()
    questions = supabase.table("questions").select("id", count="exact").execute()
    
    print(f"Total Papers:    {papers.count}")
    print(f"Total Questions: {questions.count}")
    
    # CSE subjects with questions
    print("\n" + "=" * 60)
    print("CSE SUBJECTS WITH QUESTIONS")
    print("=" * 60)
    
    for code, name in CSE_CODES.items():
        subject_id = subject_map.get(code)
        if subject_id:
            q_count = supabase.table("questions").select("id", count="exact").eq("subject_id", subject_id).execute()
            print(f"{code} - {name}: {q_count.count} questions")

if __name__ == "__main__":
    main()
