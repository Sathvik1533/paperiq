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
| 1 | MLRIT Scraper | ✅ Complete |
| 2 | Document Extraction Engine | ✅ Complete |
| 3 | Question Parsing & Storage | ✅ Complete |
| 4 | Pattern Analysis Engine | ✅ Complete |
| 5 | Personalized Study Planner | ✅ Complete |
| 6 | Dashboard & Repository | ✅ Complete |
| 7 | Deployment & Polish | 🔄 In Progress |

## Development

### Running Locally

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
bun install
cp .env.example .env    # set VITE_API_URL=http://localhost:8000
bun dev
```

### Running Tests

```bash
cd backend
pytest tests/ --cov=app -q
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `SECRET_KEY` | Yes | JWT signing secret |
| `GROQ_API_KEY` | Yes | Groq LLM API key |
| `ENVIRONMENT` | No | `development` / `production` / `test` |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Contract](docs/API_CONTRACT.md)
- [Roadmap](docs/ROADMAP.md)
- [Setup Guide](docs/SETUP.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Regulation Architecture](docs/REGULATION_ARCHITECTURE.md)

## License

MIT
