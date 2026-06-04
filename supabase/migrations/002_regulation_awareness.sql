-- ================================================================
-- PaperIQ Migration 002 — Regulation-Awareness & Academic Context
-- ================================================================
-- Architecture decision (locked):
--   Regulation is a first-class entity.
--   No cross-regulation analysis, planning, or scoring ever occurs.
--   Every downstream feature inherits regulation from this hierarchy:
--   College -> Branch -> Regulation -> Semester -> Subject -> Syllabus
-- ================================================================

-- 1. REGULATIONS — controlled vocabulary
CREATE TABLE IF NOT EXISTS regulations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT,
  college_id  UUID REFERENCES colleges(id) ON DELETE CASCADE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_regulations_college ON regulations(college_id);

INSERT INTO regulations (code, name, college_id)
SELECT 'R18', 'Regulation 2018', id FROM colleges WHERE short_name = 'MLRIT'
ON CONFLICT (code) DO NOTHING;
INSERT INTO regulations (code, name, college_id)
SELECT 'R22', 'Regulation 2022', id FROM colleges WHERE short_name = 'MLRIT'
ON CONFLICT (code) DO NOTHING;
INSERT INTO regulations (code, name, college_id)
SELECT 'R24', 'Regulation 2024', id FROM colleges WHERE short_name = 'MLRIT'
ON CONFLICT (code) DO NOTHING;

-- 2. SYLLABI — full academic hierarchy
ALTER TABLE syllabi
  ADD COLUMN IF NOT EXISTS college_id  UUID REFERENCES colleges(id),
  ADD COLUMN IF NOT EXISTS branch_id   UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS semester    SMALLINT;
