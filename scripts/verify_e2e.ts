
/**
 * =============================================================================
 * END-TO-END VERIFICATION SCRIPT
 * =============================================================================
 * 
 * Purpose: Verify the full "Digital Symbiosis" loop:
 * Action -> Passport -> Processor -> DNA Update
 */

// Load environment variables
require('dotenv').config();

// Mock browser environment for Supabase client
global.window = {
    location: {
        hostname: 'localhost'
    }
} as any;

// Import dependencies
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase (Directly here to avoid React env var issues in script)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import Processor (using require for script compatibility)
// Note: We might need to use ts-node to run this if imports are ESM
// For simplicity, we'll try to run this with ts-node

import { processPassportEntries } from '../src/lib/passport/processor';

async function runVerification() {
    console.log('🚀 STARTING END-TO-END VERIFICATION');
    console.log('-----------------------------------');

    const TEST_USER_ID = 'e2e-test-user-' + uuidv4();
    const TEST_TRACK_ID = 'track-hiphop-' + uuidv4();

    try {
        // 1. Create a Test User (in media_ids to ensure they exist)
        console.log(`\n1️⃣  Creating Test User: ${TEST_USER_ID}`);
        const { error: userError } = await supabase
            .from('media_ids')
            .insert({
                user_uuid: TEST_USER_ID,
                profile_embedding: Array(1536).fill(0), // Neutral DNA
                version: 1
            });

        if (userError) throw new Error(`Failed to create user: ${userError.message}`);
        console.log('   ✅ User created with Neutral DNA');

        // 2. Log a Passport Event
        console.log('\n2️⃣  Logging Passport Event (Track Play)');
        const eventPayload = {
            type: 'player.track_played',
            event_category: 'interaction',
            user_id: TEST_USER_ID,
            timestamp: new Date().toISOString(),
            payload: {
                trackId: TEST_TRACK_ID,
                artistId: 'artist-kendrick',
                genres: ['hip-hop', 'rap'],
                durationSeconds: 180
            },
            processed: false
        };

        const { data: eventData, error: eventError } = await supabase
            .from('passport_entries')
            .insert(eventPayload)
            .select()
            .single();

        if (eventError) throw new Error(`Failed to log event: ${eventError.message}`);
        console.log(`   ✅ Event logged: ${eventData.id}`);

        // 3. Run the Processor
        console.log('\n3️⃣  Running Passport Processor...');
        const jobResult = await processPassportEntries();
        console.log(`   ✅ Job Completed. Processed: ${jobResult.entries_processed}, Failed: ${jobResult.entries_failed}`);

        if (jobResult.entries_processed === 0) {
            console.warn('   ⚠️  Processor found 0 entries. Check if event was already processed or query filters.');
        }

        // 4. Verify DNA Update
        console.log('\n4️⃣  Verifying DNA Evolution...');
        const { data: dnaData, error: dnaError } = await supabase
            .from('media_ids')
            .select('profile_embedding, version')
            .eq('user_uuid', TEST_USER_ID)
            .single();

        if (dnaError) throw new Error(`Failed to fetch DNA: ${dnaError.message}`);

        // Check if DNA is no longer all zeros
        const magnitude = Math.sqrt(dnaData.profile_embedding.reduce((sum: number, val: number) => sum + val * val, 0));
        console.log(`   📊 DNA Magnitude: ${magnitude.toFixed(6)}`);
        console.log(`   📊 DNA Version: ${dnaData.version}`);

        if (magnitude > 0 && dnaData.version > 1) {
            console.log('\n✅ SUCCESS: DNA has evolved from the interaction!');
        } else {
            console.error('\n❌ FAILURE: DNA did not change.');
        }

    } catch (err: any) {
        console.error('\n❌ ERROR:', err.message);
    }
}

runVerification();
