-- =============================================================================
-- PLATFORM SUBSCRIPTIONS TABLE (Artist/Brand Platform Features)
-- Migration: 015_platform_subscriptions.sql
-- Date: November 23, 2025
-- Purpose: Unified subscription system for platform features (Coliseum, Concierto Pro, Compañon Pro)
-- =============================================================================
--
-- SUBSCRIPTION TIER STRUCTURE:
--
-- 1. COLISEUM ANALYTICS (target_type = 'coliseum')
--    - free: $0/month - Top 10 leaderboard, 30-day retention, no exports
--    - starter: $19/month - Top 25 leaderboard, 1 domain (Cultural), 90-day retention, CSV exports
--    - basic: $29/month - Top 25 leaderboard, 1 domain (Cultural), 90-day retention, CSV exports, 1 artist profile
--    - pro: $99/month - Top 100 leaderboard, all 4 domains, 365-day retention, CSV/JSON exports, 5 artist profiles, API access
--    - enterprise: $499/month - Unlimited leaderboard, all domains, 3-year retention, all export formats, unlimited profiles, API access, realtime updates
--
-- 2. CONCIERTO PRO (target_type = 'concierto_pro')
--    - free: $0/month - 1 event/month, basic ticketing, no revenue splits, no custom branding
--    - starter: $9/month - 3 events/month, basic ticketing, revenue splits (up to 3 partners), basic analytics
--    - basic: $29/month - 10 events/month, advanced ticketing (tiers), revenue splits (unlimited partners), attendee tracking, basic analytics
--    - pro: $99/month - Unlimited events, advanced ticketing, revenue splits, attendee tracking, advanced analytics, custom branding, API access
--    - enterprise: $299/month - Unlimited events, all features, white-label, dedicated support, custom integrations
--
-- 3. COMPAÑON PRO (target_type = 'companon_pro')
--    - free: $0/month - 1 campaign/month, basic targeting, no analytics
--    - starter: $19/month - 3 campaigns/month, DNA targeting, basic analytics, up to $500 budget per campaign
--    - basic: $49/month - 10 campaigns/month, advanced targeting, analytics dashboard, up to $2,500 budget per campaign
--    - pro: $149/month - Unlimited campaigns, advanced targeting, realtime analytics, API access, up to $10,000 budget per campaign
--    - enterprise: $499/month - Unlimited campaigns, all features, white-label, dedicated support, custom budget limits
--
-- 4. PLATFORM FEATURES BUNDLE (target_type = 'platform_features')
--    - free: $0/month - Basic platform access
--    - starter: $29/month - Coliseum Starter + Concierto Starter features
--    - basic: $79/month - Coliseum Basic + Concierto Basic features
--    - pro: $199/month - Coliseum Pro + Concierto Pro + Compañon Pro features
--    - enterprise: $999/month - All features, white-label, dedicated support, custom integrations
--
-- ANNUAL PRICING:
--    - Annual subscriptions typically offer 20% discount (annual_discount_percent = 20)
--    - Example: Pro monthly = $99, Pro annual = $950 (20% off $1,188 = $950.40)
--
-- =============================================================================

