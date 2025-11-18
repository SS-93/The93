/**
 * Revenue Split Engine
 * 
 * Automatically calculates and applies revenue splits based on:
 * - User-defined rules (hosts can configure)
 * - Platform defaults (70% artist, 20% platform, 10% host)
 * - Entity-specific overrides (event-level customization)
 * 
 * Creates ledger entries for each split and queues payouts.
 */

import { supabase } from '../supabaseClient'
import { createPairedEntries, PLATFORM_RESERVE_ID } from './ledgerService'
import { queuePayout } from './payoutScheduler'
import { logEvent } from '../passport/passportClient'

// =============================================================================
// TYPES
// =============================================================================

export type EntityType = 'event' | 'subscription' | 'drop' | 'tip' | 'default'

export interface SplitRule {
  id: string
  owner_id: string
  name: string
  entity_type: EntityType
  entity_id?: string
  rules: SplitRecipient[]
  is_default: boolean
  is_active: boolean
}

export interface SplitRecipient {
  recipient_id?: string  // User ID (if known)
  role: 'artist' | 'host' | 'platform' | 'promoter'
  percent: number
}

export interface ApplySplitsParams {
  purchaseId: string
  amountCents: number
  entityType: EntityType
  entityId?: string
}

// =============================================================================
// PLATFORM DEFAULTS
// =============================================================================

const DEFAULT_EVENT_SPLITS: SplitRecipient[] = [
  { role: 'artist', percent: 70 },
  { role: 'platform', percent: 20 },
  { role: 'host', percent: 10 }
]

const DEFAULT_SUBSCRIPTION_SPLITS: SplitRecipient[] = [
  { role: 'artist', percent: 85 },
  { role: 'platform', percent: 15 }
]

const DEFAULT_TIP_SPLITS: SplitRecipient[] = [
  { role: 'artist', percent: 95 },
  { role: 'platform', percent: 5 }
]

// =============================================================================
// SPLIT RULE LOOKUP
// =============================================================================

/**
 * Get split rules for an entity
 * 
 * Priority:
 * 1. Entity-specific rules (if entityId provided)
 * 2. Entity-type default rules
 * 3. Platform defaults (hardcoded)
 * 
 * @param entityType - Type of entity
 * @param entityId - Specific entity ID (optional)
 * @returns Split rules
 */
export async function getSplitRules(
  entityType: EntityType,
  entityId?: string
): Promise<SplitRecipient[]> {
  // Try entity-specific rules first
  if (entityId) {
    const { data: specificRules } = await supabase
      .from('split_rules')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .maybeSingle()

    if (specificRules) {
      console.log('[SplitEngine] Using entity-specific rules:', entityId)
      return specificRules.rules as SplitRecipient[]
    }
  }

  // Try entity-type default rules
  const { data: defaultRules } = await supabase
    .from('split_rules')
    .select('*')
    .eq('entity_type', entityType)
    .eq('is_default', true)
    .eq('is_active', true)
    .maybeSingle()

  if (defaultRules) {
    console.log('[SplitEngine] Using entity-type default rules:', entityType)
    return defaultRules.rules as SplitRecipient[]
  }

  // Fall back to hardcoded platform defaults
  console.log('[SplitEngine] Using platform defaults for:', entityType)
  
  switch (entityType) {
    case 'event':
      return DEFAULT_EVENT_SPLITS
    case 'subscription':
      return DEFAULT_SUBSCRIPTION_SPLITS
    case 'tip':
      return DEFAULT_TIP_SPLITS
    default:
      return DEFAULT_EVENT_SPLITS
  }
}

// =============================================================================
// RECIPIENT RESOLUTION
// =============================================================================

/**
 * Resolve recipient user IDs from roles
 * 
 * For event tickets:
 * - artist: get from event.artist_id
 * - host: get from event.host_id
 * - platform: use PLATFORM_RESERVE_ID
 * 
 * @param rules - Split rules with roles
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @returns Rules with resolved recipient_id values
 */
async function resolveRecipients(
  rules: SplitRecipient[],
  entityType: EntityType,
  entityId?: string
): Promise<SplitRecipient[]> {
  const resolved: SplitRecipient[] = []

  for (const rule of rules) {
    let recipientId = rule.recipient_id

    // Resolve based on role
    if (!recipientId) {
      if (rule.role === 'platform') {
        recipientId = PLATFORM_RESERVE_ID
      } else if (entityType === 'event' && entityId) {
        // Get artist/host from event
        const { data: event } = await supabase
          .from('events')
          .select('artist_id, host_id, created_by')
          .eq('id', entityId)
          .single()

        if (event) {
          if (rule.role === 'artist') {
            recipientId = event.artist_id || event.created_by
          } else if (rule.role === 'host') {
            recipientId = event.host_id || event.created_by
          }
        }
      }
    }

    if (!recipientId) {
      console.warn('[SplitEngine] Could not resolve recipient for role:', rule.role)
      continue
    }

    resolved.push({
      ...rule,
      recipient_id: recipientId
    })
  }

  return resolved
}

// =============================================================================
// SPLIT CALCULATION
// =============================================================================

/**
 * Calculate split amounts
 * 
 * @param totalAmountCents - Total amount to split
 * @param rules - Split rules with percentages
 * @returns Array of { recipientId, role, amountCents }
 */
