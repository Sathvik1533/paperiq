# Milestone 1 — Implementation Notes

## Status: COMPLETE

## What was built

### Scraper Layer
- `PaperScraper` ABC
- `RequestsScraper` — HTTP scraper, parses MLRIT HTML, filters by year
- `PlaywrightScraper` — headless browser, degrades to requests if unavailable
- `ManualUploadAdapter` — always-available fallback
- `MLRITScraper` — MLRIT adapter
- `ScraperFactory` — health-check fallback chain

### Job Infrastructure
- `ScrapingJob` model with status/stage/progress
- `JobManager` — in-memory + async DB persistence
- `run_scrape_job()` — Discover → Download → SHA-256 dedup → Store

### LLM Scaffold
- `LLMProvider` ABC + `TaskType` + tier routing
- `GroqProvider`, `OpenRouterProvider`, `OllamaProvider`
- `FailoverRouter` with circuit breakers
- `ProviderFactory` driven by `LLM_PROVIDER_ORDER` env

### API Endpoints
- `GET  /api/v1/health`
- `GET  /api/v1/llm/health`
- `GET  /api/v1/llm/active`
- `GET  /api/v1/colleges`
- `GET  /api/v1/subjects`
- `POST /api/v1/scrape/trigger`
- `GET  /api/v1/scrape/jobs/{id}`
- `GET  /api/v1/papers`
- `GET  /api/v1/papers/{id}`
- `GET  /api/v1/papers/{id}/questions`

### Infrastructure
- Supabase client + health check
- Pydantic settings from .env
- Structured logging
- Dockerfile + docker-compose
- GitHub Actions CI
- Payments ABC + FreeProvider + stubs

## M2 picks up from here

All papers stored with `extraction_status: pending`.
M2 implements ArchiveExtractor → DocxExtractor → PdfExtractor.
