-- Migration: 007_analysis_cache
-- Create table for Supabase-backed analysis caching (persists across restarts)

CREATE TABLE IF NOT EXISTS analysis_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);

-- Clean up expired entries automatically (run via pg_cron or manual)
-- DELETE FROM analysis_cache WHERE expires_at < NOW();
