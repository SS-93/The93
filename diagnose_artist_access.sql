-- ============================================================================
-- DIAGNOSE ARTIST ACCESS ISSUE
-- ============================================================================
-- Purpose: Investigate why dmstest49@gmail.com sees "access denied"
-- Date: 2026-02-03
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify User Identity & Role
-- ============================================================================

SELECT 
  '=== USER IDENTITY ===' as section,
  id as user_id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmed_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'dmstest49@gmail.com';

-- ============================================================================
-- STEP 2: Check Artist Profile
-- ============================================================================

SELECT 
  '=== ARTIST PROFILE ===' as section,
  ap.id as artist_profile_id,
  ap.user_id,
  ap.artist_name,
  ap.bio,
  ap.created_at,
  ap.updated_at,
  CASE 
    WHEN ap.id IS NOT NULL THEN '✅ Profile exists'
    ELSE '❌ Profile missing'
  END as status
FROM auth.users u
LEFT JOIN artist_profiles ap ON ap.user_id = u.id
WHERE u.email = 'dmstest49@gmail.com';

-- ============================================================================
-- STEP 3: Check RLS Policies on artist_profiles
-- ============================================================================

SELECT 
  '=== RLS POLICIES (artist_profiles) ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'artist_profiles'
ORDER BY policyname;

-- ============================================================================
-- STEP 4: Test if user can SELECT their artist profile
-- ============================================================================

-- This simulates what happens when user is logged in
-- Run this with user's JWT token if possible

SELECT 
  '=== PROFILE ACCESS TEST ===' as section,
  COUNT(*) as accessible_profiles
FROM artist_profiles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com'
);

-- ============================================================================
-- STEP 5: Check content_items access (if artist uploads content)
-- ============================================================================

SELECT 
  '=== CONTENT ITEMS ===' as section,
  ci.id,
  ci.title,
  ci.artist_name,
  ci.artist_id,
  ci.created_at,
  CASE 
    WHEN ci.artist_id = ap.id THEN '✅ Linked to artist'
    ELSE '⚠️ Orphaned content'
  END as link_status
FROM content_items ci
LEFT JOIN artist_profiles ap ON ap.id = ci.artist_id
WHERE ci.artist_id = (
  SELECT id FROM artist_profiles 
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com'
  )
);

-- ============================================================================
-- STEP 6: Check for any blocking issues
-- ============================================================================

SELECT 
  '=== POTENTIAL BLOCKERS ===' as section,
  CASE 
    WHEN (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE email = 'dmstest49@gmail.com') IS NULL 
      THEN '❌ No role set in user metadata'
    WHEN (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE email = 'dmstest49@gmail.com') != 'artist'
      THEN '❌ Role is not "artist"'
    ELSE '✅ Role is set to artist'
  END as role_check,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM artist_profiles ap
      JOIN auth.users u ON u.id = ap.user_id
      WHERE u.email = 'dmstest49@gmail.com'
    ) THEN '❌ No artist profile exists'
    ELSE '✅ Artist profile exists'
  END as profile_check,
  CASE 
    WHEN (SELECT email_confirmed_at FROM auth.users WHERE email = 'dmstest49@gmail.com') IS NULL
      THEN '⚠️ Email not confirmed'
    ELSE '✅ Email confirmed'
  END as email_check;

-- ============================================================================
-- STEP 7: Check JWT claims (what's in the token)
-- ============================================================================

-- Note: This shows what SHOULD be in the JWT token
-- If the browser still has an old JWT, it won't have the updated role

SELECT 
  '=== EXPECTED JWT CLAIMS ===' as section,
  jsonb_build_object(
    'sub', u.id,
    'email', u.email,
    'role', u.raw_user_meta_data->>'role',
    'user_metadata', u.raw_user_meta_data,
    'app_metadata', jsonb_build_object(
      'provider', 'email'
    )
  ) as expected_jwt_payload
FROM auth.users u
WHERE u.email = 'dmstest49@gmail.com';

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================

SELECT 
  '=== DIAGNOSTIC SUMMARY ===' as section,
  email,
  raw_user_meta_data->>'role' as db_role,
  CASE 
    WHEN EXISTS (SELECT 1 FROM artist_profiles WHERE user_id = auth.users.id)
    THEN 'YES ✅'
    ELSE 'NO ❌'
  END as has_artist_profile,
  CASE 
    WHEN raw_user_meta_data->>'role' = 'artist' 
      AND EXISTS (SELECT 1 FROM artist_profiles WHERE user_id = auth.users.id)
    THEN '✅ READY - User should have access'
    WHEN raw_user_meta_data->>'role' = 'artist'
      AND NOT EXISTS (SELECT 1 FROM artist_profiles WHERE user_id = auth.users.id)
    THEN '⚠️ MISSING PROFILE - Create artist_profiles entry'
    WHEN raw_user_meta_data->>'role' IS NULL
    THEN '❌ NO ROLE - Set role to artist'
    ELSE '⚠️ UNEXPECTED STATE - Check role: ' || COALESCE(raw_user_meta_data->>'role', 'null')
  END as diagnosis,
  'Clear localStorage, sign out, sign in again' as next_step
FROM auth.users
WHERE email = 'dmstest49@gmail.com';
