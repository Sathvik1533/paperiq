-- =============================================================================
-- Migration 012: PaperIQ AI Companion Conversations & Messages
-- =============================================================================
-- Description:
-- Creates persistent conversation and message ledger for the PaperIQ AI Companion.
-- Enforces Row-Level Security (RLS) so students can only access their own chats.
-- =============================================================================

-- 1. Create companion_conversations table
CREATE TABLE IF NOT EXISTS public.companion_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Study Session',
    subject_code TEXT,
    regulation TEXT NOT NULL DEFAULT 'R22',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast conversation lookup by user
CREATE INDEX IF NOT EXISTS idx_companion_conv_user ON public.companion_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_conv_updated ON public.companion_conversations(updated_at DESC);

-- Enable RLS on conversations
ALTER TABLE public.companion_conversations ENABLE ROW LEVEL SECURITY;

-- Conversations RLS Policies: users can only view, insert, update, delete their own conversations
CREATE POLICY "companion_conversations_select_own"
    ON public.companion_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "companion_conversations_insert_own"
    ON public.companion_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companion_conversations_update_own"
    ON public.companion_conversations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companion_conversations_delete_own"
    ON public.companion_conversations
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Create companion_messages table
CREATE TABLE IF NOT EXISTS public.companion_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.companion_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent TEXT,
    specialist TEXT,
    citations JSONB DEFAULT '[]'::jsonb,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast message retrieval ordered by creation time
CREATE INDEX IF NOT EXISTS idx_companion_msg_conv ON public.companion_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_companion_msg_created ON public.companion_messages(created_at ASC);

-- Enable RLS on messages
ALTER TABLE public.companion_messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS Policies: users can only access messages belonging to their own conversations
CREATE POLICY "companion_messages_select_own"
    ON public.companion_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.companion_conversations
            WHERE public.companion_conversations.id = companion_messages.conversation_id
            AND public.companion_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "companion_messages_insert_own"
    ON public.companion_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companion_conversations
            WHERE public.companion_conversations.id = companion_messages.conversation_id
            AND public.companion_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "companion_messages_delete_own"
    ON public.companion_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.companion_conversations
            WHERE public.companion_conversations.id = companion_messages.conversation_id
            AND public.companion_conversations.user_id = auth.uid()
        )
    );
