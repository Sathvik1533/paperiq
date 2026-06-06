"""
Papers API — B7 fix: GET /papers now includes parsed questions per paper.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from typing import Optional
from io import BytesIO
from app.database import get_db
from app.logger import get_logger

router = APIRouter()
log = get_logger(__name__)


@router.get("/papers")
async def list_papers(
    subject_id: Optional[str] = None,
    year: Optional[int] = None,
    exam_type: Optional[str] = None,
    exam_category: Optional[str] = None,
    regulation: Optional[str] = None,
    college_id: Optional[str] = None,
):
    """
    Returns papers with their parsed questions included.
    B7 fix: joins questions so the Paper Viewer can display them.
    """
    db = get_db()
    q = db.table("papers").select(
        "id, title, exam_year, exam_month, exam_type, exam_category, regulation, "
        "max_marks, btech_year, file_type, extraction_status, subject_id, created_at"
    )
    if subject_id:
        q = q.eq("subject_id", subject_id)
    if year:
        q = q.eq("exam_year", year)
    if exam_type:
        q = q.eq("exam_type", exam_type)
    if exam_category:
        q = q.eq("exam_category", exam_category)
    if regulation:
        q = q.eq("regulation", regulation)
    if college_id:
        q = q.eq("college_id", college_id)

    result = q.order("exam_year", desc=True).execute()
    papers = result.data or []

    # Attach parsed questions for each paper (B7 fix)
    if papers:
        paper_ids = [p["id"] for p in papers]
        try:
            q_result = db.table("questions").select(
                "id, paper_id, question_number, part, question_text, "
                "question_type, marks, unit_number, co, is_or_question"
            ).in_("paper_id", paper_ids).execute()
            questions_by_paper: dict[str, list] = {}
            for q in (q_result.data or []):
                pid = q["paper_id"]
                questions_by_paper.setdefault(pid, []).append(q)
            for paper in papers:
                paper["parsed_questions"] = questions_by_paper.get(paper["id"], [])
        except Exception as e:
            log.warning(f"Could not fetch questions for papers: {e}")
            for paper in papers:
                paper["parsed_questions"] = []

    return {
        "success": True,
        "data": papers,
        "meta": {"total": len(papers)}
    }


@router.get("/papers/{paper_id}")
async def get_paper(paper_id: str):
    db = get_db()
    result = db.table("papers").select("*").eq("id", paper_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Paper not found")
    return {"success": True, "data": result.data}


@router.get("/papers/{paper_id}/questions")
async def get_paper_questions(paper_id: str):
    db = get_db()
    result = db.table("questions").select("*").eq("paper_id", paper_id).execute()
    return {"success": True, "data": result.data}


@router.get("/papers/{paper_id}/download")
async def download_paper(paper_id: str):
    """
    Generate and download paper as PDF from questions in database.
    Fast, on-demand generation - no file storage needed.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    except ImportError:
        raise HTTPException(
            500, 
            "PDF generation not available. Install reportlab: pip install reportlab"
        )
    
    db = get_db()
    
    # Get paper metadata
    paper_result = db.table("papers").select(
        "id, title, exam_type, exam_year, exam_month, exam_category, "
        "regulation, max_marks, duration_hours, subject_id"
    ).eq("id", paper_id).single().execute()
    
    if not paper_result.data:
        raise HTTPException(404, "Paper not found")
    
    paper = paper_result.data
    
    # Get subject name
    subject_name = "Subject"
    if paper.get("subject_id"):
        sub_result = db.table("subjects").select("name").eq("id", paper["subject_id"]).single().execute()
        if sub_result.data:
            subject_name = sub_result.data["name"]
    
    # Get questions ordered by question_number
    questions_result = db.table("questions").select(
        "question_number, question_text, marks, part, unit_name, topic_name, question_type"
    ).eq("paper_id", paper_id).order("question_number", desc=False).execute()
    
    questions = questions_result.data or []
    
    if not questions:
        raise HTTPException(404, "No questions found for this paper")
    
    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    part_style = ParagraphStyle(
        'PartHeading',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#0066cc'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    question_style = ParagraphStyle(
        'Question',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=8,
        alignment=TA_JUSTIFY
    )
    
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#999999'),
        spaceAfter=12
    )
    
    # Header
    story.append(Paragraph(subject_name, title_style))
    
    # Paper title
    exam_cat = paper.get('exam_category') or paper.get('exam_type') or ''
    exam_month = paper.get('exam_month') if paper.get('exam_month') != 'Unknown' else ''
    exam_year = paper.get('exam_year') or ''
    title_parts = [p for p in [exam_cat, exam_month, str(exam_year) if exam_year else ''] if p]
    paper_title = ' '.join(title_parts) if title_parts else 'Question Paper'
    
    story.append(Paragraph(paper_title, subtitle_style))
    
    # Info table
    info_data = []
    if paper.get('regulation'):
        info_data.append(['Regulation:', paper['regulation']])
    if paper.get('max_marks'):
        info_data.append(['Max Marks:', str(paper['max_marks'])])
    if paper.get('duration_hours'):
        info_data.append(['Duration:', f"{paper['duration_hours']} Hour{'s' if paper['duration_hours'] > 1 else ''}"])
    
    if info_data:
        info_table = Table(info_data, colWidths=[1.5*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a1a1a')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
    
    # Horizontal line
    story.append(Table([['']], colWidths=[6.5*inch], style=TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 2, colors.HexColor('#0066cc')),
    ])))
    story.append(Spacer(1, 0.2*inch))
    
    # Group questions by part
    part_a = [q for q in questions if q.get('part') == 'A']
    part_b = [q for q in questions if q.get('part') == 'B']
    other = [q for q in questions if q.get('part') not in ('A', 'B')]
    
    def add_questions(qs, part_label=None):
        if not qs:
            return
        
        if part_label:
            story.append(Paragraph(part_label, part_style))
        
        for idx, q in enumerate(qs, 1):
            # Question number and text
            q_num = q.get('question_number') or idx
            q_text = q.get('question_text') or '[Question text not available]'
            marks = q.get('marks')
            
            # Format: "1. Question text [5M]"
            q_line = f"<b>{q_num}.</b> {q_text}"
            if marks:
                q_line += f" <b>[{marks}M]</b>"
            
            story.append(Paragraph(q_line, question_style))
            
            # Metadata (unit, topic)
            meta_parts = []
            if q.get('unit_name'):
                meta_parts.append(f"Unit: {q['unit_name']}")
            if q.get('topic_name'):
                meta_parts.append(f"Topic: {q['topic_name']}")
            
            if meta_parts:
                story.append(Paragraph(' | '.join(meta_parts), meta_style))
            else:
                story.append(Spacer(1, 0.1*inch))
    
    # Add questions by part
    if part_a:
        add_questions(part_a, "PART A")
    
    if part_b:
        if part_a:
            story.append(Spacer(1, 0.2*inch))
        add_questions(part_b, "PART B")
    
    if other:
        if part_a or part_b:
            story.append(Spacer(1, 0.2*inch))
        add_questions(other, "QUESTIONS")
    
    # Footer
    story.append(Spacer(1, 0.4*inch))
    story.append(Table([['']], colWidths=[6.5*inch], style=TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#cccccc')),
    ])))
    story.append(Spacer(1, 0.1*inch))
    footer_text = f"Generated by PaperIQ | {len(questions)} Questions"
    story.append(Paragraph(footer_text, meta_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    # Create filename
    filename_parts = [subject_name.replace(' ', '_')]
    if exam_cat and exam_cat != 'Unknown':
        filename_parts.append(exam_cat.replace(' ', '_'))
    if exam_year:
        filename_parts.append(str(exam_year))
    filename = '_'.join(filename_parts) + '.pdf'
    
    return Response(
        content=buffer.getvalue(),
        media_type='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
    )
