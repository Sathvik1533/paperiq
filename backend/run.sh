#!/usr/bin/env bash
# PaperIQ Production Server
# Gunicorn + Uvicorn workers for async FastAPI — handles 400-500 concurrent users
# Usage: bash run.sh
# Workers formula: (2 × CPU_cores) + 1  →  default 4 for typical 2-core cloud instance

set -e

export PYTHONPATH="${PYTHONPATH}:$(pwd)"

CPU_CORES=$(python3 -c "import os; print(os.cpu_count() or 2)")
WORKERS=$((CPU_CORES * 2 + 1))
# Cap at 9 workers to avoid DB connection pool exhaustion
if [ "$WORKERS" -gt 9 ]; then WORKERS=9; fi

echo "🚀 Starting PaperIQ backend"
echo "   Workers : $WORKERS (${CPU_CORES} CPU cores × 2 + 1)"
echo "   Host    : 0.0.0.0:8000"
echo "   Class   : uvicorn.workers.UvicornWorker"

exec gunicorn app.main:app \
  --workers "$WORKERS" \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --keepalive 5 \
  --max-requests 1000 \
  --max-requests-jitter 50 \
  --access-logfile - \
  --error-logfile - \
  --log-level info
