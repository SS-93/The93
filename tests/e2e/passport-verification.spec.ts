/**
 * Passport Verification E2E Tests (Playwright)
 * Tests Passport ↔ Treasury consistency through full flow
 */

import { test, expect } from '@playwright/test';
import { supabase, createTestUser, cleanupTestData, waitFor } from '../helpers/test-setup';

test.describe('Passport Verification E2E', () => {
  let testUser: { id: string; email: string; wallet_id: string };

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await cleanupTestData(testUser.id);
    }
  });

  test('Passport entry created for every Treasury transaction', async ({ page }) => {
    // Complete a transaction
    await page.goto('/checkout');
    // ... complete checkout
    
    // Wait for Passport entry to be created
    const passportCreated = await waitFor(async () => {
      const { data } = await supabase
        .from('passport_entries')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('event_type', 'treasury.transaction_created')
        .order('created_at', { ascending: false })
        .limit(1);
      
      return data && data.length > 0;
    }, 10000);
    
    expect(passportCreated).toBe(true);
  });

  test('Wallet IDs match between Passport and Treasury', async ({ page }) => {
    // Complete transaction
    await page.goto('/checkout');
    // ... complete checkout
    
    // Get latest entries
    const { data: ledgerEntries } = await supabase
      .from('ledger_entries')
      .select('wallet_id, passport_entry_id')
      .eq('user_id', testUser.id)
      .not('passport_entry_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (ledgerEntries && ledgerEntries[0]) {
      const { data: passportEntry } = await supabase
        .from('passport_entries')
        .select('wallet_id')
        .eq('id', ledgerEntries[0].passport_entry_id)
        .single();
      
      expect(ledgerEntries[0].wallet_id).toBe(passportEntry?.wallet_id);
      expect(ledgerEntries[0].wallet_id).toBe(testUser.wallet_id);
    }
  });

  test('Amounts match between Passport and Treasury', async ({ page }) => {
    const amountCents = 5000;
    
    // Complete transaction with known amount
    await page.goto('/checkout');
    // ... complete checkout with amountCents
    
    // Wait for entries
    await waitFor(async () => {
      const { data } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('amount_cents', amountCents)
        .limit(1);
      
      return data && data.length > 0;
    }, 10000);
    
    // Verify amounts match
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .select('amount_cents, passport_entry_id')
      .eq('user_id', testUser.id)
      .eq('amount_cents', amountCents)
      .limit(1)
      .single();
    
    if (ledgerEntry?.passport_entry_id) {
      const { data: passportEntry } = await supabase
        .from('passport_entries')
        .select('metadata')
        .eq('id', ledgerEntry.passport_entry_id)
        .single();
      
      const passportAmount = passportEntry?.metadata?.amount_cents || passportEntry?.metadata?.amountCents;
      expect(ledgerEntry.amount_cents).toBe(amountCents);
      expect(passportAmount).toBe(amountCents);
    }
  });
});

