FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y unar wget curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install chromium --with-deps

COPY app/ ./app/

EXPOSE 8000

# Production: 4 workers handles ~200 concurrent users comfortably
# Each worker is async (uvicorn) so handles many requests concurrently within itself
# $WEB_CONCURRENCY env var lets Railway/Render override this at deploy time
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-4}"]
