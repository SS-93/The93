# 🏛️ COLISEUM ANALYTICS ENGINE - COMPLETE ARCHITECTURE

**Date:** November 17, 2025
**Status:** 📐 Architecture Complete, Ready for Implementation
**Version:** 2.0 (Event-Sourcing Pattern)

---

## 📊 EXECUTIVE SUMMARY

This document defines the **complete architecture** for the Buckets V2 Analytics Engine, following industry-standard event-sourcing patterns (Segment/Amplitude model) and integrating with the Trinity architecture (Passport → Coliseum).

### **What We're Building:**
A modular, type-safe event tracking system that:
1. **Captures** all user interactions via a single `trackEvent()` function
2. **Stores** events in an append-only canonical log (Passport)
3. **Processes** events asynchronously into aggregated metrics (Coliseum)
4. **Displays** real-time analytics, leaderboards, and insights

### **Core Metrics (Phase 1):**
- ✅ Events attended
- ✅ Money spent
- ✅ Money earned
- ✅ Votes cast

---

## 🎯 3-LAYER ANALYTICS PATTERN

```
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 1: CAPTURE (Client/Server)                    │
│  • Single track() function                                       │
│  • Strong type contracts                                         │
│  • Fire-and-forget (< 50ms)                                      │
├─────────────────────────────────────────────────────────────────┤
│              LAYER 2: CANONICAL LOG (Passport)                   │
│  • Append-only event table                                       │
│  • Idempotent writes                                             │
│  • Tagged with user_id, source, timestamp                        │
├─────────────────────────────────────────────────────────────────┤
│              LAYER 3: AGGREGATED VIEWS (Coliseum)                │
│  • Workers process raw events                                    │
│  • Store into metrics tables                                     │
│  • Materialized views for queries                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📐 SYSTEM ARCHITECTURE

### **Complete Data Flow:**

```
┌────────────────────────────────────────────────────────────────┐
│                   USER INTERACTIONS                            │
│ (play track, cast vote, purchase ticket, attend event)        │
└───────────────┬────────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────────┐
│         CAPTURE LAYER (usePassport Hook)                      │
│  • React: usePassport().logEvent()                            │
│  • Server: logPassportEvent()                                 │
│  • Webhooks: Stripe handlers                                  │
│  • API: /api/passport/log                                     │
└───────────────┬───────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────────┐
│         CANONICAL EVENT LOG (Passport)                        │
│  📊 Table: passport_entries                                   │
│  • id, user_id, event_type, metadata (JSONB)                  │
│  • event_category, entity_type, entity_id                     │
│  • processed_by_* flags (mediaid, treasury, coliseum)         │
│  • session_id, device_id, dna_influence                       │
│  • created_at (TimescaleDB hypertable)                        │
└───────────────┬───────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────────┐
│         PROCESSOR (Edge Function)                             │
│  ⚡ Runs every 10 seconds (cron)                              │
│  1. Batch fetch unprocessed events (LIMIT 100)                │
│  2. Route to system writers (mediaid/treasury/coliseum)       │
│  3. Mark as processed                                         │
│  4. Retry on failure (exponential backoff)                    │
└───────────────┬───────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────────┐
│         COLISEUM METRIC WRITERS                               │
│  • incrementAttendance()                                      │
│  • addMoneySpent()                                            │
│  • addMoneyEarned()                                           │
│  • addVote()                                                  │
│  • trackPlay()                                                │
│  • trackShare()                                               │
└───────────────┬───────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────────┐
│         COLISEUM STORAGE                                      │
│  📈 Tables:                                                   │
│  • coliseum_metrics (raw ingest)                              │
│  • coliseum_rollups (hourly/daily/weekly)                     │
│  • coliseum_leaderboards (cached rankings)                    │
│  • coliseum_reports (generated analytics)                     │
└───────────────┬───────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────────┐
│         READ LAYER (useColiseum Hook)                         │
│  • fetchLeaderboard()                                         │
│  • generateReport()                                           │
│  • Real-time subscriptions                                    │
│  • Dashboard components                                       │
└───────────────────────────────────────────────────────────────┘
```

---

## 🗂️ FILE STRUCTURE

### **Created Files:**

```
src/
├── lib/
│   └── passport/
│       ├── events.ts              ✅ CREATED - Canonical event schema
│       ├── server.ts              ⏳ TODO - Server-side logging
│       └── processor.ts           ⏳ TODO - Processor logic
│
├── lib/coliseum/
│   ├── router.ts                  ⏳ TODO - Event routing
│   ├── writer.ts                  ⏳ TODO - Metric writers
│   └── queries.ts                 ⏳ TODO - Read queries
│
├── hooks/
│   ├── usePassport.tsx            ✅ EXISTS - Client tracking
│   └── useColiseum.tsx            ✅ EXISTS - Read analytics
│
├── pages/api/
│   └── passport/
│       └── log.ts                 ⏳ TODO - Logging endpoint
│
└── functions/
    └── passport-processor/
        └── index.ts               ⏳ TODO - Edge function
