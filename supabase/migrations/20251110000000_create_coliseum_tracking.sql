-- =================================================================
-- COLISEUM ANALYTICS: ARTIST-EVENT TRACKING & CONVERSION SYSTEM
-- =================================================================
-- This migration adds:
-- 1. artist_event_participation: Links artists to events with metrics
-- 2. conversion_attributions: Tracks conversion funnels and attribution
-- 3. conversion_funnel_definitions: Defines conversion funnel stages
-- =================================================================

-- =================================================================
-- TABLE 1: ARTIST-EVENT PARTICIPATION
-- =================================================================
-- Purpose: Track which artists participate in which events and their performance
-- User requirement: "if artist in event and has an artist account tie metrics together"

CREATE TABLE IF NOT EXISTS artist_event_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core References
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Participation Details
  participation_type TEXT NOT NULL CHECK (participation_type IN (
    'performer',      -- Main act
    'judge',          -- Competition judge
    'host',           -- Event host
    'competitor',     -- Voting competition participant
    'featured',       -- Featured artist
    'opener',         -- Opening act
    'guest'           -- Special guest
  )),

  -- Status & Confirmation
  confirmed BOOLEAN DEFAULT false,
  performance_order INTEGER,

  -- Cached Metrics (Updated by triggers/cron)
  total_votes INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,

  -- Rankings
  rank_in_event INTEGER,
  rank_previous INTEGER,
  final_placement INTEGER, -- Final rank after event ends

  -- Timing
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  performance_start TIMESTAMPTZ,
  performance_end TIMESTAMPTZ,
  event_date TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Prevent duplicate artist-event pairings
  UNIQUE(artist_id, event_id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_artist_event_artist ON artist_event_participation(artist_id, event_date DESC);
CREATE INDEX idx_artist_event_event ON artist_event_participation(event_id, rank_in_event ASC);
CREATE INDEX idx_artist_event_confirmed ON artist_event_participation(confirmed, event_date DESC) WHERE confirmed = true;
CREATE INDEX idx_artist_event_votes ON artist_event_participation(event_id, total_votes DESC);

-- RLS Policies
ALTER TABLE artist_event_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for confirmed participation"
  ON artist_event_participation FOR SELECT
  USING (confirmed = true);

CREATE POLICY "Artists can manage their own participation"
  ON artist_event_participation FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM artist_profiles WHERE id = artist_event_participation.artist_id
    )
  );

CREATE POLICY "Event hosts can manage participation"
  ON artist_event_participation FOR ALL
  USING (
    auth.uid() IN (
      SELECT host_id FROM events WHERE id = artist_event_participation.event_id
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_artist_event_participation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artist_event_participation_updated_at
  BEFORE UPDATE ON artist_event_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_event_participation_updated_at();

-- =================================================================
-- TABLE 2: CONVERSION FUNNEL DEFINITIONS
-- =================================================================
-- Purpose: Define conversion funnels with stages for tracking
-- User requirement: "we might need some type of tracking conversion management system"

CREATE TABLE IF NOT EXISTS conversion_funnel_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Funnel Identity
  funnel_id TEXT UNIQUE NOT NULL,
  funnel_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'event', 'brand', 'track', 'city', 'user')),

  -- Funnel Configuration
  stages JSONB NOT NULL, -- Array of stage objects with event_types
  attribution_window_hours INTEGER DEFAULT 24,
  attribution_model TEXT DEFAULT 'last_touch' CHECK (attribution_model IN ('first_touch', 'last_touch', 'multi_touch', 'linear', 'time_decay')),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_funnel_entity_type ON conversion_funnel_definitions(entity_type, is_active);
CREATE INDEX idx_funnel_id ON conversion_funnel_definitions(funnel_id) WHERE is_active = true;

-- RLS Policies
ALTER TABLE conversion_funnel_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for active funnels"
  ON conversion_funnel_definitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage funnels"
  ON conversion_funnel_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Updated at trigger
CREATE TRIGGER funnel_definitions_updated_at
  BEFORE UPDATE ON conversion_funnel_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_event_participation_updated_at();

