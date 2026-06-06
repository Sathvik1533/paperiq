#!/usr/bin/env python3
"""
Fast classification - batch processing with progress
"""
import os
import sys
import re
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

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

def main():
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    
    print("Loading syllabus topics...")
    all_topics = supabase.table("syllabus_topics").select("*").execute()
    print(f"✅ Loaded {len(all_topics.data)} topics\n")
    
    # Get subjects
    subjects = supabase.table("subjects").select("id, code, name").eq("regulation", "R22").execute()
    
    total_classified = 0
    total_questions = 0
    
    for subject in subjects.data:
        subject_id = subject['id']
        subject_code = subject['code']
        
        print(f"\n{subject_code} - {subject['name']}")
        print("="*80)
        
        # Filter topics for this subject
        subject_topics = [t for t in all_topics.data if t.get('subject_id') == subject_id]
        
        if not subject_topics:
            print("  ⚠️  No syllabus topics - skipping")
            continue
        
        print(f"  {len(subject_topics)} syllabus topics loaded")
        
        # Get ALL questions for this subject (handle pagination)
        all_questions = []
        page_size = 1000
        offset = 0
        
        while True:
            page = supabase.table("questions").select("id, question_text").eq("subject_id", subject_id).range(offset, offset + page_size - 1).execute()
            all_questions.extend(page.data)
            if len(page.data) < page_size:
                break
            offset += page_size
        
        print(f"  {len(all_questions)} questions to classify")
        questions_data = all_questions
        
        # Process in batches
        BATCH_SIZE = 100
        classified = 0
        
        for batch_start in range(0, len(questions_data), BATCH_SIZE):
            batch = questions_data[batch_start:batch_start + BATCH_SIZE]
            batch_updates = []
            
            for q in batch:
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
                
                # Classify if confidence > 0.10
                if best_match and best_score > 0.10:
                    batch_updates.append({
                        'id': question_id,
                        'topic_name': best_match['topic_name'][:100],
                        'unit_name': best_match['unit_name'],
                        'classification_confidence': round(best_score, 2)
                    })
                    classified += 1
            
            # Batch update
            if batch_updates:
                try:
                    for update in batch_updates:
                        supabase.table("questions").update({
                            'topic_name': update['topic_name'],
                            'unit_name': update['unit_name'],
                            'classification_confidence': update['classification_confidence']
                        }).eq('id', update['id']).execute()
                except Exception as e:
                    print(f"    Error in batch: {e}")
            
            # Progress
            processed = min(batch_start + BATCH_SIZE, len(questions_data))
            print(f"    Progress: {processed}/{len(questions_data)} ({classified} classified)", end='\r')
        
        print()  # New line after progress
        coverage = round((classified / len(questions_data) * 100), 1) if questions_data else 0
        print(f"  ✅ Classified: {classified}/{len(questions_data)} ({coverage}%)")
        
        total_classified += classified
        total_questions += len(questions_data)
    
    print("\n" + "="*80)
    print("FINAL RESULTS")
    print("="*80)
    print(f"Total Questions:  {total_questions}")
    print(f"Classified:       {total_classified}")
    print(f"Coverage:         {round((total_classified/total_questions*100), 1)}%")
    
    if total_classified / total_questions >= 0.80:
        print("\n✅ SUCCESS: 80%+ classification coverage achieved")
    else:
        print(f"\n⚠️  Below 80% target - achieved {round((total_classified/total_questions*100), 1)}%")

if __name__ == "__main__":
    main()
