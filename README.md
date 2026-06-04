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
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python 3.11 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + Google OAuth |
| Storage | Supabase Storage |
| Automation | Playwright |
| Document Processing | PyMuPDF + python-docx |
| LLM (primary) | Groq (Llama / Qwen / DeepSeek) |
| LLM (failover) | OpenRouter → Ollama |

## Milestones

| # | Milestone | Status |
|---|---|---|
| 1 | MLRIT Scraper | ✅ Complete |
| 2 | Document Extraction Engine | ✅ Complete |
| 3 | Question Parsing & Storage | ✅ Complete |
| 4 | Pattern Analysis Engine | ✅ Complete |
| 5 | Personalized Study Planner | ✅ Complete |
| 6 | Dashboard & Frontend | ✅ Complete |
| 7 | Deployment & Polish | ✅ Complete |

## Quick Start

See [docs/SETUP.md](docs/SETUP.md) for full instructions.

### Backend
```bash
git clone https://github.com/Sathvik1533/paperiq.git
cd paperiq

# Create venv with Python 3.11
python3.11 -m venv .venv
source .venv/bin/activate

cd backend
pip install -r requirements.txt
playwright install chromium
cp .env.example .env    # fill in SUPABASE_URL, SERVICE_KEY, GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/api/v1/health`

### Frontend
```bash
cd frontend
bun install
cp .env.example .env    # fill in Supabase URL + anon key
bun dev
```

Open: http://localhost:5173

### Deploy Frontend to Vercel
```bash
cd frontend
vercel --prod
```

## API Endpoints

| Group | Endpoints |
|---|---|
| System | `GET /health`, `GET /llm/health` |
| Academic | `GET /colleges`, `GET /subjects` |
| Scraping | `POST /scrape/trigger`, `GET /scrape/jobs/{id}` |
| Papers | `GET /papers`, `GET /papers/{id}` |
| Extraction | `POST /extract/run`, `POST /syllabus/upload` |
| Questions | `POST /parse/run`, `GET /questions`, `GET /parse/preview` |
| Analysis | `POST /analysis/run`, `GET /analysis/{id}` |
| Planner | `POST /planner/generate`, `POST /readiness/calculate`, `POST /mock/generate` |

Full API docs: `http://localhost:8000/api/v1/docs`

## Test Suite

```bash
cd backend
pytest tests/ -v
# 137 tests, 0 failures
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Regulation Architecture](docs/REGULATION_ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Contract](docs/API_CONTRACT.md)
- [Roadmap](docs/ROADMAP.md)
- [Setup Guide](docs/SETUP.md)
- [Contributing](docs/CONTRIBUTING.md)

## License

MIT
