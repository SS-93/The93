/**
 * Treasury Ledger Service
 * 
 * Double-entry accounting system for all financial transactions.
 * Every transaction creates paired debit/credit entries with matching correlation_id.
 * 
 * MVP Integration:
 * - Logs all transactions to Passport (#0)
 * - Powers Treasury Protocol (#2)
 * - Feeds Coliseum analytics (#3)
 * - Integrates CALS attribution (#5)
 */

import { supabase } from '../supabaseClient'
import { logEvent } from '../passport/passportClient' // Assume this exists

// =============================================================================
// TYPES
// =============================================================================

export type LedgerEntryType = 'credit' | 'debit'

export type EventSource = 
  | 'stripe_charge'
  | 'refund'
  | 'split'
  | 'cals_attribution'
  | 'adjustment'
  | 'payout'

export interface LedgerEntry {
  id: number
  user_id: string
  amount_cents: number
  currency: string
  type: LedgerEntryType
  event_source: EventSource
  reference_id?: string
  correlation_id: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface CreateLedgerEntryParams {
  userId: string
  amountCents: number
  type: LedgerEntryType
  eventSource: EventSource
  referenceId?: string
  correlationId?: string
  description?: string
  metadata?: Record<string, any>
}

export interface CreatePairedEntriesParams {
  debitUserId: string
  creditUserId: string
  amountCents: number
  eventSource: EventSource
  referenceId?: string
  description?: string
  metadata?: Record<string, any>
}

// =============================================================================
// PLATFORM CONSTANTS
// =============================================================================

// Platform reserve account ID (special system account)
// TODO: Replace with actual platform account UUID from your auth.users table
export const PLATFORM_RESERVE_ID = '00000000-0000-0000-0000-000000000000'

// =============================================================================
// CORE LEDGER FUNCTIONS
// =============================================================================

/**
 * Create a single ledger entry
 * 
 * @param params - Entry parameters
 * @returns Created ledger entry
 */
export async function createLedgerEntry(
  params: CreateLedgerEntryParams
): Promise<LedgerEntry> {
  const {
    userId,
    amountCents,
    type,
    eventSource,
    referenceId,
    correlationId,
    description,
    metadata = {}
  } = params

  // Validate amount
  if (amountCents <= 0) {
    throw new Error('Amount must be positive')
  }

  // Generate correlation ID if not provided
  const finalCorrelationId = correlationId || crypto.randomUUID()

  // Insert ledger entry
  const { data, error } = await supabase
    .from('ledger_entries')
    .insert({
      user_id: userId,
      amount_cents: amountCents,
      type,
      event_source: eventSource,
      reference_id: referenceId,
      correlation_id: finalCorrelationId,
      description,
      metadata
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create ledger entry:', error)
    throw new Error(`Ledger entry creation failed: ${error.message}`)
  }

  // Log to Passport (non-blocking)
  logEvent('treasury.ledger_entry_created', {
    ledgerEntryId: data.id,
    userId,
    amountCents,
    type,
    eventSource,
    correlationId: finalCorrelationId
  }).catch(err => {
    console.error('Failed to log to Passport:', err)
  })

  return data
}

/**
 * Create paired debit/credit entries (double-entry accounting)
 * 
 * This is the core of the double-entry system. Every financial transaction
 * creates TWO entries: one debit, one credit, linked by correlation_id.
 * 
 * Example: Fan buys $50 ticket
 * - DEBIT fan account: $50
 * - CREDIT platform reserve: $50
 * 
 * @param params - Paired entry parameters
 * @returns Correlation ID linking both entries
 */
export async function createPairedEntries(
  params: CreatePairedEntriesParams
): Promise<string> {
  const {
    debitUserId,
    creditUserId,
    amountCents,
    eventSource,
    referenceId,
    description,
    metadata = {}
  } = params

  // Validate
  if (amountCents <= 0) {
    throw new Error('Amount must be positive')
  }

  if (debitUserId === creditUserId) {
    throw new Error('Debit and credit users must be different')
  }

  // Generate unique correlation ID
  const correlationId = crypto.randomUUID()

  try {
    // Create debit entry
    await createLedgerEntry({
      userId: debitUserId,
      amountCents,
      type: 'debit',
      eventSource,
      referenceId,
      correlationId,
      description: description || `Debit: ${eventSource}`,
      metadata
    })

    // Create credit entry
    await createLedgerEntry({
      userId: creditUserId,
      amountCents,
      type: 'credit',
      eventSource,
      referenceId,
      correlationId,
      description: description || `Credit: ${eventSource}`,
      metadata
    })

    // Log paired transaction to Passport
    await logEvent('treasury.paired_transaction_created', {
      correlationId,
      debitUserId,
      creditUserId,
      amountCents,
      eventSource,
      referenceId
    })

    return correlationId
  } catch (error) {
    console.error('Failed to create paired entries:', error)
    throw new Error(`Paired entry creation failed: ${error}`)
  }
}

// =============================================================================
// BALANCE QUERIES
// =============================================================================

/**
 * Get user's current balance
 * 
 * @param userId - User ID
 * @returns Balance in cents
 */
export async function getUserBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_user_balance', {
    p_user_id: userId
  })

  if (error) {
    console.error('Failed to get user balance:', error)
    return 0
  }

  return data || 0
}

