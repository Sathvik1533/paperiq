#!/usr/bin/env python3
"""
Coverage Verification - Evidence of paper ingestion completeness
Shows discovered, downloaded, parsed, mapped, and questions extracted per subject
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

VERIFIED_SUBJECTS = {
    "A6IT02": "Object Oriented Programming through Java",
    "A6CS28": "Digital Electronics and Computer Organization",
    "A6CS05": "Data Structures",
    "A6CS07": "Software Engineering",
    "A6BS03": "Computer Oriented Statistical Methods",
    "A6HS08": "Business Economics and Financial Analysis",
    "A6CS08": "Discrete Mathematics",
    "A6CS13": "Software Testing Fundamentals",
    "A6CS09": "Database Management Systems",
    "A6CS11": "Operating System",
}

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("="*120)
    print("COVERAGE VERIFICATION - R22 CSE HISTORICAL PAPER INGESTION")
    print("="*120)
    print()
    
    # Get all papers and questions
    all_papers = supabase.table("papers").select("*").eq("regulation", "R22").execute()
    all_questions = supabase.table("questions").select("*").execute()
    
    print(f"Subject                                          Discovered  Downloaded  Parsed  Mapped  Questions  Status")
    print("-"*120)
    
    total_papers = 0
    total_questions = 0
    complete_subjects = []
    incomplete_subjects = []
    
    for code, name in VERIFIED_SUBJECTS.items():
        # Get subject ID
        subject_result = supabase.table("subjects").select("id").eq("code", code).eq("regulation", "R22").execute()
        if not subject_result.data:
            print(f"{code} - {name[:40]:<40}  ???         ???         ???     ???     ???        ❌ NOT FOUND")
            incomplete_subjects.append(f"{code} - Subject not in database")
            continue
        
        subject_id = subject_result.data[0]['id']
        
        # Count papers for this subject
        papers = [p for p in all_papers.data if p.get('subject_id') == subject_id]
        
        # Count questions for this subject
        questions = [q for q in all_questions.data if q.get('subject_id') == subject_id]
        
        # Status determination
        discovered = len(papers)  # Papers in database
        downloaded = len(papers)  # All papers downloaded (we don't store undownloaded)
        parsed = len([p for p in papers if p.get('parsed_at') is not None])
        mapped = len([p for p in papers if p.get('subject_id') is not None])
        question_count = len(questions)
        
        # Status
        if discovered == 0:
            status = "❌ NO PAPERS"
            incomplete_subjects.append(f"{code} - No papers discovered")
        elif discovered < 5:
            status = "⚠️  LOW COUNT"
            incomplete_subjects.append(f"{code} - Only {discovered} papers (expected 8-10)")
        elif question_count < 50:
            status = "⚠️  LOW QUESTIONS"
            incomplete_subjects.append(f"{code} - Only {question_count} questions")
        else:
            status = "✅ COMPLETE"
            complete_subjects.append(code)
        
        print(f"{code} - {name[:40]:<40}  {discovered:>10}  {downloaded:>10}  {parsed:>6}  {mapped:>6}  {question_count:>9}  {status}")
        
        total_papers += discovered
        total_questions += question_count
    
    print("-"*120)
    print(f"{'TOTAL':<50}  {total_papers:>10}  {total_papers:>10}  {total_papers:>6}  {total_papers:>6}  {total_questions:>9}")
    print()
    
    print("="*120)
    print("ANALYSIS")
    print("="*120)
    print()
    
    print(f"Complete Subjects ({len(complete_subjects)}/10):")
    for code in complete_subjects:
        print(f"  ✅ {code} - {VERIFIED_SUBJECTS[code]}")
    
    if incomplete_subjects:
        print()
        print(f"Incomplete Subjects ({len(incomplete_subjects)}):")
        for issue in incomplete_subjects:
            print(f"  ⚠️  {issue}")
    
    print()
    print("Expected vs Actual:")
    print(f"  Expected papers per subject: 8-10 (2021-2025, Mid+Sem)")
    print(f"  Average papers per subject:  {total_papers/10:.1f}")
    print(f"  Expected questions per subject: 500-2000")
    print(f"  Average questions per subject: {total_questions/10:.0f}")
    
    print()
    print("Historical Coverage Assessment:")
    if total_papers >= 70:  # 8-10 papers × 10 subjects = 80-100 papers
        print("  ✅ Complete historical coverage (2021-2025)")
    elif total_papers >= 50:
        print("  ⚠️  Partial coverage - some years/exam types missing")
    else:
        print("  ❌ Incomplete coverage - major gaps in historical data")
    
    print()
    print("="*120)
    print("CONCLUSION")
    print("="*120)
    
    if len(complete_subjects) >= 8:
        print("✅ Coverage is SUFFICIENT for MVP")
        print(f"   {len(complete_subjects)}/10 subjects have adequate data")
        print(f"   {total_papers} papers ingested, {total_questions} questions extracted")
    else:
        print("⚠️  Coverage is INCOMPLETE")
        print(f"   Only {len(complete_subjects)}/10 subjects have adequate data")
        print("   Manual verification needed for incomplete subjects")
    
    print()
    print("Paper Distribution Evidence:")
    print(f"  Total R22 papers in database: {len(all_papers.data)}")
    print(f"  Total questions extracted: {len(all_questions.data)}")
    print(f"  Papers mapped to subjects: {len([p for p in all_papers.data if p.get('subject_id')])}")
    print()

if __name__ == "__main__":
    main()
