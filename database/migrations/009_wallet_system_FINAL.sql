-- =====================================================================
-- Migration 009: Wallet System (Based on ACTUAL Schema)
-- =====================================================================
-- Purpose: Add wallet features to existing event_tickets + create wallet tables
-- Based on actual schema inspection from database
-- =====================================================================

-- =====================================================================
-- 1. ALTER EXISTING event_tickets TABLE
-- =====================================================================

-- Add user_id (copy from attendee_id)
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Copy attendee_id to user_id for existing records
UPDATE public.event_tickets 
SET user_id = attendee_id 
WHERE user_id IS NULL;

-- Add event details for wallet display
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS event_title text,
  ADD COLUMN IF NOT EXISTS event_date timestamptz,
  ADD COLUMN IF NOT EXISTS event_venue text,
  ADD COLUMN IF NOT EXISTS event_image_url text;

-- Populate from events table
UPDATE public.event_tickets et
SET 
  event_title = e.title,
  event_date = e.start_date,
  event_venue = e.location,
  event_image_url = e.video_thumbnail_url
FROM events e
WHERE et.event_id = e.id
  AND et.event_title IS NULL;

-- Add tier display columns (map from ticket_tier)
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS tier_display_name text,
  ADD COLUMN IF NOT EXISTS price_cents integer;

-- Copy tier data
UPDATE public.event_tickets
SET 
  tier = LOWER(ticket_tier),
  tier_display_name = ticket_tier
WHERE tier IS NULL;

-- Add validation columns
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS ticket_number text,
  ADD COLUMN IF NOT EXISTS qr_code_data text,
  ADD COLUMN IF NOT EXISTS validation_secret text;

-- Copy from ticket_code
UPDATE public.event_tickets
SET 
  ticket_number = ticket_code,
  qr_code_data = ticket_code,
  validation_secret = md5(random()::text || clock_timestamp()::text)
WHERE ticket_number IS NULL;

-- Add status column (map from is_redeemed)
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

UPDATE public.event_tickets
SET status = CASE 
  WHEN is_redeemed = true THEN 'redeemed'
  ELSE 'active'
END
WHERE status = 'active';

-- Add transfer tracking
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS transferred_from uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS transferred_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_location text;

-- Add metadata columns
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS perks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Copy existing ticket_metadata
UPDATE public.event_tickets
SET metadata = COALESCE(ticket_metadata, '{}'::jsonb)
WHERE metadata = '{}'::jsonb;

-- Add validity columns
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_from timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Set valid_until based on event end date
UPDATE public.event_tickets et
SET valid_until = e.end_date + interval '1 day'
FROM events e
WHERE et.event_id = e.id
  AND et.valid_until IS NULL;

-- =====================================================================
-- 2. CREATE WALLET TABLES (New)
-- =====================================================================

-- Wallet Balances
CREATE TABLE IF NOT EXISTS wallet_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  available_balance_cents integer DEFAULT 0 NOT NULL,
  pending_balance_cents integer DEFAULT 0 NOT NULL,
  total_balance_cents integer GENERATED ALWAYS AS (available_balance_cents + pending_balance_cents) STORED,
  total_added_cents integer DEFAULT 0 NOT NULL,
  total_spent_cents integer DEFAULT 0 NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT positive_available_balance CHECK (available_balance_cents >= 0),
  CONSTRAINT positive_pending_balance CHECK (pending_balance_cents >= 0)
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  balance_before_cents integer NOT NULL,
  balance_after_cents integer NOT NULL,
  related_purchase_id uuid REFERENCES purchases(id),
  related_nft_id uuid,
  stripe_payment_intent_id text,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'completed' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creative NFTs (Pending Feature)
