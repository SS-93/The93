-- CREATE DIA USER VIEW
-- This view exposes auth.users data joined with profiles for the DIA dashboard
-- Run this in Supabase Dashboard: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new

-- Create a database function to get user auth data (accessible via RPC)
CREATE OR REPLACE FUNCTION get_dia_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  display_name TEXT,
  role TEXT,
  onboarding_completed BOOLEAN
)
SECURITY DEFINER -- Run as function owner (bypasses RLS)
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.confirmed_at as email_confirmed_at,
    p.display_name,
    p.role,
    p.onboarding_completed
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  ORDER BY u.last_sign_in_at DESC NULLS LAST
  LIMIT 100;
END;
$$;

-- Grant execute permission to authenticated users (only admins should call this)
GRANT EXECUTE ON FUNCTION get_dia_users() TO authenticated;

-- Test the function
-- SELECT * FROM get_dia_users();
