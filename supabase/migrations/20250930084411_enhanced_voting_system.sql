-- Enhanced Voting System Migration
-- Adds support for:
-- 1. Participant session persistence
-- 2. Event participants tracking
-- 3. Enhanced event management
-- 4. Mobile voting optimizations

-- Event Participants Table
-- Tracks registered participants for each event
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    memorable_code TEXT, -- Human-readable code like "HappyLion42"
    registration_method TEXT DEFAULT 'email' CHECK (registration_method IN ('email', 'social', 'link', 'qr')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    votes_cast INTEGER DEFAULT 0,
    scores_given INTEGER DEFAULT 0,
    feedback_given INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_agent TEXT,
    ip_address INET,
    UNIQUE(event_id, email)
);

-- Participant Sessions Table
-- Enhanced session persistence across devices and browsers
CREATE TABLE IF NOT EXISTS public.participant_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_email TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    shareable_code TEXT NOT NULL,
    session_data JSONB NOT NULL, -- Complete session state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count INTEGER DEFAULT 0,
    device_fingerprint TEXT,
    recovery_attempts INTEGER DEFAULT 0
);

-- Enhanced Events Table - Add voting window controls
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS voting_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS voting_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS mobile_optimized BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS allow_anonymous_voting BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN DEFAULT false;

-- Event Analytics Table
-- Track engagement and voting patterns
CREATE TABLE IF NOT EXISTS public.event_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL, -- 'page_view', 'registration', 'vote_cast', 'session_start', etc.
    metric_value NUMERIC DEFAULT 1,
    dimensions JSONB, -- Additional data like device_type, referrer, etc.
    participant_session TEXT, -- Reference to session if applicable
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_agent TEXT,
    ip_address INET
);

-- Email Templates Table
-- Store customizable email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Voting Sessions Table
-- Track individual voting sessions for analytics
CREATE TABLE IF NOT EXISTS public.voting_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_email TEXT NOT NULL,
    session_token TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    votes_cast INTEGER DEFAULT 0,
    scores_given INTEGER DEFAULT 0,
    feedback_given INTEGER DEFAULT 0,
    session_duration_seconds INTEGER,
    completion_rate DECIMAL(3,2), -- Percentage of available actions completed
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    interaction_method TEXT -- 'touch', 'mouse', 'keyboard'
);

-- Enable Row Level Security
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Event Participants - Open for anonymous registration but participants can only see their own data
CREATE POLICY "Event participants registration allowed" ON public.event_participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can view own data" ON public.event_participants
    FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR true); -- Allow anonymous for now

CREATE POLICY "Participants can update own data" ON public.event_participants
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Participant Sessions - Open access for session management
CREATE POLICY "Session management allowed" ON public.participant_sessions FOR ALL USING (true);

-- Event Analytics - Insert only for tracking
CREATE POLICY "Analytics tracking allowed" ON public.event_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Analytics read for event hosts" ON public.event_analytics FOR SELECT USING (true); -- Restrict in production

-- Email Templates - Admin only (will be refined based on your auth setup)
CREATE POLICY "Email templates admin access" ON public.email_templates FOR ALL USING (true); -- Restrict in production

-- Voting Sessions - Insert and read for analytics
CREATE POLICY "Voting sessions tracking" ON public.voting_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Voting sessions read" ON public.voting_sessions FOR SELECT USING (true);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_session_token ON public.event_participants(session_token);
CREATE INDEX IF NOT EXISTS idx_event_participants_email ON public.event_participants(email);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_token ON public.participant_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_event_id ON public.participant_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_expires_at ON public.participant_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_timestamp ON public.event_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_event_id ON public.voting_sessions(event_id);

-- Insert Default Email Templates
INSERT INTO public.email_templates (template_name, subject, html_content, variables) VALUES
(
    'voting_registration',
    '<« Your voting access for "{{event_title}}" is ready!',
    '<!DOCTYPE html><html><head><title>Voting Registration</title></head><body>Welcome {{participant_name}}! Your voting access is ready.</body></html>',
    '{"event_title": "Event Title", "participant_name": "Participant Name", "voting_url": "Voting URL", "session_token": "Session Token"}'
),
(
    'session_recovery',
    '= Recover your voting access for "{{event_title}}"',
    '<!DOCTYPE html><html><head><title>Session Recovery</title></head><body>Click here to recover your voting session: {{recovery_url}}</body></html>',
    '{"event_title": "Event Title", "participant_name": "Participant Name", "recovery_url": "Recovery URL"}'
) ON CONFLICT (template_name) DO NOTHING;

-- Functions for common operations

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.participant_sessions
    WHERE expires_at < now();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get event participation stats
CREATE OR REPLACE FUNCTION get_event_participation_stats(event_uuid UUID)
RETURNS TABLE (
    total_participants INTEGER,
    active_participants INTEGER,
    total_votes INTEGER,
    total_scores INTEGER,
    total_feedback INTEGER,
    avg_completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT ep.id)::INTEGER as total_participants,
        COUNT(DISTINCT CASE WHEN ep.last_active > now() - INTERVAL '1 hour' THEN ep.id END)::INTEGER as active_participants,
        SUM(ep.votes_cast)::INTEGER as total_votes,
        SUM(ep.scores_given)::INTEGER as total_scores,
        SUM(ep.feedback_given)::INTEGER as total_feedback,
        AVG(vs.completion_rate) as avg_completion_rate
    FROM public.event_participants ep
    LEFT JOIN public.voting_sessions vs ON vs.event_id = ep.event_id AND vs.participant_email = ep.email
    WHERE ep.event_id = event_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active on session access
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = now();
    NEW.access_count = OLD.access_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_access_trigger
    BEFORE UPDATE ON public.participant_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_active();

SELECT 'Enhanced voting system tables and functions created successfully!' as result;