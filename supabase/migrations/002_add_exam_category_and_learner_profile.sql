-- ================================================================
-- PaperIQ — Migration 002: Exam Category & Learner Profile
-- ================================================================

-- Add exam_category column to papers table
ALTER TABLE papers ADD COLUMN IF NOT EXISTS exam_category TEXT;

-- Create index for exam_category filtering
CREATE INDEX IF NOT EXISTS idx_papers_exam_category ON papers(exam_category);

-- Add constraints for exam_category and exam_type
ALTER TABLE papers DROP CONSTRAINT IF EXISTS chk_exam_category;
ALTER TABLE papers ADD CONSTRAINT chk_exam_category 
  CHECK (exam_category IN ('Mid-1', 'Mid-2', 'Semester', 'Unknown', NULL));

ALTER TABLE papers DROP CONSTRAINT IF EXISTS chk_exam_type;
ALTER TABLE papers ADD CONSTRAINT chk_exam_type 
  CHECK (exam_type IN ('Regular', 'Supplementary', NULL));

-- Create syllabus_sources table for automatic discovery
CREATE TABLE IF NOT EXISTS syllabus_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID REFERENCES colleges(id) ON DELETE CASCADE,
  regulation    TEXT NOT NULL,
  branch_id     UUID REFERENCES branches(id),
  subject_code  TEXT,
  base_url      TEXT,
  url_pattern   TEXT,
  scraper_type  TEXT DEFAULT 'direct_download',
  is_active     BOOLEAN DEFAULT TRUE,
  last_checked  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, regulation, branch_id, subject_code)
);

-- Update syllabi table to support auto-discovered sources
ALTER TABLE syllabi DROP CONSTRAINT IF EXISTS chk_source_type;
ALTER TABLE syllabi ADD CONSTRAINT chk_source_type 
  CHECK (source_type IN ('upload', 'auto_discovered', 'scraped', 'manual_url'));

-- Create learner_profiles table for automatic skill level detection
CREATE TABLE IF NOT EXISTS learner_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id) UNIQUE,
  college_id              UUID REFERENCES colleges(id),
  branch_id               UUID REFERENCES branches(id),
  regulation              TEXT,
  current_year            SMALLINT,
  current_semester        SMALLINT,
  current_cgpa            FLOAT,
  target_cgpa             FLOAT,
  study_hours_per_day     FLOAT,
  
  -- Auto-detected learner characteristics
  detected_skill_level    TEXT,  -- Beginner | Intermediate | Advanced
  consistency_score       FLOAT, -- 0-100: based on activity regularity
  learning_pace           TEXT,  -- Fast | Medium | Slow
  risk_areas              TEXT[], -- Topics with low scores
  strong_areas            TEXT[], -- Topics with high scores
  
  -- Computed metrics
  avg_readiness_score     FLOAT,
  avg_mock_score          FLOAT,
  total_study_time_mins   INT DEFAULT 0,
  papers_viewed           INT DEFAULT 0,
  mocks_attempted         INT DEFAULT 0,
  
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learner_profiles_user ON learner_profiles(user_id);

-- Add learner context columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_cgpa FLOAT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_cgpa FLOAT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS study_hours_per_day FLOAT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_semester SMALLINT;

-- Add exam filters to analysis_reports
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS exam_category TEXT;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS exam_attempt TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_filters ON analysis_reports(subject_id, regulation, exam_category, exam_attempt);

-- Update papers table to ensure regulation column is indexed
CREATE INDEX IF NOT EXISTS idx_papers_regulation ON papers(regulation);
