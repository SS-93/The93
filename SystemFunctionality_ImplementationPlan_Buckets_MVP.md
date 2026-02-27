# SystemFunctionality_ImplementationPlan_Buckets_MVP

**Project:** Coliseum Analytics - System Functionality Implementation
**Date:** February 1, 2026
**Executor:** AI Agent (separate IDE)
**Status:** 🟢 READY TO EXECUTE

---

## 🎯 MISSION

Build complete audio tracking pipeline from user play button to leaderboard rankings.

**Pipeline:** User plays audio → Passport logs event → Processor creates mutations → Domain strength updates → Views refresh → Frontend displays rankings

---

## 📊 PRIORITY SYSTEM

| Priority | Feature | Impact | Time | Blocking |
|----------|---------|--------|------|----------|
| **P1** | Audio Tracking Pipeline | 🔴 CRITICAL | 2.5h | YES |
| **P2** | Test Data & Verification | 🔴 CRITICAL | 1h | NO |
| **P3** | Analytics Functions | 🟡 HIGH | 2h | NO |
| **P4** | Treasury Integration | 🟡 MEDIUM | 1h | NO |

**MVP = P1 + P2 = 3.5 hours**

---

# 🎯 PRIORITY 1: AUDIO TRACKING PIPELINE

## Goal: Connect AudioPlayer → Passport → Coliseum → Leaderboard

---

## Task 1.1: Verify Track Object Has Artist ID (15 min)

**Problem:** AudioPlayer must pass `artistId` (UUID) for Coliseum to work.

**File:** `/src/context/AudioPlayerContext.tsx`

**Location:** Check `Track` interface definition (around line 11-32)

**Current interface:**
```typescript
export interface Track {
  id: string
  title: string
  artist: string
  artistId: string  // ← VERIFY THIS EXISTS
  audioUrl: string
  // ... other fields
}
```

**Verification Steps:**

1. **Check if artistId is in Track interface** ✅
2. **Grep codebase for where Tracks are created:**
   ```bash
   grep -r "audioUrl:" src/components/ src/routes/
   ```

3. **Common locations that create Track objects:**
   - `/src/components/artist/ArtistUploadManager.tsx` - When uploading
   - `/src/routes/catalog.tsx` - When displaying catalog
   - `/src/routes/dashboard/artist.tsx` - Artist dashboard

4. **For each location, ensure `artistId` is included:**
   ```typescript
   const track: Track = {
     id: content.id,
     title: content.title,
     artist: content.artist_name,
     artistId: content.artist_id, // ← MUST BE PRESENT
     audioUrl: content.file_url,
     // ...
   };
   ```

**If artistId is missing from Track objects:**

**Option A - Artist ID is in content_items table:**
```typescript
// When fetching content, ensure we select artist_id
const { data: content } = await supabase
  .from('content_items')
  .select('id, title, artist_name, artist_id, file_url, ...')
  //                                  ^^^^^^^^^ Include this
```

**Option B - Artist ID needs to be looked up:**
```typescript
// Add helper function to get artist ID
async function getArtistIdByName(artistName: string): Promise<string | null> {
  const { data } = await supabase
    .from('artist_profiles')
    .select('id')
    .eq('artist_name', artistName)
    .single();

  return data?.id || null;
}

// Use when creating Track:
const artistId = await getArtistIdByName(content.artist_name);
if (!artistId) {
  console.warn('⚠️ Artist ID not found for:', content.artist_name);
}
```

**Deliverable:** Confirm every Track object includes valid `artistId` UUID.

---

## Task 1.2: Add Passport Logging to AudioPlayer (1 hour)

**File:** `/src/context/AudioPlayerContext.tsx`

**Goal:** When track plays for 30+ seconds, log to `passport_entries` table.

### Step A: Import Passport Client

**Location:** Top of file (around line 1-10)

**Add import:**
```typescript
import { passportClient } from '../lib/passport/passportClient'
```

**If passportClient doesn't exist or doesn't have logEvent method, you'll need to create/verify it. See Task 1.3.**

---

### Step B: Find Existing Play Tracking Code

**Location:** Search for `trackPlay` call (around line 505-520)

**Current code looks like:**
```typescript
// Track listening history
const playDuration = Math.floor((currentTime - playStartTimeRef.current) / 1000)

await trackPlay({
  userId: user.id,
  contentId: state.currentTrack.id,
  contentTitle: state.currentTrack.title,
  contentArtist: state.currentTrack.artist,
  contentType: 'music',
  durationSeconds: playDuration,
  totalDuration: state.currentTrack.duration,
  context: 'audio_player'
})
```

---

### Step C: Add Passport Logging AFTER trackPlay

**Add this code immediately after the trackPlay call:**

