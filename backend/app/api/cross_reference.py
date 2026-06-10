from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import os
import json
import uuid
import tempfile

from app.database import get_db
from app.logger import get_logger
from app.llm.provider_factory import get_llm_router
from app.llm.base import TaskType
from app.utils.upload_validation import validate_upload_magic, validate_upload_size, CROSS_REFERENCE_MIME, MAX_CROSS_REFERENCE_SIZE

log = get_logger(__name__)
router = APIRouter()

def extract_text_from_upload(file_path: str, filename: str) -> str:
    ext = filename.split(".")[-1].lower()
    text = ""
    try:
        if ext == "docx":
            import docx
            doc = docx.Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs])
        elif ext == "pdf":
            import fitz
            doc = fitz.open(file_path)
            text = "\n".join([page.get_text() for page in doc])
        elif ext in ["png", "jpg", "jpeg"]:
            try:
                import pytesseract
                from PIL import Image
                text = pytesseract.image_to_string(Image.open(file_path))
            except Exception as e:
                log.warning(f"OCR failed: {e}")
                text = "OCR failed or not installed. Please upload a PDF or DOCX instead."
        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        log.error(f"Error extracting text from {filename}: {e}")
    return text

@router.post("/analysis/{subject_id}/cross-reference")
async def cross_reference_faculty_notes(
    subject_id: str,
    file: UploadFile = File(...),
):
    db = get_db()
    
    # Validate file before processing
    file_bytes = await file.read()
    validate_upload_size(file_bytes, MAX_CROSS_REFERENCE_SIZE, "cross-reference")
    validate_upload_magic(file_bytes, CROSS_REFERENCE_MIME, "cross-reference")
    
    # 1. Fetch PYQ questions for the subject
    result = db.table("questions").select("question_text, marks, exam_year, exam_category").eq("subject_id", subject_id).execute()
    pyq_questions = result.data or []
    
    if not pyq_questions:
        raise HTTPException(status_code=400, detail="No PYQ data found for this subject to cross-reference against.")

    pyq_summary = []
    for q in pyq_questions[:100]:
        pyq_summary.append(f"Q: {q['question_text']} (Year: {q['exam_year']}, Category: {q['exam_category']})")
    
    pyq_text = "\n".join(pyq_summary)

    # 2. Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_file:
        temp_file.write(file_bytes)
        temp_path = temp_file.name

    try:
        professor_text = extract_text_from_upload(temp_path, file.filename)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    if not professor_text or len(professor_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from the uploaded file.")

    # 3. Call LLM to cross-reference
    prompt = f"""
You are an expert academic evaluator. 
A student has uploaded their professor's "Important Questions" list:
<professor_notes>
{professor_text}
</professor_notes>

Here is a sample of historical PYQ data for this subject (previous year questions):
<pyq_data>
{pyq_text}
</pyq_data>

Analyze the professor's notes against the PYQ data. Group the findings into 3 exact categories:
1. "must_read": Questions from the professor's notes that are also strongly represented or identical in the PYQ data.
2. "professors_bet": Questions from the professor's notes that rarely/never appear in the PYQ data.
3. "blind_spots": Highly frequent/important topics from the PYQ data that the professor MISSED in their notes.

Return ONLY valid JSON in this exact structure:
{{
  "must_read": [{{"question": "...", "reason": "...", "pyq_frequency": "High"}}],
  "professors_bet": [{{"question": "...", "reason": "...", "pyq_frequency": "Low/None"}}],
  "blind_spots": [{{"topic": "...", "reason": "...", "pyq_frequency": "High"}}]
}}
"""
    llm_router = get_llm_router()
    try:
        response = await llm_router.complete(prompt, TaskType.ANALYSIS)
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        data = json.loads(text)
        return {"success": True, "data": data}
        
    except Exception as e:
        log.error(f"Cross-reference LLM failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process cross-reference analysis.")
