-- =============================================================================
-- BUCKETS CORE SUBSCRIPTIONS (Artist-to-Fan & Artist-to-Platform)
-- Migration: 016_buckets_core_subscriptions.sql
-- Date: November 23, 2025
-- Purpose: Core subscription system for Buckets platform - "it all starts with a drop in the bucket"
-- =============================================================================
--
-- ETHOS: Artists post content (music, BTS, art, media) and offer exclusive drops
--        behind paid tiers. Fans subscribe to unlock content. Artists can set
--        minimum pricing ($1/month) and optionally allow fans to pay more.
--
-- SUBSCRIPTION TYPES:
--
-- 1. ARTIST SUBSCRIPTION TIERS (artist_subscription_tiers)
--    Artists define their own subscription tiers for fans
--    - Minimum $1/month (platform requirement)
--    - Artists can allow fans to pay more (flexible pricing)
--    - Tiers unlock different levels of content access
--
-- 2. FAN-TO-ARTIST SUBSCRIPTIONS (enhanced subscriptions table)
--    Fans subscribe to artists' content tiers
--    - Links to artist-defined tiers
--    - Supports flexible pricing (fan can pay more than minimum)
--    - Treasury integration for revenue splits
--
-- 3. ARTIST-TO-PLATFORM SUBSCRIPTIONS (buckets_platform_subscriptions)
--    Artists subscribe to platform features:
--    - Advanced Analytics (Coliseum integration)
--    - Sync Library Access (for music/film supervisors to discover catalogs)
--    - AI Audio Mood/Genre Analyzer (automatic tagging)
--    - MediaID Auto-Tagging (DNA-based content tagging)
--    - Enhanced Locker Features
--    - Priority Support
--
-- =============================================================================

