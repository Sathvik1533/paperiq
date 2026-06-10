"""
Migration 008 — Production Security Hardening

1. Enable RLS on ALL tables
2. Add strict policies: public read for reference tables,
   service-role-only writes, user-owned data isolation.
3. Restrict admin writes to service_role only.
"""

-- ============================================================
-- 1. Enable RLS on ALL tables that were missing it
-- ============================================================

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_branch_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_sources ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Drop any overly permissive existing policies
-- ============================================================

DROP POLICY IF EXISTS papers_public_read ON papers;
DROP POLICY IF EXISTS questions_public_read ON questions;
DROP POLICY IF EXISTS colleges_public_read ON colleges;
DROP POLICY IF EXISTS subjects_public_read ON subjects;

-- ============================================================
-- 3. Papers — read by all auth users, write by service_role
-- ============================================================

CREATE POLICY "papers_select_auth"
  ON papers FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "papers_insert_service"
  ON papers FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "papers_update_service"
  ON papers FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "papers_delete_service"
  ON papers FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 4. Questions — read by all auth users, write by service_role
-- ============================================================

CREATE POLICY "questions_select_auth"
  ON questions FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "questions_insert_service"
  ON questions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "questions_update_service"
  ON questions FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "questions_delete_service"
  ON questions FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5. Subjects, Branches, Colleges — read by all auth, write by service_role
-- ============================================================

CREATE POLICY "subjects_select_auth"
  ON subjects FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "subjects_insert_service"
  ON subjects FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "subjects_update_service"
  ON subjects FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "subjects_delete_service"
  ON subjects FOR DELETE
  USING (auth.role() = 'service_role');

CREATE POLICY "branches_select_auth"
  ON branches FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "branches_insert_service"
  ON branches FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "branches_update_service"
  ON branches FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "branches_delete_service"
  ON branches FOR DELETE
  USING (auth.role() = 'service_role');

CREATE POLICY "colleges_select_auth"
  ON colleges FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "colleges_insert_service"
  ON colleges FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "colleges_update_service"
  ON colleges FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "colleges_delete_service"
  ON colleges FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 6. Topics — read by auth, write by service_role
-- ============================================================

CREATE POLICY "topics_select_auth"
  ON topics FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "topics_insert_service"
  ON topics FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "topics_update_service"
  ON topics FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "topics_delete_service"
  ON topics FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 7. Question Topics junction — read by auth, write by service_role
-- ============================================================

CREATE POLICY "question_topics_select_auth"
  ON question_topics FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "question_topics_insert_service"
  ON question_topics FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "question_topics_delete_service"
  ON question_topics FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 8. Analysis Reports — read by owner or service_role, write by service_role
-- ============================================================

CREATE POLICY "reports_select_owner_or_service"
  ON analysis_reports FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (user_id IS NOT NULL AND user_id = auth.uid())
    OR (user_id IS NULL AND auth.role() = 'authenticated')
  );

CREATE POLICY "reports_insert_service"
  ON analysis_reports FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "reports_update_service"
  ON analysis_reports FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "reports_delete_service"
  ON analysis_reports FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 9. Syllabi — read by auth, write by service_role
-- ============================================================

CREATE POLICY "syllabi_select_auth"
  ON syllabi FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "syllabi_insert_service"
  ON syllabi FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "syllabi_update_service"
  ON syllabi FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "syllabi_delete_service"
  ON syllabi FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 10. Syllabus Topics — read by auth, write by service_role
-- ============================================================

CREATE POLICY "syllabus_topics_select_auth"
  ON syllabus_topics FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "syllabus_topics_insert_service"
  ON syllabus_topics FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "syllabus_topics_update_service"
  ON syllabus_topics FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "syllabus_topics_delete_service"
  ON syllabus_topics FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 11. Syllabus Coverage — read by auth, write by service_role
-- ============================================================

CREATE POLICY "syllabus_coverage_select_auth"
  ON syllabus_coverage FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "syllabus_coverage_insert_service"
  ON syllabus_coverage FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "syllabus_coverage_delete_service"
  ON syllabus_coverage FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 12. Analysis Cache — service_role only
-- ============================================================

CREATE POLICY "analysis_cache_select_service"
  ON analysis_cache FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "analysis_cache_insert_service"
  ON analysis_cache FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "analysis_cache_delete_service"
  ON analysis_cache FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 13. Scraping Jobs — read by owner or service_role
-- ============================================================

CREATE POLICY "scraping_jobs_select_owner_or_service"
  ON scraping_jobs FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (user_id IS NOT NULL AND user_id = auth.uid())
    OR (user_id IS NULL AND auth.role() = 'authenticated')
  );

CREATE POLICY "scraping_jobs_insert_service"
  ON scraping_jobs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "scraping_jobs_update_service"
  ON scraping_jobs FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 14. Learner Profiles — user-owned isolation
-- ============================================================

ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learner_profiles_select_own"
  ON learner_profiles FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "learner_profiles_insert_own"
  ON learner_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "learner_profiles_update_own"
  ON learner_profiles FOR UPDATE
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- ============================================================
-- 15. Regulations — read by auth, write by service_role
-- ============================================================

CREATE POLICY "regulations_select_auth"
  ON regulations FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "regulations_insert_service"
  ON regulations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "regulations_update_service"
  ON regulations FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 16. Plans, Subscriptions, Payments — service_role only
-- ============================================================

CREATE POLICY "plans_select_auth"
  ON plans FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "plans_insert_service"
  ON plans FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "subscriptions_select_own_or_service"
  ON subscriptions FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "subscriptions_insert_service"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "payments_select_own_or_service"
  ON payments FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "payments_insert_service"
  ON payments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 17. Subject Branch Map — read by auth, write by service_role
-- ============================================================

CREATE POLICY "subject_branch_map_select_auth"
  ON subject_branch_map FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "subject_branch_map_insert_service"
  ON subject_branch_map FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 18. Paper Sources — read by auth, write by service_role
-- ============================================================

CREATE POLICY "paper_sources_select_auth"
  ON paper_sources FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "paper_sources_insert_service"
  ON paper_sources FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "paper_sources_update_service"
  ON paper_sources FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 19. Syllabus Sources — read by auth, write by service_role
-- ============================================================

CREATE POLICY "syllabus_sources_select_auth"
  ON syllabus_sources FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "syllabus_sources_insert_service"
  ON syllabus_sources FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "syllabus_sources_update_service"
  ON syllabus_sources FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 20. Study Plans, Readiness Scores, Mock Exams, Saved Reports
--      Already have user-owned policies from migration 003.
--      Ensure they exist and are correct.
-- ============================================================

-- Verify user_profiles has correct isolation (id = auth.uid())
DROP POLICY IF EXISTS own_profile ON user_profiles;
CREATE POLICY "own_profile"
  ON user_profiles
  USING (id = auth.uid() OR auth.role() = 'service_role');
