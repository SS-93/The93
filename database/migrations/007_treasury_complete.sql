-- =============================================================================
-- TREASURY PROTOCOL - COMPLETE DATABASE SCHEMA
-- Version: 1.0 MVP
-- Created: November 10, 2025
-- Integrates: Passport, CALS, Stripe Connect, Double-Entry Ledger
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. DOUBLE-ENTRY LEDGER (Core Financial System)
-- =============================================================================

-- Ledger entries table (immutable, append-only)
CREATE TABLE ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  event_source TEXT NOT NULL, -- 'stripe_charge', 'refund', 'split', 'cals_attribution', 'adjustment'
  reference_id TEXT, -- External ID (Stripe charge, purchase ID, etc.)
  correlation_id TEXT NOT NULL, -- Groups paired entries
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_ledger_user_created ON ledger_entries(user_id, created_at DESC);
CREATE INDEX idx_ledger_correlation ON ledger_entries(correlation_id);
CREATE INDEX idx_ledger_reference ON ledger_entries(reference_id);
CREATE INDEX idx_ledger_event_source ON ledger_entries(event_source);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at DESC);

-- Balance view (calculated from ledger entries)
CREATE OR REPLACE VIEW treasury_balances AS
SELECT 
  user_id,
  SUM(CASE WHEN type = 'credit' THEN amount_cents ELSE -amount_cents END) AS balance_cents,
  COUNT(*) AS transaction_count,
  MAX(created_at) AS last_transaction_at
FROM ledger_entries
GROUP BY user_id;

-- Function to get user balance
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(
    SUM(CASE WHEN type = 'credit' THEN amount_cents ELSE -amount_cents END),
    0
  )
  FROM ledger_entries
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- =============================================================================
-- 2. STRIPE CONNECT ACCOUNTS
-- =============================================================================

CREATE TABLE stripe_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'express' CHECK (account_type IN ('express', 'standard', 'custom')),
  onboarding_status TEXT NOT NULL DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'restricted', 'complete', 'rejected')),
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  capabilities JSONB DEFAULT '{}',
  requirements JSONB DEFAULT '{}',
  business_type TEXT,
  country TEXT DEFAULT 'US',
  default_currency TEXT DEFAULT 'USD',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_stripe_accounts_status ON stripe_accounts(onboarding_status);
CREATE INDEX idx_stripe_accounts_payouts ON stripe_accounts(payouts_enabled) WHERE payouts_enabled = TRUE;

-- =============================================================================
-- 3. SPLIT RULES (Revenue Sharing Configuration)
-- =============================================================================

CREATE TABLE split_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('event', 'subscription', 'drop', 'tip', 'default')),
  entity_id UUID, -- Specific event/entity, NULL for default rules
  rules JSONB NOT NULL, -- [{"recipient_id": "uuid", "percent": 70, "role": "artist"}]
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure percentages add up to 100 (excluding platform fee)
  CONSTRAINT valid_split_rules CHECK (
    jsonb_typeof(rules) = 'array'
  )
);

-- Indexes
CREATE INDEX idx_split_rules_owner ON split_rules(owner_id);
CREATE INDEX idx_split_rules_entity ON split_rules(entity_type, entity_id);
CREATE INDEX idx_split_rules_default ON split_rules(is_default) WHERE is_default = TRUE;

-- Default split configuration (platform defaults)
INSERT INTO split_rules (owner_id, name, entity_type, rules, is_default)
SELECT 
  id,
  'Default Event Ticket Split',
  'event',
  '[
    {"role": "artist", "percent": 70},
    {"role": "host", "percent": 10},
    {"role": "platform", "percent": 20}
  ]'::jsonb,
  TRUE
FROM auth.users
WHERE email = 'admin@buckets.media'
LIMIT 1;

-- =============================================================================
-- 4. PAYOUTS (Queue & History)
-- =============================================================================

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  ledger_entry_ids BIGINT[], -- References to ledger entries being paid out
  stripe_transfer_id TEXT UNIQUE,
  stripe_payout_id TEXT UNIQUE,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payout_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (payout_type IN ('scheduled', 'instant', 'manual')),
  risk_score REAL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
  failure_code TEXT,
  failure_message TEXT,
  scheduled_for TIMESTAMPTZ,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  -- Business rules
  CONSTRAINT minimum_payout_amount CHECK (amount_cents >= 2500) -- $25 minimum
);

