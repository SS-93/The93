-- =====================================================================
-- Migration 008: Event Tickets + Wallet System (ALTER EXISTING TABLE)
-- =====================================================================
-- Purpose: Modify existing event_tickets table + add wallet functionality
-- This migration ALTERs the existing table rather than creating new
-- =====================================================================

-- =====================================================================
-- 1. ALTER EXISTING EVENT_TICKETS TABLE
-- =====================================================================

-- Add user_id column (map from existing attendee_id)
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Copy data from attendee_id to user_id if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_tickets' 
    AND column_name = 'attendee_id'
  ) THEN
    EXECUTE 'UPDATE public.event_tickets SET user_id = attendee_id WHERE user_id IS NULL AND attendee_id IS NOT NULL';
  END IF;
END $$;

-- Add foreign key constraint for user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_tickets_user_id_fkey'
  ) THEN
    ALTER TABLE public.event_tickets
      ADD CONSTRAINT event_tickets_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add event detail columns
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS event_title text,
  ADD COLUMN IF NOT EXISTS event_date timestamptz,
  ADD COLUMN IF NOT EXISTS event_venue text,
  ADD COLUMN IF NOT EXISTS event_image_url text;

-- Add tier columns (map from existing ticket_tier if exists)
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS tier_display_name text,
  ADD COLUMN IF NOT EXISTS price_cents integer;

-- Copy tier data from existing column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_tickets' 
    AND column_name = 'ticket_tier'
  ) THEN
    EXECUTE 'UPDATE public.event_tickets SET tier = ticket_tier WHERE tier IS NULL AND ticket_tier IS NOT NULL';
    EXECUTE 'UPDATE public.event_tickets SET tier_display_name = ticket_tier WHERE tier_display_name IS NULL AND ticket_tier IS NOT NULL';
  END IF;
END $$;

-- Add validation columns
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS ticket_number text,
  ADD COLUMN IF NOT EXISTS qr_code_data text,
  ADD COLUMN IF NOT EXISTS validation_secret text;

-- Copy from existing ticket_code if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_tickets' 
    AND column_name = 'ticket_code'
  ) THEN
    EXECUTE 'UPDATE public.event_tickets SET ticket_number = ticket_code WHERE ticket_number IS NULL AND ticket_code IS NOT NULL';
    EXECUTE 'UPDATE public.event_tickets SET qr_code_data = ticket_code WHERE qr_code_data IS NULL AND ticket_code IS NOT NULL';
  END IF;
END $$;

-- Add status column (default to 'active')
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Map existing is_redeemed to status
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_tickets' 
    AND column_name = 'is_redeemed'
  ) THEN
    EXECUTE 'UPDATE public.event_tickets SET status = ''redeemed'' WHERE is_redeemed = true AND status = ''active''';
  END IF;
END $$;

-- Add transfer tracking
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS transferred_from uuid,
  ADD COLUMN IF NOT EXISTS transferred_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_location text;

-- Add metadata columns
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS perks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Copy existing ticket_metadata if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_tickets' 
    AND column_name = 'ticket_metadata'
  ) THEN
    EXECUTE 'UPDATE public.event_tickets SET metadata = ticket_metadata WHERE metadata = ''{}''::jsonb AND ticket_metadata IS NOT NULL';
  END IF;
END $$;

-- Add validity columns
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_from timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_until timestamptz;

-- Add updated_at if it doesn't exist
ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add unique constraints where needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_tickets_ticket_number_key'
  ) THEN
    ALTER TABLE public.event_tickets
      ADD CONSTRAINT event_tickets_ticket_number_key UNIQUE (ticket_number);
  END IF;
EXCEPTION
  WHEN others THEN NULL; -- Skip if already exists
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_tickets_qr_code_data_key'
  ) THEN
    ALTER TABLE public.event_tickets
      ADD CONSTRAINT event_tickets_qr_code_data_key UNIQUE (qr_code_data);
  END IF;
EXCEPTION
  WHEN others THEN NULL; -- Skip if already exists
END $$;

-- =====================================================================
-- 2. CREATE NEW TABLES (Wallet System)
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

-- Event Tickets (only create if they don't exist)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_event_tickets_user_id ON event_tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON event_tickets(event_id);
  CREATE INDEX IF NOT EXISTS idx_event_tickets_status ON event_tickets(status);
  CREATE INDEX IF NOT EXISTS idx_event_tickets_event_date ON event_tickets(event_date);
  CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_code ON event_tickets(qr_code_data);
  CREATE INDEX IF NOT EXISTS idx_event_tickets_ticket_number ON event_tickets(ticket_number);
END $$;

-- Wallet Balances
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);

-- Wallet Transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Creative NFTs
CREATE INDEX IF NOT EXISTS idx_creative_nfts_creator ON creative_nfts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creative_nfts_owner ON creative_nfts(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_creative_nfts_status ON creative_nfts(status);
CREATE INDEX IF NOT EXISTS idx_creative_nfts_collection ON creative_nfts(collection_name);

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_nfts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own tickets" ON event_tickets;
DROP POLICY IF EXISTS "Event hosts can view tickets for their events" ON event_tickets;
DROP POLICY IF EXISTS "System can insert tickets" ON event_tickets;

-- Event Tickets Policies
CREATE POLICY "Users can view their own tickets"
  ON event_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Event hosts can view tickets for their events"
  ON event_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_tickets.event_id
      AND e.host_id = auth.uid()
    )
  );

CREATE POLICY "System can insert tickets"
  ON event_tickets FOR INSERT
  WITH CHECK (true);

-- Wallet Balances Policies
DROP POLICY IF EXISTS "Users can view their own wallet balance" ON wallet_balances;
DROP POLICY IF EXISTS "Users can update their own wallet" ON wallet_balances;

CREATE POLICY "Users can view their own wallet balance"
  ON wallet_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON wallet_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- Wallet Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON wallet_transactions;

CREATE POLICY "Users can view their own transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Creative NFTs Policies
DROP POLICY IF EXISTS "Anyone can view minted NFTs" ON creative_nfts;
DROP POLICY IF EXISTS "Owners can view their NFTs" ON creative_nfts;
DROP POLICY IF EXISTS "Creators can create NFTs" ON creative_nfts;

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
  
  RETURN COALESCE(result, '{}'::jsonb);
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

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_event_tickets_updated_at ON event_tickets;
DROP TRIGGER IF EXISTS update_wallet_balances_updated_at ON wallet_balances;
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON wallet_transactions;
DROP TRIGGER IF EXISTS update_creative_nfts_updated_at ON creative_nfts;

-- Create triggers
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
-- MIGRATION COMPLETE
-- =====================================================================
-- Next steps:
-- 1. Verify columns: SELECT column_name FROM information_schema.columns WHERE table_name = 'event_tickets';
-- 2. Update backend to generate tickets on purchase
-- 3. Build ReceiptModal component
-- 4. Add Passport event logging
-- =====================================================================

