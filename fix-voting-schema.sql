-- Fix voting system database schema
-- This creates the missing tables and columns needed for voting

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

-- 3. Create event_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('vote', 'score', 'feedback')),
    vote_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_agent TEXT,
    timestamp BIGINT,
    session_duration BIGINT
);

-- 4. Create event_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE,
    scores JSONB NOT NULL,
    template_id UUID REFERENCES public.score_card_templates(id),
    average_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create event_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create event_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_data JSONB DEFAULT '{}'
);

-- 7. Enable RLS on all tables
ALTER TABLE public.score_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for score_card_templates
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.score_card_templates;
CREATE POLICY "Templates are viewable by everyone" ON public.score_card_templates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own templates" ON public.score_card_templates;
CREATE POLICY "Users can create their own templates" ON public.score_card_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.uid() IS NULL);

-- 9. Create RLS policies for voting tables (allow anonymous voting)
DROP POLICY IF EXISTS "Anyone can vote" ON public.event_votes;
CREATE POLICY "Anyone can vote" ON public.event_votes
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can score" ON public.event_scores;
CREATE POLICY "Anyone can score" ON public.event_scores
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can give feedback" ON public.event_feedback;
CREATE POLICY "Anyone can give feedback" ON public.event_feedback
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can be tracked for analytics" ON public.event_analytics;
CREATE POLICY "Anyone can be tracked for analytics" ON public.event_analytics
    FOR ALL USING (true);

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_score_card_templates_is_default ON public.score_card_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_events_score_template_id ON public.events(score_template_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_event_id ON public.event_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_artist_id ON public.event_votes(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_event_id ON public.event_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_artist_id ON public.event_scores(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON public.event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON public.event_analytics(event_id);

-- 11. Insert default Music Performance template
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

-- 12. Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Add trigger for score_card_templates updated_at
DROP TRIGGER IF EXISTS update_score_card_templates_updated_at ON public.score_card_templates;
CREATE TRIGGER update_score_card_templates_updated_at
    BEFORE UPDATE ON public.score_card_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Display success message
SELECT
    'Database schema updated successfully! All voting tables and default template created.' as result,
    COUNT(*) as default_templates_available
FROM public.score_card_templates
WHERE is_default = true;