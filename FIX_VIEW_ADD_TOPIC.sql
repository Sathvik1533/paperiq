-- Fix v_questions_regulated view to include topic_name and classification_confidence
-- Run this in Supabase Dashboard → SQL Editor

DROP VIEW IF EXISTS v_questions_regulated;

CREATE VIEW v_questions_regulated AS
SELECT 
    q.id,
    q.paper_id,
    q.subject_id,
    q.question_number,
    q.part,
    q.section,
    q.question_text,
    q.question_type,
    q.marks,
    q.co,
    q.bloom_level,
    q.unit_number,
    q.unit_name,
    q.topic_tags,
    q.topic_name,                    -- NEW: Classification topic
    q.classification_confidence,     -- NEW: Classification confidence
    q.is_or_question,
    q.normalized_text,
    q.question_hash,
    q.created_at,
    q.regulation,
    q.college_id,
    q.branch_id,
    q.semester,
    q.exam_year,
    p.regulation AS paper_regulation,
    p.exam_type,
    p.exam_category,
    p.exam_month,
    p.college_id AS paper_college_id,
    p.branch_id AS paper_branch_id,
    p.semester AS paper_semester,
    s.regulation AS subject_regulation,
    s.code AS subject_code,
    s.name AS subject_name
FROM questions q
LEFT JOIN papers p ON q.paper_id = p.id
LEFT JOIN subjects s ON q.subject_id = s.id;

-- Verify
SELECT COUNT(*) as total_questions, 
       COUNT(topic_name) as with_topics,
       ROUND(COUNT(topic_name)::NUMERIC / COUNT(*) * 100, 1) as topic_coverage_pct
FROM v_questions_regulated;
