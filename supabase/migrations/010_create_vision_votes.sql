-- Migration: 010_create_vision_votes.sql (SECURE CORRECTED VERSION)
-- Description: Hardened vision votes schema with duplicate prevention,
--              server-side atomic increment, feature validation, and strict RLS.
-- Notice: PREPARED FOR REVIEW ONLY. DO NOT APPLY TO PRODUCTION WITHOUT AUTHORIZATION.

-- 1. Roadmap Features Catalog (Whitelist)
CREATE TABLE IF NOT EXISTS public.vision_features (
    feature_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed approved roadmap features used by the /vision page
INSERT INTO public.vision_features (feature_id, title, description)
VALUES
    ('exam_intelligence', 'Deep Exam Intelligence', 'Comprehensive question bank indexing and trend analysis'),
    ('exam_mentor', 'Intelligent Exam Mentor', 'Adaptive AI tutor and personalized study planning'),
    ('academic_os', 'The Complete Academic OS', 'Full curriculum lifecycle, resource vault, and analytics'),
    ('the_future', 'The Future of Learning', 'Collaborative peer learning and multimodal intelligence')
ON CONFLICT (feature_id) DO NOTHING;

-- 2. Aggregate Vote Counts (Strictly Read-Only to Public)
CREATE TABLE IF NOT EXISTS public.vision_votes (
    feature_id TEXT PRIMARY KEY REFERENCES public.vision_features(feature_id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize aggregate rows for catalog features
INSERT INTO public.vision_votes (feature_id, count)
SELECT feature_id, 0 FROM public.vision_features
ON CONFLICT (feature_id) DO NOTHING;

-- 3. Granular User Vote Ledger for Duplicate Prevention
CREATE TABLE IF NOT EXISTS public.vision_user_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id TEXT NOT NULL REFERENCES public.vision_features(feature_id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vision_user_vote UNIQUE (feature_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_vision_user_votes_voter ON public.vision_user_votes(voter_hash);
CREATE INDEX IF NOT EXISTS idx_vision_user_votes_feature ON public.vision_user_votes(feature_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.vision_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_user_votes ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies
-- Public Read Access: Anyone can read features and aggregate counts
DROP POLICY IF EXISTS "vision_features_public_read" ON public.vision_features;
CREATE POLICY "vision_features_public_read"
    ON public.vision_features
    FOR SELECT
    TO PUBLIC
    USING (true);

DROP POLICY IF EXISTS "vision_votes_public_read" ON public.vision_votes;
CREATE POLICY "vision_votes_public_read"
    ON public.vision_votes
    FOR SELECT
    TO PUBLIC
    USING (true);

-- NO direct public INSERT/UPDATE on aggregate votes!
-- Drop old vulnerable policies if they exist
DROP POLICY IF EXISTS "vision_votes_public_insert" ON public.vision_votes;
DROP POLICY IF EXISTS "vision_votes_public_update" ON public.vision_votes;

-- Service role full access
DROP POLICY IF EXISTS "vision_features_service_all" ON public.vision_features;
CREATE POLICY "vision_features_service_all"
    ON public.vision_features
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "vision_votes_service_all" ON public.vision_votes;
CREATE POLICY "vision_votes_service_all"
    ON public.vision_votes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "vision_user_votes_service_all" ON public.vision_user_votes;
CREATE POLICY "vision_user_votes_service_all"
    ON public.vision_user_votes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Explicit Table Grants: Deny direct modification to client roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.vision_features FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.vision_votes FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.vision_user_votes FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.vision_features TO anon, authenticated;
GRANT SELECT ON public.vision_votes TO anon, authenticated;

-- 7. Secure Server-Side Atomic Increment Function
CREATE OR REPLACE FUNCTION public.record_vision_vote(
    p_feature_id TEXT,
    p_voter_hash TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_inserted_id UUID;
    v_new_count INTEGER;
BEGIN
    -- Whitelist check: feature must exist in catalog
    IF NOT EXISTS (SELECT 1 FROM public.vision_features WHERE feature_id = p_feature_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'invalid_feature',
            'message', 'Feature is not on the roadmap'
        );
    END IF;

    -- Idempotent duplicate check: attempt ledger insertion
    INSERT INTO public.vision_user_votes (feature_id, voter_hash, user_id)
    VALUES (p_feature_id, p_voter_hash, p_user_id)
    ON CONFLICT (feature_id, voter_hash) DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NULL THEN
        -- Duplicate vote attempt: retrieve existing count without incrementing
        SELECT count INTO v_new_count FROM public.vision_votes WHERE feature_id = p_feature_id;
        RETURN jsonb_build_object(
            'success', false,
            'status', 'already_voted',
            'message', 'Vote has already been recorded for this feature',
            'count', COALESCE(v_new_count, 0)
        );
    END IF;

    -- Atomic count increment
    INSERT INTO public.vision_votes (feature_id, count, updated_at)
    VALUES (p_feature_id, 1, NOW())
    ON CONFLICT (feature_id) DO UPDATE SET
        count = public.vision_votes.count + 1,
        updated_at = NOW()
    RETURNING count INTO v_new_count;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'voted',
        'count', v_new_count
    );
END;
$$;

-- Function permission: Only service_role can call this stored procedure
REVOKE ALL ON FUNCTION public.record_vision_vote(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_vision_vote(TEXT, TEXT, UUID) TO service_role;
