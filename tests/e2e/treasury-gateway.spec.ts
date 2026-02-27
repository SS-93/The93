/**
 * Treasury Gateway E2E Tests (Playwright)
 * Tests the full Treasury Gateway flow through UI
 */

import { test, expect } from '@playwright/test';
import { supabase, createTestUser, cleanupTestData } from '../helpers/test-setup';

test.describe('Treasury Gateway E2E', () => {
  let testUser: { id: string; email: string; wallet_id: string };

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await cleanupTestData(testUser.id);
    }
  });

  test('Gateway processes valid transaction through UI', async ({ page }) => {
    // Navigate to checkout page
    await page.goto('/checkout');
    
    // Fill checkout form
    await page.fill('[data-testid="event-select"]', 'test-event-id');
    await page.fill('[data-testid="tier-select"]', 'general');
    
    // Click checkout button
    await page.click('[data-testid="checkout-button"]');
    
    // Wait for Stripe checkout (would redirect)
    // In test mode, we'd mock Stripe
    
    // Verify transaction processed
    await page.waitForSelector('[data-testid="transaction-success"]', { timeout: 10000 });
    
    // Verify ledger entry created
    const { data: ledgerEntries } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    expect(ledgerEntries?.length).toBeGreaterThan(0);
  });

  test('Gateway rejects invalid transaction', async ({ page }) => {
    await page.goto('/checkout');
    
    // Try to checkout without required fields
    await page.click('[data-testid="checkout-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('Gateway creates double-entry ledger', async ({ page }) => {
    // Complete a transaction
    await page.goto('/checkout');
    // ... complete checkout flow
    
    // Verify debit and credit entries
    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Should have paired entries
    const debits = entries?.filter(e => e.entry_type === 'debit') || [];
    const credits = entries?.filter(e => e.entry_type === 'credit') || [];
    
    expect(debits.length).toBeGreaterThan(0);
    expect(credits.length).toBeGreaterThan(0);
    
    // Verify balance
    const totalDebits = debits.reduce((sum, e) => sum + e.amount_cents, 0);
    const totalCredits = credits.reduce((sum, e) => sum + e.amount_cents, 0);
    expect(totalDebits).toBe(totalCredits);
  });
});

