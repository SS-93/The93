-- ===============================================
-- PASSPORT SYSTEM: Universal Event Sourcing
-- Migration: 20250111000000_create_passport_system.sql
-- Purpose: Single source of truth for all user interactions
-- ===============================================

-- Drop existing media_engagement_log (migrate data first if needed)
-- ALTER TABLE media_engagement_log RENAME TO media_engagement_log_backup;

-- Main Passport Events Table
CREATE TABLE IF NOT EXISTS passport_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & entity
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT,          -- 'track', 'event', 'artist', 'brand', 'content'
  entity_id UUID,

  -- Event classification
  event_type TEXT NOT NULL,  -- 'play', 'vote', 'purchase', 'share', 'attend', 'upload'
  subsystem TEXT NOT NULL,   -- 'player', 'concierto', 'locker', 'treasury', 'sync_library'

  -- Flexible metadata (JSONB = no schema changes needed!)
  metadata JSONB DEFAULT '{}',

  -- Processing flags (for async workers)
  processed_dna BOOLEAN DEFAULT FALSE,
  processed_treasury BOOLEAN DEFAULT FALSE,
  processed_coliseum BOOLEAN DEFAULT FALSE,
  processing_error TEXT,

  -- Privacy & consent
  consent_granted BOOLEAN DEFAULT TRUE,
  anonymized BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_passport_user_time ON passport_events(user_id, created_at DESC);
CREATE INDEX idx_passport_event_type ON passport_events(event_type);
CREATE INDEX idx_passport_subsystem ON passport_events(subsystem);
CREATE INDEX idx_passport_entity ON passport_events(entity_type, entity_id);
CREATE INDEX idx_passport_processing ON passport_events(processed_dna, processed_treasury, processed_coliseum) WHERE NOT (processed_dna AND processed_treasury AND processed_coliseum);

-- JSONB index for flexible querying
CREATE INDEX idx_passport_metadata ON passport_events USING GIN (metadata);

-- Composite index for user journey queries
CREATE INDEX idx_passport_user_journey ON passport_events(user_id, subsystem, event_type, created_at DESC);

-- ===============================================
-- DATABASE FUNCTIONS FOR REUSABILITY
-- ===============================================

