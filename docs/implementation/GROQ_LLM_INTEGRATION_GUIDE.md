# Groq LLM Integration Guide for PaperIQ AI Companion

**Date**: November 14, 2026  
**Provider**: Groq Cloud Platform (`groq` Python SDK)  
**Primary Configured Model**: `openai/gpt-oss-120b` (Default fallback: `llama-3.3-70b-versatile`)  
**Fast Model**: `openai/gpt-oss-20b` (Default fallback: `llama-3.1-8b-instant`)  
**Reasoning Model**: `deepseek-r1-distill-llama-70b`  
**Status**: ✅ Fully Integrated, Tier-Compatible & Verified Behind Abstraction

---

## 1. Architectural Overview

PaperIQ utilizes **Groq API** as the primary high-throughput, low-latency LLM inference provider for the **PaperIQ AI Companion** (`/companion`) and academic analysis engines.

```
+-----------------------------------------------------------------------------------+
|                           PaperIQ Client / Frontend                               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (POST /api/v1/companion/chat)
+-----------------------------------------------------------------------------------+
|                              FastAPI Backend                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                       CompanionOrchestrator                               |   |
|   |   - Intent Routing (Academic Tutor, Syllabus, PYQs, Planner, Docs)        |   |
|   |   - Database Context & Syllabus Retrieval (MLRIT R22 Grounding)           |   |
|   +---------------------------------------------------------------------------+   |
|                                        │                                          |
|                                        ▼                                          |
|   +---------------------------------------------------------------------------+   |
|   |                   LLM Provider Abstraction Layer                          |   |
|   |                                                                           |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |   |           FailoverRouter (Circuit Breaker & Backoff)              |   |   |
|   |   |   - Exponential Backoff with Full Jitter for 429 Rate Limits      |   |   |
|   |   |   - 60s Circuit Breaker Cooldown on Persistent Failures           |   |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |                                    │                                      |   |
|   |                                    ▼                                      |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |   |           GroqProvider (Official groq AsyncGroq SDK)              |   |   |
|   |   |   - Config: GROQ_API_KEY, GROQ_MODEL, GROQ_MODEL_FAST, etc.       |   |   |
|   |   |   - Model-Tier Resolver (FAST, MEDIUM, REASONING)                 |   |   |
|   |   |   - Non-blocking async completions with timeout protection        |   |   |
|   |   +-------------------------------------------------------------------+   |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Async HTTPS API Call)
+-----------------------------------------------------------------------------------+
|                               Groq Cloud API                                      |
|   - Primary / Medium: openai/gpt-oss-120b (Conversational & Academic Synthesis)   |
|   - Reasoning: deepseek-r1-distill-llama-70b (Complex Proofs & Algorithmic Traces)|
|   - Fast: openai/gpt-oss-20b (Ultra-fast Intent Tagging & Classification)         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Configuration & Environment Variables

All Groq configurations are managed through FastAPI's `pydantic-settings` engine in `backend/app/config.py` with direct bindings to all model tiers.

### Required & Supported Variables:

| Environment Variable | Description | Default Value | Recommended Production Value |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | Private Groq Cloud API key (format: `gsk_...`) | `""` (Empty string) | Your private Groq API key |
| `GROQ_MODEL` | Primary model for conversational tasks & synthesis | `openai/gpt-oss-120b` | `openai/gpt-oss-120b` |
| `GROQ_MODEL_FAST` | Fast model for classification & quick tagging | `openai/gpt-oss-20b` | `openai/gpt-oss-20b` |
| `GROQ_MODEL_MEDIUM` | Balanced model for pattern analysis | `openai/gpt-oss-120b` | `openai/gpt-oss-120b` |
| `GROQ_MODEL_REASONING` | High-reasoning model for proofs & math | `deepseek-r1-distill-llama-70b` | `deepseek-r1-distill-llama-70b` |
| `LLM_PROVIDER_ORDER` | Priority order for router | `groq,openrouter,ollama` | `groq` |
| `LLM_REQUEST_TIMEOUT_SECONDS` | Maximum timeout before tripping circuit | `30` | `30` |
| `LLM_FAILOVER_COOLDOWN_SECONDS`| Cooldown period for tripped provider | `60` | `60` |

---

## 3. Local Development Setup

### Step 1: Copy Environment Template
Create your private `backend/.env` file from the updated template:
```bash
cp backend/.env.example backend/.env
```

### Step 2: Configure Groq Variables
In `backend/.env`, set your `GROQ_API_KEY` and desired model:
```ini
LLM_PROVIDER_ORDER=groq
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_MODEL_FAST=openai/gpt-oss-20b
GROQ_MODEL_MEDIUM=openai/gpt-oss-120b
GROQ_MODEL_REASONING=deepseek-r1-distill-llama-70b
LLM_REQUEST_TIMEOUT_SECONDS=30
```

> [!IMPORTANT]
> `backend/.env` is strictly ignored by Git in `.gitignore`. Never commit or push any `.env` file containing live credentials.

### Step 3: Run Backend Tests
Verify the installation using mocked test suite:
```bash
pytest backend/tests/test_groq_llm_integration.py
```

---

## 4. Render Production Deployment Configuration

To enable Groq on Render's Web Service (`paperiq-backend`):

1. **Log in to Render Dashboard**: Navigate to [dashboard.render.com](https://dashboard.render.com).
2. **Select Web Service**: Open `paperiq-backend` (or your backend service).
3. **Navigate to Environment**:
   - Go to the **Environment** tab on the left sidebar.
4. **Add the following Environment Variables**:
   - `GROQ_API_KEY`: Paste your live Groq API key (`gsk_...`).
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
   - `GROQ_MODEL_FAST`: `openai/gpt-oss-20b`
   - `GROQ_MODEL_MEDIUM`: `openai/gpt-oss-120b`
   - `GROQ_MODEL_REASONING`: `deepseek-r1-distill-llama-70b`
   - `LLM_PROVIDER_ORDER`: `groq`
   - `LLM_REQUEST_TIMEOUT_SECONDS`: `30`
   - `LLM_FAILOVER_COOLDOWN_SECONDS`: `60`
5. **Save Changes & Deploy**:
   - Click **Save Changes**. Render will automatically restart the instance and initialize the Groq provider.

---

## 5. Security & Grounding Safeguards

1. **Zero Secret Leakage**:
   - `GROQ_API_KEY` is loaded exclusively into backend memory.
   - The key is **never** sent in API responses or exposed to the Vite frontend SPA.
2. **Anti-Hallucination Curriculum Grounding**:
   - Prompts sent to Groq are strictly injected with database-retrieved past questions, unit boundaries, and textbook references.
   - The system prompt instructs Groq:
     > *"You are PaperIQ, an expert academic tutor and exam intelligence assistant for engineering students under MLRIT autonomous R22 curriculum. Ground all explanations strictly in official curriculum, syllabus topics, and textbook standards. Never hallucinate non-existent course codes or past papers."*
3. **Resilient Deterministic Fallback & Visible Metadata**:
   - When Groq succeeds, API responses and messages carry `provider: "groq"`, `model_used: "<model_id>"`, and `is_fallback: false`.
   - If Groq encounters rate limits or deprecated model errors, the provider logs an error and trips the circuit breaker.
   - When all providers are exhausted, the system serves grounded deterministic R22 curriculum solutions and transparently reports `provider: "fallback"`, `model_used: "deterministic_fallback"`, and `is_fallback: true`.
   - Silent fallbacks are strictly eliminated.

---

## 6. Health & Diagnostic Endpoints

The backend exposes inspection endpoints for checking LLM connectivity without exposing secrets:

- **Check Active Provider**:
  ```http
  GET /api/v1/llm/active
  ```
  *Response*:
  ```json
  {
    "success": true,
    "data": {
      "active_provider": "groq"
    }
  }
  ```

- **Check Provider Health & Models**:
  ```http
  GET /api/v1/llm/health
  ```
  *Response*:
  ```json
  {
    "success": true,
    "data": {
      "providers": [
        {
          "name": "groq",
          "status": "available",
          "cooldown_remaining_seconds": 0,
          "models": {
            "fast": "openai/gpt-oss-20b",
            "medium": "openai/gpt-oss-120b",
            "reasoning": "deepseek-r1-distill-llama-70b"
          }
        }
      ],
      "active": "groq"
    }
  }
  ```
