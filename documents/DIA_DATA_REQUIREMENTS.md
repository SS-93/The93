# 🔍 DIA DATA REQUIREMENTS

**Purpose:** Define all data sources needed for DIA dashboard to mirror Supabase and analyze MediaID DNA interactions

**Status:** Data mapping complete
**Last Updated:** 2025-11-09

---

## 📊 DATA ARCHITECTURE OVERVIEW

The DIA (Department of Internal Affairs) dashboard needs to:

1. **Mirror Supabase Tables** - Admin view of all database tables
2. **Track MediaID Interactions** - All user interactions for DNA mirroring
3. **Analyze DNA Evolution** - Show how interactions influence 4-domain DNA
4. **Monitor System Health** - Real-time metrics across all systems

---

## 🗄️ PRIMARY DATA SOURCES

### 1. **Authentication & Identity**

**Tables:**
- `auth.users` - Supabase auth users
- `profiles` - Extended user profiles (display_name, role, etc.)
- `media_ids` - MediaID profiles with ATGC bases + DNA vectors

**Key Fields:**
```typescript
{
  // Auth
  user_id: UUID
  email: string
  created_at: timestamp
  last_sign_in_at: timestamp
  email_confirmed_at: timestamp

  // Profile
  display_name: string
  role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'

  // MediaID (ATGC Bases)
  interests: string[]              // A - Adenine
  genre_preferences: string[]      // T - Thymine
  content_flags: JSONB             // G - Guanine
  location_code: string            // C - Cytosine (spatial)

  // DNA (4-Domain Vectors)
  profile_embedding: number[1536]  // Composite DNA
  // Future: culturalDNA, behavioralDNA, economicDNA, spatialDNA (384-d each)
}
```

**DIA Matrix:** User Matrix
**Query Performance:** Materialized view refreshed every 5 minutes

---

### 2. **MediaID Interactions (DNA Helix)**

**Tables:**
- `listening_history` - Playback events
- `media_engagement_log` - All user interactions with content
- `listening_sessions` - Session aggregation (if exists)

**Interaction Types:**
```typescript
// From listening_history
type ListeningEvent =
  | 'played'
  | 'completed'
  | 'skipped'
  | 'added_to_queue'
  | 'downloaded'

// From media_engagement_log
type EngagementEvent =
  | 'track_play'
  | 'track_complete'
  | 'track_skip'
  | 'track_favorite'
  | 'track_unfavorite'
  | 'track_share'
  | 'track_download'
  | 'artist_follow'
  | 'artist_unfollow'
  | 'playlist_create'
  | 'playlist_add'
```

**Key Fields:**
```typescript
{
  // Identity
  user_id: UUID
  session_id: UUID

  // Target
  content_id: UUID
  content_title: string
  artist_name: string

  // Context
  event_type: string
  play_duration: number           // seconds
  progress_percentage: number     // 0-100
  metadata: JSONB                 // device, source, context

  // Temporal
  created_at: timestamp
}
```

**DNA Influence Mapping:**
Each interaction type has weights across 4 domains:
- **Cultural DNA** (40% default): Genre/mood preferences
- **Behavioral DNA** (30% default): Listening patterns
- **Economic DNA** (15% default): Purchase signals
- **Spatial DNA** (15% default): Location context

See: `/src/lib/dna/influenceWeights.ts` for complete mapping

**DIA Matrices:**
- Media Engagement Log Matrix
- Listening History Matrix

---

### 3. **Concierto (Events & Voting)**

**Tables:**
- `events` - Concert/event listings
- `event_votes` - User votes for artists
- `event_attendees` - Event attendance tracking

**Key Fields:**
```typescript
{
  // Event
  event_id: UUID
  title: string
  host_id: UUID
  location: string
  event_date: timestamp
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled'

  // Vote
  user_uuid: UUID
  artist_id: UUID
  event_id: UUID
  created_at: timestamp
}
```

**DNA Influence:**
- `concierto.vote_cast`: High cultural (0.9), high spatial (0.8)
- `concierto.event_attend`: Medium cultural (0.6), high spatial (0.9)

**DIA Matrices:**
- Events Matrix
- Voting Matrix

---

### 4. **Content & Artists**

**Tables:**
- `content_items` - Uploaded tracks/media
- `artist_profiles` - Artist information

**Key Fields:**
```typescript
{
  // Content
  content_id: UUID
  title: string
  artist_name: string
  artist_id: UUID
  duration: number
  file_type: string
  checksum: string
  created_at: timestamp

  // Artist
  artist_id: UUID
  user_id: UUID
  artist_name: string
  bio: string
  verified: boolean
  created_at: timestamp
}
```

