#!/usr/bin/env python3
"""
Fast CSE paper processing - optimized for 100+ papers
SCOPE: MLRIT CSE R22 2-1 and 2-2 ONLY
- Only processes R22 papers (ignores R18, R20, R15)
- Keeps ALL R22 papers from 2021-2025 (historical data)
- Batch database inserts
- Skip already processed papers
- Progress tracking
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

load_dotenv()

# VERIFIED R22 CSE SUBJECTS (from hall tickets)
# 2-1
R22_2_1_CODES = {
    "A6IT02": "Object Oriented Programming through Java",
    "A6CS28": "Digital Electronics and Computer Organization",
    "A6CS05": "Data Structures",
    "A6CS07": "Software Engineering",
    "A6BS03": "Computer Oriented Statistical Methods",
}

# 2-2
R22_2_2_CODES = {
    "A6HS08": "Business Economics and Financial Analysis",
    "A6CS08": "Discrete Mathematics",
    "A6CS13": "Software Testing Fundamentals",
    "A6CS09": "Database Management Systems",
    "A6CS11": "Operating System",
}

# Combined lookup
ALL_R22_CODES = {**R22_2_1_CODES, **R22_2_2_CODES}

# Regulation filter - ONLY R22
ALLOWED_REGULATIONS = {"R22", "R-22"}

def extract_rar(rar_path, dest_dir):
    """Extract RAR using unar"""
    try:
        subprocess.run(['unar', '-q', '-o', dest_dir, rar_path], 
                      check=True, capture_output=True, timeout=60)
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
    
    print("=" * 60)
    print("FAST CSE PAPER PROCESSING")
    print("=" * 60)
    
    # Get subject IDs
    subjects_result = supabase.table("subjects").select("id, code, name").execute()
    subject_map = {s['code']: s['id'] for s in subjects_result.data}
    print(f"✅ Loaded {len(subject_map)} subjects")
    
    # We'll let database handle duplicates via unique constraints
    print(f"✅ Will process all papers, database handles duplicates")
    
    # Find B.Tech archives
    rar_files = [f for f in archive_dir.glob("*.rar") 
                 if "B.Tech" in f.name or "BTech" in f.name or "BTECH" in f.name]
    rar_files = [f for f in rar_files if "PG" not in f.name]
    print(f"✅ Found {len(rar_files)} B.Tech archives")
    
    # Extract all archives (if not already extracted)
    print("\n" + "=" * 60)
    print("EXTRACTING ARCHIVES")
    print("=" * 60)
    
    all_cse_files = []
    for rar_file in rar_files:
        archive_extract_dir = extract_dir / rar_file.stem
        
        if archive_extract_dir.exists():
            print(f"⏭️  {rar_file.name} (already extracted)")
        else:
            print(f"📦 {rar_file.name}", end=" ")
            archive_extract_dir.mkdir(parents=True, exist_ok=True)
            if extract_rar(str(rar_file), str(archive_extract_dir)):
                print("✅")
            else:
                print("❌")
                continue
        
        # Find CSE files
        all_files = list(archive_extract_dir.rglob("*"))
        for f in all_files:
            if f.is_file() and f.suffix.lower() in ['.pdf', '.docx', '.doc']:
                # Skip temp files
                if f.name.startswith('~$'):
                    continue
                code = extract_subject_code(f.name)
                if code and code in ALL_R22_CODES:
                    all_cse_files.append((f, code))
    
    print(f"\n✅ Total CSE papers found: {len(all_cse_files)}")
    
    if not all_cse_files:
        print("⚠️ No new papers to process - all done!")
        return
    
    # Process papers
    print("\n" + "=" * 60)
    print("PROCESSING CSE PAPERS")
    print("=" * 60)
    
    parser = QuestionParser()
    papers_added = 0
    questions_added = 0
    
    # Batch size for database inserts
    BATCH_SIZE = 100
    question_batch = []
    
    for i, (file_path, subject_code) in enumerate(all_cse_files, 1):
        try:
            if i % 10 == 0:
                print(f"Progress: {i}/{len(all_cse_files)} papers processed")
            
            # Extract text
            doc = extract(str(file_path))
            if not doc or not doc.raw_text or len(doc.raw_text) < 100:
                continue
            
            # Get subject_id
            subject_id = subject_map.get(subject_code)
            if not subject_id:
                continue
            
            # Prepare paper data
            subject_name = ALL_R22_CODES.get(subject_code, subject_code)
            semester = R22_2_1_CODES.get(subject_code) and 1 or R22_2_2_CODES.get(subject_code) and 2
            
            paper_data = {
                "title": file_path.stem,  # Use filename without extension as title
                "file_name": file_path.name,
                "subject_id": subject_id,
                "regulation": "R22",
                "semester": semester,
                "exam_type": "regular",  # will be updated by metadata extraction
                "exam_category": "Unknown",  # will be updated by metadata extraction
            }
            
            # Create paper (will fail silently if duplicate)
            try:
                paper_result = supabase.table("papers").insert(paper_data).execute()
                paper_id = paper_result.data[0]['id'] if paper_result.data else None
            except:
                # Paper already exists, fetch it
                existing = supabase.table("papers").select("id").eq("file_name", file_path.name).execute()
                paper_id = existing.data[0]['id'] if existing.data else None
                if not paper_id:
                    continue
            
            if not paper_id:
                continue
            
            papers_added += 1
            
            # Parse questions
            result = parser.parse(doc.raw_text, paper_id, subject_id)
            if not result.questions:
                continue
            
            # Add questions to batch
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
                question_batch.append(q_data)
            
            # Batch insert when we have enough
            if len(question_batch) >= BATCH_SIZE:
                try:
                    supabase.table("questions").insert(question_batch).execute()
                    questions_added += len(question_batch)
                    question_batch = []
                except Exception as e:
                    print(f"  ⚠️ Batch insert failed: {e}")
                    question_batch = []
            
        except Exception as e:
            print(f"  ❌ [{i}] Error: {str(e)[:50]}")
    
    # Insert remaining questions
    if question_batch:
        try:
            supabase.table("questions").insert(question_batch).execute()
            questions_added += len(question_batch)
        except Exception as e:
            print(f"  ⚠️ Final batch failed: {e}")
    
    print(f"\n✅ Added {papers_added} papers")
    print(f"✅ Added {questions_added} questions")
    
    # Final counts
    print("\n" + "=" * 60)
    print("FINAL DATABASE COUNTS")
    print("=" * 60)
    
    papers = supabase.table("papers").select("id", count="exact").execute()
    questions = supabase.table("questions").select("id", count="exact").execute()
    subjects = supabase.table("subjects").select("id", count="exact").execute()
    
    print(f"Total Subjects: {subjects.count}")
    print(f"Total Papers:   {papers.count}")
    print(f"Total Questions: {questions.count}")
    
    # Top 10 subjects by question count
    print("\n" + "=" * 60)
    print("TOP 10 SUBJECTS BY QUESTION COUNT")
    print("=" * 60)
    
    top_subjects = []
    for code, name in ALL_R22_CODES.items():
        subject_id = subject_map.get(code)
        if subject_id:
            q_count = supabase.table("questions").select("id", count="exact").eq("subject_id", subject_id).execute()
            top_subjects.append((code, name, q_count.count))
    
    top_subjects.sort(key=lambda x: x[2], reverse=True)
    
    for rank, (code, name, count) in enumerate(top_subjects[:10], 1):
        print(f"{rank}. {code} - {name}: {count} questions")

if __name__ == "__main__":
    main()
