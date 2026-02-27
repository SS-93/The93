/**
 * Test Setup & Helpers
 * Provides utilities for Treasury E2E tests
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Test configuration
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Generate test wallet ID from user_id using HMAC-SHA256
 */
export function generateWalletId(userId: string): string {
  const secret = process.env.WALLET_ID_SECRET || 'test-secret-key';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(userId);
  const hash = hmac.digest('hex');
  return `wallet_${hash.substring(0, 12)}`;
}

/**
 * Create test user
 */
export async function createTestUser(email?: string) {
  const testEmail = email || `test-${Date.now()}@test.com`;
  
  // Note: In real tests, you'd use Supabase Auth API
  // For now, we'll use a mock user_id
  const userId = crypto.randomUUID();
  
  return {
    id: userId,
    email: testEmail,
    wallet_id: generateWalletId(userId)
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(userId: string) {
  try {
    // Clean up in reverse order of dependencies
    await supabase.from('event_tickets').delete().eq('user_id', userId);
    await supabase.from('purchases').delete().eq('user_id', userId);
    await supabase.from('ledger_entries').delete().eq('user_id', userId);
    await supabase.from('passport_entries').delete().eq('user_id', userId);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Wait for async operation with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Create test event
 */
export async function createTestEvent(hostUserId: string) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: `Test Event ${Date.now()}`,
      host_user_id: hostUserId,
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Test Venue',
      ticketing_enabled: true,
      ticket_tiers: [
        { name: 'General', price_cents: 5000, quantity: 100 }
      ]
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Create test checkout session metadata
 */
export function createTestCheckoutMetadata(eventId: string, userId: string, tier = 'general') {
  return {
    intent: 'ticket',
    productType: 'ticket',
    eventId,
    userId,
    tier,
    amountCents: 5000
  };
}

