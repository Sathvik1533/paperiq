#!/usr/bin/env python3
"""
Add classification columns to questions table using direct psycopg2
Bypasses Supabase client singleton caching issues
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

def get_direct_connection():
    """Get direct psycopg2 connection"""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not set")
    return psycopg2.connect(db_url)

def add_classification_columns():
    """Add classification columns to questions table"""
    conn = get_direct_connection()
    cur = conn.cursor()
    
    try:
        print("Adding classification columns to questions table...")
        
        # Add columns
        sql = """
        ALTER TABLE questions 
        ADD COLUMN IF NOT EXISTS topic_name TEXT,
        ADD COLUMN IF NOT EXISTS unit_name TEXT,
        ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);
        
        CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);
        CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);
        """
        
        cur.execute(sql)
        conn.commit()
        
        print("✅ Columns added successfully")
        
        # Verify columns exist
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'questions' 
            AND column_name IN ('topic_name', 'unit_name', 'classification_confidence')
            ORDER BY column_name
        """)
        
        columns = cur.fetchall()
        print(f"\nVerified columns in questions table:")
        for col_name, col_type in columns:
            print(f"  ✓ {col_name} ({col_type})")
        
        if len(columns) == 3:
            print("\n✅ All classification columns are ready")
            return True
        else:
            print(f"\n⚠️  Only {len(columns)}/3 columns found")
            return False
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        return False
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    success = add_classification_columns()
    sys.exit(0 if success else 1)
