const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://iutnwgvzwyupsuguxnls.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ No Supabase key found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSchema() {
  console.log('\n🏛️  COLISEUM SCHEMA VERIFICATION');
  console.log('============================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;

  // Test tables
  console.log('📋 Testing Tables...\n');
  const tables = ['coliseum_domain_strength', 'coliseum_dna_mutations', 'coliseum_entitlements'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        totalFailed++;
      } else {
        console.log(`✅ ${table}: Accessible`);
        totalPassed++;
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      totalFailed++;
    }
  }

  // Test views
  console.log('\n📊 Testing Materialized Views...\n');
  const views = [
    'coliseum_leaderboard_a_alltime',
    'coliseum_leaderboard_t_alltime',
    'coliseum_leaderboard_g_alltime',
    'coliseum_leaderboard_c_alltime'
  ];

  for (const view of views) {
    try {
      const { data, error } = await supabase.from(view).select('*').limit(1);
      if (error) {
        console.log(`❌ ${view}: ${error.message}`);
        totalFailed++;
      } else {
        const count = data ? data.length : 0;
        console.log(`✅ ${view}: Accessible (${count} rows)`);
        totalPassed++;
      }
    } catch (err) {
      console.log(`❌ ${view}: ${err.message}`);
      totalFailed++;
    }
  }

  // Test artist_profiles for genre_tags
  console.log('\n🎵 Testing Genre Tags Migration...\n');
  try {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('id, artist_name, genre_tags')
      .not('genre_tags', 'is', null)
      .limit(5);

    if (error) {
      console.log(`❌ genre_tags column: ${error.message}`);
      totalFailed++;
    } else {
      console.log(`✅ genre_tags column exists`);
      if (data && data.length > 0) {
        console.log(`📊 Found ${data.length} artists with genre tags`);
        console.log(`   Sample: ${data[0].artist_name} - [${data[0].genre_tags.join(', ')}]`);
      }
      totalPassed++;
    }
  } catch (err) {
    console.log(`❌ genre_tags: ${err.message}`);
    totalFailed++;
  }

  // Summary
  console.log('\n============================================================');
  console.log(`📊 FINAL RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('============================================================\n');

  if (totalFailed === 0) {
    console.log('✅ ALL SCHEMA CHECKS PASSED');
  } else {
    console.log('⚠️  SOME CHECKS FAILED (may need service_role key for full access)');
  }
}

testSchema().catch(console.error);
