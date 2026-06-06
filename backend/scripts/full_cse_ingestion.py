#!/usr/bin/env python3
"""
Full R22 CSE Ingestion Pipeline
Discovers, downloads, extracts, parses, and links all CSE papers
"""
import os
import sys
import re
import asyncio
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
from app.scrapers.colleges.mlrit import MLRITScraper
from app.jobs.extract_job import run_extract_job
from app.jobs.parse_job import run_parse_job

load_dotenv()

async def main():
    print("=" * 60)
    print("FULL R22 CSE INGESTION PIPELINE")
    print("=" * 60)
    
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    # Step 1: Get all R22 CSE subjects
    print("\n[1/7] Loading R22 CSE subjects...")
    subjects = supabase.table("subjects").select("*").eq("regulation", "R22").execute()
    subject_map = {s['code']: s for s in subjects.data}
    print(f"✅ Loaded {len(subjects.data)} subjects")
    print(f"    Sample codes: {list(subject_map.keys())[:5]}")
    
    # Step 2: Discover papers
    print("\n[2/7] Discovering papers from MLRIT portal...")
    scraper = MLRITScraper()
    portal_url = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"
    
    discovered = await scraper.list_papers(
        portal_url=portal_url,
        btech_year=2,  # 2nd year = 2-1 and 2-2
        year_from=2021,
        year_to=2025
    )
    print(f"✅ Discovered {len(discovered)} archives")
    
    # Step 3: Download and store
    print("\n[3/7] Downloading and storing papers...")
    download_dir = "/tmp/paperiq_full_ingestion"
    os.makedirs(download_dir, exist_ok=True)
    
    college = supabase.table("colleges").select("*").eq("short_name", "MLRIT").execute()
    college_id = college.data[0]['id'] if college.data else None
    
    new_papers = []
    for i, paper_meta in enumerate(discovered[:20], 1):  # Limit to 20 for speed
        try:
            local_path = await scraper.download(paper_meta, download_dir)
            file_size = os.path.getsize(local_path)
            ext = local_path.rsplit(".", 1)[-1].lower()
            
            # Extract subject code from filename
            subject_code = None
            match = re.search(r'[A-Z]\d[A-Z]{2,}\d{2}', paper_meta.file_name)
            if match:
                subject_code = match.group(0)
            
            subject_id = subject_map.get(subject_code, {}).get('id') if subject_code else None
            
            # Store paper
            paper_data = {
                "college_id": college_id,
                "subject_id": subject_id,
                "title": paper_meta.label,
                "exam_type": "regular",  # lowercase
                "exam_category": "Unknown",
                "exam_month": paper_meta.exam_month,
                "exam_year": paper_meta.exam_year,
                "regulation": "R22",
                "original_url": paper_meta.url,
                "file_name": paper_meta.file_name,
                "file_type": ext,
                "file_size_bytes": file_size,
                "file_hash": f"hash_{i}",
                "extraction_status": "pending"
            }
            
            result = supabase.table("papers").insert(paper_data).execute()
            if result.data:
                new_papers.append(result.data[0]['id'])
                if subject_code:
                    print(f"  [{i}/{min(20, len(discovered))}] {paper_meta.file_name[:40]} → {subject_code}")
                else:
                    print(f"  [{i}/{min(20, len(discovered))}] {paper_meta.file_name[:40]} → No subject code")
        except Exception as e:
            print(f"  ❌ Failed: {paper_meta.file_name}: {e}")
    
    print(f"✅ Stored {len(new_papers)} papers")
    
    # Step 4: Extract
    print("\n[4/7] Extracting text from PDFs...")
    try:
        extract_result = await run_extract_job(paper_id=None)
        print(f"✅ Extraction: {extract_result}")
    except Exception as e:
        print(f"⚠️  Extraction: {e}")
    
    # Step 5: Parse questions
    print("\n[5/7] Parsing questions...")
    try:
        parse_result = await run_parse_job(paper_id=None)
        print(f"✅ Parsing: {parse_result}")
    except Exception as e:
        print(f"⚠️  Parsing: {e}")
    
    # Step 6: Link questions to subjects from papers
    print("\n[6/7] Linking questions to subjects...")
    papers_with_subjects = supabase.table("papers").select("id, subject_id").not_.is_("subject_id", "null").execute()
    
    linked_count = 0
    for paper in papers_with_subjects.data:
        questions = supabase.table("questions").select("id").eq("paper_id", paper['id']).execute()
        for q in questions.data:
            supabase.table("questions").update({"subject_id": paper['subject_id']}).eq("id", q['id']).execute()
            linked_count += 1
    
    print(f"✅ Linked {linked_count} questions to subjects")
    
    # Step 7: Backfill exam categories
    print("\n[7/7] Backfilling exam categories...")
    papers_all = supabase.table("papers").select("id, exam_month").execute()
    
    updated_count = 0
    for paper in papers_all.data:
        month = paper.get('exam_month')
        category = "Unknown"
        
        if month:
            if month in [3, 4, 5]:
                category = "Mid-1"
            elif month in [9, 10, 11]:
                category = "Mid-2"
            elif month in [6, 7, 12, 1]:
                category = "Semester"
        
        if category != "Unknown":
            supabase.table("papers").update({"exam_category": category}).eq("id", paper['id']).execute()
            updated_count += 1
    
    print(f"✅ Updated {updated_count} papers with exam categories")
    
    # Final counts
    print("\n" + "=" * 60)
    print("FINAL DATABASE COUNTS")
    print("=" * 60)
    
    subjects_count = supabase.table("subjects").select("id", count="exact").eq("regulation", "R22").execute()
    papers_count = supabase.table("papers").select("id", count="exact").execute()
    questions_count = supabase.table("questions").select("id", count="exact").execute()
    topics_count = supabase.table("syllabus_topics").select("id", count="exact").execute()
    
    print(f"Subjects:  {subjects_count.count}")
    print(f"Papers:    {papers_count.count}")
    print(f"Questions: {questions_count.count}")
    print(f"Topics:    {topics_count.count}")
    
    print("\n" + "=" * 60)
    print("✅ INGESTION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
