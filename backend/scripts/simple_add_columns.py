#!/usr/bin/env python3
"""
Simple approach: Modify syllabus_topics table to include subject_id directly
Then add classification columns to questions table
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("Checking syllabus_topics table structure...")
    
    # First, check if syllabus_topics already has subject_id
    try:
        result = supabase.table("syllabus_topics").select("subject_id").limit(1).execute()
        print("✅ syllabus_topics.subject_id column exists")
    except Exception as e:
        print(f"⚠️  syllabus_topics.subject_id column missing: {e}")
        print("\nManual SQL needed in Supabase Dashboard:")
        print("ALTER TABLE syllabus_topics ADD COLUMN IF NOT EXISTS subject_id UUID;")
        print("CREATE INDEX IF NOT EXISTS idx_syllabus_topics_subject ON syllabus_topics(subject_id);")
        return False
    
    # Now check questions table
    print("\nChecking questions table classification columns...")
    
    try:
        result = supabase.table("questions").select("topic_name, unit_name, classification_confidence").limit(1).execute()
        print("✅ All classification columns exist in questions table")
        print("\n✅ Ready to run classification pipeline")
        print("Run: python3 scripts/complete_topic_pipeline.py")
        return True
    except Exception as e:
        error_msg = str(e)
        missing_cols = []
        
        if 'topic_name' in error_msg:
            missing_cols.append('topic_name')
        if 'unit_name' in error_msg:
            missing_cols.append('unit_name')
        if 'classification_confidence' in error_msg:
            missing_cols.append('classification_confidence')
        
        if missing_cols:
            print(f"⚠️  Missing columns: {', '.join(missing_cols)}")
            print("\n" + "="*80)
            print("MANUAL SQL REQUIRED - Run in Supabase Dashboard → SQL Editor:")
            print("="*80)
            print("\nALTER TABLE questions")
            print("ADD COLUMN IF NOT EXISTS topic_name TEXT,")
            print("ADD COLUMN IF NOT EXISTS unit_name TEXT,")
            print("ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);")
            print("\nCREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);")
            print("CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);")
            print("\nAfter running SQL, execute: python3 scripts/complete_topic_pipeline.py")
            return False
        else:
            print(f"❌ Unexpected error: {e}")
            return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
