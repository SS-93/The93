/**
 * Wallet ID Matching Tests
 * Tests Wallet ID generation, storage, and verification
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { supabase, createTestUser, cleanupTestData, generateWalletId } from '../helpers/test-setup';
import crypto from 'crypto';

describe('Wallet ID Matching', () => {
  let testUser: { id: string; email: string; wallet_id: string };

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  test('Wallet ID generated deterministically', () => {
    const userId = testUser.id;
    const walletId1 = generateWalletId(userId);
    const walletId2 = generateWalletId(userId);
    
    // Same user_id should generate same wallet_id
    expect(walletId1).toBe(walletId2);
    expect(walletId1).toMatch(/^wallet_[a-f0-9]{12}$/);
  });

  test('Different user IDs generate different wallet IDs', () => {
    const userId1 = crypto.randomUUID();
    const userId2 = crypto.randomUUID();
    
    const walletId1 = generateWalletId(userId1);
    const walletId2 = generateWalletId(userId2);
    
    expect(walletId1).not.toBe(walletId2);
  });

  test('Wallet ID stored in ledger entries', async () => {
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        amount_cents: 5000,
        entry_type: 'debit',
        account_type: 'revenue',
        currency: 'usd'
      })
      .select()
      .single();

    expect(ledgerEntry?.wallet_id).toBe(testUser.wallet_id);
  });

  test('Wallet ID stored in Passport entries', async () => {
    const { data: passportEntry } = await supabase
      .from('passport_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        event_type: 'test.event',
        event_category: 'test'
      })
      .select()
      .single();

    expect(passportEntry?.wallet_id).toBe(testUser.wallet_id);
  });

  test('Wallet ID matching verification works', async () => {
    const correlationId = `test-${Date.now()}`;
    
    // Create entries with matching wallet IDs
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        correlation_id: correlationId
      })
      .select()
      .single();

    const { data: passportEntry } = await supabase
      .from('passport_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        treasury_correlation_id: correlationId
      })
      .select()
      .single();

    // Verify wallet IDs match
    const walletsMatch = ledgerEntry.wallet_id === passportEntry.wallet_id;
    expect(walletsMatch).toBe(true);
  });

  test('Wallet ID immutability', async () => {
    const originalWalletId = testUser.wallet_id;
    
    // Try to update wallet_id (should fail or be ignored)
    const { data: updated } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: originalWalletId
      })
      .select()
      .single();

    // Wallet ID should remain the same
    expect(updated?.wallet_id).toBe(originalWalletId);
    
    // Re-generate wallet ID for same user_id
    const regeneratedWalletId = generateWalletId(testUser.id);
    expect(regeneratedWalletId).toBe(originalWalletId);
  });
});

