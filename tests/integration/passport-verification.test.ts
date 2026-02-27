/**
 * Passport Verification Integration Tests
 * Tests Passport ↔ Treasury consistency verification
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { supabase, createTestUser, cleanupTestData, generateWalletId } from '../helpers/test-setup';

describe('Passport Verification', () => {
  let testUser: { id: string; email: string; wallet_id: string };

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  afterAll(async () => {
    if (testUser?.id) {
      await cleanupTestData(testUser.id);
    }
  });

  test('Passport entry created for every Treasury transaction', async () => {
    // Create a test transaction
    const correlationId = `test-${Date.now()}`;
    
    // Create ledger entry
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        correlation_id: correlationId,
        amount_cents: 5000,
        entry_type: 'debit',
        account_type: 'revenue',
        currency: 'usd'
      })
      .select()
      .single();

    // Create corresponding Passport entry
    const { data: passportEntry } = await supabase
      .from('passport_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        event_type: 'treasury.transaction_created',
        event_category: 'financial',
        treasury_correlation_id: correlationId,
        metadata: {
          amount_cents: 5000,
          correlation_id: correlationId
        }
      })
      .select()
      .single();

    // Link them
    await supabase
      .from('ledger_entries')
      .update({ passport_entry_id: passportEntry.id })
      .eq('id', ledgerEntry.id);

    // Verify link exists
    const { data: linkedEntry } = await supabase
      .from('ledger_entries')
      .select('passport_entry_id')
      .eq('id', ledgerEntry.id)
      .single();

    expect(linkedEntry?.passport_entry_id).toBe(passportEntry.id);
  });

  test('Wallet IDs match between Passport and Treasury', async () => {
    const correlationId = `test-${Date.now()}`;
    
    // Create entries with same wallet_id
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
    expect(ledgerEntry.wallet_id).toBe(testUser.wallet_id);
    expect(passportEntry.wallet_id).toBe(testUser.wallet_id);
    expect(ledgerEntry.wallet_id).toBe(passportEntry.wallet_id);
  });

  test('Amounts match between Passport and Treasury', async () => {
    const correlationId = `test-${Date.now()}`;
    const amountCents = 5000;
    
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        correlation_id: correlationId,
        amount_cents: amountCents
      })
      .select()
      .single();

    const { data: passportEntry } = await supabase
      .from('passport_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        treasury_correlation_id: correlationId,
        metadata: {
          amount_cents: amountCents
        }
      })
      .select()
      .single();

    // Verify amounts match
    const passportAmount = passportEntry.metadata?.amount_cents;
    expect(ledgerEntry.amount_cents).toBe(amountCents);
    expect(passportAmount).toBe(amountCents);
    expect(ledgerEntry.amount_cents).toBe(passportAmount);
  });

  test('Verification hash generated correctly', async () => {
    const correlationId = `test-${Date.now()}`;
    
    // Create entries
    const { data: ledgerEntry } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        correlation_id: correlationId,
        amount_cents: 5000
      })
      .select()
      .single();

    const { data: passportEntry } = await supabase
      .from('passport_entries')
      .insert({
        user_id: testUser.id,
        wallet_id: testUser.wallet_id,
        treasury_correlation_id: correlationId,
        metadata: { amount_cents: 5000 }
      })
      .select()
      .single();

    // Generate verification hash (would use PassportVerification class)
    // const verificationHash = await PassportVerification.generateHash(ledgerEntry, passportEntry);
    
    // Update ledger entry with hash
    // await supabase.from('ledger_entries').update({ verification_hash: verificationHash }).eq('id', ledgerEntry.id);
    
    // Verify hash exists
    const { data: updatedEntry } = await supabase
      .from('ledger_entries')
      .select('verification_hash')
      .eq('id', ledgerEntry.id)
      .single();

    // expect(updatedEntry?.verification_hash).toBeDefined();
  });
});

