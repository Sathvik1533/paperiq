-- ================================================================
-- PaperIQ — Initial Database Schema
-- ================================================================

CREATE TABLE IF NOT EXISTS colleges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  short_name    TEXT NOT NULL UNIQUE,
  portal_url    TEXT,
  scraper_type  TEXT NOT NULL DEFAULT 'generic',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID REFERENCES colleges(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  short_name    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, short_name)
);

CREATE TABLE IF NOT EXISTS subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID REFERENCES colleges(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT,
  semester      SMALLINT,
  year          SMALLINT,
  regulation    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subject_branch_map (
  subject_id    UUID REFERENCES subjects(id) ON DELETE CASCADE,
  branch_id     UUID REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (subject_id, branch_id)
);

CREATE TABLE IF NOT EXISTS paper_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID REFERENCES colleges(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  base_url        TEXT,
  scraper_config  JSONB,
  last_scraped_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS papers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID REFERENCES colleges(id) ON DELETE CASCADE,
  subject_id          UUID REFERENCES subjects(id),
  branch_id           UUID REFERENCES branches(id),
  source_id           UUID REFERENCES paper_sources(id),
  title               TEXT NOT NULL,
  exam_type           TEXT,
  exam_month          TEXT,
  exam_year           SMALLINT,
  semester            SMALLINT,
  btech_year          SMALLINT,
  regulation          TEXT,
  max_marks           SMALLINT,
  duration_hours      SMALLINT DEFAULT 3,
  set_number          SMALLINT DEFAULT 1,
  original_url        TEXT,
  archive_path        TEXT,
  file_name           TEXT,
  file_type           TEXT,
  file_size_bytes     BIGINT,
  file_hash           TEXT UNIQUE,
  storage_path        TEXT,
  storage_bucket      TEXT DEFAULT 'papers',
  raw_text            TEXT,
  extraction_status   TEXT DEFAULT 'pending',
  extraction_error    TEXT,
  extracted_at        TIMESTAMPTZ,
  is_verified         BOOLEAN DEFAULT FALSE,
  is_public           BOOLEAN DEFAULT TRUE,
  uploaded_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_papers_college   ON papers(college_id);
CREATE INDEX IF NOT EXISTS idx_papers_subject   ON papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_papers_year      ON papers(exam_year);
CREATE INDEX IF NOT EXISTS idx_papers_hash      ON papers(file_hash);

CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id        UUID REFERENCES papers(id) ON DELETE CASCADE,
  subject_id      UUID REFERENCES subjects(id),
  question_number TEXT,
  part            TEXT,
  section         TEXT,
  question_text   TEXT NOT NULL,
  question_type   TEXT,
  marks           SMALLINT,
  co              TEXT,
  bloom_level     TEXT,
  unit_number     SMALLINT,
  unit_name       TEXT,
  topic_tags      TEXT[],
  is_or_question  BOOLEAN DEFAULT FALSE,
  normalized_text TEXT,
  question_hash   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_paper   ON questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_unit    ON questions(unit_number);
CREATE INDEX IF NOT EXISTS idx_questions_type    ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_tags    ON questions USING GIN(topic_tags);

CREATE TABLE IF NOT EXISTS topics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  aliases       TEXT[],
  unit_number   SMALLINT,
  unit_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, name)
);

CREATE TABLE IF NOT EXISTS question_topics (
  question_id   UUID REFERENCES questions(id) ON DELETE CASCADE,
  topic_id      UUID REFERENCES topics(id) ON DELETE CASCADE,
  confidence    FLOAT DEFAULT 1.0,
  PRIMARY KEY (question_id, topic_id)
);

