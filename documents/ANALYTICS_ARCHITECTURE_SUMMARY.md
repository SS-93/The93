# 🎯 ANALYTICS ENGINE ARCHITECTURE - EXECUTIVE SUMMARY

**Date:** November 17, 2025
**Status:** ✅ Architecture Complete, Ready for Implementation
**Backend:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB`
**Frontend:** `/Users/pks.ml/Desktop/93/my-app`

---

## 📊 WHAT WE'VE BUILT

### **1. Complete Event Schema** ✅
**File:** `src/lib/passport/events.ts` (650 lines)

- Type-safe event definitions for 40+ event types
- Discriminated union pattern for compile-time safety
- Organized by domain (concierto, treasury, player, social, etc.)
- **Core metrics defined:** Events attended, money spent, money earned, votes

### **2. Database Architecture** ✅
**Tables Created:**

```sql
-- Passport (Event Log)
passport_entries
  ├── user_id, session_id, device_id
  ├── event_type, event_category
  ├── entity_type, entity_id
  ├── metadata (JSONB)
  ├── processed_by_* flags
  └── created_at (TimescaleDB ready)

-- Coliseum (Analytics)
coliseum_metrics          -- Raw event ingest
coliseum_rollups          -- Hourly/daily aggregates
coliseum_leaderboards     -- Cached rankings
coliseum_reports          -- Generated reports
artist_event_participation -- Artist-event linkage
conversion_attributions   -- Funnel tracking
```

### **3. React Hooks** ✅

**usePassport** (Client tracking):
- `logEvent()` - Main tracking function
- Domain-specific helpers (already implemented)
- Fire-and-forget HTTP POST
- Session management

**useColiseum** (Read analytics):
- `fetchLeaderboard()` - Get rankings
- `generateReport()` - Create analytics
- Real-time subscriptions support

### **4. Backend Server** ✅
**Location:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/server.js`

- Express server on port 8000
- Stripe integration working
- Supabase service role configured
- CORS enabled for localhost:3000

**Existing Routes:**
- `/stripe/*` - Payment handling
- Routes in `/Routes/` directory
- API structure in `/api/`

---

## 🎯 ARCHITECTURE PATTERN (Segment/Amplitude Model)

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: CAPTURE                                            │
│  • usePassport().logEvent() (React)                          │
│  • POST /api/passport/log (Backend endpoint - TO BUILD)     │
│  • Server: logPassportEvent() (Helper - TO BUILD)            │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: CANONICAL LOG (Passport)                          │
│  • passport_entries table (append-only)                     │
│  • < 50ms write latency                                      │
│  • processed flags for routing                               │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: PROCESSOR                                          │
│  • Supabase Edge Function (cron: every 10s - TO BUILD)      │
│  • Batch fetch unprocessed events                            │
│  • Route to Coliseum writers                                 │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: COLISEUM (Analytics Engine)                       │
│  • ColiseumMetricWriter (TO BUILD)                           │
│  • Atomic metric increments                                  │
│  • Time-bucketed aggregation                                 │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: DISPLAY                                            │
│  • useColiseum().fetchLeaderboard()                          │
│  • JumbotronDashboard (TO BUILD)                             │
│  • Real-time subscriptions                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION CHECKLIST

### ✅ **PHASE 1: FOUNDATION (COMPLETE)**

- [x] Event schema definitions
- [x] TypeScript types for all payloads
- [x] Database tables (passport_entries, coliseum_*)
- [x] RLS policies and indexes
- [x] usePassport hook
- [x] useColiseum hook
- [x] Backend server running (port 8000)
- [x] Documentation

---

### ⏳ **PHASE 2: BACKEND API (NEXT - 2 hours)**

#### **Task 1: Create Passport Logging Endpoint**
**File:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/Routes/passport.ts`

```typescript
// Add to Routes/passport.ts
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/passport/log
 * Log event to Passport
 */
