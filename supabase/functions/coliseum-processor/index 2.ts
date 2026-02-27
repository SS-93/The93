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
  artist_id: string;
  user_id: string;
  event_type: string;
  a_delta: number;
  t_delta: number;
  g_delta: number;
  c_delta: number;
  metadata: Record<string, any>;
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

    case 'social.follow':
      // Cultural affinity signal
      return 5.0;

    case 'coliseum.vote_cast':
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

    case 'social.follow':
      // Conversion event (casual → fan)
      return 10.0;

    case 'concierto.event_attended':
      // Strong loyalty signal (IRL engagement)
      return 15.0;

    case 'treasury.money_spent':
      // Ultimate conversion signal
      return 20.0;

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
    case 'treasury.money_spent':
      // Direct revenue signal (scaled by amount)
      const amountCents = metadata.amountCents || 0;
      return amountCents / 100; // Convert cents to dollars as points

    case 'treasury.revenue_split_applied':
      // Net revenue signal (artist's actual take)
      const netCents = metadata.amountCents || 0;
      return netCents / 100;

    case 'concierto.event_attended':
      // Potential monetization (attended event)
      return 5.0;

    case 'social.follow':
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
 * Process a single Passport event into DNA mutation
 */
function processEvent(event: PassportEvent): DNAMutation | null {
  const { metadata } = event;

  // Extract artist_id from metadata
  const artist_id = metadata.artistId || metadata.targetId;

  if (!artist_id) {
    console.warn(`Event ${event.id} missing artistId, skipping`);
    return null;
  }

  // Calculate deltas for all 4 domains
  const a_delta = calculateADelta(event);
  const t_delta = calculateTDelta(event);
  const g_delta = calculateGDelta(event);
  const c_delta = calculateCDelta(event);

  // Only create mutation if at least one domain is affected
  if (a_delta === 0 && t_delta === 0 && g_delta === 0 && c_delta === 0) {
    console.log(`Event ${event.id} has no DNA impact, skipping`);
    return null;
  }

  return {
    artist_id,
    user_id: event.user_id,
    event_type: event.event_type,
    a_delta,
    t_delta,
    g_delta,
    c_delta,
    metadata: {
      passport_event_id: event.id,
      original_metadata: metadata,
    },
  };
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
      const mutation = processEvent(event);
      if (mutation) {
        mutations.push(mutation);
      }
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
        .select('a_delta, t_delta, g_delta, c_delta')
        .eq('artist_id', artistId);

      if (aggError) {
        console.error(`Failed to aggregate for artist ${artistId}: ${aggError.message}`);
        continue;
      }

      if (!aggregates || aggregates.length === 0) {
        continue;
      }

      // Sum all deltas
      const a_strength = aggregates.reduce((sum, m) => sum + m.a_delta, 0);
      const t_strength = aggregates.reduce((sum, m) => sum + m.t_delta, 0);
      const g_strength = aggregates.reduce((sum, m) => sum + m.g_delta, 0);
      const c_strength = aggregates.reduce((sum, m) => sum + m.c_delta, 0);

      // Upsert into domain_strength table
      const { error: upsertError } = await supabase
        .from('coliseum_domain_strength')
        .upsert(
          {
            artist_id: artistId,
            a_strength,
            t_strength,
            g_strength,
            c_strength,
            last_mutation_at: now,
          },
          { onConflict: 'artist_id' }
        );

      if (upsertError) {
        console.error(`Failed to upsert strength for artist ${artistId}: ${upsertError.message}`);
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
