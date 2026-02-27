/**
 * Payout Scheduler
 * 
 * Manages payout queue and processing:
 * - Scheduled payouts (nightly batch at 2am UTC)
 * - Instant payouts (with risk scoring)
 * - Retry logic for failed payouts
 * 
 * Integrates with Stripe Transfer API
 */

import Stripe from 'stripe'
import { supabase } from '../supabaseClient'
import { getUserBalance } from './ledgerService'
import { logEvent } from '../passport/passportClient'

// =============================================================================
// TYPES
// =============================================================================

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type PayoutType = 'scheduled' | 'instant' | 'manual'

export interface Payout {
  id: string
  user_id: string
  amount_cents: number
  currency: string
  status: PayoutStatus
  payout_type: PayoutType
  risk_score: number
  stripe_transfer_id?: string
  scheduled_for?: string
  initiated_at: string
  completed_at?: string
  failure_code?: string
  failure_message?: string
  metadata?: Record<string, any>
}

export interface QueuePayoutParams {
  userId: string
  amountCents: number
  payoutType?: PayoutType
  scheduledFor?: Date
  referenceIds?: string[]
  metadata?: Record<string, any>
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const MIN_PAYOUT_AMOUNT_CENTS = 2500 // $25 minimum
const INSTANT_PAYOUT_MAX_CENTS = 100000 // $1000 max for instant
const NEW_USER_HOLD_DAYS = 7 // Hold payouts for new users
const RISK_THRESHOLD = 0.7 // Above this, hold for review

// =============================================================================
// PAYOUT QUEUE
// =============================================================================

/**
 * Queue a payout for a user
 * 
 * @param params - Payout parameters
 * @returns Created payout record
 */
export async function queuePayout(params: QueuePayoutParams): Promise<Payout> {
  const {
    userId,
    amountCents,
    payoutType = 'scheduled',
    scheduledFor,
    referenceIds = [],
    metadata = {}
  } = params

  // Validate amount
  if (amountCents < MIN_PAYOUT_AMOUNT_CENTS) {
    throw new Error(`Minimum payout is $${MIN_PAYOUT_AMOUNT_CENTS / 100}`)
  }

  // Check user balance
  const balance = await getUserBalance(userId)
  if (balance < amountCents) {
    throw new Error(`Insufficient balance. Available: $${balance / 100}, requested: $${amountCents / 100}`)
  }

  // Calculate risk score
  const riskScore = await calculateRiskScore(userId, amountCents)

  // Determine scheduled date
  let finalScheduledFor: Date
  if (scheduledFor) {
    finalScheduledFor = scheduledFor
  } else if (payoutType === 'instant') {
    finalScheduledFor = new Date() // Process immediately
  } else {
    // Next nightly batch (2am UTC)
    finalScheduledFor = getNextPayoutBatchTime()
  }

  // Check if payout should be held for review
  const shouldHold = riskScore > RISK_THRESHOLD
  const finalStatus: PayoutStatus = shouldHold ? 'pending' : 'pending'

  // Create payout record
  const { data, error } = await supabase
    .from('payouts')
    .insert({
      user_id: userId,
      amount_cents: amountCents,
      currency: 'USD',
      status: finalStatus,
      payout_type: payoutType,
      risk_score: riskScore,
      scheduled_for: finalScheduledFor.toISOString(),
      metadata: {
        ...metadata,
        referenceIds
      }
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to queue payout: ${error.message}`)
  }

  console.log('[PayoutScheduler] Payout queued:', data.id, `$${amountCents / 100}`)

  // Log to Passport
  await logEvent('treasury.payout_queued', {
    payoutId: data.id,
    userId,
    amountCents,
    payoutType,
    riskScore,
    scheduledFor: finalScheduledFor.toISOString()
  })

  return data
}

/**
 * Get next payout batch time (2am UTC)
 * 
 * @returns Next batch date
 */
function getNextPayoutBatchTime(): Date {
  const now = new Date()
  const next = new Date(now)
  
  // Set to 2am UTC
  next.setUTCHours(2, 0, 0, 0)
  
  // If already past 2am today, schedule for tomorrow
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  
  return next
}

// =============================================================================
// RISK SCORING
// =============================================================================

/**
 * Calculate risk score for payout
 * 
 * Factors:
 * - User age (new users = higher risk)
 * - Payout amount (large amounts = higher risk)
 * - Historical payout success rate
 * - Recent dispute/refund activity
 * 
 * @param userId - User ID
 * @param amountCents - Payout amount
 * @returns Risk score (0-1, higher = riskier)
 */
async function calculateRiskScore(
  userId: string,
  amountCents: number
): Promise<number> {
  let score = 0.0

  // Factor 1: User age
  const { data: user } = await supabase
    .from('auth.users')
    .select('created_at')
    .eq('id', userId)
    .single()

  if (user) {
    const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (accountAgeDays < NEW_USER_HOLD_DAYS) {
      score += 0.5 // New user penalty
    }
  }

  // Factor 2: Amount size
  if (amountCents > 50000) { // > $500
    score += 0.2
  }
  if (amountCents > 100000) { // > $1000
    score += 0.2
  }

  // Factor 3: Historical payout success
  const { data: previousPayouts } = await supabase
    .from('payouts')
    .select('status')
    .eq('user_id', userId)
    .limit(10)

  if (previousPayouts && previousPayouts.length > 0) {
    const failedCount = previousPayouts.filter(p => p.status === 'failed').length
    const failureRate = failedCount / previousPayouts.length
    score += failureRate * 0.3
  } else {
    score += 0.1 // First payout penalty
  }

  // Factor 4: Recent disputes
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const { count: disputeCount } = await supabase
    .from('disputes')
    .select('id', { count: 'exact' })
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (disputeCount && disputeCount > 0) {
    score += Math.min(disputeCount * 0.1, 0.3)
  }

  return Math.min(score, 1.0) // Cap at 1.0
}

// =============================================================================
// PAYOUT PROCESSING
// =============================================================================

/**
 * Process pending payouts (called by nightly batch job)
 * 
 * @returns Number of payouts processed
 */
export async function processPendingPayouts(): Promise<number> {
  console.log('[PayoutScheduler] Processing pending payouts...')

  // Get all payouts ready for processing
  const { data: payouts, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .lt('risk_score', RISK_THRESHOLD) // Only process low-risk
    .order('scheduled_for', { ascending: true })
    .limit(100) // Process in batches

  if (error || !payouts || payouts.length === 0) {
    console.log('[PayoutScheduler] No pending payouts to process')
    return 0
  }

  console.log(`[PayoutScheduler] Found ${payouts.length} payouts to process`)

  let successCount = 0

  for (const payout of payouts) {
    try {
      await processSinglePayout(payout.id)
      successCount++
    } catch (error) {
      console.error(`[PayoutScheduler] Failed to process payout ${payout.id}:`, error)
      // Continue with other payouts
    }
  }

  console.log(`[PayoutScheduler] Processed ${successCount}/${payouts.length} payouts`)

  return successCount
}

/**
 * Process a single payout
 * 
 * @param payoutId - Payout ID
 */
async function processSinglePayout(payoutId: string): Promise<void> {
  console.log('[PayoutScheduler] Processing payout:', payoutId)

  // Get payout details
  const { data: payout, error: fetchError } = await supabase
    .from('payouts')
    .select('*')
    .eq('id', payoutId)
    .single()

  if (fetchError || !payout) {
    throw new Error(`Payout not found: ${payoutId}`)
  }

  // Update status to processing
  await supabase
    .from('payouts')
    .update({ 
      status: 'processing',
      processing_started_at: new Date().toISOString()
    })
    .eq('id', payoutId)

  try {
    // Get user's Stripe Connect account
    const { data: stripeAccount } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, payouts_enabled')
      .eq('id', payout.user_id)
      .single()

    if (!stripeAccount || !stripeAccount.payouts_enabled) {
      throw new Error('User Stripe account not ready for payouts')
    }

    // Create Stripe transfer
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-10-29.clover' as any
    })

    const transfer = await stripe.transfers.create({
      amount: payout.amount_cents,
      currency: payout.currency.toLowerCase(),
      destination: stripeAccount.stripe_account_id,
      description: `Payout from Buckets`,
      metadata: {
        payoutId: payoutId,
        userId: payout.user_id
      }
    })

    console.log('[PayoutScheduler] Stripe transfer created:', transfer.id)

    // Update payout record
    await supabase
      .from('payouts')
      .update({
        status: 'completed',
        stripe_transfer_id: transfer.id,
        completed_at: new Date().toISOString()
      })
      .eq('id', payoutId)

    // Log to Passport
    await logEvent('treasury.payout_completed', {
      payoutId,
      userId: payout.user_id,
      amountCents: payout.amount_cents,
      stripeTransferId: transfer.id
    })

    console.log('[PayoutScheduler] Payout completed:', payoutId)

  } catch (error: any) {
    console.error('[PayoutScheduler] Payout failed:', error)

    // Update payout with failure info
    await supabase
      .from('payouts')
      .update({
        status: 'failed',
        failure_code: error.code || 'unknown_error',
        failure_message: error.message
      })
      .eq('id', payoutId)

    // Log to Passport
    await logEvent('treasury.payout_failed', {
      payoutId,
      userId: payout.user_id,
      error: error.message
    })

    throw error
  }
}

// =============================================================================
// USER-FACING FUNCTIONS
// =============================================================================

/**
 * Get user's payout history
 * 
 * @param userId - User ID
 * @param limit - Number of results
 * @returns Array of payouts
 */
export async function getUserPayouts(
  userId: string,
  limit: number = 50
): Promise<Payout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', userId)
    .order('initiated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get user payouts:', error)
    return []
  }

  return data || []
}

/**
 * Get pending payout total for user
 * 
 * @param userId - User ID
 * @returns Total pending amount in cents
 */
export async function getPendingPayoutAmount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('payouts')
    .select('amount_cents')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])

  if (error || !data) {
    return 0
  }

  return data.reduce((sum, payout) => sum + payout.amount_cents, 0)
}

/**
 * Request instant payout
 * 
 * @param userId - User ID
 * @param amountCents - Amount to payout
 * @returns Created payout
 */
export async function requestInstantPayout(
  userId: string,
  amountCents: number
): Promise<Payout> {
  // Validate instant payout limits
  if (amountCents > INSTANT_PAYOUT_MAX_CENTS) {
    throw new Error(`Instant payouts limited to $${INSTANT_PAYOUT_MAX_CENTS / 100}`)
  }

  return queuePayout({
    userId,
    amountCents,
    payoutType: 'instant',
    scheduledFor: new Date(), // Process immediately
    metadata: {
      requestedInstant: true
    }
  })
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  queuePayout,
  processPendingPayouts,
  getUserPayouts,
  getPendingPayoutAmount,
  requestInstantPayout,
  
  // Constants
  MIN_PAYOUT_AMOUNT_CENTS,
  INSTANT_PAYOUT_MAX_CENTS
}

