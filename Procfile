# Procfile for Production Deployment
# Used by Heroku, Render, Railway, and other PaaS platforms
#
# This configuration uses Gunicorn with Uvicorn workers for optimal concurrency
# Supports 300-400 concurrent users

web: cd backend && gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120 --keep-alive 5 --max-requests 1000 --max-requests-jitter 50 --backlog 2048
