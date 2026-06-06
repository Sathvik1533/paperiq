#!/usr/bin/env python3
"""
Syllabus Ingestion - R22 CSE MLRIT
Parses syllabus PDF and extracts Units + Topics for all 10 verified subjects
"""
import os
import sys
import re
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
import fitz  # PyMuPDF

load_dotenv()

# Verified R22 subjects
VERIFIED_SUBJECTS = {
    # 2-1
    "A6IT02": "Object Oriented Programming through Java",
    "A6CS28": "Digital Electronics and Computer Organization",
    "A6CS05": "Data Structures",
    "A6CS07": "Software Engineering",
    "A6BS03": "Computer Oriented Statistical Methods",
    # 2-2
    "A6HS08": "Business Economics and Financial Analysis",
    "A6CS08": "Discrete Mathematics",
    "A6CS13": "Software Testing Fundamentals",
    "A6CS09": "Database Management Systems",
    "A6CS11": "Operating System",
}


def extract_text_from_pdf(pdf_path):
    """Extract text from PDF maintaining structure"""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def parse_syllabus(text):
    """
    Parse syllabus text and extract subject → units → topics
    Returns: {subject_code: {units: {unit_name: [topics]}}}
    """
    syllabus_data = {}
    
    # Split text into pages/sections by looking for subject codes
    # Pattern: Subject appears with code, then units follow
    
    lines = text.split('\n')
    current_subject = None
    current_unit = None
    current_unit_content = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Check for verified subject code in line
        subject_match = None
        for code in VERIFIED_SUBJECTS.keys():
            if code in line:
                subject_match = code
                break
        
        if subject_match:
            # Save previous unit if exists
            if current_subject and current_unit and current_unit_content:
                if current_subject not in syllabus_data:
                    syllabus_data[current_subject] = {}
                # Clean and filter topics
                topics = [t.strip() for t in current_unit_content if t.strip() and len(t.strip()) > 15]
                syllabus_data[current_subject][current_unit] = topics[:20]  # Limit per unit
            
            current_subject = subject_match
            current_unit = None
            current_unit_content = []
            continue
        
        # Check for UNIT header
        unit_match = re.match(r'^UNIT\s*[-–]\s*([IVXLCDM]+)\s*(.*)', line, re.IGNORECASE)
        if unit_match and current_subject:
            # Save previous unit
            if current_unit and current_unit_content:
                if current_subject not in syllabus_data:
                    syllabus_data[current_subject] = {}
                topics = [t.strip() for t in current_unit_content if t.strip() and len(t.strip()) > 15]
                syllabus_data[current_subject][current_unit] = topics[:20]
            
            unit_num = unit_match.group(1)
            unit_title = unit_match.group(2).strip()
            current_unit = f"Unit {unit_num}"
            if unit_title:
                current_unit += f": {unit_title}"
            current_unit_content = []
            continue
        
        # Collect content under current unit
        if current_subject and current_unit:
            # Skip noise
            if re.match(r'^\d+$', line):  # page number
                continue
            if 'MLRIT' in line or 'MLR Institute' in line:
                continue
            if 'COURSE OBJECTIVES' in line or 'COURSE OUTCOMES' in line:
                continue
            if 'CLASSES:' in line:
                continue
            if len(line) < 10:
                continue
            if line.startswith('P a g e'):
                continue
            
            # Add valid content
            if line and not line.isupper() or len(line) > 30:  # Avoid headers
                current_unit_content.append(line)
    
    # Save last unit
    if current_subject and current_unit and current_unit_content:
        if current_subject not in syllabus_data:
            syllabus_data[current_subject] = {}
        topics = [t.strip() for t in current_unit_content if t.strip() and len(t.strip()) > 15]
        syllabus_data[current_subject][current_unit] = topics[:20]
    
    return syllabus_data


