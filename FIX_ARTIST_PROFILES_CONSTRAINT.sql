-- ===============================================
-- FIX ARTIST PROFILES FOREIGN KEY CONSTRAINT
-- ===============================================
-- This fixes the production issue where content_items references
-- the old 'artists' table instead of 'artist_profiles'

-- Step 1: Drop the old foreign key constraint
ALTER TABLE content_items
DROP CONSTRAINT IF EXISTS content_items_artist_id_fkey;

-- Step 2: Add the correct foreign key constraint pointing to artist_profiles
ALTER TABLE content_items
ADD CONSTRAINT content_items_artist_id_fkey
FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

-- Step 3: Update RLS policies to be consistent with artist_profiles table
DROP POLICY IF EXISTS "Artists can manage their own content" ON content_items;
CREATE POLICY "Artists can manage their own content" ON content_items
  FOR ALL USING (
    EXISTS(SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id)
  );

-- Step 4: Ensure subscriptions table also references artist_profiles
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_artist_id_fkey;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_artist_id_fkey
FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

-- Step 5: Create a function to migrate existing data from artists to artist_profiles
CREATE OR REPLACE FUNCTION migrate_artists_to_profiles()
RETURNS void AS $$
DECLARE
  artist_record RECORD;
BEGIN
  -- For each record in old artists table, create corresponding artist_profiles record
  FOR artist_record IN
    SELECT * FROM artists a
    WHERE NOT EXISTS (
      SELECT 1 FROM artist_profiles ap WHERE ap.user_id = a.user_id
    )
  LOOP
    INSERT INTO artist_profiles (
      user_id, artist_name, bio, banner_url, social_links,
      verification_status, created_at, updated_at
    )
    VALUES (
      artist_record.user_id,
      artist_record.artist_name,
      artist_record.bio,
      artist_record.banner_url,
      artist_record.social_links,
      artist_record.verification_status,
      artist_record.created_at,
      artist_record.updated_at
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Run the migration
SELECT migrate_artists_to_profiles();

-- Step 7: Update any existing content_items to use artist_profiles IDs
UPDATE content_items SET artist_id = (
  SELECT ap.id
  FROM artist_profiles ap
  JOIN artists a ON ap.user_id = a.user_id
  WHERE a.id = content_items.artist_id
) WHERE EXISTS (
  SELECT 1 FROM artists WHERE id = content_items.artist_id
);

-- Step 8: Update subscriptions to use artist_profiles IDs
UPDATE subscriptions SET artist_id = (
  SELECT ap.id
  FROM artist_profiles ap
  JOIN artists a ON ap.user_id = a.user_id
  WHERE a.id = subscriptions.artist_id
) WHERE EXISTS (
  SELECT 1 FROM artists WHERE id = subscriptions.artist_id
);

-- Step 9: Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW artists_view AS
SELECT
  id,
  user_id,
  artist_name,
  bio,
  banner_url,
  social_links,
  verification_status,
  created_at,
  updated_at
FROM artist_profiles;

-- Success message
DO $$ BEGIN
  RAISE NOTICE '✅ ARTIST PROFILES CONSTRAINT FIX COMPLETED';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - Updated content_items foreign key to reference artist_profiles';
  RAISE NOTICE '  - Updated subscriptions foreign key to reference artist_profiles';
  RAISE NOTICE '  - Migrated data from artists to artist_profiles';
  RAISE NOTICE '  - Updated existing records to use new artist_profile IDs';
  RAISE NOTICE '  - Created backward compatibility view';
END $$;