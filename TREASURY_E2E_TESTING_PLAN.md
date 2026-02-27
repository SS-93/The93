# 🧪 TREASURY SYSTEM - COMPREHENSIVE E2E TESTING PLAN

**Date:** November 23, 2025  
**Status:** Implementation Phase  
**Engineer:** Treasury Engineer  
**Testing Framework:** Playwright + Node.js Integration Tests

---

## 🎯 TESTING OBJECTIVES

### **Primary Goals:**
1. ✅ Verify Treasury Gateway processes all transactions correctly
2. ✅ Verify Passport ↔ Treasury consistency
3. ✅ Verify Wallet ID matching and immutability
4. ✅ Verify revenue split calculations and distribution
5. ✅ Verify end-to-end Stripe → Treasury → Passport flow
6. ✅ Verify double-entry ledger integrity
7. ✅ Verify payout queue processing

---

## 🛠 TESTING INFRASTRUCTURE

### **Tools & Frameworks:**
- **Playwright** - Browser automation for UI flows
- **Node.js** - Backend integration tests
- **Jest** - Unit test framework (already installed)
- **Stripe Test Mode** - Test cards and webhooks
- **Supabase Test Database** - Isolated test environment

### **Test Types:**
1. **Unit Tests** - Individual functions (ledgerService, splitEngine)
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Full user flows (Stripe checkout → Treasury → Passport)
4. **Verification Tests** - Passport ↔ Treasury matching

---

## 📋 TEST SUITE STRUCTURE

```
my-app/
├── tests/
│   ├── e2e/
│   │   ├── treasury-gateway.spec.ts      # Treasury Gateway flow
│   │   ├── passport-verification.spec.ts # Passport ↔ Treasury matching
│   │   ├── wallet-id-matching.spec.ts     # Wallet ID verification
│   │   ├── transaction-flow.spec.ts      # Stripe → Treasury → Passport
│   │   ├── revenue-splits.spec.ts         # Split calculations & distribution
│   │   └── payout-queue.spec.ts           # Payout processing
│   ├── integration/
│   │   ├── ledger-service.test.ts         # Double-entry ledger
│   │   ├── split-engine.test.ts           # Revenue sharing logic
│   │   └── passport-logging.test.ts       # Passport event logging
│   ├── unit/
│   │   ├── treasury-gateway.test.ts       # Gateway validation
│   │   └── wallet-id.test.ts              # Wallet ID generation
│   └── helpers/
│       ├── test-setup.ts                  # Test database setup
│       ├── stripe-mock.ts                  # Stripe test helpers
│       └── passport-helpers.ts             # Passport test utilities
├── scripts/
│   └── run-e2e-tests.js                   # Test runner script
└── playwright.config.ts                   # Playwright configuration
```

---

## 🧪 TEST SCENARIOS

### **1. TREASURY GATEWAY FLOW** ✅

**Test:** `treasury-gateway.spec.ts`

**Scenarios:**
- ✅ Gateway accepts valid transaction
- ✅ Gateway rejects invalid transaction (missing fields)
- ✅ Gateway rejects unauthorized transaction
- ✅ Gateway creates ledger entries (double-entry)
- ✅ Gateway logs to Passport
- ✅ Gateway links Passport ↔ Treasury
- ✅ Gateway returns transaction ID

**Expected Flow:**
```
Transaction Request → Gateway Validation → Ledger Entry → Passport Log → Link → Response
```

---

### **2. PASSPORT VERIFICATION** ✅

**Test:** `passport-verification.spec.ts`

**Scenarios:**
- ✅ Passport entry created for every Treasury transaction
- ✅ Wallet IDs match between Passport and Treasury
- ✅ Amounts match between Passport and Treasury
- ✅ Correlation IDs link correctly
- ✅ Verification hash generated correctly
- ✅ Batch verification job runs successfully

**Expected Flow:**
```
Treasury Transaction → Passport Entry → Verification → Match Check → Status Update
```

---

### **3. WALLET ID MATCHING** ✅

**Test:** `wallet-id-matching.spec.ts`

