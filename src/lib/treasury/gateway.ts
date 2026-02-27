/**
 * Treasury Gateway
 * 
 * Single entry point for all transactions in the Treasury system.
 * All transactions MUST go through this gateway for validation,
 * ledger creation, Passport logging, and verification.
 * 
 * Architecture:
 * - Validates transaction
 * - Creates ledger entries (double-entry)
 * - Logs to Passport
 * - Links Treasury ↔ Passport
 * - Returns transaction result
 */

import { supabase } from '../supabaseClient'
import { generateWalletId } from './walletId'
import { logEvent } from '../passport/passportClient'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// TYPES
// =============================================================================

export interface TransactionParams {
  userId: string
  amountCents: number
  currency?: string
  type: 'ticket' | 'subscription' | 'tip' | 'refund' | 'adjustment'
  referenceId?: string
  eventId?: string
  metadata?: Record<string, any>
}

export interface TransactionResult {
  transactionId: string
  correlationId: string
  passportEntryId?: string
  walletId: string
  status: 'completed' | 'failed'
  error?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// =============================================================================
// TREASURY GATEWAY
// =============================================================================

export class TreasuryGateway {
  /**
   * Process any transaction through the Treasury Gateway
   * 
   * This is the single entry point for all transactions.
   * 
   * Flow:
   * 1. Validate transaction
   * 2. Generate correlation ID
   * 3. Generate wallet ID
   * 4. Create ledger entries (double-entry)
   * 5. Log to Passport
   * 6. Link Treasury ↔ Passport
   * 7. Return result
   */
  static async processTransaction(
    params: TransactionParams
  ): Promise<TransactionResult> {
    try {
      // 1. Validate transaction
      const validation = await this.validateTransaction(params)
      if (!validation.valid) {
        return {
          transactionId: '',
          correlationId: '',
          walletId: '',
          status: 'failed',
          error: validation.errors.join(', ')
        }
      }

      // 2. Generate correlation ID (unique transaction identifier)
      const correlationId = `tx-${Date.now()}-${uuidv4().substring(0, 8)}`

      // 3. Generate wallet ID
      const walletId = generateWalletId(params.userId)

      // 4. Create ledger entries (double-entry)
      // Debit: buyer/user, Credit: platform
      const platformUserId = '00000000-0000-0000-0000-000000000000' // Platform reserve account
      
      // Create ledger entries directly (bypassing createPairedEntries to use our correlationId)
      const debitEntry = await supabase
        .from('ledger_entries')
        .insert({
          user_id: params.userId,
          wallet_id: walletId,
          amount_cents: params.amountCents,
          currency: params.currency || 'USD',
          type: 'debit',
          event_source: this.mapTransactionTypeToEventSource(params.type),
          reference_id: params.referenceId,
          correlation_id: correlationId,
          description: this.generateDescription(params),
          metadata: {
            ...params.metadata,
            wallet_id: walletId,
            transaction_type: params.type,
            event_id: params.eventId
          }
        })
        .select()
        .single()

      const creditEntry = await supabase
        .from('ledger_entries')
        .insert({
          user_id: platformUserId,
          wallet_id: generateWalletId(platformUserId),
          amount_cents: params.amountCents,
          currency: params.currency || 'USD',
          type: 'credit',
          event_source: this.mapTransactionTypeToEventSource(params.type),
          reference_id: params.referenceId,
          correlation_id: correlationId,
          description: this.generateDescription(params),
          metadata: {
            ...params.metadata,
            wallet_id: generateWalletId(platformUserId),
            transaction_type: params.type,
            event_id: params.eventId
          }
        })
        .select()
        .single()

      if (debitEntry.error || creditEntry.error) {
        throw new Error('Failed to create ledger entries')
      }

      // 5. Log to Passport
      const passportEntryId = await this.logToPassport(params, correlationId, walletId)

      // 6. Link Treasury ↔ Passport
      if (passportEntryId) {
        await this.linkPassportTreasury(correlationId, passportEntryId, walletId)
      }

      return {
        transactionId: correlationId,
        correlationId,
        passportEntryId,
        walletId,
        status: 'completed'
      }
    } catch (error: any) {
      console.error('[Treasury Gateway] Error processing transaction:', error)
      return {
        transactionId: '',
        correlationId: '',
        walletId: '',
        status: 'failed',
        error: error.message || 'Unknown error'
      }
    }
  }

