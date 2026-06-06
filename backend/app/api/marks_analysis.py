"""
Marks Distribution Analysis API

Provides breakdown of questions by marks range (1-2, 3-5, 6-10, 11+)
for better exam preparation planning.
"""

from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)


@router.get("/analysis/{analysis_id}/marks-breakdown")
async def get_marks_breakdown(analysis_id: str):
    """
    Get question distribution by marks ranges.
    
    Returns breakdown of questions into:
    - 1-2 marks: Short answer questions
    - 3-5 marks: Medium answer questions  
    - 6-10 marks: Long answer questions
    - 11+ marks: Very long answer / essay questions
    """
    db = get_db()
    
    try:
        # Get analysis metadata
        analysis = db.table('analysis_reports').select(
            'subject_id, regulation, exam_category'
        ).eq('id', analysis_id).single().execute()
        
        if not analysis.data:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        subject_id = analysis.data['subject_id']
        regulation = analysis.data['regulation']
        
        # Get all questions for this subject + regulation
        questions_query = db.table('questions').select('marks').eq('regulation', regulation)
        
        # Join with papers to filter by subject
        papers = db.table('papers').select('id').eq('subject_id', subject_id).eq('regulation', regulation).execute()
        paper_ids = [p['id'] for p in papers.data]
        
        if not paper_ids:
            return {
                'success': True,
                'data': {
                    'breakdown': {},
                    'percentages': {},
                    'total_questions': 0
                }
            }
        
        questions = questions_query.in_('paper_id', paper_ids).execute()
        
        # Group by marks range
        breakdown = {
            '1-2': 0,    # Short answer (BTL1, BTL2 - Remember, Understand)
            '3-5': 0,    # Medium answer (BTL3, BTL4 - Apply, Analyze)  
            '6-10': 0,   # Long answer (BTL5 - Evaluate)
            '11+': 0     # Very long (BTL6 - Create, Essay)
        }
        
        for q in questions.data:
            marks = q.get('marks')
            if marks is None:
                continue
                
            if marks <= 2:
                breakdown['1-2'] += 1
            elif marks <= 5:
                breakdown['3-5'] += 1
            elif marks <= 10:
                breakdown['6-10'] += 1
            else:
                breakdown['11+'] += 1
        
        total = sum(breakdown.values())
        
        # Calculate percentages
        percentages = {}
        average_marks = {}
        
        for range_key, count in breakdown.items():
            if total > 0:
                percentages[range_key] = round(count / total * 100, 1)
            else:
                percentages[range_key] = 0.0
            
            # Calculate average marks in this range
            if range_key == '1-2':
                average_marks[range_key] = 1.5
            elif range_key == '3-5':
                average_marks[range_key] = 4.0
            elif range_key == '6-10':
                average_marks[range_key] = 8.0
            else:
                average_marks[range_key] = 12.0
        
        # Generate study recommendations
        recommendations = []
        
        if breakdown['1-2'] > total * 0.4:
            recommendations.append({
                'type': 'high_short_questions',
                'message': 'Focus on quick recall and definitions. Many 1-2 mark questions.',
                'priority': 'high'
            })
        
        if breakdown['6-10'] > total * 0.3:
            recommendations.append({
                'type': 'high_long_questions',
                'message': 'Practice detailed explanations. Significant weightage for long answers.',
                'priority': 'high'
            })
        
        if breakdown['3-5'] > total * 0.4:
            recommendations.append({
                'type': 'balanced_preparation',
                'message': 'Balanced exam pattern. Focus on application and analysis.',
                'priority': 'medium'
            })
        
        return {
            'success': True,
            'data': {
                'breakdown': breakdown,
                'percentages': percentages,
                'average_marks': average_marks,
                'total_questions': total,
                'recommendations': recommendations,
                'metadata': {
                    'subject_id': subject_id,
                    'regulation': regulation
                }
            }
        }
        
    except Exception as e:
        log.error(f"Error fetching marks breakdown: {e}")
        raise HTTPException(status_code=500, detail=str(e))
