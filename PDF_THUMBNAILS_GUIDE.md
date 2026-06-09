# PDF Thumbnails Implementation Guide

## 📋 Overview

Generate thumbnail images from PDF files and display them in the Papers browser for better visual navigation.

**Status**: Ready to implement (infrastructure in place)
**Effort**: ~2-3 hours
**Priority**: Low (nice-to-have, not MVP)

---

## 🎯 Goal

Transform this:
```
📄 Data Structures - Semester 2023
[Text-only card]
```

Into this:
```
╔═══════════════╗
║  [Thumbnail]  ║  Data Structures - Semester 2023
║   Preview     ║  R22 • CSE • May 2023
╚═══════════════╝
```

---

## 🏗️ Architecture

### Storage Setup
1. **Supabase Storage Bucket**: `paper-pdfs`
   - Store original PDF files
   - Public read access
   - Organized by regulation: `R22/CSE/filename.pdf`

2. **Thumbnail Bucket**: `paper-thumbnails`
   - Store generated thumbnail images
   - 200x280px PNG format
   - Same organization structure
   - Public read access

### Database Schema
```sql
-- Add columns to papers table (if not exists)
ALTER TABLE papers 
ADD COLUMN pdf_url TEXT,
ADD COLUMN thumbnail_url TEXT;
```

---

## 🔧 Implementation Steps

### Step 1: Upload PDFs to Supabase Storage

Create upload script: `backend/scripts/upload_pdfs_to_storage.py`

```python
"""
Upload all PDF files to Supabase Storage
"""
import os
import sys
from pathlib import Path
from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

PDF_SOURCE_DIR = "/path/to/your/pdfs"  # Update this
BUCKET_NAME = "paper-pdfs"

def ensure_bucket_exists():
    """Create bucket if it doesn't exist"""
    try:
        supabase.storage.create_bucket(BUCKET_NAME, {"public": True})
        print(f"✓ Created bucket: {BUCKET_NAME}")
    except:
        print(f"✓ Bucket already exists: {BUCKET_NAME}")

def upload_pdf(file_path: Path, regulation: str, subject_code: str):
    """Upload a single PDF file"""
    # Path in bucket: R22/CSE/filename.pdf
    storage_path = f"{regulation}/{subject_code}/{file_path.name}"
    
    with open(file_path, 'rb') as f:
        response = supabase.storage.from_(BUCKET_NAME).upload(
            storage_path,
            f,
            {"content-type": "application/pdf"}
        )
    
    # Get public URL
    url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
    return url

def main():
    ensure_bucket_exists()
    
    pdf_files = list(Path(PDF_SOURCE_DIR).glob("*.pdf"))
    print(f"Found {len(pdf_files)} PDF files")
    
    for pdf_file in pdf_files:
        # Extract metadata from filename
        # Example: R22_CSE_2023_Semester_DataStructures.pdf
        parts = pdf_file.stem.split('_')
        regulation = parts[0]  # R22
        subject_code = parts[1]  # CSE
        
        try:
            url = upload_pdf(pdf_file, regulation, subject_code)
            print(f"✓ Uploaded: {pdf_file.name} → {url}")
            
            # Update database
            supabase.table('papers').update({
                'pdf_url': url
            }).eq('file_name', pdf_file.name).execute()
            
        except Exception as e:
            print(f"✗ Failed: {pdf_file.name} - {e}")

if __name__ == '__main__':
    main()
```

Run:
```bash
cd backend
python scripts/upload_pdfs_to_storage.py
```

---

### Step 2: Generate Thumbnails

Create thumbnail generation script: `backend/scripts/generate_thumbnails.py`