```typescript
// Log to Passport for Coliseum analytics
try {
  // Verify we have required data
  if (!state.currentTrack.artistId) {
    console.warn('⚠️ Cannot log to Coliseum: artistId missing for track:', state.currentTrack.title);
  } else {
    await passportClient.logEvent({
      userId: user.id,
      eventType: 'audio_play',
      eventData: {
        // Core identifiers
        content_id: state.currentTrack.id,
        content_title: state.currentTrack.title,
        artist_id: state.currentTrack.artistId, // ← CRITICAL: Must be UUID
        artist_name: state.currentTrack.artist,

        // Playback details
        duration_seconds: playDuration,
        total_duration_seconds: state.currentTrack.duration,
        progress_percentage: state.currentTrack.duration
          ? (playDuration / state.currentTrack.duration) * 100
          : 0,

        // Context
        play_context: 'audio_player',
        device_type: 'web',
        timestamp: new Date().toISOString(),

        // Audio features (if available)
        ...(state.currentTrack.audioFeatures && {
          audio_features: state.currentTrack.audioFeatures
        })
      }
    });

    console.log('✅ Coliseum: Audio play logged to Passport', {
      track: state.currentTrack.title,
      artist: state.currentTrack.artist,
      artistId: state.currentTrack.artistId,
      duration: playDuration
    });
  }
} catch (error) {
  console.error('❌ Coliseum: Failed to log audio play to Passport:', error);
  // Don't throw - this is non-critical tracking, don't break playback
}
```

---

### Step D: Test in Browser

**After making changes:**

1. Start dev server: `npm start`
2. Login and play a track for 30+ seconds
3. Check browser console for logs:
   ```
   ✅ Coliseum: Audio play logged to Passport
   ```

4. Check Supabase database:
   ```sql
   SELECT * FROM passport_entries
   WHERE event_type = 'audio_play'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

**Expected:** New row with event_data containing artist_id

---

## Task 1.3: Verify/Create Passport Client (30 min)

**File:** `/src/lib/passport/passportClient.ts`

**Check if this file exists and has `logEvent` method.**

### If File Exists:

**Read the file and verify it has:**

```typescript
class PassportClient {
  async logEvent(params: {
    userId: string;
    eventType: string;
    eventData: Record<string, any>;
  }): Promise<void> {
    // Should insert to passport_entries table
  }
}

export const passportClient = new PassportClient();
```

**Check the logEvent implementation:**

1. Does it insert to `passport_entries` table? ✅
2. Does it use `event_type` column? ✅
3. Does it store `event_data` as JSONB? ✅
4. Does it include `user_id`? ✅
5. Does it auto-set `created_at`? ✅

**If implementation is correct, you're done!**

---

### If File Doesn't Exist or Method Missing:

**Create:** `/src/lib/passport/passportClient.ts`

```typescript
import { supabase } from './supabaseClient';

/**
 * Passport Client - Logs user events to passport_entries table
 * Events are processed by Coliseum processor for analytics
 */

interface LogEventParams {
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
}

class PassportClient {
  /**
   * Log an event to passport_entries
   *
   * @param userId - User ID (UUID)
   * @param eventType - Event type (e.g., 'audio_play', 'treasury.money_spent')
   * @param eventData - Event metadata (stored as JSONB)
   */
  async logEvent({ userId, eventType, eventData }: LogEventParams): Promise<void> {
    try {
      const { error } = await supabase
        .from('passport_entries')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString(),
          // coliseum_processed_at will be NULL (processor sets this)
        });

      if (error) {
        throw error;
      }

      console.log(`📝 Passport: Logged ${eventType} for user ${userId}`);
    } catch (error) {
      console.error('❌ Passport: Failed to log event:', error);
      throw error;
    }
  }

  /**
   * Get user's passport entries
   */
  async getUserEvents(
    userId: string,
    eventType?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('passport_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Passport: Failed to get user events:', error);
      return [];
    }
  }
}

export const passportClient = new PassportClient();
```

**Test the client:**

```typescript
// In browser console:
import { passportClient } from './lib/passport/passportClient';

await passportClient.logEvent({
  userId: 'your-user-id',
  eventType: 'test_event',
  eventData: { test: true }
});

