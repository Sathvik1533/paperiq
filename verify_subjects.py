#!/usr/bin/env python3
"""
Verify subjects API returns all 5 subjects for Semester 1 and Semester 2
"""
import sys
sys.path.insert(0, '/Users/k.sathvik/paperiq/backend')

from app.database import get_db

db = get_db()

print("=" * 80)
print("VERIFYING R22 SUBJECTS IN DATABASE")
print("=" * 80)

# Semester 1
print("\n📚 SEMESTER 1 - R22")
print("-" * 80)
result1 = db.table('subjects').select('id, code, name').eq('regulation', 'R22').eq('semester', 1).order('code').execute()
print(f"Found {len(result1.data)} subjects:")
for i, subject in enumerate(result1.data, 1):
    print(f"  {i}. {subject['code']:8s} - {subject['name']}")
    print(f"     ID: {subject['id']}")

# Semester 2  
print("\n📚 SEMESTER 2 - R22")
print("-" * 80)
result2 = db.table('subjects').select('id, code, name').eq('regulation', 'R22').eq('semester', 2).order('code').execute()
print(f"Found {len(result2.data)} subjects:")
for i, subject in enumerate(result2.data, 1):
    print(f"  {i}. {subject['code']:8s} - {subject['name']}")
    print(f"     ID: {subject['id']}")

print("\n" + "=" * 80)
print(f"TOTAL: {len(result1.data)} subjects in Sem 1, {len(result2.data)} subjects in Sem 2")
print("=" * 80)

# Check if any subjects are missing papers
print("\n🔍 CHECKING PAPER COVERAGE")
print("-" * 80)
for sem_num, subjects in [(1, result1.data), (2, result2.data)]:
    print(f"\nSemester {sem_num}:")
    for subject in subjects:
        papers = db.table('papers').select('id').eq('subject_id', subject['id']).execute()
        print(f"  {subject['code']:8s}: {len(papers.data):2d} papers")
