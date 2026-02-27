/**
 * ============================================================================
 * MOCK DATA GENERATOR - Passport Entries for Coliseum E2E Testing
 * ============================================================================
 * Purpose: Generate realistic Passport events for testing Coliseum DNA analytics
 * Strategy: Create diverse event mix across all 4 domains (A/T/G/C)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { TEST_USERS, getTestArtists, getTestListeners } from './test-users';
import type { PassportEventType } from '../../src/types/passport';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

interface PassportEventData {
    user_id: string;
    session_id: string;
    event_type: PassportEventType;
    event_category: 'trinity' | 'interaction' | 'transaction' | 'access' | 'social' | 'system';
    metadata: Record<string, any>;
    entity_type?: string;
    entity_id?: string;
}

// ============================================================================
// EVENT GENERATORS
// ============================================================================

/**
 * Generate A-Domain events (Cultural Identity)
 * - player.track_played
 * - player.track_completed
 * - player.track_favorited
 */
export function generateADomainEvents(
    listenerId: string,
    artistId: string,
    genres: string[],
    count: number = 10
): PassportEventData[] {
    const events: PassportEventData[] = [];
    const sessionId = uuidv4();

    for (let i = 0; i < count; i++) {
        // Track played
        events.push({
            user_id: listenerId,
            session_id: sessionId,
            event_type: 'player.track_played',
            event_category: 'interaction',
            metadata: {
                trackId: `track-${artistId}-${i}`,
                artistId,
                genres,
                durationSeconds: 180 + Math.random() * 120,
                source: 'player_page',
            },
        });

        // 70% completion rate
        if (Math.random() > 0.3) {
            events.push({
                user_id: listenerId,
                session_id: sessionId,
                event_type: 'player.track_completed',
                event_category: 'interaction',
                metadata: {
                    trackId: `track-${artistId}-${i}`,
                    artistId,
                    genres,
                    completionRate: 0.95 + Math.random() * 0.05,
                },
            });
        }

        // 20% favorite rate
        if (Math.random() > 0.8) {
            events.push({
                user_id: listenerId,
                session_id: sessionId,
                event_type: 'player.track_favorited',
                event_category: 'interaction',
                metadata: {
                    trackId: `track-${artistId}-${i}`,
                    artistId,
                },
            });
        }
    }

    return events;
}

/**
 * Generate T-Domain events (Behavioral Patterns)
 * - social.follow
 * - social.like
 * - social.comment
 */
export function generateTDomainEvents(
    userId: string,
    artistId: string,
    count: number = 5
): PassportEventData[] {
    const events: PassportEventData[] = [];
    const sessionId = uuidv4();

    // Follow artist (high weight for T-domain)
    events.push({
        user_id: userId,
        session_id: sessionId,
        event_type: 'social.user_followed',
        event_category: 'social',
        metadata: {
            targetId: artistId,
            targetType: 'artist',
        },
    });

    // Likes
    for (let i = 0; i < count; i++) {
        events.push({
            user_id: userId,
            session_id: sessionId,
            event_type: 'social.content_liked',
            event_category: 'social',
            metadata: {
                targetId: `track-${artistId}-${i}`,
                targetType: 'track',
                artistId,
            },
        });
    }

    return events;
}

/**
 * Generate G-Domain events (Economic Signals)
 * - treasury.money_spent
 * - treasury.subscription_started
 */
export function generateGDomainEvents(
    userId: string,
    artistId: string,
    count: number = 3
): PassportEventData[] {
    const events: PassportEventData[] = [];
    const sessionId = uuidv4();

    // Ticket purchases
    for (let i = 0; i < count; i++) {
        const amountCents = 2500 + Math.floor(Math.random() * 5000); // $25-$75
        events.push({
            user_id: userId,
            session_id: sessionId,
            event_type: 'treasury.transaction_created',
            event_category: 'transaction',
            metadata: {
                artistId,
                amountCents,
                reason: 'ticket',
                eventId: `event-${artistId}-${i}`,
            },
        });
    }

    // Subscription (50% chance)
    if (Math.random() > 0.5) {
        events.push({
            user_id: userId,
            session_id: sessionId,
            event_type: 'treasury.subscription_started',
            event_category: 'transaction',
            metadata: {
                artistId,
                tier: 'basic',
                amountCents: 999, // $9.99/month
            },
        });
    }

    return events;
}

/**
 * Generate C-Domain events (Spatial Geography)
 * - concierto.event_attended
 * - concierto.event_rsvp
 */
