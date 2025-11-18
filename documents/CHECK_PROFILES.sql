-- CHECK PROFILES TABLE
-- Run in Supabase Dashboard to see all users

-- 1. Check all profiles
SELECT
  id,
  email,
  display_name,
  role,
  onboarding_completed,
  created_at,
  updated_at
FROM profiles
ORDER BY updated_at DESC;

-- 2. Check if email column exists and is populated
SELECT
  COUNT(*) as total_profiles,
  COUNT(email) as profiles_with_email,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as profiles_with_valid_email
FROM profiles;

-- 3. Compare auth.users vs profiles
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)) as users_without_profile;

-- 4. Find users in auth.users but not in profiles
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ORDER BY u.created_at DESC;

-- 5. If profiles are missing, create them
-- Uncomment to run:
-- INSERT INTO profiles (id, email, display_name, role, onboarding_completed, created_at, updated_at)
-- SELECT
--   u.id,
--   u.email,
--   COALESCE(u.raw_user_meta_data->>'display_name', SPLIT_PART(u.email, '@', 1)) as display_name,
--   COALESCE(u.raw_user_meta_data->>'role', 'fan') as role,
--   false as onboarding_completed,
--   u.created_at,
--   NOW() as updated_at
-- FROM auth.users u
-- WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
