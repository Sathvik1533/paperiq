-- Migration: 011_seed_r22_3_1_and_3_2_curriculum.sql
-- Description: Additive, idempotent seed for MLRIT R22 CSE 3-1 and 3-2 curriculum
-- Verified against: MLRIT Autonomous Examination Scheme Notification & Official R22 CSE Syllabus PDF
-- RESTRICTION NOTICE: This migration is prepared for review only. DO NOT apply to production without authorization.

DO $$
DECLARE
    v_college_id UUID;
    v_cse_branch_id UUID;
    v_it_branch_id UUID;
BEGIN
    -- 1. Resolve college and branch identifiers
    SELECT id INTO v_college_id FROM public.colleges WHERE short_name = 'MLRIT' LIMIT 1;
    IF v_college_id IS NULL THEN
        v_college_id := 'a0000000-0000-0000-0000-000000000001'::uuid;
    END IF;

    SELECT id INTO v_cse_branch_id FROM public.branches WHERE college_id = v_college_id AND short_name = 'CSE' LIMIT 1;
    IF v_cse_branch_id IS NULL THEN
        v_cse_branch_id := 'b0000000-0000-0000-0000-000000000001'::uuid;
    END IF;

    SELECT id INTO v_it_branch_id FROM public.branches WHERE college_id = v_college_id AND short_name = 'IT' LIMIT 1;
    IF v_it_branch_id IS NULL THEN
        v_it_branch_id := 'b0000000-0000-0000-0000-000000000002'::uuid;
    END IF;

    -- 2. Add unique constraint on (college_id, code, regulation) if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_subjects_college_code_reg'
    ) THEN
        ALTER TABLE public.subjects 
        ADD CONSTRAINT uq_subjects_college_code_reg UNIQUE (college_id, code, regulation);
    END IF;

    -- 3. Upsert Semester 3-1 (III B.Tech I Semester) Subjects
    -- PCC: Core Theory
    INSERT INTO public.subjects (id, college_id, name, code, semester, year, regulation)
    VALUES
        ('c3010000-0000-0000-0000-000000000001'::uuid, v_college_id, 'Design and Analysis of Algorithms', 'A6CS15', 1, 3, 'R22'),
        ('c3010000-0000-0000-0000-000000000002'::uuid, v_college_id, 'Cloud and DevOps', 'A6IT13', 1, 3, 'R22'),
        ('c3010000-0000-0000-0000-000000000003'::uuid, v_college_id, 'Computer Networks', 'A6CS18', 1, 3, 'R22'),
        ('c3010000-0000-0000-0000-000000000004'::uuid, v_college_id, 'Information Retrieval Systems', 'A6IT26', 1, 3, 'R22'),
        ('c3010000-0000-0000-0000-000000000005'::uuid, v_college_id, 'Natural Language Processing', 'A6AI14', 1, 3, 'R22')
    ON CONFLICT (college_id, code, regulation) DO UPDATE SET
        name = EXCLUDED.name,
        semester = EXCLUDED.semester,
        year = EXCLUDED.year;

    -- 4. Upsert Semester 3-2 (III B.Tech II Semester) Subjects
    -- PCC: Core Theory & Lab, PEC: Professional Electives, PWC: Project, ES: Environmental Science
    INSERT INTO public.subjects (id, college_id, name, code, semester, year, regulation)
    VALUES
        ('c3020000-0000-0000-0000-000000000001'::uuid, v_college_id, 'Introduction to Artificial Intelligence', 'A6IT39', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000002'::uuid, v_college_id, 'Automata and Compiler Design', 'A6IT11', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000003'::uuid, v_college_id, 'Data Mining and Machine Learning', 'A6CS16', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000004'::uuid, v_college_id, 'Big Data Analytics', 'A6CS44', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000005'::uuid, v_college_id, 'Deep Learning', 'A6AI17', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000006'::uuid, v_college_id, 'Smart Contract Development and Audit', 'A6CS31', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000007'::uuid, v_college_id, 'Data Mining and Machine Learning Lab', 'A6CS17', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000008'::uuid, v_college_id, 'Industry Oriented Mini Project / Internship', 'A6CS21', 2, 3, 'R22'),
        ('c3020000-0000-0000-0000-000000000009'::uuid, v_college_id, 'Environmental Science', 'A6BS11', 2, 3, 'R22')
    ON CONFLICT (college_id, code, regulation) DO UPDATE SET
        name = EXCLUDED.name,
        semester = EXCLUDED.semester,
        year = EXCLUDED.year;

    -- 5. Map all new subjects to CSE branch
    INSERT INTO public.subject_branch_map (subject_id, branch_id)
    SELECT s.id, v_cse_branch_id
    FROM public.subjects s
    WHERE s.regulation = 'R22' AND s.year = 3 AND s.college_id = v_college_id
    ON CONFLICT (subject_id, branch_id) DO NOTHING;

    -- 6. Also map IT-relevant courses to IT branch
    INSERT INTO public.subject_branch_map (subject_id, branch_id)
    SELECT s.id, v_it_branch_id
    FROM public.subjects s
    WHERE s.regulation = 'R22' AND s.code IN ('A6IT13', 'A6CS18', 'A6IT26', 'A6IT39', 'A6IT11') AND s.college_id = v_college_id
    ON CONFLICT (subject_id, branch_id) DO NOTHING;

    RAISE NOTICE 'MLRIT R22 CSE 3-1 and 3-2 curriculum seeded idempotently. Existing 2-1 and 2-2 data fully preserved.';
END $$;