  /**
   * Validate transaction parameters
   */
  static async validateTransaction(
    params: TransactionParams
  ): Promise<ValidationResult> {
    const errors: string[] = []

    // Required fields
    if (!params.userId) {
      errors.push('User ID is required')
    }

    if (!params.amountCents || params.amountCents <= 0) {
      errors.push('Amount must be greater than 0')
    }

    if (!params.type) {
      errors.push('Transaction type is required')
    }

    // Amount limits
    if (params.amountCents > 99999900) { // $999,999.00
      errors.push('Amount exceeds maximum limit ($999,999)')
    }

    // Currency validation
    const currency = params.currency || 'USD'
    if (!['USD', 'EUR', 'GBP'].includes(currency)) {
      errors.push(`Currency ${currency} not supported`)
    }

    // Rate limiting (basic check - could be enhanced)
    // TODO: Implement proper rate limiting

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Log transaction to Passport
   */
  static async logToPassport(
    params: TransactionParams,
    correlationId: string,
    walletId: string
  ): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('passport_entries')
        .insert({
          user_id: params.userId,
          wallet_id: walletId,
          event_type: 'treasury.transaction_created',
          event_category: 'financial',
          treasury_correlation_id: correlationId,
          metadata: {
            amount_cents: params.amountCents,
            currency: params.currency || 'USD',
            type: params.type,
            reference_id: params.referenceId,
            event_id: params.eventId,
            correlation_id: correlationId,
            wallet_id: walletId
          }
        })
        .select('id')
        .single()

      if (error) {
        console.error('[Treasury Gateway] Error logging to Passport:', error)
        return undefined
      }

      return data?.id?.toString()
    } catch (error) {
      console.error('[Treasury Gateway] Error logging to Passport:', error)
      return undefined
    }
  }

  /**
   * Link Treasury ↔ Passport entries
   */
  static async linkPassportTreasury(
    correlationId: string,
    passportEntryId: string | undefined,
    walletId: string
  ): Promise<void> {
    if (!passportEntryId) {
      return
    }

    try {
      // Update ledger entries with passport_entry_id and wallet_id
      await supabase
        .from('ledger_entries')
        .update({
          passport_entry_id: passportEntryId,
          wallet_id: walletId
        })
        .eq('correlation_id', correlationId)
    } catch (error) {
      console.error('[Treasury Gateway] Error linking Treasury ↔ Passport:', error)
    }
  }

  /**
   * Map transaction type to event source
   */
  private static mapTransactionTypeToEventSource(
    type: TransactionParams['type']
  ): 'stripe_charge' | 'refund' | 'split' | 'adjustment' {
    switch (type) {
      case 'ticket':
      case 'subscription':
      case 'tip':
        return 'stripe_charge'
      case 'refund':
        return 'refund'
      case 'adjustment':
        return 'adjustment'
      default:
        return 'stripe_charge'
    }
  }

  /**
   * Generate transaction description
   */
  private static generateDescription(params: TransactionParams): string {
    const amount = (params.amountCents / 100).toFixed(2)
    const currency = params.currency || 'USD'
    
    switch (params.type) {
      case 'ticket':
        return `Ticket purchase: $${amount} ${currency}`
      case 'subscription':
        return `Subscription payment: $${amount} ${currency}`
      case 'tip':
        return `Tip: $${amount} ${currency}`
      case 'refund':
        return `Refund: $${amount} ${currency}`
      case 'adjustment':
        return `Adjustment: $${amount} ${currency}`
      default:
        return `Transaction: $${amount} ${currency}`
    }
  }

  /**
   * Process refund transaction
   */
  static async processRefund(
    originalTransactionId: string,
    refundAmountCents: number,
    reason?: string
  ): Promise<TransactionResult> {
    // TODO: Implement refund logic
    // This would reverse the original transaction
    throw new Error('Refund processing not yet implemented')
  }
}

