#!/usr/bin/env python3
"""
Complete Topic Classification Pipeline
1. Ingest syllabus (units + topics) into syllabus_topics table
2. Classify all questions using similarity matching
3. Generate classification report
"""
import os
import sys
import re
from pathlib import Path
from difflib import SequenceMatcher
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
import fitz  # PyMuPDF

load_dotenv()

# Verified R22 subjects
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

def parse_syllabus_from_pdf(pdf_path):
    """Parse syllabus PDF and extract units + topics"""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    
    syllabus_data = {}
    lines = text.split('\n')
    current_subject = None
    current_unit = None
    current_unit_content = []
    
    for line in lines:
        line = line.strip()
        
        # Find subject code
        subject_match = None
        for code in VERIFIED_SUBJECTS.keys():
            if code in line:
                subject_match = code
                break
        
        if subject_match:
            if current_subject and current_unit and current_unit_content:
                if current_subject not in syllabus_data:
                    syllabus_data[current_subject] = {}
                topics = [t.strip() for t in current_unit_content if t.strip() and len(t.strip()) > 15]
                syllabus_data[current_subject][current_unit] = topics[:20]
            
            current_subject = subject_match
            current_unit = None
            current_unit_content = []
            continue
        
        # Find unit
        unit_match = re.match(r'^UNIT\s*[-–]\s*([IVXLCDM]+)\s*(.*)', line, re.IGNORECASE)
        if unit_match and current_subject:
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
        
        # Collect topics
        if current_subject and current_unit:
            if re.match(r'^\d+$', line) or 'MLRIT' in line or 'MLR Institute' in line:
                continue
            if 'COURSE OBJECTIVES' in line or 'COURSE OUTCOMES' in line or 'CLASSES:' in line:
                continue
            if len(line) < 10 or line.startswith('P a g e'):
                continue
            
            if line and (not line.isupper() or len(line) > 30):
                current_unit_content.append(line)
    
    # Save last unit
    if current_subject and current_unit and current_unit_content:
        if current_subject not in syllabus_data:
            syllabus_data[current_subject] = {}
        topics = [t.strip() for t in current_unit_content if t.strip() and len(t.strip()) > 15]
        syllabus_data[current_subject][current_unit] = topics[:20]
    
    return syllabus_data

def ingest_syllabus_data(supabase, syllabus_data):
    """
    Ingest syllabus into syllabus_topics table
    Schema: id, unit_name, topic_name, subject_id (added via ALTER)
    """
    print("="*80)
    print("STEP 1: INGESTING SYLLABUS DATA")
    print("="*80)
    print()
    
    # Get subject IDs
    subjects = supabase.table("subjects").select("id, code").eq("regulation", "R22").execute()
    subject_map = {s['code']: s['id'] for s in subjects.data}
    
    stats = {'units': 0, 'topics': 0}
    
    # Clear existing data first
    try:
        supabase.table("syllabus_topics").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("✅ Cleared existing syllabus data")
    except:
        pass
    
    print()
    for subject_code, units in syllabus_data.items():
        if subject_code not in subject_map:
            continue
        
        subject_id = subject_map[subject_code]
        subject_name = VERIFIED_SUBJECTS[subject_code]
        
        print(f"{subject_code} - {subject_name}")
        
        for unit_name, topics in units.items():
            stats['units'] += 1
            print(f"  {unit_name}: {len(topics)} topics")
            
            for topic in topics:
                try:
                    supabase.table("syllabus_topics").insert({
                        "unit_name": unit_name,
                        "topic_name": topic,
                        "subject_id": subject_id
                    }).execute()
                    stats['topics'] += 1
                except Exception as e:
                    # Skip duplicates
                    pass
    
    print()
    print(f"✅ Ingested {stats['units']} units, {stats['topics']} topics")
    return stats

def extract_keywords(text):
    """Extract keywords from text"""
    stop_words = {
        'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are',
        'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
        'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
        'what', 'which', 'who', 'when', 'where', 'why', 'how', 'explain', 'describe',
        'define', 'write', 'short', 'note', 'notes', 'briefly', 'detail', 'discuss'
    }
    
    words = re.findall(r'\b[a-z]+\b', text.lower())
    keywords = [w for w in words if len(w) > 3 and w not in stop_words]
    return set(keywords)

def keyword_match_score(question_text, topic_name):
    """Keyword-based similarity"""
    q_keywords = extract_keywords(question_text)
    t_keywords = extract_keywords(topic_name)
    
    if not q_keywords or not t_keywords:
        return 0.0
    
    intersection = len(q_keywords & t_keywords)
    union = len(q_keywords | t_keywords)
    
    return intersection / union if union > 0 else 0.0

