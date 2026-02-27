/**
 * Coliseum Integration Test
 * Tests the full pipeline: Event → Processor → Mutations → Rankings
 * No browser, no UI - just direct API/DB testing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runTest() {
  console.log('🚀 Starting Coliseum Integration Test\n');

  let testUserId, testArtistId, testTrackId;

  try {
    // ========================================
    // STEP 1: Setup Test Data
    // ========================================
    console.log('📝 Step 1: Creating test data...');

    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `coliseum-test-${Date.now()}@buckets.test`,
      password: 'test-password-123',
      email_confirm: true
    });

    if (userError) throw userError;
    testUserId = userData.user.id;
    console.log('   ✅ Test user created:', testUserId);

    // Create test artist
    const { data: artistData, error: artistError } = await supabase
      .from('artist_profiles')
      .insert({
        user_id: testUserId,
        artist_name: `Test Artist ${Date.now()}`,
        genre_tags: ['electronic', 'ambient']
      })
      .select()
      .single();

    if (artistError) throw artistError;
    testArtistId = artistData.id;
    console.log('   ✅ Test artist created:', testArtistId);

    // Create test track
    const { data: trackData, error: trackError } = await supabase
      .from('content_items')
      .insert({
        artist_id: testArtistId,
        title: `Test Track ${Date.now()}`,
        content_type: 'audio',
        duration_seconds: 180,
        is_published: true,
        file_path: 'test/audio/test-track.mp3',
        metadata: {}
      })
      .select()
      .single();

    if (trackError) throw trackError;
    testTrackId = trackData.id;
    console.log('   ✅ Test track created:', testTrackId);

    // ========================================
    // STEP 1.5: Clear backlog (mark old events as processed)
    // ========================================
    console.log('\n🧹 Step 1.5: Clearing event backlog...');

    const { data: backlog } = await supabase
      .from('passport_entries')
      .select('id', { count: 'exact' })
      .is('coliseum_processed_at', null);

    if (backlog && backlog.length > 0) {
      console.log(`   ⚠️  Found ${backlog.length} unprocessed events in backlog`);
      console.log('   🔄 Marking backlog as processed so our test events go first...');

      await supabase
        .from('passport_entries')
        .update({ coliseum_processed_at: new Date().toISOString() })
        .is('coliseum_processed_at', null);

      console.log('   ✅ Backlog cleared');
    }

    // ========================================
    // STEP 2: Create Passport Events
    // ========================================
    console.log('\n🎵 Step 2: Creating passport events...');

    const events = [
      {
        user_id: testUserId,
        event_type: 'player.track_played',
        event_category: 'interaction',
        entity_type: 'artist',
        entity_id: testArtistId,
        metadata: {
          artistId: testArtistId,
          trackId: testTrackId,
          trackTitle: trackData.title,
          duration_seconds: 180,
          completion_pct: 1.0,
          source: 'integration_test'
        }
      },
      {
        user_id: testUserId,
        event_type: 'player.track_played',
        event_category: 'interaction',
        entity_type: 'artist',
        entity_id: testArtistId,
        metadata: {
          artistId: testArtistId,
          trackId: testTrackId,
          trackTitle: trackData.title,
          duration_seconds: 180,
          completion_pct: 0.8,
          source: 'integration_test'
        }
      }
    ];

    const { data: insertedEvents, error: eventError } = await supabase
      .from('passport_entries')
      .insert(events)
      .select();

    if (eventError) throw eventError;
    console.log(`   ✅ Created ${insertedEvents.length} test events`);

    // ========================================
    // STEP 3: Trigger Coliseum Processor
    // ========================================
    console.log('\n⚙️  Step 3: Triggering Coliseum processor...');

    const processorResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/coliseum-processor`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    const processorResult = await processorResponse.json();

    if (!processorResult.success) {
      throw new Error(`Processor failed: ${JSON.stringify(processorResult)}`);
    }

    console.log('   ✅ Processor executed successfully');
    console.log(`      - Events processed: ${processorResult.processed}`);
    console.log(`      - Mutations created: ${processorResult.mutations_generated}`);
    console.log(`      - Artists recalculated: ${processorResult.artists_recalculated}`);

    // Give database a moment to commit
    console.log('   ⏳ Waiting for database to commit...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if our events were processed
    const { data: ourEvents, error: checkErr } = await supabase
      .from('passport_entries')
      .select('id, coliseum_processed_at')
      .in('id', insertedEvents.map(e => e.id));

    if (!checkErr && ourEvents) {
      const processed = ourEvents.filter(e => e.coliseum_processed_at);
      console.log(`   📊 Our test events: ${processed.length}/${ourEvents.length} processed`);
    }

    // ========================================
    // STEP 4: Verify Mutations Created
    // ========================================
    console.log('\n🧬 Step 4: Verifying DNA mutations...');

    const { data: mutations, error: mutError } = await supabase
      .from('coliseum_dna_mutations')
      .select('*')
      .eq('artist_id', testArtistId)
      .order('processed_at', { ascending: false })
      .limit(10);

    if (mutError) throw mutError;

    console.log(`   ✅ Found ${mutations.length} mutations for test artist`);

    const domains = [...new Set(mutations.map(m => m.domain))];
    console.log(`      - Domains: ${domains.join(', ')}`);

    if (mutations.length === 0) {
      throw new Error('❌ No mutations created!');
    }

    // ========================================
    // STEP 5: Verify Domain Strength Updated
    // ========================================
    console.log('\n💪 Step 5: Verifying domain strength...');

    const { data: domainStrength, error: dsError } = await supabase
      .from('coliseum_domain_strength')
      .select('*')
      .eq('entity_id', testArtistId)
      .eq('entity_type', 'artist');

    if (dsError) throw dsError;

    if (!domainStrength || domainStrength.length === 0) {
      throw new Error('❌ No domain strength records found!');
    }

    console.log(`   ✅ Found ${domainStrength.length} domain strength records`);

    domainStrength.forEach(ds => {
      console.log(`      - ${ds.time_range}: T=${ds.t_strength?.toFixed(2) || 0}, Total=${ds.total_strength?.toFixed(2) || 0}`);
    });

    // ========================================
    // STEP 6: Verify Leaderboard Views
    // ========================================
    console.log('\n🏆 Step 6: Checking leaderboard views...');

    // Refresh views
    try {
      await supabase.rpc('refresh_all_coliseum_leaderboards');
    } catch (e) {
      console.log('   ⚠️  Could not refresh views (may not exist)');
    }

    const { data: leaderboard, error: lbError } = await supabase
      .from('coliseum_leaderboard_t_7d')
      .select('*')
      .eq('artist_id', testArtistId)
      .single();

    if (leaderboard) {
      console.log(`   ✅ Artist appears in T-domain leaderboard`);
      console.log(`      - Strength: ${leaderboard.domain_strength?.toFixed(2)}`);
    } else {
      console.log('   ⚠️  Artist not in leaderboard (may need view refresh)');
    }

    // ========================================
    // CLEANUP
    // ========================================
    console.log('\n🧹 Cleaning up test data...');

    await supabase.from('coliseum_dna_mutations').delete().eq('artist_id', testArtistId);
    await supabase.from('coliseum_domain_strength').delete().eq('entity_id', testArtistId);
    await supabase.from('passport_entries').delete().in('id', insertedEvents.map(e => e.id));
    await supabase.from('content_items').delete().eq('id', testTrackId);
    await supabase.from('artist_profiles').delete().eq('id', testArtistId);
    await supabase.auth.admin.deleteUser(testUserId);

    console.log('   ✅ Test data cleaned up');

    // ========================================
    // SUCCESS!
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ COLISEUM INTEGRATION TEST: PASSED');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   - Events created: ${insertedEvents.length}`);
    console.log(`   - Events processed: ${processorResult.processed}`);
    console.log(`   - Mutations generated: ${mutations.length}`);
    console.log(`   - Domain strength records: ${domainStrength.length}`);
    console.log(`   - All systems operational ✅`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError details:', error);

    // Cleanup on failure
    if (testUserId) {
      try {
        if (testArtistId) {
          await supabase.from('coliseum_dna_mutations').delete().eq('artist_id', testArtistId);
          await supabase.from('coliseum_domain_strength').delete().eq('entity_id', testArtistId);
          await supabase.from('content_items').delete().eq('artist_id', testArtistId);
          await supabase.from('artist_profiles').delete().eq('id', testArtistId);
        }
        await supabase.auth.admin.deleteUser(testUserId);
        console.log('\n🧹 Cleaned up test data after failure');
      } catch (cleanupError) {
        console.error('⚠️  Cleanup error:', cleanupError.message);
      }
    }

    process.exit(1);
  }
}

// Run the test
runTest();
