#!/usr/bin/env python3
"""
Fix Storage Bucket 404 Error
Checks Supabase Storage configuration and fixes bucket issues
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("=" * 80)
    print("STORAGE BUCKET DIAGNOSTIC & FIX")
    print("=" * 80)
    print()
    
    # STEP 1: Check if papers bucket exists
    print("STEP 1: Checking if 'papers' bucket exists...")
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        print(f"✅ Found {len(buckets)} buckets:")
        for b in buckets:
            print(f"   - {b.name} (public: {b.public})")
        print()
        
        if 'papers' in bucket_names:
            print("✅ 'papers' bucket EXISTS")
        else:
            print("❌ 'papers' bucket DOES NOT EXIST")
            print()
            print("Creating 'papers' bucket...")
            
            try:
                supabase.storage.create_bucket(
                    'papers',
                    options={'public': True}  # Make bucket public
                )
                print("✅ Created 'papers' bucket successfully!")
            except Exception as e:
                print(f"❌ Failed to create bucket: {e}")
                print()
                print("MANUAL FIX:")
                print("1. Go to Supabase Dashboard → Storage")
                print("2. Click 'New bucket'")
                print("3. Name: papers")
                print("4. Check 'Public bucket'")
                print("5. Click 'Create'")
                return
    
    except Exception as e:
        print(f"❌ Error checking buckets: {e}")
        print()
        print("This might mean:")
        print("  1. SUPABASE_SERVICE_KEY is not set correctly")
        print("  2. Storage API is not enabled")
        print("  3. Network issue")
        return
    
    print()
    
    # STEP 2: Check papers with storage_path
    print("STEP 2: Checking papers with storage_path...")
    papers = supabase.table("papers").select("id, title, storage_path, storage_bucket").not_.is_("storage_path", "null").execute()
    
    print(f"Found {len(papers.data)} papers with storage_path")
    
    if papers.data:
        print()
        print("Sample papers with storage:")
        for p in papers.data[:5]:
            bucket = p.get('storage_bucket') or 'papers'
            path = p.get('storage_path')
            print(f"  - {p.get('title', 'Untitled')[:50]}")
            print(f"    Bucket: {bucket}")
            print(f"    Path: {path}")
            
            # Try to get public URL
            try:
                url_response = supabase.storage.from_(bucket).get_public_url(path)
                print(f"    URL: {url_response}")
            except Exception as e:
                print(f"    ❌ Error getting URL: {e}")
        print()
    
    # STEP 3: Check if files exist in bucket
    if papers.data and 'papers' in bucket_names:
        print("STEP 3: Checking if files actually exist in bucket...")
        
        try:
            files = supabase.storage.from_('papers').list()
            print(f"✅ Found {len(files)} files in 'papers' bucket")
            
            if len(files) == 0:
                print()
                print("⚠️  Bucket exists but is EMPTY!")
                print()
                print("This means:")
                print("  - Files were never uploaded to Supabase Storage")
                print("  - Papers have storage_path but no actual files")
                print()
                print("SOLUTIONS:")
                print("  A. Upload DOCX files to Supabase Storage")
                print("  B. Use original_url instead (download from college website)")
                print("  C. Generate PDFs from questions (fallback)")
            else:
                print()
                print("Sample files in bucket:")
                for f in files[:10]:
                    print(f"   - {f['name']}")
        
        except Exception as e:
            print(f"❌ Error listing files: {e}")
    
    print()
    
    # STEP 4: Fix strategy recommendation
    print("=" * 80)
    print("RECOMMENDED FIX STRATEGY")
    print("=" * 80)
    print()
    
    papers_with_storage = len([p for p in papers.data if p.get('storage_path')])
    
    all_papers = supabase.table("papers").select("id, original_url, storage_path").execute()
    papers_with_original_url = len([p for p in all_papers.data if p.get('original_url')])
    papers_with_questions = supabase.table("questions").select("paper_id", count="exact").execute()
    unique_papers_with_q = len(set(q['paper_id'] for q in papers_with_questions.data))
    
    print(f"Papers with storage_path: {papers_with_storage}")
    print(f"Papers with original_url: {papers_with_original_url}")
    print(f"Papers with questions: {unique_papers_with_q}")
    print()
    
    if papers_with_storage > 0 and 'papers' not in bucket_names:
        print("❌ CRITICAL: Papers reference storage but bucket doesn't exist!")
        print("   → Create 'papers' bucket in Supabase Dashboard")
    
    elif papers_with_storage > 0 and len(files) == 0:
        print("⚠️  WARNING: Bucket exists but no files uploaded")
        print()
        print("OPTION 1: Use original_url instead (RECOMMENDED)")
        print("  1. Run: python3 scripts/link_college_documents.py")
        print("  2. This will set original_url for all papers")
        print("  3. Papers will download from college website directly")
        print()
        print("OPTION 2: Generate PDFs from questions")
        print("  1. Make sure papers have questions (run fix_zero_questions.py)")
        print("  2. Frontend will generate PDF on-the-fly from questions")
        print("  3. No storage needed!")
        print()
        print("OPTION 3: Upload DOCX files to Supabase Storage")
        print("  1. Download files from college website")
        print("  2. Upload to 'papers' bucket in Supabase")
        print("  3. Update storage_path in database")
    
    elif unique_papers_with_q > 0:
        print("✅ GOOD NEWS: Papers have questions extracted!")
        print("   → Frontend can generate PDFs from questions")
        print("   → No storage needed!")
        print()
        print("To fix downloads:")
        print("  1. Make sure PaperView.tsx download function checks for questions")
        print("  2. If questions exist, use /papers/{id}/download endpoint")
        print("  3. This generates PDF from questions (already implemented!)")
    
    else:
        print("❌ No papers have questions yet")
        print("   → Run: python3 scripts/fix_zero_questions.py")
        print("   → Then downloads will work via PDF generation")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
