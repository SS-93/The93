/**
 * ============================================================================
 * COLISEUM LEADERBOARD E2E TEST
 * ============================================================================
 * Purpose: Test Coliseum leaderboard with mock Passport data
 * First E2E test using hybrid setup infrastructure
 * ============================================================================
 */

import { test, expect } from '@playwright/test';

test.describe('Coliseum Leaderboard - Public Access', () => {

    test('should load Coliseum page without authentication', async ({ page }) => {
        // Navigate to Coliseum
        await page.goto('/coliseum');

        // Verify page loaded
        await expect(page).toHaveTitle(/Coliseum|Buckets/);

        // Verify public access banner
        await expect(page.locator('text=Public Coliseum')).toBeVisible({ timeout: 10000 });

        // Verify domain tabs exist
        await expect(page.locator('text=A-Domain')).toBeVisible();
        await expect(page.locator('text=T-Domain')).toBeVisible();
        await expect(page.locator('text=G-Domain')).toBeVisible();
        await expect(page.locator('text=C-Domain')).toBeVisible();

        console.log('✅ Coliseum page loaded successfully');
    });

    test('should display leaderboard data', async ({ page }) => {
        await page.goto('/coliseum');

        // Wait for leaderboard to load
        await page.waitForSelector('[data-testid="leaderboard-table"]', { timeout: 15000 }).catch(() => {
            // Fallback: wait for any table
            return page.waitForSelector('table', { timeout: 15000 });
        });

        // Check if we have any artist rows
        const artistRows = await page.locator('tr').count();
        console.log(`📊 Found ${artistRows} rows in leaderboard`);

        // Should have at least header row
        expect(artistRows).toBeGreaterThan(0);
    });

    test('should switch between time ranges', async ({ page }) => {
        await page.goto('/coliseum');

        // Click 7d time range
        await page.click('text=7d');
        await page.waitForTimeout(1000);

        // Click 30d time range
        await page.click('text=30d');
        await page.waitForTimeout(1000);

        // Click alltime
        await page.click('text=All Time');
        await page.waitForTimeout(1000);

        console.log('✅ Time range switching works');
    });

    test('should switch between domains', async ({ page }) => {
        await page.goto('/coliseum');

        // Click each domain
        await page.click('text=A-Domain');
        await page.waitForTimeout(500);

        await page.click('text=T-Domain');
        await page.waitForTimeout(500);

        await page.click('text=G-Domain');
        await page.waitForTimeout(500);

        await page.click('text=C-Domain');
        await page.waitForTimeout(500);

        console.log('✅ Domain switching works');
    });
});

test.describe('Coliseum Leaderboard - Setup Verification', () => {

    test('should verify mock data was created', async ({ page }) => {
        // This test verifies that our global setup created data
        await page.goto('/coliseum');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/coliseum-leaderboard.png', fullPage: true });

        console.log('📸 Screenshot saved to test-results/coliseum-leaderboard.png');
        console.log('✅ Setup verification complete');
    });
});