```

---

## 📝 IMPLEMENTATION STATUS

### **✅ Phase 1: Foundation (COMPLETE)**

- [x] Event schema definitions (`src/lib/passport/events.ts`)
- [x] TypeScript types for all event payloads
- [x] usePassport hook with logEvent()
- [x] useColiseum hook for reading metrics
- [x] Database tables (passport_entries, coliseum_*)
- [x] RLS policies and indexes
- [x] Documentation

### **⏳ Phase 2: Capture Layer (IN PROGRESS)**

- [ ] Create `/api/passport/log` endpoint
- [ ] Create server-side `logPassportEvent()` helper
- [ ] Integrate tracking in Player components
- [ ] Integrate tracking in Voting components
- [ ] Integrate tracking in Checkout flow
- [ ] Test data flow end-to-end

### **⏳ Phase 3: Processor (TODO)**

- [ ] Create Supabase Edge Function
- [ ] Implement batch fetching logic
- [ ] Build event routing system
- [ ] Create Coliseum metric writers
- [ ] Add retry logic and error handling
- [ ] Deploy and test processor

### **⏳ Phase 4: Display (TODO)**

- [ ] Build JumbotronDashboard component
- [ ] Build LeaderboardWidget component
- [ ] Create event-specific displays
- [ ] Add real-time updates
- [ ] Build analytics report generator

---

## 🔧 IMPLEMENTATION GUIDE

### **Step 1: Create Passport Logging API Endpoint**

**File:** `src/pages/api/passport/log.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PassportEventPayload } from '@/lib/passport/events';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body as PassportEventPayload;

    // Validate payload
    if (!payload.type || !payload.userId || !payload.at) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // TODO: Auth check - ensure req.user.id === payload.userId

    // Insert to Passport
    const { error } = await supabase.from('passport_entries').insert({
      user_id: payload.userId,
      session_id: payload.sessionId,
      device_id: null,
      event_type: payload.type,
      event_category: getEventCategory(payload.type),
      entity_type: null, // Extract from payload
      entity_id: null,
      metadata: payload,
      processed_by_mediaid: false,
      processed_by_treasury: false,
      processed_by_coliseum: false,
      dna_influence: null
    });

    if (error) {
      console.error('[passport/log] Database error:', error);
      return res.status(500).json({ error: 'Failed to log event' });
    }

    // Fast response (< 50ms target)
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('[passport/log] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getEventCategory(eventType: string): string {
  return eventType.split('.')[0];
}
```

---

### **Step 2: Create Server-Side Logging Helper**

**File:** `src/lib/passport/server.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { PassportEventPayload } from './events';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Server-side event logging
 *
 * Use this in:
 * - Stripe webhook handlers
 * - Cron jobs
 * - Server-side API routes
 * - Edge functions
 */
export async function logPassportEvent(
  payload: PassportEventPayload
): Promise<void> {
  try {
    const { error } = await supabase.from('passport_entries').insert({
      user_id: payload.userId,
      session_id: payload.sessionId || null,
      device_id: null,
      event_type: payload.type,
      event_category: payload.type.split('.')[0],
      entity_type: null,
      entity_id: null,
      metadata: payload,
      processed_by_mediaid: false,
      processed_by_treasury: false,
      processed_by_coliseum: false,
      dna_influence: null
    });

    if (error) {
      console.error('[logPassportEvent] Error:', error);
      throw error;
    }

    console.log('[logPassportEvent] Logged:', payload.type);
  } catch (error) {
    console.error('[logPassportEvent] Failed:', error);
    // Don't throw - logging failures shouldn't break business logic
  }
}

/**
 * Log treasury events (money spent/earned)
 */
