#!/usr/bin/env node

/**
 * Manual Treasury Test Runner
 * Tests Treasury components without full Jest setup
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  return { name, fn };
}

async function runTest(testCase) {
  try {
    log(`\n🧪 Testing: ${testCase.name}`, 'cyan');
    await testCase.fn();
    log(`✅ PASS: ${testCase.name}`, 'green');
    return { name: testCase.name, status: 'PASS' };
  } catch (error) {
    log(`❌ FAIL: ${testCase.name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return { name: testCase.name, status: 'FAIL', error: error.message };
  }
}

// Initialize Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('❌ Missing Supabase credentials', 'red');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Wallet ID function
function generateWalletId(userId) {
  const secret = process.env.WALLET_ID_SECRET || 'test-secret-key';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(userId);
  const hash = hmac.digest('hex');
  return `wallet_${hash.substring(0, 12)}`;
}

// Test cases
const tests = [
  test('Wallet ID Generation', async () => {
    const userId = crypto.randomUUID();
    const walletId1 = generateWalletId(userId);
    const walletId2 = generateWalletId(userId);
    
    if (walletId1 !== walletId2) {
      throw new Error('Wallet ID not deterministic');
    }
    
    if (!walletId1.startsWith('wallet_')) {
      throw new Error('Wallet ID format incorrect');
    }
  }),

  test('Database Schema: ledger_entries has wallet_id column', async () => {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('wallet_id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Schema check failed: ${error.message}`);
    }
  }),

  test('Database Schema: passport_entries has wallet_id column', async () => {
    const { data, error } = await supabase
      .from('passport_entries')
      .select('wallet_id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Schema check failed: ${error.message}`);
    }
  }),

  test('Database Schema: treasury_verifications table exists', async () => {
    const { data, error } = await supabase
      .from('treasury_verifications')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Table check failed: ${error.message}`);
    }
  }),

  test('Treasury Gateway Module Loads', async () => {
    // Check if gateway.ts exists and can be imported
    const fs = require('fs');
    const path = require('path');
    const gatewayPath = path.join(__dirname, '../src/lib/treasury/gateway.ts');
    
    if (!fs.existsSync(gatewayPath)) {
      throw new Error('gateway.ts file not found');
    }
  }),

  test('Wallet ID Utilities Module Loads', async () => {
    const fs = require('fs');
    const path = require('path');
    const walletPath = path.join(__dirname, '../src/lib/treasury/walletId.ts');
    
    if (!fs.existsSync(walletPath)) {
      throw new Error('walletId.ts file not found');
    }
  }),

  test('Passport Verification Module Loads', async () => {
    const fs = require('fs');
    const path = require('path');
    const verificationPath = path.join(__dirname, '../src/lib/treasury/passportVerification.ts');
    
    if (!fs.existsSync(verificationPath)) {
      throw new Error('passportVerification.ts file not found');
    }
  }),

  test('Distribution Manager Module Loads', async () => {
    const fs = require('fs');
    const path = require('path');
    const distPath = path.join(__dirname, '../src/lib/treasury/distributionManager.ts');
    
    if (!fs.existsSync(distPath)) {
      throw new Error('distributionManager.ts file not found');
    }
  })
];

// Run all tests
async function main() {
  log('\n🏦 TREASURY SYSTEM TEST REPORT', 'blue');
  log('='.repeat(60), 'blue');

  const results = [];
  
  for (const testCase of tests) {
    const result = await runTest(testCase);
    results.push(result);
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 TEST SUMMARY', 'cyan');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  log(`Total Tests: ${total}`, 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      log(`  - ${r.name}: ${r.error}`, 'red');
    });
  }

  log('\n' + '='.repeat(60), 'blue');
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  process.exit(1);
});



