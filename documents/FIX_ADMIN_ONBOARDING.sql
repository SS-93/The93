-- FIX ADMIN ONBOARDING LOOP
-- Run this in Supabase Dashboard: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new

-- Check current state
SELECT 
  u.email,
  p.role,
  p.onboarding_completed,
  p.display_name,
  (SELECT COUNT(*) FROM media_ids WHERE user_uuid = u.id) as mediaid_count
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'dmstest49@gmail.com';

-- Fix: Mark admin as onboarding completed (admins bypass MediaID requirement)
UPDATE profiles
SET 
  onboarding_completed = true,
  display_name = COALESCE(display_name, 'Admin'),
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com');

-- Verify fix
SELECT 
  u.email,
  p.role,
  p.onboarding_completed,
  p.display_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'dmstest49@gmail.com';

-- Expected result:
-- email: dmstest49@gmail.com
-- role: admin
-- onboarding_completed: true
-- display_name: Admin
