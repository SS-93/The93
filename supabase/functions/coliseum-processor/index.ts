// ============================================================================
// COLISEUM DNA PROCESSOR - Edge Function
// ============================================================================
// Purpose: Process Passport events → Calculate DNA mutations → Update leaderboards
// Trigger: Cron schedule OR manual invocation
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

interface PassportEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_category: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface DNAMutation {
  passport_entry_id: string;
  user_id: string;
  artist_id: string;
  domain: string; // 'A', 'T', 'G', or 'C'
  key: string;
  delta: number;
  weight: number;
  recency_decay: number;
  effective_delta: number;
  occurred_at: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 100; // Process 100 events per invocation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================================
// DNA CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate A-domain (Cultural Identity) delta from event
 * Based on: Genre diversity, crossover potential, cultural influence
 */
function calculateADelta(event: PassportEvent): number {
  const { event_type, metadata } = event;

  switch (event_type) {
    case 'player.track_played':
      // Base points for engagement with artist's culture
      return 1.0;

    case 'player.track_completed':
      // Higher reward for full engagement
      return 2.0;

    case 'social.user_followed':  // ✅ Fixed: was 'social.follow'
      // Cultural affinity signal
      return 5.0;

    case 'concierto.vote_cast':  // ✅ Fixed: was 'coliseum.vote_cast'
      // Community cultural validation
      return 3.0;

    default:
      return 0;
  }
}

/**
 * Calculate T-domain (Behavioral Patterns) delta from event
 * Based on: Loyalty, repeat engagement, fan conversion, churn
 */
function calculateTDelta(event: PassportEvent): number {
  const { event_type, metadata } = event;

  switch (event_type) {
    case 'player.track_played':
      // Base behavioral signal
      return 1.0;

    case 'player.track_completed':
      // Completion = stronger engagement
      return 2.5;

    case 'social.user_followed':  // ✅ Fixed: was 'social.follow'
      // Conversion event (casual → fan)
      return 10.0;

    case 'concierto.event_attended':
      // Strong loyalty signal (IRL engagement)
      return 15.0;

    case 'treasury.transaction_created':  // ✅ Fixed: was 'treasury.money_spent'
      // Ultimate conversion signal (check for spend type)
      const amountCents = metadata.amount_cents || metadata.amountCents || 0;
      return amountCents > 0 ? 20.0 : 0;

    default:
      return 0;
  }
}

/**
 * Calculate G-domain (Economic Signals) delta from event
 * Based on: Revenue per fan, monetization rate, lifetime value
 */
function calculateGDelta(event: PassportEvent): number {
  const { event_type, metadata } = event;

  switch (event_type) {
    case 'treasury.transaction_created':  // ✅ Fixed: was 'treasury.money_spent'
      // Direct revenue signal (scaled by amount)
      const amountCents = metadata.amount_cents || metadata.amountCents || 0;
      return amountCents / 100; // Convert cents to dollars as points

    case 'treasury.payout_completed':  // ✅ Added: artist receiving money
      // Net revenue signal (artist's actual take)
      const payoutCents = metadata.amount_cents || metadata.amountCents || 0;
      return payoutCents / 100;

    case 'concierto.event_attended':
      // Potential monetization (attended event)
      return 5.0;

    case 'social.user_followed':  // ✅ Fixed: was 'social.follow'
      // Future monetization potential
      return 1.0;

    default:
      return 0;
  }
}

/**
 * Calculate C-domain (Spatial Geography) delta from event
 * Based on: Geographic reach, touring viability, market penetration
 */
function calculateCDelta(event: PassportEvent): number {
  const { event_type, metadata } = event;

  switch (event_type) {
    case 'concierto.event_attended':
      // Direct geographic signal (city data required)
      const hasCity = metadata.city && metadata.city.length > 0;
      return hasCity ? 10.0 : 0;

    case 'player.track_played':
      // Passive geographic signal (if we add IP geolocation later)
      return 0.5;

    case 'treasury.money_spent':
      // Economic geography signal
      return 2.0;

    default:
      return 0;
  }
}

/**
 * Process a single Passport event into DNA mutations (one per domain)
 */
function processEvent(event: PassportEvent): DNAMutation[] {
  const { metadata } = event;

  // Extract artist_id from metadata
  const artist_id = metadata.artistId || metadata.targetId;

  if (!artist_id) {
    console.warn(`Event ${event.id} missing artistId, skipping`);
    return [];
  }

  // Calculate deltas for all 4 domains
  const deltas = {
    A: calculateADelta(event),
    T: calculateTDelta(event),
    G: calculateGDelta(event),
    C: calculateCDelta(event),
  };

  const mutations: DNAMutation[] = [];
  const weight = 1.0;
  const recency_decay = 1.0;

  // Create one mutation per domain (if delta > 0)
  for (const [domain, delta] of Object.entries(deltas)) {
    if (delta > 0) {
      mutations.push({
        passport_entry_id: event.id,
        user_id: event.user_id,
        artist_id,
        domain,
        key: event.event_type, // Use event type as key
        delta,
        weight,
        recency_decay,
        effective_delta: delta * weight * recency_decay,
        occurred_at: event.created_at,
      });
    }
  }

  if (mutations.length === 0) {
    console.log(`Event ${event.id} has no DNA impact, skipping`);
  }

  return mutations;
}

// ============================================================================
// MAIN PROCESSOR
// ============================================================================

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('🏛️ Coliseum Processor: Starting batch...');

