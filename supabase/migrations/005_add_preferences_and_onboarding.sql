-- Add preferences JSONB column to user_profiles for Settings page
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add onboarding_complete flag
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add target_marks column used by Profile page
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_marks FLOAT;

-- Add preparation_level for study recommendations
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preparation_level TEXT DEFAULT 'intermediate';