CREATE TABLE IF NOT EXISTS creative_nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) NOT NULL,
  current_owner_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  media_type text NOT NULL,
  media_url text NOT NULL,
  thumbnail_url text,
  properties jsonb DEFAULT '{}'::jsonb,
  collection_name text,
  edition_number integer,
  total_editions integer,
  mint_price_cents integer NOT NULL,
  current_price_cents integer,
  royalty_percentage integer DEFAULT 10,
  status text DEFAULT 'draft' NOT NULL,
  minted_at timestamptz,
  listed_at timestamptz,
  total_sales integer DEFAULT 0,
  total_revenue_cents integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 3. INDEXES
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_event_tickets_user_id ON event_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_status ON event_tickets(status);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_date ON event_tickets(event_date);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_code ON event_tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_event_tickets_ticket_number ON event_tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creative_nfts_creator ON creative_nfts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creative_nfts_owner ON creative_nfts(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_creative_nfts_status ON creative_nfts(status);

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_nfts ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON event_tickets;
DROP POLICY IF EXISTS "Event hosts can view tickets for their events" ON event_tickets;
DROP POLICY IF EXISTS "System can insert tickets" ON event_tickets;

-- Event Tickets Policies
CREATE POLICY "Users can view their own tickets"
  ON event_tickets FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = attendee_id);

CREATE POLICY "Event hosts can view tickets for their events"
  ON event_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_tickets.event_id
      AND e.host_user_id = auth.uid()  -- ✅ CORRECT: host_user_id not host_id
    )
  );

CREATE POLICY "System can insert tickets"
  ON event_tickets FOR INSERT
  WITH CHECK (true);

-- Wallet Balances Policies
CREATE POLICY "Users can view their own wallet balance"
  ON wallet_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON wallet_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- Wallet Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Creative NFTs Policies
CREATE POLICY "Anyone can view minted NFTs"
  ON creative_nfts FOR SELECT
  USING (status IN ('minted', 'listed', 'sold'));

CREATE POLICY "Owners can view their NFTs"
  ON creative_nfts FOR SELECT
  USING (auth.uid() = current_owner_id OR auth.uid() = creator_id);

CREATE POLICY "Creators can create NFTs"
  ON creative_nfts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- =====================================================================
-- 5. HELPER FUNCTIONS
-- =====================================================================

-- Generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  ticket_num text;
  year_part text;
  seq_part text;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
  ticket_num := 'BKT-' || year_part || '-' || seq_part;
  
  WHILE EXISTS (SELECT 1 FROM event_tickets WHERE ticket_number = ticket_num) LOOP
    seq_part := LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
    ticket_num := 'BKT-' || year_part || '-' || seq_part;
  END LOOP;
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Get user wallet summary
CREATE OR REPLACE FUNCTION get_wallet_summary(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'available_balance', COALESCE(wb.available_balance_cents, 0),
    'pending_balance', COALESCE(wb.pending_balance_cents, 0),
    'total_balance', COALESCE(wb.total_balance_cents, 0),
    'total_tickets', (
      SELECT COUNT(*) FROM event_tickets
      WHERE user_id = p_user_id AND status = 'active'
    ),
    'total_nfts', (
      SELECT COUNT(*) FROM creative_nfts
      WHERE current_owner_id = p_user_id AND status != 'burned'
    )
  ) INTO result
  FROM wallet_balances wb
  WHERE wb.user_id = p_user_id;
  
  RETURN COALESCE(result, jsonb_build_object(
    'available_balance', 0,
    'pending_balance', 0,
    'total_balance', 0,
    'total_tickets', (SELECT COUNT(*) FROM event_tickets WHERE user_id = p_user_id AND status = 'active'),
    'total_nfts', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 6. TRIGGERS
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_tickets_updated_at ON event_tickets;
DROP TRIGGER IF EXISTS update_wallet_balances_updated_at ON wallet_balances;
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON wallet_transactions;
DROP TRIGGER IF EXISTS update_creative_nfts_updated_at ON creative_nfts;

CREATE TRIGGER update_event_tickets_updated_at
  BEFORE UPDATE ON event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_balances_updated_at
  BEFORE UPDATE ON wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creative_nfts_updated_at
  BEFORE UPDATE ON creative_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- MIGRATION COMPLETE ✅
-- =====================================================================
-- Summary:
-- ✓ Added wallet columns to existing event_tickets
-- ✓ Mapped attendee_id → user_id
-- ✓ Mapped ticket_tier → tier
-- ✓ Mapped ticket_code → ticket_number
-- ✓ Mapped is_redeemed → status
-- ✓ Created wallet_balances table
-- ✓ Created wallet_transactions table  
-- ✓ Created creative_nfts table
-- ✓ Fixed RLS policy to use host_user_id (not host_id)
-- ✓ Added indexes, triggers, helper functions
-- =====================================================================