**DIA Matrices:**
- Content Matrix
- Artist Matrix

---

### 5. **Treasury (Financial) - Future**

**Tables (to be created):**
- `treasury_accounts` - User balances
- `treasury_transactions` - All financial events
- `payout_contracts` - Artist payment terms

**Key Fields:**
```typescript
{
  // Account
  user_id: UUID
  balance_cents: number
  pending_cents: number
  lifetime_earned_cents: number
  stripe_connect_account_id: string

  // Transaction
  transaction_type: 'track_play' | 'track_purchase' | 'tip' | 'subscription' | 'payout'
  from_user_id: UUID
  to_user_id: UUID
  amount_cents: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  split_breakdown: JSONB
  stripe_payment_intent_id: string
}
```

**DNA Influence:**
- `treasury.track_purchase`: High economic (0.9), high cultural (0.8)
- `treasury.artist_tip`: Very high economic (0.95), medium cultural (0.6)
- `treasury.subscription_start`: High economic (0.85), medium behavioral (0.5)

**DIA Matrices:**
- Treasury Transaction Matrix
- Treasury Account Matrix

---

### 6. **Coliseum (Analytics & Rankings) - Future**

**Tables (to be created):**
- `coliseum_metrics` - All tracked interactions
- `leaderboards` - Pre-aggregated rankings

**Key Fields:**
```typescript
{
  // Metric
  metric_type: string
  user_id: UUID
  entity_type: 'track' | 'artist' | 'event' | 'playlist'
  entity_id: UUID
  base_score: number
  weighted_score: number
  context: JSONB
  created_at: timestamp

  // Leaderboard
  leaderboard_type: 'artists_weekly' | 'tracks_daily' | 'events_monthly'
  period_start: timestamp
  period_end: timestamp
  rankings: JSONB  // [{ rank: 1, entity_id: "uuid", score: 1250.5 }]
}
```

**DNA Influence:**
Coliseum doesn't directly influence DNA - it's a **read layer** that aggregates interactions already logged elsewhere. However, high Coliseum scores can trigger:
- Artist discovery recommendations (cultural DNA)
- Trending content surfacing (behavioral DNA)

**DIA Matrices:**
- Coliseum Metrics Matrix
- Leaderboard Matrix

---

### 7. **Passport (Universal Event Log) - Future**

**Tables (to be created):**
- `passport_entries` - Immutable event log

**Key Fields:**
```typescript
{
  // Identity
  user_id: UUID
  session_id: UUID
  device_id: string

  // Event
  event_type: string              // 50+ event types
  event_category: 'player' | 'concierto' | 'treasury' | 'coliseum' | 'social' | 'system'

  // Target
  entity_type: 'track' | 'artist' | 'event' | 'transaction'
  entity_id: UUID

  // Flexible metadata
  metadata: JSONB

  // Processing flags
  processed_by_mediaid: boolean
  processed_by_treasury: boolean
  processed_by_coliseum: boolean
  processed_at: timestamp

  // Immutable
  created_at: timestamp
}
```

**Purpose:**
- **Event sourcing** - Single source of truth for all user actions
- **System integration** - Passport processor feeds MediaID, Treasury, Coliseum
- **Audit trail** - Immutable log for compliance and debugging
- **DNA mirroring** - Primary input for DNA evolution

**DNA Influence:**
Passport is the **input layer** - all events flow through Passport, then DNA mirroring applies influence weights based on event_type.

**DIA Matrix:** Passport Matrix (shows all events with DNA influence weights visualized)

---

## 🧬 DNA MIRRORING DATA FLOW

### Current State (Partial Implementation)

```
User Interaction
    ↓
listening_history OR media_engagement_log OR event_votes
    ↓
[Manual processing - not automated yet]
    ↓
DNA Update (profile_embedding)
```

### Target State (Full Passport Integration)

```
User Interaction
    ↓
Passport Entry (immutable log)
    ↓
Passport Processor (background job)
    ├→ MediaID DNA Mirroring
    │   ├─ Fetch user DNA (4 domains)
    │   ├─ Fetch entity DNA (track/artist/event)
    │   ├─ Apply influence weights
    │   ├─ Apply user multipliers
    │   ├─ Calculate exponential moving average
    │   └─ Save updated DNA
    ├→ Treasury Processing
    │   └─ Create transaction records
    └→ Coliseum Processing
        └─ Update metrics & leaderboards
```