-- =================================================================
-- TABLE 3: CONVERSION ATTRIBUTIONS
-- =================================================================
-- Purpose: Track individual user conversion journeys with attribution
-- User requirement: "for brands most locker conversions highest earnings, most engagement, reach etc"

CREATE TABLE IF NOT EXISTS conversion_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Funnel Reference
  funnel_id TEXT NOT NULL,
  funnel_stage_completed TEXT, -- Which stage was completed

  -- Entity Being Tracked
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'event', 'brand', 'track', 'city', 'user')),
  entity_id UUID NOT NULL,

  -- User Journey
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,

  -- Attribution Events (References to coliseum_metrics)
  first_touch_event_id UUID, -- First interaction
  last_touch_event_id UUID,  -- Last interaction before conversion
  conversion_event_id UUID,  -- Actual conversion event

  -- Journey Tracking
  journey_events UUID[], -- Array of all event IDs in journey
  journey_stages_completed TEXT[], -- Array of completed stage names
  journey_duration_seconds INTEGER,
  touchpoints_count INTEGER DEFAULT 0,

  -- Conversion Value
  conversion_value_cents INTEGER DEFAULT 0,
  conversion_type TEXT, -- 'locker_unlock', 'purchase', 'subscription', 'attendance', etc.

  -- Timing
  journey_started_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  attribution_window_expires_at TIMESTAMPTZ,

  -- Status
  is_completed BOOLEAN DEFAULT false,

  -- Campaign Attribution
  campaign_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_conversion_entity ON conversion_attributions(entity_type, entity_id, is_completed);
CREATE INDEX idx_conversion_user ON conversion_attributions(user_id, converted_at DESC NULLS LAST);
CREATE INDEX idx_conversion_funnel ON conversion_attributions(funnel_id, is_completed);
CREATE INDEX idx_conversion_completed ON conversion_attributions(converted_at DESC) WHERE is_completed = true;
CREATE INDEX idx_conversion_campaign ON conversion_attributions(campaign_id, entity_type) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_conversion_value ON conversion_attributions(entity_type, entity_id, conversion_value_cents DESC) WHERE conversion_value_cents > 0;

-- RLS Policies
ALTER TABLE conversion_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversions"
  ON conversion_attributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Entity owners can view their conversions"
  ON conversion_attributions FOR SELECT
  USING (
    CASE entity_type
      WHEN 'artist' THEN auth.uid() IN (SELECT user_id FROM artist_profiles WHERE id = entity_id)
      WHEN 'event' THEN auth.uid() IN (SELECT host_id FROM events WHERE id = entity_id)
      WHEN 'brand' THEN auth.uid() IN (SELECT owner_id FROM brand_profiles WHERE id = entity_id)
      ELSE false
    END
  );

CREATE POLICY "Admins can view all conversions"
  ON conversion_attributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Updated at trigger
CREATE TRIGGER conversion_attributions_updated_at
  BEFORE UPDATE ON conversion_attributions
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_event_participation_updated_at();

-- =================================================================
-- HELPER FUNCTIONS
-- =================================================================

