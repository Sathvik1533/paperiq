#!/usr/bin/env python3
"""
Add classification columns to questions table via Supabase SQL execution
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

def add_classification_columns():
    """Add classification columns using Supabase RPC"""
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    try:
        print("Adding classification columns to questions table...")
        
        # Execute SQL via Supabase RPC
        sql = """
        ALTER TABLE questions 
        ADD COLUMN IF NOT EXISTS topic_name TEXT,
        ADD COLUMN IF NOT EXISTS unit_name TEXT,
        ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);
        
        CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);
        CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);
        """
        
        result = supabase.rpc("exec_sql", {"query": sql}).execute()
        
        print("✅ SQL executed successfully")
        
        # Verify by trying to update a question with the new columns
        test_q = supabase.table("questions").select("id").limit(1).execute()
        if test_q.data:
            test_id = test_q.data[0]['id']
            supabase.table("questions").update({
                "topic_name": "TEST",
                "unit_name": "TEST_UNIT",
                "classification_confidence": 0.85
            }).eq("id", test_id).execute()
            print("✅ Columns verified - test update successful")
            
            # Clear test data
            supabase.table("questions").update({
                "topic_name": None,
                "unit_name": None,
                "classification_confidence": None
            }).eq("id", test_id).execute()
            print("✅ Test data cleared")
            return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTrying alternative approach - direct ALTER TABLE via raw SQL...")
        return False

if __name__ == "__main__":
    success = add_classification_columns()
    
    if not success:
        print("\n" + "="*80)
        print("MANUAL MIGRATION REQUIRED")
        print("="*80)
        print("\nGo to Supabase Dashboard → SQL Editor and run:")
        print("\nALTER TABLE questions")
        print("ADD COLUMN IF NOT EXISTS topic_name TEXT,")
        print("ADD COLUMN IF NOT EXISTS unit_name TEXT,")
        print("ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);")
        print("\nCREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);")
        print("CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);")
        print("\nThen run: python3 scripts/complete_topic_pipeline.py")
    else:
        print("\n✅ Ready to run classification pipeline")
        print("Run: python3 scripts/complete_topic_pipeline.py")
    
    sys.exit(0 if success else 1)
