/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe webhook events with:
 * - Signature verification (security)
 * - Idempotency (prevent duplicate processing)
 * - Advisory locks (prevent race conditions)
 * - Passport logging (audit trail)
 * 
 * MVP Critical Path: checkout.session.completed → Ledger entries
 */

import Stripe from 'stripe'
import { supabase } from '../supabaseClient'
import { createPairedEntries, PLATFORM_RESERVE_ID } from './ledgerService'
import { applySplits } from './splitEngine'
import { queuePayout } from './payoutScheduler'
import { logEvent } from '../passport/passportClient'

// =============================================================================
// TYPES
// =============================================================================

export type WebhookEventType =
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'transfer.created'
  | 'transfer.failed'
  | 'account.updated'

export interface WebhookContext {
  eventId: string
  eventType: WebhookEventType
  payload: Stripe.Event
  processedAt: Date
}

// =============================================================================
// WEBHOOK VERIFICATION
// =============================================================================

/**
 * Verify Stripe webhook signature
 * 
 * CRITICAL: This prevents malicious webhook spoofing
 * Always call this before processing any webhook
 * 
 * @param payload - Raw webhook body
 * @param signature - Stripe-Signature header
 * @param secret - Webhook secret from Stripe dashboard
 * @returns Verified Stripe event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16'
  })

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret)
    return event
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    throw new Error(`Webhook signature verification failed: ${err.message}`)
  }
}

// =============================================================================
// IDEMPOTENCY & LOGGING
// =============================================================================

/**
 * Check if webhook has already been processed (idempotency)
 * 
 * @param stripeEventId - Stripe event ID
 * @returns True if already processed
 */
async function isWebhookProcessed(stripeEventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('stripe_webhook_log')
    .select('id')
    .eq('stripe_event_id', stripeEventId)
    .eq('status', 'processed')
    .maybeSingle()

  if (error) {
    console.error('Failed to check webhook status:', error)
    return false
  }

  return !!data
}

/**
 * Log webhook event
 * 
 * @param event - Stripe event
 * @param status - Processing status
 * @param errorMessage - Error message if failed
 */
async function logWebhookEvent(
  event: Stripe.Event,
  status: 'processing' | 'processed' | 'failed' | 'skipped',
  errorMessage?: string
): Promise<void> {
  await supabase.from('stripe_webhook_log').upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    api_version: event.api_version,
    status,
    payload: event,
    error_message: errorMessage,
    processed_at: new Date().toISOString()
  })

  // Also log to Passport
  await logEvent('treasury.webhook_received', {
    stripeEventId: event.id,
    eventType: event.type,
    status
  })
}

// =============================================================================
// WEBHOOK HANDLERS (Event-Specific Logic)
// =============================================================================