**Key Functions:**
- `/src/lib/dna/mirroring.ts` - `mirrorInteractionToDNA()`
- `/src/lib/dna/influenceWeights.ts` - `getInfluenceWeights()`, `applyUserMultipliers()`
- `/src/lib/passport/processor.ts` - `processPassportEntries()`

---

## 📊 DIA DASHBOARD DATA QUERIES

### Query 1: User DNA State

**Purpose:** Show user's current ATGC bases + 4-domain DNA vectors

**Query:**
```sql
SELECT
  u.id,
  u.email,
  p.display_name,
  p.role,

  -- ATGC Bases
  m.interests,              -- A
  m.genre_preferences,      -- T
  m.content_flags,          -- G
  m.location_code,          -- C

  -- DNA State
  m.profile_embedding,      -- Composite DNA (1536-d)
  m.profile_embedding IS NOT NULL as has_dna,
  m.updated_at as dna_last_updated,

  -- Interaction counts
  COALESCE(lh.listening_count, 0) as listening_count,
  COALESCE(mel.engagement_count, 0) as engagement_count,
  COALESCE(ev.vote_count, 0) as vote_count

FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN media_ids m ON m.user_uuid = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as listening_count
  FROM listening_history GROUP BY user_id
) lh ON lh.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as engagement_count
  FROM media_engagement_log GROUP BY user_id
) mel ON mel.user_id = u.id
LEFT JOIN (
  SELECT user_uuid, COUNT(*) as vote_count
  FROM event_votes GROUP BY user_uuid
) ev ON ev.user_uuid = u.id
WHERE u.id = :user_id;
```

---

### Query 2: Interaction Timeline (Combined)

**Purpose:** Show all interactions chronologically for DNA analysis

**Query:**
```sql
SELECT
  'listening' as source,
  lh.event_type as interaction_type,
  lh.content_id as entity_id,
  'track' as entity_type,
  c.title as entity_name,
  c.artist_name,
  lh.play_duration,
  lh.progress_percentage,
  lh.session_id,
  lh.created_at
FROM listening_history lh
LEFT JOIN content_items c ON c.id = lh.content_id
WHERE lh.user_id = :user_id

UNION ALL

SELECT
  'engagement' as source,
  mel.event_type,
  mel.content_id,
  'track' as entity_type,
  c.title,
  c.artist_name,
  NULL as play_duration,
  NULL as progress_percentage,
  mel.session_id,
  mel.created_at
FROM media_engagement_log mel
LEFT JOIN content_items c ON c.id = mel.content_id
WHERE mel.user_id = :user_id

UNION ALL

SELECT
  'voting' as source,
  'vote_cast' as interaction_type,
  ev.event_id,
  'event' as entity_type,
  e.title,
  ap.artist_name,
  NULL,
  NULL,
  NULL as session_id,
  ev.created_at
FROM event_votes ev
LEFT JOIN events e ON e.id = ev.event_id
LEFT JOIN artist_profiles ap ON ap.id = ev.artist_id
WHERE ev.user_uuid = :user_id

ORDER BY created_at DESC;
```

---

### Query 3: DNA Influence Summary

**Purpose:** Show what interaction types this user has performed and their influence weights

**Query:**
```sql
SELECT
  interaction_type,
  COUNT(*) as occurrence_count,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM (
  SELECT event_type as interaction_type, created_at
  FROM listening_history
  WHERE user_id = :user_id

  UNION ALL

  SELECT event_type as interaction_type, created_at
  FROM media_engagement_log
  WHERE user_id = :user_id

  UNION ALL

  SELECT 'vote_cast' as interaction_type, created_at
  FROM event_votes
  WHERE user_uuid = :user_id
) interactions
GROUP BY interaction_type
ORDER BY occurrence_count DESC;
```

**Frontend Enhancement:**
Join with influence weights from `/src/lib/dna/influenceWeights.ts`:
```typescript
const rows = await queryInteractionSummary(userId)
const enriched = rows.map(row => ({
  ...row,
  weights: getInfluenceWeights(row.interaction_type),
  totalInfluence: row.occurrence_count * getInfluenceWeights(row.interaction_type).baseIntensity
}))
```

---

### Query 4: Session Analysis

**Purpose:** Group interactions by session for behavioral DNA analysis

