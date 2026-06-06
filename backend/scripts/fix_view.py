#!/usr/bin/env python3
"""
Directly execute SQL migration to fix v_questions_regulated view.
Uses psycopg2 to connect to Supabase Postgres directly.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Get Supabase database URL
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Extract database connection details from Supabase URL
# Format: https://xxxxx.supabase.co -> pooler.supabase.com
project_ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")

# Supabase connection string format
# You need to get this from Supabase Dashboard -> Project Settings -> Database
# Format: postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

print("=" * 60)
print("VIEW FIX SCRIPT")
print("=" * 60)
print()
print("This script needs direct Postgres access to run DDL.")
print()
print("MANUAL STEPS REQUIRED:")
print()
print("1. Open Supabase Dashboard: https://supabase.com/dashboard")
print("2. Select your project")
print("3. Go to: SQL Editor (left sidebar)")
print("4. Click: New Query")
print("5. Paste this SQL:")
print()
print("-" * 60)

sql = """
DROP VIEW IF EXISTS v_questions_regulated CASCADE;

CREATE OR REPLACE VIEW v_questions_regulated AS
SELECT
  q.*,
  p.regulation      AS paper_regulation,
  p.exam_year       AS paper_exam_year,
  p.exam_type       AS paper_exam_type,
  p.exam_month      AS paper_exam_month,
  p.exam_category   AS exam_category,
  p.college_id      AS paper_college_id,
  p.branch_id       AS paper_branch_id,
  p.semester        AS paper_semester,
  s.regulation      AS subject_regulation,
  s.code            AS subject_code,
  s.name            AS subject_name
FROM questions q
JOIN papers   p ON p.id = q.paper_id
JOIN subjects s ON s.id = q.subject_id;

COMMENT ON VIEW v_questions_regulated IS
  'Use for all analysis queries. Always add WHERE paper_regulation = $1 to prevent cross-regulation analysis.';
"""

print(sql)
print("-" * 60)
print()
print("6. Click: Run (or press Cmd+Enter)")
print("7. Verify: 'Success. No rows returned'")
print("8. Return to terminal and press Enter to verify")
print()
input("Press Enter after running the SQL in Supabase Dashboard...")

# Verify view was created
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

try:
    result = supabase.table("v_questions_regulated").select("*").limit(1).execute()
    print()
    print("✅ View verified successfully!")
    print(f"✅ View has {len(result.data[0].keys()) if result.data else 0} columns")
    if result.data:
        cols = list(result.data[0].keys())
        print(f"✅ Columns: {', '.join(cols[:10])}...")
        if 'exam_category' in cols:
            print("✅ exam_category column FOUND in view")
        else:
            print("❌ exam_category column NOT FOUND - migration failed")
except Exception as e:
    print(f"❌ View verification failed: {e}")