-- Function: Get unprocessed events for a system
CREATE OR REPLACE FUNCTION get_unprocessed_passport_events(
  system_name TEXT,
  batch_size INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  entity_type TEXT,
  entity_id UUID,
  event_type TEXT,
  subsystem TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.user_id,
    e.entity_type,
    e.entity_id,
    e.event_type,
    e.subsystem,
    e.metadata,
    e.created_at
  FROM passport_events e
  WHERE
    CASE system_name
      WHEN 'dna' THEN NOT e.processed_dna
      WHEN 'treasury' THEN NOT e.processed_treasury
      WHEN 'coliseum' THEN NOT e.processed_coliseum
      ELSE FALSE
    END
    AND e.processing_error IS NULL
  ORDER BY e.created_at ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark events as processed
CREATE OR REPLACE FUNCTION mark_passport_events_processed(
  event_ids UUID[],
  system_name TEXT,
  error_message TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  CASE system_name
    WHEN 'dna' THEN
      UPDATE passport_events
      SET
        processed_dna = TRUE,
        processed_at = CASE WHEN processed_treasury AND processed_coliseum THEN now() ELSE processed_at END,
        processing_error = error_message
      WHERE id = ANY(event_ids);

    WHEN 'treasury' THEN
      UPDATE passport_events
      SET
        processed_treasury = TRUE,
        processed_at = CASE WHEN processed_dna AND processed_coliseum THEN now() ELSE processed_at END,
        processing_error = error_message
      WHERE id = ANY(event_ids);

    WHEN 'coliseum' THEN
      UPDATE passport_events
      SET
        processed_coliseum = TRUE,
        processed_at = CASE WHEN processed_dna AND processed_treasury THEN now() ELSE processed_at END,
        processing_error = error_message
      WHERE id = ANY(event_ids);
  END CASE;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user journey (for DIA admin)
CREATE OR REPLACE FUNCTION get_user_journey(
  target_user_id UUID,
  time_range_days INTEGER DEFAULT 30,
  event_types TEXT[] DEFAULT NULL,
  subsystems TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  subsystem TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.subsystem,
    e.entity_type,
    e.entity_id,
    e.metadata,
    e.created_at
  FROM passport_events e
  WHERE
    e.user_id = target_user_id
    AND e.created_at >= now() - (time_range_days || ' days')::INTERVAL
    AND (event_types IS NULL OR e.event_type = ANY(event_types))
    AND (subsystems IS NULL OR e.subsystem = ANY(subsystems))
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user segment (for brand targeting)
CREATE OR REPLACE FUNCTION get_user_segment(
  filter_event_type TEXT DEFAULT NULL,
  filter_subsystem TEXT DEFAULT NULL,
  filter_entity_id UUID DEFAULT NULL,
  min_interactions INTEGER DEFAULT 1,
  consent_required BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  user_id UUID,
  interaction_count BIGINT,
  first_interaction TIMESTAMPTZ,
  last_interaction TIMESTAMPTZ,
  unique_entities BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.user_id,
    COUNT(*) AS interaction_count,
    MIN(e.created_at) AS first_interaction,
    MAX(e.created_at) AS last_interaction,
    COUNT(DISTINCT e.entity_id) AS unique_entities
  FROM passport_events e
  WHERE
    (filter_event_type IS NULL OR e.event_type = filter_event_type)
    AND (filter_subsystem IS NULL OR e.subsystem = filter_subsystem)
    AND (filter_entity_id IS NULL OR e.entity_id = filter_entity_id)
    AND (NOT consent_required OR e.consent_granted = TRUE)
  GROUP BY e.user_id
  HAVING COUNT(*) >= min_interactions
  ORDER BY interaction_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get system health metrics (for DIA monitoring)
CREATE OR REPLACE FUNCTION get_passport_system_health()
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT,
  last_24h BIGINT,
  last_hour BIGINT
) AS $$
BEGIN
  RETURN QUERY

  -- Total events
  SELECT
    'total_events' AS metric_name,
    COUNT(*)::BIGINT AS metric_value,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '24 hours')::BIGINT AS last_24h,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '1 hour')::BIGINT AS last_hour
  FROM passport_events

  UNION ALL

  -- Unprocessed events
  SELECT
    'unprocessed_events' AS metric_name,
    COUNT(*)::BIGINT AS metric_value,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '24 hours')::BIGINT AS last_24h,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '1 hour')::BIGINT AS last_hour
  FROM passport_events
  WHERE NOT (processed_dna AND processed_treasury AND processed_coliseum)

  UNION ALL

  -- Processing errors
  SELECT
    'processing_errors' AS metric_name,
    COUNT(*)::BIGINT AS metric_value,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '24 hours')::BIGINT AS last_24h,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '1 hour')::BIGINT AS last_hour
  FROM passport_events
  WHERE processing_error IS NOT NULL

  UNION ALL

  -- Unique users (last 24h)
  SELECT
    'active_users_24h' AS metric_name,
    COUNT(DISTINCT user_id)::BIGINT AS metric_value,
    COUNT(DISTINCT user_id)::BIGINT AS last_24h,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= now() - INTERVAL '1 hour')::BIGINT AS last_hour
  FROM passport_events
  WHERE created_at >= now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

ALTER TABLE passport_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users can view own passport events"
  ON passport_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events (via app)
CREATE POLICY "Users can insert own passport events"
  ON passport_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DIA admins can view all events
CREATE POLICY "DIA admins can view all passport events"
  ON passport_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can update processing flags (for Edge Functions)
CREATE POLICY "Service role can update processing flags"
  ON passport_events
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ===============================================
-- MIGRATE EXISTING DATA (Optional)
-- ===============================================

-- Uncomment to migrate data from media_engagement_log
/*
INSERT INTO passport_events (
  user_id,
  entity_type,
  entity_id,
  event_type,
  subsystem,
  metadata,
  created_at
)
SELECT
  user_id,
  'track' AS entity_type,
  content_id AS entity_id,
  event_type,
  'player' AS subsystem,
  metadata,
  timestamp AS created_at
FROM media_engagement_log_backup;
*/

-- ===============================================
-- COMMENTS FOR DOCUMENTATION
-- ===============================================

COMMENT ON TABLE passport_events IS 'Universal event sourcing table for all user interactions across Buckets platform';
COMMENT ON COLUMN passport_events.metadata IS 'Flexible JSONB field - add any data without schema changes';
COMMENT ON COLUMN passport_events.processed_dna IS 'Flag: Event processed by DNA genome system';
COMMENT ON COLUMN passport_events.processed_treasury IS 'Flag: Event processed by Treasury attribution system';
COMMENT ON COLUMN passport_events.processed_coliseum IS 'Flag: Event processed by Coliseum analytics system';

COMMENT ON FUNCTION get_unprocessed_passport_events IS 'Fetch batch of events pending processing by DNA/Treasury/Coliseum workers';
COMMENT ON FUNCTION mark_passport_events_processed IS 'Mark events as processed by specific system, sets processed_at when all systems complete';
COMMENT ON FUNCTION get_user_journey IS 'DIA Admin: View complete user journey with filters';
COMMENT ON FUNCTION get_user_segment IS 'Brand targeting: Get anonymized user segments based on behavior';
COMMENT ON FUNCTION get_passport_system_health IS 'DIA monitoring: System health metrics';
