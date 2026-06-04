# PaperIQ — Roadmap

## Vision

Become the go-to AI exam intelligence platform for Indian university students — starting with MLRIT and expanding to JNTUH, VTU, Anna University, and beyond.

> North star metric: **Students who use PaperIQ score at least one grade higher on average.**

## Milestones

### M1 — MLRIT Scraper 🔄 (Current)
- FastAPI skeleton + Supabase config
- Scraper ABC + PlaywrightScraper + RequestsScraper
- ScraperFactory with automatic fallback chain
- MLRITScraper adapter
- Background scraping jobs + progress tracking
- /health, /scrape/trigger, /scrape/jobs endpoints
- LLM FailoverRouter scaffold
- Logging, error handling

### M2 — Document Extraction Engine
- ArchiveExtractor (RAR + ZIP)
- DocxExtractor (python-docx)
- DocExtractor (antiword fallback)
- PdfExtractor (PyMuPDF)
- ExtractorFactory
- Dedup on file_hash
- /papers endpoints

### M3 — Question Parsing & Storage
- QuestionParser (Part A/B, table rows)
- MarksExtractor
- UnitClassifier + TopicClassifier
- LLMProvider ABC + GroqProvider (live)
- FailoverRouter (live)
- /questions endpoints

### M4 — Pattern Analysis Engine
- FrequencyAnalyzer, UnitAnalyzer, TrendAnalyzer
- QuestionClassifier (definition/proof/numerical)
- PredictionEngine
- ReportBuilder with evidence trail enforcement
- SyllabusParser + CoverageAnalyzer
- /analysis endpoints

### M5 — Personalized Study Planner
- PriorityRanker (Must/High/Medium/Low)
- ScheduleBuilder
- MockExamGenerator (evidence-backed)
- ReadinessScorer (0-100 + grade prediction)
- /planner, /readiness, /mock endpoints

### M6 — Frontend Dashboard
- React + Vite + TypeScript + Tailwind
- Google Auth
- All 7 screens
- Evidence trail UI (click any insight → source paper)
- Readiness score widget

### M7 — Deployment & Polish
- Dockerfile, GitHub Actions CI/CD
- Supabase RLS policies
- Rate limiting
- Payment stubs in UI
- Full documentation + seed data

## Future (Post-MVP)
- JNTUH, VTU, Anna University adapters
- WhatsApp bot interface
- Offline mode (Ollama-powered)
- Razorpay / Stripe subscriptions
- College admin portal
