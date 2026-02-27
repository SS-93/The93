-- =====================================================================
-- Migration 008: Event Tickets + Passport Wallet System
-- =====================================================================
-- Purpose: Digital tickets + wallet balance for future NFT functionality
-- Connects to: Treasury Protocol, Passport Events, Concierto
-- =====================================================================

-- =====================================================================
-- 1. EVENT TICKETS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_id uuid REFERENCES purchases(id) ON DELETE SET NULL,
  
  -- Event details
  event_id uuid NOT NULL, -- References events table (will be created in concierto migration)
  event_title text NOT NULL,
  event_date timestamptz NOT NULL,
  event_venue text,
  event_image_url text,
  
  -- Ticket tier
  tier text NOT NULL, -- 'general', 'vip', 'backstage', etc.
  tier_display_name text NOT NULL, -- 'General Admission', 'VIP', 'Backstage Pass'
  price_cents integer NOT NULL,
  
  -- Validation
  ticket_number text UNIQUE NOT NULL, -- e.g., "BKT-2024-001234"
  qr_code_data text UNIQUE NOT NULL, -- Signed JWT payload
  validation_secret text NOT NULL, -- Server-side validation key
  
  -- Status
  status text NOT NULL DEFAULT 'active', 
  -- 'active', 'redeemed', 'transferred', 'cancelled', 'expired'
  
  -- Redemption tracking
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES auth.users(id),
  redeemed_location text, -- Venue/gate info
  
  -- Transfer tracking
  transferred_from uuid REFERENCES auth.users(id),
  transferred_at timestamptz,
  
  -- Metadata
  perks jsonb DEFAULT '[]'::jsonb, -- Array of perk strings
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional data
  
  -- Validity
  issued_at timestamptz DEFAULT now(),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. WALLET BALANCE TABLE (Future NFT Support)
-- =====================================================================

CREATE TABLE IF NOT EXISTS wallet_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Balances (in cents)
  available_balance_cents integer DEFAULT 0 NOT NULL,
  pending_balance_cents integer DEFAULT 0 NOT NULL,
  total_balance_cents integer GENERATED ALWAYS AS (available_balance_cents + pending_balance_cents) STORED,
  
  -- Lifetime stats
  total_added_cents integer DEFAULT 0 NOT NULL,
  total_spent_cents integer DEFAULT 0 NOT NULL,
  
  -- Metadata
  currency text DEFAULT 'usd' NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT positive_available_balance CHECK (available_balance_cents >= 0),
  CONSTRAINT positive_pending_balance CHECK (pending_balance_cents >= 0)
);

-- =====================================================================
-- 3. WALLET TRANSACTIONS TABLE (Add Funds, NFT Purchases)
-- =====================================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  transaction_type text NOT NULL,
  -- 'add_funds', 'purchase_nft', 'sell_nft', 'transfer_in', 'transfer_out', 'refund'
  
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  
  -- Balances after transaction
  balance_before_cents integer NOT NULL,
  balance_after_cents integer NOT NULL,
  
  -- Related records
  related_purchase_id uuid REFERENCES purchases(id),
  related_nft_id uuid, -- Future: references creative_nfts table
  stripe_payment_intent_id text,
  
  -- Description
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  status text DEFAULT 'completed' NOT NULL,
  -- 'pending', 'completed', 'failed', 'cancelled'
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 4. CREATIVE NFTS TABLE (Pending Feature - Digital Collectibles)
-- =====================================================================

CREATE TABLE IF NOT EXISTS creative_nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  creator_id uuid REFERENCES auth.users(id) NOT NULL,
  current_owner_id uuid REFERENCES auth.users(id) NOT NULL,
  
  -- NFT details
  title text NOT NULL,
  description text,
  media_type text NOT NULL, -- 'image', 'video', 'audio', 'text'
  media_url text NOT NULL,
  thumbnail_url text,
  
  -- Metadata
  properties jsonb DEFAULT '{}'::jsonb, -- Traits, attributes
  collection_name text,
  edition_number integer, -- e.g., 1 of 100
  total_editions integer,
  
  -- Pricing
  mint_price_cents integer NOT NULL,
  current_price_cents integer,
  royalty_percentage integer DEFAULT 10, -- Creator royalty on resales
  
  -- Status
  status text DEFAULT 'draft' NOT NULL,
  -- 'draft', 'minted', 'listed', 'sold', 'burned'
  
  minted_at timestamptz,
  listed_at timestamptz,
  
  -- Sales tracking
  total_sales integer DEFAULT 0,
  total_revenue_cents integer DEFAULT 0,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 5. INDEXES
-- =====================================================================

-- Event Tickets
CREATE INDEX idx_event_tickets_user_id ON event_tickets(user_id);
CREATE INDEX idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX idx_event_tickets_status ON event_tickets(status);
CREATE INDEX idx_event_tickets_event_date ON event_tickets(event_date);
CREATE INDEX idx_event_tickets_qr_code ON event_tickets(qr_code_data);
CREATE INDEX idx_event_tickets_ticket_number ON event_tickets(ticket_number);

-- Wallet Balances
CREATE INDEX idx_wallet_balances_user_id ON wallet_balances(user_id);

-- Wallet Transactions
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Creative NFTs
CREATE INDEX idx_creative_nfts_creator ON creative_nfts(creator_id);
CREATE INDEX idx_creative_nfts_owner ON creative_nfts(current_owner_id);
CREATE INDEX idx_creative_nfts_status ON creative_nfts(status);
CREATE INDEX idx_creative_nfts_collection ON creative_nfts(collection_name);

-- =====================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_nfts ENABLE ROW LEVEL SECURITY;

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
  WITH CHECK (true); -- Handled by service role

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
-- 7. HELPER FUNCTIONS
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
  
  -- Ensure uniqueness
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
    ),
    'recent_transactions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', wt.id,
          'type', wt.transaction_type,
          'amount', wt.amount_cents,
          'description', wt.description,
          'created_at', wt.created_at
        ) ORDER BY wt.created_at DESC
      )
      FROM wallet_transactions wt
      WHERE wt.user_id = p_user_id
      LIMIT 5
    )
  ) INTO result
  FROM wallet_balances wb
  WHERE wb.user_id = p_user_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 8. TRIGGERS
-- =====================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- 9. INITIAL DATA
-- =====================================================================

-- Create wallet balance for existing users (if any)
-- Note: This will be created automatically when users sign up via trigger
-- For existing users, run this separately if needed:
-- INSERT INTO wallet_balances (user_id, available_balance_cents, pending_balance_cents)
-- SELECT id, 0, 0 FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
-- Next steps:
-- 1. Build TicketCard component
-- 2. Create /wallet route
-- 3. Update webhook to generate tickets
-- 4. Add passport event logging
-- =====================================================================

