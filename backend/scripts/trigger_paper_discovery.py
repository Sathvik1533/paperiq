#!/usr/bin/env python3
"""
Manually trigger paper discovery for R22
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_db
from app.scrapers.colleges.mlrit import MLRITScraper
from app.logger import get_logger

log = get_logger(__name__)

async def main():
    print("=" * 60)
    print("PAPER DISCOVERY TEST")
    print("=" * 60)
    print()
    
    # Get college and branch IDs
    db = get_db()
    college = db.table("colleges").select("id").eq("name", "MLR Institute of Technology").single().execute()
    if not college.data:
        print("✗ MLRIT college not found in database")
        return
    
    college_id = college.data["id"]
    print(f"✓ College ID: {college_id}")
    
    branch = db.table("branches").select("id").eq("name", "Computer Science Engineering").eq("college_id", college_id).single().execute()
    if not branch.data:
        print("✗ CSE branch not found")
        return
    
    branch_id = branch.data["id"]
    print(f"✓ Branch ID: {branch_id}")
    print()
    
    # Discover papers
    print("Discovering papers from MLRIT portal...")
    print("URL: https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html")
    print()
    
    scraper = MLRITScraper()
    
    papers = await scraper.list_papers(
        btech_year=2,
        year_from=2021,
        year_to=2025
    )
    
    print(f"✓ Total archives discovered: {len(papers)}")
    print()
    
    # Group by exam type
    regular = [p for p in papers if p.exam_type == "Regular"]
    suppl = [p for p in papers if p.exam_type == "Supplementary"]
    
    print(f"Regular exams: {len(regular)}")
    print(f"Supplementary exams: {len(suppl)}")
    print()
    
    # Group by exam category
    mid1 = [p for p in papers if p.exam_category == "Mid-1"]
    mid2 = [p for p in papers if p.exam_category == "Mid-2"]
    semester = [p for p in papers if p.exam_category == "Semester"]
    
    print(f"Mid-1: {len(mid1)}")
    print(f"Mid-2: {len(mid2)}")
    print(f"Semester: {len(semester)}")
    print()
    
    # Years
    years = sorted(set(p.exam_year for p in papers))
    print(f"Academic years: {years}")
    print()
    
    # Sample papers
    print("Sample discovered papers:")
    for p in papers[:10]:
        print(f"  • {p.label} - {p.exam_category} {p.exam_type} ({p.exam_year})")
    
    print()
    print("=" * 60)
    print(f"DISCOVERY COMPLETE: {len(papers)} archives found")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
