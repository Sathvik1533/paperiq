# Critical Fixes Implementation Plan

**Date**: June 6, 2026  
**Goal**: Fix 5 critical bugs before deployment  
**Timeline**: 1-2 days

---

## Fix Priority Order

### 🔴 FIX #1: PDF Download Functionality (CRITICAL - 4 hours)

**Problem**: No PDFs linked to papers in database  
**Impact**: Main KPI broken, users can't download papers

#### Option A: Link External URLs (Quick Fix - 30 mins)
If PDFs are already hosted online (college website):

```sql
-- Update papers with external PDF URLs
UPDATE papers 
SET original_url = 'https://mlrit.ac.in/examcell/papers/cse/r22/ds_may_2024.pdf'
WHERE subject_id = 'xxx' AND exam_year = 2024;
```

#### Option B: Upload to Supabase Storage (Complete Fix - 3-4 hours)

**Step 1**: Create upload script

```python
# backend/scripts/upload_missing_pdfs.py
import os
from pathlib import Path
from app.database import get_db
from supabase import create_client
import re

def find_local_pdfs():
    """Scan for PDFs in project directory"""
    pdf_dir = Path("/Users/k.sathvik/paperiq/papers")  # Adjust path
    return list(pdf_dir.glob("**/*.pdf"))

def upload_pdf_to_storage(pdf_path: Path, subject_code: str, year: int, month: str):
    """Upload PDF to Supabase storage"""
    db = get_db()
    
    # Storage path format: R22/A6CS05/2024_may.pdf
    storage_path = f"R22/{subject_code}/{year}_{month.lower()}.pdf"
    
    # Upload to Supabase storage
    with open(pdf_path, 'rb') as f:
        db.storage.from_('papers').upload(
            path=storage_path,
            file=f,
            file_options={"content-type": "application/pdf"}
        )
    
    # Update database record
    db.table('papers').update({
        'storage_path': storage_path
    }).eq('subject_id', subject_code).eq('exam_year', year).execute()
    
    print(f"✅ Uploaded {pdf_path.name} → {storage_path}")

def main():
    pdfs = find_local_pdfs()
    print(f"Found {len(pdfs)} PDFs")
    
    for pdf in pdfs:
        # Parse filename: DS_May_2024.pdf → subject=DS, month=May, year=2024
        # Adjust regex based on your filename format
        match = re.match(r'([A-Z0-9]+)_([A-Za-z]+)_(\d{4})\.pdf', pdf.name)
        if match:
            subject, month, year = match.groups()
            upload_pdf_to_storage(pdf, subject, int(year), month)

if __name__ == '__main__':
    main()
```

**Step 2**: Run the script
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/upload_missing_pdfs.py
```

**Step 3**: Verify frontend downloads work
```bash
# Test in browser:
# 1. Go to /papers/:paperId
# 2. Click "Download PDF"
# 3. PDF should open in new tab
```

---

### 🟡 FIX #2: Add Marks Distribution (HIGH - 2 hours)

**Problem**: Users can't see 1 mark, 5 marks, 10 marks breakdown

#### Backend API Addition

```python
# backend/app/api/analysis.py

@router.get("/analysis/{analysis_id}/marks-breakdown")
async def get_marks_breakdown(analysis_id: str):
    """Get question distribution by marks"""
    db = get_db()
    
    # Get analysis to find subject + regulation
    analysis = db.table('analysis_reports').select('subject_id, regulation').eq('id', analysis_id).single().execute()
    
    # Get all questions for this subject
    questions = db.table('questions').select('marks').eq('regulation', analysis.data['regulation']).execute()
    
    # Group by marks range
    breakdown = {
        '1-2': 0,    # Short answer
        '3-5': 0,    # Medium answer  
        '6-10': 0,   # Long answer
        '11+': 0     # Very long answer
    }
    
    for q in questions.data:
        marks = q.get('marks', 0)
        if marks <= 2:
            breakdown['1-2'] += 1
        elif marks <= 5:
            breakdown['3-5'] += 1
        elif marks <= 10:
            breakdown['6-10'] += 1
        else:
            breakdown['11+'] += 1
    
    total = sum(breakdown.values())
    
    return {
        'success': True,
        'data': {
            'breakdown': breakdown,
            'percentages': {k: round(v/total*100, 1) for k, v in breakdown.items()},
            'total_questions': total
        }
    }
