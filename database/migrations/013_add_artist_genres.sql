-- Add genre_tags to artist_profiles for Coliseum A-Domain analytics
-- Run in Supabase Dashboard

ALTER TABLE artist_profiles
ADD COLUMN IF NOT EXISTS genre_tags TEXT[] DEFAULT '{}';

-- Create index for genre searching
CREATE INDEX IF NOT EXISTS idx_artist_genres ON artist_profiles USING GIN(genre_tags);

-- Comment
COMMENT ON COLUMN artist_profiles.genre_tags IS 'Array of genres for Cultural DNA (A-Domain) analysis';
