#!/usr/bin/env python3
"""
Extract PDFs from downloaded RAR archives and process them
"""
import os
import sys
import zipfile
import subprocess
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
from app.extractors.extractor_factory import extract
from app.parsers.question_parser import QuestionParser

load_dotenv()

def extract_rar(rar_path, dest_dir):
    """Extract RAR archive using unar"""
    try:
        subprocess.run(['unar', '-o', dest_dir, rar_path], 
                      check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    archive_dir = Path("/tmp/paperiq_full_ingestion")
    extract_dir = Path("/tmp/paperiq_extracted")
    extract_dir.mkdir(exist_ok=True)
    
    print("=" * 60)
    print("EXTRACTING AND PROCESSING ARCHIVES")
    print("=" * 60)
    
    # Find all RAR files
    rar_files = list(archive_dir.glob("*.rar"))
    print(f"\nFound {len(rar_files)} RAR archives")
    
    all_pdfs = []
    for rar_file in rar_files[:5]:  # Process first 5 archives
        print(f"\nExtracting: {rar_file.name}")
        archive_extract_dir = extract_dir / rar_file.stem
        archive_extract_dir.mkdir(exist_ok=True)
        
        if extract_rar(str(rar_file), str(archive_extract_dir)):
            # Find all PDFs
            pdfs = list(archive_extract_dir.rglob("*.pdf"))
            print(f"  Found {len(pdfs)} PDFs")
            all_pdfs.extend(pdfs)
        else:
            print(f"  ❌ Failed to extract")
    
    print(f"\n✅ Total PDFs extracted: {len(all_pdfs)}")
    
    # Process PDFs
    print("\n" + "=" * 60)
    print("PROCESSING PDFs")
    print("=" * 60)
    
    parser = QuestionParser()
    questions_added = 0
    
    for i, pdf_path in enumerate(all_pdfs[:50], 1):  # Process first 50 PDFs
        try:
            # Extract text
            text = extract(str(pdf_path))
            if not text or len(text) < 100:
                continue
            
            # Parse questions
            questions = parser.parse(text)
            if not questions:
                continue
            
            # Get or create paper
            papers = supabase.table("papers").select("id").eq("file_name", pdf_path.name).execute()
            
            if not papers.data:
                # Create paper entry
                paper_data = {
                    "title": pdf_path.stem,
                    "file_name": pdf_path.name,
                    "file_type": "pdf",
                    "regulation": "R22",
                    "exam_type": "regular",
                    "exam_category": "Unknown",
                    "extraction_status": "complete"
                }
                paper_result = supabase.table("papers").insert(paper_data).execute()
                paper_id = paper_result.data[0]['id'] if paper_result.data else None
            else:
                paper_id = papers.data[0]['id']
            
            if not paper_id:
                continue
            
            # Store questions
            for q in questions:
                q_data = {
                    "paper_id": paper_id,
                    "question_text": q.get("question_text", ""),
                    "marks": q.get("marks"),
                    "unit_name": q.get("unit"),
                    "question_type": q.get("type"),
                    "part": q.get("part")
                }
                try:
                    supabase.table("questions").insert(q_data).execute()
                    questions_added += 1
                except:
                    pass
            
            print(f"[{i}/{min(50, len(all_pdfs))}] {pdf_path.name[:40]} → {len(questions)} questions")
            
        except Exception as e:
            pass
    
    print(f"\n✅ Added {questions_added} questions")
    
    # Final counts
    print("\n" + "=" * 60)
    print("FINAL COUNTS")
    print("=" * 60)
    
    papers = supabase.table("papers").select("id", count="exact").execute()
    questions = supabase.table("questions").select("id", count="exact").execute()
    
    print(f"Papers:    {papers.count}")
    print(f"Questions: {questions.count}")

if __name__ == "__main__":
    main()
