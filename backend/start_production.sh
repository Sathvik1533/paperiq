#!/bin/bash
#
# Production Start Script for PaperIQ API
# Optimized for 300-400 concurrent users with multi-worker configuration
#
# Usage: ./start_production.sh
#

set -e

echo "🚀 Starting PaperIQ API in Production Mode"
echo "=========================================="

# Check if gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "❌ Error: Gunicorn not installed"
    echo "Install with: pip install gunicorn"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Must run from backend/ directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    echo "✅ Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env file not found"
fi

# Calculate optimal worker count
CPU_CORES=$(python3 -c "import multiprocessing; print(multiprocessing.cpu_count())")
WORKERS=${UVICORN_WORKERS:-$((CPU_CORES * 2 + 1))}

echo "📊 Configuration:"
echo "  - CPU Cores: $CPU_CORES"
echo "  - Workers: $WORKERS"
echo "  - Worker Class: uvicorn.workers.UvicornWorker"
echo "  - Bind: 0.0.0.0:${PORT:-8000}"
echo "  - Timeout: 120s"
echo "  - Max Requests: 1000"
echo ""

# Start Gunicorn with Uvicorn workers
echo "🔥 Starting server..."
exec gunicorn app.main:app \
  --workers "$WORKERS" \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:${PORT:-8000}" \
  --timeout 120 \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 50 \
  --backlog 2048 \
  --access-logfile - \
  --error-logfile - \
  --log-level info \
  --graceful-timeout 30 \
  --worker-connections 1000