```python
"""
Generate thumbnail images from PDF files
"""
import os
import sys
import io
from pathlib import Path
from PIL import Image
from pdf2image import convert_from_bytes
from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

THUMBNAIL_SIZE = (200, 280)  # Width x Height
PDF_BUCKET = "paper-pdfs"
THUMB_BUCKET = "paper-thumbnails"

def ensure_thumbnail_bucket():
    """Create thumbnail bucket if it doesn't exist"""
    try:
        supabase.storage.create_bucket(THUMB_BUCKET, {"public": True})
        print(f"✓ Created bucket: {THUMB_BUCKET}")
    except:
        print(f"✓ Bucket already exists: {THUMB_BUCKET}")

def generate_thumbnail(pdf_bytes: bytes) -> bytes:
    """
    Generate thumbnail from PDF bytes
    Returns: PNG thumbnail as bytes
    """
    # Convert first page of PDF to image
    images = convert_from_bytes(
        pdf_bytes,
        first_page=1,
        last_page=1,
        dpi=150
    )
    
    if not images:
        raise ValueError("Could not convert PDF to image")
    
    # Resize and optimize
    image = images[0]
    image.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    
    # Convert to PNG bytes
    output = io.BytesIO()
    image.save(output, format='PNG', optimize=True)
    output.seek(0)
    
    return output.getvalue()

def process_paper(paper):
    """Generate and upload thumbnail for a single paper"""
    pdf_url = paper.get('pdf_url')
    if not pdf_url:
        return None
    
    paper_id = paper['id']
    file_name = paper['file_name']
    
    print(f"Processing: {file_name}...")
    
    try:
        # Download PDF from storage
        storage_path = pdf_url.split(f'{PDF_BUCKET}/')[-1]
        pdf_response = supabase.storage.from_(PDF_BUCKET).download(storage_path)
        pdf_bytes = pdf_response
        
        # Generate thumbnail
        thumb_bytes = generate_thumbnail(pdf_bytes)
        
        # Upload thumbnail
        thumb_path = storage_path.replace('.pdf', '.png')
        supabase.storage.from_(THUMB_BUCKET).upload(
            thumb_path,
            thumb_bytes,
            {"content-type": "image/png"}
        )
        
        # Get public URL
        thumb_url = supabase.storage.from_(THUMB_BUCKET).get_public_url(thumb_path)
        
        # Update database
        supabase.table('papers').update({
            'thumbnail_url': thumb_url
        }).eq('id', paper_id).execute()
        
        print(f"  ✓ Generated thumbnail: {thumb_url}")
        return thumb_url
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return None

def main():
    ensure_thumbnail_bucket()
    
    # Get all papers with PDFs but no thumbnails
    response = supabase.table('papers') \
        .select('id, file_name, pdf_url, thumbnail_url') \
        .not_('pdf_url', 'is', 'null') \
        .is_('thumbnail_url', 'null') \
        .execute()
    
    papers = response.data
    total = len(papers)
    
    print(f"\nFound {total} papers needing thumbnails\n")
    
    success = 0
    failed = 0
    
    for i, paper in enumerate(papers, 1):
        print(f"[{i}/{total}]", end=" ")
        result = process_paper(paper)
        
        if result:
            success += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Complete!")
    print(f"   Success: {success}")
    print(f"   Failed: {failed}")
    print(f"   Total: {total}")
    print(f"{'='*60}")

if __name__ == '__main__':
    # Install dependencies first:
    # pip install pdf2image pillow
    # brew install poppler (Mac) or apt-get install poppler-utils (Linux)
    main()
```

Run:
```bash
# Install dependencies
pip install pdf2image pillow

# Mac:
brew install poppler

# Ubuntu/Debian:
sudo apt-get install poppler-utils

# Run script
cd backend
python scripts/generate_thumbnails.py
```

---

### Step 3: Display Thumbnails in Frontend

Update `Papers.tsx` to show thumbnails:

```typescript
// In Papers.tsx card rendering section

<div className="glass-card p-lg rounded-2xl flex gap-lg hover:-translate-y-1 transition-all">
  {/* Thumbnail */}
  {paper.thumbnail_url && (
    <div className="shrink-0 w-32 h-44 rounded-lg overflow-hidden border border-outline-variant">
      <img
        src={paper.thumbnail_url}
        alt={`Preview of ${paper.file_name}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  )}
  
  {/* Paper info */}
  <div className="flex-1 flex flex-col justify-between">
    <div>
      <h3 className="font-headline text-headline-sm text-on-surface mb-xs">
        {paper.subject_name || paper.file_name}
      </h3>
      <p className="text-body-sm text-on-surface-variant">
        {paper.regulation} • {paper.exam_category} • {paper.exam_date}
      </p>
    </div>
    
    <button className="text-primary flex items-center gap-xs">
      View Paper
      <Icon name="arrow_right" size={18} />
    </button>
  </div>