    // ========================================================================
    // STEP 1: Fetch unprocessed Passport events
    // ========================================================================

    const { data: events, error: fetchError } = await supabase
      .from('passport_entries')
      .select('*')
      .is('coliseum_processed_at', null)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      console.log('✅ No unprocessed events found');
      return new Response(
        JSON.stringify({ message: 'No events to process', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📥 Found ${events.length} unprocessed events`);

    // ========================================================================
    // STEP 2: Process events into DNA mutations
    // ========================================================================

    const mutations: DNAMutation[] = [];

    for (const event of events) {
      const eventMutations = processEvent(event);
      mutations.push(...eventMutations);
    }

    console.log(`🧬 Generated ${mutations.length} DNA mutations`);

    // ========================================================================
    // STEP 3: Insert DNA mutations
    // ========================================================================

    if (mutations.length > 0) {
      const { error: insertError } = await supabase
        .from('coliseum_dna_mutations')
        .insert(mutations);

      if (insertError) {
        throw new Error(`Failed to insert mutations: ${insertError.message}`);
      }

      console.log(`✅ Inserted ${mutations.length} mutations`);
    }

    // ========================================================================
    // STEP 4: Mark events as processed
    // ========================================================================

    const eventIds = events.map((e) => e.id);
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('passport_entries')
      .update({ coliseum_processed_at: now })
      .in('id', eventIds);

    if (updateError) {
      throw new Error(`Failed to mark events as processed: ${updateError.message}`);
    }

    console.log(`✅ Marked ${eventIds.length} events as processed`);

    // ========================================================================
    // STEP 5: Aggregate mutations into domain strength
    // ========================================================================

    // Get unique artist IDs from this batch
    const artistIds = [...new Set(mutations.map((m) => m.artist_id))];

    console.log(`📊 Aggregating strength for ${artistIds.length} artists...`);

    for (const artistId of artistIds) {
      // Calculate total strength for each domain
      const { data: aggregates, error: aggError } = await supabase
        .from('coliseum_dna_mutations')
        .select('domain, effective_delta')
        .eq('artist_id', artistId);

      if (aggError) {
        console.error(`Failed to aggregate for artist ${artistId}: ${aggError.message}`);
        continue;
      }

      if (!aggregates || aggregates.length === 0) {
        continue;
      }

      // Sum effective deltas by domain
      const domainTotals = {
        A: 0,
        T: 0,
        G: 0,
        C: 0,
      };

      for (const mutation of aggregates) {
        const domain = mutation.domain as 'A' | 'T' | 'G' | 'C';
        domainTotals[domain] += mutation.effective_delta || 0;
      }

      // Upsert into domain_strength table for each time range
      const timeRanges = ['7d', '30d', 'alltime'];

      for (const timeRange of timeRanges) {
        const { error: upsertError } = await supabase
          .from('coliseum_domain_strength')
          .upsert(
            {
              entity_id: artistId,
              entity_type: 'artist',
              time_range: timeRange,
              a_strength: domainTotals.A,
              t_strength: domainTotals.T,
              g_strength: domainTotals.G,
              c_strength: domainTotals.C,
            },
            { onConflict: 'entity_id,entity_type,time_range' }
          );

        if (upsertError) {
          console.error(`Failed to upsert ${timeRange} strength for artist ${artistId}: ${upsertError.message}`);
        }
      }
    }

    console.log(`✅ Updated domain strength for ${artistIds.length} artists`);

    // ========================================================================
    // STEP 6: Refresh materialized views
    // ========================================================================

    console.log('🔄 Refreshing materialized views...');

    const views = [
      'coliseum_leaderboard_a_7d',
      'coliseum_leaderboard_a_30d',
      'coliseum_leaderboard_a_alltime',
      'coliseum_leaderboard_t_7d',
      'coliseum_leaderboard_t_30d',
      'coliseum_leaderboard_t_alltime',
      'coliseum_leaderboard_g_7d',
      'coliseum_leaderboard_g_30d',
      'coliseum_leaderboard_g_alltime',
      'coliseum_leaderboard_c_7d',
      'coliseum_leaderboard_c_30d',
      'coliseum_leaderboard_c_alltime',
    ];

    for (const view of views) {
      const { error: refreshError } = await supabase.rpc('refresh_materialized_view', {
        view_name: view,
      });

      if (refreshError) {
        console.error(`Failed to refresh ${view}: ${refreshError.message}`);
      }
    }

    console.log('✅ Materialized views refreshed');

    // ========================================================================
    // RESPONSE
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        processed: events.length,
        mutations: mutations.length,
        artists_updated: artistIds.length,
        timestamp: now,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Processor error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// END OF COLISEUM PROCESSOR
// ============================================================================
