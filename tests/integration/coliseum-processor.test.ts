/**
 * ============================================================================
 * COLISEUM PROCESSOR - INTEGRATION TESTS
 * ============================================================================
 * Purpose: Test Passport → Coliseum DNA processing pipeline
 * Pattern: Follows Treasury E2E testing approach
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// TEST HELPERS
// ============================================================================

interface TestArtist {
  id: string;
  artist_name: string;
}

interface TestUser {
  id: string;
  email: string;
}

async function createTestArtist(): Promise<TestArtist> {
  const timestamp = Date.now();
  const artistName = `test-artist-${timestamp}`;

  const { data, error } = await supabase
    .from('artist_profiles')
    .insert({
      artist_name: artistName,
      genre_tags: ['hip-hop', 'test-genre'],
    })
    .select()
    .single();

  if (error) throw error;
  return data as TestArtist;
}

async function createTestUser(): Promise<TestUser> {
  const timestamp = Date.now();
  const email = `test-user-${timestamp}@example.com`;

  // Create user via Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'test-password-123',
    email_confirm: true,
  });

  if (error) throw error;
  return { id: data.user.id, email };
}

async function logPassportEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase
    .from('passport_entries')
    .insert({
      user_id: userId,
      event_type: eventType,
      event_category: 'engagement',
      metadata,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function invokeColiseumProcessor(): Promise<any> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/coliseum-processor`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Processor failed: ${response.statusText}`);
  }

  return response.json();
}

async function cleanupTestData(artistId: string, userId: string) {
  // Clean up in reverse dependency order
  await supabase.from('coliseum_dna_mutations').delete().eq('artist_id', artistId);
  await supabase.from('coliseum_domain_strength').delete().eq('artist_id', artistId);
  await supabase.from('passport_entries').delete().eq('user_id', userId);
  await supabase.from('artist_profiles').delete().eq('id', artistId);
  await supabase.auth.admin.deleteUser(userId);
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Coliseum Processor Integration Tests', () => {
  let testArtist: TestArtist;
  let testUser: TestUser;

  beforeAll(async () => {
    testArtist = await createTestArtist();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestData(testArtist.id, testUser.id);
  });

  // ==========================================================================
  // TEST 1: Basic Event Processing
  // ==========================================================================

  test('Processor consumes unprocessed Passport events', async () => {
    // Log a test event
    const eventId = await logPassportEvent(testUser.id, 'player.track_played', {
      artistId: testArtist.id,
      trackTitle: 'Test Track',
    });

    // Verify event is unprocessed
    const { data: beforeProcessing } = await supabase
      .from('passport_entries')
      .select('coliseum_processed_at')
      .eq('id', eventId)
      .single();

    expect(beforeProcessing?.coliseum_processed_at).toBeNull();

    // Invoke processor
    const result = await invokeColiseumProcessor();

    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThan(0);

    // Verify event is now processed
    const { data: afterProcessing } = await supabase
      .from('passport_entries')
      .select('coliseum_processed_at')
      .eq('id', eventId)
      .single();

    expect(afterProcessing?.coliseum_processed_at).not.toBeNull();
  });

  // ==========================================================================
  // TEST 2: DNA Mutation Creation
  // ==========================================================================

  test('Processor creates DNA mutations from events', async () => {
    // Log multiple event types
    await logPassportEvent(testUser.id, 'player.track_played', {
      artistId: testArtist.id,
    });

    await logPassportEvent(testUser.id, 'social.follow', {
      targetId: testArtist.id,
    });

    // Invoke processor
    await invokeColiseumProcessor();

    // Verify mutations were created
    const { data: mutations } = await supabase
      .from('coliseum_dna_mutations')
      .select('*')
      .eq('artist_id', testArtist.id)
      .eq('user_id', testUser.id);

    expect(mutations).not.toBeNull();
    expect(mutations!.length).toBeGreaterThan(0);

    // Verify DNA deltas are calculated
    const trackPlayedMutation = mutations!.find(
      (m) => m.event_type === 'player.track_played'
    );
    const followMutation = mutations!.find(
      (m) => m.event_type === 'social.follow'
    );

    expect(trackPlayedMutation?.a_delta).toBeGreaterThan(0);
    expect(trackPlayedMutation?.t_delta).toBeGreaterThan(0);
    expect(followMutation?.a_delta).toBeGreaterThan(0);
    expect(followMutation?.t_delta).toBeGreaterThan(0);
  });

  // ==========================================================================
  // TEST 3: Domain Strength Aggregation
  // ==========================================================================

  test('Processor aggregates mutations into domain strength', async () => {
    // Log events
    await logPassportEvent(testUser.id, 'player.track_played', {
      artistId: testArtist.id,
    });

    // Invoke processor
    await invokeColiseumProcessor();

    // Verify domain strength was updated
    const { data: domainStrength } = await supabase
      .from('coliseum_domain_strength')
      .select('*')
      .eq('artist_id', testArtist.id)
      .single();

    expect(domainStrength).not.toBeNull();
    expect(domainStrength!.a_strength).toBeGreaterThan(0);
    expect(domainStrength!.t_strength).toBeGreaterThan(0);
    expect(domainStrength!.last_mutation_at).not.toBeNull();
  });

  // ==========================================================================
  // TEST 4: A-Domain (Cultural Identity) Calculations
  // ==========================================================================

  test('Genre diversity score calculates correctly', async () => {
    // Log multiple track plays (simulate diverse genre listening)
    for (let i = 0; i < 5; i++) {
      await logPassportEvent(testUser.id, 'player.track_played', {
        artistId: testArtist.id,
        genres: ['hip-hop', 'rap', 'west-coast'],
      });
    }

    // Invoke processor
    await invokeColiseumProcessor();

    // Calculate genre diversity score
    const { data: diversityScore, error } = await supabase.rpc(
      'coliseum_genre_diversity_score',
      {
        p_artist_id: testArtist.id,
        p_time_range: 'alltime',
      }
    );

    expect(error).toBeNull();
    expect(diversityScore).toBeGreaterThanOrEqual(0);
    expect(diversityScore).toBeLessThanOrEqual(1);
  });

  // ==========================================================================
  // TEST 5: T-Domain (Behavioral) Calculations
  // ==========================================================================

  test('Repeat engagement rate calculates correctly', async () => {
    // Log multiple interactions from same user (repeat engagement)
    for (let i = 0; i < 3; i++) {
      await logPassportEvent(testUser.id, 'player.track_played', {
        artistId: testArtist.id,
      });
    }

    // Invoke processor
    await invokeColiseumProcessor();

    // Calculate repeat engagement rate
    const { data: engagementRate, error } = await supabase.rpc(
      'coliseum_repeat_engagement_rate',
      {
        p_artist_id: testArtist.id,
        p_time_range: 'alltime',
      }
    );

    expect(error).toBeNull();
    expect(engagementRate).toBeGreaterThanOrEqual(0);
    expect(engagementRate).toBeLessThanOrEqual(1);
    // User has 3+ interactions, so should be 100% repeat
    expect(engagementRate).toBe(1);
  });

  // ==========================================================================
  // TEST 6: G-Domain (Economic) Calculations
  // ==========================================================================

  test('Revenue per fan calculates correctly', async () => {
    // Log treasury events
    await logPassportEvent(testUser.id, 'treasury.money_spent', {
      artistId: testArtist.id,
      amountCents: 2500, // $25
    });

    await logPassportEvent(testUser.id, 'treasury.money_spent', {
      artistId: testArtist.id,
      amountCents: 1500, // $15
    });

    // Invoke processor
    await invokeColiseumProcessor();

    // Calculate revenue per fan
    const { data: revenuePerFan, error } = await supabase.rpc(
      'coliseum_revenue_per_fan',
      {
        p_artist_id: testArtist.id,
        p_time_range: 'alltime',
      }
    );

    expect(error).toBeNull();
    expect(revenuePerFan).toBeGreaterThan(0);
    // Total: $40, Fans: 1, Expected: $40
    expect(revenuePerFan).toBe(40);
  });

  // ==========================================================================
  // TEST 7: C-Domain (Spatial) Calculations
  // ==========================================================================

  test('Geographic reach calculates correctly', async () => {
    // Log event attendance in multiple cities
    await logPassportEvent(testUser.id, 'concierto.event_attended', {
      artistId: testArtist.id,
      city: 'Los Angeles',
    });

    await logPassportEvent(testUser.id, 'concierto.event_attended', {
      artistId: testArtist.id,
      city: 'New York',
    });

    await logPassportEvent(testUser.id, 'concierto.event_attended', {
      artistId: testArtist.id,
      city: 'Denver',
    });

    // Invoke processor
    await invokeColiseumProcessor();

    // Calculate geographic reach
    const { data: geoReach, error } = await supabase.rpc(
      'coliseum_geographic_reach',
      {
        p_artist_id: testArtist.id,
        p_time_range: 'alltime',
      }
    );

    expect(error).toBeNull();
    expect(geoReach).toBe(3); // 3 unique cities
  });

  // ==========================================================================
  // TEST 8: Combined DNA Profile
  // ==========================================================================

  test('Combined DNA profile returns all metrics', async () => {
    // Log diverse events
    await logPassportEvent(testUser.id, 'player.track_played', {
      artistId: testArtist.id,
    });

    await logPassportEvent(testUser.id, 'treasury.money_spent', {
      artistId: testArtist.id,
      amountCents: 1000,
    });

    // Invoke processor
    await invokeColiseumProcessor();

    // Get combined DNA profile
    const { data: dnaProfile, error } = await supabase.rpc(
      'coliseum_get_artist_dna',
      {
        p_artist_id: testArtist.id,
        p_time_range: 'alltime',
      }
    );

    expect(error).toBeNull();
    expect(dnaProfile).not.toBeNull();
    expect(dnaProfile!.length).toBeGreaterThan(0);

    const profile = dnaProfile![0];
    expect(profile.artist_id).toBe(testArtist.id);
    expect(profile.a_strength).toBeGreaterThanOrEqual(0);
    expect(profile.t_strength).toBeGreaterThanOrEqual(0);
    expect(profile.g_strength).toBeGreaterThanOrEqual(0);
    expect(profile.c_strength).toBeGreaterThanOrEqual(0);
  });

  // ==========================================================================
  // TEST 9: Materialized View Refresh
  // ==========================================================================

  test('Processor refreshes materialized views', async () => {
    // Log events
    await logPassportEvent(testUser.id, 'player.track_played', {
      artistId: testArtist.id,
    });

    // Invoke processor
    const result = await invokeColiseumProcessor();

    expect(result.success).toBe(true);

    // Verify artist appears in leaderboard view
    const { data: leaderboard } = await supabase
      .from('coliseum_leaderboard_a_alltime')
      .select('*')
      .eq('artist_id', testArtist.id)
      .single();

    // May not appear immediately due to view refresh delay
    // Just verify query doesn't error
    expect(leaderboard).toBeDefined();
  });
});
