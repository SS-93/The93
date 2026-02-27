
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

global.window = { location: { hostname: 'localhost' } };

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLogging() {
  console.log('🚀 VERIFYING EVENT LOGGING');
  console.log('--------------------------');

  try {
    // 1. Try to find an existing user (to satisfy FKs if any)
    console.log('1️⃣  Fetching an existing user...');
    const { data: users, error: userError } = await supabase
      .from('media_ids')
      .select('user_uuid')
      .limit(1);

    let userId = uuidv4();
    if (users && users.length > 0) {
      userId = users[0].user_uuid;
      console.log(`   ✅ Found user: ${userId}`);
    } else {
      console.log('   ⚠️  No users found (RLS hidden?). Using random UUID.');
    }

    // 2. Log Passport Event
    console.log('\n2️⃣  Logging Passport Event...');
    const eventPayload = {
      event_type: 'player.track_played',
      event_category: 'interaction',
      user_id: userId,
      metadata: {
        trackId: 'test-track-' + uuidv4(),
        artistId: 'artist-kendrick',
        genres: ['hip-hop'],
        durationSeconds: 180,
        source: 'e2e-script'
      }
    };

    const { data: eventData, error: eventError } = await supabase
      .from('passport_entries')
      .insert(eventPayload)
      .select()
      .single();

    if (eventError) {
      throw new Error(`Failed to log event: ${eventError.message}`);
    }

    console.log(`   ✅ Event logged successfully! ID: ${eventData.id}`);
    console.log('   🎉 Event Logging Verification PASSED');

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
  }
}

verifyLogging();
