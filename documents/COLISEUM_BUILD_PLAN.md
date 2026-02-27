# 🏛️ COLISEUM ANALYTICS ENGINE - BUILD PLAN

**Project:** Coliseum Analytics Engine (Trinity System #3)
**Date:** 2025-11-09
**Status:** 🚧 Planning Phase
**Integration:** Passport → Coliseum Analytics Pipeline

---

## 📋 EXECUTIVE SUMMARY

Building the **Coliseum Analytics Engine** - the "Jumbotron" of Buckets Nation. This system consumes events from Passport and transforms them into actionable analytics: leaderboards, reports, DNA insights, and real-time metrics.

**Key Insight:** We already have:
- ✅ Passport logging all events to `passport_entries` table
- ✅ Types defined in `/src/types/coliseum.ts`
- ✅ Hook skeleton in `/src/hooks/useColiseum.tsx`
- ✅ Event routing in usePassport (50+ event types)

**What We're Building:**
1. Database tables for Coliseum metrics and aggregations
2. Background processor to consume Passport events
3. Analytics dashboard with real-time leaderboards
4. Report generation system
5. DNA-enriched audience insights

---

## 🎯 COLISEUM CONCEPT

**Metaphor:** A massive Roman Coliseum with a futuristic jumbotron displaying real-time stats, leaderboards, and heatmaps.

**What Coliseum Tracks:**
- 🎵 Music plays, skips, favorites (Player)
- 🎪 Event attendance, votes, engagement (Concierto)
- 🔗 Link shares and opens (CALS)
- 💰 Purchases and subscriptions (Treasury)
- 🧬 DNA evolution and matching (MediaID)
- 🗺️ Geographic resonance (Vault Map)
- 🏆 City-to-City tournament rankings

**Data Flow:**
```
User Action
    ↓
Passport Entry (passport_entries)
    ↓
Background Processor (Edge Function)
    ↓
Coliseum Aggregation (coliseum_metrics, coliseum_rollups)
    ↓
Analytics Dashboard / Reports / Leaderboards
```

---

## 🗄️ DATABASE SCHEMA

### **Table 1: coliseum_metrics** (Raw Event Store)

```sql
CREATE TABLE coliseum_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Entity identifiers
  user_id UUID REFERENCES auth.users(id),
  artist_id UUID REFERENCES artist_profiles(id),
  event_id UUID REFERENCES events(id),
  track_id UUID,
  brand_id UUID,

  -- Metric details
  metric_type TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 1,
  metric_unit TEXT,

  -- Context
  source TEXT DEFAULT 'web',
  session_id TEXT,

  -- DNA context (for DNA-enriched analytics)
  dna_match_score NUMERIC,
  dna_domain TEXT,

  -- Attribution
  attribution_id TEXT,
  campaign_id TEXT,

  -- Metadata (flexible JSONB)
  metadata JSONB DEFAULT '{}',

  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_coliseum_metrics_user_time ON coliseum_metrics(user_id, timestamp DESC);
CREATE INDEX idx_coliseum_metrics_artist ON coliseum_metrics(artist_id, timestamp DESC);
CREATE INDEX idx_coliseum_metrics_event ON coliseum_metrics(event_id, timestamp DESC);
CREATE INDEX idx_coliseum_metrics_type ON coliseum_metrics(metric_type, timestamp DESC);
CREATE INDEX idx_coliseum_metrics_unprocessed ON coliseum_metrics(processed, timestamp) WHERE NOT processed;
CREATE INDEX idx_coliseum_metrics_metadata ON coliseum_metrics USING GIN (metadata);

-- Enable TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('coliseum_metrics', 'timestamp', if_not_exists => TRUE);
```

### **Table 2: coliseum_rollups** (Aggregated Metrics)

```sql
CREATE TABLE coliseum_rollups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Entity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'event', 'track', 'user', 'city', 'brand')),
  entity_id TEXT NOT NULL,

  -- Time window
  period TEXT NOT NULL CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly', 'all_time')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Aggregated metrics (JSONB for flexibility)
  metrics JSONB DEFAULT '{}',

  -- Sample structure:
  -- {
  --   "plays": 1250,
  --   "unique_listeners": 850,
  --   "avg_completion_rate": 0.78,
  --   "favorites": 120,
  --   "shares": 45,
  --   "votes": 320,
  --   "revenue_cents": 45000,
  --   "avg_dna_match": 0.72
  -- }

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(entity_type, entity_id, period, period_start)
);

CREATE INDEX idx_coliseum_rollups_entity ON coliseum_rollups(entity_type, entity_id, period_start DESC);
CREATE INDEX idx_coliseum_rollups_period ON coliseum_rollups(period, period_start DESC);
```

### **Table 3: coliseum_leaderboards** (Cached Rankings)

```sql
CREATE TABLE coliseum_leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Leaderboard config
  leaderboard_id TEXT NOT NULL,
  leaderboard_name TEXT NOT NULL,

  -- Entry details
  rank INTEGER NOT NULL,
  previous_rank INTEGER,

  -- Entity
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_image_url TEXT,

  -- Score
  score NUMERIC NOT NULL,
  score_type TEXT NOT NULL,

  -- Trends
  trend TEXT CHECK (trend IN ('up', 'down', 'stable', 'new')),
  change NUMERIC,
  change_percent NUMERIC,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Cache control
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,

  UNIQUE(leaderboard_id, rank)
);

CREATE INDEX idx_coliseum_leaderboards_id_rank ON coliseum_leaderboards(leaderboard_id, rank);
CREATE INDEX idx_coliseum_leaderboards_entity ON coliseum_leaderboards(entity_id);
```

### **Table 4: coliseum_reports** (Generated Reports)

```sql
CREATE TABLE coliseum_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Report context
  report_type TEXT NOT NULL CHECK (report_type IN ('event', 'artist', 'brand_campaign', 'city', 'tournament')),
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,

  -- Time range
  time_range TEXT DEFAULT '30d',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Report data (stored as JSONB)
  report_data JSONB NOT NULL,

  -- Format
  format TEXT CHECK (format IN ('json', 'pdf')),

  -- Storage
  pdf_url TEXT,
  qr_code_url TEXT,

  -- Access
  generated_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT FALSE,
  share_link TEXT UNIQUE,

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_coliseum_reports_entity ON coliseum_reports(entity_type, entity_id, generated_at DESC);
CREATE INDEX idx_coliseum_reports_user ON coliseum_reports(generated_by, generated_at DESC);
CREATE INDEX idx_coliseum_reports_share ON coliseum_reports(share_link) WHERE share_link IS NOT NULL;
```

---

## 🔄 PASSPORT → COLISEUM PIPELINE

### **Phase 1: Direct Insertion** (MVP - Simple)

**Approach:** Components log directly to both Passport AND Coliseum

```typescript
// In AudioPlayerContext.tsx
await logEvent('player.track_played', payload)  // Passport
await trackColiseumEvent('player.track_played', payload)  // Coliseum
```

**Pros:**
- Fast to implement
- Real-time metrics immediately
- No background processor needed

**Cons:**
- Duplicate logging code
- Two database writes per event
- No retry logic if Coliseum insert fails

### **Phase 2: Background Processor** (Production - Robust)

**Approach:** Background Edge Function processes Passport events

```typescript
// Supabase Edge Function: process_passport_to_coliseum
// Runs every 5 minutes or on-demand

1. Query unprocessed passport entries
2. For each entry, determine if it should create Coliseum metric
3. Insert to coliseum_metrics
4. Mark passport entry as processed_by_coliseum = true
5. Update coliseum_rollups (hourly/daily aggregations)
6. Refresh leaderboard caches if needed
```

**Pros:**
- Single source of truth (Passport)
- Retry logic built-in
- Can backfill historical data
- Cleaner component code

**Cons:**
- Slight delay (5min lag)
- More complex to build

**Recommendation:** Start with Phase 1 for MVP, migrate to Phase 2 for production

---

## 🎨 UI COMPONENTS TO BUILD

### **1. Coliseum Dashboard** (`/coliseum`)

**Features:**
- Live KPI tiles (plays, votes, attendance, revenue)
- Multiple leaderboards with filters
- Time range selector (today, week, month, all-time)
- Real-time updates via Supabase Realtime
- Export reports button

**Design:**
- Roman Coliseum aesthetic with "orange" accents (#FF6B35)
- Jumbotron-style header with animated numbers
- Glass morphism cards
- Framer Motion animations

**Route:** `/coliseum` (public, no auth required for public leaderboards)

### **2. Analytics Report Viewer** (`/coliseum/reports/:reportId`)

**Features:**
- Comprehensive analytics report display
- Engagement timeline chart
- DNA insights section
- Funnel visualization
- Export to PDF button
- Shareable QR code

**Design:**
- Clean, professional report layout
- Charts using Recharts or Chart.js
- Printable format

### **3. DIA Coliseum Admin** (`/dia/coliseum`)

**Features:**
- Monitor Coliseum pipeline health
- View processing queue depth
- Manual trigger for aggregations
- Leaderboard management (create, edit, delete)
- Report generation history

**Design:**
- Matches existing DIA dashboard aesthetic
- Admin controls prominent

---

## 📊 LEADERBOARD DEFINITIONS

### **Global Leaderboards** (Always Active)

1. **Top Artists by Plays** (30 days)
   - Metric: `player.track_played`
   - Aggregation: COUNT by artist_id
   - Updates: Every 5 minutes

2. **Top Events by Votes** (active events only)
   - Metric: `concierto.vote_cast`
   - Aggregation: COUNT by event_id
   - Updates: Real-time

3. **Top Cities by Engagement** (30 days)
   - Metric: All interaction events
   - Aggregation: COUNT by user location
   - Updates: Hourly

4. **Trending Tracks** (7 days)
   - Metric: `player.track_played`
   - Aggregation: COUNT with growth rate
   - Updates: Hourly

### **Event-Specific Leaderboards** (Dynamic)

1. **Event Artist Rankings** (per event)
   - Metric: `concierto.vote_cast`
   - Scope: Single event
   - Updates: Real-time during event

2. **Event Attendee Engagement** (per event)
   - Metric: Multiple (votes, shares, plays)
   - Scope: Single event participants
   - Updates: Real-time

---

## 🧬 DNA-ENRICHED ANALYTICS

### **DNA Insights in Reports**

Every Coliseum report includes DNA analysis:

**Audience DNA Profile:**
- Average match score between artist/event DNA and audience
- Match score distribution (strong, good, moderate, weak)
- Top matching DNA domains (cultural, behavioral, economic, spatial)
- Audience clustering (identify fan archetypes)

**Example:**
```
Artist: Artist X
Audience DNA Insights:
- 1,250 unique listeners analyzed
- Average DNA match: 0.74 (strong alignment)
- Top domain: Cultural (0.82 avg match)
- 3 distinct audience clusters identified:
  1. "Underground Hip-Hop Heads" (45%)
  2. "Jazz Fusion Explorers" (30%)
  3. "Indie R&B Fans" (25%)
```

**Use Cases:**
- Artists understand their audience composition
- Brands target specific DNA clusters
- Event organizers curate lineups based on DNA compatibility
- DNA evolution tracking over time

---

## 🚀 IMPLEMENTATION ROADMAP

### **Sprint 1: Foundation** (Week 1)

**Goal:** Basic Coliseum tracking working

Tasks:
- [ ] Create migration: `20251109220000_create_coliseum_schema.sql`
- [ ] Implement tables: coliseum_metrics, coliseum_rollups
- [ ] Update useColiseum hook with real database operations
- [ ] Add Coliseum tracking to AudioPlayerContext (Phase 1 approach)
- [ ] Test: Play track → verify coliseum_metrics entry created

**Success Criteria:**
- Events being logged to coliseum_metrics
- useColiseum.trackEvent() working
- Console logs showing successful tracking

### **Sprint 2: Leaderboards** (Week 2)

**Goal:** Display live leaderboards

Tasks:
- [ ] Create coliseum_leaderboards table
- [ ] Build leaderboard aggregation function (SQL)
- [ ] Create ColiseumDashboard component
- [ ] Implement "Top Artists by Plays" leaderboard
- [ ] Add real-time updates via Supabase Realtime
- [ ] Style with Coliseum orange aesthetic

**Success Criteria:**
- `/coliseum` route showing live leaderboard
- Leaderboard updates when new plays occur
- Responsive design working

### **Sprint 3: Rollups & Performance** (Week 3)

**Goal:** Optimize with pre-aggregated data

Tasks:
- [ ] Implement hourly/daily rollup aggregations
- [ ] Create Edge Function: `aggregate_coliseum_metrics`
- [ ] Schedule Edge Function to run hourly
- [ ] Update leaderboard queries to use rollups
- [ ] Add caching layer (consider Redis or Supabase cache)

**Success Criteria:**
- Rollups being calculated hourly
- Leaderboard queries <500ms
- Historical data preserved

### **Sprint 4: Reports** (Week 4)

**Goal:** Generate analytics reports

Tasks:
- [ ] Create coliseum_reports table
- [ ] Build report generation function
- [ ] Create AnalyticsReport component
- [ ] Implement basic DNA insights calculation
- [ ] Add PDF export (using jsPDF or similar)
- [ ] Generate QR codes for sharing

**Success Criteria:**
- Admins can generate reports for events/artists
- Reports display key metrics and DNA insights
- Reports can be shared via link

### **Sprint 5: Background Processor** (Week 5)

**Goal:** Migrate to Passport-driven architecture

Tasks:
- [ ] Create Edge Function: `process_passport_to_coliseum`
- [ ] Implement event routing logic
- [ ] Add processing flags to passport_entries
- [ ] Backfill historical Passport data to Coliseum
- [ ] Remove direct Coliseum tracking from components

**Success Criteria:**
- All metrics sourced from Passport
- Processing lag <5 minutes
- No duplicate entries

---

## 🎯 INTEGRATION WITH EXISTING SYSTEMS

### **Passport Integration**

**Event Types Already Logged:**
- ✅ `player.track_played`
- ✅ `player.track_completed`
- ✅ `player.track_skipped`

**Event Types Needed:**
- ⏳ `concierto.vote_cast` (add to Concierto voting)
- ⏳ `concierto.event_viewed` (add to PublicEventView)
- ⏳ `treasury.purchase_completed` (add to Treasury)
- ⏳ `social.follow` (when social features built)

### **DIA Integration**

**Add to DIA Dashboard:**
- Coliseum health monitoring
- Leaderboard management
- Report generation interface
- Processing queue viewer

**Route:** `/dia/coliseum`

### **Treasury Integration**

**Revenue tracking:**
- Coliseum aggregates revenue_cents from Treasury events
- Reports show ROI and conversion rates
- DNA-enriched revenue analysis (which DNA clusters spend most?)

---

## 📐 TECHNICAL ARCHITECTURE

### **Data Flow Diagram**

```
┌─────────────────────┐
│   User Actions      │
│  (Play, Vote, etc.) │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Passport System    │
│  (passport_entries) │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Background Processor│
│   (Edge Function)   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Coliseum Metrics   │
│ (coliseum_metrics)  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Aggregation Engine  │
│ (Rollups + Cache)   │
└──────────┬──────────┘
           │
           ├───→ Leaderboards
           ├───→ Reports
           ├───→ DNA Insights
           └───→ DIA Dashboard
```

### **Performance Targets**

- **Ingestion:** 100k+ events/day
- **Leaderboard Query:** <500ms
- **Report Generation:** <5 seconds
- **Real-time Updates:** <30s lag (p95)
- **Concurrent Users:** 500+

### **Caching Strategy**

**Redis Cache Keys:**
- `leaderboard:{leaderboard_id}:{time_window}` (5min TTL)
- `entity_stats:{entity_type}:{entity_id}:{period}` (15min TTL)
- `global_metrics:{metric_type}:{period}` (30min TTL)

**Cache Invalidation:**
- On new metric insertion
- On rollup calculation
- Manual admin flush

---

## 🎨 UI/UX DESIGN NOTES

### **Coliseum Aesthetic**

**Color Palette:**
- Primary: Coliseum Orange (#FF6B35)
- Accent: Gold (#FFD700)
- Background: Dark slate (#1E293B)
- Text: White/Light gray

**Typography:**
- Headers: Roman-style serif font (Cinzel or Trajan Pro)
- Body: Clean sans-serif (Inter or Roboto)
- Numbers: Tabular figures for alignment

**Animations:**
- Leaderboard rank changes: Slide up/down with easing
- New metrics: Pulse effect
- Loading states: Skeleton screens
- Jumbotron numbers: Counting animation

### **Components**

**KPI Tiles:**
```
┌─────────────────┐
│  🎵 PLAYS       │
│  ════════       │
│    12,450       │
│   +2.3% ↗       │
└─────────────────┘
```

**Leaderboard Entry:**
```
┌─────────────────────────────────────────┐
│ #1 ↗ 🎨 Artist Name         🔥 12,450  │
│      Boston, MA                          │
└─────────────────────────────────────────┘
```

---

## 📝 NEXT STEPS

### **Immediate (This Session)**

1. Create database migration with all 4 tables
2. Apply migration to Supabase
3. Test table creation
4. Update useColiseum hook implementation
5. Add Coliseum tracking to one component (AudioPlayer)
6. Verify metrics being logged

### **This Week**

1. Build ColiseumDashboard component
2. Implement first leaderboard (Top Artists)
3. Add real-time updates
4. Style with Coliseum aesthetic
5. Add to main navigation

### **Next Week**

1. Implement rollup aggregations
2. Build report generation
3. Add DNA insights calculation
4. Create DIA admin panel

---

## 🐛 KNOWN CHALLENGES & SOLUTIONS

### **Challenge 1: High Write Volume**

**Problem:** 100k+ events/day = high database load

**Solution:**
- Use TimescaleDB hypertables for time-series optimization
- Implement write batching (bulk inserts)
- Use connection pooling
- Consider separate write/read replicas

### **Challenge 2: Real-Time Updates at Scale**

**Problem:** 500+ concurrent users watching leaderboards

**Solution:**
- Implement caching layer (Redis)
- Use Supabase Realtime efficiently (channel per leaderboard)
- Throttle updates (max 1 update per 5 seconds)
- Use WebSocket connection pooling

### **Challenge 3: DNA Insights Calculation**

**Problem:** Complex DNA matching calculations are slow

**Solution:**
- Pre-calculate DNA insights during rollups
- Cache insights per entity
- Use materialized views for common queries
- Implement progressive loading (show basic metrics first)

### **Challenge 4: Historical Data Backfill**

**Problem:** Need to populate Coliseum with existing Passport data

**Solution:**
- Create one-time migration script
- Process in batches (1000 entries at a time)
- Run during low-traffic hours
- Verify data integrity after migration

---

## 📊 SUCCESS METRICS

**Phase 1 (MVP) Success:**
- ✅ Coliseum tables created
- ✅ Metrics being logged from audio player
- ✅ One leaderboard displaying live data
- ✅ Sub-1s query times

**Phase 2 (Production) Success:**
- ✅ All event types routing to Coliseum
- ✅ Rollups calculating hourly
- ✅ Reports generating successfully
- ✅ DNA insights displaying in reports
- ✅ 99.9% uptime
- ✅ <30s real-time lag

**Phase 3 (Scale) Success:**
- ✅ 100k+ events/day ingested
- ✅ 500+ concurrent users supported
- ✅ Sub-500ms leaderboard queries
- ✅ Background processor running smoothly
- ✅ Caching layer optimized

---

**Document Status:** ✅ Ready for Implementation
**Next Action:** Create database migration
**Owner:** Claude Code + User
**Priority:** High (Trinity System Core)

🏛️ **Let the games begin!** 🏛️
