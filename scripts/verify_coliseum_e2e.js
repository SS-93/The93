/**
 * ============================================================================
 * COLISEUM E2E VERIFICATION SCRIPT
 * ============================================================================
 * Purpose: Quick verification of Coliseum DNA processing pipeline
 * Pattern: Follows Treasury verification approach (plain JS for reliability)
 * Usage: node scripts/verify_coliseum_e2e.js
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Required: REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// HELPERS
// ============================================================================

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// VERIFICATION TESTS
// ============================================================================

async function verifySchemaExists() {
  log('🔍', 'Step 1: Verifying Coliseum schema...');

  // Check tables exist
  const tables = [
    'coliseum_domain_strength',
    'coliseum_dna_mutations',
    'coliseum_entitlements',
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      log('❌', `Table ${table} not accessible: ${error.message}`);
      return false;
    }
    log('✅', `Table ${table} exists`);
  }

  // Check materialized views exist
  const views = [
    'coliseum_leaderboard_a_alltime',
    'coliseum_leaderboard_t_alltime',
    'coliseum_leaderboard_g_alltime',
    'coliseum_leaderboard_c_alltime',
  ];

  for (const view of views) {
    const { data, error } = await supabase.from(view).select('*').limit(1);

    if (error) {
      log('❌', `View ${view} not accessible: ${error.message}`);
      return false;
    }
    log('✅', `View ${view} exists`);
  }

  // Check functions exist
  log('🔍', 'Checking SQL functions...');

  const { data: functions, error: funcError } = await supabase.rpc(
    'coliseum_genre_diversity_score',
    {
      p_artist_id: '00000000-0000-0000-0000-000000000000',
      p_time_range: 'alltime',
    }
  );

  if (funcError && !funcError.message.includes('function')) {
    log('✅', 'SQL functions accessible');
  } else if (funcError) {
    log('❌', `SQL functions error: ${funcError.message}`);
    return false;
  }

  log('✅', 'Schema verification complete');
  return true;
}

async function verifyPassportEvents() {
  log('🔍', 'Step 2: Checking Passport events...');

  // Check for unprocessed events
  const { data: unprocessed, error } = await supabase
    .from('passport_entries')
    .select('id, event_type, metadata')
    .is('coliseum_processed_at', null)
    .limit(10);

  if (error) {
    log('❌', `Failed to query Passport events: ${error.message}`);
    return false;
  }

  if (!unprocessed || unprocessed.length === 0) {
    log('⚠️ ', 'No unprocessed Passport events found');
    log('💡', 'This is OK if no user activity yet');
  } else {
    log('✅', `Found ${unprocessed.length} unprocessed events`);

    // Check for artistId in metadata
    const withArtistId = unprocessed.filter(
      (e) => e.metadata?.artistId || e.metadata?.targetId
    );

    log('📊', `Events with artist attribution: ${withArtistId.length}`);

    if (withArtistId.length > 0) {
      const sample = withArtistId[0];
      log(
        '📄',
        `Sample event: ${sample.event_type} (artistId: ${sample.metadata.artistId || sample.metadata.targetId})`
      );
    }
  }

  return true;
}

async function verifyEdgeFunction() {
  log('🔍', 'Step 3: Testing Edge Function...');

  try {
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
      log('❌', `Edge Function returned ${response.status}: ${response.statusText}`);
      return false;
    }

    const result = await response.json();

    log('✅', 'Edge Function is accessible');
    log('📊', `Processed: ${result.processed || 0} events`);
    log('📊', `Mutations: ${result.mutations || 0} created`);
    log('📊', `Artists updated: ${result.artists_updated || 0}`);

    return true;
  } catch (err) {
    log('❌', `Edge Function error: ${err.message}`);
    log('💡', 'Make sure Edge Function is deployed: npx supabase functions deploy coliseum-processor');
    return false;
  }
}

async function verifyDNACalculations() {
  log('🔍', 'Step 4: Verifying DNA calculations...');

  // Check if any mutations exist
  const { data: mutations, error: mutError } = await supabase
    .from('coliseum_dna_mutations')
    .select('artist_id')
    .limit(1);

  if (mutError) {
    log('❌', `Failed to query mutations: ${mutError.message}`);
    return false;
  }

  if (!mutations || mutations.length === 0) {
    log('⚠️ ', 'No DNA mutations found yet');
    log('💡', 'Process some Passport events first');
    return true; // Not a failure, just no data yet
  }

  const artistId = mutations[0].artist_id;
  log('📊', `Testing with artist: ${artistId}`);

  // Test each domain function
  const domains = [
    { name: 'A-domain (Cultural)', func: 'coliseum_genre_diversity_score' },
    { name: 'T-domain (Behavioral)', func: 'coliseum_repeat_engagement_rate' },
    { name: 'G-domain (Economic)', func: 'coliseum_revenue_per_fan' },
    { name: 'C-domain (Spatial)', func: 'coliseum_geographic_reach' },
  ];

  for (const domain of domains) {
    const { data, error } = await supabase.rpc(domain.func, {
      p_artist_id: artistId,
      p_time_range: 'alltime',
    });

    if (error) {
      log('❌', `${domain.name} calculation failed: ${error.message}`);
      return false;
    }

    log('✅', `${domain.name}: ${JSON.stringify(data)}`);
  }

  // Test combined DNA profile
  const { data: dna, error: dnaError } = await supabase.rpc(
    'coliseum_get_artist_dna',
    {
      p_artist_id: artistId,
      p_time_range: 'alltime',
    }
  );

  if (dnaError) {
    log('❌', `Combined DNA profile failed: ${dnaError.message}`);
    return false;
  }

  log('✅', 'Combined DNA profile works');
  if (dna && dna.length > 0) {
    const profile = dna[0];
    log('📊', `  A-strength: ${profile.a_strength}`);
    log('📊', `  T-strength: ${profile.t_strength}`);
    log('📊', `  G-strength: ${profile.g_strength}`);
    log('📊', `  C-strength: ${profile.c_strength}`);
  }

  return true;
}

async function verifyLeaderboards() {
  log('🔍', 'Step 5: Verifying leaderboards...');

  const domains = ['a', 't', 'g', 'c'];
  const timeRanges = ['7d', '30d', 'alltime'];

  let totalViews = 0;
  let workingViews = 0;

  for (const domain of domains) {
    for (const range of timeRanges) {
      totalViews++;
      const viewName = `coliseum_leaderboard_${domain}_${range}`;

      const { data, error } = await supabase
        .from(viewName)
        .select('artist_id, domain_strength')
        .limit(5);

      if (error) {
        log('❌', `View ${viewName} failed: ${error.message}`);
      } else {
        workingViews++;
        const count = data?.length || 0;
        if (count > 0) {
          log('✅', `${viewName}: ${count} artists`);
        } else {
          log('⚠️ ', `${viewName}: Empty (no data yet)`);
        }
      }
    }
  }

  log('📊', `Leaderboards: ${workingViews}/${totalViews} working`);

  return workingViews === totalViews;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  log('🏛️', 'COLISEUM E2E VERIFICATION');
  console.log('='.repeat(60));
  console.log('');

  const steps = [
    verifySchemaExists,
    verifyPassportEvents,
    verifyEdgeFunction,
    verifyDNACalculations,
    verifyLeaderboards,
  ];

  let passed = 0;
  let failed = 0;

  for (const step of steps) {
    try {
      const result = await step();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      console.log('');
    } catch (err) {
      log('❌', `Step failed with error: ${err.message}`);
      failed++;
      console.log('');
    }
  }

  console.log('='.repeat(60));
  log('📊', `RESULTS: ${passed} passed, ${failed} failed`);
  console.log('');

  if (failed === 0) {
    log('✅', 'ALL CHECKS PASSED - Coliseum is ready!');
    process.exit(0);
  } else {
    log('❌', 'SOME CHECKS FAILED - Review errors above');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
