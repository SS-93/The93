-- DEBUG PROFILE FETCH
-- This replicates the exact query useUserMatrix runs

-- 1. What the code is doing:
SELECT *
FROM profiles
ORDER BY updated_at DESC NULLS LAST
LIMIT 100;

-- 2. Check for NULL updated_at
SELECT
  id,
  email,
  display_name,
  role,
  updated_at,
  CASE WHEN updated_at IS NULL THEN 'NULL!' ELSE 'OK' END as updated_at_status
FROM profiles
ORDER BY updated_at DESC NULLS LAST;

-- 3. Show all 3 profiles with their details
SELECT
  id,
  email,
  display_name,
  role,
  onboarding_completed,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC;

-- 4. If updated_at is NULL, fix it
UPDATE profiles
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- Verify fix
SELECT COUNT(*) as total, COUNT(updated_at) as with_updated_at
FROM profiles;
