/**
 * Treasury Gateway Integration Tests
 * Tests the Treasury Gateway flow: Transaction → Ledger → Passport → Link
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { supabase, createTestUser, cleanupTestData, generateWalletId } from '../helpers/test-setup';
import { TreasuryGateway } from '../../src/lib/treasury/gateway';

describe('Treasury Gateway Integration', () => {
  let testUser: { id: string; email: string; wallet_id: string };
  let testEvent: any;

  beforeAll(async () => {
    testUser = await createTestUser();
    // Create test event would go here
  });

  afterAll(async () => {
    if (testUser?.id) {
      await cleanupTestData(testUser.id);
    }
  });

  test('Gateway processes valid transaction', async () => {
    const transactionParams = {
      userId: testUser.id,
      walletId: testUser.wallet_id,
      amountCents: 5000,
      currency: 'usd',
      type: 'ticket',
      eventId: testEvent?.id,
      metadata: {}
    };

    // Call Treasury Gateway
    const result = await TreasuryGateway.processTransaction(transactionParams);
    
    expect(result.status).toBe('completed');
    expect(result.transactionId).toBeDefined();
    expect(result.walletId).toBe(testUser.wallet_id);
    
    // Verify ledger entry created
    const { data: ledgerEntries } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(ledgerEntries).toBeDefined();
    expect(ledgerEntries?.length).toBeGreaterThan(0);
    
    // Verify Passport entry created
    const { data: passportEntries } = await supabase
      .from('passport_entries')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('event_type', 'treasury.transaction_created')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(passportEntries).toBeDefined();
    expect(passportEntries?.length).toBeGreaterThan(0);
    
    // Verify wallet ID matches
    if (ledgerEntries && ledgerEntries[0] && passportEntries && passportEntries[0]) {
      expect(ledgerEntries[0].wallet_id).toBe(testUser.wallet_id);
      expect(passportEntries[0].wallet_id).toBe(testUser.wallet_id);
    }
  });

  test('Gateway rejects invalid transaction', async () => {
    const invalidParams = {
      userId: '', // Missing userId
      amountCents: 5000
    };

    // Should fail validation
    const result = await TreasuryGateway.processTransaction(invalidParams as any);
    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
  });

  test('Gateway creates double-entry ledger', async () => {
    const transactionParams = {
      userId: testUser.id,
      walletId: testUser.wallet_id,
      amountCents: 5000,
      currency: 'usd',
      type: 'ticket',
      eventId: testEvent?.id
    };

    // Process transaction
    const result = await TreasuryGateway.processTransaction(transactionParams);
    expect(result.status).toBe('completed');

    // Verify debit and credit entries exist
    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('correlation_id', result.correlationId);

    // Should have at least debit and credit entries
    expect(entries?.length).toBeGreaterThanOrEqual(2);
    
    // Verify entries balance (debits = credits)
    const debits = entries?.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount_cents, 0) || 0;
    const credits = entries?.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount_cents, 0) || 0;
    
    expect(debits).toBe(credits);
  });

  test('Gateway links Passport and Treasury', async () => {
    // Process transaction
    const transactionParams = {
      userId: testUser.id,
      amountCents: 5000,
      currency: 'usd',
      type: 'ticket' as const,
      eventId: testEvent?.id,
      metadata: {}
    };
    const result = await TreasuryGateway.processTransaction(transactionParams);
    expect(result.status).toBe('completed');

    // Verify link exists
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .select('passport_entry_id, correlation_id')
      .eq('user_id', testUser.id)
      .not('passport_entry_id', 'is', null)
      .limit(1)
      .single();

    expect(ledgerEntry).toBeDefined();
    expect(ledgerEntry?.passport_entry_id).toBeDefined();
    
    // Verify Passport entry has correlation_id
    if (ledgerEntry?.passport_entry_id) {
      const { data: passportEntry } = await supabase
        .from('passport_entries')
        .select('treasury_correlation_id')
        .eq('id', ledgerEntry.passport_entry_id)
        .single();

      expect(passportEntry?.treasury_correlation_id).toBe(ledgerEntry.correlation_id);
    }
  });
});

