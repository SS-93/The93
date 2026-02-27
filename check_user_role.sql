-- ============================================================================
-- CHECK USER ROLE
-- ============================================================================
-- Purpose: Check the current role of dmstest49@gmail.com
-- Date: 2026-02-03
-- ============================================================================

-- Query 1: Check user role and basic info
SELECT 
  id as user_id,
  email,
  raw_user_meta_data->>'role' as current_role,
  raw_user_meta_data->>'name' as user_name,
  created_at,
  updated_at,
  CASE 
    WHEN raw_user_meta_data->>'role' = 'artist' THEN '🎨 Artist'
    WHEN raw_user_meta_data->>'role' = 'admin' THEN '⚙️ Admin'
    WHEN raw_user_meta_data->>'role' = 'user' THEN '👤 User'
    WHEN raw_user_meta_data->>'role' IS NULL THEN '❓ No role set'
    ELSE '🔹 ' || (raw_user_meta_data->>'role')
  END as role_status
FROM auth.users
WHERE email = 'dmstest49@gmail.com';

-- Query 2: Check if artist profile exists
SELECT 
  ap.id as artist_profile_id,
  ap.artist_name,
  ap.bio,
  ap.created_at as profile_created,
  '✅ Artist profile exists' as status
FROM artist_profiles ap
JOIN auth.users u ON u.id = ap.user_id
WHERE u.email = 'dmstest49@gmail.com'

UNION ALL

SELECT 
  NULL as artist_profile_id,
  NULL as artist_name,
  NULL as bio,
  NULL as profile_created,
  '❌ No artist profile' as status
WHERE NOT EXISTS (
  SELECT 1 
  FROM artist_profiles ap
  JOIN auth.users u ON u.id = ap.user_id
  WHERE u.email = 'dmstest49@gmail.com'
);

-- Query 3: Show all metadata for user
SELECT 
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'dmstest49@gmail.com';
