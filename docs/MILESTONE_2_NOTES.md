# Milestone 2 — Document Extraction Engine

## Status: COMPLETE

## Architecture Decision Locked

**Syllabus-First Intelligence Pipeline:**
```
Subject Selection
→ Load Syllabus → Extract Units → Extract Topics → Store
→ Scrape Papers → Extract Questions
→ Map Questions To Syllabus Topics  (M4b)
→ Analysis → Study Planning → Readiness → Mock Exam
```
Every question in the system maps to a Unit + Topic from the syllabus.

## What Was Built

### Extractors
| Class | File | Handles |
|---|---|---|
| `PDFExtractor` | `pdf_extractor.py` | .pdf via PyMuPDF |
| `DocxExtractor` | `docx_extractor.py` | .docx paragraphs + tables |
| `DocExtractor` | `doc_extractor.py` | .doc via antiword/catdoc/raw-bytes |
| `HtmlExtractor` | `html_extractor.py` | .html/.htm via BeautifulSoup |
| `ArchiveExtractor` | `archive_extractor.py` | .rar/.zip via unar/patoolib/zipfile |
| `ExtractorFactory` | `extractor_factory.py` | auto-detect + route |
| `TextNormalizer` | `text_normalizer.py` | unicode, blank lines, Word artifacts |

### Syllabus Ingestion
- `syllabus_ingester.py` — upload PDF/DOCX, parse unit/topic structure, store in `syllabi` + `syllabus_topics`
- Parser handles UNIT I/II/III... and UNIT 1/2/3... formats

### Jobs
- `extract_job.py` — picks up `extraction_status=pending` papers, runs pipeline, updates DB

### API Endpoints
- `POST /api/v1/extract/trigger` — queue extraction (background)
- `POST /api/v1/extract/run` — synchronous extraction (testing)
- `GET  /api/v1/extract/status` — counts by extraction_status
- `POST /api/v1/syllabus/upload` — upload + ingest syllabus
- `GET  /api/v1/syllabus` — list syllabi
- `GET  /api/v1/syllabus/{id}/topics` — list parsed topics

## Test Results
```
23 passed in 0.81s
```
All extractors tested with real files (not mocks).

## Supported File Types
| Type | Extension | Method |
|---|---|---|
| PDF | .pdf | PyMuPDF |
| DOCX | .docx | python-docx (paragraphs + tables) |
| DOC | .doc | antiword → catdoc → raw-bytes |
| ZIP | .zip | unar → patoolib → zipfile |
| RAR | .rar | unar → patoolib |
| HTML | .html | BeautifulSoup |

## Example Extraction Output (MLRIT DM paper)
```
Course Code: A6CS08
MLR INSTITUTE OF TECHNOLOGY
DISCRETE MATHEMATICS (CSE)
...
1 | a) | Define Tautology and Contradiction | 1 | 1 | 1
2 | a) | Obtained the principal conjunctive normal forms...
4 | a) | Draw the HASSE Diagram for positive divisors of 45
...
8 | Solve the following recurrence relation using characteristics roots...
10 | a) | Apply Kruskal's algorithm on the following graph...
```

## M3 Picks Up From Here
All papers with `extraction_status=success` have `raw_text` populated.
M3 implements `QuestionParser` to structure that text into typed questions.