-- Function: Track conversion journey event
CREATE OR REPLACE FUNCTION track_conversion_event(
  p_funnel_id TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_user_id UUID,
  p_event_id UUID,
  p_stage_name TEXT,
  p_conversion_value_cents INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_attribution_id UUID;
  v_attribution_window_hours INTEGER;
  v_journey_started_at TIMESTAMPTZ;
BEGIN
  -- Get funnel configuration
  SELECT attribution_window_hours INTO v_attribution_window_hours
  FROM conversion_funnel_definitions
  WHERE funnel_id = p_funnel_id AND is_active = true;

  IF v_attribution_window_hours IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive funnel_id: %', p_funnel_id;
  END IF;

  -- Find or create attribution record
  SELECT id, journey_started_at INTO v_attribution_id, v_journey_started_at
  FROM conversion_attributions
  WHERE funnel_id = p_funnel_id
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND user_id = p_user_id
    AND is_completed = false
    AND journey_started_at >= NOW() - (v_attribution_window_hours || ' hours')::INTERVAL
  ORDER BY journey_started_at DESC
  LIMIT 1;

  IF v_attribution_id IS NULL THEN
    -- Create new attribution record
    INSERT INTO conversion_attributions (
      funnel_id,
      entity_type,
      entity_id,
      user_id,
      first_touch_event_id,
      journey_events,
      journey_stages_completed,
      touchpoints_count,
      journey_started_at,
      attribution_window_expires_at
    )
    VALUES (
      p_funnel_id,
      p_entity_type,
      p_entity_id,
      p_user_id,
      p_event_id,
      ARRAY[p_event_id],
      ARRAY[p_stage_name],
      1,
      NOW(),
      NOW() + (v_attribution_window_hours || ' hours')::INTERVAL
    )
    RETURNING id INTO v_attribution_id;
  ELSE
    -- Update existing attribution record
    UPDATE conversion_attributions
    SET
      last_touch_event_id = p_event_id,
      journey_events = array_append(journey_events, p_event_id),
      journey_stages_completed = CASE
        WHEN NOT (p_stage_name = ANY(journey_stages_completed))
        THEN array_append(journey_stages_completed, p_stage_name)
        ELSE journey_stages_completed
      END,
      touchpoints_count = touchpoints_count + 1,
      journey_duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_journey_started_at))::INTEGER,
      updated_at = NOW()
    WHERE id = v_attribution_id;
  END IF;

  -- If this is a conversion event, mark as completed
  IF p_conversion_value_cents > 0 THEN
    UPDATE conversion_attributions
    SET
      conversion_event_id = p_event_id,
      conversion_value_cents = p_conversion_value_cents,
      converted_at = NOW(),
      is_completed = true,
      funnel_stage_completed = p_stage_name
    WHERE id = v_attribution_id;
  END IF;

  RETURN v_attribution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get conversion funnel stats for entity
