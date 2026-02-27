-- ============================================================================
-- MIGRATION 016: ADD GENRE TAGS TO ARTIST PROFILES
-- ============================================================================
-- Purpose: Enable A-domain (Cultural Identity) analytics
-- Required For: Genre Diversity Score, Cultural Influence calculations
-- Date: November 23, 2025
-- ============================================================================

-- ============================================================================
-- 1. ADD GENRE_TAGS COLUMN
-- ============================================================================

-- Add genre_tags as TEXT array to artist_profiles
ALTER TABLE artist_profiles
ADD COLUMN IF NOT EXISTS genre_tags TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN artist_profiles.genre_tags IS
  'Array of genre tags for A-domain (Cultural Identity) analytics. Example: ["hip-hop", "conscious rap", "west coast"]';

-- ============================================================================
-- 2. CREATE GIN INDEX FOR ARRAY QUERIES
-- ============================================================================

-- GIN index enables fast queries like: WHERE 'hip-hop' = ANY(genre_tags)
CREATE INDEX IF NOT EXISTS idx_artist_genre_tags
ON artist_profiles USING GIN (genre_tags);

-- ============================================================================
-- 3. ADD VALIDATION CONSTRAINT
-- ============================================================================

-- Ensure genre_tags is either NULL or non-empty array
ALTER TABLE artist_profiles
ADD CONSTRAINT check_genre_tags_not_empty
CHECK (genre_tags IS NULL OR array_length(genre_tags, 1) > 0);

-- ============================================================================
-- 4. SEED TEST DATA
-- ============================================================================

-- Update existing test artist with sample genre tags
UPDATE artist_profiles
SET genre_tags = ARRAY['hip-hop', 'rap', 'west coast', 'beats']
WHERE artist_name = 'dmstest49';

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Verify column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'artist_profiles'
    AND column_name = 'genre_tags'
  ) THEN
    RAISE NOTICE '✅ genre_tags column added successfully';
  ELSE
    RAISE EXCEPTION '❌ genre_tags column was not added';
  END IF;
END $$;

-- Verify index was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'artist_profiles'
    AND indexname = 'idx_artist_genre_tags'
  ) THEN
    RAISE NOTICE '✅ GIN index created successfully';
  ELSE
    RAISE EXCEPTION '❌ GIN index was not created';
  END IF;
END $$;

-- Show sample data
DO $$
DECLARE
  sample_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sample_count
  FROM artist_profiles
  WHERE genre_tags IS NOT NULL;

  RAISE NOTICE '✅ % artist(s) have genre_tags populated', sample_count;
END $$;

-- ============================================================================
-- 6. USAGE EXAMPLES (for Coliseum processor)
-- ============================================================================

-- Example 1: Find all artists in a genre
-- SELECT * FROM artist_profiles WHERE 'hip-hop' = ANY(genre_tags);

-- Example 2: Find artists with multiple specific genres
-- SELECT * FROM artist_profiles WHERE genre_tags @> ARRAY['hip-hop', 'conscious rap'];

-- Example 3: Count artists per genre (for diversity calculations)
-- SELECT unnest(genre_tags) as genre, COUNT(*)
-- FROM artist_profiles
-- GROUP BY genre
-- ORDER BY COUNT(*) DESC;

-- Example 4: Calculate genre diversity for an artist (Shannon entropy)
-- This will be implemented in Coliseum processor Edge Function

-- ============================================================================
-- 7. ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_artist_genre_tags;
-- ALTER TABLE artist_profiles DROP CONSTRAINT IF EXISTS check_genre_tags_not_empty;
-- ALTER TABLE artist_profiles DROP COLUMN IF EXISTS genre_tags;

-- ============================================================================
-- END OF MIGRATION 016
-- ============================================================================
