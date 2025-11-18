-- CREATE PASSPORT SYSTEM
-- Universal event logging for all user interactions
-- Run in Supabase Dashboard: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new

-- =====================================================
-- PASSPORT ENTRIES TABLE (Immutable Event Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS passport_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  device_id TEXT,

  -- Event Classification
  event_type TEXT NOT NULL, -- e.g., 'player.track_played', 'concierto.vote_cast'
  event_category TEXT NOT NULL, -- 'player', 'concierto', 'treasury', 'coliseum', 'mediaid', 'passport'

  -- Entity References (flexible)
  entity_type TEXT, -- 'track', 'artist', 'event', 'transaction', 'metric'
  entity_id UUID,

  -- Event Data (JSONB for maximum flexibility)
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Processing Status (for background jobs)
  processed_by_mediaid BOOLEAN DEFAULT false,
  processed_by_treasury BOOLEAN DEFAULT false,
  processed_by_coliseum BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,

  -- DNA Influence (stored for quick access)
  dna_influence JSONB, -- { cultural: 0.8, behavioral: 0.6, economic: 0.2, spatial: 0.3 }

  -- Immutable timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_event_category CHECK (
    event_category IN (
      'player', 'concierto', 'treasury', 'coliseum',
      'mediaid', 'passport', 'social', 'profile', 'content', 'system'
    )
  )
);

-- =====================================================
-- INDEXES (Critical for Performance)
-- =====================================================

-- User's passport timeline (most common query)
CREATE INDEX idx_passport_user_created ON passport_entries(user_id, created_at DESC);

-- Filter by event type
CREATE INDEX idx_passport_event_type ON passport_entries(event_type);

-- Filter by category
CREATE INDEX idx_passport_category ON passport_entries(event_category);

-- Entity lookups (e.g., all interactions with a track)
CREATE INDEX idx_passport_entity ON passport_entries(entity_type, entity_id);

-- Session-based queries
CREATE INDEX idx_passport_session ON passport_entries(session_id) WHERE session_id IS NOT NULL;

-- Find unprocessed events (for background processor)
CREATE INDEX idx_passport_unprocessed ON passport_entries(created_at)
  WHERE processed_by_mediaid = false
     OR processed_by_treasury = false
     OR processed_by_coliseum = false;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE passport_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own passport
CREATE POLICY "Users can view own passport"
  ON passport_entries FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own events
CREATE POLICY "Users can log own events"
  ON passport_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all passports
CREATE POLICY "Admins can view all passports"
  ON passport_entries FOR SELECT
  USING (check_is_admin());

-- Service role can update processing flags (via Edge Functions)
-- (Handled by service role key, no policy needed)

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's passport timeline
CREATE OR REPLACE FUNCTION get_user_passport(
  target_user_id UUID,
  limit_count INT DEFAULT 100,
  offset_count INT DEFAULT 0,
  filter_category TEXT DEFAULT NULL,
  filter_event_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  event_category TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  dna_influence JSONB,
  processed_by_mediaid BOOLEAN,
  processed_by_treasury BOOLEAN,
  processed_by_coliseum BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check permissions: user can view own, admin can view all
  IF target_user_id != auth.uid() AND NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    pe.id,
    pe.event_type,
    pe.event_category,
    pe.entity_type,
    pe.entity_id,
    pe.metadata,
    pe.dna_influence,
    pe.processed_by_mediaid,
    pe.processed_by_treasury,
    pe.processed_by_coliseum,
    pe.created_at
  FROM passport_entries pe
  WHERE pe.user_id = target_user_id
    AND (filter_category IS NULL OR pe.event_category = filter_category)
    AND (filter_event_type IS NULL OR pe.event_type = filter_event_type)
  ORDER BY pe.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to get passport summary stats
CREATE OR REPLACE FUNCTION get_passport_summary(target_user_id UUID)
RETURNS TABLE (
  total_events BIGINT,
  player_events BIGINT,
  concierto_events BIGINT,
  mediaid_events BIGINT,
  first_event TIMESTAMPTZ,
  last_event TIMESTAMPTZ,
  unprocessed_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check permissions
  IF target_user_id != auth.uid() AND NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE event_category = 'player') as player_events,
    COUNT(*) FILTER (WHERE event_category = 'concierto') as concierto_events,
    COUNT(*) FILTER (WHERE event_category = 'mediaid') as mediaid_events,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event,
    COUNT(*) FILTER (WHERE NOT processed_by_mediaid OR NOT processed_by_treasury OR NOT processed_by_coliseum) as unprocessed_count
  FROM passport_entries
  WHERE user_id = target_user_id;
END;
$$;

-- =====================================================
-- INITIAL TEST DATA (Optional - for development)
-- =====================================================

-- Uncomment to insert test events for dmstest49@gmail.com
/*
INSERT INTO passport_entries (user_id, event_type, event_category, entity_type, metadata)
VALUES
  (
    '15480116-8c78-4a75-af8c-2c70795333a6',
    'player.track_played',
    'player',
    'track',
    '{"track_title": "Test Track", "duration": 180, "progress": 45}'::JSONB
  ),
  (
    '15480116-8c78-4a75-af8c-2c70795333a6',
    'mediaid.profile_updated',
    'mediaid',
    NULL,
    '{"field": "interests", "old_count": 3, "new_count": 4}'::JSONB
  );
*/

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'passport_entries'
) as passport_table_created;

-- Check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'passport_entries';

-- Test RLS policies
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'passport_entries';

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_user_passport TO authenticated;
GRANT EXECUTE ON FUNCTION get_passport_summary TO authenticated;
