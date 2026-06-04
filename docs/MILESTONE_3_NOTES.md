# Milestone 3 — Question Parsing & Structured Storage

## Status: COMPLETE

## What Was Built

### Parser Layer
| Module | Purpose |
|---|---|
| `parsers/models.py` | `ParsedQuestion`, `ParseResult`, `QuestionType`, `QuestionSection` |
| `parsers/question_type_classifier.py` | Rule-based: Definition/Proof/Numerical/Construction/Theory/Comparison |
| `parsers/marks_extractor.py` | Extracts 1M/5M/10M from table cells and free text |
| `parsers/question_parser.py` | Handles table-format (MLRIT DOCX) + numbered format |
| `parsers/question_store.py` | DB upsert with hash-based dedup across papers |

### Jobs + API
| File | Endpoints |
|---|---|
| `jobs/parse_job.py` | Batch parse all extracted papers |
| `api/questions.py` | `/parse/trigger`, `/parse/run`, `/parse/preview`, `/questions`, `/questions/{id}`, `/parse/stats` |

## Test Results
```
34 parser tests + 23 extractor tests + 5 scraper tests = 62 total
62 passed in 1.14s
```

## Parse Output on Real MLRIT Paper (Feb 2024)
```
total=28  partA=10  partB=18

Part A (10 questions, 1M each):
  - Define propositional logic?          [DEFINITION, conf=0.95, 1M, CO1]
  - What is homogeneous recurrence?      [UNKNOWN, conf=0.30, 1M, CO4]
  - Define generating function.          [DEFINITION, conf=0.95, 1M, CO4]
  - What is tree?                        [UNKNOWN, conf=0.30, 1M, CO5]
  - What is an Euler graph?              [UNKNOWN, conf=0.30, 1M, CO5]

Part B (18 questions, 5M/10M):
  - Show that ~P follows from premises   [PROOF, conf=0.95, 5M, CO1]
  - Draw the Hasse diagram...            [CONSTRUCTION, conf=0.92, 5M, CO2]
  - Solve the recurrence relation...     [NUMERICAL, conf=0.90, 10M, CO4]
  - Explain BFS method...                [THEORY, conf=0.85, 5M, CO5]
  - Construct MST using Kruskal's        [CONSTRUCTION, conf=0.92, 5M, CO5]
```

## Traceability Chain
```
question.paper_id
  -> papers.id
  -> papers.original_url  (source document)
  -> papers.exam_year, exam_type
  -> question.raw_snippet (exact text slice)
```

## Schema Ready for M4
- `questions.unit_number` — NULL now, populated in M4
- `questions.topic_tags`  — empty array now, populated in M4
- `question_hash` dedup prevents duplicate storage across papers

## M4 Picks Up From Here
- Unit classification (CO1=Unit1...CO5=Unit5)
- Topic mapping (question text -> syllabus topic)
- Frequency analysis across papers
