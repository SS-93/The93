/**
 * Passport Verification
 * 
 * Ensures Treasury ↔ Passport consistency by verifying:
 * - Amounts match between Treasury and Passport
 * - Wallet IDs match between Treasury and Passport
 * - Correlation IDs link correctly
 * - Generates verification hash
 */

import { supabase } from '../supabaseClient'
import crypto from 'crypto'

// =============================================================================
// TYPES
// =============================================================================

export interface VerificationResult {
  verified: boolean
  verificationHash: string
  amountsMatch: boolean
  walletsMatch: boolean
  details: {
    treasuryAmount: number
    passportAmount: number
    treasuryWalletId: string | null
    passportWalletId: string | null
  }
}

// =============================================================================
// PASSPORT VERIFICATION
// =============================================================================

export class PassportVerification {
  /**
   * Verify transaction matches Passport entry
   * 
   * @param correlationId - Treasury correlation ID
   * @param passportEntryId - Passport entry ID
   * @returns Verification result
   */
  static async verifyTransaction(
    correlationId: string,
    passportEntryId: string
  ): Promise<VerificationResult> {
    try {
      // 1. Get Treasury ledger entries
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('correlation_id', correlationId)

      if (ledgerError || !ledgerEntries || ledgerEntries.length === 0) {
        throw new Error('Ledger entries not found')
      }

      // 2. Get Passport entry
      const { data: passportEntry, error: passportError } = await supabase
        .from('passport_entries')
        .select('*')
        .eq('id', passportEntryId)
        .single()

      if (passportError || !passportEntry) {
        throw new Error('Passport entry not found')
      }

      // 3. Verify amounts match
      const amountsMatch = this.verifyAmounts(ledgerEntries, passportEntry)

      // 4. Verify wallet IDs match
      const walletsMatch = this.verifyWallets(ledgerEntries, passportEntry)

      // 5. Generate verification hash
      const verificationHash = this.generateHash(ledgerEntries, passportEntry)

      // 6. Update ledger entries with verification
      await this.updateVerification(correlationId, verificationHash, {
        amountsMatch,
        walletsMatch,
        verified: amountsMatch && walletsMatch
      })

      return {
        verified: amountsMatch && walletsMatch,
        verificationHash,
        amountsMatch,
        walletsMatch,
        details: {
          treasuryAmount: this.getTreasuryAmount(ledgerEntries),
          passportAmount: passportEntry.metadata?.amount_cents || passportEntry.metadata?.amountCents || 0,
          treasuryWalletId: ledgerEntries[0]?.wallet_id || null,
          passportWalletId: passportEntry.wallet_id || null
        }
      }
    } catch (error: any) {
      console.error('[Passport Verification] Error:', error)
      return {
        verified: false,
        verificationHash: '',
        amountsMatch: false,
        walletsMatch: false,
        details: {
          treasuryAmount: 0,
          passportAmount: 0,
          treasuryWalletId: null,
          passportWalletId: null
        }
      }
    }
  }

  /**
   * Verify amounts match between Treasury and Passport
   */
  private static verifyAmounts(
    ledgerEntries: any[],
    passportEntry: any
  ): boolean {
    // Get Treasury amount (sum of debits or credits)
    const treasuryAmount = this.getTreasuryAmount(ledgerEntries)

    // Get Passport amount
    const passportAmount = passportEntry.metadata?.amount_cents || 
                          passportEntry.metadata?.amountCents || 
                          0

    // Allow small rounding differences (1 cent)
    return Math.abs(treasuryAmount - passportAmount) <= 1
  }

  /**
   * Verify wallet IDs match between Treasury and Passport
   */
  private static verifyWallets(
    ledgerEntries: any[],
    passportEntry: any
  ): boolean {
    const treasuryWalletId = ledgerEntries[0]?.wallet_id
    const passportWalletId = passportEntry.wallet_id

    if (!treasuryWalletId || !passportWalletId) {
      return false
    }

    return treasuryWalletId === passportWalletId
  }

  /**
   * Generate verification hash
   */
  private static generateHash(
    ledgerEntries: any[],
    passportEntry: any
  ): string {
    const data = JSON.stringify({
      correlationId: ledgerEntries[0]?.correlation_id,
      treasuryAmount: this.getTreasuryAmount(ledgerEntries),
      passportAmount: passportEntry.metadata?.amount_cents || passportEntry.metadata?.amountCents,
      treasuryWalletId: ledgerEntries[0]?.wallet_id,
      passportWalletId: passportEntry.wallet_id,
      timestamp: new Date().toISOString()
    })

    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Get Treasury amount from ledger entries
   */
  private static getTreasuryAmount(ledgerEntries: any[]): number {
    // Sum of debit amounts (or credit amounts - they should be equal)
    return ledgerEntries
      .filter(e => e.type === 'debit')
      .reduce((sum, e) => sum + (e.amount_cents || 0), 0)
  }

  /**
   * Update verification status in ledger entries
   */
  private static async updateVerification(
    correlationId: string,
    verificationHash: string,
    result: { amountsMatch: boolean; walletsMatch: boolean; verified: boolean }
  ): Promise<void> {
    try {
      await supabase
        .from('ledger_entries')
        .update({
          verification_hash: verificationHash,
          verification_status: result.verified ? 'verified' : 'failed',
          verified_at: new Date().toISOString()
        })
        .eq('correlation_id', correlationId)
    } catch (error) {
      console.error('[Passport Verification] Error updating verification:', error)
    }
  }

  /**
   * Batch verify all unverified transactions
   */
  static async verifyAllUnverifiedTransactions(
    hoursBack: number = 24
  ): Promise<{ verified: number; failed: number }> {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

      // Get unverified ledger entries
      const { data: unverifiedEntries } = await supabase
        .from('ledger_entries')
        .select('correlation_id, passport_entry_id')
        .eq('verification_status', 'pending')
        .gte('created_at', cutoffTime)
        .not('passport_entry_id', 'is', null)

      if (!unverifiedEntries || unverifiedEntries.length === 0) {
        return { verified: 0, failed: 0 }
      }

      let verified = 0
      let failed = 0

      for (const entry of unverifiedEntries) {
        if (entry.passport_entry_id) {
          const result = await this.verifyTransaction(
            entry.correlation_id,
            entry.passport_entry_id
          )
          if (result.verified) {
            verified++
          } else {
            failed++
          }
        }
      }

      return { verified, failed }
    } catch (error) {
      console.error('[Passport Verification] Error in batch verification:', error)
      return { verified: 0, failed: 0 }
    }
  }
}