// Check database:
// SELECT * FROM passport_entries WHERE event_type = 'test_event';
```

---

## Task 1.4: Verify Processor Edge Function (30 min)

**Goal:** Understand what the processor does and verify it's correct.

**File Location:** `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/supabase/functions/coliseum-processor/index.ts`

**Read the processor code and verify it:**

### Checklist:

1. **Fetches unprocessed events:**
   ```typescript
   const { data: events } = await supabase
     .from('passport_entries')
     .select('*')
     .is('coliseum_processed_at', null)
     .eq('event_type', 'audio_play')
     .limit(100);
   ```

2. **Extracts artist_id from event_data:**
   ```typescript
   const artistId = event.event_data.artist_id;
   ```

3. **Creates DNA mutations:**
   ```typescript
   const mutation = {
     passport_entry_id: event.id,
     user_id: event.user_id,
     artist_id: artistId,
     domain: 'A', // or T, G, C
     key: 'genre_diversity',
     delta: 1.0,
     weight: 1.0,
     recency_decay: 1.0,
     effective_delta: 1.0,
     occurred_at: event.created_at
   };
   ```

4. **Inserts to coliseum_dna_mutations:**
   ```typescript
   await supabase.from('coliseum_dna_mutations').insert(mutations);
   ```

5. **Marks events as processed:**
   ```typescript
   await supabase
     .from('passport_entries')
     .update({ coliseum_processed_at: new Date().toISOString() })
     .in('id', processedIds);
   ```

6. **Updates domain strength:**
   ```typescript
   await supabase.from('coliseum_domain_strength').upsert({
     entity_id: artistId,
     entity_type: 'artist',
     time_range: '7d',
     a_strength: totalAStrength,
     // ...
   });
   ```

### If Processor Code is Missing or Incorrect:

**You'll need to create/fix it. This is complex - document what you find and report back.**

**For now, assume processor works (we tested it earlier and got "100 events processed").**

---

## Task 1.5: Test Manual Processor Trigger (15 min)

**Goal:** Verify processor can be triggered manually.

**Step 1: Ensure you have logged an audio play event (from Task 1.2)**

**Step 2: Check event exists in database:**
```sql
SELECT
  id,
  event_type,
  event_data->>'artist_id' as artist_id,
  event_data->>'content_title' as track,
  coliseum_processed_at,
  created_at
FROM passport_entries
WHERE event_type = 'audio_play'
  AND coliseum_processed_at IS NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** At least 1 row with NULL coliseum_processed_at

**Step 3: Get your anon key:**
```bash
cd /Users/pks.ml/Desktop/EPK-93/Buckets_SB
cat .env | grep SUPABASE_ANON_KEY
```

**Step 4: Trigger processor:**
```bash
curl -X POST \
  "https://iutnwgvzwyupsuguxnls.supabase.co/functions/v1/coliseum-processor" \
  -H "Authorization: Bearer YOUR_ANON_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "processed": 1,
  "mutations": 1,
  "artists_updated": 1,
  "timestamp": "2026-02-01T..."
}
```

**Step 5: Verify mutation created:**
```sql
SELECT
  domain,
  key,
  delta,
  weight,
  effective_delta,
  occurred_at
FROM coliseum_dna_mutations
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** New rows with recent timestamps

**Step 6: Verify domain strength updated:**
```sql
SELECT
  entity_id,
  entity_type,
  a_strength,
  t_strength,
  g_strength,
  c_strength,
  time_range,
  calculated_at
