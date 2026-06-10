import sys
import os
import asyncio
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from app.database import get_admin_db
from app.scrapers.colleges.mlrit_r22_crawler import crawl_r22_22
from app.scrapers.colleges.mlrit_r22 import R22_SUBJECTS

async def main():
    print("Running crawler...")
    db = get_admin_db()
    
    # Get MLRIT college_id
    college = db.table("colleges").select("id").eq("short_name", "MLRIT").single().execute()
    if not college.data:
        print("MLRIT not found in colleges table.")
        return
        
    college_id = college.data["id"]
    print(f"MLRIT College ID: {college_id}")
    
    for subject_code in R22_SUBJECTS.keys():
        print(f"\n--- Crawling subject: {subject_code} ---")
        try:
            summary = await crawl_r22_22(
                subject_code=subject_code,
                college_id=college_id,
                year_from=2021,
                year_to=2025
            )
            print(f"Summary: {summary}")
        except Exception as e:
            print(f"Crawler failed for {subject_code}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
