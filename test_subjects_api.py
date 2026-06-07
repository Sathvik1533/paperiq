#!/usr/bin/env python3
"""
Test what the Supabase API returns for subjects - simulating frontend call
"""
import sys
sys.path.insert(0, '/Users/k.sathvik/paperiq/backend')

from app.database import get_db

db = get_db()

print("=" * 80)
print("SIMULATING FRONTEND getSubjectsForSemester() CALL")
print("=" * 80)

# Test Semester 1
print("\n🔍 Testing: Semester 1, R22")
print("-" * 80)
result1 = db.table('subjects').select('*').eq('semester', 1).eq('regulation', 'R22').order('code', desc=False).execute()
print(f"Query returned: {len(result1.data)} subjects\n")
for i, sub in enumerate(result1.data, 1):
    print(f"{i}. {sub['code']:8s} - {sub['name']}")

# Test Semester 2
print("\n🔍 Testing: Semester 2, R22")
print("-" * 80)
result2 = db.table('subjects').select('*').eq('semester', 2).eq('regulation', 'R22').order('code', desc=False).execute()
print(f"Query returned: {len(result2.data)} subjects\n")
for i, sub in enumerate(result2.data, 1):
    print(f"{i}. {sub['code']:8s} - {sub['name']}")

print("\n" + "=" * 80)
print("CONCLUSION:")
if len(result1.data) == 5 and len(result2.data) == 5:
    print("✅ API returns all 5 subjects for both semesters")
    print("✅ The issue must be in the frontend display/state logic")
else:
    print(f"⚠️  Sem 1: Expected 5, got {len(result1.data)}")
    print(f"⚠️  Sem 2: Expected 5, got {len(result2.data)}")
print("=" * 80)
