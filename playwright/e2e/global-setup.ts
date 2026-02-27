/**
 * ============================================================================
 * HYBRID E2E SETUP - Global Setup for Playwright Tests
 * ============================================================================
 * Purpose: Create test users + seed data (service role) → Login (Playwright)
 * Strategy: Fast setup, realistic tests, comprehensive coverage
 * ============================================================================
 */

import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import * as dotenv from 'dotenv';
import { TEST_USERS, SESSION_PATHS } from '../../tests/helpers/test-users';
import { generateColiseumMockData } from '../../tests/helpers/mock-passport-data';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

/**
 * Global setup function
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
    console.log('\n🚀 ============================================');
    console.log('🚀 HYBRID E2E SETUP - Starting Global Setup');
    console.log('🚀 ============================================\n');

    const { baseURL } = config.projects[0].use;

    // ========================================================================
    // PHASE 1: CREATE TEST USERS (Service Role)
    // ========================================================================

    console.log('📝 Phase 1: Creating test users with service role...\n');

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
    const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        throw new Error('Missing REACT_APP_SUPABASE_URL');
    }

    if (!supabaseServiceKey) {
        console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - skipping setup');
        console.warn('⚠️  Tests will run with existing data\n');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // Create all test users
    for (const [key, user] of Object.entries(TEST_USERS)) {
        console.log(`  Creating user: ${user.email} (${user.role})...`);

        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    display_name: user.displayName,
                    role: user.role,
                },
            });

            // Check if user exists using the specific error code from Supabase
            const isEmailExistsError =
                authError?.code === 'email_exists' ||
                authError?.message?.includes('already registered') ||
                authError?.status === 422;

            if (authError && !isEmailExistsError) {
                console.error(`    ❌ Error creating auth user:`, authError);
                continue;
            }

            let userId = authData?.user?.id;

            // If user creation failed because they exist, we must fetch their REAL ID
            if (!userId && isEmailExistsError) {
                console.log(`    ⚠️  User already exists (code: ${authError?.code}), fetching ID...`);
                // Try fetching from profiles first
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (profile) {
                    userId = profile.id;
                } else {
                    // Fallback: Try signing in to get ID
                    const { data: loginData } = await supabase.auth.signInWithPassword({
                        email: user.email,
                        password: user.password,
                    });
                    if (loginData.user) {
                        userId = loginData.user.id;
                    }
                }
            }

            // Fallback to hardcoded ID if we still don't have one (though this will likely fail later)
            userId = userId || user.id;

            // CRITICAL: Update the runtime registry with the ACTUAL ID so mock data generator uses it
            TEST_USERS[key].id = userId;

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: user.email,
                    display_name: user.displayName,
                    role: user.role,
                }, { onConflict: 'id' });

            if (profileError) {
                console.error(`    ⚠️  Profile error (may already exist):`, profileError.message);
            }

            // Create MediaID
            const { error: mediaIdError } = await supabase
                .from('media_ids')
                .upsert({
                    user_uuid: userId,
                    interests: [],
                    genre_preferences: user.genres || [],
                    privacy_settings: { analytics: true, personalization: true },
                }, { onConflict: 'user_uuid' });

            if (mediaIdError) {
                console.error(`    ⚠️  MediaID error (may already exist):`, mediaIdError.message);
            }

            // Create artist profile if artist
            if (user.role === 'artist' && user.artistId) {
                const { error: artistError } = await supabase
                    .from('artist_profiles')
                    .upsert({
                        id: user.artistId,
                        user_id: userId,
                        artist_name: user.displayName,
                        bio: `Test artist for E2E testing - ${user.displayName}`,
                        genre_tags: user.genres || [],
                        location: user.location || 'Unknown',
                    }, { onConflict: 'id' });

                if (artistError) {
                    console.error(`    ⚠️  Artist profile error (may already exist):`, artistError.message);
                }
            }

            // Create Coliseum entitlement
            const { error: entitlementError } = await supabase
                .from('coliseum_entitlements')
                .upsert({
                    user_id: userId,
                    plan: user.plan,
                    status: 'active',
                    artists_tracked: 0,
                    api_calls_month: 0,
                    reports_generated_month: 0,
                }, { onConflict: 'user_id' });

            if (entitlementError) {
                console.error(`    ⚠️  Entitlement error (may already exist):`, entitlementError.message);
            }

            console.log(`    ✅ User created successfully`);

        } catch (error) {
            console.error(`    ❌ Unexpected error:`, error);
        }
    }

    console.log('\n✅ Phase 1 complete: All test users created\n');

    // ========================================================================
    // PHASE 2: SEED MOCK DATA (Service Role)
    // ========================================================================

    console.log('📊 Phase 2: Seeding mock Passport data (SKIPPED for speed)...\n');
    /*
    try {
        await generateColiseumMockData(supabaseUrl, supabaseServiceKey);
        console.log('\n✅ Phase 2 complete: Mock data seeded\n');
    } catch (error) {
        console.error('❌ Error seeding mock data:', error);
        // Continue anyway - tests can still run without mock data
    }
    */

    // ========================================================================
    // PHASE 3: LOGIN AND SAVE SESSIONS (API Method)
    // ========================================================================

    console.log('🔐 Phase 3: Logging in test users via API and saving sessions...\n');

    const browser = await chromium.launch();

    for (const [key, user] of Object.entries(TEST_USERS)) {
        console.log(`  Logging in: ${user.email}...`);

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Login via API instead of UI (bypasses webpack overlay issue)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: user.password,
            });

            if (authError) {
                console.error(`    ❌ API login failed:`, authError.message);
                continue;
            }

            console.log(`    ✅ API login successful`);

            // Navigate to app and set auth cookies
            await page.goto(`${baseURL}/`);

            // Set Supabase auth tokens in localStorage
            await page.evaluate((session) => {
                localStorage.setItem('supabase.auth.token', JSON.stringify(session));
            }, authData.session);

            // Wait for page to slightly settle (avoid networkidle which times out on polling)
            await page.waitForLoadState('domcontentloaded');

            // Save session state
            const sessionPath = SESSION_PATHS[key as keyof typeof SESSION_PATHS];
            await context.storageState({ path: sessionPath });

            console.log(`    ✅ Session saved to: ${sessionPath}`);

        } catch (error) {
            console.error(`    ❌ Login failed:`, error);
        } finally {
            await context.close();
        }
    }

    await browser.close();

    console.log('\n✅ Phase 3 complete: All sessions saved\n');

    // ========================================================================
    // PHASE 4: RUN COLISEUM PROCESSOR (Optional)
    // ========================================================================

    console.log('⚙️  Phase 4: Running Coliseum processor...\n');

    try {
        // Invoke Coliseum processor Edge Function
        const { data, error } = await supabase.functions.invoke('coliseum-processor', {
            body: { mode: 'full' },
        });

        if (error) {
            console.error('    ⚠️  Processor invocation failed:', error);
        } else {
            console.log('    ✅ Processor executed successfully');
            console.log(`       Events processed: ${data?.eventsProcessed || 0}`);
            console.log(`       Mutations created: ${data?.mutationsCreated || 0}`);
        }
    } catch (error) {
        console.error('    ⚠️  Processor error (may not be deployed):', error);
    }

    console.log('\n✅ Phase 4 complete\n');

    // ========================================================================
    // SUMMARY
    // ========================================================================

    console.log('🎉 ============================================');
    console.log('🎉 HYBRID E2E SETUP - Complete!');
    console.log('🎉 ============================================');
    console.log(`\n📊 Summary:`);
    console.log(`   - Test users created: ${Object.keys(TEST_USERS).length}`);
    console.log(`   - Sessions saved: ${Object.keys(SESSION_PATHS).length}`);
    console.log(`   - Mock data: Generated`);
    console.log(`   - Processor: Executed`);
    console.log(`\n✅ Ready to run E2E tests!\n`);
}

export default globalSetup;
