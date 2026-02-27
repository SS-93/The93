-- ============================================================================
-- UPDATE USER ROLE TO ARTIST
-- ============================================================================
-- Purpose: Update dmstest49@gmail.com to have artist role and create profile
-- Date: 2026-02-03
-- ============================================================================

-- Step 1: Find the user
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as current_role
FROM auth.users
WHERE email = 'dmstest49@gmail.com';

-- Step 2: Update user metadata to set role to 'artist'
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"artist"'
  ),
  updated_at = NOW()
WHERE email = 'dmstest49@gmail.com';

-- Step 3: Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as updated_role,
  updated_at
FROM auth.users
WHERE email = 'dmstest49@gmail.com';

-- Step 4: Check if artist_profile exists
SELECT 
  ap.id,
  ap.artist_name,
  ap.user_id,
  ap.created_at
FROM artist_profiles ap
JOIN auth.users u ON u.id = ap.user_id
WHERE u.email = 'dmstest49@gmail.com';

-- Step 5: Create artist_profile if it doesn't exist
-- (Only runs if no profile exists)
INSERT INTO artist_profiles (
  id,
  user_id,
  artist_name,
  bio,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', 'DMS Test Artist') as artist_name,
  'Test artist profile for Coliseum Analytics testing' as bio,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'dmstest49@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM artist_profiles WHERE user_id = u.id
  );

-- Step 6: Verify artist_profile exists
SELECT 
  ap.id as artist_profile_id,
  ap.artist_name,
  u.id as user_id,
  u.email,
  ap.created_at
FROM artist_profiles ap
JOIN auth.users u ON u.id = ap.user_id
WHERE u.email = 'dmstest49@gmail.com';

-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================

-- ✅ User role updated to 'artist'
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  CASE 
    WHEN raw_user_meta_data->>'role' = 'artist' THEN '✅ ARTIST'
    ELSE '❌ NOT ARTIST'
  END as status
FROM auth.users
WHERE email = 'dmstest49@gmail.com';

-- ✅ Artist profile exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PROFILE EXISTS'
    ELSE '❌ NO PROFILE'
  END as profile_status,
  COUNT(*) as profile_count
FROM artist_profiles ap
JOIN auth.users u ON u.id = ap.user_id
WHERE u.email = 'dmstest49@gmail.com';

-- ============================================================================
-- CLEANUP (if needed)
-- ============================================================================

-- To remove artist role (revert):
/*
UPDATE auth.users
SET 
  raw_user_meta_data = raw_user_meta_data - 'role',
  updated_at = NOW()
WHERE email = 'dmstest49@gmail.com';
*/

-- To delete artist profile (revert):
/*
DELETE FROM artist_profiles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com'
);
*/
