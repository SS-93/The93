-- ============================================================================
-- COLISEUM DNA MUTATIONS TABLE
-- Migration 011b: Granular mutation log for DNA calculations
-- ============================================================================
-- Purpose: Store individual DNA mutations from Passport events for audit trail
-- Links: passport_entries → coliseum_dna_mutations → coliseum_domain_strength
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DNA Mutations Table (Granular Event Log)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS coliseum_dna_mutations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to source Passport event
  passport_entry_id UUID NOT NULL REFERENCES passport_entries(id) ON DELETE CASCADE,

  -- User and Artist
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL, -- References artist_profiles(id) or entity in general

  -- DNA Domain
  domain CHAR(1) NOT NULL CHECK (domain IN ('A', 'T', 'G', 'C')),

  -- Mutation key (e.g., 'genre_diversity', 'loyalty_index')
  key TEXT NOT NULL,

  -- Calculation components
  delta NUMERIC NOT NULL,           -- Base mutation value
  weight NUMERIC NOT NULL,          -- Event weight (TIER 1-5)
  recency_decay NUMERIC NOT NULL,   -- Time decay factor (0-1)
  effective_delta NUMERIC NOT NULL, -- delta × weight × recency_decay

  -- Time context
  occurred_at TIMESTAMPTZ NOT NULL, -- When the event happened (from passport_entry)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent duplicate processing
  CONSTRAINT unique_passport_mutation UNIQUE (passport_entry_id, domain)
);

-- ----------------------------------------------------------------------------
-- Indexes for Performance
-- ----------------------------------------------------------------------------

-- Fast lookups by artist and domain
CREATE INDEX idx_mutations_artist_domain ON coliseum_dna_mutations(artist_id, domain, occurred_at DESC);

-- Fast lookups by user (for user DNA profiles)
CREATE INDEX idx_mutations_user_domain ON coliseum_dna_mutations(user_id, domain, occurred_at DESC);

-- Fast lookups by passport entry (for verification)
CREATE INDEX idx_mutations_passport ON coliseum_dna_mutations(passport_entry_id);

-- Fast aggregation queries
CREATE INDEX idx_mutations_time_range ON coliseum_dna_mutations(occurred_at DESC);

-- Fast domain-specific queries
CREATE INDEX idx_mutations_domain ON coliseum_dna_mutations(domain, occurred_at DESC);

-- ----------------------------------------------------------------------------
-- RLS Policies (Row-Level Security)
-- ----------------------------------------------------------------------------

ALTER TABLE coliseum_dna_mutations ENABLE ROW LEVEL SECURITY;

-- Artists can see mutations that affect them
CREATE POLICY "Artists view own mutations" ON coliseum_dna_mutations
  FOR SELECT USING (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can see mutations they generated
CREATE POLICY "Users view own mutations" ON coliseum_dna_mutations
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Admins can see everything
CREATE POLICY "Admins view all mutations" ON coliseum_dna_mutations
  FOR SELECT USING (
    check_is_admin()
  );

-- Only service role can insert (via Edge Function processor)
-- (Handled by service role key, no policy needed)

-- ----------------------------------------------------------------------------
-- Helper Functions
-- ----------------------------------------------------------------------------

-- Get mutation count for artist in domain and time range
CREATE OR REPLACE FUNCTION get_artist_mutation_count(
  p_artist_id UUID,
  p_domain CHAR(1),
  p_days INT DEFAULT 7
) RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM coliseum_dna_mutations
    WHERE artist_id = p_artist_id
      AND domain = p_domain
      AND occurred_at >= NOW() - (p_days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_artist_mutation_count IS
  'Count DNA mutations for artist in specific domain and time window';

-- Get total effective delta for artist in domain and time range
CREATE OR REPLACE FUNCTION get_artist_domain_delta(
  p_artist_id UUID,
  p_domain CHAR(1),
  p_days INT DEFAULT 7
) RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(effective_delta)
    FROM coliseum_dna_mutations
    WHERE artist_id = p_artist_id
      AND domain = p_domain
      AND occurred_at >= NOW() - (p_days || ' days')::INTERVAL
  ), 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_artist_domain_delta IS
  'Sum effective deltas for artist in specific domain and time window';

-- Get mutation breakdown by key for artist
CREATE OR REPLACE FUNCTION get_artist_mutation_breakdown(
  p_artist_id UUID,
  p_domain CHAR(1),
  p_days INT DEFAULT 7
) RETURNS TABLE (
  mutation_key TEXT,
  mutation_count INT,
  total_delta NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.key AS mutation_key,
    COUNT(*)::INT AS mutation_count,
    SUM(m.effective_delta) AS total_delta
  FROM coliseum_dna_mutations m
  WHERE m.artist_id = p_artist_id
    AND m.domain = p_domain
    AND m.occurred_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY m.key
  ORDER BY total_delta DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_artist_mutation_breakdown IS
  'Get mutation breakdown by key for artist in domain (for debugging/analytics)';

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------

COMMENT ON TABLE coliseum_dna_mutations IS
  'Granular DNA mutation log. Each Passport event generates 0-4 mutations (one per domain affected). Used for audit trail and aggregate calculations in coliseum_domain_strength.';

COMMENT ON COLUMN coliseum_dna_mutations.passport_entry_id IS
  'Source Passport event that triggered this mutation';

COMMENT ON COLUMN coliseum_dna_mutations.domain IS
  'DNA domain: A (Cultural), T (Behavioral), G (Economic), C (Spatial)';

COMMENT ON COLUMN coliseum_dna_mutations.key IS
  'Mutation key (e.g., genre_diversity, loyalty_index, avg_transaction_value, geographic_reach)';

COMMENT ON COLUMN coliseum_dna_mutations.delta IS
  'Base mutation value (before weight and decay applied)';

COMMENT ON COLUMN coliseum_dna_mutations.weight IS
  'Event weight tier (0.1 for TIER 1 up to 1000 for TIER 5)';

COMMENT ON COLUMN coliseum_dna_mutations.recency_decay IS
  'Time decay factor (1.0 = just happened, approaches floor as time passes)';

COMMENT ON COLUMN coliseum_dna_mutations.effective_delta IS
  'Final mutation strength: delta × weight × recency_decay';

-- ----------------------------------------------------------------------------
-- Migration Complete
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'COLISEUM DNA MUTATIONS TABLE - MIGRATION COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  • coliseum_dna_mutations table';
  RAISE NOTICE '  • 5 indexes for fast queries';
  RAISE NOTICE '  • 3 RLS policies (artists, users, admins)';
  RAISE NOTICE '  • 3 helper functions (count, delta, breakdown)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy coliseum-processor Edge Function';
  RAISE NOTICE '  2. Test mutation generation from Passport events';
  RAISE NOTICE '  3. Verify aggregation into domain_strength';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