**Query:**
```sql
SELECT
  lh.session_id,
  COUNT(*) as tracks_played,
  COUNT(DISTINCT lh.content_id) as unique_tracks,
  MIN(lh.created_at) as session_start,
  MAX(lh.created_at) as session_end,
  EXTRACT(EPOCH FROM (MAX(lh.created_at) - MIN(lh.created_at))) as session_duration_seconds,
  AVG(lh.progress_percentage) as avg_completion_rate,

  -- Dominant genre (if audio_features table exists)
  MODE() WITHIN GROUP (ORDER BY af.genre) as dominant_genre

FROM listening_history lh
LEFT JOIN content_items c ON c.id = lh.content_id
LEFT JOIN audio_features af ON af.content_id = c.id
WHERE lh.user_id = :user_id
  AND lh.session_id IS NOT NULL
GROUP BY lh.session_id
ORDER BY session_start DESC;
```

---

### Query 5: Genre/Artist Affinity

**Purpose:** Calculate cultural DNA signals from listening patterns

**Query:**
```sql
SELECT
  c.artist_name,
  COUNT(*) as play_count,
  AVG(lh.progress_percentage) as avg_completion_rate,
  SUM(lh.play_duration) as total_listen_time_seconds,
  MIN(lh.created_at) as first_listen,
  MAX(lh.created_at) as last_listen,

  -- Engagement signals
  EXISTS(
    SELECT 1 FROM media_engagement_log mel
    WHERE mel.user_id = lh.user_id
      AND mel.content_id = lh.content_id
      AND mel.event_type = 'track_favorite'
  ) as has_favorited

FROM listening_history lh
LEFT JOIN content_items c ON c.id = lh.content_id
WHERE lh.user_id = :user_id
  AND lh.event_type = 'played'
GROUP BY c.artist_name
ORDER BY play_count DESC;
```

---

## 🎯 DATA READINESS CHECKLIST

### ✅ Existing Data (Ready for DIA Dashboard)

- [x] auth.users - Supabase auth
- [x] profiles - User profiles
- [x] media_ids - MediaID with ATGC bases
- [x] listening_history - Playback tracking
- [x] media_engagement_log - Interaction tracking
- [x] events - Concierto events
- [x] event_votes - Event voting
- [x] content_items - Uploaded content
- [x] artist_profiles - Artist info
- [x] subscriptions - Subscription data (if exists)

### ❌ Missing Data (Need to Create)

- [ ] treasury_accounts - User balances
- [ ] treasury_transactions - Financial events
- [ ] payout_contracts - Artist payment terms
- [ ] coliseum_metrics - Tracked interactions
- [ ] leaderboards - Pre-aggregated rankings
- [ ] passport_entries - Universal event log

### 🔄 Migration Status

- [ ] Treasury migration: `20250930160000_create_treasury_system.sql`
- [ ] Coliseum migration: `20250930170000_create_coliseum_system.sql`
- [ ] Passport migration: `20250930180000_create_passport_system.sql`
- [ ] DIA user matrix view: `YYYYMMDDHHMMSS_create_dia_user_matrix_view.sql`

---

## 📝 TEST USER DATA COLLECTION

**Test Account:** dmstest49@gmail.com
**User ID:** 15480116-8c78-4a75-af8c-2c70795333a6

**Queries to Run:**
See `/documents/QUERY_TEST_USER_INTERACTIONS.sql` for complete queries.

**Run in Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/iutnwgvzwyupsuguxnls/sql/new
2. Copy queries from QUERY_TEST_USER_INTERACTIONS.sql
3. Run each query and document results
4. Update TEST_USER_DATA.md with actual values

**Expected Data:**
- User profile + MediaID state
- 20-50 listening history entries
- 10-30 engagement log entries
- 5-10 listening sessions
- 0-5 event votes
- Genre/artist affinity data

This data will validate:
- DNA influence weight calculations work correctly
- DIA dashboard displays real interactions
- User Matrix expandable detail shows complete user journey

---

## 🚀 NEXT STEPS

1. **Run test user queries** - Populate TEST_USER_DATA.md with real data
2. **Create materialized views** - For User Matrix performance
3. **Build generic DIAMatrix components** - Reusable UI library
4. **Implement User Matrix MVP** - First dashboard with test data
5. **Validate DNA influence calculations** - Use test user interactions
6. **Create Treasury/Coliseum migrations** - Enable remaining matrices
7. **Build Passport system** - Unified event log

---

**Status:** Data requirements documented, ready for queries
**Last Updated:** 2025-11-09
**Next Action:** Run QUERY_TEST_USER_INTERACTIONS.sql in Supabase Dashboard
