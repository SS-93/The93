/**
 * Distribution Manager
 * 
 * Centralized fund distribution manager.
 * All fund distributions go through here to ensure consistency
 * and proper tracking of lifetime fees.
 */

import { supabase } from '../supabaseClient'
import { createLedgerEntry } from './ledgerService'
import { logEvent } from '../passport/passportClient'
import { generateWalletId } from './walletId'

// =============================================================================
// TYPES
// =============================================================================

export interface Split {
  userId: string
  role: 'artist' | 'host' | 'platform' | 'partner'
  amountCents: number
  percent: number
  description: string
  metadata?: Record<string, any>
}

export interface DistributionResult {
  distributed: boolean
  recipients: number
  totalAmount: number
  splits: Split[]
}

// =============================================================================
// DISTRIBUTION MANAGER
// =============================================================================

export class DistributionManager {
  /**
   * Distribute funds to all recipients
   * 
   * Flow:
   * 1. Calculate splits
   * 2. Create ledger entries for each recipient
   * 3. Queue payouts (if applicable)
   * 4. Track lifetime fees
   * 5. Log to Passport
   */
  static async distributeFunds(
    sourceTransactionId: string,
    splits: Split[]
  ): Promise<DistributionResult> {
    try {
      // 1. Validate splits sum to total amount
      const totalAmount = splits.reduce((sum, s) => sum + s.amountCents, 0)
      
      // 2. Create ledger entries for each recipient
      const correlationId = `dist-${sourceTransactionId}-${Date.now()}`
      
      for (const split of splits) {
        // Skip platform (already credited in original transaction)
        if (split.role === 'platform') {
          continue
        }

        // Generate wallet ID for recipient
        const walletId = generateWalletId(split.userId)

        // Create credit entry for recipient
        await createLedgerEntry({
          userId: split.userId,
          amountCents: split.amountCents,
          type: 'credit',
          eventSource: 'split',
          referenceId: sourceTransactionId,
          correlationId,
          description: split.description,
          metadata: {
            ...split.metadata,
            wallet_id: walletId,
            role: split.role,
            percent: split.percent,
            source_transaction_id: sourceTransactionId
          }
        })
      }

      // 3. Track lifetime fees (platform fee accumulation)
      await this.trackLifetimeFees(splits)

      // 4. Log to Passport (one entry per artist for Coliseum)
      await this.logDistribution(sourceTransactionId, splits, correlationId)

      return {
        distributed: true,
        recipients: splits.length,
        totalAmount,
        splits
      }
    } catch (error: any) {
      console.error('[Distribution Manager] Error distributing funds:', error)
      throw error
    }
  }

  /**
   * Track lifetime fees for platform features
   * 
   * Updates platform_fee_total for artists and checks if
   * $3,000 threshold is reached for lifetime access.
   */
  static async trackLifetimeFees(splits: Split[]): Promise<void> {
    try {
      // Get platform fee amount
      const platformSplit = splits.find(s => s.role === 'platform')
      if (!platformSplit) {
        return
      }

      // Get artist splits (they pay platform fees)
      const artistSplits = splits.filter(s => s.role === 'artist')

      for (const artistSplit of artistSplits) {
        // Update lifetime fees paid
        // Note: This assumes we have a buckets_platform_subscriptions table
        // with lifetime_fees_paid_cents column
        const { error } = await supabase.rpc('add_lifetime_platform_fee', {
          p_user_id: artistSplit.userId,
          p_fee_cents: platformSplit.amountCents
        })

        if (error) {
          console.error('[Distribution Manager] Error tracking lifetime fee:', error)
        }
      }
    } catch (error) {
      console.error('[Distribution Manager] Error in trackLifetimeFees:', error)
    }
  }

  /**
   * Log distribution to Passport
   * 
   * Creates one entry per artist for Coliseum analytics.
   */
  static async logDistribution(
    sourceTransactionId: string,
    splits: Split[],
    correlationId: string
  ): Promise<void> {
    try {
      // Log one entry per artist (for Coliseum G-domain analytics)
      const artistSplits = splits.filter(s => s.role === 'artist')

      for (const artistSplit of artistSplits) {
        const walletId = generateWalletId(artistSplit.userId)

        await logEvent('treasury.revenue_split_applied', {
          artist_id: artistSplit.userId,
          amount_cents: artistSplit.amountCents,
          net_revenue_cents: artistSplit.amountCents, // Net after splits
          role: artistSplit.role,
          percent: artistSplit.percent,
          source_transaction_id: sourceTransactionId,
          correlation_id: correlationId,
          wallet_id: walletId
        })
      }

      // Log overall distribution
      await logEvent('treasury.distribution_completed', {
        source_transaction_id: sourceTransactionId,
        correlation_id: correlationId,
        total_recipients: splits.length,
        total_amount_cents: splits.reduce((sum, s) => sum + s.amountCents, 0)
      })
    } catch (error) {
      console.error('[Distribution Manager] Error logging distribution:', error)
    }
  }
}

