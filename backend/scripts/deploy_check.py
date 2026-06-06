#!/usr/bin/env python3
"""
Pre-deployment verification script.

Checks:
1. Database migration status
2. Environment variables
3. Test suite
4. Code quality

Run before deploying to production.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def check_env_vars():
    """Check required environment variables."""
    print("\n🔍 Checking environment variables...")
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_KEY",
        "GROQ_API_KEY",
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
            print(f"  ❌ {var} — NOT SET")
        else:
            value = os.getenv(var)
            masked = value[:8] + "..." if len(value) > 8 else "***"
            print(f"  ✅ {var} — {masked}")
    
    if missing:
        print(f"\n❌ Missing {len(missing)} required environment variable(s)")
        return False
    
    print(f"\n✅ All environment variables configured")
    return True


async def check_database_connection():
    """Check database connectivity."""
    print("\n🔍 Checking database connection...")
    
    try:
        from app.database import get_supabase_client
        
        db = get_supabase_client()
        response = db.table("papers").select("id", count="exact").limit(1).execute()
        
        print(f"  ✅ Connected to Supabase")
        print(f"  📊 Papers in database: {response.count}")
        return True
        
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False


async def check_migration_status():
    """Check if migration 002 has been applied."""
    print("\n🔍 Checking migration status...")
    
    try:
        from app.database import get_supabase_client
        
        db = get_supabase_client()
        
        # Check if exam_category column exists
        response = db.table("papers").select("id, exam_category").limit(1).execute()
        
        if response.data and "exam_category" in response.data[0]:
            print(f"  ✅ Migration 002 applied (exam_category exists)")
            
            # Check if learner_profiles table exists
            try:
                response = db.table("learner_profiles").select("id", count="exact").limit(1).execute()
                print(f"  ✅ learner_profiles table exists ({response.count} profiles)")
            except:
                print(f"  ⚠️  learner_profiles table NOT found")
                return False
            
            return True
        else:
            print(f"  ❌ Migration 002 NOT applied (exam_category missing)")
            print(f"  💡 Run: supabase/migrations/002_add_exam_category_and_learner_profile.sql")
            return False
        
    except Exception as e:
        print(f"  ❌ Migration check failed: {e}")
        return False


async def check_backfill_status():
    """Check if papers have been backfilled with exam_category."""
    print("\n🔍 Checking backfill status...")
    
    try:
        from app.database import get_supabase_client
        
        db = get_supabase_client()
        
        # Count papers without exam_category
        response = db.table("papers").select("id", count="exact").is_("exam_category", "null").execute()
        null_count = response.count
        
        # Count total papers
        total_response = db.table("papers").select("id", count="exact").execute()
        total_count = total_response.count
        
        if null_count == 0:
            print(f"  ✅ All {total_count} papers have exam_category assigned")
            return True
        else:
            pct = (null_count / total_count * 100) if total_count > 0 else 0
            print(f"  ⚠️  {null_count}/{total_count} papers missing exam_category ({pct:.1f}%)")
            print(f"  💡 Run: python scripts/backfill_exam_categories.py")
            return False
        
    except Exception as e:
        print(f"  ❌ Backfill check failed: {e}")
        return False


async def check_classifier():
    """Check if exam classifier is working."""
    print("\n🔍 Testing exam classifier...")
    
    try:
        from app.utils.exam_classifier import classify_paper_from_label
        
        test_cases = [
            ("Data Structures Mid-1 Regular R22", "Mid-1", "R22"),
            ("Database Systems Semester Supplementary R20", "Semester", "R20"),
            ("Operating Systems Mid-2 R22", "Mid-2", "R22"),
        ]
        
        all_passed = True
        for title, expected_cat, expected_reg in test_cases:
            result = classify_paper_from_label(title)
            
            if result["exam_category"] == expected_cat and result["regulation"] == expected_reg:
                print(f"  ✅ '{title[:40]}...' → {result['exam_category']} {result['regulation']}")
            else:
                print(f"  ❌ '{title[:40]}...' → Expected {expected_cat} {expected_reg}, got {result['exam_category']} {result['regulation']}")
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"  ❌ Classifier test failed: {e}")
        return False


def check_tests():
    """Check if tests are passing."""
    print("\n🔍 Running test suite...")
    
    try:
        import subprocess
        
        result = subprocess.run(
            ["pytest", "tests/", "-v", "--tb=short"],
            cwd=Path(__file__).parent.parent,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # Count passed tests
            passed = result.stdout.count(" PASSED")
            print(f"  ✅ All tests passing ({passed} tests)")
            return True
        else:
            print(f"  ❌ Some tests failing")
            print(result.stdout[-500:])  # Last 500 chars
            return False
        
    except FileNotFoundError:
        print(f"  ⚠️  pytest not found (run: uv pip install pytest)")
        return None  # Not a blocker
    except Exception as e:
        print(f"  ⚠️  Test check failed: {e}")
        return None  # Not a blocker


async def main():
    """Run all checks."""
    print("=" * 60)
    print("PaperIQ — Pre-Deployment Verification")
    print("=" * 60)
    
    results = {
        "Environment Variables": check_env_vars(),
        "Database Connection": await check_database_connection(),
        "Migration Status": await check_migration_status(),
        "Backfill Status": await check_backfill_status(),
        "Exam Classifier": await check_classifier(),
        "Test Suite": check_tests(),
    }
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for check, passed in results.items():
        if passed is True:
            print(f"  ✅ {check}")
        elif passed is False:
            print(f"  ❌ {check}")
        else:
            print(f"  ⚠️  {check} (skipped)")
    
    # Determine if ready to deploy
    critical_checks = [
        "Environment Variables",
        "Database Connection",
        "Migration Status",
        "Exam Classifier",
    ]
    
    critical_passed = all(
        results.get(check, False) for check in critical_checks
    )
    
    print("\n" + "=" * 60)
    if critical_passed:
        print("✅ READY TO DEPLOY")
        print("\nNext steps:")
        print("  1. git add .")
        print("  2. git commit -m 'feat(mvp): exam classification + learner profile'")
        print("  3. git push origin main")
        print("  4. Railway will auto-deploy")
    else:
        print("❌ NOT READY TO DEPLOY")
        print("\nFix the issues above before deploying.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Check failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