/**
 * Get user's transaction history
 * 
 * @param userId - User ID
 * @param limit - Number of transactions to return
 * @param offset - Pagination offset
 * @returns Array of ledger entries
 */
export async function getUserTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to get user transactions:', error)
    return []
  }

  return data || []
}

/**
 * Get paired transactions by correlation ID
 * 
 * @param correlationId - Correlation ID
 * @returns Array of paired ledger entries (should be 2)
 */
export async function getPairedTransactions(
  correlationId: string
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('correlation_id', correlationId)
    .order('type', { ascending: false }) // Debit first, then credit

  if (error) {
    console.error('Failed to get paired transactions:', error)
    return []
  }

  return data || []
}

// =============================================================================
// VALIDATION & HEALTH CHECKS
// =============================================================================

/**
 * Validate ledger balance (total debits = total credits)
 * 
 * This should ALWAYS return { isBalanced: true, totalImbalance: 0 }
 * If not, there's a critical bug in the ledger system.
 * 
 * @returns Balance validation result
 */
export async function validateLedgerBalance(): Promise<{
  isBalanced: boolean
  totalImbalance: number
}> {
  const { data, error } = await supabase.rpc('validate_ledger_balance')

  if (error) {
    console.error('Failed to validate ledger balance:', error)
    return { isBalanced: false, totalImbalance: -1 }
  }

  return {
    isBalanced: data[0]?.is_balanced || false,
    totalImbalance: data[0]?.total_imbalance || 0
  }
}

/**
 * Get ledger statistics
 * 
 * @returns Aggregate ledger stats
 */
export async function getLedgerStats(): Promise<{
  totalEntries: number
  totalUsers: number
  totalVolumeCents: number
  lastEntryAt: string | null
}> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('id, user_id, amount_cents, created_at')

  if (error || !data) {
    return {
      totalEntries: 0,
      totalUsers: 0,
      totalVolumeCents: 0,
      lastEntryAt: null
    }
  }

  const uniqueUsers = new Set(data.map(entry => entry.user_id))
  const totalVolume = data.reduce((sum, entry) => sum + entry.amount_cents, 0)
  const lastEntry = data.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]

  return {
    totalEntries: data.length,
    totalUsers: uniqueUsers.size,
    totalVolumeCents: totalVolume / 2, // Divide by 2 since every transaction has debit + credit
    lastEntryAt: lastEntry?.created_at || null
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format cents to dollar string
 * 
 * @param cents - Amount in cents
 * @returns Formatted dollar amount (e.g., "$50.00")
 */
export function formatCentsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Parse dollar string to cents
 * 
 * @param dollars - Dollar amount string (e.g., "$50.00" or "50")
 * @returns Amount in cents
 */
export function parseDollarsToCents(dollars: string): number {
  const cleaned = dollars.replace(/[$,]/g, '')
  const amount = parseFloat(cleaned)
  if (isNaN(amount)) {
    throw new Error('Invalid dollar amount')
  }
  return Math.round(amount * 100)
}

// =============================================================================
// EXPORT ALL
// =============================================================================

export default {
  // Core functions
  createLedgerEntry,
  createPairedEntries,
  
  // Balance queries
  getUserBalance,
  getUserTransactions,
  getPairedTransactions,
  
  // Validation
  validateLedgerBalance,
  getLedgerStats,
  
  // Utilities
  formatCentsToDollars,
  parseDollarsToCents,
  
  // Constants
  PLATFORM_RESERVE_ID
}

