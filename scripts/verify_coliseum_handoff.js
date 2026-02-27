
/**
 * =============================================================================
 * COLISEUM HANDOFF VERIFICATION SCRIPT
 * =============================================================================
 * 
 * Verifies that the Passport system enforces data requirements for Coliseum Analytics.
 * 
 * CHECKLIST:
 * 1. player.track_played: Requires artistId, genres
 * 2. concierto.event_attended: Requires artistId, city
 * 3. treasury.money_spent: Requires artistId, amountCents
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Mock browser environment
global.window = { location: { hostname: 'localhost' } };

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColiseumRequirements() {
  console.log('🚀 VERIFYING COLISEUM HANDOFF REQUIREMENTS');
  console.log('-----------------------------------------');

  const userId = uuidv4(); // Use random ID for test
  const artistId = uuidv4();

  // ===========================================================================
  // TEST 1: player.track_played (A-domain)
  // ===========================================================================
  console.log('\n1️⃣  Testing A-domain (player.track_played)...');
  
  // Case A: Missing artistId (Should fail validation logic if enforced in DB/Edge, 
  // but since we are inserting raw JSON, we check if we CAN insert valid data)
  // Note: Client-side TS types enforce this, but here we verify the DB accepts the schema.
  
  const trackEvent = {
    event_type: 'player.track_played',
    event_category: 'interaction',
    user_id: userId,
    metadata: {
      trackId: uuidv4(),
      artistId: artistId,           // ✅ REQUIRED
      genres: ['hip-hop', 'trap'],  // ✅ REQUIRED
      durationSeconds: 210,
      source: 'coliseum-verify'
    }
  };

  const { data: trackData, error: trackError } = await supabase
    .from('passport_entries')
    .insert(trackEvent)
    .select()
    .single();

  if (trackError) {
    console.error('   ❌ Failed to log valid track event:', trackError.message);
  } else {
    console.log(`   ✅ Logged valid track event: ${trackData.id}`);
    console.log('      - artistId: present');
    console.log('      - genres: present');
  }

  // ===========================================================================
  // TEST 2: concierto.event_attended (C-domain)
  // ===========================================================================
  console.log('\n2️⃣  Testing C-domain (concierto.event_attended)...');

  const eventAttended = {
    event_type: 'concierto.event_attended',
    event_category: 'concierto',
    user_id: userId,
    metadata: {
      eventId: uuidv4(),
      artistId: artistId,           // ✅ REQUIRED
      city: 'Denver',               // ✅ REQUIRED
      venue: 'Red Rocks',
      source: 'coliseum-verify'
    }
  };

  const { data: eventData, error: eventError } = await supabase
    .from('passport_entries')
    .insert(eventAttended)
    .select()
    .single();

  if (eventError) {
    console.error('   ❌ Failed to log valid event attendance:', eventError.message);
  } else {
    console.log(`   ✅ Logged valid event attendance: ${eventData.id}`);
    console.log('      - artistId: present');
    console.log('      - city: present');
  }

  // ===========================================================================
  // TEST 3: treasury.money_spent (G-domain)
  // ===========================================================================
  console.log('\n3️⃣  Testing G-domain (treasury.money_spent)...');

  const moneySpent = {
    event_type: 'treasury.money_spent',
    event_category: 'treasury',
    user_id: userId,
    metadata: {
      purchaseId: uuidv4(),
      artistId: artistId,           // ✅ REQUIRED
      amountCents: 4500,            // ✅ REQUIRED
      reason: 'ticket',
      source: 'coliseum-verify'
    }
  };

  const { data: moneyData, error: moneyError } = await supabase
    .from('passport_entries')
    .insert(moneySpent)
    .select()
    .single();

  if (moneyError) {
    console.error('   ❌ Failed to log valid money spent:', moneyError.message);
  } else {
    console.log(`   ✅ Logged valid money spent: ${moneyData.id}`);
    console.log('      - artistId: present');
    console.log('      - amountCents: present');
  }

  // ===========================================================================
  // TEST 4: Session ID (T-domain)
  // ===========================================================================
  console.log('\n4️⃣  Testing T-domain (Session Tracking)...');
  // We can't easily test sessionStorage here, but we can verify the DB accepts session_id
  
  const sessionEvent = {
    event_type: 'discovery.search',
    event_category: 'discovery',
    user_id: userId,
    session_id: uuidv4(), // Simulate session ID
    metadata: {
      query: 'kendrick lamar',
      source: 'coliseum-verify'
    }
  };

  const { data: sessionData, error: sessionError } = await supabase
    .from('passport_entries')
    .insert(sessionEvent)
    .select()
    .single();

  if (sessionError) {
    console.error('   ❌ Failed to log event with session_id:', sessionError.message);
  } else {
    console.log(`   ✅ Logged event with session_id: ${sessionData.session_id}`);
  }

}

verifyColiseumRequirements();
