-- Check if profiles have email populated
SELECT
  id,
  email,
  display_name,
  role,
  onboarding_completed
FROM profiles
ORDER BY updated_at DESC;

-- If emails are NULL, populate them
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Verify update
SELECT
  COUNT(*) as total,
  COUNT(email) as with_email
FROM profiles;