-- Create platform_subscriptions table
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription Type
  subscription_type TEXT NOT NULL CHECK (subscription_type IN (
    'artist_platform',    -- Artist subscribing to platform features
    'brand_platform'     -- Brand subscribing to platform features
  )),
  
  -- Target Feature
  target_type TEXT NOT NULL CHECK (target_type IN (
    'coliseum',           -- Coliseum Analytics (can migrate from coliseum_entitlements)
    'concierto_pro',      -- Concierto Pro features
    'companon_pro',       -- Compañon Pro features
    'platform_features'   -- General platform features bundle
  )),
  target_id UUID,         -- Optional: specific feature ID
  
  -- Plan/Tier
  plan_name TEXT NOT NULL CHECK (plan_name IN (
    'free',        -- Free tier (limited features)
    'starter',     -- Starter tier (entry-level paid)
    'basic',       -- Basic tier (standard features)
    'pro',         -- Pro tier (advanced features)
    'enterprise'   -- Enterprise tier (unlimited features)
  )),
  price_cents INTEGER NOT NULL DEFAULT 0,  -- Monthly price in cents
  price_annual_cents INTEGER,              -- Annual price in cents (if different, includes discount)
  annual_discount_percent INTEGER DEFAULT 0, -- Discount percentage for annual billing (e.g., 20 = 20% off)
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
  
  -- Access Control & Features
  features JSONB DEFAULT '{}',  -- Feature flags (e.g., {"api_access": true, "realtime_updates": true, "custom_branding": false})
  
  -- Usage Tracking (for rate limiting and quotas)
  usage_limits JSONB DEFAULT '{}',  -- Limits per billing period: { "api_calls_month": 1000, "events_month": 10, "campaigns_month": 5, "reports_month": 10, "exports_month": 50 }
  usage_current JSONB DEFAULT '{}',  -- Current usage: { "api_calls_month": 150, "events_month": 2, "campaigns_month": 1, "reports_month": 2, "exports_month": 5 }
  usage_reset_at TIMESTAMPTZ,        -- When usage counters reset (typically period_end)
  
  -- Tier-Specific Limits (for event/campaign-based subscriptions)
  tier_limits JSONB DEFAULT '{}',    -- Tier-specific limits: { "max_events": 5, "max_attendees_per_event": 100, "max_campaigns": 3, "max_budget_per_campaign_cents": 100000 }
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id, subscription_type, target_type, target_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_user ON platform_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_stripe ON platform_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_features ON platform_subscriptions USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_type ON platform_subscriptions(subscription_type, target_type, status);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_period ON platform_subscriptions(current_period_end) WHERE status = 'active';

-- Update trigger
CREATE OR REPLACE FUNCTION update_platform_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_platform_subscriptions_updated_at ON platform_subscriptions;
CREATE TRIGGER update_platform_subscriptions_updated_at
  BEFORE UPDATE ON platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_subscriptions_updated_at();

-- RLS Policies
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own platform subscriptions
DROP POLICY IF EXISTS "Users can view own platform subscriptions" ON platform_subscriptions;
CREATE POLICY "Users can view own platform subscriptions"
ON platform_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can manage own platform subscriptions (insert/update)
DROP POLICY IF EXISTS "Users can manage own platform subscriptions" ON platform_subscriptions;
CREATE POLICY "Users can manage own platform subscriptions"
ON platform_subscriptions FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT ON TABLE platform_subscriptions IS 'Platform feature subscriptions for artists and brands (Coliseum, Concierto Pro, Compañon Pro)';
COMMENT ON COLUMN platform_subscriptions.subscription_type IS 'Type: artist_platform or brand_platform';
COMMENT ON COLUMN platform_subscriptions.target_type IS 'Feature: coliseum, concierto_pro, companon_pro, platform_features';
COMMENT ON COLUMN platform_subscriptions.plan_name IS 'Tier: free, starter, basic, pro, enterprise';
COMMENT ON COLUMN platform_subscriptions.price_cents IS 'Monthly price in cents';
COMMENT ON COLUMN platform_subscriptions.price_annual_cents IS 'Annual price in cents (if different from monthly * 12, includes discount)';
COMMENT ON COLUMN platform_subscriptions.annual_discount_percent IS 'Discount percentage for annual billing (e.g., 20 = 20% off monthly price)';
COMMENT ON COLUMN platform_subscriptions.features IS 'Feature flags JSON: { "api_access": true, "realtime_updates": true, "custom_branding": false, "white_label": false }';
COMMENT ON COLUMN platform_subscriptions.usage_limits IS 'Usage limits per billing period: { "api_calls_month": 1000, "events_month": 10, "campaigns_month": 5, "reports_month": 10, "exports_month": 50 }';
COMMENT ON COLUMN platform_subscriptions.usage_current IS 'Current usage: { "api_calls_month": 150, "events_month": 2, "campaigns_month": 1, "reports_month": 2, "exports_month": 5 }';
COMMENT ON COLUMN platform_subscriptions.usage_reset_at IS 'When usage counters reset (typically period_end)';
COMMENT ON COLUMN platform_subscriptions.tier_limits IS 'Tier-specific limits: { "max_events": 5, "max_attendees_per_event": 100, "max_campaigns": 3, "max_budget_per_campaign_cents": 100000 }';

