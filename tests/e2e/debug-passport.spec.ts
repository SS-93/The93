
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/test-users';

// Use EXISTING auth state (Alternate Approach: Bypass UI Login)
test.use({ storageState: 'playwright/.auth/listener1.json' });

test('Debug Passport Page Render (With Auth)', async ({ page }) => {
    console.log('🐞 S T A R T I N G   D E B U G   T E S T   ( A U T H E D ) 🐞');

    // 1. Go directly to Test Passport Harness
    // (Session should be auto-restored from storageState)
    console.log('🔗 Navigating to /test-passport...');
    const response = await page.goto('/test-passport');

    console.log('📡 Response Status:', response?.status());
    console.log('📡 Response URL:', response?.url());

    // Wait for React hydration to complete
    console.log('⏳ Waiting for React hydration...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️  Network not idle after 10s, continuing anyway...');
    });

    // Wait for the main heading to ensure page is rendered
    console.log('🔍 Waiting for page heading...');
    await expect(page.locator('h1')).toHaveText('Passport E2E Test Harness', { timeout: 10000 });
    console.log('✅ Page heading found');

    // 2. Inspect Page immediately
    console.log('📸 Taking snapshot...');
    const content = await page.content();
    console.log('📄 PAGE CONTENT START 📄');
    console.log(content);
    console.log('📄 PAGE CONTENT END 📄');

    await page.screenshot({ path: 'debug-passport-authed.png' });

    // 3. Check for Status Display
    console.log('🔍 Looking for status-display element...');
    const statusDisplay = page.locator('[data-testid="status-display"]');

    // Wait for element to be visible
    await expect(statusDisplay).toBeVisible({ timeout: 5000 });
    console.log('✅ found status-display element!');

    const statusText = await statusDisplay.innerText();
    console.log('   Text:', statusText);
    await expect(statusDisplay).toContainText('Ready');

    // 4. Click Log Button (Verify Harness Logic)
    console.log('🖱️  Clicking Log Play Button...');
    await page.getByTestId('btn-log-play').click();

    // Wait for status update
    await expect(statusDisplay).toContainText('Play Event Logged', { timeout: 5000 });
    console.log('✅ Status updated to: Play Event Logged');
});
