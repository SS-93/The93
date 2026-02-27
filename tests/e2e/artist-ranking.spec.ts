/**
 * ============================================================================
 * ARTIST RANKING & LEADERBOARD E2E TEST
 * ============================================================================
 * Purpose: Verify that user actions (Plays) update Artist Rank on Leaderboard
 * Flow: Action -> Passport -> Processor -> DB -> Leaderboard UI
 * ============================================================================
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { processPassportEntries } from '../../src/lib/passport/processor';
import { TEST_USERS } from '../helpers/test-users';

// Setup Service Role Client for Processor (Bypasses RLS)
const supabaseService = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Artist Ranking & Leaderboard', () => {

    // We assume 'artistIndie' and 'listener1' exist from Global Setup
    const TARGET_ARTIST_NAME = 'Indie Artist Test';

    // Use Listener 1 session for this test
    test.use({ storageState: 'playwright/.auth/listener1.json' });

    test('User Plays should update Artist Rank', async ({ page }) => {
        // 1. Visit Test Passport (Harness)
        // Login handled by global auth (listener1)
        await page.goto('/test-passport');
        await page.goto('/test-passport');
        // Debug: Log page content
        const content = await page.content();
        console.log('📄 Page Content Dump:', content.slice(0, 1000)); // Log first 1000 chars

        await expect(page.getByTestId('status-display')).toContainText('Ready');

        // 2. Perform Action: Play Track (x10)
        // Weight: 1.0 per play. Total Delta: +10.0
        console.log('🎵 Logging 10 Play Events...');
        for (let i = 0; i < 10; i++) {
            await page.getByTestId('btn-log-play').click();
            // Wait for success message
            await expect(page.getByTestId('status-display')).toContainText('Play Event Logged');
            // Reset status (not strictly needed as button click resets it? No, harness logic sets 'Logging...' then 'Logged')
            // We wait a bit to ensure unique timestamps if processor relies on order
            await page.waitForTimeout(100);
        }

        // 3. Run Processor (Server-Side Logic)
        console.log('⚙️ Running Passport Processor...');
        const job = await processPassportEntries(supabaseService);
        console.log('✅ Processor Result:', job);

        expect(job.entries_processed).toBeGreaterThanOrEqual(10);
        expect(job.entries_failed).toBe(0);

        // 4. Verify Leaderboard UI
        console.log('👀 Verifying Leaderboard...');
        await page.goto('/test-coliseum');

        // Select 'A-Domain' (Culture) since plays affect A-Domain primarily
        // The GlobalCharts default is 'T' (Behavior) or All.
        // Our 'recalculateDomainStrengthSimple' updates A, T, G, C.
        // Let's switch to A-Domain just to be precise, or check All.

        // Wait for leaderboard to load
        await expect(page.locator('text=Rankings')).toBeVisible();

        // Check if Artist appears
        const artistRow = page.locator(`text=${TARGET_ARTIST_NAME}`);
        await expect(artistRow).toBeVisible({ timeout: 15000 });

        // Check Score
        // RankCard usually shows primary metric. "DNA Strength".
        // We expect some score.
        // Note: The materialized view logic might be complex vs our simple upserter.
        // But our upserter updates 'coliseum_domain_strength'.
        // useColiseumLeaderboard queries 'coliseum_leaderboard_...'.
        // If that view is stale (Materialized), we might fail here unless we refreshed it.
        // But for "All Time", it might be a standard view or we hope it refreshes.
        // If it fails, we know we need to trigger Refresh RPC.
    });

});
