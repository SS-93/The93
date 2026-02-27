/**
 * =============================================================================
 * COLISEUM ANALYTICS ENGINE - DATABASE SCHEMA
 * =============================================================================
 *
 * Part of: Buckets V2 Trinity Architecture (#3 Coliseum Analytics)
 * V2 Living Index: Jumbotron - Real-Time Event Metrics & Leaderboards
 * Migration: 20251109220000
 * Run in Supabase Dashboard: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new
 *
 * PURPOSE:
 * Create the Coliseum Analytics Engine database tables for tracking,
 * aggregating, and reporting on all user engagement metrics across
 * Buckets Nation.
 *
 * ARCHITECTURE:
 * - coliseum_metrics: Raw event store (ingested from Passport)
 * - coliseum_rollups: Pre-aggregated metrics (hourly/daily)
 * - coliseum_leaderboards: Cached leaderboard rankings
 * - coliseum_reports: Generated analytics reports
 *
 * INTEGRATION:
 * - Consumes: passport_entries (via background processor)
 * - Powers: Leaderboards, Reports, DNA insights, DIA monitoring
 * - Performance: TimescaleDB hypertables, indexed for <500ms queries
 *
 * =============================================================================
 */

-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================

-- TimescaleDB for time-series optimization (if not already enabled)
-- Commented out for initial deployment - can enable later
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- =====================================================
-- TABLE 1: COLISEUM_METRICS (Raw Event Store)
-- =====================================================

CREATE TABLE coliseum_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity identifiers (flexible - not all events have all entities)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  track_id UUID, -- Not FK to allow external content tracking
  brand_id UUID, -- Future brand system

  -- Metric details
  metric_type TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 1,
  metric_unit TEXT,

  -- Context
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'ios', 'android', 'api', 'system', 'admin')),
  session_id TEXT,

  -- DNA context (for DNA-enriched analytics)
  dna_match_score NUMERIC CHECK (dna_match_score >= 0 AND dna_match_score <= 1),
  dna_domain TEXT CHECK (dna_domain IN ('cultural', 'behavioral', 'economic', 'spatial')),

  -- Attribution (for campaign tracking)
  attribution_id TEXT,
  campaign_id TEXT,

  -- Metadata (flexible JSONB for any additional data)
  metadata JSONB DEFAULT '{}',

  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TimescaleDB hypertable conversion (DISABLED for initial schema creation)
-- TODO: Enable after schema is stable and tested
-- SELECT create_hypertable('coliseum_metrics', 'timestamp', if_not_exists => TRUE);

-- =====================================================
-- INDEXES FOR COLISEUM_METRICS
-- =====================================================

-- User timeline (most common query)
CREATE INDEX idx_coliseum_metrics_user_time
  ON coliseum_metrics(user_id, timestamp DESC);

-- Artist metrics
CREATE INDEX idx_coliseum_metrics_artist
  ON coliseum_metrics(artist_id, timestamp DESC)
  WHERE artist_id IS NOT NULL;

-- Event metrics
CREATE INDEX idx_coliseum_metrics_event
  ON coliseum_metrics(event_id, timestamp DESC)
  WHERE event_id IS NOT NULL;

-- Track metrics
CREATE INDEX idx_coliseum_metrics_track
  ON coliseum_metrics(track_id, timestamp DESC)
  WHERE track_id IS NOT NULL;

-- Metric type filtering
CREATE INDEX idx_coliseum_metrics_type
  ON coliseum_metrics(metric_type, timestamp DESC);

-- Find unprocessed metrics
CREATE INDEX idx_coliseum_metrics_unprocessed
  ON coliseum_metrics(processed, timestamp)
  WHERE NOT processed;

-- Session tracking
CREATE INDEX idx_coliseum_metrics_session
  ON coliseum_metrics(session_id, timestamp)
  WHERE session_id IS NOT NULL;

