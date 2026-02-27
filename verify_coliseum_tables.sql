-- ============================================================================
-- COLISEUM AUDIO TRACKING SYSTEM - DATABASE SCHEMA VERIFICATION
-- ============================================================================
-- Run this in Supabase Dashboard SQL Editor to verify all tables exist
-- Dashboard: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new
-- ============================================================================

-- 1. Check passport_entries has coliseum_processed_at column
SELECT
  'passport_entries.coliseum_processed_at' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'passport_entries'
      AND column_name = 'coliseum_processed_at'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 2. Check coliseum_dna_mutations table exists
SELECT
  'coliseum_dna_mutations table' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'coliseum_dna_mutations'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 3. Check coliseum_artist_rankings view exists
SELECT
  'coliseum_artist_rankings view' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_name = 'coliseum_artist_rankings'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 4. Check coliseum_domain_rankings view exists
SELECT
  'coliseum_domain_rankings view' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_name = 'coliseum_domain_rankings'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- ============================================================================
-- DATA VERIFICATION - Check if we have real data
-- ============================================================================

-- 5. Count unprocessed passport entries (audio plays waiting for processor)
SELECT
  'Unprocessed audio plays' as metric,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Has data'
    ELSE '⚠️ No pending events'
  END as status
FROM passport_entries
WHERE coliseum_processed_at IS NULL
AND event_type = 'audio_play';

-- 6. Count processed passport entries (audio plays already processed)
SELECT
  'Processed audio plays' as metric,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Has processed data'
    ELSE '⚠️ No processed events yet'
  END as status
FROM passport_entries
WHERE coliseum_processed_at IS NOT NULL
AND event_type = 'audio_play';

-- 7. Count DNA mutations
SELECT
  'Total DNA mutations' as metric,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Mutations exist'
    ELSE '❌ No mutations yet'
  END as status
FROM coliseum_dna_mutations;

-- 8. Count mutations by domain (FIXED: use effective_delta instead of strength)
SELECT
  domain,
  COUNT(*) as mutation_count,
  ROUND(AVG(effective_delta), 2) as avg_effective_delta,
  ROUND(SUM(effective_delta), 2) as total_strength
FROM coliseum_dna_mutations
GROUP BY domain
ORDER BY domain;

-- 9. Check artist rankings (top 10)
SELECT
  'Artist rankings' as check_name,
  COUNT(*) as total_artists,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Rankings exist'
    ELSE '❌ No rankings yet'
  END as status
FROM coliseum_artist_rankings;

-- 10. View top 5 artists overall
SELECT
  artist_id,
  artist_name,
  total_plays,
  total_strength,
  overall_rank
FROM coliseum_artist_rankings
ORDER BY overall_rank
LIMIT 5;

-- 11. Check domain-specific rankings
SELECT
  'Domain rankings' as check_name,
  COUNT(*) as total_entries,
  COUNT(DISTINCT domain) as unique_domains,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Domain rankings exist'
    ELSE '❌ No domain rankings yet'
  END as status
FROM coliseum_domain_rankings;

-- 12. View top artists per domain
SELECT
  domain,
  artist_id,
  artist_name,
  plays_in_domain,
  strength_in_domain,
  domain_rank
FROM coliseum_domain_rankings
WHERE domain_rank <= 3
ORDER BY domain, domain_rank;

-- ============================================================================
-- RECENT ACTIVITY CHECK
-- ============================================================================

-- 13. Most recent processor run
SELECT
  'Most recent processing' as metric,
  MAX(coliseum_processed_at) as last_processed_time,
  EXTRACT(EPOCH FROM (NOW() - MAX(coliseum_processed_at)))/60 as minutes_ago
FROM passport_entries
WHERE coliseum_processed_at IS NOT NULL;

-- 14. Most recent DNA mutation
SELECT
  'Most recent mutation' as metric,
  MAX(created_at) as last_mutation_time,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/60 as minutes_ago
FROM coliseum_dna_mutations;

-- 15. Processing rate (last hour)
SELECT
  'Processing rate (last hour)' as metric,
  COUNT(*) as events_processed,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Active'
    ELSE '⚠️ No recent activity'
  END as status
FROM passport_entries
WHERE coliseum_processed_at >= NOW() - INTERVAL '1 hour'
AND event_type = 'audio_play';

-- ============================================================================
-- MUTATION BREAKDOWN - See what's being tracked
-- ============================================================================

-- 16. Sample recent mutations
SELECT
  m.id,
  m.domain,
  m.key as mutation_key,
  m.delta,
  m.weight,
  m.recency_decay,
  m.effective_delta,
  m.occurred_at,
  pe.event_type as source_event
FROM coliseum_dna_mutations m
JOIN passport_entries pe ON m.passport_entry_id = pe.id
ORDER BY m.created_at DESC
LIMIT 10;

-- 17. Mutation keys being tracked
SELECT
  domain,
  key,
  COUNT(*) as usage_count,
  ROUND(AVG(effective_delta), 2) as avg_strength
FROM coliseum_dna_mutations
GROUP BY domain, key
ORDER BY domain, usage_count DESC;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If all checks show ✅, the system is fully operational
-- If you see ❌, those tables/views need to be created via migrations
-- If you see ⚠️ with no data, the system is ready but hasn't processed events yet
-- ============================================================================