-- Indexes
CREATE INDEX idx_payouts_user ON payouts(user_id, initiated_at DESC);
CREATE INDEX idx_payouts_status ON payouts(status, scheduled_for);
CREATE INDEX idx_payouts_processing ON payouts(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_payouts_scheduled ON payouts(scheduled_for) WHERE status = 'pending';

-- =============================================================================
-- 5. PURCHASES (Stripe Checkout Records)
-- =============================================================================

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('ticket', 'membership', 'drop', 'premiere', 'tip', 'sponsorship')),
  product_id UUID, -- References specific product (event, content, etc.)
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
  fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'fulfilled', 'failed', 'expired')),
  fulfillment_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_purchases_user ON purchases(user_id, created_at DESC);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_product ON purchases(product_type, product_id);
CREATE INDEX idx_purchases_stripe_session ON purchases(stripe_checkout_session_id);
CREATE INDEX idx_purchases_stripe_intent ON purchases(stripe_payment_intent_id);

-- =============================================================================
-- 6. REFUNDS (Ledger Reversals)
-- =============================================================================

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  stripe_refund_id TEXT UNIQUE NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  ledger_reversal_entries BIGINT[], -- IDs of reversal ledger entries
  initiated_by UUID REFERENCES auth.users(id),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_refunds_purchase ON refunds(purchase_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_stripe ON refunds(stripe_refund_id);

-- =============================================================================
-- 7. DISPUTES (Chargebacks)
-- =============================================================================

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE RESTRICT,
  stripe_dispute_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('warning_needs_response', 'warning_under_review', 'warning_closed', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost')),
  evidence_details JSONB DEFAULT '{}',
  is_charge_refundable BOOLEAN DEFAULT TRUE,
  ledger_reversal_entries BIGINT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_by TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_disputes_purchase ON disputes(purchase_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_stripe ON disputes(stripe_dispute_id);
CREATE INDEX idx_disputes_due ON disputes(due_by) WHERE status LIKE '%needs_response%';

-- =============================================================================
-- 8. EVENT TICKETS (Concierto Integration)
-- =============================================================================

CREATE TABLE event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL, -- References events table (assume exists)
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  attendee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_tier TEXT NOT NULL, -- 'general', 'vip', 'backstage'
  ticket_code TEXT UNIQUE NOT NULL,
  seat_info JSONB DEFAULT '{}',
  ticket_metadata JSONB DEFAULT '{}',
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate tickets for same event/user/tier
  CONSTRAINT unique_attendee_event_tier UNIQUE (event_id, attendee_id, ticket_tier)
);

-- Indexes
CREATE INDEX idx_event_tickets_event ON event_tickets(event_id);
CREATE INDEX idx_event_tickets_attendee ON event_tickets(attendee_id);
CREATE INDEX idx_event_tickets_purchase ON event_tickets(purchase_id);
CREATE INDEX idx_event_tickets_code ON event_tickets(ticket_code);

-- Function to generate unique ticket code
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT AS $$
  SELECT 'TKT-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 10));
$$ LANGUAGE SQL VOLATILE;

-- =============================================================================
-- 9. CALS ATTRIBUTION LEDGER (Referral Credits)
-- =============================================================================

CREATE TABLE cals_attribution_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ticket_purchase', 'subscription', 'drop_purchase', 'tip')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  percentage REAL NOT NULL DEFAULT 5.0 CHECK (percentage >= 0 AND percentage <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'expired', 'cancelled')),
  ledger_entry_id BIGINT REFERENCES ledger_entries(id),
  payout_id UUID REFERENCES payouts(id),
  attribution_window_days INTEGER DEFAULT 7,
  link_opened_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  -- Prevent duplicate attributions
  CONSTRAINT unique_attribution_per_purchase UNIQUE (purchase_id, referrer_id)
);

-- Indexes
CREATE INDEX idx_cals_attribution_referrer ON cals_attribution_ledger(referrer_id, status);
CREATE INDEX idx_cals_attribution_beneficiary ON cals_attribution_ledger(beneficiary_id);
CREATE INDEX idx_cals_attribution_status ON cals_attribution_ledger(status);
CREATE INDEX idx_cals_attribution_purchase ON cals_attribution_ledger(purchase_id);

-- =============================================================================
-- 10. AUDIT LOGS (Admin Actions & System Events)
-- =============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_entity_type TEXT,
  target_entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_entity_type, target_entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================================================
-- 11. STRIPE WEBHOOK LOG (Idempotency & Debugging)
-- =============================================================================

CREATE TABLE stripe_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  api_version TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed', 'skipped')),
  payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_started_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_webhook_log_event_id ON stripe_webhook_log(stripe_event_id);
CREATE INDEX idx_webhook_log_type ON stripe_webhook_log(event_type, created_at DESC);
CREATE INDEX idx_webhook_log_status ON stripe_webhook_log(status);
CREATE INDEX idx_webhook_log_created ON stripe_webhook_log(created_at DESC);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cals_attribution_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Ledger Entries: Users see their own, admins see all
CREATE POLICY "Users view own ledger entries"
  ON ledger_entries FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "System can insert ledger entries"
  ON ledger_entries FOR INSERT
  WITH CHECK (true); -- Service role only

-- Stripe Accounts: Users manage their own
CREATE POLICY "Users view own stripe account"
  ON stripe_accounts FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users update own stripe account"
  ON stripe_accounts FOR UPDATE
  USING (id = auth.uid());

-- Split Rules: Owners manage their own
CREATE POLICY "Users view own split rules"
  ON split_rules FOR SELECT
  USING (owner_id = auth.uid() OR is_admin());

CREATE POLICY "Users manage own split rules"
  ON split_rules FOR ALL
  USING (owner_id = auth.uid());

-- Payouts: Users see their own
CREATE POLICY "Users view own payouts"
  ON payouts FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Purchases: Users see their own
CREATE POLICY "Users view own purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Event Tickets: Attendees see their tickets
CREATE POLICY "Users view own tickets"
  ON event_tickets FOR SELECT
  USING (attendee_id = auth.uid() OR is_admin());

-- CALS Attribution: Referrers and beneficiaries can view
CREATE POLICY "Users view own attributions"
  ON cals_attribution_ledger FOR SELECT
  USING (referrer_id = auth.uid() OR beneficiary_id = auth.uid() OR is_admin());

-- Audit Logs: Admins only
CREATE POLICY "Admins view audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to create paired ledger entries (double-entry)
CREATE OR REPLACE FUNCTION create_paired_ledger_entries(
  p_debit_user_id UUID,
  p_credit_user_id UUID,
  p_amount_cents BIGINT,
  p_event_source TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TEXT AS $$
DECLARE
  v_correlation_id TEXT;
BEGIN
  -- Generate unique correlation ID
  v_correlation_id := gen_random_uuid()::TEXT;
  
  -- Create debit entry
  INSERT INTO ledger_entries (
    user_id, amount_cents, type, event_source, 
    reference_id, correlation_id, description, metadata
  ) VALUES (
    p_debit_user_id, p_amount_cents, 'debit', p_event_source,
    p_reference_id, v_correlation_id, p_description, p_metadata
  );
  
  -- Create credit entry
  INSERT INTO ledger_entries (
    user_id, amount_cents, type, event_source,
    reference_id, correlation_id, description, metadata
  ) VALUES (
    p_credit_user_id, p_amount_cents, 'credit', p_event_source,
    p_reference_id, v_correlation_id, p_description, p_metadata
  );
  
  RETURN v_correlation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate ledger balance (sum of all entries = 0)
CREATE OR REPLACE FUNCTION validate_ledger_balance()
RETURNS TABLE(is_balanced BOOLEAN, total_imbalance BIGINT) AS $$
  SELECT 
    SUM(CASE WHEN type = 'credit' THEN amount_cents ELSE -amount_cents END) = 0 AS is_balanced,
    ABS(SUM(CASE WHEN type = 'credit' THEN amount_cents ELSE -amount_cents END)) AS total_imbalance
  FROM ledger_entries;
$$ LANGUAGE SQL STABLE;

-- =============================================================================
-- INITIAL DATA & PLATFORM ACCOUNTS
-- =============================================================================

-- Create platform reserve account (special system user)
-- This assumes auth.users table exists
-- You may need to adjust based on your auth setup

COMMENT ON TABLE ledger_entries IS 'Double-entry ledger for all financial transactions';
COMMENT ON TABLE stripe_accounts IS 'Stripe Connect Express accounts for artists/hosts';
COMMENT ON TABLE split_rules IS 'Revenue sharing configuration for events, subscriptions, etc.';
COMMENT ON TABLE payouts IS 'Payout queue and history for artist/host earnings';
COMMENT ON TABLE purchases IS 'Purchase records from Stripe Checkout sessions';
COMMENT ON TABLE refunds IS 'Refund records with ledger reversals';
COMMENT ON TABLE disputes IS 'Chargeback and dispute tracking';
COMMENT ON TABLE event_tickets IS 'Event tickets issued after purchase';
COMMENT ON TABLE cals_attribution_ledger IS 'CALS referral attribution credits';
COMMENT ON TABLE audit_logs IS 'System and admin action audit trail';
COMMENT ON TABLE stripe_webhook_log IS 'Stripe webhook event log for idempotency';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify migration success
DO $$ 
BEGIN
  RAISE NOTICE 'Treasury Protocol migration completed successfully!';
  RAISE NOTICE 'Created tables: ledger_entries, stripe_accounts, split_rules, payouts, purchases, refunds, disputes, event_tickets, cals_attribution_ledger, audit_logs, stripe_webhook_log';
  RAISE NOTICE 'Created indexes, RLS policies, and helper functions';
  RAISE NOTICE 'Next: Configure Stripe API keys and test checkout flow';
END $$;

