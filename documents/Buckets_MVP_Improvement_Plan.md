# Buckets V2 MVP — Improvement Plan

**Generated:** 2026-02-26
**Branch:** `2.0`
**Supabase Project:** `Buckets_V1` (`iutnwgvzwyupsuguxnls`)

---

## Overview

Buckets V2 is an audio/music content platform built on three integrated core systems — **Passport** (event tracking), **Treasury** (financial management), and **Coliseum** (DNA-powered analytics). This document captures a full audit of the codebase, planning documents, and gap analysis as of the current date.

**Overall MVP Readiness: ~65–70%**

The architecture is solid and production-ready. The primary gap is wiring frontend event tracking into the Passport system so data flows through the Coliseum analytics pipeline.

---

## 1. Trinity Architecture Status

### PASSPORT — Canonical Event Log
- Append-only `passport_entries` table for auditability
- 40+ event types with TypeScript discriminated unions
- Processor pipeline routes events to downstream systems
- Event types: audio plays, purchases, votes, social actions, treasury operations
- **Status: 75% Complete** — schema defined, table exists, hook implemented, but not wired to AudioPlayer

### TREASURY — Financial Management
- Double-entry ledger (`treasury_ledger`)
- Revenue split engine (`treasury_splits`) for multi-party payouts
- Stripe webhook integration fully operational
- Wallet ID matching, payout queue, passport verification for fraud prevention
- **Status: 100% Complete** — fully implemented and E2E tested

### COLISEUM — DNA-Powered Analytics
4-domain DNA system:
- **A-Domain (Cultural):** Genre diversity, crossover potential, cultural influence
- **T-Domain (Behavioral):** Fan loyalty, repeat engagement, conversion rates
- **G-Domain (Economic):** Revenue per fan, transaction value, monetization efficiency
- **C-Domain (Spatial):** Geographic reach, touring viability, city distribution

15 materialized views (4 domains × time ranges: 7d, 30d, alltime).
**Status: 70% Complete** — schema and frontend ready, processor not receiving live event data

---

## 2. What Has Been Built

### Database & Backend
- All 18 migrations written and ready
- RLS policies and indexes configured
- Authentication system (direct Supabase Auth, no Edge Function dependency)
- Tables: `passport_entries`, `coliseum_domain_strength`, `coliseum_dna_mutations`, `treasury_ledger`, `treasury_splits`
- 15 materialized views for leaderboards (schema complete, data empty)
- Edge Function: `coliseum-processor`
- Stripe webhook handlers

### Frontend Architecture
- React 18 + TypeScript + React Router
- Tailwind CSS, Stripe Elements, react-dropzone
- Role-based routing and dashboards (fan, artist, brand, developer, admin)
- Global AudioPlayer with Context, queue management, waveform support
- Error boundaries and loading states throughout

### Components Built
| Area | Components |
|------|-----------|
| Auth | Unified auth page, welcome page, reset password form |
| Player | Global audio player, queue management, waveform |
| Treasury | Stripe checkout, receipt modal, payout display |
| Coliseum | Leaderboard cards, artist profile panel, domain selector |
| Concierto | Event creation, ticket tier config, revenue split settings |
| Passport | Timeline viewer |
| Badges | Badge management system |
| Settings | Universal settings panel |
| Companon | Brand platform landing and routing (partial) |

### Hooks & Services
- `useAuth` — Auth state and user profile management
- `usePassport` — Log events to Passport (client-side)
- `useColiseum` — Fetch leaderboards and analytics
- `useColiseumLeaderboard` — Leaderboard-specific data
- `useTreasury` — Treasury operations
- `useStripeCheckout` — Stripe payment integration
- `useBadges` — Badge management
- `passportClient.ts` — Event logging to backend
- `domainCalculator.ts` — DNA strength calculations
- `entitlements.ts` — Plan-based access control
- `processor-logic.ts` — Event processing logic
- Treasury services: `splitEngine.ts`, `ledgerService.ts`, `walletId.ts`
- DNA services: `generator.ts`, `matcher.ts`, `decay.ts`, `influenceWeights.ts`

