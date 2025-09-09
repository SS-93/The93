-- ===============================================
-- HOST ACCESS REQUEST SYSTEM
-- ===============================================
-- Extends existing schema for event hosting privileges

-- Add host_privileges to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS host_privileges JSONB DEFAULT '{
  "can_create_events": false,
  "max_concurrent_events": 0,
  "can_use_premium_features": false,
  "tier": "none",
  "enabled_at": null,
  "enabled_by": null,
  "request_id": null
}';

-- Create host_access_requests table
CREATE TABLE IF NOT EXISTS host_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_tier TEXT NOT NULL CHECK (requested_tier IN ('basic', 'premium')),
  justification TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  
  -- Request details
  requested_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '24 hours'),
  
  -- Admin processing
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id, status) -- Only one pending request per user
);

-- Enable RLS on host_access_requests
ALTER TABLE host_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for host_access_requests
CREATE POLICY "Users can view their own host requests" ON host_access_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own host requests" ON host_access_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" ON host_access_requests
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'pending'
    AND expires_at > now()
  );

CREATE POLICY "Admins can manage all host requests" ON host_access_requests
  FOR ALL USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_host_requests_user_status 
  ON host_access_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_host_requests_status_expires 
  ON host_access_requests(status, expires_at);

-- Function to automatically expire old requests
CREATE OR REPLACE FUNCTION expire_old_host_requests()
RETURNS void AS $$
BEGIN
  UPDATE host_access_requests 
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    status = 'pending' 
    AND expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable host privileges
CREATE OR REPLACE FUNCTION enable_host_privileges(
  target_user_id UUID,
  tier TEXT DEFAULT 'basic',
  max_events INTEGER DEFAULT 3,
  enabled_by_admin UUID DEFAULT NULL,
  request_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  max_events_count INTEGER;
  premium_features BOOLEAN;
BEGIN
  -- Set tier-specific privileges
  CASE tier
    WHEN 'basic' THEN
      max_events_count := LEAST(max_events, 5);
      premium_features := false;
    WHEN 'premium' THEN
      max_events_count := LEAST(max_events, 25);
      premium_features := true;
    ELSE
      RAISE EXCEPTION 'Invalid tier: %', tier;
  END CASE;

  -- Update user profile with host privileges
  UPDATE profiles 
  SET 
    host_privileges = jsonb_build_object(
      'can_create_events', true,
      'max_concurrent_events', max_events_count,
      'can_use_premium_features', premium_features,
      'tier', tier,
      'enabled_at', now(),
      'enabled_by', enabled_by_admin,
      'request_id', request_id
    ),
    updated_at = now()
  WHERE id = target_user_id;

  -- If this was from a request, mark it as approved
  IF request_id IS NOT NULL THEN
    UPDATE host_access_requests 
    SET 
      status = 'approved',
      processed_at = now(),
      processed_by = enabled_by_admin,
      updated_at = now()
    WHERE id = request_id AND user_id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create events
CREATE OR REPLACE FUNCTION can_user_create_events(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  privileges JSONB;
BEGIN
  SELECT host_privileges INTO privileges 
  FROM profiles 
  WHERE id = user_id;
  
  RETURN COALESCE((privileges->>'can_create_events')::BOOLEAN, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update timestamps
CREATE TRIGGER update_host_requests_updated_at 
  BEFORE UPDATE ON host_access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for efficient host privilege checks
CREATE INDEX IF NOT EXISTS idx_profiles_host_privileges 
  ON profiles USING GIN(host_privileges) 
  WHERE (host_privileges->>'can_create_events')::boolean = true;
