# PaperIQ — Setup Guide

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 20+ |
| Bun | latest |
| unar | latest (`brew install unar` / `apt install unar`) |

## 1. Clone

```bash
git clone https://github.com/Sathvik1533/paperiq.git
cd paperiq
```

## 2. Supabase

1. Create project at supabase.com
2. Run migration: paste `supabase/migrations/001_initial_schema.sql` in SQL editor
3. Run seed: paste `supabase/seed.sql`
4. Enable Google OAuth in Auth → Providers
5. Create storage bucket named `papers`

## 3. Backend

```bash
cd backend
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Edit .env with your Supabase + Groq keys
uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/api/v1/health`

## 4. Frontend

```bash
cd frontend
bun install
cp .env.example .env
# Edit .env with Supabase URL + anon key
bun dev
```

Open: http://localhost:5173

## 5. LLM Keys

- **Groq** (required): free at console.groq.com
- **OpenRouter** (optional failover): free at openrouter.ai
- **Ollama** (optional local): run `ollama pull qwen2.5:7b`

## 6. Trigger First Scrape

```bash
curl -X POST http://localhost:8000/api/v1/scrape/trigger \
  -H 'Content-Type: application/json' \
  -d '{"college_id": "a0000000-0000-0000-0000-000000000001", "year_from": 2024, "year_to": 2025}'
```