-- Metadata queries (GIN index for JSONB)
CREATE INDEX idx_coliseum_metrics_metadata
  ON coliseum_metrics USING GIN (metadata);

-- =====================================================
-- TABLE 2: COLISEUM_ROLLUPS (Aggregated Metrics)
-- =====================================================

CREATE TABLE coliseum_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'event', 'track', 'user', 'city', 'brand')),
  entity_id TEXT NOT NULL,

  -- Time window
  period TEXT NOT NULL CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly', 'all_time')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Aggregated metrics (JSONB for flexibility)
  metrics JSONB DEFAULT '{}',

  -- Example metrics structure:
  -- {
  --   "plays": 1250,
  --   "unique_listeners": 850,
  --   "avg_completion_rate": 0.78,
  --   "favorites": 120,
  --   "shares": 45,
  --   "votes": 320,
  --   "revenue_cents": 45000,
  --   "avg_dna_match": 0.72,
  --   "engagement_rate": 0.65
  -- }

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Note: Unique constraint omitted due to TimescaleDB partitioning requirements
-- Uniqueness enforced at application level (upsert logic in useColiseum hook)

-- =====================================================
-- INDEXES FOR COLISEUM_ROLLUPS
-- =====================================================

-- Entity rollup lookup
CREATE INDEX idx_coliseum_rollups_entity
  ON coliseum_rollups(entity_type, entity_id, period_start DESC);

-- Period-based queries
CREATE INDEX idx_coliseum_rollups_period
  ON coliseum_rollups(period, period_start DESC);

-- Metrics queries (GIN index for JSONB)
CREATE INDEX idx_coliseum_rollups_metrics
  ON coliseum_rollups USING GIN (metrics);

-- =====================================================
-- TABLE 3: COLISEUM_LEADERBOARDS (Cached Rankings)
-- =====================================================

CREATE TABLE coliseum_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Leaderboard configuration
  leaderboard_id TEXT NOT NULL,
  leaderboard_name TEXT NOT NULL,

  -- Entry details
  rank INTEGER NOT NULL CHECK (rank > 0),
  previous_rank INTEGER,

  -- Entity
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'event', 'user', 'track', 'city')),
  entity_name TEXT NOT NULL,
  entity_image_url TEXT,

  -- Score
  score NUMERIC NOT NULL,
  score_type TEXT NOT NULL, -- "plays", "votes", "resonance", etc.

  -- Trends
  trend TEXT CHECK (trend IN ('up', 'down', 'stable', 'new')),
  change NUMERIC,
  change_percent NUMERIC,

  -- Metadata (flexible for leaderboard-specific data)
  metadata JSONB DEFAULT '{}',
  -- Example: { "subtitle": "Boston, MA", "badge": "🔥 Trending" }

  -- Cache control
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

-- Note: Unique constraint on (leaderboard_id, rank) omitted
-- Leaderboards are regenerated in full on each refresh (DELETE then INSERT)

-- =====================================================
-- INDEXES FOR COLISEUM_LEADERBOARDS
-- =====================================================

-- Leaderboard rank lookup (most common query)
CREATE INDEX idx_coliseum_leaderboards_id_rank
  ON coliseum_leaderboards(leaderboard_id, rank);