-- =============================================================================
-- 1. ARTIST SUBSCRIPTION TIERS TABLE
-- =============================================================================
-- Artists define their own subscription tiers for fans
CREATE TABLE IF NOT EXISTS artist_subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  
  -- Tier Details
  tier_name TEXT NOT NULL,                    -- "Basic", "Premium", "VIP", "Drop Access", etc.
  tier_order INTEGER NOT NULL DEFAULT 0,      -- Display order (0 = lowest tier)
  description TEXT,                           -- Tier description shown to fans
  benefits TEXT[],                            -- Array of benefits: ["Early access", "Exclusive drops", "BTS content"]
  
  -- Pricing
  price_min_cents INTEGER NOT NULL DEFAULT 100,  -- Minimum price in cents ($1.00 minimum)
  allow_custom_price BOOLEAN DEFAULT FALSE,       -- Allow fans to pay more than minimum
  price_max_cents INTEGER,                        -- Maximum price if custom pricing allowed (NULL = unlimited)
  price_suggested_cents INTEGER,                  -- Suggested price for fans (optional)
  
  -- Content Access
  locker_access_level TEXT NOT NULL CHECK (locker_access_level IN (
    'free',      -- Free content only
    'basic',      -- Basic tier content
    'premium',    -- Premium tier content
    'vip',        -- VIP tier content
    'all'         -- All content unlocked
  )),
  unlock_delay_hours INTEGER DEFAULT 0,       -- Hours before content unlocks (0 = immediate)
  max_downloads_per_month INTEGER,            -- Download limit (NULL = unlimited)
  early_access_hours INTEGER DEFAULT 0,       -- Early access hours before public release
  
  -- Revenue Split (Artist can share revenue with platform)
  platform_fee_percentage DECIMAL(5,2) DEFAULT 0.00,  -- Platform fee (0-100%)
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,           -- Default tier for new subscribers
  subscriber_count INTEGER DEFAULT 0,         -- Current subscriber count
  
  -- Metadata
  metadata JSONB DEFAULT '{}',                -- Additional tier metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(artist_id, tier_name),
  CHECK (price_min_cents >= 100),             -- Minimum $1.00
  CHECK (price_max_cents IS NULL OR price_max_cents >= price_min_cents),
  CHECK (platform_fee_percentage >= 0 AND platform_fee_percentage <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_tiers_artist ON artist_subscription_tiers(artist_id, is_active);
CREATE INDEX IF NOT EXISTS idx_artist_tiers_order ON artist_subscription_tiers(artist_id, tier_order);

-- Comments
COMMENT ON TABLE artist_subscription_tiers IS 'Artist-defined subscription tiers for fan subscriptions';
COMMENT ON COLUMN artist_subscription_tiers.price_min_cents IS 'Minimum subscription price ($1.00 minimum)';
COMMENT ON COLUMN artist_subscription_tiers.allow_custom_price IS 'Allow fans to pay more than minimum (pay-what-you-want above minimum)';
COMMENT ON COLUMN artist_subscription_tiers.locker_access_level IS 'Content access level for this tier';
COMMENT ON COLUMN artist_subscription_tiers.platform_fee_percentage IS 'Platform revenue share percentage (0-100%)';

-- =============================================================================
-- 2. ENHANCE SUBSCRIPTIONS TABLE (Fan-to-Artist)
-- =============================================================================
-- Link subscriptions to artist-defined tiers and support flexible pricing

-- Add tier_id reference to artist_subscription_tiers
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES artist_subscription_tiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_price_cents INTEGER,  -- Custom price if fan paid more than minimum
  ADD COLUMN IF NOT EXISTS locker_access_level TEXT CHECK (locker_access_level IN ('free', 'basic', 'premium', 'vip', 'all')),
  ADD COLUMN IF NOT EXISTS content_unlocked_count INTEGER DEFAULT 0,  -- Number of content items unlocked
  ADD COLUMN IF NOT EXISTS downloads_used_this_month INTEGER DEFAULT 0,  -- Downloads used in current month
  ADD COLUMN IF NOT EXISTS last_download_reset TIMESTAMPTZ;  -- When download counter last reset

-- Update existing subscriptions to link to tiers if possible
-- (This will be handled by application logic)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_locker_access ON subscriptions(artist_id, locker_access_level);

-- Comments
COMMENT ON COLUMN subscriptions.tier_id IS 'Reference to artist_subscription_tiers table';
COMMENT ON COLUMN subscriptions.custom_price_cents IS 'Custom price paid by fan (if more than tier minimum)';
COMMENT ON COLUMN subscriptions.locker_access_level IS 'Content access level granted by this subscription';

-- =============================================================================
-- 3. BUCKETS PLATFORM SUBSCRIPTIONS TABLE (Artist-to-Platform)
-- =============================================================================
-- Artists subscribe to platform features (analytics, Sync Library, AI tools, etc.)

CREATE TABLE IF NOT EXISTS buckets_platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  
  -- Subscription Plan
  plan_name TEXT NOT NULL CHECK (plan_name IN (
    'free',        -- Free tier (limited features)
    'starter',     -- Starter tier ($9/month)
    'basic',       -- Basic tier ($29/month)
    'pro',         -- Pro tier ($99/month)
    'enterprise'   -- Enterprise tier ($299/month)
  )),
  
  -- Pricing
  price_cents INTEGER NOT NULL DEFAULT 0,     -- Monthly price in cents
  price_annual_cents INTEGER,                  -- Annual price in cents (with discount)
  annual_discount_percent INTEGER DEFAULT 0,   -- Discount percentage for annual billing
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'annual', 'one_time')),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  
  -- Stripe Integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Billing Period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  
  -- Platform Features (Feature Flags)
  features JSONB DEFAULT '{}',  -- Feature flags: advanced_analytics, sync_library_access, ai_audio_analyzer, mediaid_auto_tagging, etc.
  
  -- Usage Tracking
  usage_limits JSONB DEFAULT '{}',  -- Limits per billing period: analytics_reports_month, sync_submissions_month, ai_analysis_tracks_month, api_calls_month, catalog_tracks_max
  usage_current JSONB DEFAULT '{}',  -- Current usage: analytics_reports_month, sync_submissions_month, ai_analysis_tracks_month, api_calls_month, catalog_tracks_max
  usage_reset_at TIMESTAMPTZ,        -- When usage counters reset
  
  -- Sync Library Specific
  sync_library_enabled BOOLEAN DEFAULT FALSE,  -- Access to Sync Library
  catalog_public BOOLEAN DEFAULT FALSE,          -- Make catalog discoverable by supervisors
  catalog_track_count INTEGER DEFAULT 0,        -- Number of tracks in catalog
  
  -- AI Features
  ai_analyzer_enabled BOOLEAN DEFAULT FALSE,    -- AI audio mood/genre analyzer
  mediaid_auto_tagging BOOLEAN DEFAULT FALSE,   -- MediaID auto-tagging enabled
  
  -- Lifetime Access (Lifetime Fee Feature)
  lifetime_access_granted BOOLEAN DEFAULT FALSE,  -- True when artist has paid $3000 lifetime platform fees
  lifetime_fees_paid_cents INTEGER DEFAULT 0,    -- Cumulative platform fees paid (in cents)
  lifetime_fee_threshold_cents INTEGER DEFAULT 300000,  -- Threshold for lifetime access ($3000 = 300000 cents)
  lifetime_access_granted_at TIMESTAMPTZ,        -- When lifetime access was granted
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(artist_id),  -- One platform subscription per artist
  CHECK (lifetime_fees_paid_cents >= 0),
  CHECK (lifetime_fee_threshold_cents >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buckets_platform_artist ON buckets_platform_subscriptions(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_buckets_platform_stripe ON buckets_platform_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_buckets_platform_features ON buckets_platform_subscriptions USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_buckets_platform_sync ON buckets_platform_subscriptions(sync_library_enabled, catalog_public) WHERE sync_library_enabled = true;
CREATE INDEX IF NOT EXISTS idx_buckets_platform_period ON buckets_platform_subscriptions(current_period_end) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_buckets_platform_lifetime ON buckets_platform_subscriptions(lifetime_access_granted, lifetime_fees_paid_cents) WHERE lifetime_access_granted = false;

-- Update trigger
CREATE OR REPLACE FUNCTION update_buckets_platform_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_buckets_platform_subscriptions_updated_at ON buckets_platform_subscriptions;
CREATE TRIGGER update_buckets_platform_subscriptions_updated_at
  BEFORE UPDATE ON buckets_platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_buckets_platform_subscriptions_updated_at();

-- Lifetime Access Grant Function
-- Automatically grants lifetime access when threshold is reached
CREATE OR REPLACE FUNCTION check_and_grant_lifetime_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if lifetime access should be granted
  IF NEW.lifetime_fees_paid_cents >= NEW.lifetime_fee_threshold_cents 
     AND NEW.lifetime_access_granted = FALSE THEN
    
    -- Grant lifetime access
    NEW.lifetime_access_granted := TRUE;
    NEW.lifetime_access_granted_at := now();
    
    -- Enable all advanced features
    NEW.features := jsonb_build_object(
      'advanced_analytics', true,
      'sync_library_access', true,
      'ai_audio_analyzer', true,
      'mediaid_auto_tagging', true,
      'enhanced_locker', true,
      'priority_support', true,
      'custom_branding', true,
      'api_access', true,
      'lifetime_access', true
    );
    
    -- Set unlimited usage limits
    NEW.usage_limits := jsonb_build_object(
      'analytics_reports_month', -1,  -- -1 = unlimited
      'sync_submissions_month', -1,
      'ai_analysis_tracks_month', -1,
      'api_calls_month', -1,
      'catalog_tracks_max', -1
    );
    
    -- Enable all feature flags
    NEW.sync_library_enabled := TRUE;
    NEW.catalog_public := TRUE;
    NEW.ai_analyzer_enabled := TRUE;
    NEW.mediaid_auto_tagging := TRUE;
    
    -- Update plan to reflect lifetime access
    NEW.plan_name := 'enterprise';  -- Lifetime access grants enterprise-level features
    
    -- Log to Passport (via application layer - this is just the DB trigger)
    -- Application should log: buckets.lifetime_access_granted event
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check lifetime access on update
DROP TRIGGER IF EXISTS check_lifetime_access_trigger ON buckets_platform_subscriptions;
CREATE TRIGGER check_lifetime_access_trigger
  BEFORE UPDATE ON buckets_platform_subscriptions
  FOR EACH ROW
  WHEN (NEW.lifetime_fees_paid_cents IS DISTINCT FROM OLD.lifetime_fees_paid_cents)
  EXECUTE FUNCTION check_and_grant_lifetime_access();

-- Helper Function: Add Platform Fee to Lifetime Total
-- Call this from application layer after processing revenue splits
CREATE OR REPLACE FUNCTION add_lifetime_platform_fee(
  p_artist_id UUID,
  p_fee_cents INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_fees INTEGER;
  v_threshold INTEGER;
  v_lifetime_granted BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get or create platform subscription
  INSERT INTO buckets_platform_subscriptions (artist_id, plan_name, billing_interval, status, lifetime_fees_paid_cents)
  VALUES (p_artist_id, 'free', 'one_time', 'active', p_fee_cents)
  ON CONFLICT (artist_id) DO UPDATE
  SET lifetime_fees_paid_cents = buckets_platform_subscriptions.lifetime_fees_paid_cents + p_fee_cents,
      updated_at = now()
  RETURNING lifetime_fees_paid_cents, lifetime_fee_threshold_cents, lifetime_access_granted
  INTO v_current_fees, v_threshold, v_lifetime_granted;
  
  -- Build result
  v_result := jsonb_build_object(
    'artist_id', p_artist_id,
    'fee_added_cents', p_fee_cents,
    'total_fees_paid_cents', v_current_fees,
    'threshold_cents', v_threshold,
    'lifetime_access_granted', v_lifetime_granted,
    'remaining_to_threshold_cents', GREATEST(0, v_threshold - v_current_fees)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_lifetime_platform_fee IS 'Add platform fee to artist lifetime total. Call after processing revenue splits. Automatically grants lifetime access if threshold reached.';

-- RLS Policies
ALTER TABLE artist_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets_platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Artist Subscription Tiers Policies
DROP POLICY IF EXISTS "Artists can view own tiers" ON artist_subscription_tiers;
CREATE POLICY "Artists can view own tiers"
ON artist_subscription_tiers FOR SELECT
TO authenticated
USING (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Artists can manage own tiers" ON artist_subscription_tiers;
CREATE POLICY "Artists can manage own tiers"
ON artist_subscription_tiers FOR ALL
TO authenticated
USING (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
);

-- Public can view active tiers (for subscription selection)
DROP POLICY IF EXISTS "Public can view active artist tiers" ON artist_subscription_tiers;
CREATE POLICY "Public can view active artist tiers"
ON artist_subscription_tiers FOR SELECT
TO authenticated
USING (is_active = true);

-- Buckets Platform Subscriptions Policies
DROP POLICY IF EXISTS "Artists can view own platform subscription" ON buckets_platform_subscriptions;
CREATE POLICY "Artists can view own platform subscription"
ON buckets_platform_subscriptions FOR SELECT
TO authenticated
USING (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Artists can manage own platform subscription" ON buckets_platform_subscriptions;
CREATE POLICY "Artists can manage own platform subscription"
ON buckets_platform_subscriptions FOR ALL
TO authenticated
USING (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
);

-- Comments
COMMENT ON TABLE artist_subscription_tiers IS 'Artist-defined subscription tiers for fan subscriptions - "it all starts with a drop in the bucket"';
COMMENT ON TABLE buckets_platform_subscriptions IS 'Artist subscriptions to Buckets platform features (analytics, Sync Library, AI tools)';
COMMENT ON COLUMN buckets_platform_subscriptions.plan_name IS 'Subscription tier: free, starter, basic, pro, enterprise';
COMMENT ON COLUMN buckets_platform_subscriptions.features IS 'Platform feature flags: advanced_analytics, sync_library_access, ai_audio_analyzer, mediaid_auto_tagging, etc.';
COMMENT ON COLUMN buckets_platform_subscriptions.sync_library_enabled IS 'Access to Sync Library for music/film supervisors to discover catalogs';
COMMENT ON COLUMN buckets_platform_subscriptions.catalog_public IS 'Make artist catalog discoverable by supervisors in Sync Library';
COMMENT ON COLUMN buckets_platform_subscriptions.ai_analyzer_enabled IS 'AI audio mood/genre analyzer enabled';
COMMENT ON COLUMN buckets_platform_subscriptions.mediaid_auto_tagging IS 'MediaID auto-tagging for content (DNA-based tagging)';
COMMENT ON COLUMN buckets_platform_subscriptions.lifetime_access_granted IS 'True when artist has paid $3000 lifetime platform fees - grants lifetime access to all advanced features';
COMMENT ON COLUMN buckets_platform_subscriptions.lifetime_fees_paid_cents IS 'Cumulative platform fees paid by artist (in cents) - tracked from revenue splits';
COMMENT ON COLUMN buckets_platform_subscriptions.lifetime_fee_threshold_cents IS 'Threshold for lifetime access ($3000 = 300000 cents) - once reached, lifetime_access_granted = true';
COMMENT ON COLUMN buckets_platform_subscriptions.lifetime_access_granted_at IS 'Timestamp when lifetime access was granted (when lifetime_fees_paid_cents >= lifetime_fee_threshold_cents)';

-- =============================================================================
-- TIER PRICING STRUCTURE (Documentation)
-- =============================================================================
--
-- BUCKETS PLATFORM SUBSCRIPTIONS (Artist-to-Platform):
--
-- FREE ($0/month):
--   - Basic analytics
--   - Basic locker features
--   - No Sync Library access
--   - No AI analyzer
--   - No MediaID auto-tagging
--
-- STARTER ($9/month):
--   - Basic analytics + reports (5/month)
--   - Enhanced locker features
--   - Sync Library access (read-only, 3 submissions/month)
--   - AI analyzer (10 tracks/month)
--   - Basic MediaID tagging
--
-- BASIC ($29/month):
--   - Advanced analytics + reports (20/month)
--   - Full locker features
--   - Sync Library access (10 submissions/month, catalog public)
--   - AI analyzer (50 tracks/month)
--   - Full MediaID auto-tagging
--   - API access (500 calls/month)
--
-- PRO ($99/month):
--   - All analytics features + unlimited reports
--   - Premium locker features
--   - Sync Library access (unlimited submissions, catalog public, priority)
--   - AI analyzer (unlimited tracks)
--   - Full MediaID auto-tagging + DNA matching
--   - API access (5,000 calls/month)
--   - Custom branding
--   - Priority support
--
-- ENTERPRISE ($299/month):
--   - All Pro features
--   - Unlimited everything
--   - White-label options
--   - Dedicated support
--   - Custom integrations
--   - Advanced API access (unlimited)
--
-- ANNUAL PRICING:
--   - 20% discount on annual subscriptions
--   - Example: Pro monthly = $99, Pro annual = $950 (20% off $1,188)
--
-- =============================================================================
-- LIFETIME ACCESS FEATURE (Lifetime Fee)
-- =============================================================================
--
-- CONCEPT: "Pay Once, Access Forever"
--   When an artist earns $3000-$9999, the platform collects platform fees
--   through revenue splits. Once cumulative platform fees reach $3000,
--   the artist receives lifetime access to all advanced features.
--
-- IMPLEMENTATION:
--   1. Track cumulative platform fees paid (lifetime_fees_paid_cents)
--   2. Platform fees are collected from revenue splits (tickets, subscriptions, etc.)
--   3. When lifetime_fees_paid_cents >= $3000 (300000 cents):
--      - Set lifetime_access_granted = true
--      - Set lifetime_access_granted_at = now()
--      - Grant all Pro/Enterprise features permanently
--      - Cancel any active paid subscription (optional)
--
-- REVENUE SPLIT LOGIC:
--   - Platform fees are calculated from revenue splits
--   - Fees accumulate in lifetime_fees_paid_cents
--   - Only applies to artists earning $3000-$9999 total revenue
--   - Once $3000 threshold reached, no more platform fees collected
--   - Lifetime access persists for the lifetime of the user account
--
-- EXAMPLE FLOW:
--   1. Artist earns $5000 from ticket sales
--   2. Platform takes 20% = $1000 platform fee
--   3. lifetime_fees_paid_cents = 100000 ($1000)
--   4. Artist earns another $10,000 from subscriptions
--   5. Platform takes 20% = $2000 platform fee
--   6. lifetime_fees_paid_cents = 300000 ($3000) ✅ THRESHOLD REACHED
--   7. lifetime_access_granted = true
--   8. Artist now has lifetime access to all features
--   9. Future platform fees are waived (or reduced to 0%)
--
-- PROCESSING:
--   - Check lifetime_fees_paid_cents after each revenue split
--   - Use database trigger or application logic to grant lifetime access
--   - Update features JSONB to enable all advanced features
--   - Log event to Passport: buckets.lifetime_access_granted
--
-- =============================================================================

