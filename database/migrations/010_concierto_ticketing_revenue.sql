-- =============================================================================
-- CONCIERTO TICKETING & REVENUE SPLIT MIGRATION
-- Migration: 010_concierto_ticketing_revenue.sql
-- Date: November 23, 2025
-- =============================================================================

-- =============================================================================
-- 1. EVENT TICKET CONFIGURATION
-- =============================================================================

-- Add ticketing columns to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ticketing_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ticket_tiers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ticket_sales_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ticket_sales_end TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN events.ticket_tiers IS 'Array of ticket tier configurations: [{id, name, price_cents, quantity, available, perks, description, sales_start, sales_end}]';

-- =============================================================================
-- 2. PROFIT SHARE PARTNERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS event_profit_share_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  partner_key TEXT UNIQUE NOT NULL, -- Cryptographically generated
  partner_name TEXT NOT NULL, -- Display name (e.g., "Venue", "Promoter", "Artist")
  recipient_user_id UUID REFERENCES auth.users(id), -- If user account exists
  recipient_email TEXT, -- If no user account yet
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('artist', 'venue', 'promoter', 'sponsor', 'other')),
  split_percent DECIMAL(5,2) NOT NULL CHECK (split_percent >= 0 AND split_percent <= 100),
  qr_code_data TEXT, -- QR code for sharing
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id), -- Event host
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure event + partner_key uniqueness
  UNIQUE(event_id, partner_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profit_partners_event ON event_profit_share_partners(event_id);
CREATE INDEX IF NOT EXISTS idx_profit_partners_key ON event_profit_share_partners(partner_key);
CREATE INDEX IF NOT EXISTS idx_profit_partners_recipient ON event_profit_share_partners(recipient_user_id);

-- RLS Policies
ALTER TABLE event_profit_share_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their event partners"
  ON event_profit_share_partners FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can create partners for their events"
  ON event_profit_share_partners FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE host_user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update their event partners"
  ON event_profit_share_partners FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can delete their event partners"
  ON event_profit_share_partners FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_user_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. ARTIST CUSTOM TICKET LINKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS artist_ticket_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES event_artist_prospects(id) ON DELETE CASCADE,
  link_code TEXT UNIQUE NOT NULL, -- Short code for URL
  full_url TEXT NOT NULL, -- Full ticket purchase URL with attribution
  attribution_percent DECIMAL(5,2) DEFAULT 5.0, -- Artist gets X% of ticket sales via this link
  click_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration
  
  UNIQUE(event_id, artist_id) -- One link per artist per event
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_links_event ON artist_ticket_links(event_id);
CREATE INDEX IF NOT EXISTS idx_artist_links_artist ON artist_ticket_links(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_links_code ON artist_ticket_links(link_code);

-- RLS Policies
ALTER TABLE artist_ticket_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view their own links"
  ON artist_ticket_links FOR SELECT
  USING (
    artist_id IN (
      SELECT id FROM event_artist_prospects WHERE migrated_to_user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can view all links for their events"
  ON artist_ticket_links FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_user_id = auth.uid()
    )
  );

CREATE POLICY "System can create links"
  ON artist_ticket_links FOR INSERT
  WITH CHECK (true); -- Service role only

-- =============================================================================
-- 4. ATTENDEE CONVERSIONS (for DIA integration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS attendee_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Attendee reference (polymorphic)
  attendee_type TEXT NOT NULL CHECK (attendee_type IN ('artist', 'fan')),
  attendee_id UUID NOT NULL, -- References event_artist_prospects.id OR event_participants.id OR event_audience_members.id
  
  -- Conversion details
  original_email TEXT NOT NULL,
  original_name TEXT,
  converted_user_id UUID NOT NULL REFERENCES auth.users(id),
  conversion_source TEXT NOT NULL CHECK (conversion_source IN ('ticket_purchase', 'rsvp', 'manual', 'invite', 'qr_scan', 'registration_form')),
  conversion_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(event_id, attendee_type, attendee_id, converted_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendee_conversions_event ON attendee_conversions(event_id);
CREATE INDEX IF NOT EXISTS idx_attendee_conversions_user ON attendee_conversions(converted_user_id);
CREATE INDEX IF NOT EXISTS idx_attendee_conversions_attendee ON attendee_conversions(attendee_type, attendee_id);
CREATE INDEX IF NOT EXISTS idx_attendee_conversions_timestamp ON attendee_conversions(conversion_timestamp DESC);

-- RLS Policies
ALTER TABLE attendee_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view conversions for their events"
  ON attendee_conversions FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own conversions"
  ON attendee_conversions FOR SELECT
  USING (converted_user_id = auth.uid());

-- =============================================================================
-- 5. EXTEND EXISTING TABLES FOR CONVERSION TRACKING
-- =============================================================================

-- Extend event_participants
ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS user_account_created BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user_account_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS conversion_source TEXT CHECK (conversion_source IN ('ticket_purchase', 'rsvp', 'manual', 'invite', 'qr_scan', 'registration_form')),
  ADD COLUMN IF NOT EXISTS conversion_timestamp TIMESTAMPTZ;

-- Extend event_audience_members (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_audience_members') THEN
    ALTER TABLE event_audience_members
      ADD COLUMN IF NOT EXISTS user_account_created BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS user_account_id UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS conversion_source TEXT CHECK (conversion_source IN ('ticket_purchase', 'rsvp', 'manual', 'invite', 'qr_scan', 'registration_form')),
      ADD COLUMN IF NOT EXISTS conversion_timestamp TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================================================
-- 6. HELPER FUNCTIONS
-- =============================================================================

-- Function to generate partner key
CREATE OR REPLACE FUNCTION generate_partner_key(event_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  key TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate cryptographically secure key
    key := 'BKT-PARTNER-' || substring(event_id::TEXT from 1 for 8) || '-' || 
           encode(gen_random_bytes(32), 'base64url');
    
    -- Check if key already exists
    SELECT COUNT(*) INTO exists_check 
    FROM event_profit_share_partners 
    WHERE partner_key = key;
    
    -- Exit loop if key is unique
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN key;
END;
$$;

-- Function to refresh updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event_profit_share_partners
DROP TRIGGER IF EXISTS update_profit_partners_updated_at ON event_profit_share_partners;
CREATE TRIGGER update_profit_partners_updated_at
  BEFORE UPDATE ON event_profit_share_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. COMMENTS
-- =============================================================================

COMMENT ON TABLE event_profit_share_partners IS 'Profit share partners for events with cryptographic keys and QR codes';
COMMENT ON TABLE artist_ticket_links IS 'Custom ticket purchase links for artists with attribution tracking';
COMMENT ON TABLE attendee_conversions IS 'Tracks conversion of attendees (artists/fans) to user accounts';

