-- ===============================================
-- FIX ARTIST PROFILES FOREIGN KEY CONSTRAINT
-- ===============================================
-- This fixes the production issue where content_items references
-- the old 'artists' table instead of 'artist_profiles'
--
-- ORDERING: data migration MUST happen before FK constraints are added,
-- otherwise PostgreSQL rejects the constraint because existing artist_id
-- values still point to the old artists table (not artist_profiles).

-- -----------------------------------------------
-- Step 1: Migrate data from artists → artist_profiles
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION migrate_artists_to_profiles()
RETURNS void AS $$
DECLARE
  artist_record RECORD;
BEGIN
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
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Migrated artists to artist_profiles';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT migrate_artists_to_profiles();

-- -----------------------------------------------
-- Step 2: Update content_items to reference artist_profiles IDs
-- -----------------------------------------------
UPDATE content_items SET artist_id = (
  SELECT ap.id
  FROM artist_profiles ap
  JOIN artists a ON ap.user_id = a.user_id
  WHERE a.id = content_items.artist_id
) WHERE EXISTS (
  SELECT 1 FROM artists WHERE id = content_items.artist_id
);

-- -----------------------------------------------
-- Step 3: Update subscriptions to reference artist_profiles IDs
-- -----------------------------------------------
UPDATE subscriptions SET artist_id = (
  SELECT ap.id
  FROM artist_profiles ap
  JOIN artists a ON ap.user_id = a.user_id
  WHERE a.id = subscriptions.artist_id
) WHERE EXISTS (
  SELECT 1 FROM artists WHERE id = subscriptions.artist_id
);

-- -----------------------------------------------
-- Step 4: Drop old foreign key constraints
-- -----------------------------------------------
ALTER TABLE content_items
  DROP CONSTRAINT IF EXISTS content_items_artist_id_fkey;

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_artist_id_fkey;

-- -----------------------------------------------
-- Step 5: Add new FK constraints pointing to artist_profiles
-- (safe now — all rows have been migrated above)
-- -----------------------------------------------
ALTER TABLE content_items
  ADD CONSTRAINT content_items_artist_id_fkey
  FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_artist_id_fkey
  FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

-- -----------------------------------------------
-- Step 6: Update RLS policies
-- -----------------------------------------------
DROP POLICY IF EXISTS "Artists can manage their own content" ON content_items;
CREATE POLICY "Artists can manage their own content" ON content_items
  FOR ALL USING (
    EXISTS(SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id)
  );

DROP POLICY IF EXISTS "Artists can insert their content" ON content_items;
CREATE POLICY "Artists can insert their content" ON content_items
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id)
  );

-- -----------------------------------------------
-- Step 7: Backward compatibility view
-- -----------------------------------------------
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

-- -----------------------------------------------
-- Verification
-- -----------------------------------------------
DO $$ BEGIN
  RAISE NOTICE '✅ ARTIST PROFILES CONSTRAINT FIX COMPLETED';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - Migrated data from artists → artist_profiles';
  RAISE NOTICE '  - Updated content_items.artist_id to new profile IDs';
  RAISE NOTICE '  - Updated subscriptions.artist_id to new profile IDs';
  RAISE NOTICE '  - Dropped old FK constraints';
  RAISE NOTICE '  - Added FK constraints referencing artist_profiles';
  RAISE NOTICE '  - Updated RLS policies';
  RAISE NOTICE '  - Created artists_view for backward compatibility';
END $$;