def create_tables_if_needed(supabase):
    """Create syllabus_units and syllabus_topics tables if they don't exist"""
    print("📋 Checking/creating tables...")
    
    # Try to query tables - if they don't exist, we'll create them manually
    try:
        supabase.table("syllabus_units").select("id").limit(1).execute()
        print("  ✅ syllabus_units table exists")
    except:
        print("  ⚠️  syllabus_units table needs to be created via Supabase dashboard")
    
    try:
        supabase.table("syllabus_topics").select("id").limit(1).execute()
        print("  ✅ syllabus_topics table exists")
    except:
        print("  ⚠️  syllabus_topics table needs to be created via Supabase dashboard")
    
    print()


def store_syllabus_data(supabase, syllabus_data):
    """Store parsed syllabus data in database"""
    # Get subject IDs
    subjects = supabase.table("subjects").select("id, code").eq("regulation", "R22").execute()
    subject_map = {s['code']: s['id'] for s in subjects.data}
    
    stats = {
        'subjects_processed': 0,
        'units_created': 0,
        'topics_created': 0,
    }
    
    for subject_code, units in syllabus_data.items():
        if subject_code not in subject_map:
            print(f"  ⚠️  {subject_code} not found in database")
            continue
        
        subject_id = subject_map[subject_code]
        subject_name = VERIFIED_SUBJECTS[subject_code]
        
        print(f"\n{subject_code} - {subject_name}")
        print("-" * 80)
        
        for unit_name, topics in units.items():
            # Create or get unit
            try:
                unit_result = supabase.table("syllabus_units").insert({
                    "subject_id": subject_id,
                    "unit_name": unit_name,
                }).execute()
                unit_id = unit_result.data[0]['id']
                stats['units_created'] += 1
            except:
                # Unit exists, fetch it
                existing = supabase.table("syllabus_units").select("id").eq("subject_id", subject_id).eq("unit_name", unit_name).execute()
                if existing.data:
                    unit_id = existing.data[0]['id']
                else:
                    print(f"    ❌ Failed to create unit: {unit_name}")
                    continue
            
            print(f"  {unit_name}")
            
            # Create topics
            for topic in topics[:10]:  # Limit display
                try:
                    supabase.table("syllabus_topics").insert({
                        "unit_id": unit_id,
                        "topic_name": topic,
                    }).execute()
                    stats['topics_created'] += 1
                    print(f"    • {topic[:70]}")
                except:
                    pass  # Topic might already exist
            
            if len(topics) > 10:
                print(f"    ... and {len(topics) - 10} more topics")
        
        stats['subjects_processed'] += 1
    
    return stats


def main():
    pdf_path = "/tmp/mlrit_r22_syllabus.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF not found: {pdf_path}")
        print("Download it first using:")
        print('  curl -sL "https://files.mlrit.ac.in/curriculum/133-links/B.Tech-(CSE)MLR22-SYLLABUS.pdf" -o /tmp/mlrit_r22_syllabus.pdf')
        return
    
    print("=" * 80)
    print("SYLLABUS INGESTION - R22 CSE MLRIT")
    print("=" * 80)
    print()
    
    # Extract text
    print("📖 Extracting text from PDF...")
    text = extract_text_from_pdf(pdf_path)
    print(f"✅ Extracted {len(text)} characters")
    print()
    
    # Parse syllabus
    print("🔍 Parsing syllabus structure...")
    syllabus_data = parse_syllabus(text)
    print(f"✅ Found {len(syllabus_data)} subjects with units")
    print()
    
    # Connect to database
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    # Check tables
    create_tables_if_needed(supabase)
    
    # Store data
    print("💾 Storing syllabus data...")
    stats = store_syllabus_data(supabase, syllabus_data)
    
    print()
    print("=" * 80)
    print("✅ SYLLABUS INGESTION COMPLETE")
    print("=" * 80)
    print(f"  Subjects processed: {stats['subjects_processed']}")
    print(f"  Units created: {stats['units_created']}")
    print(f"  Topics created: {stats['topics_created']}")
    print("=" * 80)


if __name__ == "__main__":
    main()