export async function logTreasuryEvent(args: {
  type: 'money_spent' | 'money_earned';
  userId: string;
  amountCents: number;
  eventId?: string;
  artistId?: string;
  stripeId: string;
  reason?: string;
  role?: string;
}): Promise<void> {
  if (args.type === 'money_spent') {
    return logPassportEvent({
      type: 'treasury.money_spent',
      userId: args.userId,
      amountCents: args.amountCents,
      currency: 'usd',
      reason: (args.reason as any) || 'other',
      eventId: args.eventId,
      artistId: args.artistId,
      stripePaymentIntentId: args.stripeId,
      at: new Date().toISOString(),
    });
  } else {
    return logPassportEvent({
      type: 'treasury.money_earned',
      userId: args.userId,
      amountCents: args.amountCents,
      currency: 'usd',
      role: (args.role as any) || 'platform',
      source: (args.reason as any) || 'other',
      eventId: args.eventId,
      artistId: args.artistId,
      stripeTransferId: args.stripeId,
      at: new Date().toISOString(),
    });
  }
}
```

---

### **Step 3: Create Coliseum Event Router**

**File:** `src/lib/coliseum/router.ts`

```typescript
import { PassportEventPayload } from '../passport/events';
import { ColiseumMetricWriter } from './writer';

/**
 * Route Passport events to Coliseum metric writers
 *
 * This is called by the Passport processor Edge Function
 */
export async function routeToColiseum(entry: {
  id: string;
  user_id: string;
  event_type: string;
  metadata: any;
  created_at: string;
}): Promise<void> {
  const payload = entry.metadata as PassportEventPayload;

  try {
    switch (payload.type) {
      // ═══════════════════════════════════════════════════════════
      // CORE METRIC #1: EVENT ATTENDANCE
      // ═══════════════════════════════════════════════════════════
      case 'concierto.event_attended':
        return await ColiseumMetricWriter.incrementAttendance({
          eventId: payload.eventId,
          userId: payload.userId,
          city: payload.city,
          ticketTier: payload.ticketTier,
          at: payload.at,
        });

      // ═══════════════════════════════════════════════════════════
      // CORE METRIC #2: MONEY SPENT
      // ═══════════════════════════════════════════════════════════
      case 'treasury.money_spent':
        return await ColiseumMetricWriter.addMoneySpent({
          userId: payload.userId,
          amountCents: payload.amountCents,
          eventId: payload.eventId,
          artistId: payload.artistId,
          reason: payload.reason,
          at: payload.at,
        });

      // ═══════════════════════════════════════════════════════════
      // CORE METRIC #3: MONEY EARNED
      // ═══════════════════════════════════════════════════════════
      case 'treasury.money_earned':
        return await ColiseumMetricWriter.addMoneyEarned({
          userId: payload.userId,
          amountCents: payload.amountCents,
          role: payload.role,
          source: payload.source,
          eventId: payload.eventId,
          artistId: payload.artistId,
          at: payload.at,
        });

      // ═══════════════════════════════════════════════════════════
      // CORE METRIC #4: VOTES CAST
      // ═══════════════════════════════════════════════════════════
      case 'coliseum.vote_cast':
        return await ColiseumMetricWriter.addVote({
          userId: payload.userId,
          artistId: payload.artistId,
          eventId: payload.eventId,
          weight: payload.weight,
          channel: payload.channel,
          at: payload.at,
        });

      // ═══════════════════════════════════════════════════════════
      // PLAYER EVENTS
      // ═══════════════════════════════════════════════════════════
      case 'player.track_played':
        return await ColiseumMetricWriter.trackPlay({
          userId: payload.userId,
          trackId: payload.trackId,
          artistId: payload.artistId,
          durationSeconds: payload.durationSeconds,
          at: payload.at,
        });

      case 'player.track_favorited':
        return await ColiseumMetricWriter.addFavorite({
          userId: payload.userId,
          trackId: payload.trackId,
          artistId: payload.artistId,
          at: payload.at,
        });

      // ═══════════════════════════════════════════════════════════
      // SOCIAL EVENTS
      // ═══════════════════════════════════════════════════════════
      case 'social.follow':
        return await ColiseumMetricWriter.addFollow({
          userId: payload.userId,
          targetId: payload.targetId,
          targetType: payload.targetType,
          at: payload.at,
        });

      case 'social.share':
        return await ColiseumMetricWriter.addShare({
          userId: payload.userId,
          targetId: payload.targetId,
          targetType: payload.targetType,
          platform: payload.platform,
          at: payload.at,
        });

      // Ignore events not relevant to Coliseum
      default:
        console.log('[routeToColiseum] Ignoring event:', payload.type);
        return;
    }
  } catch (error) {
    console.error('[routeToColiseum] Error routing event:', error);
    throw error;
  }
}
```

---

### **Step 4: Create Coliseum Metric Writer**

**File:** `src/lib/coliseum/writer.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Coliseum Metric Writers
 *
 * These functions write to coliseum_metrics table
 * with proper aggregation logic
 */
