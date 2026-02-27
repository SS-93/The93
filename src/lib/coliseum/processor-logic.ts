/**
 * ============================================================================
 * COLISEUM PROCESSOR LOGIC (PORTED FROM BACKEND)
 * ============================================================================
 * 
 * Source: supabase/functions/coliseum-processor/index.ts
 * Purpose: Simulate backend ranking logic for E2E testing
 * 
 * ============================================================================
 */

import { PassportEntry, PassportEventType } from '@/types/passport';
import { DNADomain } from '@/types/dna';

// ============================================================================
// CONFIGURATION (GOLDEN SOURCE)                                            
// ============================================================================

export const EVENT_WEIGHTS: Record<string, number> = {
    // TIER 5: Transformative
    'treasury.subscription_started': 1000,
    'concierto.event_hosted': 1000,
    'treasury.payout_received': 1000,
    'companon.campaign_launched': 1000,

    // TIER 4: High Intent
    'concierto.ticket_purchased': 100,
    'concierto.event_attended': 100,
    'concierto.vote_cast': 100,
    'locker.item_claimed': 100,
    'core.track_uploaded': 100,
    'companon.offer_redeemed': 100,

    // TIER 3: Moderate
    'concierto.event_rsvp': 10,
    'core.artist_followed': 10, // Backend name
    'social.user_followed': 10, // Frontend alias (for E2E)
    'player.track_completed': 10,
    'locker.opened': 10,
    'companon.offer_viewed': 10,

    // TIER 2: Passive
    'player.track_played': 1,
    'core.track_viewed': 1,
    'concierto.event_viewed': 1,
    'companon.campaign_impression': 1,

    // TIER 1: Ambient
    'player.track_skipped': 0.1,
    'core.search_performed': 0.1,
    'navigation.page_viewed': 0.1,
};

const DECAY_CONFIGS: Record<string, { halfLifeDays: number; floor: number }> = {
    'player.track_played': { halfLifeDays: 7, floor: 0.1 },
    'player.track_skipped': { halfLifeDays: 7, floor: 0.1 },
    'concierto.event_viewed': { halfLifeDays: 7, floor: 0.1 },
    'core.artist_followed': { halfLifeDays: 30, floor: 0.3 },
    'social.user_followed': { halfLifeDays: 30, floor: 0.3 },
    'concierto.vote_cast': { halfLifeDays: 30, floor: 0.3 },
    'concierto.ticket_purchased': { halfLifeDays: 90, floor: 0.5 },
    'treasury.subscription_started': { halfLifeDays: 180, floor: 0.7 },
    'concierto.event_attended': { halfLifeDays: 365, floor: 0.8 },
    'core.track_uploaded': { halfLifeDays: 365, floor: 0.9 },
};

export interface DNAMutation {
    passport_entry_id: string;
    user_id: string;
    artist_id?: string;
    domain: DNADomain;
    key: string;
    delta: number;
    weight: number;
    recency_decay: number;
    effective_delta: number;
    occurred_at: string;
}

// ============================================================================
// LOGIC
// ============================================================================

export function getEventWeight(eventType: string): number {
    return EVENT_WEIGHTS[eventType] || 1;
}

export function calculateRecencyDecay(eventTimestamp: Date | string, eventType: string): number {
    const config = DECAY_CONFIGS[eventType] || { halfLifeDays: 30, floor: 0.2 };
    const eventDate = new Date(eventTimestamp);
    const now = new Date();
    const daysSince = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    const halfLives = daysSince / config.halfLifeDays;
    const rawDecay = Math.pow(0.5, halfLives);
    return Math.max(rawDecay, config.floor);
}

function getAdenineMultiplier(eventType: string): number {
    const multipliers: Record<string, number> = {
        'concierto.event_attended': 1.0,
        'concierto.ticket_purchased': 0.8,
        'concierto.vote_cast': 0.5,
        'core.artist_followed': 0.4,
        'social.user_followed': 0.4, // Alias
        'player.track_completed': 0.3,
        'player.track_played': 0.1,
        'player.track_skipped': -0.05,
    };
    return multipliers[eventType] || 0.1;
}

