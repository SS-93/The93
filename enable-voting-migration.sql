-- Enable voting on existing events
-- This will update events to allow voting access

-- Set all existing events to published status to enable voting
UPDATE public.events
SET status = 'published',
    updated_at = timezone('utc'::text, now())
WHERE status IN ('draft', 'active', 'live');

-- Ensure events have shareable codes for voting access
UPDATE public.events
SET shareable_code = CASE
    WHEN shareable_code IS NULL OR shareable_code = ''
    THEN LOWER(REPLACE(title, ' ', '-') || '-' || SUBSTRING(id::text, 1, 8))
    ELSE shareable_code
END,
updated_at = timezone('utc'::text, now())
WHERE shareable_code IS NULL OR shareable_code = '';

-- Ensure events are linked to default score template if none exists
UPDATE public.events
SET score_template_id = (
    SELECT id FROM public.score_card_templates
    WHERE name = 'Music Performance' AND is_default = true
    LIMIT 1
),
updated_at = timezone('utc'::text, now())
WHERE score_template_id IS NULL;

-- Display updated events ready for voting
SELECT
    id,
    title,
    status,
    shareable_code,
    score_template_id,
    created_at,
    'Ready for voting at: /events/vote/' || shareable_code as voting_url
FROM public.events
WHERE status = 'published'
ORDER BY created_at DESC;