---

## 3. Feature Status Matrix

| Feature | Code | Database | Frontend | Integration | Overall |
|---------|:----:|:--------:|:--------:|:-----------:|:-------:|
| Passport Event Schema | ✅ | ✅ | ✅ | ⚠️ | 75% |
| Coliseum 4-Domain DNA | ✅ | ✅ | ✅ | ❌ | 70% |
| Treasury Ledger | ✅ | ✅ | ✅ | ✅ | **100%** |
| Audio Player | ✅ | ✅ | ✅ | ✅ | 95% |
| Event Tracking (Audio) | ✅ | ✅ | ⚠️ | ❌ | 50% |
| Event Tracking (Voting) | ✅ | ✅ | ❌ | ❌ | 30% |
| Processor Logic | ✅ | N/A | N/A | ⚠️ | 70% |
| Materialized Views | ✅ | ✅ | ✅ | ❌ | 75% |
| Leaderboard Display | ✅ | N/A | ✅ | ❌ | 85% |
| Coliseum Dashboard | ✅ | N/A | ✅ | ❌ | 85% |
| Concierto Events | ✅ | ✅ | ✅ | ⚠️ | 80% |
| Companon Brand Platform | ⚠️ | ✅ | ⚠️ | ❌ | 60% |
| Stripe Integration | ✅ | N/A | ✅ | ✅ | **100%** |
| Authentication | ✅ | ✅ | ✅ | ✅ | **100%** |
| User Profiles | ✅ | ✅ | ✅ | ✅ | **100%** |

---

## 4. Critical Gaps — Blocking MVP

### GAP 1: AudioPlayer → Passport Not Wired 🔴
- **Issue:** `AudioPlayerContext.tsx` logs to `media_engagement_log`, NOT `passport_entries`
- **Impact:** Zero events flowing into Coliseum pipeline; all leaderboards empty
- **Fix:**
  - Import `passportClient` in `src/context/AudioPlayerContext.tsx`
  - Call `logEvent('audio_play', { artistId, trackId, ... })` when play duration > 30 seconds
  - Ensure Track objects include `artistId` UUID
- **Estimated time:** 30 minutes

### GAP 2: Coliseum Processor Not Receiving Live Events 🔴
- **Issue:** Processor Edge Function exists and works but only has test data
- **Impact:** Leaderboards show "No Rankings Yet" in production
- **Fix:**
  - Confirm `passport_entries` flow from AudioPlayer (resolves Gap 1)
  - Enable CRON trigger every 5 minutes for automatic processing
  - Verify mutations created in `coliseum_dna_mutations`
  - Refresh all 15 materialized views
- **Estimated time:** 1–2 hours

### GAP 3: Materialized Views Are Empty 🔴
- **Issue:** Views are defined in schema but no data populating them
- **Impact:** Coliseum dashboard shows empty state despite UI being ready
- **Fix:**
  - Generate test events in `passport_entries`
  - Run processor to create mutations
  - Execute: `REFRESH MATERIALIZED VIEW coliseum_leaderboard_a_7d;` (×15 views)
- **Estimated time:** 30 minutes

### GAP 4: Payment Events Not Logged to Passport 🔴
- **Issue:** Stripe webhooks update Treasury but do NOT log to Passport
- **Impact:** G-domain (economic DNA) has no revenue data
- **Fix:**
  - Add Passport logging inside Treasury webhook handlers
  - Log `treasury.money_spent` and `treasury.money_earned` events with `artistId`
- **Estimated time:** 30 minutes

---

## 5. Medium Priority Gaps

### GAP 5: Voting & Social Events Not Wired 🟡
- **Missing:** Vote events, social actions, event attendance not connected to Passport
- **Impact:** Incomplete DNA picture — only audio plays tracked
- **Fix:** Add `logEvent()` calls in voting components, attendance flows, social interactions
- **Estimated time:** 2–3 hours

