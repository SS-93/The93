/**
 * =============================================================================
 * PASSPORT EVENT SCHEMA - Canonical Event Contracts
 * =============================================================================
 *
 * Part of: Buckets V2 Trinity → Passport System (#0)
 * Purpose: Type-safe event definitions for all trackable actions
 *
 * ARCHITECTURE PHILOSOPHY (Segment/Amplitude Pattern):
 * 1. Single source of truth for event types
 * 2. Strong typing prevents bad data at compile time
 * 3. Flat structure for easy querying (no deep nesting)
 * 4. Extensible via discriminated unions
 *
 * INTEGRATION FLOW:
 * Client/Server → trackEvent() → Passport → Processor → Coliseum
 *
 * USAGE:
 * ```typescript
 * import { trackEvent } from '@/hooks/usePassport'
 *
 * trackEvent({
 *   type: 'concierto.event_attended',
 *   userId: user.id,
 *   eventId: event.id,
 *   // ... rest of payload
 * })
 * ```
 * =============================================================================
 */

// =============================================================================
// CORE EVENT TYPES (V2 Living Index Alignment)
// =============================================================================

/**
 * Master list of all trackable event types
 * Organized by system domain for clarity
 */
export type PassportEventType =
  // Concierto: Event Management (#7)
  | 'concierto.event_created'
  | 'concierto.event_viewed'
  | 'concierto.event_attended'        // ✅ CORE METRIC #1
  | 'concierto.event_rsvp'
  | 'concierto.ticket_scanned'

  // Treasury: Payments & Revenue (#2)
  | 'treasury.money_spent'            // ✅ CORE METRIC #2
  | 'treasury.money_earned'           // ✅ CORE METRIC #3
  | 'treasury.purchase_completed'
  | 'treasury.purchase_refunded'
  | 'treasury.payout_completed'
  | 'treasury.subscription_started'
  | 'treasury.subscription_canceled'

  // Coliseum: Voting & Engagement (#3)
  | 'coliseum.vote_cast'              // ✅ CORE METRIC #4
  | 'coliseum.score_submitted'
  | 'coliseum.feedback_submitted'

  // Player: Audio Playback (#6)
  | 'player.track_played'
  | 'player.track_completed'
  | 'player.track_skipped'
  | 'player.track_favorited'
  | 'player.playlist_created'

  // CALS: Sharing & Attribution (#5)
  | 'cals.link_shared'
  | 'cals.link_opened'
  | 'cals.attribution_credited'

  // Locker: Brand Engagement (#8)
  | 'locker.item_unlocked'
  | 'locker.content_viewed'
  | 'locker.reward_claimed'

  // MediaID: User Profiles (#1)
  | 'mediaid.profile_created'
  | 'mediaid.profile_viewed'
  | 'mediaid.dna_generated'

  // Social: Engagement
  | 'social.follow'
  | 'social.like'
  | 'social.comment'
  | 'social.share'

  // Discovery
  | 'discovery.search'
  | 'discovery.artist_discovered'
  | 'discovery.recommendation_clicked'

// =============================================================================
// CANONICAL EVENT PAYLOADS (Discriminated Union)
// =============================================================================

/**
 * Base fields present in ALL events
 */
interface BaseEventPayload {
  userId: string;                     // Who performed the action
  at: string;                         // ISO timestamp (UTC)
  sessionId?: string;                 // Client session ID (for behavior tracking)
  source?: 'web' | 'ios' | 'android' | 'api' | 'system' | 'admin';
}

/**
 * Complete event payload union
 * TypeScript enforces correct fields per event type
 */
