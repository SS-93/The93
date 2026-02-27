-- =============================================================================
-- ENHANCE SUBSCRIPTIONS TABLE FOR TREASURY INTEGRATION
-- Migration: 014_enhance_subscriptions.sql
-- Date: November 23, 2025
-- Purpose: Add Stripe integration, pricing, billing, and Treasury logging support
-- =============================================================================

-- Ensure subscription_status enum exists
DO $$ BEGIN 
  CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'paused', 'expired', 'trialing', 'past_due');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enhance subscriptions table (fan-to-artist subscriptions)
ALTER TABLE subscriptions
  -- Tier/Pricing
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('basic', 'premium', 'vip')),
  ADD COLUMN IF NOT EXISTS price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT CHECK (billing_interval IN ('monthly', 'annual')),
  
  -- Stripe Integration
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  
  -- Billing Period
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  
  -- Features/Access
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update status column to use enum if it's not already
-- Note: If status is already TEXT, we'll keep it as TEXT for flexibility
-- But ensure it matches enum values

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_fan ON subscriptions(fan_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_artist ON subscriptions(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(current_period_end) WHERE status = 'active';

-- Add comments
COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier: basic, premium, vip';
COMMENT ON COLUMN subscriptions.price_cents IS 'Monthly or annual price in cents';
COMMENT ON COLUMN subscriptions.billing_interval IS 'Monthly or annual billing';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID for webhook handling';
COMMENT ON COLUMN subscriptions.features IS 'Feature flags for this subscription tier';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

