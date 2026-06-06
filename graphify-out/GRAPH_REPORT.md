# Graph Report - /Users/k.sathvik/Projects/paperiq  (2026-06-05)

## Corpus Check
- 108 files · ~38,242 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 809 nodes · 1804 edges · 50 communities detected
- Extraction: 51% EXTRACTED · 49% INFERRED · 0% AMBIGUOUS · INFERRED: 881 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `ReadinessScorer` - 69 edges
2. `get_db()` - 45 edges
3. `FrequencyAnalyzer` - 39 edges
4. `MockExamGenerator` - 36 edges
5. `PriorityRanker` - 33 edges
6. `ScheduleBuilder` - 33 edges
7. `ExtractionError` - 30 edges
8. `PaperMeta` - 29 edges
9. `ParseResult` - 28 edges
10. `ArchiveExtractor` - 27 edges

## Surprising Connections (you probably didn't know these)
- `List questions with filters. Returns evidence trail (paper_id on each).` --uses--> `QuestionParser`  [INFERRED]
  /Users/k.sathvik/Projects/paperiq/backend/app/api/questions.py → /Users/k.sathvik/Projects/paperiq/backend/app/parsers/question_parser.py
- `getCachedAnalysis()` --calls--> `set()`  [INFERRED]
  /Users/k.sathvik/Projects/paperiq/frontend/src/lib/api.ts → /Users/k.sathvik/Projects/paperiq/frontend/src/pages/Onboarding.tsx
- `map_questions_to_topics()` --calls--> `set()`  [INFERRED]
  /Users/k.sathvik/Projects/paperiq/backend/app/intelligence/topic_mapper.py → /Users/k.sathvik/Projects/paperiq/frontend/src/pages/Onboarding.tsx
- `store_parse_result()` --calls--> `get_db()`  [INFERRED]
  /Users/k.sathvik/Projects/paperiq/backend/app/parsers/question_store.py → /Users/k.sathvik/Projects/paperiq/backend/app/database.py
- `get_questions_for_paper()` --calls--> `get_db()`  [INFERRED]
  /Users/k.sathvik/Projects/paperiq/backend/app/parsers/question_store.py → /Users/k.sathvik/Projects/paperiq/backend/app/database.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (47): compute_coverage(), _fuzzy_match(), Coverage Analyzer — Gap #6.  Maps parsed questions → syllabus topics to compute, Returns (matched, best_score).     Checks each tag against the syllabus topic na, Compute syllabus coverage for a subject+regulation.      Returns:     {       sy, Exception, ParseResult, Full output of QuestionParser.parse() for one paper. (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (44): ArchiveExtractor, Extracts archives (RAR, ZIP, etc.) into a temp directory.     Returns one Extrac, Extract archive to dest_dir. Returns list of extracted file paths., Recursively list all files (not dirs) in directory., BaseExtractor, can_handle(), extract(), ExtractedDocument (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (40): extract_marks(), infer_marks_from_section(), Extracts marks value from question text or table cell strings. Handles: "5M", "1, Returns (marks_int, original_marks_string).     Returns (None, "") if no marks f, Fallback: infer marks from section/context when not explicitly stated.     Part, Config, ParsedQuestion, QuestionSection (+32 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (44): BaseModel, MockExamGenerator, Mock Exam Generator — generates a mock paper matching real exam format.  Archite, Generate up to PART_B_UNITS long-answer questions (one per unit).         Only u, Normalise evidence entries to {paper_id, year, exam_type}.         Accepts both, Generate a mock exam from an analysis_report.          Returns:             {, Generate up to PART_A_COUNT short-answer questions from high_probability_topics., set() (+36 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (36): Background job wrapper around ReportBuilder., Async wrapper — runs ReportBuilder synchronously inside an async context.     Re, run_analysis_job(), FrequencyAnalyzer, _normalise(), Frequency Analyzer — computes topic frequency, question repetition, and unit dis, Returns per-unit stats.         Each: {unit_number, unit_name, question_count, m, Lower-case, strip punctuation, remove stop words, sort tokens for fuzzy dedup. (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (60): get_cached_report(), get_report(), get_report_status(), get_syllabus_coverage(), map_topics(), MapTopicsRequest, Analysis API endpoints.  POST /analysis/run          — trigger analysis, returns, Returns current status of an analysis job. (+52 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (39): ABC, health_check(), PaperScraper, Abstract base for all paper scrapers.     Subclass per college or per transport, Return metadata for all matching papers on the portal., Download archive to dest_dir. Returns local file path., Return True if this scraper can reach the internet., ScraperError (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (19): AllProvidersUnavailableError, LLMProvider, LLMProviderError, LLMResponse, ProviderUnavailableError, RateLimitError, TaskType, active_provider() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (24): calculateReadiness(), fetchWithAuth(), generateMock(), generatePlan(), getAnalysisStatus(), getCachedAnalysis(), getJobStatus(), getSyllabi() (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.1