export type PassportEventPayload =
  // ═══════════════════════════════════════════════════════════════
  // CORE METRIC #1: EVENT ATTENDANCE
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'concierto.event_attended';
    eventId: string;
    ticketId?: string;
    method: 'scan' | 'manual' | 'check_in_kiosk';
    city: string;                     // ✅ REQUIRED for C-domain
    venue?: string;
    ticketTier?: string;
    artistId: string;                 // ✅ REQUIRED for attribution
  })

  // ═══════════════════════════════════════════════════════════════
  // CORE METRIC #2: MONEY SPENT
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'treasury.money_spent';
    amountCents: number;              // ✅ REQUIRED for G-domain
    currency: 'usd';
    reason: 'ticket' | 'tip' | 'subscription' | 'merchandise' | 'other';
    eventId?: string;
    artistId: string;                 // ✅ REQUIRED for attribution
    stripePaymentIntentId: string;
    purchaseId?: string;
  })

  // ═══════════════════════════════════════════════════════════════
  // CORE METRIC #3: MONEY EARNED
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'treasury.money_earned';
    amountCents: number;
    currency: 'usd';
    role: 'artist' | 'host' | 'platform' | 'referrer';
    source: 'ticket' | 'tip' | 'subscription' | 'split' | 'attribution';
    eventId?: string;
    artistId?: string;
    stripeTransferId?: string;
    payoutId?: string;
  })

  // ═══════════════════════════════════════════════════════════════
  // CORE METRIC #4: VOTES CAST
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'coliseum.vote_cast';
    artistId: string;                 // ✅ REQUIRED for attribution
    eventId: string;
    weight: number;
    channel: 'sms' | 'web' | 'kiosk' | 'app';
    voteId?: string;
  })

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL TREASURY EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'treasury.purchase_completed';
    purchaseId: string;
    amountCents: number;
    productType: 'ticket' | 'subscription' | 'tip' | 'merchandise';
    stripeCheckoutSessionId: string;
  })
  | (BaseEventPayload & {
    type: 'treasury.payout_completed';
    payoutId: string;
    amountCents: number;
    recipientId: string;
    stripeTransferId: string;
  })
  | (BaseEventPayload & {
    type: 'treasury.subscription_started';
    subscriptionId: string;
    artistId: string;
    planType: string;
    amountCents: number;
  })

  // ═══════════════════════════════════════════════════════════════
  // CONCIERTO EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'concierto.event_created';
    eventId: string;
    hostId: string;
    city: string;
    eventDate: string;
  })
  | (BaseEventPayload & {
    type: 'concierto.event_viewed';
    eventId: string;
    referrer?: string;
  })
  | (BaseEventPayload & {
    type: 'concierto.event_rsvp';
    eventId: string;
    rsvpType: 'interested' | 'going';
  })
  | (BaseEventPayload & {
    type: 'concierto.ticket_scanned';
    eventId: string;
    ticketId: string;
    scannerId: string;
  })

  // ═══════════════════════════════════════════════════════════════
  // COLISEUM EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'coliseum.score_submitted';
    artistId: string;
    eventId: string;
    scoreValue: number;
    categories?: Record<string, number>;
  })
  | (BaseEventPayload & {
    type: 'coliseum.feedback_submitted';
    artistId: string;
    eventId: string;
    feedbackText: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
  })

  // ═══════════════════════════════════════════════════════════════
  // PLAYER EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'player.track_played';
    trackId: string;
    artistId: string;                 // ✅ REQUIRED for attribution
    genres: string[];                 // ✅ REQUIRED for A-domain
    durationSeconds?: number;
    position?: number;
  })
  | (BaseEventPayload & {
    type: 'player.track_completed';
    trackId: string;
    artistId: string;
    durationSeconds: number;
    completionRate: number;
  })
  | (BaseEventPayload & {
    type: 'player.track_skipped';
    trackId: string;
    artistId: string;
    secondsPlayed: number;
  })
  | (BaseEventPayload & {
    type: 'player.track_favorited';
    trackId: string;
    artistId: string;
  })

  // ═══════════════════════════════════════════════════════════════
  // CALS EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'cals.link_shared';
    linkId: string;
    targetType: 'event' | 'artist' | 'track';
    targetId: string;
    channel: 'sms' | 'email' | 'social' | 'copy';
  })
  | (BaseEventPayload & {
    type: 'cals.link_opened';
    linkId: string;
    senderId: string;
    targetType: string;
    targetId: string;
  })
  | (BaseEventPayload & {
    type: 'cals.attribution_credited';
    linkId: string;
    referrerId: string;
    beneficiaryId: string;
    amountCents: number;
    eventType: 'ticket_purchase' | 'subscription';
  })

  // ═══════════════════════════════════════════════════════════════
  // LOCKER EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'locker.item_unlocked';
    lockerId: string;
    brandId: string;
    itemType: string;
    unlockMethod: 'code' | 'purchase' | 'reward';
  })
  | (BaseEventPayload & {
    type: 'locker.content_viewed';
    lockerId: string;
    contentId: string;
    brandId: string;
  })

  // ═══════════════════════════════════════════════════════════════
  // MEDIAID EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'mediaid.profile_created';
    mediaIdType: 'fan' | 'artist' | 'brand';
  })
  | (BaseEventPayload & {
    type: 'mediaid.profile_viewed';
    profileId: string;
    profileType: 'artist' | 'user';
  })
  | (BaseEventPayload & {
    type: 'mediaid.dna_generated';
    dnaVersion: string;
    domains: string[];
  })

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'social.follow';
    targetId: string;
    targetType: 'artist' | 'user';
  })
  | (BaseEventPayload & {
    type: 'social.like';
    targetId: string;
    targetType: 'track' | 'event' | 'post';
  })
  | (BaseEventPayload & {
    type: 'social.share';
    targetId: string;
    targetType: 'track' | 'event' | 'artist';
    platform: 'twitter' | 'facebook' | 'instagram' | 'copy';
  })

  // ═══════════════════════════════════════════════════════════════
  // DISCOVERY EVENTS
  // ═══════════════════════════════════════════════════════════════
  | (BaseEventPayload & {
    type: 'discovery.search';
    query: string;
    resultsCount: number;
  })
  | (BaseEventPayload & {
    type: 'discovery.artist_discovered';
    artistId: string;
    discoveryMethod: 'search' | 'recommendation' | 'event' | 'social';
  })
  | (BaseEventPayload & {
    type: 'discovery.recommendation_clicked';
    targetId: string;
    targetType: 'artist' | 'track' | 'event';
    algorithm: string;
    position: number;
  });

// =============================================================================
// TYPE GUARDS & HELPERS
// =============================================================================

/**
 * Type guard to check if an event is a core metric
 */
export function isCoreMetric(eventType: PassportEventType): boolean {
  return [
    'concierto.event_attended',
    'treasury.money_spent',
    'treasury.money_earned',
    'coliseum.vote_cast'
  ].includes(eventType);
}

/**
 * Get event category from event type
 */
export function getEventCategory(eventType: PassportEventType): string {
  return eventType.split('.')[0];
}

/**
 * Validate event payload structure
 */
export function validateEventPayload(payload: any): payload is PassportEventPayload {
  if (!payload || typeof payload !== 'object') return false;
  if (!payload.type || !payload.userId || !payload.at) return false;
  return true;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  BaseEventPayload
};
