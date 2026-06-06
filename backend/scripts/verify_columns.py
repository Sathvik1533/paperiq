#!/usr/bin/env python3
"""
Verify that classification columns exist in questions table
Run this after applying the SQL migration
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("="*80)
    print("VERIFYING CLASSIFICATION COLUMNS")
    print("="*80)
    print()
    
    # Try to select the columns
    try:
        result = supabase.table("questions").select("id, topic_name, unit_name, classification_confidence").limit(1).execute()
        
        print("✅ All classification columns exist:")
        print("   - topic_name")
        print("   - unit_name")
        print("   - classification_confidence")
        print()
        print("="*80)
        print("✅ READY TO RUN CLASSIFICATION PIPELINE")
        print("="*80)
        print()
        print("Next command:")
        print("  python3 scripts/complete_topic_pipeline.py")
        print()
        return True
        
    except Exception as e:
        error_msg = str(e)
        print("❌ Missing columns detected")
        print()
        print(f"Error: {error_msg}")
        print()
        print("="*80)
        print("ACTION REQUIRED: Apply SQL Migration")
        print("="*80)
        print()
        print("Run this SQL in Supabase Dashboard:")
        print()
        print("ALTER TABLE questions")
        print("ADD COLUMN IF NOT EXISTS topic_name TEXT,")
        print("ADD COLUMN IF NOT EXISTS unit_name TEXT,")
        print("ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);")
        print()
        print("CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);")
        print("CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);")
        print()
        print("Then run this script again to verify.")
        print()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
