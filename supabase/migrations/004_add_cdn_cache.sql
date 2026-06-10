-- Migration: Add CDN cache support for papers
-- Date: June 7, 2026
-- Purpose: Store pre-generated PDF URLs for CDN edge caching

-- Add cached_pdf_url column to papers table
ALTER TABLE papers 
ADD COLUMN IF NOT EXISTS cached_pdf_url TEXT;

-- Add index for CDN URL lookups
CREATE INDEX IF NOT EXISTS idx_papers_cached_pdf_url 
ON papers(cached_pdf_url) 
WHERE cached_pdf_url IS NOT NULL;

-- Comment
COMMENT ON COLUMN papers.cached_pdf_url IS 'Supabase Storage CDN URL for pre-generated PDF (30-day cache)';
