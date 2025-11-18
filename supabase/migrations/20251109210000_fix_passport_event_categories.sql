/**
 * =============================================================================
 * FIX PASSPORT EVENT CATEGORIES
 * =============================================================================
 *
 * ISSUE: Database constraint doesn't match TypeScript event categories
 *
 * Database had: 'player', 'concierto', 'treasury', 'coliseum', 'mediaid',
 *               'passport', 'social', 'profile', 'content', 'system'
 *
 * Code uses: 'trinity', 'interaction', 'transaction', 'access', 'social', 'system'
 *
 * This migration updates the constraint to match the code.
 * =============================================================================
 */

-- Drop the old constraint
ALTER TABLE passport_entries
DROP CONSTRAINT IF EXISTS valid_event_category;

-- Add new constraint matching TypeScript types
ALTER TABLE passport_entries
ADD CONSTRAINT valid_event_category CHECK (
  event_category IN (
    'trinity',        -- Direct Trinity system events (MediaID, Treasury, Coliseum)
    'interaction',    -- User content interactions (plays, likes, views)
    'transaction',    -- Financial transactions (purchases, tips)
    'access',         -- Auth and permission events (login, signup)
    'social',         -- Social interactions (follows, shares)
    'system'          -- System-generated events (migrations, jobs)
  )
);

-- Add helpful comment
COMMENT ON CONSTRAINT valid_event_category ON passport_entries IS
  'Validates event categories match the system architecture: trinity (MediaID/Treasury/Coliseum), interaction (content), transaction (financial), access (auth), social (relationships), system (internal)';
