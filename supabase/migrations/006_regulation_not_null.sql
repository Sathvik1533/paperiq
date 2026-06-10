-- 1. Fill any existing NULL values with the default fallback 'R22'
UPDATE learner_profiles
SET regulation = 'R22'
WHERE regulation IS NULL;

-- 2. Alter the column to set default
ALTER TABLE learner_profiles
ALTER COLUMN regulation SET DEFAULT 'R22';

-- 3. Enforce the NOT NULL constraint
ALTER TABLE learner_profiles
ALTER COLUMN regulation SET NOT NULL;
