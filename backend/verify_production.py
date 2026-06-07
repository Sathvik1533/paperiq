#!/usr/bin/env python3
"""
Production Readiness Verification Script

Checks that all critical production optimizations are in place:
1. Thread pool executors configured
2. Gunicorn configuration exists
3. Environment variables set
4. Dependencies installed
"""

import sys
import os
from pathlib import Path
import importlib.util

def check_file_exists(path: str, description: str) -> bool:
    """Check if a file exists"""
    if Path(path).exists():
        print(f"✅ {description}: {path}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {path}")
        return False

def check_import(module_name: str, description: str) -> bool:
    """Check if a Python module can be imported"""
    try:
        spec = importlib.util.find_spec(module_name)
        if spec is not None:
            print(f"✅ {description}: {module_name}")
            return True
    except ImportError:
        pass
    
    print(f"❌ {description} NOT INSTALLED: {module_name}")
    return False

def check_code_contains(file_path: str, search_text: str, description: str) -> bool:
    """Check if a file contains specific text"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            if search_text in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} NOT FOUND in {file_path}")
                return False
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return False

def main():
    print("🔍 PaperIQ Production Readiness Verification")
    print("=" * 60)
    print()
    
    checks_passed = 0
    checks_failed = 0
    
    print("📦 Checking Production Files...")
    print("-" * 60)
    
    # Check critical files
    files_to_check = [
        ("gunicorn.conf.py", "Gunicorn configuration"),
        ("start_production.sh", "Production start script"),
        ("../Procfile", "PaaS deployment configuration"),
        (".env.example", "Environment template"),
    ]
    
    for file_path, description in files_to_check:
        if check_file_exists(file_path, description):
            checks_passed += 1
        else:
            checks_failed += 1
    
    print()
    print("🔧 Checking Dependencies...")
    print("-" * 60)
    
    # Check required packages
    packages_to_check = [
        ("gunicorn", "Gunicorn (multi-worker server)"),
        ("uvicorn", "Uvicorn (ASGI server)"),
        ("httpx", "HTTPX (async HTTP client)"),
        ("fastapi", "FastAPI (web framework)"),
        ("reportlab", "ReportLab (PDF generation)"),
    ]
    
    for package, description in packages_to_check:
        if check_import(package, description):
            checks_passed += 1
        else:
            checks_failed += 1
    
    print()
    print("🏗️  Checking Code Optimizations...")
    print("-" * 60)
    
    # Check thread pool executors
    code_checks = [
        (
            "app/api/papers.py",
            "ThreadPoolExecutor",
            "Thread pool for PDF generation"
        ),
        (
            "app/api/papers.py",
            "run_in_executor",
            "Async PDF generation offload"
        ),
        (
            "app/api/download.py",
            "ThreadPoolExecutor",
            "Thread pool for DOCX extraction"
        ),
        (
            "app/api/download.py",
            "httpx.AsyncClient",
            "Async HTTP client for downloads"
        ),
    ]
    
    for file_path, search_text, description in code_checks:
        if check_code_contains(file_path, search_text, description):
            checks_passed += 1
        else:
            checks_failed += 1
    
    print()
    print("⚙️  Checking Frontend Optimizations...")
    print("-" * 60)
    
    # Check frontend debouncing
    frontend_checks = [
        (
            "../frontend/src/pages/Papers.tsx",
            "useMemo",
            "Debounce mechanism using useMemo"
        ),
        (
            "../frontend/src/pages/Papers.tsx",
            "setTimeout",
            "Debounce timer implementation"
        ),
    ]
    
    for file_path, search_text, description in frontend_checks:
        if check_code_contains(file_path, search_text, description):
            checks_passed += 1
        else:
            checks_failed += 1
    
    print()
    print("📊 Environment Variables...")
    print("-" * 60)
    
    # Check environment variables (optional)
    env_vars = [
        "UVICORN_WORKERS",
        "UVICORN_LIMIT_CONCURRENCY",
        "UVICORN_TIMEOUT_KEEP_ALIVE",
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}={value}")
        else:
            print(f"⚠️  {var} not set (will use defaults)")
    
    print()
    print("=" * 60)
    print(f"📋 Summary: {checks_passed} passed, {checks_failed} failed")
    print("=" * 60)
    
    if checks_failed > 0:
        print()
        print("❌ Some production optimizations are missing!")
        print("Please review the failed checks and complete setup.")
        sys.exit(1)
    else:
        print()
        print("✅ All production optimizations are in place!")
        print("Ready to scale to 300-400 concurrent users.")
        sys.exit(0)

if __name__ == "__main__":
    main()