router.post('/log', async (req, res) => {
  try {
    const payload = req.body;

    // Validate payload
    if (!payload.type || !payload.userId || !payload.at) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Extract event category
    const eventCategory = payload.type.split('.')[0];

    // Insert to passport_entries
    const { error } = await supabase.from('passport_entries').insert({
      user_id: payload.userId,
      session_id: payload.sessionId || null,
      device_id: null,
      event_type: payload.type,
      event_category: eventCategory,
      entity_type: null,
      entity_id: null,
      metadata: payload,
      processed_by_mediaid: false,
      processed_by_treasury: false,
      processed_by_coliseum: false,
      dna_influence: null
    });

    if (error) {
      console.error('[passport/log] Error:', error);
      return res.status(500).json({ error: 'Failed to log event' });
    }

    // Fast response (< 50ms)
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('[passport/log] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

#### **Task 2: Register Route in server.js**
Add to `server.js`:

```javascript
// Import passport routes
const passportRoutes = require('./Routes/passport.ts');

// Register routes
app.use('/api/passport', passportRoutes);
```

#### **Task 3: Update Frontend usePassport to use backend endpoint**
The usePassport hook already points to `/api/passport/log`, so once backend is running, it will work!

---

### ⏳ **PHASE 3: COLISEUM WRITERS (2 hours)**

#### **Task 1: Create Coliseum Writer Module**
**File:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/lib/coliseum/writer.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const ColiseumMetricWriter = {
  async incrementAttendance(args: {
    eventId: string;
    userId: string;
    city: string;
    at: string;
  }) {
    await supabase.from('coliseum_metrics').insert({
      user_id: args.userId,
      event_id: args.eventId,
      metric_type: 'concierto.event_attended',
      metric_value: 1,
      source: 'system',
      metadata: { city: args.city },
      timestamp: args.at,
    });
  },

  // Add other writers (money_spent, money_earned, vote_cast, etc.)
};
```

#### **Task 2: Create Event Router**
**File:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/lib/coliseum/router.ts`

```typescript
import { ColiseumMetricWriter } from './writer';

export async function routeToColiseum(entry: any) {
  const payload = entry.metadata;

  switch (payload.type) {
    case 'concierto.event_attended':
      return ColiseumMetricWriter.incrementAttendance({
        eventId: payload.eventId,
        userId: payload.userId,
        city: payload.city,
        at: payload.at,
      });

    // Add other event routing
  }
}
```

---

### ⏳ **PHASE 4: PASSPORT PROCESSOR (2 hours)**

#### **Option A: Supabase Edge Function**
**File:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/supabase/functions/passport-processor/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch unprocessed events
    const { data: entries } = await supabase
      .from('passport_entries')
      .select('*')
      .eq('processed_by_coliseum', false)
      .order('created_at', { ascending: true })
      .limit(100);

    // Process each entry
    for (const entry of entries || []) {
      await routeToColiseum(entry);

      // Mark as processed
      await supabase
        .from('passport_entries')
        .update({ processed_by_coliseum: true })
        .eq('id', entry.id);
    }

    return new Response(JSON.stringify({ processed: entries?.length || 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### **Option B: Node.js Cron Job (Simpler for now)**
**File:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/scripts/process-passport.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
const { routeToColiseum } = require('../lib/coliseum/router');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processPassport() {
  console.log('[Processor] Starting batch...');

  const { data: entries } = await supabase
    .from('passport_entries')
    .select('*')
    .eq('processed_by_coliseum', false)
    .order('created_at', { ascending: true })
    .limit(100);

  for (const entry of entries || []) {
    try {
      await routeToColiseum(entry);

      await supabase
        .from('passport_entries')
        .update({ processed_by_coliseum: true })
        .eq('id', entry.id);

      console.log(`[Processor] ✓ Processed ${entry.event_type}`);
    } catch (error) {
      console.error(`[Processor] ✗ Failed ${entry.event_type}:`, error);
    }
  }

  console.log(`[Processor] Batch complete. Processed ${entries?.length || 0} events.`);
}

// Run every 10 seconds
setInterval(processPassport, 10000);

// Initial run
processPassport();
```

**Run processor:**
```bash
cd /Users/pks.ml/Desktop/EPK-93/Buckets_SB
node scripts/process-passport.js
```

---

### ⏳ **PHASE 5: INTEGRATE TRACKING (2 hours)**

#### **Track Plays in Player**
```typescript
// In AudioPlayerContext.tsx
import { usePassport } from '@/hooks/usePassport';

const { logEvent } = usePassport();

const handlePlay = (track) => {
  // Play track
  audioRef.current.play();

  // Track to Passport
  logEvent('player.track_played', {
    trackId: track.id,
    artistId: track.artist_id,
    durationSeconds: track.duration,
  });
};
```

#### **Track Votes in Voting**
```typescript
// In VotingCard.tsx
import { usePassport } from '@/hooks/usePassport';

const { logEvent } = usePassport();

const handleVote = () => {
  // Cast vote
  await supabase.from('event_votes').insert({ ... });

  // Track to Passport
  logEvent('coliseum.vote_cast', {
    artistId: artist.id,
    eventId: event.id,
    channel: 'web',
    weight: 1,
  });
};
```

#### **Track Money in Stripe Webhook**
```typescript
// In Routes/stripe.ts webhook handler
import { logPassportEvent } from '../lib/passport/server';

// After successful payment
await logPassportEvent({
  type: 'treasury.money_spent',
  userId: session.metadata.userId,
  amountCents: session.amount_total,
  currency: 'usd',
  reason: 'ticket',
  eventId: session.metadata.eventId,
  stripePaymentIntentId: session.payment_intent,
  at: new Date().toISOString(),
});
```

---

### ⏳ **PHASE 6: BUILD DISPLAYS (3 hours)**

#### **Create Leaderboard Component**
```typescript
// src/components/coliseum/ArtistLeaderboard.tsx
import { useColiseum } from '@/hooks/useColiseum';

export function ArtistLeaderboard() {
  const { leaderboard, loading } = useColiseum({
    leaderboardId: 'top_artists_by_plays',
    realtime: true
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2>🏛️ Top Artists</h2>
      {leaderboard.map(entry => (
        <div key={entry.entity_id} className="flex items-center gap-4">
          <span className="text-2xl font-bold">#{entry.rank}</span>
          <div>
            <div className="font-bold">{entry.entity_name}</div>
            <div className="text-sm text-gray-400">{entry.score} plays</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 QUICK START GUIDE

### **Step 1: Start Backend (5 min)**

```bash
cd /Users/pks.ml/Desktop/EPK-93/Buckets_SB

# Install dependencies (if needed)
npm install express @supabase/supabase-js dotenv cors

# Create passport route file
mkdir -p Routes
# Copy passport.ts content above

# Update server.js to include passport routes

# Start server
node server.js
```

### **Step 2: Test Tracking (5 min)**

```typescript
// In frontend, anywhere:
import { usePassport } from '@/hooks/usePassport';

const { logEvent } = usePassport();

// Test event
logEvent('player.track_played', {
  trackId: 'test-123',
  artistId: 'artist-456',
  durationSeconds: 180,
});
```

Check backend console for POST to `/api/passport/log`
Check database: `SELECT * FROM passport_entries ORDER BY created_at DESC LIMIT 10;`

### **Step 3: Start Processor (5 min)**

```bash
cd /Users/pks.ml/Desktop/EPK-93/Buckets_SB

# Create processor script
mkdir -p scripts
# Copy process-passport.js content above

# Start processor
node scripts/process-passport.js
```

Watch console for processing logs.

### **Step 4: Verify Data Flow (5 min)**

```sql
-- Check Passport events
SELECT event_type, COUNT(*), processed_by_coliseum
FROM passport_entries
GROUP BY event_type, processed_by_coliseum;

-- Check Coliseum metrics
SELECT metric_type, COUNT(*), SUM(metric_value)
FROM coliseum_metrics
GROUP BY metric_type;
```

---

## 📊 CURRENT STATUS SUMMARY

### **✅ Architecture: COMPLETE**
- Event schema defined
- Database tables created
- React hooks implemented
- Backend server running
- Documentation complete

### **⏳ Implementation: 30% COMPLETE**
- Capture layer: usePassport works, needs backend endpoint
- Canonical log: passport_entries table ready
- Processor: Not built yet
- Coliseum writers: Not built yet
- Displays: Partial (useColiseum exists, no UI components)

### **⏳ Data Flow: NOT ACTIVE**
- No events being tracked yet
- No processor running
- No metrics being aggregated
- No leaderboards populated

---

## 🎯 NEXT IMMEDIATE ACTIONS

1. **Create `/api/passport/log` endpoint** (30 min)
2. **Test event logging from frontend** (15 min)
3. **Build Coliseum writer functions** (1 hour)
4. **Build processor script** (1 hour)
5. **Integrate tracking in 1 component** (30 min)
6. **Test end-to-end flow** (30 min)

**Total time to working prototype: ~4 hours**

---

**Ready when you are!** We have a solid foundation and clear path to implementation. Let me know when you want to continue building! 🚀
