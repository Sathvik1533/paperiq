#!/usr/bin/env python3
"""
Fix Zero Questions Issue
Diagnoses and fixes papers showing 0 questions
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
from app.extractors.extractor_factory import extract
from app.parsers.question_parser import QuestionParser

load_dotenv()

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 80)
    print("ZERO QUESTIONS DIAGNOSTIC & FIX")
    print("=" * 80)
    print()
    
    # STEP 1: Get all papers
    print("STEP 1: Fetching all papers from database...")
    papers = supabase.table("papers").select("id, title, file_name, exam_year, subject_id, storage_path, original_url, extraction_status, raw_text").order("exam_year", desc=True).execute()
    
    total_papers = len(papers.data)
    print(f"✅ Found {total_papers} papers")
    print()
    
    # STEP 2: Check how many have questions
    print("STEP 2: Checking which papers have questions...")
    papers_with_questions = 0
    papers_without_questions = []
    
    for paper in papers.data:
        questions = supabase.table("questions").select("id", count="exact").eq("paper_id", paper['id']).execute()
        q_count = questions.count or 0
        
        if q_count > 0:
            papers_with_questions += 1
        else:
            papers_without_questions.append(paper)
    
    print(f"✅ Papers WITH questions: {papers_with_questions}")
    print(f"❌ Papers WITHOUT questions: {len(papers_without_questions)}")
    print()
    
    # STEP 3: Analyze why papers have no questions
    print("STEP 3: Analyzing papers without questions...")
    
    no_raw_text = [p for p in papers_without_questions if not p.get('raw_text')]
    has_raw_text = [p for p in papers_without_questions if p.get('raw_text')]
    
    print(f"  Papers missing raw_text (need extraction): {len(no_raw_text)}")
    print(f"  Papers with raw_text (need parsing): {len(has_raw_text)}")
    print()
    
    # Show samples
    if no_raw_text:
        print("  Sample papers without raw_text:")
        for p in no_raw_text[:5]:
            print(f"    - {p.get('title', 'Untitled')} (ID: {p['id'][:8]}...)")
            print(f"      storage_path: {p.get('storage_path', 'MISSING')}")
            print(f"      original_url: {p.get('original_url', 'MISSING')}")
            print(f"      extraction_status: {p.get('extraction_status', 'MISSING')}")
    print()
    
    if has_raw_text:
        print("  Sample papers with raw_text but no questions:")
        for p in has_raw_text[:5]:
            text_preview = p['raw_text'][:100] if p['raw_text'] else ''
            print(f"    - {p.get('title', 'Untitled')} (ID: {p['id'][:8]}...)")
            print(f"      raw_text preview: {text_preview}...")
    print()
    
    # STEP 4: Offer to parse papers that have raw_text
    if has_raw_text:
        print("=" * 80)
        print(f"STEP 4: Can parse {len(has_raw_text)} papers that have raw_text")
        print("=" * 80)
        
        response = input(f"\nParse {len(has_raw_text)} papers now? (y/n): ")
        
        if response.lower() == 'y':
            parser = QuestionParser()
            parsed_count = 0
            failed_count = 0
            
            print("\nParsing papers...")
            for idx, paper in enumerate(has_raw_text, 1):
                print(f"[{idx}/{len(has_raw_text)}] {paper.get('title', 'Untitled')[:50]}...", end=" ")
                
                try:
                    # Parse questions
                    result = parser.parse(paper['raw_text'], paper['id'], paper.get('subject_id'))
                    
                    if result.questions:
                        # Insert questions
                        for q in result.questions:
                            try:
                                supabase.table("questions").insert(q).execute()
                            except Exception as e:
                                if "duplicate" not in str(e).lower():
                                    print(f"\n  ⚠️ Failed to insert question: {e}")
                        
                        # Update paper parsed_at
                        supabase.table("papers").update({
                            "extraction_status": "completed",
                            "extracted_at": "now()"
                        }).eq("id", paper['id']).execute()
                        
                        print(f"✅ {len(result.questions)} questions")
                        parsed_count += 1
                    else:
                        print("⚠️  No questions found")
                        failed_count += 1
                
                except Exception as e:
                    print(f"❌ Error: {str(e)[:50]}")
                    failed_count += 1
            
            print()
            print(f"✅ Successfully parsed: {parsed_count}")
            print(f"❌ Failed to parse: {failed_count}")
    
    # STEP 5: Papers without raw_text need extraction
    if no_raw_text:
        print()
        print("=" * 80)
        print("STEP 5: Papers without raw_text need extraction")
        print("=" * 80)
        print()
        print(f"{len(no_raw_text)} papers need file extraction")
        print()
        print("These papers need:")
        print("  1. storage_path populated (upload files to Supabase Storage)")
        print("  2. OR original_url populated (download from college website)")
        print("  3. Then run extraction to get raw_text")
        print()
        print("Solutions:")
        print("  A. Upload DOCX files to Supabase Storage and update storage_path")
        print("  B. Run link_college_documents.py to set original_url")
        print("  C. Run extraction pipeline to get raw_text")
    
    # FINAL SUMMARY
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    # Re-check after parsing
    papers_with_q = supabase.table("questions").select("paper_id", count="exact").execute()
    unique_papers_with_q = len(set(q['paper_id'] for q in papers_with_q.data))
    
    print(f"Total papers: {total_papers}")
    print(f"Papers with questions: {unique_papers_with_q}")
    print(f"Papers still without questions: {total_papers - unique_papers_with_q}")
    print()
    
    if total_papers - unique_papers_with_q > 0:
        print("Next steps:")
        print("  1. Run: python3 scripts/link_college_documents.py")
        print("  2. Verify files exist at generated URLs")
        print("  3. Run extraction pipeline")
        print("  4. Run this script again to parse")
    else:
        print("✅ All papers have questions!")
    
    print("=" * 80)

if __name__ == "__main__":
    main()