### GAP 6: Processor Performance Untested at Scale 🟡
- **Issue:** Edge Function not benchmarked under load
- **Fix:** Batch processing optimization, query indexes, error handling + retry logic
- **Estimated time:** 2–3 hours

### GAP 7: Weight Tier & Time Decay Not Implemented 🟡
- **Issue:** Schema defines 5-tier weighting (0.1× to 1000×) and 30-day time decay with 10% floor — not yet in processor code
- **Fix:** Implement `calculateEventWeight()` and `calculateRecencyDecay()` in processor
- **Estimated time:** 1–2 hours

---

## 6. Lower Priority Gaps

### GAP 8: No Real-Time Leaderboard Updates 🟠
- Leaderboards refresh on page load only
- **Fix:** Add Supabase real-time subscriptions — **2–3 hours**

### GAP 9: Companon System Incomplete 🟠
- Landing page and basic routing only (60%)
- Missing: Campaign creation, DNA targeting, analytics dashboard
- **Fix:** Full Companon build — **4–5 hours**

### GAP 10: Monetization UX Incomplete 🟠
- Stripe works but UX is 30% complete
- Missing: Digital ticket wallet, receipt modal, transaction history pages
- **Fix:** UX completion — **4–5 hours**

### GAP 11: QR Code Ticket Validation Not Built 🟠
- No scanning, validation UI, or attendance tracking
- **Fix:** QR implementation — **3–4 hours**

---

## 7. Immediate Action Plan (MVP in ~4 Hours)

| Priority | Task | File | Time |
|----------|------|------|------|
| 1 | Wire AudioPlayer → Passport `logEvent` | `src/context/AudioPlayerContext.tsx` | 30 min |
| 2 | Seed test events in `passport_entries` | Supabase Dashboard / SQL | 30 min |
| 3 | Trigger processor + refresh 15 views | Edge Function + SQL | 30 min |
| 4 | Verify `/coliseum` leaderboards populate | Browser | 30 min |
| 5 | Add Passport logging to Treasury webhooks | `src/lib/treasury/gateway.ts` | 1 hr |
| 6 | Enable CRON for automatic processing | Supabase Dashboard | 15 min |

**Total: ~3.5 hours to fully operational MVP with live leaderboards**

---

## 8. Full Launch Backlog (Following Sprint)

1. Implement weight tier system in processor (`calculateEventWeight`)
2. Implement time decay calculations (`calculateRecencyDecay`)
3. Wire voting + social event tracking to Passport
4. Complete Monetization UX (receipts, ticket wallet, history)
5. Build Companon campaign creation + DNA targeting
6. QR code ticket scanning + attendance validation
7. E2E testing suite and security audit
8. Real-time leaderboard subscriptions via Supabase channels

---

## 9. Coliseum Access Tiers (Entitlements)

| Plan | Price | Leaderboard Access | Domains |
|------|-------|--------------------|---------|
| Public | Free (no login) | Top 50 artists | A-domain only |
| Free Plan | Free (logged in) | Top 10 artists | A-domain only |
| Basic | $29/mo | Top 25 artists | A-domain only |
| Pro | $99/mo | Top 100 artists | All 4 domains |
| Enterprise | Custom | Unlimited | All 4 domains |

---

## 10. Technical Stack Reference

**Frontend:** React 18, TypeScript, React Router, Tailwind CSS, Stripe Elements
**Backend:** Supabase (Auth, DB, Edge Functions), PostgreSQL, Stripe webhooks
**Key Tables:** `passport_entries`, `coliseum_domain_strength`, `coliseum_dna_mutations`, `treasury_ledger`, `treasury_splits`
**Supabase Project:** `Buckets_V1` — ref `iutnwgvzwyupsuguxnls`
**Frontend Repo:** `/Users/pks.ml/Desktop/93/my-app`
**Backend Repo:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB`
