-- ============================================================================
-- MIGRATION 017: HELPER FUNCTION FOR REFRESHING MATERIALIZED VIEWS
-- ============================================================================
-- Purpose: Create RPC function for Coliseum processor to refresh views
-- Required For: Edge Function to update leaderboards after processing events
-- Date: November 23, 2025
-- ============================================================================

-- ============================================================================
-- 1. CREATE REFRESH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Dynamically refresh the materialized view
  EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);

  RAISE NOTICE 'Refreshed materialized view: %', view_name;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION refresh_materialized_view IS
  'Refresh a materialized view by name. Used by Coliseum processor Edge Function to update leaderboards after processing events.';

-- ============================================================================
-- 2. GRANT PERMISSIONS
-- ============================================================================

-- Allow service role to execute this function
GRANT EXECUTE ON FUNCTION refresh_materialized_view TO service_role;

-- Allow anon role for potential future use
GRANT EXECUTE ON FUNCTION refresh_materialized_view TO anon;

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

-- Test the function with one of the Coliseum views
DO $$
BEGIN
  PERFORM refresh_materialized_view('coliseum_leaderboard_a_7d');
  RAISE NOTICE '✅ refresh_materialized_view function created and tested successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Failed to create or test refresh_materialized_view: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. USAGE EXAMPLE
-- ============================================================================

-- From Edge Function (TypeScript):
-- const { error } = await supabase.rpc('refresh_materialized_view', {
--   view_name: 'coliseum_leaderboard_a_7d'
-- });

-- ============================================================================
-- 5. ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback:
-- DROP FUNCTION IF EXISTS refresh_materialized_view(TEXT);

-- ============================================================================
-- END OF MIGRATION 017
-- ============================================================================
