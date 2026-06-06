-- ================================================================
-- MANUAL FIX: Run this in Supabase Dashboard SQL Editor
-- ================================================================
-- Path: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

DROP VIEW IF EXISTS v_questions_regulated CASCADE;

CREATE OR REPLACE VIEW v_questions_regulated AS
SELECT
  q.*,
  p.regulation      AS paper_regulation,
  p.exam_year       AS paper_exam_year,
  p.exam_type       AS paper_exam_type,
  p.exam_month      AS paper_exam_month,
  p.exam_category   AS exam_category,        -- ADDED THIS LINE
  p.college_id      AS paper_college_id,
  p.branch_id       AS paper_branch_id,
  p.semester        AS paper_semester,
  s.regulation      AS subject_regulation,
  s.code            AS subject_code,
  s.name            AS subject_name
FROM questions q
JOIN papers   p ON p.id = q.paper_id
JOIN subjects s ON s.id = q.subject_id;

COMMENT ON VIEW v_questions_regulated IS
  'Use for all analysis queries. Always add WHERE paper_regulation = $1 to prevent cross-regulation analysis.';

-- ================================================================
-- After running, you should see: "Success. No rows returned"
-- Then return to terminal and press Enter
-- ================================================================