function getThymineMultiplier(eventType: string, metadata: any): number {
    let baseMultiplier = 1.0;

    if (metadata.completion_pct) {
        baseMultiplier *= 1 + (metadata.completion_pct ** 2) * 2;
    }

    const typeMultipliers: Record<string, number> = {
        'concierto.event_attended': 1.0,
        'concierto.vote_cast': 0.8,
        'player.track_completed': 0.6,
        'concierto.ticket_purchased': 0.9,
        'player.track_played': 0.3,
        'social.user_followed': 0.5,
    };

    return baseMultiplier * (typeMultipliers[eventType] || 0.5);
}

function getCytosineMultiplier(eventType: string): number {
    const multipliers: Record<string, number> = {
        'concierto.event_attended': 2.0,
        'concierto.ticket_purchased': 1.5,
        'concierto.event_rsvp': 0.8,
        'concierto.event_viewed': 0.3,
    };
    return multipliers[eventType] || 0.1;
}

export function generateMutations(entry: PassportEntry): DNAMutation[] {
    const mutations: DNAMutation[] = [];
    const baseWeight = getEventWeight(entry.event_type);
    const recencyDecay = calculateRecencyDecay(entry.timestamp || entry.created_at, entry.event_type);
    const metadata = entry.metadata || {};

    // Resolve artist ID (either direct or via track/event)
    const artistId = entry.metadata.artistId || entry.metadata.artist_id;

    if (!artistId) return []; // Can't mutate artist if no ID

    // A-Domain: Cultural
    if (metadata.artist_genres && Array.isArray(metadata.artist_genres)) {
        for (const genre of metadata.artist_genres) {
            const delta = getAdenineMultiplier(entry.event_type);
            mutations.push({
                passport_entry_id: entry.id,
                user_id: entry.user_id,
                artist_id: artistId,
                domain: 'A',
                key: genre,
                delta,
                weight: baseWeight,
                recency_decay: recencyDecay,
                effective_delta: delta * baseWeight * recencyDecay,
                occurred_at: new Date(entry.timestamp || entry.created_at).toISOString(),
            });
        }
    } else {
        // Default A mutation if no genres (fallback)
        const delta = getAdenineMultiplier(entry.event_type);
        mutations.push({
            passport_entry_id: entry.id,
            user_id: entry.user_id,
            artist_id: artistId,
            domain: 'A',
            key: 'general_engagement',
            delta,
            weight: baseWeight,
            recency_decay: recencyDecay,
            effective_delta: delta * baseWeight * recencyDecay,
            occurred_at: new Date(entry.timestamp || entry.created_at).toISOString(),
        });
    }

    // T-Domain: Behavioral
    const tDelta = getThymineMultiplier(entry.event_type, metadata);
    mutations.push({
        passport_entry_id: entry.id,
        user_id: entry.user_id,
        artist_id: artistId,
        domain: 'T',
        key: 'engagement',
        delta: tDelta,
        weight: baseWeight,
        recency_decay: recencyDecay,
        effective_delta: tDelta * baseWeight * recencyDecay,
        occurred_at: new Date(entry.timestamp || entry.created_at).toISOString(),
    });

    // G-Domain: Economic
    if (metadata.amount_cents) {
        const gDelta = (metadata.amount_cents) / 100;
        mutations.push({
            passport_entry_id: entry.id,
            user_id: entry.user_id,
            artist_id: artistId,
            domain: 'G',
            key: 'revenue',
            delta: gDelta,
            weight: baseWeight,
            recency_decay: recencyDecay,
            effective_delta: gDelta * baseWeight * recencyDecay,
            occurred_at: new Date(entry.timestamp || entry.created_at).toISOString(),
        });
    }

    // C-Domain: Geographic
    if (metadata.city) {
        const cDelta = getCytosineMultiplier(entry.event_type);
        mutations.push({
            passport_entry_id: entry.id,
            user_id: entry.user_id,
            artist_id: artistId,
            domain: 'C',
            key: `city:${metadata.city}`,
            delta: cDelta,
            weight: baseWeight,
            recency_decay: recencyDecay,
            effective_delta: cDelta * baseWeight * recencyDecay,
            occurred_at: new Date(entry.timestamp || entry.created_at).toISOString(),
        });
    }

    return mutations;
}
