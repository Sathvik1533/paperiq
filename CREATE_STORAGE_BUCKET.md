# Create Supabase Storage Bucket for Papers

**The upload script failed because the storage bucket doesn't exist yet.**

## Option 1: Create via Supabase Dashboard (EASIEST)

1. Go to your Supabase project dashboard
2. Click "Storage" in the left sidebar
3. Click "New bucket"
4. Name: `papers`
5. Public: ✅ Yes (allow public downloads)
6. File size limit: 10 MB
7. Allowed MIME types: 
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `application/msword`
8. Click "Create bucket"

## Option 2: Create via SQL (Alternative)

Run this SQL in Supabase SQL Editor:

```sql
-- Create storage bucket for question papers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'papers',
  'papers', 
  true,
  10485760,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'papers');

-- Allow authenticated uploads (for admin scripts)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'papers' AND auth.role() = 'authenticated');
```

## After Creating Bucket

Run the upload script again:

```bash
cd /Users/k.sathvik/paperiq/backend
source .venv/bin/activate
python scripts/restore_original_docx.py
```

It should upload all 77 DOCX files successfully this time!

## What Happened

✅ Downloaded 21 RAR archives from MLRIT website  
✅ Extracted all DOCX files successfully  
❌ Upload failed - bucket 'papers' doesn't exist

**Next**: Create the bucket, then re-run the script.
