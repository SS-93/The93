-- ADD EMAIL TO PROFILES TABLE
-- This makes it easier to display user info in DIA dashboard
-- Run this in Supabase Dashboard: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;

    -- Populate email from auth.users
    UPDATE profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id;

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

    RAISE NOTICE 'Email column added to profiles table';
  ELSE
    RAISE NOTICE 'Email column already exists in profiles table';
  END IF;
END $$;

-- Create a trigger to keep email in sync when auth.users email changes
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
CREATE TRIGGER on_auth_user_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- Verify
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'email';
