-- ===============================================
-- FIX ARTIST PROFILES CONSTRAINT MIGRATION
-- ===============================================
-- Fixes production issue where content_items FK references old artists table

-- Step 1: Ensure artist_profiles records exist for all users with artist role
INSERT INTO artist_profiles (user_id, artist_name, bio, verification_status)
SELECT
  p.id as user_id,
  COALESCE(p.display_name, 'Artist') as artist_name,
  'Migrated artist profile' as bio,
  'pending' as verification_status
FROM profiles p
WHERE p.role = 'artist'
AND NOT EXISTS (
  SELECT 1 FROM artist_profiles ap WHERE ap.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: First drop foreign key constraints to allow updates
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_artist_id_fkey;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_artist_id_fkey;

-- Step 3: If old artists table exists, migrate data to artist_profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artists') THEN
    -- Migrate data from artists to artist_profiles
    INSERT INTO artist_profiles (user_id, artist_name, bio, banner_url, social_links, verification_status, created_at, updated_at)
    SELECT
      a.user_id,
      a.artist_name,
      a.bio,
      a.banner_url,
      a.social_links,
      a.verification_status,
      a.created_at,
      a.updated_at
    FROM artists a
    WHERE NOT EXISTS (
      SELECT 1 FROM artist_profiles ap WHERE ap.user_id = a.user_id
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Update content_items to use artist_profiles IDs
    UPDATE content_items SET artist_id = (
      SELECT ap.id
      FROM artist_profiles ap
      JOIN artists a ON ap.user_id = a.user_id
      WHERE a.id = content_items.artist_id
    ) WHERE EXISTS (
      SELECT 1 FROM artists WHERE id = content_items.artist_id
    );

    -- Update subscriptions to use artist_profiles IDs
    UPDATE subscriptions SET artist_id = (
      SELECT ap.id
      FROM artist_profiles ap
      JOIN artists a ON ap.user_id = a.user_id
      WHERE a.id = subscriptions.artist_id
    ) WHERE EXISTS (
      SELECT 1 FROM artists WHERE id = subscriptions.artist_id
    );
  END IF;
END $$;

-- Step 4: Re-add foreign key constraints pointing to artist_profiles
ALTER TABLE content_items
ADD CONSTRAINT content_items_artist_id_fkey
FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_artist_id_fkey
FOREIGN KEY (artist_id) REFERENCES artist_profiles(id) ON DELETE CASCADE;

-- Step 5: Update RLS policies to use artist_profiles
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

DROP POLICY IF EXISTS "Public can view published content" ON content_items;
CREATE POLICY "Public can view published content" ON content_items
  FOR SELECT USING (
    is_premium = false
    AND (unlock_date IS NULL OR unlock_date <= now())
  );

DROP POLICY IF EXISTS "Subscribers can view premium content" ON content_items;
CREATE POLICY "Subscribers can view premium content" ON content_items
  FOR SELECT USING (
    (unlock_date IS NULL OR unlock_date <= now())
    AND EXISTS(
      SELECT 1 FROM subscriptions s
      JOIN artist_profiles a ON s.artist_id = a.id
      WHERE s.fan_id = auth.uid()
      AND a.id = artist_id
      AND s.status = 'active'
    )
  );

-- Step 6: Fix audio processing job policies
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