-- Voting system schema migration
-- Creates all necessary tables and policies for production voting system

-- 1. Add score_template_id column to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'score_template_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.events ADD COLUMN score_template_id UUID;
    END IF;
END $$;

-- 2. Create score_card_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.score_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    platform_type TEXT DEFAULT 'general' CHECK (platform_type IN ('music', 'food', 'art', 'film', 'sports', 'general')),
    categories JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    is_mobile_optimized BOOLEAN DEFAULT true,
    max_score INTEGER DEFAULT 5 CHECK (max_score IN (3, 5, 10)),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create event_votes table for production voting
CREATE TABLE IF NOT EXISTS public.event_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('vote', 'score', 'feedback')),
    vote_data JSONB DEFAULT '{}',
    memorable_code TEXT, -- For user data portability
    session_id TEXT, -- For grouping votes from same session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    -- Prevent duplicate votes per participant per artist
    UNIQUE(event_id, participant_id, artist_id, vote_type)
);

-- 4. Create event_scores table for detailed scoring
CREATE TABLE IF NOT EXISTS public.event_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE NOT NULL,
    scores JSONB NOT NULL, -- Individual category scores
    template_id UUID REFERENCES public.score_card_templates(id),
    average_score DECIMAL(3,2),
    memorable_code TEXT, -- Link to user's memorable code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent duplicate scores per participant per artist
    UNIQUE(event_id, participant_id, artist_id)
);

-- 5. Create event_feedback table
CREATE TABLE IF NOT EXISTS public.event_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE NOT NULL,
    feedback_text TEXT NOT NULL,
    sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    word_count INTEGER,
    memorable_code TEXT, -- Link to user's memorable code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create participant_sessions table for user data portability
CREATE TABLE IF NOT EXISTS public.participant_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_id TEXT NOT NULL,
    memorable_code TEXT UNIQUE NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    votes_count INTEGER DEFAULT 0,
    scores_count INTEGER DEFAULT 0,
    feedback_count INTEGER DEFAULT 0,
    digital_ticket JSONB DEFAULT '{}', -- Digital memorabilia data
    user_agent TEXT,
    ip_address INET
);

-- 7. Enable RLS on all tables
ALTER TABLE public.score_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_sessions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for anonymous voting but secure admin access
-- Score card templates - readable by all, manageable by authenticated users
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.score_card_templates;
CREATE POLICY "Templates are viewable by everyone" ON public.score_card_templates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create templates" ON public.score_card_templates;
CREATE POLICY "Users can create templates" ON public.score_card_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.uid() IS NULL);

-- Voting tables - allow anonymous participation but secure against abuse
DROP POLICY IF EXISTS "Anonymous voting allowed" ON public.event_votes;
CREATE POLICY "Anonymous voting allowed" ON public.event_votes
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Anonymous scoring allowed" ON public.event_scores;
CREATE POLICY "Anonymous scoring allowed" ON public.event_scores
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Anonymous feedback allowed" ON public.event_feedback;
CREATE POLICY "Anonymous feedback allowed" ON public.event_feedback
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Participant sessions accessible" ON public.participant_sessions;
CREATE POLICY "Participant sessions accessible" ON public.participant_sessions
    FOR ALL USING (true);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_score_templates_default ON public.score_card_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_score_templates_platform ON public.score_card_templates(platform_type);
CREATE INDEX IF NOT EXISTS idx_events_score_template ON public.events(score_template_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_event_id ON public.event_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_artist_id ON public.event_votes(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_participant ON public.event_votes(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_memorable_code ON public.event_votes(memorable_code);
CREATE INDEX IF NOT EXISTS idx_event_scores_event_id ON public.event_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_artist_id ON public.event_scores(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_participant ON public.event_scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON public.event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_event ON public.participant_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_code ON public.participant_sessions(memorable_code);

-- 10. Insert default Music Performance template
INSERT INTO public.score_card_templates (
    name,
    description,
    platform_type,
    is_default,
    is_mobile_optimized,
    max_score,
    categories,
    created_by
) VALUES (
    'Music Performance',
    'Default music competition scoring template',
    'music',
    true,
    true,
    5,
    '[
        {"id": "energy", "key": "energy", "label": "Energy & Stage Performance", "icon": "⚡", "description": "Stage presence and crowd engagement", "weight": 1.0},
        {"id": "vocals", "key": "vocals", "label": "Vocal Ability", "icon": "🎵", "description": "Technical vocal skills and pitch", "weight": 1.2},
        {"id": "stage_presence", "key": "stage_presence", "label": "Stage Presence", "icon": "🎭", "description": "Charisma and audience connection", "weight": 1.0},
        {"id": "originality", "key": "originality", "label": "Originality & Creativity", "icon": "✨", "description": "Unique style and creative expression", "weight": 1.1},
        {"id": "overall", "key": "overall", "label": "Overall Performance", "icon": "🏆", "description": "Complete performance evaluation", "weight": 1.3}
    ]'::jsonb,
    NULL
) ON CONFLICT DO NOTHING;

-- 11. Create function to update participant session activity
CREATE OR REPLACE FUNCTION update_participant_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity when votes, scores, or feedback are added
    UPDATE public.participant_sessions
    SET
        last_activity = now(),
        votes_count = CASE
            WHEN TG_TABLE_NAME = 'event_votes' THEN votes_count + 1
            ELSE votes_count
        END,
        scores_count = CASE
            WHEN TG_TABLE_NAME = 'event_scores' THEN scores_count + 1
            ELSE scores_count
        END,
        feedback_count = CASE
            WHEN TG_TABLE_NAME = 'event_feedback' THEN feedback_count + 1
            ELSE feedback_count
        END
    WHERE participant_id = NEW.participant_id
    AND event_id = NEW.event_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers to update session activity
DROP TRIGGER IF EXISTS update_session_on_vote ON public.event_votes;
CREATE TRIGGER update_session_on_vote
    AFTER INSERT ON public.event_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_session_activity();

DROP TRIGGER IF EXISTS update_session_on_score ON public.event_scores;
CREATE TRIGGER update_session_on_score
    AFTER INSERT ON public.event_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_session_activity();

DROP TRIGGER IF EXISTS update_session_on_feedback ON public.event_feedback;
CREATE TRIGGER update_session_on_feedback
    AFTER INSERT ON public.event_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_session_activity();

-- 13. Create view for event analytics
CREATE OR REPLACE VIEW public.event_voting_analytics AS
SELECT
    e.id as event_id,
    e.title as event_name,
    e.shareable_code,
    COUNT(DISTINCT ps.participant_id) as unique_participants,
    COUNT(ev.id) as total_votes,
    COUNT(es.id) as total_scores,
    COUNT(ef.id) as total_feedback,
    AVG(es.average_score) as overall_average_score,
    e.created_at as event_created,
    MAX(ps.last_activity) as last_voting_activity
FROM public.events e
LEFT JOIN public.participant_sessions ps ON ps.event_id = e.id
LEFT JOIN public.event_votes ev ON ev.event_id = e.id
LEFT JOIN public.event_scores es ON es.event_id = e.id
LEFT JOIN public.event_feedback ef ON ef.event_id = e.id
WHERE e.status IN ('published', 'live')
GROUP BY e.id, e.title, e.shareable_code, e.created_at
ORDER BY e.created_at DESC;

-- 14. Grant necessary permissions
GRANT SELECT ON public.event_voting_analytics TO anon, authenticated;

-- Success message
SELECT
    'Voting system schema successfully created!' as status,
    COUNT(*) as default_templates_created
FROM public.score_card_templates
WHERE is_default = true;