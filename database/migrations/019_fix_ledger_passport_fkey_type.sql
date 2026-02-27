-- ============================================================================
-- MIGRATION 019: FIX LEDGER_ENTRIES PASSPORT FOREIGN KEY TYPE MISMATCH
-- ============================================================================
-- Purpose: Fix type mismatch between ledger_entries.passport_entry_id and passport_entries.id
-- Issue: ledger_entries.passport_entry_id is BIGINT but passport_entries.id is UUID
-- Date: November 23, 2025
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING FOREIGN KEY CONSTRAINT (if exists)
-- ============================================================================

ALTER TABLE ledger_entries
DROP CONSTRAINT IF EXISTS ledger_entries_passport_entry_id_fkey;

RAISE NOTICE '✅ Dropped existing foreign key constraint (if existed)';

-- ============================================================================
-- 2. ALTER COLUMN TYPE FROM BIGINT TO UUID
-- ============================================================================

-- First, check if column exists and what type it is
DO $$
DECLARE
  v_data_type TEXT;
BEGIN
  SELECT data_type INTO v_data_type
  FROM information_schema.columns
  WHERE table_name = 'ledger_entries'
    AND column_name = 'passport_entry_id';

  IF v_data_type IS NULL THEN
    RAISE NOTICE '⚠️  Column passport_entry_id does not exist yet, will be created as UUID';

    -- Add column as UUID if it doesn't exist
    ALTER TABLE ledger_entries
    ADD COLUMN passport_entry_id UUID REFERENCES passport_entries(id);

  ELSIF v_data_type = 'bigint' THEN
    RAISE NOTICE '⚠️  Column is BIGINT, converting to UUID...';

    -- If column has data, we need to handle it carefully
    -- Option 1: If no critical data, just recreate the column
    ALTER TABLE ledger_entries
    DROP COLUMN passport_entry_id;

    ALTER TABLE ledger_entries
    ADD COLUMN passport_entry_id UUID REFERENCES passport_entries(id);

    RAISE NOTICE '✅ Converted passport_entry_id from BIGINT to UUID';

  ELSIF v_data_type = 'uuid' THEN
    RAISE NOTICE '✅ Column is already UUID type';

    -- Just ensure foreign key exists
    ALTER TABLE ledger_entries
    DROP CONSTRAINT IF EXISTS ledger_entries_passport_entry_id_fkey;

    ALTER TABLE ledger_entries
    ADD CONSTRAINT ledger_entries_passport_entry_id_fkey
    FOREIGN KEY (passport_entry_id) REFERENCES passport_entries(id);

  END IF;
END $$;

-- ============================================================================
-- 3. ADD INDEX FOR FOREIGN KEY PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ledger_entries_passport_entry_id
ON ledger_entries(passport_entry_id);

RAISE NOTICE '✅ Created index on passport_entry_id';

-- ============================================================================
-- 4. ADD COMMENT FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN ledger_entries.passport_entry_id IS
  'Reference to passport_entries.id (UUID). Links ledger entries to their originating Passport events for Coliseum analytics.';

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_data_type TEXT;
  v_constraint_exists BOOLEAN;
BEGIN
  -- Check column type
  SELECT data_type INTO v_data_type
  FROM information_schema.columns
  WHERE table_name = 'ledger_entries'
    AND column_name = 'passport_entry_id';

  -- Check foreign key constraint
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'ledger_entries_passport_entry_id_fkey'
      AND table_name = 'ledger_entries'
  ) INTO v_constraint_exists;

  IF v_data_type = 'uuid' THEN
    RAISE NOTICE '✅ passport_entry_id is UUID type';
  ELSE
    RAISE EXCEPTION '❌ passport_entry_id is % (expected UUID)', v_data_type;
  END IF;

  IF v_constraint_exists THEN
    RAISE NOTICE '✅ Foreign key constraint exists';
  ELSE
    RAISE WARNING '⚠️  Foreign key constraint does not exist';
  END IF;
END $$;

-- ============================================================================
-- 6. ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback (only if needed):
-- ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_passport_entry_id_fkey;
-- ALTER TABLE ledger_entries DROP COLUMN IF EXISTS passport_entry_id;

-- ============================================================================
-- END OF MIGRATION 019
-- ============================================================================