def classify_questions(supabase):
    """Classify all questions to topics"""
    print()
    print("="*80)
    print("STEP 2: CLASSIFYING QUESTIONS")
    print("="*80)
    print()
    
    # Get all syllabus topics
    all_topics = supabase.table("syllabus_topics").select("*").execute()
    print(f"Loaded {len(all_topics.data)} syllabus topics")
    print()
    
    # Get all subjects
    subjects = supabase.table("subjects").select("id, code, name").eq("regulation", "R22").execute()
    
    stats = {
        'total': 0,
        'classified': 0,
        'unclassified': 0,
        'by_subject': {},
        'examples': []
    }
    
    for subject in subjects.data:
        subject_id = subject['id']
        subject_code = subject['code']
        subject_name = subject['name']
        
        print(f"{subject_code} - {subject_name}")
        print("-"*80)
        
        # Filter topics for this subject
        subject_topics = [
            t for t in all_topics.data
            if t.get('subject_id') == subject_id
        ]
        
        if not subject_topics:
            print(f"  ⚠️  No syllabus topics found - skipping")
            continue
        
        print(f"  Found {len(subject_topics)} syllabus topics for this subject")
        
        # Get all questions for this subject
        questions = supabase.table("questions").select("id, question_text").eq("subject_id", subject_id).execute()
        
        classified = 0
        unclassified = 0
        
        for i, q in enumerate(questions.data):
            question_id = q['id']
            question_text = q['question_text']
            
            # Find best matching topic
            best_match = None
            best_score = 0.0
            
            for topic_data in subject_topics:
                score = keyword_match_score(question_text, topic_data['topic_name'])
                if score > best_score:
                    best_score = score
                    best_match = topic_data
            
            # Classify if confidence > 0.10 (lowered threshold for better coverage)
            if best_match and best_score > 0.10:
                try:
                    supabase.table("questions").update({
                        "topic_name": best_match['topic_name'][:100],
                        "unit_name": best_match['unit_name'],
                        "classification_confidence": round(best_score, 2)
                    }).eq("id", question_id).execute()
                    
                    classified += 1
                    
                    # Store examples
                    if len(stats['examples']) < 15 and best_score > 0.3:
                        stats['examples'].append({
                            'subject': subject_code,
                            'question': question_text[:80],
                            'topic': best_match['topic_name'][:60],
                            'unit': best_match['unit_name'],
                            'confidence': round(best_score, 2)
                        })
                except Exception as e:
                    print(f"  Error updating question: {e}")
                    unclassified += 1
            else:
                unclassified += 1
            
            if (i + 1) % 100 == 0:
                print(f"  Processed {i + 1}/{len(questions.data)} questions...")
        
        coverage = round((classified / len(questions.data) * 100), 1) if questions.data else 0
        print(f"  ✅ Classified: {classified}/{len(questions.data)} ({coverage}%)")
        
        stats['total'] += len(questions.data)
        stats['classified'] += classified
        stats['unclassified'] += unclassified
        stats['by_subject'][subject_code] = {
            'total': len(questions.data),
            'classified': classified,
            'coverage': coverage
        }
        print()
    
    return stats

def generate_report(stats):
    """Generate classification report"""
    print("="*80)
    print("CLASSIFICATION REPORT")
    print("="*80)
    print()
    
    print(f"Total Questions:      {stats['total']}")
    print(f"Classified:           {stats['classified']}")
    print(f"Unclassified:         {stats['unclassified']}")
    
    coverage = round((stats['classified'] / stats['total'] * 100), 1) if stats['total'] > 0 else 0
    print(f"Classification Coverage: {coverage}%")
    print()
    
    print("By Subject:")
    print("-"*80)
    for code, sub_stats in stats['by_subject'].items():
        print(f"  {code}: {sub_stats['classified']}/{sub_stats['total']} ({sub_stats['coverage']}%)")
    
    print()
    print("Classification Examples:")
    print("-"*80)
    for ex in stats['examples']:
        print(f"\n{ex['subject']}: {ex['question']}")
        print(f"  → Topic: {ex['topic']}")
        print(f"  → Unit: {ex['unit']}")
        print(f"  → Confidence: {ex['confidence']}")
    
    print()
    print("="*80)
    if coverage >= 80:
        print("✅ SUCCESS: 80%+ classification coverage achieved")
    else:
        print(f"⚠️  {coverage}% coverage (target: 80%)")
        print("   Consider: improved similarity algorithm, manual topic refinement")
    print("="*80)
    
    return coverage

def main():
    pdf_path = "/tmp/mlrit_r22_syllabus.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF not found: {pdf_path}")
        print("Download: curl -sL 'https://files.mlrit.ac.in/curriculum/133-links/B.Tech-(CSE)MLR22-SYLLABUS.pdf' -o /tmp/mlrit_r22_syllabus.pdf")
        return
    
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    # Step 1: Parse and ingest syllabus
    print("Parsing syllabus PDF...")
    syllabus_data = parse_syllabus_from_pdf(pdf_path)
    print(f"✅ Parsed {len(syllabus_data)} subjects\n")
    
    ingest_stats = ingest_syllabus_data(supabase, syllabus_data)
    
    # Step 2: Classify questions
    classification_stats = classify_questions(supabase)
    
    # Step 3: Generate report
    coverage = generate_report(classification_stats)
    
    return coverage

if __name__ == "__main__":
    main()