-- Entity lookup (find entity's rank across leaderboards)
CREATE INDEX idx_coliseum_leaderboards_entity
  ON coliseum_leaderboards(entity_id, entity_type);

-- Find expired caches
CREATE INDEX idx_coliseum_leaderboards_expires
  ON coliseum_leaderboards(expires_at)
  WHERE expires_at IS NOT NULL;

-- =====================================================
-- TABLE 4: COLISEUM_REPORTS (Generated Reports)
-- =====================================================

CREATE TABLE coliseum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report context
  report_type TEXT NOT NULL CHECK (report_type IN ('event', 'artist', 'brand_campaign', 'city', 'tournament')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'event', 'brand', 'city', 'tournament')),
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,

  -- Time range
  time_range TEXT DEFAULT '30d',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Report data (stored as JSONB)
  report_data JSONB NOT NULL,

  -- Example report_data structure:
  -- {
  --   "metrics": { "plays": 12450, "engagement_rate": 0.68, ... },
  --   "funnels": [ {...} ],
  --   "dna_insights": { "average_match_score": 0.74, ... },
  --   "engagement_timeline": [ {...} ]
  -- }

  -- Format
  format TEXT CHECK (format IN ('json', 'pdf')),

  -- Storage
  pdf_url TEXT,
  qr_code_url TEXT,

  -- Access control
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  share_link TEXT,

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Create unique index for share links (conditional)
-- This is safe because it's partial (WHERE clause) and not on hypertable
CREATE UNIQUE INDEX idx_coliseum_reports_unique_share
  ON coliseum_reports(share_link)
  WHERE share_link IS NOT NULL;

-- =====================================================
-- INDEXES FOR COLISEUM_REPORTS
-- =====================================================

-- Entity reports lookup
CREATE INDEX idx_coliseum_reports_entity
  ON coliseum_reports(entity_type, entity_id, generated_at DESC);

-- User's generated reports
CREATE INDEX idx_coliseum_reports_user
  ON coliseum_reports(generated_by, generated_at DESC)
  WHERE generated_by IS NOT NULL;

-- Shareable reports lookup
CREATE INDEX idx_coliseum_reports_share
  ON coliseum_reports(share_link)
  WHERE share_link IS NOT NULL;

