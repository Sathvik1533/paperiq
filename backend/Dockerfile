# ── Stage 1: Python dependencies ──────────────────────────────────
FROM python:3.11-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    unar libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Application ─────────────────────────────────────────
FROM python:3.11-slim AS app

WORKDIR /app

# Install only runtime system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    unar libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY app/ ./app/
COPY gunicorn.conf.py .

EXPOSE 8000

# Production: Gunicorn with Uvicorn workers for max concurrency
CMD ["sh", "-c", "gunicorn app.main:app --config gunicorn.conf.py --bind 0.0.0.0:${PORT:-8000}"]
