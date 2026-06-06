#!/usr/bin/env python3
"""
Simple Knowledge Base Test — Direct API Test
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_db

def main():
    print("=" * 60)
    print("DATABASE VERIFICATION")
    print("=" * 60)
    print()
    
    db = get_db()
    
    # Check subjects
    print("1. SUBJECTS CHECK")
    subjects = db.table("subjects").select("id, code, name, semester, regulation").eq("regulation", "R22").execute()
    print(f"   Total R22 subjects: {len(subjects.data)}")
    if subjects.data:
        print("   Sample subjects:")
        for s in subjects.data[:5]:
            print(f"     • {s['code']}: {s['name']} (Sem {s['semester']})")
    print()
    
    # Check papers
    print("2. PAPERS CHECK")
    papers = db.table("papers").select("id, title, exam_year, exam_type, exam_category, regulation").eq("regulation", "R22").execute()
    print(f"   Total R22 papers: {len(papers.data)}")
    if papers.data:
        regular = [p for p in papers.data if p.get('exam_type') == 'Regular']
        suppl = [p for p in papers.data if p.get('exam_type') == 'Supplementary']
        print(f"   Regular papers: {len(regular)}")
        print(f"   Supplementary papers: {len(suppl)}")
        
        # Exam categories
        mid1 = [p for p in papers.data if p.get('exam_category') == 'Mid-1']
        mid2 = [p for p in papers.data if p.get('exam_category') == 'Mid-2']
        sem = [p for p in papers.data if p.get('exam_category') == 'Semester']
        print(f"   Mid-1: {len(mid1)}, Mid-2: {len(mid2)}, Semester: {len(sem)}")
        
        # Years covered
        years = set(p.get('exam_year') for p in papers.data if p.get('exam_year'))
        print(f"   Academic years covered: {sorted(years)}")
        
        print("   Sample papers:")
        for p in papers.data[:3]:
            print(f"     • {p['title']} ({p.get('exam_year')}) - {p.get('exam_type')}")
    print()
    
    # Check questions
    print("3. QUESTIONS CHECK")
    questions = db.table("questions").select("id, question_text, marks").execute()
    print(f"   Total questions: {len(questions.data)}")
    if questions.data:
        print("   Sample questions:")
        for q in questions.data[:3]:
            text = q['question_text'][:60] + "..." if len(q['question_text']) > 60 else q['question_text']
            print(f"     • {text} ({q.get('marks')} marks)")
    print()
    
    # Check topics
    print("4. SYLLABUS TOPICS CHECK")
    topics = db.table("syllabus_topics").select("id, topic_name, unit_number, regulation").eq("regulation", "R22").execute()
    print(f"   Total R22 syllabus topics: {len(topics.data)}")
    if topics.data:
        units = set(t.get('unit_number') for t in topics.data if t.get('unit_number'))
        print(f"   Units covered: {sorted(units)}")
        print("   Sample topics:")
        for t in topics.data[:5]:
            print(f"     • Unit {t.get('unit_number')}: {t['topic_name']}")
    print()
    
    print("=" * 60)
    print("STATUS SUMMARY")
    print("=" * 60)
    print(f"✓ Subjects: {len(subjects.data)}")
    print(f"✓ Papers: {len(papers.data)}")
    print(f"✓ Questions: {len(questions.data)}")
    print(f"✓ Topics: {len(topics.data)}")
    print()

if __name__ == "__main__":
    main()