FROM coliseum_domain_strength
WHERE entity_type = 'artist'
ORDER BY calculated_at DESC
LIMIT 5;
```

**Expected:** Artist's strength increased

---

## Task 1.6: Enable Automatic Processing (15 min)

**Goal:** Processor runs every 5 minutes automatically.

### Option A: Supabase Dashboard CRON (RECOMMENDED)

**Steps:**
1. Go to: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/functions
2. Click on `coliseum-processor`
3. Go to **Settings** tab
4. Find **Cron Schedules** section
5. Add schedule: `*/5 * * * *` (every 5 minutes)
6. Save

**Verify:**
- Wait 5 minutes
- Check processor logs in dashboard
- Check if events are being processed

---

### Option B: Database pg_cron (Alternative)

**Only use if Option A doesn't work.**

**Run this SQL:**
```sql
-- Install pg_cron extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create job to trigger processor every 5 minutes
SELECT cron.schedule(
  'coliseum-processor-auto',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://iutnwgvzwyupsuguxnls.supabase.co/functions/v1/coliseum-processor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify job created
SELECT * FROM cron.job WHERE jobname = 'coliseum-processor-auto';
```

**Note:** Replace `YOUR_SERVICE_ROLE_KEY` with actual service role key from `.env`

---

## ✅ Priority 1 Deliverables

- [ ] Track objects include artistId UUID
- [ ] AudioPlayer logs to passport_entries on play
- [ ] Passport client exists and works
- [ ] Processor code reviewed and verified
- [ ] Manual processor trigger works
- [ ] CRON auto-processing enabled
- [ ] End-to-end test passes (play → mutation → strength)

**Estimated Time:** 2.5 hours

---

# 🎯 PRIORITY 2: TEST DATA & VERIFICATION

## Goal: Create test data and verify complete pipeline works

---

## Task 2.1: Create Test Artist Data (15 min)

**Goal:** Ensure we have artist profiles to test with.

**Check if artists exist:**
```sql
SELECT id, artist_name, created_at
FROM artist_profiles
LIMIT 10;
```

**If no artists exist, create test artists:**
```sql
INSERT INTO artist_profiles (id, user_id, artist_name, bio, created_at)
VALUES
  (gen_random_uuid(), NULL, 'Test Artist Alpha', 'Test artist for Coliseum', NOW()),
  (gen_random_uuid(), NULL, 'Test Artist Beta', 'Test artist for Coliseum', NOW()),
  (gen_random_uuid(), NULL, 'Test Artist Gamma', 'Test artist for Coliseum', NOW())
RETURNING id, artist_name;
```

**Save the artist IDs for testing.**

---

## Task 2.2: Create Test Audio Content (15 min)

**Goal:** Create playable tracks linked to test artists.

**Check content_items table structure:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'content_items'
ORDER BY ordinal_position;
```

**Create test content:**
```sql
INSERT INTO content_items (
  id,
  artist_id,
  artist_name,
  title,
  file_url,
  duration,
  created_at
)
VALUES
  (
    gen_random_uuid(),
    'ARTIST_ID_FROM_2.1',
    'Test Artist Alpha',
    'Test Track 1',
    'https://example.com/test-audio.mp3', -- Use real audio URL if available
    180, -- 3 minutes
    NOW()
  )
RETURNING id, title, artist_name;
```

**Note:** If you have real audio files uploaded, use those instead.

---

## Task 2.3: Simulate Audio Plays (30 min)

**Goal:** Create passport entries as if users played audio.

**Get test user ID:**
```sql
SELECT id, email FROM auth.users LIMIT 1;
```

**Create test audio play events:**
```sql
INSERT INTO passport_entries (
  id,
  user_id,
  event_type,
  event_data,
  created_at
)
VALUES
  (
    gen_random_uuid(),
    'USER_ID_HERE',
    'audio_play',
    jsonb_build_object(
      'content_id', 'CONTENT_ID_HERE',
      'content_title', 'Test Track 1',
      'artist_id', 'ARTIST_ID_HERE',
      'artist_name', 'Test Artist Alpha',
      'duration_seconds', 120,
      'total_duration_seconds', 180,
      'play_context', 'test_data'
    ),
    NOW()
  ),
  -- Add more test plays (change timestamps for variety)
  (
    gen_random_uuid(),
    'USER_ID_HERE',
    'audio_play',
    jsonb_build_object(
      'content_id', 'CONTENT_ID_HERE',
      'content_title', 'Test Track 1',
      'artist_id', 'ARTIST_ID_HERE',
      'artist_name', 'Test Artist Alpha',
      'duration_seconds', 180,
      'total_duration_seconds', 180,
      'play_context', 'test_data'
    ),
    NOW() - INTERVAL '1 hour'
  )
RETURNING id, event_type, event_data->>'artist_name' as artist;
```

**Create plays for multiple artists to populate leaderboard.**

---

## Task 2.4: Run Full Pipeline Test (30 min)

**Complete end-to-end test:**

### Step 1: Check Starting State
```sql
-- Unprocessed events
SELECT COUNT(*) as unprocessed_count
FROM passport_entries
WHERE coliseum_processed_at IS NULL
  AND event_type = 'audio_play';
```

### Step 2: Trigger Processor
```bash
curl -X POST \
  "https://iutnwgvzwyupsuguxnls.supabase.co/functions/v1/coliseum-processor" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Step 3: Verify Events Processed
```sql
SELECT COUNT(*) as processed_count
FROM passport_entries
WHERE coliseum_processed_at IS NOT NULL
  AND event_type = 'audio_play';
```

### Step 4: Check Mutations Created
```sql
SELECT
  domain,
  COUNT(*) as mutation_count,
  ROUND(SUM(effective_delta), 2) as total_strength
FROM coliseum_dna_mutations
GROUP BY domain
ORDER BY domain;
```

**Expected:** Rows for A, T, G, C domains

### Step 5: Check Domain Strength Updated
```sql
SELECT
  ds.entity_id,
  ap.artist_name,
  ds.time_range,
  ds.a_strength,
  ds.t_strength,
  ds.g_strength,
  ds.c_strength,
  ds.composite_strength,
  ds.calculated_at
FROM coliseum_domain_strength ds
JOIN artist_profiles ap ON ap.id = ds.entity_id
WHERE ds.entity_type = 'artist'
ORDER BY ds.calculated_at DESC;
```

**Expected:** Artists with non-zero strengths

### Step 6: Refresh Materialized Views
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_leaderboard_a_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_leaderboard_t_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_leaderboard_g_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_leaderboard_c_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_leaderboard_composite_7d;
```

### Step 7: Query Leaderboard Views
```sql
-- A-domain leaderboard
SELECT
  artist_name,
  domain_strength,
  last_updated
FROM coliseum_leaderboard_a_7d
ORDER BY domain_strength DESC
LIMIT 10;

-- Composite leaderboard
SELECT
  artist_name,
  domain_strength,
  last_updated
FROM coliseum_leaderboard_composite_7d
ORDER BY domain_strength DESC
LIMIT 10;
```

**Expected:** Artists ranked by strength

### Step 8: Test Frontend Display
```bash
npm start
# Navigate to: http://localhost:3000/coliseum
```

**Expected:**
- Leaderboard shows test artists
- Switching domains shows different rankings
- No console errors

---

## ✅ Priority 2 Deliverables

- [ ] Test artists created
- [ ] Test content created
- [ ] Test passport events created
- [ ] Processor processes test events
- [ ] Mutations created for all domains
- [ ] Domain strength calculated
- [ ] Views refreshed with data
- [ ] Frontend displays test leaderboard
- [ ] Screenshot of working leaderboard

**Estimated Time:** 1.5 hours

---

# 🎯 PRIORITY 3: ANALYTICS FUNCTIONS (Advanced)

## Goal: Implement weighted mutations and time decay

---

## Task 3.1: Verify Analytics Functions Exist (10 min)

**Check database for functions:**
```sql
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE 'coliseum%'
  AND routine_schema = 'public'
ORDER BY routine_name;
```

**Expected functions:**
- `coliseum_genre_diversity_score`
- `coliseum_repeat_engagement_rate`
- `coliseum_revenue_per_fan`
- `coliseum_geographic_reach`
- `coliseum_get_artist_dna`

**If functions don't exist:**

Run migration:
```bash
cd /Users/pks.ml/Desktop/EPK-93/Buckets_SB

# Option 1: Dashboard SQL Editor (recommended)
# Copy contents of database/migrations/018_coliseum_analytics_functions.sql
# Paste in https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new
# Run

# Option 2: psql direct
PGPASSWORD=PASSWORD psql "postgresql://postgres.iutnwgvzwyupsuguxnls:PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres" -f /Users/pks.ml/Desktop/93/my-app/database/migrations/018_coliseum_analytics_functions.sql
```

---

## Task 3.2: Implement Tiered Weighting (1 hour)

**File:** Processor Edge Function `/supabase/functions/coliseum-processor/index.ts`

**Add weight calculation function:**

```typescript
/**
 * Calculate event weight based on tier system
 *
 * TIER 1: 0.1   - Low value (skip, search)
 * TIER 2: 1.0   - Standard (play, view)
 * TIER 3: 10.0  - High value (like, save, repeat play)
 * TIER 4: 100.0 - Very high (purchase, tip, share)
 * TIER 5: 1000.0 - Exceptional (superfan, high-value purchase)
 */
function calculateEventWeight(
  eventType: string,
  eventData: Record<string, any>
): number {
  // TIER 2: Standard audio play
  if (eventType === 'audio_play') {
    // Check for repeat play (user played this artist recently)
    if (eventData.is_repeat_play) {
      return 10.0; // TIER 3
    }

    // Check for completion (played >80% of track)
    if (eventData.progress_percentage && eventData.progress_percentage > 80) {
      return 10.0; // TIER 3
    }

    return 1.0; // TIER 2 (standard play)
  }

  // TIER 4: Purchases
  if (eventType === 'treasury.money_spent') {
    const amountCents = eventData.amountCents || 0;

    // TIER 5: High-value purchases ($50+)
    if (amountCents >= 5000) {
      return 1000.0;
    }

    // TIER 4: Standard purchases
    return 100.0;
  }

  // TIER 3: Engagement actions
  if (eventType === 'content.liked' || eventType === 'content.saved') {
    return 10.0;
  }

  // TIER 2: Default
  return 1.0;
}
```

**Use in mutation creation:**

```typescript
const mutations = [];

for (const event of events) {
  const artistId = event.event_data.artist_id;
  const weight = calculateEventWeight(event.event_type, event.event_data);
  const recencyDecay = calculateRecencyDecay(new Date(event.created_at));

  // A-domain: Cultural Identity
  mutations.push({
    passport_entry_id: event.id,
    user_id: event.user_id,
    artist_id: artistId,
    domain: 'A',
    key: 'genre_diversity',
    delta: 1.0,
    weight: weight,
    recency_decay: recencyDecay,
    effective_delta: 1.0 * weight * recencyDecay,
    occurred_at: event.created_at
  });

  // T-domain: Behavioral
  mutations.push({
    passport_entry_id: event.id,
    user_id: event.user_id,
    artist_id: artistId,
    domain: 'T',
    key: 'engagement',
    delta: 1.0,
    weight: weight,
    recency_decay: recencyDecay,
    effective_delta: 1.0 * weight * recencyDecay,
    occurred_at: event.created_at
  });

  // Add G and C domain mutations as needed
}
```

---

## Task 3.3: Implement Time Decay (45 min)

**Add recency decay calculation:**

```typescript
/**
 * Calculate recency decay factor
 *
 * Events lose value over time:
 * - Fresh events (0-7 days): 100% weight
 * - Older events decay linearly
 * - Floor at 10% (events never fully decay)
 *
 * Formula: decay = max(floor, 1.0 - (age / window))
 */
function calculateRecencyDecay(
  eventTimestamp: Date,
  decayWindow: number = 30 * 24 * 60 * 60 * 1000, // 30 days
  floor: number = 0.1
): number {
  const now = Date.now();
  const eventTime = eventTimestamp.getTime();
  const age = now - eventTime;

  // Fresh events within decay window
  if (age < decayWindow) {
    const decay = 1.0 - (age / decayWindow);
    return Math.max(floor, decay);
  }

  // Old events get floor value
  return floor;
}
```

**Test decay function:**

```typescript
// Test cases
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

console.log('1 hour ago:', calculateRecencyDecay(oneHourAgo));   // ~1.0
console.log('1 day ago:', calculateRecencyDecay(oneDayAgo));     // ~0.97
console.log('1 week ago:', calculateRecencyDecay(oneWeekAgo));   // ~0.77
console.log('1 month ago:', calculateRecencyDecay(oneMonthAgo)); // 0.1 (floor)
```

---

## Task 3.4: Document Weight Tiers (15 min)

**Create:** `/supabase/functions/coliseum-processor/WEIGHT_TIERS.md`

```markdown
# Coliseum DNA Weight Tiers

## Overview
Events are weighted by value/engagement level using a 5-tier system.

## Tier Definitions

### TIER 1: Low Value (0.1x)
- Skip track
- Search without play
- Brief view (<10 seconds)

**Use case:** Filter out noise, user exploring

### TIER 2: Standard (1.0x)
- Audio play (standard, <80% completion)
- Profile view
- Content view

**Use case:** Normal engagement, baseline tracking

### TIER 3: High Value (10.0x)
- Audio play >80% completion
- Repeat play within 24 hours
- Like/favorite
- Add to playlist
- Share

**Use case:** Strong engagement signals

### TIER 4: Very High Value (100.0x)
- Purchase (ticket, merch, tip)
- Subscribe to artist
- Follow
- Comment/review

**Use case:** Monetization and loyalty

### TIER 5: Exceptional (1000.0x)
- High-value purchase ($50+)
- Superfan designation
- Event attendance
- Direct support

**Use case:** VIP/superfan behavior

## Implementation

```typescript
function getWeight(eventType: string, eventData: any): number {
  if (eventType === 'audio_play') {
    if (eventData.progress_percentage > 80) return 10.0; // T3
    return 1.0; // T2
  }

  if (eventType === 'treasury.money_spent') {
    if (eventData.amountCents >= 5000) return 1000.0; // T5
    return 100.0; // T4
  }

  return 1.0; // T2 default
}
```

## Time Decay

Events decay over 30 days:
- Day 0-7: 100% weight
- Day 8-30: Linear decay
- Day 30+: Floor at 10%

Formula: `decay = max(0.1, 1.0 - (age_days / 30))`
```

---

## ✅ Priority 3 Deliverables

- [ ] Analytics functions verified/installed
- [ ] Weight tier system implemented in processor
- [ ] Time decay calculation implemented
- [ ] Weight tiers documented
- [ ] Test mutations show correct weights
- [ ] Test mutations show recency decay

**Estimated Time:** 2 hours

---

# 🎯 PRIORITY 4: TREASURY INTEGRATION

## Goal: Connect revenue events to G-domain (Economic Signals)

---

## Task 4.1: Verify Treasury Views Exist (10 min)

**Check for revenue views:**
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name LIKE 'artist_revenue%'
ORDER BY table_name;
```

**Expected:**
- `artist_revenue_summary` (view)
- `artist_event_revenue` (view)
- `artist_revenue_per_fan` (view)

**If views don't exist:**

Run migration:
```bash
# Dashboard SQL Editor
# Copy: /Users/pks.ml/Desktop/93/my-app/database/migrations/013_treasury_coliseum_analytics.sql
# Paste in: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new
# Run
```

**Test views:**
```sql
-- Test revenue summary
SELECT * FROM artist_revenue_summary LIMIT 5;

-- Test revenue per fan
SELECT * FROM artist_revenue_per_fan LIMIT 5;
```

---

## Task 4.2: Add Treasury Event Handling to Processor (30 min)

**File:** Processor Edge Function

**Add handling for treasury.money_spent events:**

```typescript
// In main processing loop:
for (const event of events) {
  const artistId = event.event_data.artist_id;

  if (!artistId) {
    console.warn('Skipping event without artist_id:', event.id);
    continue;
  }

  const weight = calculateEventWeight(event.event_type, event.event_data);
  const recencyDecay = calculateRecencyDecay(new Date(event.created_at));

  // Handle treasury events for G-domain
  if (event.event_type === 'treasury.money_spent') {
    const amountCents = event.event_data.amountCents || 0;
    const amountDollars = amountCents / 100;

    mutations.push({
      passport_entry_id: event.id,
      user_id: event.user_id,
      artist_id: artistId,
      domain: 'G',
      key: 'revenue',
      delta: amountDollars, // Use dollar amount as delta
      weight: weight, // TIER 4 or 5 based on amount
      recency_decay: recencyDecay,
      effective_delta: amountDollars * weight * recencyDecay,
      occurred_at: event.created_at
    });

    mutations.push({
      passport_entry_id: event.id,
      user_id: event.user_id,
      artist_id: artistId,
      domain: 'G',
      key: 'transaction_count',
      delta: 1.0,
      weight: weight,
      recency_decay: recencyDecay,
      effective_delta: 1.0 * weight * recencyDecay,
      occurred_at: event.created_at
    });
  }

  // Handle audio plays (existing code)
  if (event.event_type === 'audio_play') {
    // A, T, C domain mutations...
  }
}
```

---

## Task 4.3: Test Treasury Integration (20 min)

**Create test purchase event:**

```sql
INSERT INTO passport_entries (
  id,
  user_id,
  event_type,
  event_data,
  created_at
)
VALUES
  (
    gen_random_uuid(),
    'USER_ID_HERE',
    'treasury.money_spent',
    jsonb_build_object(
      'artist_id', 'ARTIST_ID_HERE',
      'amountCents', 2500, -- $25
      'reason', 'ticket',
      'event_id', gen_random_uuid()
    ),
    NOW()
  )
RETURNING id, event_type, event_data;
```

**Trigger processor:**
```bash
curl -X POST https://.../coliseum-processor -H "Authorization: Bearer KEY"
```

**Verify G-domain mutation created:**
```sql
SELECT
  domain,
  key,
  delta,
  weight,
  effective_delta
FROM coliseum_dna_mutations
WHERE domain = 'G'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** Mutations with key='revenue' and delta=25.00

**Verify G-strength increased:**
```sql
SELECT
  entity_id,
  g_strength,
  calculated_at
FROM coliseum_domain_strength
WHERE entity_id = 'ARTIST_ID_HERE'
  AND time_range = '7d';
```

**Expected:** g_strength > 0

---

## ✅ Priority 4 Deliverables

- [ ] Treasury views exist and queryable
- [ ] Processor handles treasury.money_spent events
- [ ] G-domain mutations created for purchases
- [ ] G-strength reflects revenue data
- [ ] Test purchase event processes correctly

**Estimated Time:** 1 hour

---

# 📊 COMPLETE TESTING PROTOCOL

## End-to-End Integration Test

**Run this test after completing all priorities:**

### Test Case: Complete Pipeline

**Setup:**
1. Have at least 1 artist profile
2. Have at least 1 content item
3. Have processor enabled

**Execution:**

```sql
-- Step 1: Clear existing test data (optional)
DELETE FROM coliseum_dna_mutations WHERE artist_id = 'TEST_ARTIST_ID';
DELETE FROM passport_entries WHERE event_type = 'audio_play' AND event_data->>'artist_id' = 'TEST_ARTIST_ID';

-- Step 2: Create fresh audio play event
INSERT INTO passport_entries (user_id, event_type, event_data, created_at)
VALUES (
  'USER_ID',
  'audio_play',
  jsonb_build_object(
    'content_id', gen_random_uuid(),
    'artist_id', 'TEST_ARTIST_ID',
    'artist_name', 'Test Artist',
    'duration_seconds', 180
  ),
  NOW()
);

-- Step 3: Verify event created
SELECT * FROM passport_entries
WHERE event_type = 'audio_play'
  AND coliseum_processed_at IS NULL
ORDER BY created_at DESC LIMIT 1;
```

```bash
# Step 4: Trigger processor
curl -X POST https://.../coliseum-processor -H "Authorization: Bearer KEY"
```

```sql
-- Step 5: Verify mutation created
SELECT * FROM coliseum_dna_mutations
WHERE artist_id = 'TEST_ARTIST_ID'
ORDER BY created_at DESC LIMIT 4;

-- Step 6: Verify domain strength updated
SELECT * FROM coliseum_domain_strength
WHERE entity_id = 'TEST_ARTIST_ID'
  AND time_range = '7d';

-- Step 7: Refresh views
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_leaderboard_a_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_leaderboard_composite_7d;

-- Step 8: Verify artist in leaderboard
SELECT artist_name, domain_strength
FROM coliseum_leaderboard_a_7d
WHERE artist_id = 'TEST_ARTIST_ID';
```

```bash
# Step 9: Test frontend
npm start
# Navigate to /coliseum
# Check A-domain tab
# Verify artist appears
```

**Success Criteria:**
- ✅ Event logged to passport
- ✅ Processor created 4 mutations (A, T, G, C)
- ✅ Domain strength updated
- ✅ Views show artist
- ✅ Frontend displays artist in leaderboard
- ✅ All steps completed in <10 minutes

---

## 📚 REFERENCE DOCUMENTATION

### Database Schema Files
- `/database/migrations/011_coliseum_dna_leaderboards.sql` - Views & tables
- `/database/migrations/011b_coliseum_dna_mutations_table.sql` - Mutations table
- `/database/migrations/012_coliseum_enable_processor.sql` - Passport tracking
- `/database/migrations/013_treasury_coliseum_analytics.sql` - Revenue views
- `/database/migrations/018_coliseum_analytics_functions.sql` - Functions

### Frontend Code
- `/src/context/AudioPlayerContext.tsx` - Add Passport logging here
- `/src/lib/passport/passportClient.ts` - Create if missing
- `/src/routes/coliseum-dashboard.tsx` - Frontend display

### Backend Code
- `/supabase/functions/coliseum-processor/index.ts` - Edge Function
- `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/.env` - Environment variables

### Architecture Documents
- `/COLISEUM_GAP_ANALYSIS.md` - System analysis
- `/FrontEnd_ImplementationPlan_Buckets_MVP.md` - Frontend plan
- This document - System functionality plan

---

## 🎯 MILESTONE DEFINITIONS

### Milestone 1: Audio Tracking Works
- Audio play logs to passport ✅
- Processor creates mutations ✅
- Domain strength updates ✅

### Milestone 2: Leaderboard Displays
- At least 1 view has data ✅
- Frontend shows rankings ✅
- No console errors ✅

### Milestone 3: Analytics Live
- Weighted mutations ✅
- Time decay applied ✅
- Multiple domains tracked ✅

### Milestone 4: Treasury Connected
- Revenue events tracked ✅
- G-domain reflects purchases ✅
- End-to-end test passes ✅

---

## ✅ FINAL COMPLETION CHECKLIST

**System is MVP-ready when:**

- [ ] User can play audio in frontend
- [ ] Play automatically logs to passport_entries
- [ ] Processor runs every 5 minutes (CRON)
- [ ] Mutations created with proper weights
- [ ] Domain strength calculated for A, T, G, C
- [ ] Materialized views refresh (manual or auto)
- [ ] Frontend displays ranked artists
- [ ] At least 3 test artists in leaderboard
- [ ] All 4 domain tabs functional
- [ ] Time ranges work (7d, 30d, alltime)
- [ ] End-to-end test completes in <10 min
- [ ] Documentation complete
- [ ] Screenshots captured

---

## 📝 DELIVERABLES

**Provide when complete:**

1. ✅ Screenshots of:
   - Working leaderboard with test data
   - Browser console showing successful logs
   - Database queries showing mutations
   - Domain strength values

2. ✅ SQL verification results:
   - Mutations table (5 rows)
   - Domain strength (3 artists)
   - Leaderboard views (top 5 per domain)

3. ✅ Code changes:
   - Modified AudioPlayerContext.tsx
   - Created/modified passportClient.ts
   - Modified processor (if needed)

4. ✅ Test results:
   - End-to-end test results
   - Any errors encountered
   - Workarounds used

5. ✅ Documentation:
   - Weight tiers document
   - Any deviations from plan
   - Recommendations for next steps

---

**Total Estimated Time:** 7 hours (MVP: 3.5 hours)

**Status:** Ready to execute! 🚀

---

**Priority Order for Execution:**
1. P1: Audio Tracking (2.5h) - MUST HAVE
2. P2: Test & Verify (1h) - MUST HAVE
3. P3: Analytics (2h) - NICE TO HAVE
4. P4: Treasury (1h) - FUTURE

**For MVP: Complete P1 + P2 = 3.5 hours**
