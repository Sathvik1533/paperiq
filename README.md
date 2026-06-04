# PaperIQ

> AI Exam Intelligence Platform

PaperIQ helps students automatically discover, collect, extract, analyze, and study previous university question papers — generating **evidence-backed** exam preparation insights and personalized study plans.

## What PaperIQ Is

PaperIQ is **not** a question paper downloader.  
PaperIQ is an **AI Exam Intelligence Platform**.

> Every feature answers one question: *"Will this help a student score better marks with less effort?"*

| Layer | What it does |
|---|---|
| Scraper | Discovers and downloads papers from university portals |
| Extractor | Pulls text from RAR/ZIP/PDF/DOC/DOCX archives |
| Parser | Structures raw text into typed questions with unit/topic tags |
| Analyzer | Computes frequency, trends, predictions — all evidence-backed |
| Planner | Builds personalized daily study schedules |
| Scorer | Generates a 0–100 readiness score with grade prediction |
| Mock Exam | Predicts the next exam paper from historical patterns |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + Google OAuth |
| Storage | Supabase Storage |
| Automation | Playwright |
| Document Processing | PyMuPDF + python-docx |
| LLM (primary) | Groq (Llama / Qwen / DeepSeek) |
| LLM (failover) | OpenRouter → Ollama |

## Quick Start

See [docs/SETUP.md](docs/SETUP.md) for full instructions.

```bash
# Clone
git clone https://github.com/Sathvik1533/paperiq.git
cd paperiq

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env    # fill in your keys
uvicorn app.main:app --reload

# Frontend
cd ../frontend
bun install
cp .env.example .env
bun dev
```

## Milestones

| # | Milestone | Status |
|---|---|---|
| 1 | MLRIT Scraper | 🔄 In Progress |
| 2 | Document Extraction Engine | ⏳ Pending |
| 3 | Question Parsing & Storage | ⏳ Pending |
| 4 | Pattern Analysis Engine | ⏳ Pending |
| 5 | Personalized Study Planner | ⏳ Pending |
| 6 | Dashboard & Repository | ⏳ Pending |
| 7 | Deployment & Polish | ⏳ Pending |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Contract](docs/API_CONTRACT.md)
- [Roadmap](docs/ROADMAP.md)
- [Setup Guide](docs/SETUP.md)
- [Contributing](docs/CONTRIBUTING.md)

## License

MIT