/**
 * Handle checkout.session.completed
 * 
 * This is THE GOLDEN PATH for ticket purchases
 * 
 * Flow:
 * 1. Create purchase record
 * 2. Create double-entry ledger entries
 * 3. Apply revenue splits
 * 4. Queue payouts
 * 5. Fulfill purchase (issue ticket, unlock content, etc.)
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log('[Webhook] Processing checkout.session.completed:', session.id)

  // Extract metadata
  const metadata = session.metadata || {}
  const userId = metadata.userId || session.client_reference_id
  const productType = metadata.productType || 'ticket'
  const productId = metadata.productId
  const eventId = metadata.eventId

  if (!userId) {
    throw new Error('Missing userId in checkout session metadata')
  }

  // 1. Create purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      product_type: productType,
      product_id: productId,
      amount_cents: session.amount_total || 0,
      currency: session.currency?.toUpperCase() || 'USD',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      status: 'completed',
      fulfillment_status: 'pending',
      metadata: metadata,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (purchaseError || !purchase) {
    throw new Error(`Failed to create purchase record: ${purchaseError?.message}`)
  }

  console.log('[Webhook] Purchase created:', purchase.id)

  // 2. Create double-entry ledger entries
  const correlationId = await createPairedEntries({
    debitUserId: userId,
    creditUserId: PLATFORM_RESERVE_ID,
    amountCents: session.amount_total || 0,
    eventSource: 'stripe_charge',
    referenceId: purchase.id,
    description: `Purchase: ${productType}`,
    metadata: {
      stripeSessionId: session.id,
      productType,
      productId
    }
  })

  console.log('[Webhook] Ledger entries created:', correlationId)

  // 3. Apply revenue splits (if applicable)
  if (productType === 'ticket' && eventId) {
    try {
      await applySplits({
        purchaseId: purchase.id,
        amountCents: session.amount_total || 0,
        entityType: 'event',
        entityId: eventId
      })
      console.log('[Webhook] Splits applied for event:', eventId)
    } catch (err) {
      console.error('[Webhook] Failed to apply splits:', err)
      // Don't fail entire webhook - splits can be retried
    }
  }

  // 4. Fulfillment: Issue ticket, unlock content, etc.
  if (productType === 'ticket' && eventId) {
    await fulfillTicketPurchase(purchase.id, userId, eventId, metadata)
  }

  // 5. Update purchase fulfillment status
  await supabase
    .from('purchases')
    .update({ fulfillment_status: 'fulfilled' })
    .eq('id', purchase.id)

  console.log('[Webhook] Checkout completed successfully:', purchase.id)

  // Log to Passport
  await logEvent('treasury.purchase_completed', {
    purchaseId: purchase.id,
    userId,
    amountCents: session.amount_total,
    productType,
    productId
  })
}

/**
 * Handle payment_intent.succeeded
 * 
 * For custom payment flows (tips, pledges with custom amounts)
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log('[Webhook] Processing payment_intent.succeeded:', paymentIntent.id)

  const metadata = paymentIntent.metadata || {}
  const userId = metadata.userId
  const productType = metadata.productType || 'tip'

  if (!userId) {
    console.warn('[Webhook] Skipping payment_intent - no userId in metadata')
    return
  }

  // Similar flow to checkout completion
  // (Simplified for now)
  
  await logEvent('treasury.payment_intent_succeeded', {
    paymentIntentId: paymentIntent.id,
    userId,
    amountCents: paymentIntent.amount,
    productType
  })
}

/**
 * Handle charge.refunded
 * 
 * Create ledger reversal entries
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log('[Webhook] Processing charge.refunded:', charge.id)

  // Find original purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*')
    .eq('stripe_charge_id', charge.id)
    .maybeSingle()

  if (!purchase) {
    console.warn('[Webhook] No purchase found for charge:', charge.id)
    return
  }

  // Create refund record
  const refundAmount = charge.amount_refunded

  const { data: refund } = await supabase
    .from('refunds')
    .insert({
      purchase_id: purchase.id,
      stripe_refund_id: charge.refunds?.data[0]?.id || `refund_${charge.id}`,
      amount_cents: refundAmount,
      currency: charge.currency.toUpperCase(),
      reason: 'Stripe refund',
      status: 'succeeded'
    })
    .select()
    .single()

  // Create reversal ledger entries
  const correlationId = await createPairedEntries({
    debitUserId: PLATFORM_RESERVE_ID,
    creditUserId: purchase.user_id,
    amountCents: refundAmount,
    eventSource: 'refund',
    referenceId: refund.id,
    description: `Refund: ${purchase.product_type}`,
    metadata: {
      originalPurchaseId: purchase.id,
      stripeChargeId: charge.id
    }
  })

  // Update purchase status
  await supabase
    .from('purchases')
    .update({ 
      status: 'refunded',
      refunded_at: new Date().toISOString()
    })
    .eq('id', purchase.id)

  console.log('[Webhook] Refund processed:', correlationId)

  await logEvent('treasury.refund_processed', {
    refundId: refund.id,
    purchaseId: purchase.id,
    amountCents: refundAmount
  })
}

// =============================================================================
// FULFILLMENT FUNCTIONS
// =============================================================================

/**
 * Fulfill ticket purchase
 * 
 * @param purchaseId - Purchase ID
 * @param userId - User ID
 * @param eventId - Event ID
 * @param metadata - Additional metadata
 */
async function fulfillTicketPurchase(
  purchaseId: string,
  userId: string,
  eventId: string,
  metadata: Record<string, any>
): Promise<void> {
  const tier = metadata.tier || 'general'
  
  // Generate unique ticket code
  const ticketCode = await generateTicketCode()

  // Create ticket record
  const { data: ticket, error } = await supabase
    .from('event_tickets')
    .insert({
      event_id: eventId,
      purchase_id: purchaseId,
      attendee_id: userId,
      ticket_tier: tier,
      ticket_code: ticketCode,
      ticket_metadata: metadata
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create ticket: ${error.message}`)
  }

  console.log('[Fulfillment] Ticket created:', ticket.id, ticketCode)

  // Log to Passport
  await logEvent('concierto.ticket_issued', {
    ticketId: ticket.id,
    eventId,
    attendeeId: userId,
    tier,
    purchaseId
  })
}

/**
 * Generate unique ticket code
 * 
 * @returns Ticket code (e.g., "TKT-A1B2C3D4E5")
 */
async function generateTicketCode(): Promise<string> {
  const { data } = await supabase.rpc('generate_ticket_code')
  return data || `TKT-${Date.now()}`
}

// =============================================================================
// MAIN WEBHOOK ROUTER
// =============================================================================

/**
 * Process webhook event
 * 
 * Main entry point for all Stripe webhooks
 * Handles routing, idempotency, error handling
 * 
 * @param event - Verified Stripe event
 */
export async function processWebhook(event: Stripe.Event): Promise<void> {
  const eventId = event.id
  const eventType = event.type as WebhookEventType

  console.log(`[Webhook] Received: ${eventType} (${eventId})`)

  // Check idempotency
  if (await isWebhookProcessed(eventId)) {
    console.log('[Webhook] Already processed, skipping:', eventId)
    await logWebhookEvent(event, 'skipped')
    return
  }

  // Log as processing
  await logWebhookEvent(event, 'processing')

  try {
    // Route to appropriate handler
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      // Add more handlers as needed
      case 'charge.dispute.created':
      case 'customer.subscription.updated':
      case 'transfer.created':
        console.log(`[Webhook] Handler not implemented yet: ${eventType}`)
        break

      default:
        console.log(`[Webhook] Unknown event type: ${eventType}`)
    }

    // Mark as processed
    await logWebhookEvent(event, 'processed')
    console.log('[Webhook] Successfully processed:', eventId)

  } catch (error: any) {
    console.error('[Webhook] Processing failed:', error)
    await logWebhookEvent(event, 'failed', error.message)
    throw error
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  verifyWebhookSignature,
  processWebhook
}

