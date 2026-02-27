import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { TEST_USERS, SESSION_PATHS } from '../helpers/test-users';
import { processPassportEntries } from '../../src/lib/passport/processor';

// Load environment variables for Service Role access
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
    throw new Error('REACT_APP_SUPABASE_SERVICE_ROLE_KEY is required for this test');
}

// Initialize Service Role Client for Processor
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

test.describe('Passport Data Flow & Processor Verification', () => {

    test('should log event via hook, process it, and update analytics', async ({ page }) => {
        // 1. Login as Listener (using saved session)
        // We use the ID because our globalSetup might have updated it, but here we can just pick the first listener
        // Actually, we should use the session file path directly.
        // The previous test verified login works.

        // Use Listener 1 session
        await page.context().addCookies(
            JSON.parse(require('fs').readFileSync(SESSION_PATHS.listener1, 'utf-8')).cookies
        );

        // 2. Navigate to Test Harness
        console.log('🔗 Navigating to Passport Test Harness...');
        await page.goto('/test-passport');
        await expect(page.locator('h1')).toHaveText('Passport E2E Test Harness');

        // 3. Trigger "Play Track" Event
        console.log('🖱️  Triggering Play Event...');
        await page.click('[data-testid="btn-log-play"]');

        // Wait for success message
        await expect(page.locator('[data-testid="status-display"]')).toContainText('Play Event Logged');
        console.log('✅ Frontend reported success');

        // 4. Run Processor (Server-Side)
        console.log('⚙️  Running Passport Processor (Server-Side)...');

        // We expect at least one unprocessed entry now
        const job = await processPassportEntries(supabaseAdmin);

        console.log('📄 Job Summary:', JSON.stringify(job, null, 2));

        expect(job.status).toBe('completed');
        expect(job.entries_processed).toBeGreaterThan(0);

        // 5. Verify Database State (Server-Side)
        // Fetch the latest processed entry for this user
        // We need the user ID. We can get it from TEST_USERS if it was updated, or we can trust the process.
        // Let's just query the latest entry in coliseum_metrics.

        const { data: metrics, error } = await supabaseAdmin
            .from('coliseum_metrics')
            .select('*')
            .eq('metric_type', 'player.track_played')
            .order('created_at', { ascending: false }) // Use created_at or timestamp
            .limit(1);

        expect(error).toBeNull();
        expect(metrics).not.toBeNull();
        expect(metrics?.length).toBeGreaterThan(0);

        const latestMetric = metrics![0];
        console.log('📊 Verified Metric in Database:', latestMetric);

        // Verify metadata matches harness
        expect(latestMetric.metadata.source).toBe('test_harness');
        expect(latestMetric.metadata.trackId).toBe('track-e2e-123');

        console.log('✅ Data verification complete');
    });

});
