-- =============================================================================
-- TREASURY WALLET ID AND VERIFICATION SUPPORT
-- Migration: 017_add_wallet_id_and_verification.sql
-- Date: November 23, 2025
-- Purpose: Add wallet_id support and Passport verification to Treasury system
-- =============================================================================

-- Add wallet_id and passport linking to ledger_entries
ALTER TABLE ledger_entries
  ADD COLUMN IF NOT EXISTS wallet_id TEXT,
  ADD COLUMN IF NOT EXISTS passport_entry_id UUID REFERENCES passport_entries(id),
  ADD COLUMN IF NOT EXISTS verification_hash TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed', 'flagged'));

-- Add wallet_id to passport_entries (if not exists)
ALTER TABLE passport_entries
  ADD COLUMN IF NOT EXISTS wallet_id TEXT,
  ADD COLUMN IF NOT EXISTS treasury_correlation_id TEXT;

-- Create verification table
CREATE TABLE IF NOT EXISTS treasury_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  passport_entry_id UUID REFERENCES passport_entries(id),
  verification_hash TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed', 'flagged')),
  ai_score REAL DEFAULT 0,
  anomalies JSONB DEFAULT '[]',
  verified_at TIMESTAMPTZ,
  verified_by TEXT DEFAULT 'system',  -- 'system', 'ai', 'admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_passport ON ledger_entries(passport_entry_id);
CREATE INDEX IF NOT EXISTS idx_ledger_verification ON ledger_entries(verification_status) WHERE verification_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_passport_wallet ON passport_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_passport_treasury ON passport_entries(treasury_correlation_id);
CREATE INDEX IF NOT EXISTS idx_verifications_correlation ON treasury_verifications(correlation_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON treasury_verifications(verification_status) WHERE verification_status IN ('pending', 'flagged');

-- Set default verification_status for existing entries
UPDATE ledger_entries
SET verification_status = 'pending'
WHERE verification_status IS NULL;

-- Comments for documentation
COMMENT ON COLUMN ledger_entries.wallet_id IS 'HMAC-SHA256 hash of user_id for privacy-preserving identification';
COMMENT ON COLUMN ledger_entries.passport_entry_id IS 'Reference to Passport entry for verification';
COMMENT ON COLUMN ledger_entries.verification_hash IS 'Hash for AI verification (hash of ledger + passport data)';
COMMENT ON COLUMN ledger_entries.verification_status IS 'Verification status: pending, verified, failed, flagged';
COMMENT ON COLUMN passport_entries.wallet_id IS 'Wallet ID matching Treasury wallet_id';
COMMENT ON COLUMN passport_entries.treasury_correlation_id IS 'Correlation ID linking to Treasury transaction';

