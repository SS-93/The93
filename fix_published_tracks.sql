-- Fix existing tracks that should be published
-- Since this is a discovery platform, set all tracks to published unless explicitly private

UPDATE content_items
SET is_published = true
WHERE is_published = false;

-- Show results after update
SELECT
  id,
  title,
  is_published,
  created_at
FROM content_items
ORDER BY created_at DESC
LIMIT 10;