Nodes (10): TestTopicClassifier, TestUnitClassifier, classify_topics(), Topic Classifier — maps question text to topic names for Discrete Mathematics. C, Returns list of matched topic names for the given question text.     If unit is, backfill_questions(), classify_unit(), Unit Classifier — maps CO tags and keyword patterns to unit numbers (1-5). Cover (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (23): download(), Enum, download_dir(), ensure_dir(), sha256_file(), JobStage, JobStatus, advance_stage() (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (9): FreeProvider, PaymentOrder, PaymentProvider, PaymentResult, Return True if this extractor handles the given file., PaymentProvider, get_payment_provider(), RazorpayProvider (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.37
Nodes (3): Build a daily study plan.          Returns:             {                 daily_, _future_date(), TestScheduleBuilder

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (3): BaseSettings, get_settings(), Settings

### Community 14 - "Community 14"
Cohesion: 0.4
Nodes (5): _get_client_ip(), rate_limit_scrape(), Rate limiting middleware for the scrape endpoint.  Strategy: in-memory dict keye, Extract real client IP, respecting common proxy headers., FastAPI dependency. Raises HTTP 429 if the client IP has exceeded     SCRAPE_LIM

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): Extract text and metadata from file_path.         Raises ExtractionError on fail

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **70 isolated node(s):** `Rate limiting middleware for the scrape endpoint.  Strategy: in-memory dict keye`, `Extract real client IP, respecting common proxy headers.`, `FastAPI dependency. Raises HTTP 429 if the client IP has exceeded     SCRAPE_LIM`, `Return True if this extractor handles the given file.`, `Config` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 17`** (2 nodes): `RegulationBadge()`, `RegulationBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `Auth()`, `Auth.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `toggleSort()`, `Dashboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `get_logger()`, `logger.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `ReadinessGauge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `JobProgressBar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `EvidencePanel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `supabase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Papers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `analysisStore.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `authStore.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Extract text and metadata from file_path.         Raises ExtractionError on fail`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_db()` connect `Community 5` to `Community 0`, `Community 2`, `Community 4`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `set()` connect `Community 3` to `Community 8`, `Community 0`, `Community 2`, `Community 4`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `ReadinessScorer` connect `Community 0` to `Community 3`, `Community 12`, `Community 5`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Are the 56 inferred relationships involving `ReadinessScorer` (e.g. with `GeneratePlanRequest` and `ReadinessRequest`) actually correct?**
  _`ReadinessScorer` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Are the 43 inferred relationships involving `get_db()` (e.g. with `store_parse_result()` and `get_questions_for_paper()`) actually correct?**
  _`get_db()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `FrequencyAnalyzer` (e.g. with `ReportBuilder` and `Report Builder — orchestrates all analyzers and stores result in analysis_report`) actually correct?**
  _`FrequencyAnalyzer` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `MockExamGenerator` (e.g. with `GeneratePlanRequest` and `ReadinessRequest`) actually correct?**
  _`MockExamGenerator` has 31 INFERRED edges - model-reasoned connections that need verification._