export function generateCDomainEvents(
    userId: string,
    artistId: string,
    city: string,
    count: number = 2
): PassportEventData[] {
    const events: PassportEventData[] = [];
    const sessionId = uuidv4();

    for (let i = 0; i < count; i++) {
        const eventId = `event-${artistId}-${i}`;

        // RSVP
        events.push({
            user_id: userId,
            session_id: sessionId,
            event_type: 'concierto.event_rsvp',
            event_category: 'interaction',
            metadata: {
                eventId,
                artistId,
                city,
                rsvpType: 'going',
            },
        });

        // Attendance (80% show-up rate)
        if (Math.random() > 0.2) {
            events.push({
                user_id: userId,
                session_id: sessionId,
                event_type: 'concierto.event_attended',
                event_category: 'interaction',
                metadata: {
                    eventId,
                    artistId,
                    city,
                    method: 'scan',
                    ticketId: `ticket-${userId}-${eventId}`,
                },
            });
        }
    }

    return events;
}

/**
 * Generate Coliseum voting events
 * - coliseum.vote_cast
 */
export function generateVotingEvents(
    userId: string,
    artistId: string,
    eventId: string,
    count: number = 1
): PassportEventData[] {
    const events: PassportEventData[] = [];
    const sessionId = uuidv4();

    for (let i = 0; i < count; i++) {
        events.push({
            user_id: userId,
            session_id: sessionId,
            event_type: 'concierto.vote_cast',
            event_category: 'interaction',
            metadata: {
                artistId,
                eventId,
                weight: 1,
                channel: 'web',
            },
        });
    }

    return events;
}

// ============================================================================
// COMPREHENSIVE DATA GENERATOR
// ============================================================================

/**
 * Generate complete mock dataset for Coliseum testing
 * Creates realistic event mix for all test users and artists
 */
export async function generateColiseumMockData(
    supabaseUrl: string,
    supabaseServiceKey: string
): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎭 Generating Coliseum mock data...\n');

    const artists = getTestArtists();
    const listeners = getTestListeners();
    const allEvents: PassportEventData[] = [];

    // For each artist, generate events from multiple listeners
    for (const artist of artists) {
        console.log(`📊 Generating events for ${artist.displayName}...`);

        for (const listener of listeners) {
            // A-Domain: Track plays (Cultural)
            const aDomainEvents = generateADomainEvents(
                listener.id,
                artist.artistId!,
                artist.genres!,
                5 + Math.floor(Math.random() * 10) // 5-15 plays
            );
            allEvents.push(...aDomainEvents);

            // T-Domain: Social interactions (Behavioral)
            const tDomainEvents = generateTDomainEvents(
                listener.id,
                artist.artistId!,
                3 + Math.floor(Math.random() * 5) // 3-8 interactions
            );
            allEvents.push(...tDomainEvents);

            // G-Domain: Economic (50% of listeners spend money)
            if (Math.random() > 0.5) {
                const gDomainEvents = generateGDomainEvents(
                    listener.id,
                    artist.artistId!,
                    1 + Math.floor(Math.random() * 3) // 1-4 purchases
                );
                allEvents.push(...gDomainEvents);
            }

            // C-Domain: Geographic (30% attend events)
            if (Math.random() > 0.7 && artist.location) {
                const cDomainEvents = generateCDomainEvents(
                    listener.id,
                    artist.artistId!,
                    artist.location,
                    1 + Math.floor(Math.random() * 2) // 1-3 events
                );
                allEvents.push(...cDomainEvents);
            }

            // Voting (20% of listeners vote)
            if (Math.random() > 0.8) {
                const votingEvents = generateVotingEvents(
                    listener.id,
                    artist.artistId!,
                    `event-${artist.artistId}-1`
                );
                allEvents.push(...votingEvents);
            }
        }

        console.log(`  ✅ Generated ${allEvents.length} events so far`);
    }

    console.log(`\n📝 Total events generated: ${allEvents.length}`);
    console.log('💾 Inserting into passport_entries...\n');

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < allEvents.length; i += batchSize) {
        const batch = allEvents.slice(i, i + batchSize);
        const { error } = await supabase
            .from('passport_entries')
            .insert(batch);

        if (error) {
            console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
            throw error;
        }

        console.log(`  ✅ Inserted batch ${i / batchSize + 1} (${batch.length} events)`);
    }

    console.log('\n✅ Mock data generation complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Artists: ${artists.length}`);
    console.log(`   - Listeners: ${listeners.length}`);
    console.log(`   - Total Events: ${allEvents.length}`);
    console.log(`   - A-Domain (Cultural): ${allEvents.filter(e => e.event_type.startsWith('player')).length}`);
    console.log(`   - T-Domain (Behavioral): ${allEvents.filter(e => e.event_type.startsWith('social')).length}`);
    console.log(`   - G-Domain (Economic): ${allEvents.filter(e => e.event_type.startsWith('treasury')).length}`);
    console.log(`   - C-Domain (Geographic): ${allEvents.filter(e => e.event_type.startsWith('concierto')).length}`);
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
    generateADomainEvents,
    generateTDomainEvents,
    generateGDomainEvents,
    generateCDomainEvents,
    generateVotingEvents,
    generateColiseumMockData,
};
