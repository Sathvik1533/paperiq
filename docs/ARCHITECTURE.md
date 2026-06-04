# PaperIQ — Architecture

## Core Principle

> Every feature answers: *"Will this help a student score better marks with less effort?"*

The paper extraction system is **infrastructure**. The product value is **preparation intelligence**.

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│     React + Vite + TypeScript + Tailwind CSS                │
│  Auth | Search | Dashboard | Papers | Planner | Settings    │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                        BACKEND (FastAPI)                    │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Scrapers  │  │Extractors │  │ Parsers  │  │ Analysis │  │
│  └───────────┘  └───────────┘  └──────────┘  └──────────┘  │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │    LLM    │  │  Planner  │  │Syllabus  │  │Payments  │  │
│  │  Router   │  │  Engine   │  │ Intel.   │  │ (stub)   │  │
│  └───────────┘  └───────────┘  └──────────┘  └──────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                       SUPABASE                              │
│        PostgreSQL | Auth | Storage | Realtime               │
└─────────────────────────────────────────────────────────────┘
```

## Scraper Architecture

```
PaperScraper (ABC)
├── PlaywrightScraper      — headless browser
│   └── MLRITScraper       — MLRIT portal adapter
├── RequestsScraper        — HTTP fallback
├── BrowserMCPAdapter      — MCP browser fallback
└── ManualUploadAdapter    — user-provided files

ScraperFactory
  try: PlaywrightScraper
  fail → RequestsScraper
  fail → BrowserMCPAdapter
  fail → ManualUploadAdapter
```

## LLM Architecture

```
LLMProvider (ABC)
├── GroqProvider           — Priority 1 (fast, free tier)
│     fast:      llama-3.1-8b-instant
│     medium:    qwen2.5-32b-preview
│     reasoning: deepseek-r1-distill-llama-70b
├── OpenRouterProvider     — Priority 2 (aggregator)
│     fast:      qwen/qwen-2.5-7b-instruct:free
│     medium:    mistralai/mistral-7b-instruct:free
│     reasoning: deepseek/deepseek-r1:free
├── OllamaProvider         — Priority 3 (local)
│     fast:      qwen2.5:7b
│     medium:    qwen2.5:14b
│     reasoning: deepseek-r1:14b
└── VLLMProvider           — Priority 4 (self-hosted, future)

FailoverRouter
  — circuit breaker per provider (60s cooldown)
  — automatic failover, zero user intervention
  — task-tier routing: fast / medium / reasoning
```

## Task → Model Tier

| Task | Tier |
|---|---|
| Question Classification | fast |
| Topic Extraction | fast |
| Pattern Analysis | medium |
| Syllabus Mapping | medium |
| Study Plan Generation | reasoning |
| Mock Exam Generation | reasoning |
| Exam Insights | reasoning |
| Readiness Scoring | fast |

## Evidence Trail Principle

```
Original Paper
  → Extracted Question
  → Frequency Calculation
  → Analysis Result
```

**Rule:** If `evidence[]` is empty, the insight is NOT returned. No hallucinated predictions.

## Payment Architecture (MVP: stub only)

```
PaymentProvider (ABC)
├── FreeProvider     — active in MVP
├── RazorpayProvider — stub (future)
└── StripeProvider   — stub (future)
```