</div>
```

---

## 📊 Performance Considerations

### Optimization Strategies

1. **Lazy Loading**:
   ```tsx
   <img loading="lazy" ... />
   ```

2. **Thumbnail Size**:
   - 200x280px is optimal balance
   - PNG format with optimization
   - ~30-50KB per thumbnail

3. **Caching**:
   - Supabase Storage has built-in CDN
   - Browser caches images automatically
   - Add cache headers in bucket config

4. **Progressive Loading**:
   ```tsx
   const [imageLoaded, setImageLoaded] = useState(false)
   
   <img
     src={thumbnail_url}
     onLoad={() => setImageLoaded(true)}
     className={imageLoaded ? 'opacity-100' : 'opacity-0'}
     style={{ transition: 'opacity 0.3s' }}
   />
   ```

---

## 🎨 UI Design Specs

### Thumbnail Card Layout
```
┌─────────────────────────────────────────┐
│  ┌────────┐                             │
│  │        │  Data Structures            │
│  │  IMG   │  R22 • CSE                  │
│  │        │  Semester • May 2023        │
│  │  200px │                             │
│  │   x    │  [Download] [View]          │
│  │  280px │                             │
│  └────────┘                             │
└─────────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop (>1024px)**: Thumbnails visible
- **Tablet (768-1024px)**: Thumbnails smaller (150x210px)
- **Mobile (<768px)**: Thumbnails hidden or compact mode

---

## 🔍 Testing

### Manual Test Cases

1. **Upload & Generation**:
   ```bash
   # Upload 1 test PDF
   # Generate thumbnail
   # Verify file appears in storage bucket
   # Verify thumbnail_url in database
   ```

2. **Display**:
   - Navigate to `/papers`
   - Verify thumbnails load
   - Check lazy loading (scroll down)
   - Verify click to view works

3. **Edge Cases**:
   - Missing PDF → should show placeholder
   - Failed thumbnail → should show PDF icon
   - Large PDF → should handle gracefully

### Automated Tests
```typescript
// papers.test.tsx
describe('PDF Thumbnails', () => {
  it('should display thumbnail when available', () => {
    const paper = { thumbnail_url: 'https://...', file_name: 'test.pdf' }
    render(<PaperCard paper={paper} />)
    expect(screen.getByAlt(/Preview of test.pdf/)).toBeInTheDocument()
  })
  
  it('should show placeholder when thumbnail missing', () => {
    const paper = { thumbnail_url: null, file_name: 'test.pdf' }
    render(<PaperCard paper={paper} />)
    expect(screen.getByText(/No preview/)).toBeInTheDocument()
  })
})
```

---

## 💰 Cost Estimate

### Supabase Storage Pricing
- **Storage**: $0.021/GB/month
- **Bandwidth**: $0.09/GB

### Example: 100 Papers
- PDF files: ~500KB each = 50MB
- Thumbnails: ~40KB each = 4MB
- Total storage: 54MB ≈ $0.001/month
- Bandwidth (1000 views): ~4GB = $0.36/month

**Total**: < $1/month for reasonable usage

---

## 🚀 Deployment Checklist

- [ ] Install dependencies: `pdf2image`, `pillow`, `poppler`
- [ ] Create storage buckets: `paper-pdfs`, `paper-thumbnails`
- [ ] Set bucket permissions to public read
- [ ] Run upload script: `upload_pdfs_to_storage.py`
- [ ] Run thumbnail script: `generate_thumbnails.py`
- [ ] Verify database has `pdf_url` and `thumbnail_url` populated
- [ ] Update frontend `Papers.tsx` component
- [ ] Test thumbnail display on all screen sizes
- [ ] Monitor storage usage in Supabase dashboard
- [ ] Set up automated thumbnail generation for new uploads

---

## 🔄 Automated Thumbnail Generation

For production, set up automated generation when new PDFs are uploaded:

```python
# Supabase Edge Function (optional)
# triggers/generate_thumbnail.py

@supabase_function
def on_pdf_upload(event):
    """Automatically generate thumbnail when PDF is uploaded"""
    pdf_url = event['pdf_url']
    paper_id = event['paper_id']
    
    # Download, generate, upload thumbnail
    # Update database
    
    return {'success': True}
```

Or use a background job queue (Celery, Bull, etc.)

---

## 📚 Resources

- [pdf2image docs](https://github.com/Belval/pdf2image)
- [Pillow docs](https://pillow.readthedocs.io/)
- [Supabase Storage docs](https://supabase.com/docs/guides/storage)
- [Poppler utils](https://poppler.freedesktop.org/)

---

**Status**: Ready to implement when PDFs are available
**Estimated Time**: 2-3 hours
**Difficulty**: Medium
**Impact**: High (better UX for papers browser)

