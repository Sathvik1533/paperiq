-- Syllabus Units and Topics Tables
-- Stores the official syllabus structure for unit/topic classification

CREATE TABLE IF NOT EXISTS syllabus_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,
    unit_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, unit_name)
);

CREATE TABLE IF NOT EXISTS syllabus_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES syllabus_units(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    keywords TEXT[],  -- Optional: keywords for matching
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(unit_id, topic_name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_syllabus_units_subject ON syllabus_units(subject_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_unit ON syllabus_topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_name ON syllabus_topics(topic_name);

-- Add topic classification columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES syllabus_topics(id),
ADD COLUMN IF NOT EXISTS topic_name TEXT,
ADD COLUMN IF NOT EXISTS unit_name TEXT,
ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(3,2);

CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON questions(unit_name);

COMMENT ON TABLE syllabus_units IS 'Official syllabus units from R22 curriculum';
COMMENT ON TABLE syllabus_topics IS 'Official syllabus topics under each unit';
COMMENT ON COLUMN questions.topic_id IS 'Matched topic from syllabus (best match)';
COMMENT ON COLUMN questions.classification_confidence IS 'Confidence score 0.0-1.0 for topic match';
