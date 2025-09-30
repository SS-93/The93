-- ===============================================
-- FIX PRODUCTION ARTIST PROFILES CONSTRAINT
-- ===============================================
-- Production-specific fix for artist_id foreign key issue

-- Step 1: Migrate data from old artists table to artist_profiles
CREATE OR REPLACE FUNCTION migrate_production_artists()
RETURNS void AS $$
DECLARE
  artist_record RECORD;
BEGIN
  -- For each record in old artists table, ensure artist_profiles record exists
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

  RAISE NOTICE 'Migrated % artists to artist_profiles', (
    SELECT COUNT(*) FROM artists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run migration
SELECT migrate_production_artists();

-- Step 2: Update content_items to reference artist_profiles IDs
UPDATE content_items SET artist_id = (
  SELECT ap.id
  FROM artist_profiles ap
  JOIN artists a ON ap.user_id = a.user_id
  WHERE a.id = content_items.artist_id
) WHERE artist_id IN (SELECT id FROM artists);

-- Step 3: Update subscriptions to reference artist_profiles IDs
UPDATE subscriptions SET artist_id = (
  SELECT ap.id
  FROM artist_profiles ap
  JOIN artists a ON ap.user_id = a.user_id
  WHERE a.id = subscriptions.artist_id
) WHERE artist_id IN (SELECT id FROM artists);

-- Step 4: Drop old foreign key constraints
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_artist_id_fkey;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_artist_id_fkey;

-- Step 5: Add new foreign key constraints pointing to artist_profiles
ALTER TABLE content_items
ADD CONSTRAINT content_items_artist_id_fkey
FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_artist_id_fkey
FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

-- Step 6: Update RLS policies
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

DROP POLICY IF EXISTS "Artists can view their content processing jobs" ON audio_processing_jobs;
CREATE POLICY "Artists can view their content processing jobs" ON audio_processing_jobs
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM content_items ci
      JOIN artist_profiles ap ON ci.artist_id = ap.id
      WHERE ci.id = content_id AND ap.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Artists can insert processing jobs" ON audio_processing_jobs;
CREATE POLICY "Artists can insert processing jobs" ON audio_processing_jobs
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM content_items ci
      JOIN artist_profiles ap ON ci.artist_id = ap.id
      WHERE ci.id = content_id AND ap.user_id = auth.uid()
    )
  );

-- Verification queries
DO $$
DECLARE
  content_count INTEGER;
  artist_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO content_count FROM content_items;
  SELECT COUNT(*) INTO artist_count FROM artists;
  SELECT COUNT(*) INTO profile_count FROM artist_profiles;

  RAISE NOTICE '✅ PRODUCTION MIGRATION COMPLETED';
  RAISE NOTICE 'Database stats:';
  RAISE NOTICE '  - % content items updated', content_count;
  RAISE NOTICE '  - % artists in old table', artist_count;
  RAISE NOTICE '  - % artist profiles created', profile_count;
  RAISE NOTICE 'All foreign keys now point to artist_profiles table';
END $$;