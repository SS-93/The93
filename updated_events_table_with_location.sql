-- Create events table for Concierto (Updated with location field)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic event info
  title TEXT NOT NULL,
  description TEXT,
  location TEXT, -- 🆕 Added location field for venue/address

  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Event configuration
  shareable_code TEXT UNIQUE NOT NULL,
  max_votes_per_participant INTEGER DEFAULT 5,
  allow_multiple_votes BOOLEAN DEFAULT false,

  -- Ownership and status
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'live', 'completed', 'cancelled')),

  -- MediaID integration
  mediaid_integration_enabled BOOLEAN DEFAULT true,
  privacy_mode TEXT DEFAULT 'balanced' CHECK (privacy_mode IN ('minimal', 'balanced', 'enhanced')),

  -- Future Google Maps integration fields
  venue_name TEXT, -- Specific venue name
  venue_address TEXT, -- Structured address
  venue_coordinates JSONB, -- {"lat": 40.7128, "lng": -74.0060}
  venue_google_place_id TEXT, -- Google Maps Place ID

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event_artists table
CREATE TABLE IF NOT EXISTS event_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,

  -- Registration details
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'declined')),
  registration_token TEXT UNIQUE,
  contact_email TEXT,

  -- Voting data
  vote_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(event_id, artist_profile_id)
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_artists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$
BEGIN
  -- Drop and recreate events policies
  DROP POLICY IF EXISTS "Users can view events they host" ON events;
  DROP POLICY IF EXISTS "Users can create their own events" ON events;
  DROP POLICY IF EXISTS "Users can update events they host" ON events;

  -- Drop and recreate event_artists policies
  DROP POLICY IF EXISTS "Users can manage artists in their events" ON event_artists;

  -- Create events policies
  CREATE POLICY "Users can view events they host" ON events
    FOR SELECT USING (host_user_id = auth.uid());

  CREATE POLICY "Users can create their own events" ON events
    FOR INSERT WITH CHECK (host_user_id = auth.uid());

  CREATE POLICY "Users can update events they host" ON events
    FOR UPDATE USING (host_user_id = auth.uid());

  -- Create event_artists policies
  CREATE POLICY "Users can manage artists in their events" ON event_artists
    FOR ALL USING (
      EXISTS(SELECT 1 FROM events WHERE id = event_id AND host_user_id = auth.uid())
    );
END $$;

-- Create indexes (these are safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_shareable_code ON events(shareable_code);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location); -- 🆕 Location index
CREATE INDEX IF NOT EXISTS idx_event_artists_event ON event_artists(event_id);

-- Add helpful comments
COMMENT ON COLUMN events.location IS 'General venue/location information entered by event host';
COMMENT ON COLUMN events.venue_coordinates IS 'GPS coordinates for Google Maps integration: {"lat": number, "lng": number}';
COMMENT ON COLUMN events.venue_google_place_id IS 'Google Places API Place ID for rich venue information';