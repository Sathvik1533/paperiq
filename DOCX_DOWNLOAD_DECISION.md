# DOCX Download Implementation Decision

**Date**: June 7, 2026  
**Decision**: Upload authentic MLRIT DOCX files to Supabase Storage

---

## Requirement

**Students must get authentic MLRIT DOCX question papers** - not generated PDFs, not RAR files, but the exact original college documents.

---

## Options Considered

### ❌ Option 1: User downloads RAR, unzips themselves
**Rejected**: Too complex for students. They'd have to:
- Download large RAR file (multiple papers)
- Install RAR extractor
- Unzip manually
- Find their specific paper
- Defeats purpose of PaperIQ

### ❌ Option 2: On-demand RAR extraction
**Rejected**: Technical complexity
- First download takes 30-60 seconds (download + extract)
- Dependency on MLRIT website uptime
- Complex caching logic needed
- `archive_path` is NULL in database

### ✅ Option 3: Upload DOCX to Supabase Storage (CHOSEN)
**Why this is best:**
- ✅ One-time setup (2-3 hours)
- ✅ Fast downloads forever (<1 second)
- ✅ Reliable (no external dependencies)
- ✅ Free (80 DOCX files ≈ 50MB, Supabase free tier: 1GB)
- ✅ Authentic MLRIT documents
- ✅ Simple architecture

---

## Implementation Plan

### Step 1: Run Upload Script (ONE TIME)
```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/restore_original_docx.py
```

**What it does:**
1. Downloads RAR archives from MLRIT website
2. Extracts original DOCX files
3. Uploads to Supabase Storage bucket: `papers`
4. Updates database `storage_path` column
5. Cleans up temp files

**Time**: 2-3 hours (mostly download/upload time)

### Step 2: Frontend Already Configured
Frontend code in `PaperView.tsx` already checks `storage_path`:

```typescript
function downloadPaper() {
  const downloadUrl = paper.storage_path 
    ? getStorageUrl(paper.storage_path)  // Supabase Storage
    : paper.original_url                  // External URL
    || `${apiBaseUrl}/papers/${paperId}/download`  // PDF fallback
  
  window.open(downloadUrl, '_blank')
}
```

**No frontend changes needed** ✅

### Step 3: Test in Browser
1. Go to `/papers`
2. Click any paper
3. Click "Download Question Paper"
4. Should download authentic MLRIT DOCX

---

## Storage Breakdown

**Files**: 80 DOCX files  
**Average size**: ~500KB per file  
**Total size**: ~40-50MB  
**Supabase free tier**: 1GB storage  
**Usage**: 5% of free tier

**Cost**: $0 (within free tier)

---

## Fallback Strategy

If DOCX upload fails for some papers:
- Frontend already has PDF generation fallback
- Backend endpoint `/papers/{id}/download` generates PDF
- No blocking issues

**Success criteria**: 70%+ papers have original DOCX (rest use PDF)

---

## User Experience

### Before (Current):
1. User clicks "Download Question Paper"
2. Gets generated PDF (not authentic)
3. PDF missing college branding, watermarks, official format

### After (With DOCX):
1. User clicks "Download Question Paper"
2. Gets authentic MLRIT DOCX (~500KB)
3. Opens in Word/Google Docs
4. Sees exact college format, branding, official paper

**Trust**: Students get real college documents ✅

---

## Next Steps

**NOW:**
1. Run `restore_original_docx.py` script
2. Monitor progress (2-3 hours)
3. Verify in Supabase Storage dashboard
4. Test download in browser

**LATER (Optional):**
- Add DOCX thumbnail previews
- Add "View in browser" option (convert DOCX → HTML)
- Add "Print" button (pre-formatted for exams)

---

## Decision: APPROVED ✅

**Why**: Best balance of authenticity, speed, reliability, and cost.

**Action**: Run the script now and upload all DOCX files.
