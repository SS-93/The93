-- Fix scoring system tables
-- Add missing columns to event_votes if they don't exist

DO $$
BEGIN
    -- Check if memorable_code exists in event_votes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'event_votes'
        AND column_name = 'memorable_code'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.event_votes ADD COLUMN memorable_code TEXT;
    END IF;

    -- Check if session_id exists in event_votes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'event_votes'
        AND column_name = 'session_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.event_votes ADD COLUMN session_id TEXT;
    END IF;

    -- Check if user_agent exists in event_votes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'event_votes'
        AND column_name = 'user_agent'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.event_votes ADD COLUMN user_agent TEXT;
    END IF;

    -- Check if ip_address exists in event_votes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'event_votes'
        AND column_name = 'ip_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.event_votes ADD COLUMN ip_address INET;
    END IF;
END $$;

-- Create event_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE NOT NULL,
    scores JSONB NOT NULL,
    template_id UUID,
    average_score DECIMAL(3,2),
    memorable_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, participant_id, artist_id)
);

-- Create event_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    participant_id TEXT NOT NULL,
    artist_id UUID REFERENCES public.event_artist_prospects(id) ON DELETE CASCADE NOT NULL,
    feedback_text TEXT NOT NULL,
    sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    word_count INTEGER,
    memorable_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create score_card_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.score_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    platform_type TEXT DEFAULT 'general' CHECK (platform_type IN ('music', 'food', 'art', 'film', 'sports', 'general')),
    categories JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    is_mobile_optimized BOOLEAN DEFAULT true,
    max_score INTEGER DEFAULT 5 CHECK (max_score IN (3, 5, 10)),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now') NOT NULL
);

-- Enable RLS
ALTER TABLE public.event_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_card_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anonymous scoring allowed" ON public.event_scores;
CREATE POLICY "Anonymous scoring allowed" ON public.event_scores FOR ALL USING (true);

DROP POLICY IF EXISTS "Anonymous feedback allowed" ON public.event_feedback;
CREATE POLICY "Anonymous feedback allowed" ON public.event_feedback FOR ALL USING (true);

DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.score_card_templates;
CREATE POLICY "Templates are viewable by everyone" ON public.score_card_templates FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_scores_event_id ON public.event_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_artist_id ON public.event_scores(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON public.event_feedback(event_id);

-- Insert default template if it doesn't exist
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

SELECT 'Scoring system tables created/updated successfully!' as result;