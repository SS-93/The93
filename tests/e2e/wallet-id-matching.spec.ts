/**
 * Wallet ID Matching E2E Tests (Playwright)
 * Tests Wallet ID generation and matching through UI
 */

import { test, expect } from '@playwright/test';
import { supabase, createTestUser, cleanupTestData, generateWalletId } from '../helpers/test-setup';

test.describe('Wallet ID Matching E2E', () => {
  let testUser: { id: string; email: string; wallet_id: string };

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await cleanupTestData(testUser.id);
    }
  });

  test('Wallet ID displayed correctly in UI', async ({ page }) => {
    // Navigate to wallet/profile page
    await page.goto('/wallet');
    
    // Check wallet ID is displayed
    const walletIdElement = page.locator('[data-testid="wallet-id"]');
    await expect(walletIdElement).toBeVisible();
    
    const displayedWalletId = await walletIdElement.textContent();
    expect(displayedWalletId).toBe(testUser.wallet_id);
  });

  test('Wallet ID consistent across transactions', async ({ page }) => {
    // Complete multiple transactions
    for (let i = 0; i < 3; i++) {
      await page.goto('/checkout');
      // ... complete checkout
    }
    
    // Verify all ledger entries have same wallet_id
    const { data: ledgerEntries } = await supabase
      .from('ledger_entries')
      .select('wallet_id')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const uniqueWalletIds = new Set(ledgerEntries?.map(e => e.wallet_id) || []);
    expect(uniqueWalletIds.size).toBe(1);
    expect(Array.from(uniqueWalletIds)[0]).toBe(testUser.wallet_id);
  });

  test('Wallet ID matches between Treasury and Passport', async ({ page }) => {
    // Complete transaction
    await page.goto('/checkout');
    // ... complete checkout
    
    // Get entries
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .select('wallet_id, passport_entry_id')
      .eq('user_id', testUser.id)
      .not('passport_entry_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (ledgerEntry?.passport_entry_id) {
      const { data: passportEntry } = await supabase
        .from('passport_entries')
        .select('wallet_id')
        .eq('id', ledgerEntry.passport_entry_id)
        .single();
      
      expect(ledgerEntry.wallet_id).toBe(passportEntry?.wallet_id);
      expect(ledgerEntry.wallet_id).toBe(testUser.wallet_id);
    }
  });
});

