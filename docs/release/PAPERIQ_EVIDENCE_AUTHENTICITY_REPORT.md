# PaperIQ Academic Evidence & Authenticity Report
**Framework**: Zero-Hallucination Academic Provenance Architecture  
**Target Curriculum**: MLRIT Autonomous R22 Regulations (3-1 Focus)  
**Date**: November 15, 2026

---

## 1. Core Authenticity Mandate

A fundamental principle of PaperIQ is that **an academic intelligence tool must never deceive students**. Hallucinating previous exam questions, inventing false examination years, assigning synthetic mark weights, or manufacturing fake paper citations destroys student trust and damages exam preparation.

To guarantee absolute integrity, PaperIQ enforces a three-tier strict separation across all data pipelines, storage models, and UI views.

---

## 2. Three Strictly Separated Academic Data Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PaperIQ Academic Data Architecture                    │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│    CATEGORY A: VERIFIED      │   CATEGORY B: UNVERIFIED     │  CATEGORY C:  │
│    HISTORICAL QUESTIONS      │      EXTRACTED CONTENT       │ AI-GENERATED  │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ • Genuine original papers    │ • OCR raw drafts             │ • Practice Qs │
│ • Verified question wording  │ • Question boundaries in rev │ • Mock exams  │
│ • Linked to source PDF hash  │ • Missing mark allocations   │ • Flashcards  │
│ • Verified marks & Part A/B  │ • Draft syllabus mappings    │ • AI tutorial │
│ • Traceable citation badges  │ • Never shown as "Verified"  │ • Labeled "AI"│
│ • Used in frequency stats    │ • Excluded from predictions  │ • 0 in stats  │
└──────────────────────────────┴──────────────────────────────┴───────────────┘
```

### Category A: Verified Historical Questions
- **Origin**: Extracted from physical or official PDF examination papers conducted by MLRIT Examination Branch.
- **Integrity Requirements**:
  - Bound to an immutable stored PDF in Supabase Storage with SHA-256 hash validation.
  - Exact question wording, question number (e.g. `1c`, `6a`, `8`), and examination section (`Part A` or `Part B`) preserved.
  - Exam session identified (`Regular` or `Supplementary`) and year verified (`2024` or `2025`).
  - Unit number and Course Outcome (CO1–CO5) verified against the autonomous curriculum syllabus.
- **Display**: Rendered with gold/orange "Verified Historical Question" badge and traceable citation (e.g., `MLRIT R22 DAA Feb-2024 Regular Q8 (10M)`).

### Category B: Unverified Extracted Content
- **Origin**: Automated PDF parser or OCR pipeline outputs that have not completed dual-verification audits.
- **Handling**: Flagged with `verification_status: "pending_review"` or `"unverified"`.
- **Restrictions**: Strictly barred from contributing to topic frequency calculations, prediction scoring, or "Must Study" priority rankings. Never displayed with a verified badge.

### Category C: AI-Generated Learning Content
- **Origin**: Content generated dynamically by Groq LLM specialists (Academic Tutor, Practice Generator).
- **Handling**: Explicitly flagged with `is_ai_generated: true` and displayed with a clear "AI Practice Question" label.
- **Restrictions**: Under no circumstances can AI-generated items be mixed into historical frequency calculations, historical paper question banks, or verified trend tables.

---

## 3. Cryptographic Provenance & Schema Specification

Every Category A question in PaperIQ carries a complete provenance schema:

```json
{
  "question_id": "q-daa-001",
  "paper_id": "paper-mlrit-daa-r22-feb2024",
  "source_document": {
    "filename": "MLRIT_R22_BTech_3-1_DAA_Feb2024_Regular.pdf",
    "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "storage_bucket": "papers",
    "page_number": 2
  },
  "metadata": {
    "college": "MLRIT",
    "regulation": "R22",
    "branch": "CSE / IT",
    "year": 3,
    "semester": 1,
    "subject_code": "A6CS15",
    "subject_name": "Design and Analysis of Algorithms",
    "exam_year": 2024,
    "exam_session": "Regular",
    "maximum_marks": 60
  },
  "question_attributes": {
    "section": "Part B",
    "question_number": "8",
    "marks": 10,
    "marks_type": "10m_direct",
    "co": "CO5",
    "bloom_level": "BL3",
    "unit_number": 5,
    "topic_name": "0/1 Knapsack Problem — LC Branch and Bound",
    "question_text": "Explain 0/1 Knapsack problem using LC Branch and Bound technique with an example state space tree."
  },
  "citation_string": "MLRIT R22 DAA Feb-2024 Regular Q8 (10M)"
}
```

---

## 4. Anti-Fabrication Safeguards in AI Companion

When a student queries the AI Companion:
1. **Intelligence Pre-Search**: The system executes `AcademicQuestionIntelligence.find_matching_question(query, subject_code)`.
2. **Deterministic Match Verification**: If a question matches with $\ge 0.75$ semantic and keyword confidence against a verified Category A question:
   - The verified question's exact mark count (1M, 5M, or 10M) and session metadata are loaded.
   - The response prompt explicitly commands the LLM to adhere to the verified question's official criteria.
3. **Unverified Query Handling**: If no verified historical question matches:
   - `is_verified_exam_question` is set to `False`.
   - `detected_marks` remains `None`.
   - The AI Tutor provides conceptual guidance but explicitly refrains from claiming the query appeared on a specific past exam.

This dual-layer mechanism guarantees that PaperIQ will never invent an exam citation to sound more authoritative.
