-- Add visual context and explicit dual-storage columns to papers table
ALTER TABLE papers
ADD COLUMN IF NOT EXISTS original_storage_path TEXT,
ADD COLUMN IF NOT EXISTS viewable_storage_path TEXT,
ADD COLUMN IF NOT EXISTS download_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_filename TEXT;

-- Update papers table: if old storage_path exists, it's considered the viewable path (or original, but we'll migrate to explicit naming).
UPDATE papers
SET original_storage_path = storage_path
WHERE storage_path IS NOT NULL AND original_storage_path IS NULL;

-- Add diagram linking to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS diagram_urls TEXT[] DEFAULT '{}';
