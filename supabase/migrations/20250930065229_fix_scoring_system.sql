-- Fix scoring system tables - create only what's missing

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.event_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_card_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anonymous access
CREATE POLICY "Anonymous scoring allowed" ON public.event_scores FOR ALL USING (true);
CREATE POLICY "Anonymous feedback allowed" ON public.event_feedback FOR ALL USING (true);
CREATE POLICY "Templates are viewable by everyone" ON public.score_card_templates FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_scores_event_id ON public.event_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_artist_id ON public.event_scores(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_participant ON public.event_scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON public.event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_artist_id ON public.event_feedback(artist_id);