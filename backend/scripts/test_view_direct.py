#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from app.database import get_db

load_dotenv()
db = get_db()

subject_id = "0c1b6011-5f7d-4d8e-a94c-27427130080d"

print("Testing view query from backend...")
result = db.table("v_questions_regulated").select("*").eq("subject_id", subject_id).eq("paper_regulation", "R22").execute()
print(f"Total rows: {len(result.data)}")

if result.data:
    print(f"\nFirst row columns: {list(result.data[0].keys())[:20]}")
    print(f"exam_category: {result.data[0].get('exam_category')}")
    print(f"exam_type: {result.data[0].get('exam_type')}")

# Now with filters
result2 = db.table("v_questions_regulated").select("*").eq("subject_id", subject_id).eq("paper_regulation", "R22").eq("exam_category", "Unknown").eq("exam_type", "regular").execute()
print(f"\nWith all filters: {len(result2.data)} rows")
