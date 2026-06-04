-- Migration: 003_rls_policies
-- Enable Row Level Security on all user-owned tables and add isolation policies.

-- ============================================================
-- Enable RLS
-- ============================================================

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- User-owned tables: each user sees only their own rows
-- ============================================================

CREATE POLICY "own_study_plans"
  ON study_plans
  USING (user_id = auth.uid());

CREATE POLICY "own_readiness"
  ON readiness_scores
  USING (user_id = auth.uid());

CREATE POLICY "own_mock_exams"
  ON mock_exams
  USING (user_id = auth.uid());

CREATE POLICY "own_saved_reports"
  ON saved_reports
  USING (user_id = auth.uid());

CREATE POLICY "own_activity"
  ON user_activity
  USING (user_id = auth.uid());

CREATE POLICY "own_profile"
  ON user_profiles
  USING (id = auth.uid());

-- ============================================================
-- Public reference tables: read-only for everyone, writes via service role only
-- ============================================================

CREATE POLICY "papers_public_read"
  ON papers
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "questions_public_read"
  ON questions
  FOR SELECT
  USING (true);

CREATE POLICY "colleges_public_read"
  ON colleges
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "subjects_public_read"
  ON subjects
  FOR SELECT
  USING (true);
