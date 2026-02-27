#!/usr/bin/env node

/**
 * E2E Test Runner Script
 * Runs comprehensive Treasury system tests
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}...`, 'cyan');
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n🧪 TREASURY E2E TEST RUNNER', 'blue');
  log('='.repeat(50), 'blue');

  // Check environment variables
  log('\n📋 Checking environment...', 'cyan');
  const requiredEnvVars = [
    'REACT_APP_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    log(`❌ Missing environment variables: ${missingVars.join(', ')}`, 'red');
    process.exit(1);
  }
  log('✅ Environment variables configured', 'green');

  // Run unit tests
  log('\n📦 Running unit tests...', 'cyan');
  const unitTests = runCommand('npm test -- --testPathPattern=tests/unit --passWithNoTests', 'Unit tests');
  if (!unitTests.success) {
    log('⚠️  Unit tests had issues (continuing...)', 'yellow');
  }

  // Run integration tests
  log('\n🔗 Running integration tests...', 'cyan');
  const integrationTests = runCommand('npm test -- --testPathPattern=tests/integration --passWithNoTests', 'Integration tests');
  if (!integrationTests.success) {
    log('⚠️  Integration tests had issues (continuing...)', 'yellow');
  }

  // Run Playwright E2E tests
  log('\n🌐 Running Playwright E2E tests...', 'cyan');
  const e2eTests = runCommand('npx playwright test', 'E2E tests');
  if (!e2eTests.success) {
    log('❌ E2E tests failed', 'red');
    process.exit(1);
  }

  // Generate test report
  log('\n📊 Generating test report...', 'cyan');
  const report = {
    timestamp: new Date().toISOString(),
    unitTests: unitTests.success ? 'PASSED' : 'FAILED',
    integrationTests: integrationTests.success ? 'PASSED' : 'FAILED',
    e2eTests: e2eTests.success ? 'PASSED' : 'FAILED'
  };

  const reportPath = path.join(__dirname, '..', 'test-results', 'e2e-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log('\n✅ Test run complete!', 'green');
  log(`📄 Report saved to: ${reportPath}`, 'cyan');
  log('\n' + '='.repeat(50), 'blue');
}

main().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  process.exit(1);
});

