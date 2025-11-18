-- ===============================================
-- QUERY TEST USER DATA: dmstest49@gmail.com
-- Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new
-- ===============================================

-- 1. Find user ID
SELECT
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'dmstest49@gmail.com';

-- 2. Get user profile
SELECT
  p.*,
  m.id as mediaid_id,
  m.interests,
  m.genre_preferences,
  m.content_flags,
  m.location_code,
  m.created_at as mediaid_created_at
FROM profiles p
LEFT JOIN media_ids m ON m.user_uuid = p.id
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com');

-- 3. Get listening history
SELECT
  lh.id,
  lh.event_type,
  lh.content_title,
  lh.content_artist,
  lh.play_duration_seconds,
  lh.progress_percentage,
  lh.created_at
FROM listening_history lh
WHERE lh.user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com')
ORDER BY lh.created_at DESC
LIMIT 50;

-- 4. Get media engagement log
SELECT
  mel.id,
  mel.event_type,
  mel.content_id,
  mel.external_content_id,
  mel.metadata,
  mel.timestamp,
  mel.session_id
FROM media_engagement_log mel
WHERE mel.user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com')
ORDER BY mel.timestamp DESC
LIMIT 50;

-- 5. Get listening sessions
SELECT
  ls.id,
  ls.session_start,
  ls.session_end,
  ls.device_type,
  ls.total_tracks_played,
  ls.total_duration_seconds,
  ls.primary_content_type,
  ls.context
FROM listening_sessions ls
WHERE ls.user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com')
ORDER BY ls.session_start DESC
LIMIT 20;

-- 6. Get Concierto event interactions
SELECT
  e.id as event_id,
  e.title as event_title,
  e.start_date,
  ev.id as vote_id,
  ev.created_at as voted_at,
  ea.artist_profile_id
FROM event_votes ev
JOIN event_participants ep ON ep.id = ev.participant_id
JOIN events e ON e.id = ev.event_id
JOIN event_artists ea ON ea.id = ev.event_artist_id
WHERE ep.email = 'dmstest49@gmail.com'
ORDER BY ev.created_at DESC;

-- 7. Summary counts
SELECT
  'Total Listening History' as metric,
  COUNT(*) as count
FROM listening_history
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com')

UNION ALL

SELECT
  'Total Engagement Logs' as metric,
  COUNT(*) as count
FROM media_engagement_log
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com')

UNION ALL

SELECT
  'Total Sessions' as metric,
  COUNT(*) as count
FROM listening_sessions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com')

UNION ALL

SELECT
  'Total Event Votes' as metric,
  COUNT(*) as count
FROM event_votes ev
JOIN event_participants ep ON ep.id = ev.participant_id
WHERE ep.email = 'dmstest49@gmail.com';

-- 8. Get artist profile if exists
SELECT
  ap.*
FROM artist_profiles ap
WHERE ap.user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com');

-- 9. Get uploaded content if artist
SELECT
  ci.id,
  ci.title,
  ci.content_type,
  ci.is_published,
  ci.created_at,
  ci.processing_status
FROM content_items ci
WHERE ci.artist_id = (
  SELECT ap.id FROM artist_profiles ap
  WHERE ap.user_id = (SELECT id FROM auth.users WHERE email = 'dmstest49@gmail.com')
)
ORDER BY ci.created_at DESC;