CREATE INDEX IF NOT EXISTS idx_syllabi_regulation ON syllabi(regulation);
CREATE INDEX IF NOT EXISTS idx_syllabi_college    ON syllabi(college_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_branch     ON syllabi(branch_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_syllabus_subject_reg_branch
  ON syllabi(subject_id, regulation, branch_id)
  WHERE branch_id IS NOT NULL;

-- 3. QUESTIONS — inherit regulation
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS regulation  TEXT,
  ADD COLUMN IF NOT EXISTS college_id  UUID REFERENCES colleges(id),
  ADD COLUMN IF NOT EXISTS branch_id   UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS semester    SMALLINT,
  ADD COLUMN IF NOT EXISTS exam_year   SMALLINT;
CREATE INDEX IF NOT EXISTS idx_questions_regulation ON questions(regulation);
CREATE INDEX IF NOT EXISTS idx_questions_college    ON questions(college_id);

-- 4. ANALYSIS REPORTS — single regulation per report
ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS regulation    TEXT,
  ADD COLUMN IF NOT EXISTS semester      SMALLINT,
  ADD COLUMN IF NOT EXISTS syllabus_id   UUID REFERENCES syllabi(id);
CREATE INDEX IF NOT EXISTS idx_reports_regulation ON analysis_reports(regulation);
CREATE UNIQUE INDEX IF NOT EXISTS uq_analysis_subject_reg
  ON analysis_reports(subject_id, regulation, branch_id, year_from, year_to)
  WHERE subject_id IS NOT NULL AND regulation IS NOT NULL
    AND branch_id IS NOT NULL AND year_from IS NOT NULL AND year_to IS NOT NULL;

-- 5. STUDY PLANS — regulation + syllabus context
ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS regulation   TEXT,
  ADD COLUMN IF NOT EXISTS branch_id    UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS syllabus_id  UUID REFERENCES syllabi(id),
  ADD COLUMN IF NOT EXISTS semester     SMALLINT,
  ADD COLUMN IF NOT EXISTS college_id   UUID REFERENCES colleges(id);
CREATE INDEX IF NOT EXISTS idx_study_plans_regulation ON study_plans(regulation);

-- 6. READINESS SCORES
ALTER TABLE readiness_scores
  ADD COLUMN IF NOT EXISTS regulation   TEXT,
  ADD COLUMN IF NOT EXISTS syllabus_id  UUID REFERENCES syllabi(id),
  ADD COLUMN IF NOT EXISTS branch_id    UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS college_id   UUID REFERENCES colleges(id),
  ADD COLUMN IF NOT EXISTS semester     SMALLINT;
CREATE INDEX IF NOT EXISTS idx_readiness_regulation ON readiness_scores(regulation);

-- 7. MOCK EXAMS
ALTER TABLE mock_exams
  ADD COLUMN IF NOT EXISTS regulation   TEXT,
  ADD COLUMN IF NOT EXISTS syllabus_id  UUID REFERENCES syllabi(id),
  ADD COLUMN IF NOT EXISTS branch_id    UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS college_id   UUID REFERENCES colleges(id),
  ADD COLUMN IF NOT EXISTS semester     SMALLINT;
CREATE INDEX IF NOT EXISTS idx_mock_exams_regulation ON mock_exams(regulation);

-- 8. USER PROFILES — full onboarding fields
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS current_semester    SMALLINT,
  ADD COLUMN IF NOT EXISTS target_cgpa         NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS target_marks        SMALLINT,
  ADD COLUMN IF NOT EXISTS hours_per_day       NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS preparation_level   TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS chk_prep_level;
ALTER TABLE user_profiles ADD CONSTRAINT chk_prep_level
  CHECK (preparation_level IN ('beginner', 'intermediate', 'advanced'));

-- 9. USER ACTIVITY
ALTER TABLE user_activity
  ADD COLUMN IF NOT EXISTS regulation   TEXT,
  ADD COLUMN IF NOT EXISTS college_id   UUID REFERENCES colleges(id),
  ADD COLUMN IF NOT EXISTS branch_id    UUID REFERENCES branches(id);
CREATE INDEX IF NOT EXISTS idx_activity_regulation ON user_activity(regulation);

-- 10. SCRAPING JOBS
ALTER TABLE scraping_jobs
  ADD COLUMN IF NOT EXISTS regulation  TEXT,
  ADD COLUMN IF NOT EXISTS branch_id   UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS semester    SMALLINT;

-- 11. TOPICS — regulation-aware
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS regulation  TEXT,
  ADD COLUMN IF NOT EXISTS college_id  UUID REFERENCES colleges(id),
  ADD COLUMN IF NOT EXISTS branch_id   UUID REFERENCES branches(id);
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_subject_id_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_topic_subject_reg_name
  ON topics(subject_id, regulation, name)
  WHERE regulation IS NOT NULL;

-- 12. PAPERS — add indexes (columns already exist)
CREATE INDEX IF NOT EXISTS idx_papers_regulation ON papers(regulation);
CREATE INDEX IF NOT EXISTS idx_papers_branch     ON papers(branch_id);
CREATE INDEX IF NOT EXISTS idx_papers_semester   ON papers(semester);

-- 13. CROSS-REGULATION GUARD VIEW
-- Always filter by paper_regulation = $1 when querying this view.
CREATE OR REPLACE VIEW v_questions_regulated AS
SELECT
  q.*,
  p.regulation  AS paper_regulation,
  p.exam_year   AS paper_exam_year,
  p.exam_type   AS paper_exam_type,
  p.exam_month  AS paper_exam_month,
  p.college_id  AS paper_college_id,
  p.branch_id   AS paper_branch_id,
  p.semester    AS paper_semester,
  s.regulation  AS subject_regulation,
  s.code        AS subject_code,
  s.name        AS subject_name
FROM questions q
JOIN papers   p ON p.id = q.paper_id
JOIN subjects s ON s.id = q.subject_id;

COMMENT ON VIEW v_questions_regulated IS
  'Use for all analysis queries. Always add WHERE paper_regulation = $1 to prevent cross-regulation analysis.';
