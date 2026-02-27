-- ============================================================================
-- MIGRATION 018: COLISEUM DNA ANALYTICS FUNCTIONS
-- ============================================================================
-- Purpose: Implement 4 critical metrics for A/T/G/C domains
-- Date: November 23, 2025
-- ============================================================================

-- ============================================================================
-- A-DOMAIN: GENRE DIVERSITY SCORE (Shannon Entropy)
-- ============================================================================

CREATE OR REPLACE FUNCTION coliseum_genre_diversity_score(
  p_artist_id UUID,
  p_time_range TEXT DEFAULT 'alltime'
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_entropy NUMERIC := 0;
  v_genre_count INTEGER;
  v_total_plays INTEGER;
  v_probability NUMERIC;
BEGIN
  -- Get total plays for this artist in time range
  SELECT COUNT(*)
  INTO v_total_plays
  FROM passport_entries pe
  WHERE pe.metadata->>'artistId' = p_artist_id::TEXT
    AND pe.event_type = 'player.track_played'
    AND (
      p_time_range = 'alltime'
      OR (p_time_range = '7d' AND pe.created_at >= NOW() - INTERVAL '7 days')
      OR (p_time_range = '30d' AND pe.created_at >= NOW() - INTERVAL '30 days')
    );

  IF v_total_plays = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate Shannon entropy across genres
  -- H = -Σ(p(x) * log2(p(x)))
  FOR v_genre_count, v_probability IN
    SELECT
      COUNT(*) as genre_count,
      COUNT(*)::NUMERIC / v_total_plays as probability
    FROM passport_entries pe,
         unnest(
           CASE
             WHEN jsonb_typeof(pe.metadata->'genres') = 'array'
             THEN ARRAY(SELECT jsonb_array_elements_text(pe.metadata->'genres'))
             ELSE ARRAY[]::TEXT[]
           END
         ) as genre
    WHERE pe.metadata->>'artistId' = p_artist_id::TEXT
      AND pe.event_type = 'player.track_played'
      AND (
        p_time_range = 'alltime'
        OR (p_time_range = '7d' AND pe.created_at >= NOW() - INTERVAL '7 days')
        OR (p_time_range = '30d' AND pe.created_at >= NOW() - INTERVAL '30 days')
      )
    GROUP BY genre
  LOOP
    IF v_probability > 0 THEN
      v_entropy := v_entropy - (v_probability * log(2, v_probability));
    END IF;
  END LOOP;

  -- Normalize to 0-1 range (assuming max 5 genres)
  RETURN LEAST(v_entropy / log(2, 5), 1.0);
END;
$$;

COMMENT ON FUNCTION coliseum_genre_diversity_score IS
  'Calculate Genre Diversity Score for A-domain (Cultural Identity) using Shannon entropy. Returns 0-1 where higher = more diverse.';

-- ============================================================================
-- T-DOMAIN: REPEAT ENGAGEMENT RATE
-- ============================================================================

CREATE OR REPLACE FUNCTION coliseum_repeat_engagement_rate(
  p_artist_id UUID,
  p_time_range TEXT DEFAULT 'alltime'
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_users INTEGER;
  v_repeat_users INTEGER;
BEGIN
  -- Count total unique users who engaged
  SELECT COUNT(DISTINCT user_id)
  INTO v_total_users
  FROM passport_entries
  WHERE metadata->>'artistId' = p_artist_id::TEXT
    AND (
      p_time_range = 'alltime'
      OR (p_time_range = '7d' AND created_at >= NOW() - INTERVAL '7 days')
      OR (p_time_range = '30d' AND created_at >= NOW() - INTERVAL '30 days')
    );

  IF v_total_users = 0 THEN
    RETURN 0;
  END IF;

  -- Count users with 2+ interactions (repeat engagement)
  SELECT COUNT(*)
  INTO v_repeat_users
  FROM (
    SELECT user_id, COUNT(*) as interaction_count
    FROM passport_entries
    WHERE metadata->>'artistId' = p_artist_id::TEXT
      AND (
        p_time_range = 'alltime'
        OR (p_time_range = '7d' AND created_at >= NOW() - INTERVAL '7 days')
        OR (p_time_range = '30d' AND created_at >= NOW() - INTERVAL '30 days')
      )
    GROUP BY user_id
    HAVING COUNT(*) >= 2
  ) repeat_users_subquery;

  -- Calculate rate
  RETURN v_repeat_users::NUMERIC / v_total_users::NUMERIC;
END;
$$;

COMMENT ON FUNCTION coliseum_repeat_engagement_rate IS
  'Calculate Repeat Engagement Rate for T-domain (Behavioral Patterns). Returns ratio of users with 2+ interactions.';

-- ============================================================================
-- G-DOMAIN: REVENUE PER FAN
-- ============================================================================

CREATE OR REPLACE FUNCTION coliseum_revenue_per_fan(
  p_artist_id UUID,
  p_time_range TEXT DEFAULT 'alltime'
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_revenue_cents INTEGER;
  v_total_fans INTEGER;
BEGIN
  -- Get total revenue from treasury.money_spent events
  SELECT COALESCE(SUM((metadata->>'amountCents')::INTEGER), 0)
  INTO v_total_revenue_cents
  FROM passport_entries
  WHERE metadata->>'artistId' = p_artist_id::TEXT
    AND event_type = 'treasury.money_spent'
    AND (
      p_time_range = 'alltime'
      OR (p_time_range = '7d' AND created_at >= NOW() - INTERVAL '7 days')
      OR (p_time_range = '30d' AND created_at >= NOW() - INTERVAL '30 days')
    );

  -- Count distinct fans (users who spent money)
  SELECT COUNT(DISTINCT user_id)
  INTO v_total_fans
  FROM passport_entries
  WHERE metadata->>'artistId' = p_artist_id::TEXT
    AND event_type = 'treasury.money_spent'
    AND (
      p_time_range = 'alltime'
      OR (p_time_range = '7d' AND created_at >= NOW() - INTERVAL '7 days')
      OR (p_time_range = '30d' AND created_at >= NOW() - INTERVAL '30 days')
    );

  IF v_total_fans = 0 THEN
    RETURN 0;
  END IF;

  -- Return revenue per fan in dollars (cents / 100 / fans)
  RETURN (v_total_revenue_cents::NUMERIC / 100) / v_total_fans::NUMERIC;
END;
$$;

COMMENT ON FUNCTION coliseum_revenue_per_fan IS
  'Calculate Revenue Per Fan for G-domain (Economic Signals). Returns average dollars per paying fan.';

-- ============================================================================
-- C-DOMAIN: GEOGRAPHIC REACH
-- ============================================================================

CREATE OR REPLACE FUNCTION coliseum_geographic_reach(
  p_artist_id UUID,
  p_time_range TEXT DEFAULT 'alltime'
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_city_count INTEGER;
BEGIN
  -- Count distinct cities from concierto.event_attended events
  SELECT COUNT(DISTINCT metadata->>'city')
  INTO v_city_count
  FROM passport_entries
  WHERE metadata->>'artistId' = p_artist_id::TEXT
    AND event_type = 'concierto.event_attended'
    AND metadata->>'city' IS NOT NULL
    AND metadata->>'city' != ''
    AND (
      p_time_range = 'alltime'
      OR (p_time_range = '7d' AND created_at >= NOW() - INTERVAL '7 days')
      OR (p_time_range = '30d' AND created_at >= NOW() - INTERVAL '30 days')
    );

  RETURN COALESCE(v_city_count, 0);
END;
$$;

COMMENT ON FUNCTION coliseum_geographic_reach IS
  'Calculate Geographic Reach for C-domain (Spatial Geography). Returns count of distinct cities with events.';

-- ============================================================================
-- COMBINED DNA PROFILE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION coliseum_get_artist_dna(
  p_artist_id UUID,
  p_time_range TEXT DEFAULT 'alltime'
)
RETURNS TABLE(
  artist_id UUID,
  time_range TEXT,
  -- Domain strengths (from mutations)
  a_strength NUMERIC,
  t_strength NUMERIC,
  g_strength NUMERIC,
  c_strength NUMERIC,
  -- Domain metrics (calculated)
  genre_diversity_score NUMERIC,
  repeat_engagement_rate NUMERIC,
  revenue_per_fan NUMERIC,
  geographic_reach INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_artist_id,
    p_time_range,
    -- Get domain strengths from coliseum_domain_strength table
    COALESCE(ds.a_strength, 0),
    COALESCE(ds.t_strength, 0),
    COALESCE(ds.g_strength, 0),
    COALESCE(ds.c_strength, 0),
    -- Calculate domain metrics
    coliseum_genre_diversity_score(p_artist_id, p_time_range),
    coliseum_repeat_engagement_rate(p_artist_id, p_time_range),
    coliseum_revenue_per_fan(p_artist_id, p_time_range),
    coliseum_geographic_reach(p_artist_id, p_time_range)
  FROM coliseum_domain_strength ds
  WHERE ds.artist_id = p_artist_id;
END;
$$;

COMMENT ON FUNCTION coliseum_get_artist_dna IS
  'Get complete DNA profile for an artist with both strength scores and calculated metrics for all 4 domains.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION coliseum_genre_diversity_score TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION coliseum_repeat_engagement_rate TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION coliseum_revenue_per_fan TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION coliseum_geographic_reach TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION coliseum_get_artist_dna TO anon, authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Coliseum analytics functions created successfully';
  RAISE NOTICE 'Functions available:';
  RAISE NOTICE '  - coliseum_genre_diversity_score(artist_id, time_range)';
  RAISE NOTICE '  - coliseum_repeat_engagement_rate(artist_id, time_range)';
  RAISE NOTICE '  - coliseum_revenue_per_fan(artist_id, time_range)';
  RAISE NOTICE '  - coliseum_geographic_reach(artist_id, time_range)';
  RAISE NOTICE '  - coliseum_get_artist_dna(artist_id, time_range)';
END $$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Example 1: Get all DNA data for an artist
-- SELECT * FROM coliseum_get_artist_dna('artist-uuid', '30d');

-- Example 2: Get just revenue per fan
-- SELECT coliseum_revenue_per_fan('artist-uuid', '7d');

-- Example 3: Compare 7d vs 30d metrics
-- SELECT
--   '7d' as period,
--   coliseum_repeat_engagement_rate('artist-uuid', '7d') as engagement_rate
-- UNION ALL
-- SELECT
--   '30d' as period,
--   coliseum_repeat_engagement_rate('artist-uuid', '30d') as engagement_rate;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback:
-- DROP FUNCTION IF EXISTS coliseum_get_artist_dna(UUID, TEXT);
-- DROP FUNCTION IF EXISTS coliseum_geographic_reach(UUID, TEXT);
-- DROP FUNCTION IF EXISTS coliseum_revenue_per_fan(UUID, TEXT);
-- DROP FUNCTION IF EXISTS coliseum_repeat_engagement_rate(UUID, TEXT);
-- DROP FUNCTION IF EXISTS coliseum_genre_diversity_score(UUID, TEXT);

-- ============================================================================
-- END OF MIGRATION 018
-- ============================================================================
