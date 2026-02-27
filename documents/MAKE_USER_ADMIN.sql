-- MAKE USER ADMIN
-- Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new

-- Option 1: Make dmstest49@gmail.com an admin
UPDATE profiles
SET role = 'admin'
WHERE id = '15480116-8c78-4a75-af8c-2c70795333a6';

-- Verify the change
SELECT
  u.email,
  p.display_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.id = '15480116-8c78-4a75-af8c-2c70795333a6';

-- Expected result:
--   email: dmstest49@gmail.com
--   display_name: dmstest49
--   role: admin


-- Option 2: Make ANY user an admin (by email)
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'your-email@example.com'
-- );


-- Option 3: View all admin users
-- SELECT
--   u.email,
--   p.display_name,
--   p.role,
--   u.last_sign_in_at
-- FROM auth.users u
-- LEFT JOIN profiles p ON p.id = u.id
-- WHERE p.role = 'admin';
