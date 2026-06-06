-- Run this SQL in Supabase Dashboard → SQL Editor
-- Creates tables for syllabus ingestion

CREATE TABLE IF NOT EXISTS syllabus_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, unit_name)
);

CREATE INDEX IF NOT EXISTS idx_syllabus_units_subject ON syllabus_units(subject_id);

-- Add topic classification columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS topic_id UUID,
ADD COLUMN IF NOT EXISTS topic_name TEXT,
ADD COLUMN IF NOT EXISTS unit_name TEXT,
ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);

CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);

-- Verify tables
SELECT 'syllabus_units' as table_name, COUNT(*) as row_count FROM syllabus_units
UNION ALL
SELECT 'syllabus_topics', COUNT(*) FROM syllabus_topics;