```

#### Frontend Component Addition

```tsx
// frontend/src/components/MarksBreakdown.tsx

export function MarksBreakdown({ analysisId }: { analysisId: string }) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch(`/api/v1/analysis/${analysisId}/marks-breakdown`)
      .then(r => r.json())
      .then(d => setData(d.data))
  }, [analysisId])
  
  if (!data) return <div>Loading...</div>
  
  return (
    <div className="glass-card rounded-xl p-lg">
      <h3 className="font-headline text-body-lg font-bold mb-base">
        Question Weight Distribution
      </h3>
      
      {Object.entries(data.breakdown).map(([range, count]) => (
        <div key={range} className="mb-base">
          <div className="flex justify-between mb-xs">
            <span>{range} Marks</span>
            <span className="font-bold">{count} questions ({data.percentages[range]}%)</span>
          </div>
          <div className="w-full bg-surface-container-highest h-2 rounded-full">
            <div 
              className="bg-primary h-full rounded-full"
              style={{ width: `${data.percentages[range]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### Add to Analysis Page

```tsx
// frontend/src/pages/Analysis.tsx

// Add import
import { MarksBreakdown } from '../components/MarksBreakdown'

// Add in the render, after "Most Asked Topics" section
<MarksBreakdown analysisId={report.id} />
```

---

### 🔍 FIX #3: Global Search (HIGH - 3 hours)

**Problem**: Users get lost navigating between pages

#### Install Dependencies

```bash
cd /Users/k.sathvik/paperiq/frontend
bun add cmdk
```

#### Create Search Component

```tsx
// frontend/src/components/CommandPalette.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import './CommandPalette.css'

interface SearchResult {
  id: string
  title: string
  type: 'page' | 'paper' | 'subject' | 'topic'
  url: string
  icon: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const navigate = useNavigate()

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Search function
  useEffect(() => {
    if (!search) {
      setResults([
        { id: '1', title: 'Dashboard', type: 'page', url: '/dashboard', icon: 'home' },
        { id: '2', title: 'Papers Browser', type: 'page', url: '/papers', icon: 'description' },
        { id: '3', title: 'Profile', type: 'page', url: '/profile', icon: 'person' },
        { id: '4', title: 'Settings', type: 'page', url: '/settings', icon: 'settings' },
      ])
      return
    }

    // Search papers, subjects, topics in database
    fetch(`/api/v1/search?q=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(data => setResults(data.results))
  }, [search])

  const handleSelect = (url: string) => {
    setOpen(false)
    navigate(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-start justify-center pt-[20vh]">
      <Command className="bg-surface rounded-2xl shadow-2xl w-[640px] max-w-[90vw] max-h-[400px] overflow-hidden">
        <div className="flex items-center border-b border-outline-variant px-lg py-md">
          <span className="material-symbols-outlined text-on-surface-variant mr-sm">search</span>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search papers, subjects, topics, pages..."
            className="flex-1 bg-transparent outline-none text-on-surface"
          />
          <kbd className="text-xs text-on-surface-variant bg-surface-container px-sm py-xs rounded">Esc</kbd>
        </div>

        <Command.List className="p-sm max-h-[300px] overflow-y-auto">
          {results.length === 0 && (
            <div className="text-center py-xl text-on-surface-variant">
              No results found
            </div>
          )}

          {results.map(result => (
            <Command.Item
              key={result.id}
              value={result.title}
              onSelect={() => handleSelect(result.url)}
              className="flex items-center gap-sm px-lg py-md rounded-lg hover:bg-primary-container cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                {result.icon}
              </span>
              <div className="flex-1">
                <div className="font-bold">{result.title}</div>
                <div className="text-xs text-on-surface-variant">{result.type}</div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                arrow_forward
              </span>
            </Command.Item>
          ))}
        </Command.List>
      </Command>

      <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  )
}
```

#### Add CSS

```css
/* frontend/src/components/CommandPalette.css */

[cmdk-root] {
  font-family: inherit;
}

[cmdk-input] {
  font-size: 16px;
}

[cmdk-item][data-selected="true"] {
  background: var(--primary-container);
}
```

#### Add to App

```tsx
// frontend/src/App.tsx

import { CommandPalette } from './components/CommandPalette'

function App() {
  return (
    <>
      <CommandPalette />
      {/* rest of app */}
    </>
  )
}
```

#### Backend Search Endpoint

```python
# backend/app/api/search.py

from fastapi import APIRouter, Query
from app.database import get_db

router = APIRouter()

@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    """Global search across papers, subjects, topics"""
    db = get_db()
    results = []
    
    # Search papers
    papers = db.table('papers').select('id, title, subject_id').ilike('title', f'%{q}%').limit(5).execute()
    for p in papers.data:
        results.append({
            'id': p['id'],
            'title': p['title'],
            'type': 'paper',
            'url': f'/papers/{p["id"]}',
            'icon': 'description'
        })
    
    # Search subjects
    subjects = db.table('subjects').select('id, name').ilike('name', f'%{q}%').limit(5).execute()
    for s in subjects.data:
        results.append({
            'id': s['id'],
            'title': s['name'],
            'type': 'subject',
            'url': f'/analysis?subject_id={s["id"]}',
            'icon': 'book'
        })
    
    return {'success': True, 'results': results}
```

#### Register Router

```python
# backend/app/main.py

from app.api import search

app.include_router(search.router, prefix="/api/v1", tags=["search"])
```

---

### 💾 FIX #4: Git Commit Everything (CRITICAL - 30 mins)

**Problem**: Large uncommitted changes, no history

#### Step 1: Check Current Status

```bash
cd /Users/k.sathvik/paperiq
git status
```

#### Step 2: Stage and Commit by Feature

```bash
# Commit backend changes
git add backend/
git commit -m "feat(backend): Add analysis API with classification + PDF support

- Integrated classification-based analysis features
- Added marks breakdown endpoint
- Fixed question year filtering
- Added search endpoint for command palette
- All 10 R22 CSE subjects validated"

# Commit frontend changes
git add frontend/
git commit -m "feat(frontend): Complete MVP screens (Landing → PaperView)

- Generated all 9 MVP screens from Stitch designs
- Fixed Papers page date display bugs
- Added hall ticket onboarding flow
- Integrated analysis results visualization
- Fixed mobile responsiveness"

# Commit database migrations
git add supabase/
git commit -m "data(db): Add classification columns + analysis schema

- Applied migration 002 (exam_category, learner_profile)
- Added classification columns (topic_name, unit_name, confidence)
- Updated v_questions_regulated view with new columns
- Added indexes for performance"

# Commit documentation
git add *.md
git commit -m "docs: Add session status, validation reports, and bug audit

- SESSION_STATUS.md: Complete validation report
- CRITICAL_BUGS_AUDIT.md: Pre-deployment bug list
- MVP_VERIFICATION_REPORT.md: End-to-end testing results
- ANALYSIS_INTEGRATION_COMPLETE.md: Classification pipeline docs"
```

#### Step 3: Create Git Hook for Future Commits

```bash
# Create commit message hook
cat > .git/hooks/prepare-commit-msg << 'EOF'
#!/bin/bash
# Prompt for commit type if not already prefixed

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

if [ -z "$COMMIT_SOURCE" ]; then
  echo ""
  echo "Choose commit type:"
  echo "  1) feat     - New feature"
  echo "  2) fix      - Bug fix"
  echo "  3) ux       - UX improvement"
  echo "  4) data     - Database/data changes"
  echo "  5) docs     - Documentation"
  echo "  6) refactor - Code refactoring"
  echo ""
  read -p "Enter number (1-6): " choice
  
  case $choice in
    1) PREFIX="feat" ;;
    2) PREFIX="fix" ;;
    3) PREFIX="ux" ;;
    4) PREFIX="data" ;;
    5) PREFIX="docs" ;;
    6) PREFIX="refactor" ;;
    *) PREFIX="feat" ;;
  esac
  
  read -p "Scope (e.g., backend, frontend, db): " SCOPE
  
  # Prepend to commit message
  CURRENT_MSG=$(cat "$COMMIT_MSG_FILE")
  echo "$PREFIX($SCOPE): $CURRENT_MSG" > "$COMMIT_MSG_FILE"
fi
EOF

chmod +x .git/hooks/prepare-commit-msg
```

---

### 📅 FIX #5: Backfill Exam Dates (MEDIUM - 1 hour)

**Problem**: 77/80 papers have NULL exam_year, show "Past Paper"

#### Run Existing Script

```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/backfill_exam_categories.py
```

#### If Script Doesn't Exist, Create It

```python
# backend/scripts/backfill_exam_dates.py

import re
from app.database import get_db

def extract_date_from_title(title: str):
    """Extract year and month from paper title"""
    # Match patterns like "May 2024", "R22 2023", "Mid-1 2024"
    year_match = re.search(r'(20\d{2})', title)
    month_match = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)', title, re.IGNORECASE)
    
    year = int(year_match.group(1)) if year_match else None
    month = month_match.group(1).capitalize() if month_match else None
    
    # Detect exam category
    if 'Mid' in title or 'Internal' in title:
        category = 'Mid-Term'
    elif 'Semester' in title or 'Final' in title:
        category = 'Semester'
    else:
        category = 'Unknown'
    
    return year, month, category

def main():
    db = get_db()
    
    # Get all papers with NULL year
    papers = db.table('papers').select('id, title').is_('exam_year', 'null').execute()
    
    updated = 0
    for paper in papers.data:
        year, month, category = extract_date_from_title(paper['title'])
        
        if year:
            db.table('papers').update({
                'exam_year': year,
                'exam_month': month,
                'exam_category': category
            }).eq('id', paper['id']).execute()
            
            print(f"✅ Updated: {paper['title']} → {category} {month} {year}")
            updated += 1
    
    print(f"\n✅ Updated {updated} / {len(papers.data)} papers")

if __name__ == '__main__':
    main()
```

---

## Testing Checklist

After implementing all fixes, test:

### PDF Download
- [ ] Navigate to `/papers/:paperId`
- [ ] Click "Download PDF" button
- [ ] PDF opens in new tab
- [ ] PDF is the correct paper

### Marks Distribution
- [ ] Navigate to `/analysis/:id`
- [ ] Scroll to "Question Weight Distribution" section
- [ ] See breakdown: 1-2 marks, 3-5 marks, 6-10 marks, 11+ marks
- [ ] Percentages add up to 100%

### Global Search
- [ ] Press `Cmd+K` (or `Ctrl+K` on Windows)
- [ ] Command palette opens
- [ ] Type "Data Structures" → shows papers and subjects
- [ ] Click a result → navigates to correct page
- [ ] Press `Esc` → closes palette

### Git History
- [ ] Run `git log --oneline`
- [ ] See descriptive commit messages with prefixes
- [ ] Each commit is focused on one feature/fix

### Paper Dates
- [ ] Navigate to `/papers`
- [ ] Papers show "May 2024" instead of "Past Paper"
- [ ] Filter by year works correctly

---

## Deployment Steps (After Fixes)

```bash
# 1. Run all tests
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
pytest

cd ../frontend
bun test

# 2. Build frontend
bun run build

# 3. Commit final fixes
git add .
git commit -m "fix: Complete pre-deployment critical fixes

- Connected PDF storage to download buttons
- Added marks distribution visualization
- Implemented global search (Cmd+K)
- Backfilled exam dates for 77 papers
- Committed all changes with proper history"

# 4. Push to repository
git push origin main

# 5. Deploy to production
# (Vercel, Netlify, or your hosting platform)
```

---

## Estimated Total Time

| Fix | Time | Priority |
|-----|------|----------|
| #1: PDF Upload | 3-4 hours | 🔴 CRITICAL |
| #2: Marks Breakdown | 2 hours | 🟡 HIGH |
| #3: Global Search | 3 hours | 🟡 HIGH |
| #4: Git Commits | 30 mins | 🔴 CRITICAL |
| #5: Backfill Dates | 1 hour | 🟠 MEDIUM |
| **TOTAL** | **9-10 hours** | **1-2 days** |

---

## Post-Deployment Monitoring

After deploying, monitor:

1. **PDF Download Success Rate**: Track how many users successfully download PDFs
2. **Search Usage**: Track Cmd+K usage and search queries
3. **Error Rate**: Monitor for 404s, 500s, or broken pages
4. **User Feedback**: Collect beta tester feedback on fixes

---

**Ready to Start?**
1. Begin with FIX #1 (PDF Upload) - it's the main KPI
2. Then FIX #4 (Git Commits) - preserve history
3. Then FIX #2 and #3 (Marks + Search) - improve UX
4. Finally FIX #5 (Dates) - polish data quality