-- Report type filtering
CREATE INDEX idx_coliseum_reports_type
  ON coliseum_reports(report_type, generated_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE coliseum_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coliseum_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE coliseum_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE coliseum_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: COLISEUM_METRICS
-- =====================================================

-- Users can view their own metrics
CREATE POLICY coliseum_metrics_view_own
  ON coliseum_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own metrics
CREATE POLICY coliseum_metrics_insert_own
  ON coliseum_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all metrics
CREATE POLICY coliseum_metrics_view_admin
  ON coliseum_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System (service role) can insert metrics
CREATE POLICY coliseum_metrics_insert_system
  ON coliseum_metrics FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- =====================================================
-- RLS POLICIES: COLISEUM_ROLLUPS
-- =====================================================

-- Public read access for rollups (aggregated data)
CREATE POLICY coliseum_rollups_view_all
  ON coliseum_rollups FOR SELECT
  USING (true);

-- Only admins and system can insert/update rollups
CREATE POLICY coliseum_rollups_write_admin
  ON coliseum_rollups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: COLISEUM_LEADERBOARDS
-- =====================================================

-- Public read access for leaderboards
CREATE POLICY coliseum_leaderboards_view_all
  ON coliseum_leaderboards FOR SELECT
  USING (true);

-- Only admins and system can insert/update leaderboards
CREATE POLICY coliseum_leaderboards_write_admin
  ON coliseum_leaderboards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: COLISEUM_REPORTS
-- =====================================================

-- Users can view their own reports
CREATE POLICY coliseum_reports_view_own
  ON coliseum_reports FOR SELECT
  USING (
    auth.uid() = generated_by
    OR is_public = true
  );

-- Users can insert their own reports
CREATE POLICY coliseum_reports_insert_own
  ON coliseum_reports FOR INSERT
  WITH CHECK (auth.uid() = generated_by);

-- Admins can view/edit all reports
CREATE POLICY coliseum_reports_admin
  ON coliseum_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

/**
 * Function: get_entity_metrics
 * Get aggregated metrics for an entity over a time period
 */
CREATE OR REPLACE FUNCTION get_entity_metrics(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(metric_type, metric_count)
  INTO result
  FROM (
    SELECT
      metric_type,
      COUNT(*) as metric_count
    FROM coliseum_metrics
    WHERE
      (p_entity_type = 'artist' AND artist_id::TEXT = p_entity_id)
      OR (p_entity_type = 'event' AND event_id::TEXT = p_entity_id)
      OR (p_entity_type = 'track' AND track_id::TEXT = p_entity_id)
      OR (p_entity_type = 'user' AND user_id::TEXT = p_entity_id)
    AND timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY metric_type
  ) subquery;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function: refresh_leaderboard
 * Recalculate and cache a leaderboard
 *
 * Example: SELECT refresh_leaderboard('top_artists_by_plays', '30d');
 */
CREATE OR REPLACE FUNCTION refresh_leaderboard(
  p_leaderboard_id TEXT,
  p_time_range TEXT DEFAULT '30d'
)
RETURNS INTEGER AS $$
DECLARE
  start_date TIMESTAMPTZ;
  entries_count INTEGER;
BEGIN
  -- Calculate start date based on time range
  start_date := CASE
    WHEN p_time_range = '7d' THEN NOW() - INTERVAL '7 days'
    WHEN p_time_range = '30d' THEN NOW() - INTERVAL '30 days'
    WHEN p_time_range = '90d' THEN NOW() - INTERVAL '90 days'
    ELSE NOW() - INTERVAL '30 days'
  END;

  -- Delete existing entries for this leaderboard
  DELETE FROM coliseum_leaderboards WHERE leaderboard_id = p_leaderboard_id;

  -- Example: Top Artists by Plays leaderboard
  IF p_leaderboard_id = 'top_artists_by_plays' THEN
    INSERT INTO coliseum_leaderboards (
      leaderboard_id,
      leaderboard_name,
      rank,
      entity_id,
      entity_type,
      entity_name,
      entity_image_url,
      score,
      score_type,
      trend,
      expires_at
    )
    SELECT
      'top_artists_by_plays',
      'Top Artists by Plays',
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
      ap.id::TEXT,
      'artist',
      ap.display_name,
      ap.profile_image_url,
      COUNT(*),
      'plays',
      'stable', -- TODO: Calculate trend from previous period
      NOW() + INTERVAL '5 minutes'
    FROM coliseum_metrics cm
    JOIN artist_profiles ap ON cm.artist_id = ap.id
    WHERE
      cm.metric_type IN ('player.track_played', 'player.track_completed')
      AND cm.timestamp >= start_date
    GROUP BY ap.id, ap.display_name, ap.profile_image_url
    ORDER BY COUNT(*) DESC
    LIMIT 100;
  END IF;

  -- Get count of entries inserted
  SELECT COUNT(*) INTO entries_count
  FROM coliseum_leaderboards
  WHERE leaderboard_id = p_leaderboard_id;

  RETURN entries_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE coliseum_metrics IS
  'Coliseum Analytics Engine - Raw event metrics store. Ingests events from Passport system and external sources. Optimized for time-series queries.';

COMMENT ON TABLE coliseum_rollups IS
  'Pre-aggregated metrics per entity and time period. Hourly/daily rollups for fast dashboard queries.';

COMMENT ON TABLE coliseum_leaderboards IS
  'Cached leaderboard rankings. Refreshed periodically to reduce query load.';

COMMENT ON TABLE coliseum_reports IS
  'Generated analytics reports with full metrics, funnels, and DNA insights. Stored as JSONB for flexibility.';

COMMENT ON FUNCTION get_entity_metrics IS
  'Get aggregated metrics for any entity (artist, event, track, user) over a time period.';

COMMENT ON FUNCTION refresh_leaderboard IS
  'Recalculate and cache a specific leaderboard. Returns count of entries generated.';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Insert success log
DO $$
BEGIN
  RAISE NOTICE '✅ Coliseum Analytics Engine schema created successfully!';
  RAISE NOTICE '📊 Tables: coliseum_metrics, coliseum_rollups, coliseum_leaderboards, coliseum_reports';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚡ Standard PostgreSQL tables (TimescaleDB optional)';
  RAISE NOTICE '🚀 Ready to track metrics!';
END $$;
