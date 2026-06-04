-- ================================================================
-- PaperIQ Migration 004 — Architecture Compliance Fixes
-- ================================================================
-- Gap #2: Add regulation + academic context to syllabus_topics
-- Gap #5: Remove stale regulations[] column from analysis_reports
--         Add report_data JSONB for full report storage
-- ================================================================

-- Gap #2: syllabus_topics needs regulation/subject_id for direct queries
ALTER TABLE syllabus_topics
  ADD COLUMN IF NOT EXISTS regulation  TEXT,
  ADD COLUMN IF NOT EXISTS college_id  UUID REFERENCES colleges(id),
  ADD COLUMN IF NOT EXISTS branch_id   UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS subject_id  UUID REFERENCES subjects(id);

CREATE INDEX IF NOT EXISTS idx_syllabus_topics_regulation ON syllabus_topics(regulation);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_subject    ON syllabus_topics(subject_id);

-- Backfill regulation/subject_id from parent syllabi table for existing rows
UPDATE syllabus_topics st
SET
  regulation = s.regulation,
  college_id = s.college_id,
  branch_id  = s.branch_id,
  subject_id = s.subject_id
FROM syllabi s
WHERE st.syllabus_id = s.id
  AND st.regulation IS NULL;

-- Gap #5: Drop stale regulations TEXT[] column (superseded by regulation TEXT)
ALTER TABLE analysis_reports
  DROP COLUMN IF EXISTS regulations;

-- Add report_data JSONB for full report storage (used by ReportBuilder)
ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS report_data JSONB;