**Scenarios:**
- ✅ Wallet ID generated from user_id (HMAC-SHA256)
- ✅ Wallet ID is deterministic (same user_id = same wallet_id)
- ✅ Wallet ID stored in ledger entries
- ✅ Wallet ID stored in Passport entries
- ✅ Wallet ID matching verification works
- ✅ Wallet ID immutability (can't change)

**Expected Flow:**
```
User ID → HMAC Hash → Wallet ID → Store in Treasury → Store in Passport → Verify Match
```

---

### **4. TRANSACTION FLOW (E2E)** ✅

**Test:** `transaction-flow.spec.ts`

**Scenarios:**
- ✅ Stripe checkout session created
- ✅ User completes payment (test card)
- ✅ Webhook received and processed
- ✅ Treasury Gateway processes transaction
- ✅ Ledger entries created (double-entry)
- ✅ Passport entry created
- ✅ Wallet ID stored correctly
- ✅ Purchase record created
- ✅ Ticket issued (if event ticket)

**Expected Flow:**
```
Stripe Checkout → Payment → Webhook → Gateway → Ledger → Passport → Fulfillment
```

---

### **5. REVENUE SPLITS** ✅

**Test:** `revenue-splits.spec.ts`

**Scenarios:**
- ✅ Default splits applied (70% artist, 20% platform, 10% host)
- ✅ Custom splits applied correctly
- ✅ Split calculations accurate (no rounding errors)
- ✅ Ledger entries created for each recipient
- ✅ Passport entries logged for each split
- ✅ Lifetime fee tracking updated
- ✅ Payouts queued correctly

**Expected Flow:**
```
Transaction → Split Rules → Calculate Splits → Create Ledger Entries → Queue Payouts → Log Passport
```

---

### **6. PAYOUT QUEUE** ✅

**Test:** `payout-queue.spec.ts`

**Scenarios:**
- ✅ Payout queued when balance threshold met ($25)
- ✅ Payout processed correctly
- ✅ Stripe transfer executed (test mode)
- ✅ Ledger entries updated
- ✅ Balance deducted correctly
- ✅ Email notification sent

**Expected Flow:**
```
Balance Check → Queue Payout → Process Payout → Stripe Transfer → Update Ledger → Notify
```

---

## 🔧 TEST IMPLEMENTATION

### **Phase 1: Setup Infrastructure** (Day 1)

1. Install Playwright
2. Configure test database
3. Create test helpers
4. Set up Stripe test mode

### **Phase 2: Unit Tests** (Day 2)

1. Treasury Gateway validation
2. Wallet ID generation
3. Ledger service functions
4. Split engine calculations

### **Phase 3: Integration Tests** (Day 3)

1. API endpoint tests
2. Database operation tests
3. Passport logging tests
4. Webhook processing tests

### **Phase 4: E2E Tests** (Day 4-5)

1. Full transaction flow
2. Passport verification
3. Revenue split distribution
4. Payout processing

### **Phase 5: Test Execution & Reporting** (Day 6)

1. Run full test suite
2. Generate test report
3. Fix any failures
4. Document results

---

## 📊 SUCCESS CRITERIA

### **Test Coverage:**
- ✅ 100% of Treasury Gateway functions tested
- ✅ 100% of Passport verification logic tested
- ✅ 100% of revenue split scenarios tested
- ✅ All critical user flows tested end-to-end

### **Quality Metrics:**
- ✅ All tests pass
- ✅ No false positives
- ✅ Tests run in < 5 minutes
- ✅ Tests are deterministic (no flakiness)

---

## 🚨 RISK MITIGATION

### **Test Data Isolation:**
- Use separate test database
- Clean up after each test
- Use test Stripe account
- Mock external services

### **Test Reliability:**
- Use deterministic test data
- Avoid time-dependent tests
- Retry flaky tests
- Clear test state between runs

---

## 📝 TEST EXECUTION

### **Run All Tests:**
```bash
npm run test:e2e
```

### **Run Specific Suite:**
```bash
npm run test:e2e:treasury
npm run test:e2e:passport
npm run test:e2e:wallet
```

### **Run in CI:**
```bash
npm run test:e2e:ci
```

---

## ✅ NEXT STEPS

1. ✅ Install Playwright
2. ✅ Create test infrastructure
3. ✅ Write test suites
4. ✅ Execute tests
5. ✅ Report results

---

**Document Owner:** Treasury Engineer  
**Last Updated:** November 23, 2025  
**Status:** Ready for Implementation