export const ColiseumMetricWriter = {
  /**
   * Increment event attendance count
   */
  async incrementAttendance(args: {
    eventId: string;
    userId: string;
    city: string;
    ticketTier?: string;
    at: string;
  }): Promise<void> {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      event_id: args.eventId,
      metric_type: 'concierto.event_attended',
      metric_value: 1,
      source: 'system',
      metadata: {
        city: args.city,
        ticket_tier: args.ticketTier,
      },
      timestamp: args.at,
    });
  },

  /**
   * Track money spent
   */
  async addMoneySpent(args: {
    userId: string;
    amountCents: number;
    eventId?: string;
    artistId?: string;
    reason: string;
    at: string;
  }): Promise<void> {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      event_id: args.eventId || null,
      artist_id: args.artistId || null,
      metric_type: 'treasury.money_spent',
      metric_value: args.amountCents,
      metric_unit: 'cents',
      source: 'system',
      metadata: {
        reason: args.reason,
      },
      timestamp: args.at,
    });
  },

  /**
   * Track money earned
   */
  async addMoneyEarned(args: {
    userId: string;
    amountCents: number;
    role: string;
    source: string;
    eventId?: string;
    artistId?: string;
    at: string;
  }): Promise<void> {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      event_id: args.eventId || null,
      artist_id: args.artistId || null,
      metric_type: 'treasury.money_earned',
      metric_value: args.amountCents,
      metric_unit: 'cents',
      source: 'system',
      metadata: {
        role: args.role,
        earn_source: args.source,
      },
      timestamp: args.at,
    });
  },

  /**
   * Track vote cast
   */
  async addVote(args: {
    userId: string;
    artistId: string;
    eventId: string;
    weight: number;
    channel: string;
    at: string;
  }): Promise<void> {
    // Increment artist vote count
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      artist_id: args.artistId,
      event_id: args.eventId,
      metric_type: 'coliseum.vote_cast',
      metric_value: args.weight,
      source: 'system',
      metadata: {
        channel: args.channel,
      },
      timestamp: args.at,
    });
  },

  /**
   * Track track play
   */
  async trackPlay(args: {
    userId: string;
    trackId: string;
    artistId: string;
    durationSeconds?: number;
    at: string;
  }): Promise<void> {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      track_id: args.trackId,
      artist_id: args.artistId,
      metric_type: 'player.track_played',
      metric_value: 1,
      source: 'system',
      metadata: {
        duration_seconds: args.durationSeconds,
      },
      timestamp: args.at,
    });
  },

  /**
   * Track favorite
   */
  async addFavorite(args: {
    userId: string;
    trackId: string;
    artistId: string;
    at: string;
  }): Promise<void> {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      track_id: args.trackId,
      artist_id: args.artistId,
      metric_type: 'player.track_favorited',
      metric_value: 1,
      source: 'system',
      timestamp: args.at,
    });
  },

  /**
   * Track follow
   */
  async addFollow(args: {
    userId: string;
    targetId: string;
    targetType: string;
    at: string;
  }): Promise<void> {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      metric_type: 'social.follow',
      metric_value: 1,
      source: 'system',
      metadata: {
        target_id: args.targetId,
        target_type: args.targetType,
      },
      timestamp: args.at,
    });
  },

  /**
   * Track share
   */
  async addShare(args: {
    userId: string;
    targetId: string;
    targetType: string;
    platform: string;
    at: string;
  }): Promise<void> {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      metric_type: 'social.share',
      metric_value: 1,
      source: 'system',
      metadata: {
        target_id: args.targetId,
        target_type: args.targetType,
        platform: args.platform,
      },
      timestamp: args.at,
    });
  },
};
```

---

## 📚 NEXT STEPS

1. **Implement `/api/passport/log` endpoint** (30 min)
2. **Create server-side helpers** (30 min)
3. **Build Coliseum router & writer** (1 hour)
4. **Create Passport processor Edge Function** (2 hours)
5. **Integrate tracking in Player components** (1 hour)
6. **Integrate tracking in Voting components** (1 hour)
7. **Test end-to-end data flow** (1 hour)
8. **Build leaderboard displays** (2 hours)

**Total estimated time: ~10 hours**

---

**Ready to begin implementation?** Start with Step 1 (create the API endpoint) and we'll iterate from there!
