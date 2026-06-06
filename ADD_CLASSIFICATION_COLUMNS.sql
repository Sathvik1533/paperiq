-- Add classification columns to questions table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS topic_name TEXT,
ADD COLUMN IF NOT EXISTS unit_name TEXT,
ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);

CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name IN ('topic_name', 'unit_name', 'classification_confidence')
ORDER BY column_name;
