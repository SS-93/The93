-- =============================================================================
-- TREASURY → COLISEUM ANALYTICS INTEGRATION
-- Migration: 013_treasury_coliseum_analytics.sql
-- Date: November 23, 2025
-- Purpose: Create analytics views for Coliseum G-domain (Economic Signals)
-- =============================================================================

-- =============================================================================
-- ARTIST REVENUE SUMMARY VIEW
-- =============================================================================
-- Provides gross and net revenue per artist for Coliseum analytics
-- Net revenue = amount after splits are applied

CREATE OR REPLACE VIEW artist_revenue_summary AS
SELECT
  le.user_id as artist_id,
  COUNT(DISTINCT le.reference_id) as transaction_count,
  SUM(le.amount_cents) as net_revenue_cents,  -- Net after splits
  SUM(le.amount_cents) / 100.0 as net_revenue_dollars,
  -- Calculate gross revenue from purchases
  COALESCE(
    (SELECT SUM(p.amount_cents)
     FROM purchases p
     JOIN ledger_entries le2 ON le2.reference_id = p.id::TEXT
     WHERE le2.user_id = le.user_id
       AND le2.type = 'credit'
       AND le2.event_source = 'split'
       AND le2.metadata->>'role' = 'artist'
    ),
    0
  ) as gross_revenue_cents,
  COALESCE(
    (SELECT SUM(p.amount_cents) / 100.0
     FROM purchases p
     JOIN ledger_entries le2 ON le2.reference_id = p.id::TEXT
     WHERE le2.user_id = le.user_id
       AND le2.type = 'credit'
       AND le2.event_source = 'split'
       AND le2.metadata->>'role' = 'artist'
    ),
    0
  ) as gross_revenue_dollars,
  -- Calculate average split percentage
  AVG((le.metadata->>'split_percent')::numeric) as avg_split_percent,
  -- Revenue by reason
  COUNT(DISTINCT CASE WHEN le.metadata->>'reason' = 'ticket' THEN le.reference_id END) as ticket_count,
  COUNT(DISTINCT CASE WHEN le.metadata->>'reason' = 'tip' THEN le.reference_id END) as tip_count,
  COUNT(DISTINCT CASE WHEN le.metadata->>'reason' = 'subscription' THEN le.reference_id END) as subscription_count,
  -- Time range
  MIN(le.created_at) as first_revenue_date,
  MAX(le.created_at) as last_revenue_date
FROM ledger_entries le
WHERE le.type = 'credit'
  AND le.event_source = 'split'
  AND le.metadata->>'role' = 'artist'
GROUP BY le.user_id;

-- Add comment
COMMENT ON VIEW artist_revenue_summary IS 'Artist revenue analytics for Coliseum G-domain. Provides gross and net revenue per artist after splits are applied.';

-- =============================================================================
-- ARTIST REVENUE BY EVENT VIEW
-- =============================================================================
-- Provides revenue breakdown per artist per event

CREATE OR REPLACE VIEW artist_event_revenue AS
SELECT
  le.user_id as artist_id,
  (le.metadata->>'event_id')::uuid as event_id,
  COUNT(DISTINCT le.reference_id) as purchase_count,
  SUM(le.amount_cents) as net_revenue_cents,
  SUM(le.amount_cents) / 100.0 as net_revenue_dollars,
  AVG((le.metadata->>'split_percent')::numeric) as split_percent,
  MIN(le.created_at) as first_purchase_at,
  MAX(le.created_at) as last_purchase_at
FROM ledger_entries le
WHERE le.type = 'credit'
  AND le.event_source = 'split'
  AND le.metadata->>'role' = 'artist'
  AND le.metadata->>'event_id' IS NOT NULL
GROUP BY le.user_id, (le.metadata->>'event_id')::uuid;

-- Add comment
COMMENT ON VIEW artist_event_revenue IS 'Artist revenue per event for detailed analytics.';

-- =============================================================================
-- REVENUE PER FAN VIEW (Coliseum G-domain metric)
-- =============================================================================
-- Calculates Revenue Per Fan = SUM(amountCents) / COUNT(DISTINCT userId) / 100

CREATE OR REPLACE VIEW artist_revenue_per_fan AS
SELECT
  le.user_id as artist_id,
  COUNT(DISTINCT p.user_id) as unique_fans,
  SUM(le.amount_cents) as total_revenue_cents,
  CASE 
    WHEN COUNT(DISTINCT p.user_id) > 0 
    THEN SUM(le.amount_cents) / COUNT(DISTINCT p.user_id) / 100.0
    ELSE 0
  END as revenue_per_fan_dollars,
  COUNT(DISTINCT le.reference_id) as transaction_count
FROM ledger_entries le
JOIN purchases p ON p.id::TEXT = le.reference_id
WHERE le.type = 'credit'
  AND le.event_source = 'split'
  AND le.metadata->>'role' = 'artist'
GROUP BY le.user_id;

-- Add comment
COMMENT ON VIEW artist_revenue_per_fan IS 'Revenue Per Fan metric for Coliseum G-domain analytics. Formula: SUM(amountCents) / COUNT(DISTINCT userId) / 100';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on ledger_entries for artist revenue queries
CREATE INDEX IF NOT EXISTS idx_ledger_entries_artist_revenue 
ON ledger_entries(user_id, type, event_source, created_at)
WHERE type = 'credit' AND event_source = 'split' AND metadata->>'role' = 'artist';

-- Index on purchases for event attribution
CREATE INDEX IF NOT EXISTS idx_purchases_event_metadata 
ON purchases USING GIN(metadata jsonb_path_ops)
WHERE metadata->>'eventId' IS NOT NULL;

