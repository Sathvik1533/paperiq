# PaperIQ Backend Scripts

Utility scripts for database maintenance, deployment, and data processing.

---

## 📋 Available Scripts

### `backfill_exam_categories.py`
**Purpose:** Classify existing papers and populate `exam_category` column

**When to use:** After running migration `002_add_exam_category_and_learner_profile.sql`

**What it does:**
- Reads all papers with `exam_category = NULL`
- Classifies each paper using `exam_classifier.py`
- Updates database with detected exam category and regulation
- Shows progress and verification results

**Usage:**
```bash
cd backend
python scripts/backfill_exam_categories.py
```

**Example output:**
```
🔄 Starting exam_category backfill...
📥 Fetching papers without exam_category...
📊 Found 234 papers to classify
  [1/234] ✅ 3f8a9c12: Semester | Discrete Mathematics...
  ...
🎉 Backfill complete!
  ✅ Updated: 234 papers
  
📈 Papers by Exam Category:
  Mid-1    :   78 papers
  Mid-2    :   65 papers
  Semester :   89 papers
```

---

### `deploy_check.py`
**Purpose:** Pre-deployment verification — checks if system is ready to deploy

**When to use:** Before pushing to production (Railway/Vercel)

**What it checks:**
- ✅ Environment variables configured
- ✅ Database connection working
- ✅ Migration 002 applied
- ✅ Papers backfilled with exam_category
- ✅ Exam classifier functioning
- ✅ Test suite passing

**Usage:**
```bash
cd backend
python scripts/deploy_check.py
```

**Example output:**
```
🔍 Checking environment variables...
  ✅ SUPABASE_URL — https://...
  ✅ SUPABASE_SERVICE_KEY — eyJ...
  
🔍 Checking database connection...
  ✅ Connected to Supabase
  
🔍 Checking migration status...
  ✅ Migration 002 applied
  
✅ READY TO DEPLOY
```

---

## 🚀 Typical Deployment Workflow

**Step 1:** Apply database migration
```sql
-- In Supabase SQL Editor
\i supabase/migrations/002_add_exam_category_and_learner_profile.sql
```

**Step 2:** Backfill existing data
```bash
python scripts/backfill_exam_categories.py
```

**Step 3:** Verify everything works
```bash
python scripts/deploy_check.py
```

**Step 4:** Deploy
```bash
git add .
git commit -m "feat(mvp): exam classification system"
git push origin main
```

---

## 🐛 Troubleshooting

### Script fails with "No module named 'app'"
```bash
# Install backend as editable package
cd backend
uv pip install -e .
```

### Database connection errors
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Test connection manually
python -c "
from app.database import get_supabase_client
db = get_supabase_client()
print(db.table('papers').select('id').limit(1).execute())
"
```

### Backfill classifies papers as "Unknown"
```bash
# Test classifier with actual paper title
python -c "
from app.utils.exam_classifier import classify_paper_from_label
print(classify_paper_from_label('Your Paper Title Here'))
"

# Check if title matches detection patterns in:
# backend/app/utils/exam_classifier.py
```

---

## 📝 Script Requirements

**All scripts require:**
- Python 3.11+
- uv package manager
- Backend dependencies installed (`uv pip install -e .`)
- Environment variables configured (`.env.local` or system)

**Required environment variables:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
GROQ_API_KEY=gsk_...
```

---

## 🔒 Safety Notes

**Backfill script:**
- ✅ Safe to run multiple times (only updates NULL values)
- ✅ Does not delete or overwrite existing classifications
- ✅ Shows progress for each paper

**Deploy check script:**
- ✅ Read-only — does not modify database
- ✅ Safe to run anytime
- ✅ Will not break existing data

---

## 📊 Adding New Scripts

**Template for new maintenance scripts:**
```python
#!/usr/bin/env python3
"""
Brief description of what this script does.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_supabase_client


async def main():
    """Main script logic."""
    print("🔄 Starting script...")
    
    db = get_supabase_client()
    
    # Your logic here
    
    print("✅ Script complete")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Failed: {e}")
        sys.exit(1)
```

---

## 🎯 Future Scripts (Planned)

- `discover_syllabus.py` — Auto-discover MLRIT syllabus URLs
- `audit_papers.py` — Check paper data quality
- `generate_test_data.py` — Create sample data for development
- `migrate_legacy_data.py` — Import old format papers

---

**Need help?** Check `docs/DEPLOYMENT_GUIDE.md` for complete deployment instructions.