CREATE OR REPLACE FUNCTION get_conversion_stats(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_time_range TEXT DEFAULT '30d'
)
RETURNS TABLE (
  funnel_id TEXT,
  funnel_name TEXT,
  total_started INTEGER,
  total_completed INTEGER,
  conversion_rate NUMERIC,
  total_revenue_cents BIGINT,
  avg_journey_duration_seconds NUMERIC,
  avg_touchpoints NUMERIC
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date
  v_start_date := CASE
    WHEN p_time_range = '7d' THEN NOW() - INTERVAL '7 days'
    WHEN p_time_range = '30d' THEN NOW() - INTERVAL '30 days'
    WHEN p_time_range = '90d' THEN NOW() - INTERVAL '90 days'
    ELSE NOW() - INTERVAL '30 days'
  END;

  RETURN QUERY
  SELECT
    ca.funnel_id,
    cfd.funnel_name,
    COUNT(*)::INTEGER as total_started,
    COUNT(*) FILTER (WHERE ca.is_completed = true)::INTEGER as total_completed,
    ROUND(
      (COUNT(*) FILTER (WHERE ca.is_completed = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
      2
    ) as conversion_rate,
    COALESCE(SUM(ca.conversion_value_cents) FILTER (WHERE ca.is_completed = true), 0)::BIGINT as total_revenue_cents,
    ROUND(AVG(ca.journey_duration_seconds) FILTER (WHERE ca.is_completed = true), 2) as avg_journey_duration_seconds,
    ROUND(AVG(ca.touchpoints_count), 2) as avg_touchpoints
  FROM conversion_attributions ca
  JOIN conversion_funnel_definitions cfd ON ca.funnel_id = cfd.funnel_id
  WHERE ca.entity_type = p_entity_type
    AND ca.entity_id = p_entity_id
    AND ca.journey_started_at >= v_start_date
  GROUP BY ca.funnel_id, cfd.funnel_name
  ORDER BY total_completed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- SEED DATA: DEFAULT CONVERSION FUNNELS
-- =================================================================

-- Brand Locker Conversion Funnel
INSERT INTO conversion_funnel_definitions (
  funnel_id,
  funnel_name,
  entity_type,
  attribution_window_hours,
  attribution_model,
  stages,
  description
)
VALUES (
  'brand_locker_conversion',
  'Brand Locker Unlock',
  'brand',
  24,
  'last_touch',
  '[
    {"stage_name": "Locker Viewed", "event_types": ["locker.viewed"], "is_conversion": false},
    {"stage_name": "Locker Clicked", "event_types": ["locker.clicked"], "is_conversion": false},
    {"stage_name": "Unlock Started", "event_types": ["locker.unlock_started"], "is_conversion": false},
    {"stage_name": "Content Unlocked", "event_types": ["locker.content_unlocked"], "is_conversion": true}
  ]'::JSONB,
  'Track brand locker unlock conversion funnel'
)
ON CONFLICT (funnel_id) DO NOTHING;

-- Event Attendance Conversion Funnel
INSERT INTO conversion_funnel_definitions (
  funnel_id,
  funnel_name,
  entity_type,
  attribution_window_hours,
  attribution_model,
  stages,
  description
)
VALUES (
  'event_attendance_conversion',
  'Event Attendance',
  'event',
  168, -- 7 days
  'first_touch',
  '[
    {"stage_name": "Event Discovered", "event_types": ["concierto.event_viewed"], "is_conversion": false},
    {"stage_name": "Event Details Viewed", "event_types": ["concierto.event_details_viewed"], "is_conversion": false},
    {"stage_name": "Ticket Intent", "event_types": ["concierto.ticket_clicked"], "is_conversion": false},
    {"stage_name": "Ticket Purchased", "event_types": ["treasury.purchase_completed"], "is_conversion": true},
    {"stage_name": "Event Attended", "event_types": ["concierto.attendance_confirmed"], "is_conversion": true}
  ]'::JSONB,
  'Track event attendance conversion from discovery to attendance'
)
ON CONFLICT (funnel_id) DO NOTHING;

-- Artist Subscription Conversion Funnel
INSERT INTO conversion_funnel_definitions (
  funnel_id,
  funnel_name,
  entity_type,
  attribution_window_hours,
  attribution_model,
  stages,
  description
)
VALUES (
  'artist_subscription_conversion',
  'Artist Subscription',
  'artist',
  72, -- 3 days
  'multi_touch',
  '[
    {"stage_name": "Artist Profile Viewed", "event_types": ["artist.profile_viewed"], "is_conversion": false},
    {"stage_name": "Content Played", "event_types": ["player.track_played"], "is_conversion": false},
    {"stage_name": "Subscribe Intent", "event_types": ["artist.subscribe_clicked"], "is_conversion": false},
    {"stage_name": "Subscription Purchased", "event_types": ["treasury.subscription_created"], "is_conversion": true}
  ]'::JSONB,
  'Track artist subscription conversion from discovery to purchase'
)
ON CONFLICT (funnel_id) DO NOTHING;

-- Track Purchase Conversion Funnel
INSERT INTO conversion_funnel_definitions (
  funnel_id,
  funnel_name,
  entity_type,
  attribution_window_hours,
  attribution_model,
  stages,
  description
)
VALUES (
  'track_purchase_conversion',
  'Track Purchase',
  'track',
  48, -- 2 days
  'last_touch',
  '[
    {"stage_name": "Track Discovered", "event_types": ["player.track_played"], "is_conversion": false},
    {"stage_name": "Track Favorited", "event_types": ["player.track_favorited"], "is_conversion": false},
    {"stage_name": "Purchase Intent", "event_types": ["treasury.purchase_intent"], "is_conversion": false},
    {"stage_name": "Track Purchased", "event_types": ["treasury.purchase_completed"], "is_conversion": true}
  ]'::JSONB,
  'Track track purchase conversion from play to purchase'
)
ON CONFLICT (funnel_id) DO NOTHING;

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON TABLE artist_event_participation IS 'Tracks artist participation in events with cached performance metrics and rankings';
COMMENT ON TABLE conversion_funnel_definitions IS 'Defines conversion funnels with stages for tracking user journeys';
COMMENT ON TABLE conversion_attributions IS 'Records individual user conversion journeys with attribution and touchpoint tracking';
COMMENT ON FUNCTION track_conversion_event IS 'Tracks a conversion journey event and updates attribution record';
COMMENT ON FUNCTION get_conversion_stats IS 'Returns conversion funnel statistics for an entity';
