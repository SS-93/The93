-- QUERY TEST USER INTERACTIONS
-- Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new
-- User: dmstest49@gmail.com
-- User ID: 15480116-8c78-4a75-af8c-2c70795333a6

-- ====================================
-- 1. USER PROFILE + MEDIAID COMPLETE
-- ====================================
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  p.display_name,
  p.role,
  m.id as mediaid_id,
  m.interests,
  m.genre_preferences,
  m.content_flags,
  m.location_code,
  m.profile_embedding IS NOT NULL as has_dna_vector,
  m.created_at as mediaid_created_at,
  m.updated_at as mediaid_updated_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN media_ids m ON m.user_uuid = u.id
WHERE u.id = '15480116-8c78-4a75-af8c-2c70795333a6';

-- ====================================
-- 2. LISTENING HISTORY (Last 50)
-- ====================================
SELECT
  lh.id,
  lh.event_type,
  lh.content_id,
  c.title as content_title,
  c.artist_name,
  lh.play_duration,
  lh.progress_percentage,
  lh.session_id,
  lh.created_at
FROM listening_history lh
LEFT JOIN content_items c ON c.id = lh.content_id
WHERE lh.user_id = '15480116-8c78-4a75-af8c-2c70795333a6'
ORDER BY lh.created_at DESC
LIMIT 50;

-- ====================================
-- 3. MEDIA ENGAGEMENT LOG (Last 50)
-- ====================================
SELECT
  mel.id,
  mel.event_type,
  mel.content_id,
  c.title as content_title,
  c.artist_name,
  mel.metadata,
  mel.session_id,
  mel.created_at
FROM media_engagement_log mel
LEFT JOIN content_items c ON c.id = mel.content_id
WHERE mel.user_id = '15480116-8c78-4a75-af8c-2c70795333a6'
ORDER BY mel.created_at DESC
LIMIT 50;

-- ====================================
-- 4. LISTENING SESSIONS
-- ====================================
SELECT
  lh.session_id,
  COUNT(*) as tracks_played,
  MIN(lh.created_at) as session_start,
  MAX(lh.created_at) as session_end,
  EXTRACT(EPOCH FROM (MAX(lh.created_at) - MIN(lh.created_at))) as session_duration_seconds
FROM listening_history lh
WHERE lh.user_id = '15480116-8c78-4a75-af8c-2c70795333a6'
  AND lh.session_id IS NOT NULL
GROUP BY lh.session_id
ORDER BY session_start DESC;

-- ====================================
-- 5. EVENT VOTES
-- ====================================
SELECT
  ev.id,
  ev.event_id,
  e.title as event_title,
  e.event_date,
  ev.artist_id,
  ap.artist_name,
  ev.created_at
FROM event_votes ev
LEFT JOIN events e ON e.id = ev.event_id
LEFT JOIN artist_profiles ap ON ap.id = ev.artist_id
WHERE ev.user_uuid = '15480116-8c78-4a75-af8c-2c70795333a6'
ORDER BY ev.created_at DESC;

-- ====================================
-- 6. ARTIST PROFILE (if exists)
-- ====================================
SELECT
  ap.id,
  ap.artist_name,
  ap.bio,
  ap.verified,
  ap.created_at,
  (SELECT COUNT(*) FROM content_items WHERE artist_id = ap.id) as uploads_count
FROM artist_profiles ap
WHERE ap.user_id = '15480116-8c78-4a75-af8c-2c70795333a6';

-- ====================================
-- 7. SUMMARY COUNTS
-- ====================================
SELECT
  (SELECT COUNT(*) FROM listening_history WHERE user_id = '15480116-8c78-4a75-af8c-2c70795333a6') as listening_count,
  (SELECT COUNT(*) FROM media_engagement_log WHERE user_id = '15480116-8c78-4a75-af8c-2c70795333a6') as engagement_count,
  (SELECT COUNT(DISTINCT session_id) FROM listening_history WHERE user_id = '15480116-8c78-4a75-af8c-2c70795333a6') as session_count,
  (SELECT COUNT(*) FROM event_votes WHERE user_uuid = '15480116-8c78-4a75-af8c-2c70795333a6') as vote_count,
  (SELECT EXISTS(SELECT 1 FROM artist_profiles WHERE user_id = '15480116-8c78-4a75-af8c-2c70795333a6')) as is_artist;

-- ====================================
-- 8. INTERACTION TIMELINE (Combined)
-- ====================================
-- Shows all interactions chronologically for DNA mirroring analysis
SELECT
  'listening' as source,
  lh.event_type as interaction_type,
  lh.content_id as entity_id,
  'track' as entity_type,
  c.title as entity_name,
  c.artist_name,
  lh.play_duration,
  lh.progress_percentage,
  NULL as metadata,
  lh.session_id,
  lh.created_at
FROM listening_history lh
LEFT JOIN content_items c ON c.id = lh.content_id
WHERE lh.user_id = '15480116-8c78-4a75-af8c-2c70795333a6'

UNION ALL

SELECT
  'engagement' as source,
  mel.event_type as interaction_type,
  mel.content_id as entity_id,
  'track' as entity_type,
  c.title as entity_name,
  c.artist_name,
  NULL as play_duration,
  NULL as progress_percentage,
  mel.metadata,
  mel.session_id,
  mel.created_at
FROM media_engagement_log mel
LEFT JOIN content_items c ON c.id = mel.content_id
WHERE mel.user_id = '15480116-8c78-4a75-af8c-2c70795333a6'

UNION ALL

SELECT
  'voting' as source,
  'vote_cast' as interaction_type,
  ev.event_id as entity_id,
  'event' as entity_type,
  e.title as entity_name,
  ap.artist_name,
  NULL as play_duration,
  NULL as progress_percentage,
  NULL as metadata,
  NULL as session_id,
  ev.created_at
FROM event_votes ev
LEFT JOIN events e ON e.id = ev.event_id
LEFT JOIN artist_profiles ap ON ap.id = ev.artist_id
WHERE ev.user_uuid = '15480116-8c78-4a75-af8c-2c70795333a6'

ORDER BY created_at DESC
LIMIT 100;

-- ====================================
-- 9. DNA MIRRORING READINESS CHECK
-- ====================================
-- Check what interactions have DNA influence weights defined
SELECT
  interaction_type,
  COUNT(*) as occurrence_count,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM (
  SELECT event_type as interaction_type, created_at FROM listening_history WHERE user_id = '15480116-8c78-4a75-af8c-2c70795333a6'
  UNION ALL
  SELECT event_type as interaction_type, created_at FROM media_engagement_log WHERE user_id = '15480116-8c78-4a75-af8c-2c70795333a6'
  UNION ALL
  SELECT 'vote_cast' as interaction_type, created_at FROM event_votes WHERE user_uuid = '15480116-8c78-4a75-af8c-2c70795333a6'
) interactions
GROUP BY interaction_type
ORDER BY occurrence_count DESC;

-- ====================================
-- 10. GENRE/INTEREST ANALYSIS
-- ====================================
-- Analyze listening patterns by genre
SELECT
  c.artist_name,
  COUNT(*) as play_count,
  AVG(lh.progress_percentage) as avg_completion_rate,
  SUM(lh.play_duration) as total_listen_time_seconds
FROM listening_history lh
LEFT JOIN content_items c ON c.id = lh.content_id
WHERE lh.user_id = '15480116-8c78-4a75-af8c-2c70795333a6'
  AND lh.event_type = 'played'
GROUP BY c.artist_name
ORDER BY play_count DESC;