CREATE TABLE IF NOT EXISTS scraping_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id),
  college_id        UUID REFERENCES colleges(id),
  subject_id        UUID REFERENCES subjects(id),
  source_id         UUID REFERENCES paper_sources(id),
  status            TEXT DEFAULT 'queued',
  scraper_used      TEXT,
  stage             TEXT,
  total_files       INT DEFAULT 0,
  processed_files   INT DEFAULT 0,
  failed_files      INT DEFAULT 0,
  progress_pct      FLOAT DEFAULT 0,
  papers_found      INT DEFAULT 0,
  papers_new        INT DEFAULT 0,
  papers_cached     INT DEFAULT 0,
  error_log         JSONB DEFAULT '[]',
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_reports (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID REFERENCES auth.users(id),
  subject_id                UUID REFERENCES subjects(id),
  college_id                UUID REFERENCES colleges(id),
  branch_id                 UUID REFERENCES branches(id),
  year_from                 SMALLINT,
  year_to                   SMALLINT,
  regulations               TEXT[],
  topic_frequency           JSONB,
  unit_distribution         JSONB,
  repeated_questions        JSONB,
  repeated_definitions      JSONB,
  repeated_proofs           JSONB,
  repeated_numericals       JSONB,
  trend_analysis            JSONB,
  high_probability          JSONB,
  predicted_questions       JSONB,
  total_papers_analyzed     INT,
  total_questions_analyzed  INT,
  llm_provider              TEXT,
  model_used                TEXT,
  generation_time_ms        INT,
  is_cached                 BOOLEAN DEFAULT FALSE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  expires_at                TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_reports_subject ON analysis_reports(subject_id);
CREATE INDEX IF NOT EXISTS idx_reports_user    ON analysis_reports(user_id);

CREATE TABLE IF NOT EXISTS syllabi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID REFERENCES subjects(id) ON DELETE CASCADE,
  regulation    TEXT NOT NULL,
  source_type   TEXT DEFAULT 'upload',
  raw_text      TEXT,
  parsed_units  JSONB,
  uploaded_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS syllabus_topics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id   UUID REFERENCES syllabi(id) ON DELETE CASCADE,
  unit_number   SMALLINT,
  unit_name     TEXT,
  topic_name    TEXT NOT NULL,
  subtopics     TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS syllabus_coverage (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             UUID REFERENCES analysis_reports(id),
  syllabus_id           UUID REFERENCES syllabi(id),
  unit_coverage         JSONB,
  topic_mapping         JSONB,
  overall_coverage_pct  FLOAT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id),
  report_id         UUID REFERENCES analysis_reports(id),
  subject_id        UUID REFERENCES subjects(id),
  exam_date         DATE NOT NULL,
  hours_per_day     FLOAT NOT NULL,
  target_grade      TEXT,
  total_study_days  INT,
  daily_plan        JSONB,
  priority_map      JSONB,
  revision_schedule JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readiness_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id),
  study_plan_id           UUID REFERENCES study_plans(id),
  subject_id              UUID REFERENCES subjects(id),
  score                   SMALLINT,
  grade_prediction        TEXT,
  topic_coverage_score    SMALLINT,
  practice_score          SMALLINT,
  plan_completion_score   SMALLINT,
  syllabus_coverage_score SMALLINT,
  weak_areas              TEXT[],
  recommendations         JSONB,
  calculated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_exams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  report_id       UUID REFERENCES analysis_reports(id),
  subject_id      UUID REFERENCES subjects(id),
  title           TEXT,
  total_marks     SMALLINT,
  duration_mins   INT DEFAULT 180,
  questions       JSONB,
  generated_by    TEXT,
  model_used      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  report_id     UUID REFERENCES analysis_reports(id),
  label         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name     TEXT,
  college_id    UUID REFERENCES colleges(id),
  branch_id     UUID REFERENCES branches(id),
  current_year  SMALLINT,
  regulation    TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  subject_id      UUID REFERENCES subjects(id),
  activity_type   TEXT,
  reference_id    UUID,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user_subject ON user_activity(user_id, subject_id);

CREATE TABLE IF NOT EXISTS plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  price_inr     NUMERIC(10,2) DEFAULT 0,
  price_usd     NUMERIC(10,2) DEFAULT 0,
  features      JSONB,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id),
  plan_id               UUID REFERENCES plans(id),
  status                TEXT DEFAULT 'active',
  provider              TEXT,
  provider_sub_id       TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount          NUMERIC(10,2),
  currency        TEXT DEFAULT 'INR',
  provider        TEXT,
  provider_txn_id TEXT,
  status          TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
