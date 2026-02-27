-- Create score card templates table for customizable scoring systems
CREATE TABLE IF NOT EXISTS public.score_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    platform_type TEXT DEFAULT 'general' CHECK (platform_type IN ('music', 'food', 'art', 'film', 'sports', 'general')),
    categories JSONB NOT NULL DEFAULT '[]', -- Array of category objects with id, key, label, icon, description, weight
    is_default BOOLEAN DEFAULT false,
    is_mobile_optimized BOOLEAN DEFAULT true,
    max_score INTEGER DEFAULT 5 CHECK (max_score IN (3, 5, 10)),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_score_card_templates_created_by ON public.score_card_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_score_card_templates_platform_type ON public.score_card_templates(platform_type);
CREATE INDEX IF NOT EXISTS idx_score_card_templates_is_default ON public.score_card_templates(is_default);

-- Enable RLS
ALTER TABLE public.score_card_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Templates are viewable by everyone" ON public.score_card_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own templates" ON public.score_card_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON public.score_card_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON public.score_card_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Add template_id to events table for linking events to score templates
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS score_template_id UUID REFERENCES public.score_card_templates(id) ON DELETE SET NULL;

-- Create index for events template linkage
CREATE INDEX IF NOT EXISTS idx_events_score_template_id ON public.events(score_template_id);

-- Insert default templates
INSERT INTO public.score_card_templates (
    name,
    description,
    platform_type,
    is_default,
    is_mobile_optimized,
    max_score,
    categories,
    created_by
) VALUES
-- Music Performance Template
(
    'Music Performance',
    'Professional music competition scoring',
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
),
-- Culinary Competition Template
(
    'Culinary Competition',
    'Food competition and cooking show scoring',
    'food',
    false,
    true,
    5,
    '[
        {"id": "taste", "key": "taste", "label": "Taste & Flavor", "icon": "👅", "description": "Overall flavor profile and balance", "weight": 1.4},
        {"id": "presentation", "key": "presentation", "label": "Presentation", "icon": "🎨", "description": "Visual appeal and plating", "weight": 1.0},
        {"id": "technique", "key": "technique", "label": "Cooking Technique", "icon": "👨‍🍳", "description": "Technical skill and execution", "weight": 1.2},
        {"id": "creativity", "key": "creativity", "label": "Creativity", "icon": "💡", "description": "Innovation and unique approach", "weight": 1.1},
        {"id": "overall", "key": "overall", "label": "Overall Dish", "icon": "🍽️", "description": "Complete culinary evaluation", "weight": 1.3}
    ]'::jsonb,
    NULL
),
-- Art Competition Template
(
    'Art Competition',
    'Visual arts and creative works judging',
    'art',
    false,
    true,
    5,
    '[
        {"id": "composition", "key": "composition", "label": "Composition", "icon": "🖼️", "description": "Visual balance and structure", "weight": 1.2},
        {"id": "technique", "key": "technique", "label": "Technique & Skill", "icon": "🎨", "description": "Technical execution and mastery", "weight": 1.1},
        {"id": "originality", "key": "originality", "label": "Originality", "icon": "✨", "description": "Creative uniqueness and innovation", "weight": 1.3},
        {"id": "emotional_impact", "key": "emotional_impact", "label": "Emotional Impact", "icon": "❤️", "description": "Emotional resonance with viewer", "weight": 1.2},
        {"id": "overall", "key": "overall", "label": "Overall Artwork", "icon": "🏆", "description": "Complete artistic evaluation", "weight": 1.2}
    ]'::jsonb,
    NULL
),
-- Mobile-First Simple Template
(
    'Mobile-First Simple',
    'Streamlined scoring for mobile devices',
    'general',
    false,
    true,
    5,
    '[
        {"id": "performance", "key": "performance", "label": "Performance", "icon": "🎯", "description": "Overall performance quality", "weight": 1.5},
        {"id": "impact", "key": "impact", "label": "Impact", "icon": "💥", "description": "Audience impact and engagement", "weight": 1.3},
        {"id": "overall", "key": "overall", "label": "Overall", "icon": "⭐", "description": "General impression", "weight": 1.2}
    ]'::jsonb,
    NULL
);

-- Update function for timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
CREATE TRIGGER update_score_card_templates_updated_at BEFORE UPDATE
ON public.score_card_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add template deployment configurations
CREATE TABLE IF NOT EXISTS public.template_deployment_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.score_card_templates(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'web', 'mobile', 'widget', 'embed', 'twitch', 'youtube', etc.
    config JSONB NOT NULL DEFAULT '{}', -- Platform-specific configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for deployment configs
ALTER TABLE public.template_deployment_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deployment configs
CREATE POLICY "Deployment configs are viewable by template owners" ON public.template_deployment_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.score_card_templates
            WHERE id = template_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Template owners can manage deployment configs" ON public.template_deployment_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.score_card_templates
            WHERE id = template_id AND created_by = auth.uid()
        )
    );

-- Add indexes for deployment configs
CREATE INDEX IF NOT EXISTS idx_template_deployment_configs_template_id ON public.template_deployment_configs(template_id);
CREATE INDEX IF NOT EXISTS idx_template_deployment_configs_platform ON public.template_deployment_configs(platform);

-- Add trigger for deployment configs updated_at
CREATE TRIGGER update_template_deployment_configs_updated_at BEFORE UPDATE
ON public.template_deployment_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();