function calculateSplits(
  totalAmountCents: number,
  rules: SplitRecipient[]
): Array<{ recipientId: string; role: string; amountCents: number }> {
  const splits: Array<{ recipientId: string; role: string; amountCents: number }> = []
  
  let remaining = totalAmountCents
  
  // Calculate each split
  for (const rule of rules) {
    if (!rule.recipient_id) continue
    
    const amountCents = Math.floor((totalAmountCents * rule.percent) / 100)
    
    splits.push({
      recipientId: rule.recipient_id,
      role: rule.role,
      amountCents
    })
    
    remaining -= amountCents
  }
  
  // Add any remaining cents to platform (rounding errors)
  if (remaining > 0) {
    const platformSplit = splits.find(s => s.role === 'platform')
    if (platformSplit) {
      platformSplit.amountCents += remaining
    }
  }
  
  return splits
}

// =============================================================================
// APPLY SPLITS
// =============================================================================

/**
 * Apply revenue splits for a purchase
 * 
 * Creates ledger entries for each split and queues payouts
 * 
 * Flow:
 * 1. Get split rules
 * 2. Resolve recipient IDs
 * 3. Calculate split amounts
 * 4. Create ledger entries (debit platform, credit recipients)
 * 5. Queue payouts for each recipient
 * 
 * @param params - Split parameters
 */
export async function applySplits(params: ApplySplitsParams): Promise<void> {
  const { purchaseId, amountCents, entityType, entityId } = params

  console.log('[SplitEngine] Applying splits for purchase:', purchaseId)

  // 1. Get split rules
  const rules = await getSplitRules(entityType, entityId)

  if (rules.length === 0) {
    console.warn('[SplitEngine] No split rules found, skipping')
    return
  }

  // 2. Resolve recipient IDs
  const resolvedRules = await resolveRecipients(rules, entityType, entityId)

  if (resolvedRules.length === 0) {
    console.warn('[SplitEngine] No recipients resolved, skipping')
    return
  }

  // 3. Calculate split amounts
  const splits = calculateSplits(amountCents, resolvedRules)

  console.log('[SplitEngine] Calculated splits:', splits)

  // 4. Create ledger entries for each split
  for (const split of splits) {
    if (split.role === 'platform') {
      // Platform keeps this amount (no ledger entry needed, already credited)
      continue
    }

    try {
      // Debit platform reserve, credit recipient
      const correlationId = await createPairedEntries({
        debitUserId: PLATFORM_RESERVE_ID,
        creditUserId: split.recipientId,
        amountCents: split.amountCents,
        eventSource: 'split',
        referenceId: purchaseId,
        description: `Split: ${split.role} (${Math.floor((split.amountCents / amountCents) * 100)}%)`,
        metadata: {
          purchaseId,
          role: split.role,
          entityType,
          entityId
        }
      })

      console.log('[SplitEngine] Split applied:', split.role, correlationId)

      // 5. Queue payout for recipient (not platform)
      await queuePayout({
        userId: split.recipientId,
        amountCents: split.amountCents,
        referenceIds: [purchaseId],
        metadata: {
          source: 'split',
          role: split.role,
          entityType,
          entityId
        }
      })

    } catch (error) {
      console.error('[SplitEngine] Failed to apply split:', split.role, error)
      // Continue with other splits even if one fails
    }
  }

  // Log to Passport
  await logEvent('treasury.splits_applied', {
    purchaseId,
    amountCents,
    entityType,
    entityId,
    splitCount: splits.length,
    splits: splits.map(s => ({
      role: s.role,
      amountCents: s.amountCents,
      percent: Math.floor((s.amountCents / amountCents) * 100)
    }))
  })

  console.log('[SplitEngine] Splits applied successfully for purchase:', purchaseId)
}

// =============================================================================
// SPLIT RULE MANAGEMENT (Admin/Host Tools)
// =============================================================================

/**
 * Create custom split rule
 * 
 * @param params - Split rule parameters
 * @returns Created split rule
 */
export async function createSplitRule(params: {
  ownerId: string
  name: string
  entityType: EntityType
  entityId?: string
  rules: SplitRecipient[]
  isDefault?: boolean
}): Promise<SplitRule> {
  // Validate percentages add up to 100
  const totalPercent = params.rules.reduce((sum, rule) => sum + rule.percent, 0)
  
  if (totalPercent !== 100) {
    throw new Error(`Split percentages must add up to 100% (currently ${totalPercent}%)`)
  }

  const { data, error } = await supabase
    .from('split_rules')
    .insert({
      owner_id: params.ownerId,
      name: params.name,
      entity_type: params.entityType,
      entity_id: params.entityId,
      rules: params.rules,
      is_default: params.isDefault || false,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create split rule: ${error.message}`)
  }

  await logEvent('treasury.split_rule_created', {
    ruleId: data.id,
    ownerId: params.ownerId,
    entityType: params.entityType
  })

  return data
}

/**
 * Get user's split rules
 * 
 * @param userId - User ID
 * @returns Array of split rules
 */
export async function getUserSplitRules(userId: string): Promise<SplitRule[]> {
  const { data, error } = await supabase
    .from('split_rules')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get user split rules:', error)
    return []
  }

  return data || []
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  getSplitRules,
  applySplits,
  createSplitRule,
  getUserSplitRules,
  
  // Constants
  DEFAULT_EVENT_SPLITS,
  DEFAULT_SUBSCRIPTION_SPLITS,
  DEFAULT_TIP_SPLITS
}

