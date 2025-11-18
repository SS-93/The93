# 🏛️ COLISEUM LEADERBOARD & TRACKING SYSTEM

**Project:** Complete Coliseum Analytics with Multi-Entity Leaderboards
**Date:** 2025-11-09
**Status:** 🎯 Design Phase
**Purpose:** Competition, visualization, and gamification across all entities

---

## 🎯 CORE CONCEPTS

### **The Coliseum Philosophy**
> "A grand arena where all participants compete in real-time. Artists battle for plays, fans compete for engagement, brands vie for conversions, and events create their own contained battlegrounds."

### **Key Requirements (From User):**
1. ✅ **Artist-Event Linkage** - Artists in events with artist accounts = unified metrics
2. ✅ **Event-Specific Leaderboards** - Each event gets isolated voting leaderboard (physical + virtual competition)
3. ✅ **Brand Conversion Tracking** - Locker conversions, earnings, engagement, reach
4. ✅ **Tracking/Conversion Management** - System to attribute and track conversion funnels
5. ✅ **Spirit of Competition** - Real-time updates, visual rankings, gamification

---

## 📊 LEADERBOARD TYPES

### **1. ARTIST LEADERBOARDS** 🎤

#### **Global Artist Leaderboards**
```typescript
// Top Artists by Plays (Rolling 30 Days)
{
  leaderboard_id: 'global_artists_plays_30d',
  entity_type: 'artist',
  metric_type: 'player.track_played',
  aggregation: 'count',
  time_window: '30d',
  scope: 'global',
  update_frequency: 'every_5_minutes'
}

// Top Artists by Engagement Rate
{
  leaderboard_id: 'global_artists_engagement',
  entity_type: 'artist',
  calculation: '(plays + favorites + shares + votes) / unique_listeners',
  time_window: '30d',
  scope: 'global'
}

// Trending Artists (Fastest Growth)
{
  leaderboard_id: 'global_artists_trending',
  entity_type: 'artist',
  calculation: 'plays_this_week / plays_last_week',
  time_window: '7d',
  scope: 'global',
  badge: '🔥 Trending'
}

// Top Artists by Revenue
{
  leaderboard_id: 'global_artists_revenue',
  entity_type: 'artist',
  metric_type: 'treasury.*',
  aggregation: 'sum(amount_cents)',
  time_window: '30d',
  scope: 'global'
}

// Top Artists by DNA Match Score
{
  leaderboard_id: 'global_artists_dna_match',
  entity_type: 'artist',
  calculation: 'avg(dna_match_score)',
  time_window: '30d',
  scope: 'global',
  badge: '🧬 DNA Compatible'
}
```

#### **City-Based Artist Leaderboards**
```typescript
// Top Artists in [City] by Plays
{
  leaderboard_id: 'city_boston_artists_plays',
  entity_type: 'artist',
  metric_type: 'player.track_played',
  scope: 'city',
  filter: { city: 'Boston, MA' },
  time_window: '30d'
}
```

#### **Genre-Based Artist Leaderboards**
```typescript
// Top Hip-Hop Artists
{
  leaderboard_id: 'genre_hiphop_artists',
  entity_type: 'artist',
  metric_type: 'player.track_played',
  scope: 'genre',
  filter: { genre: 'Hip-Hop' },
  time_window: '30d'
}
```

---

### **2. EVENT-SPECIFIC LEADERBOARDS** 🎪

> **KEY FEATURE:** Each event creates its own isolated leaderboard for voting competition

#### **Event Artist Voting Leaderboard**
```typescript
// Per-Event Artist Rankings (Vote Competition)
{
  leaderboard_id: 'event_{event_id}_artist_votes',
  entity_type: 'artist',
  metric_type: 'concierto.vote_cast',
  scope: 'event',
  filter: { event_id: event_id },
  time_window: 'event_duration',
  update_frequency: 'realtime', // Live updates during event!
  visualization: 'jumbotron' // Display on big screen
}

// Example Entry:
{
  rank: 1,
  entity_id: 'artist-123',
  entity_name: 'Artist Name',
  score: 1250, // vote count
  trend: 'up',
  change: +50, // votes gained in last hour
  metadata: {
    subtitle: 'Boston, MA',
    badge: '🔥 Leading',
    vote_breakdown: {
      in_person: 800,
      virtual: 450
    }
  }
}
```

#### **Event Engagement Leaderboard**
```typescript
// Most Engaged Attendees (Who's Most Active at Event)
{
  leaderboard_id: 'event_{event_id}_attendee_engagement',
  entity_type: 'user',
  calculation: 'votes_cast + shares + comments + plays',
  scope: 'event',
  filter: { event_id: event_id },
  badge: '👑 Super Fan'
}
```

#### **Event Photo/Social Shares**
```typescript
{
  leaderboard_id: 'event_{event_id}_social_shares',
  entity_type: 'user',
  metric_type: 'social.share',
  scope: 'event',
  filter: { event_id: event_id }
}
```

---

### **3. FAN/USER LEADERBOARDS** 👥

#### **Most Active Listeners**
```typescript
{
  leaderboard_id: 'global_fans_plays',
  entity_type: 'user',
  metric_type: 'player.track_played',
  aggregation: 'count',
  time_window: '30d',
  scope: 'global'
}
```

#### **Top Contributors (Engagement)**
```typescript
{
  leaderboard_id: 'global_fans_engagement',
  entity_type: 'user',
  calculation: 'votes + shares + comments + favorites',
  time_window: '30d',
  scope: 'global',
  badge: '⭐ Power User'
}
```

#### **Event Attendance Leaders**
```typescript
{
  leaderboard_id: 'global_fans_events',
  entity_type: 'user',
  metric_type: 'concierto.event_attended',
  aggregation: 'count',
  time_window: '90d',
  scope: 'global'
}
```

#### **Top Supporters (Tips/Purchases)**
```typescript
{
  leaderboard_id: 'global_fans_supporters',
  entity_type: 'user',
  metric_type: 'treasury.*',
  aggregation: 'sum(amount_cents)',
  time_window: '30d',
  scope: 'global',
  badge: '💰 Top Supporter'
}
```

---

### **4. BRAND LEADERBOARDS** 🏢

> **Brand Success Metrics:** Conversions, earnings, engagement, reach

#### **Top Brands by Locker Conversions**
```typescript
{
  leaderboard_id: 'global_brands_conversions',
  entity_type: 'brand',
  metric_type: 'locker.content_unlocked',
  aggregation: 'count',
  time_window: '30d',
  scope: 'global',
  badge: '🔓 Conversion King'
}
```

#### **Top Brands by Revenue Generated**
```typescript
{
  leaderboard_id: 'global_brands_revenue',
  entity_type: 'brand',
  metric_type: 'treasury.purchase_completed',
  aggregation: 'sum(amount_cents)',
  time_window: '30d',
  scope: 'global'
}
```

#### **Top Brands by Engagement**
```typescript
{
  leaderboard_id: 'global_brands_engagement',
  entity_type: 'brand',
  calculation: 'clicks + views + shares + unlocks',
  time_window: '30d',
  scope: 'global'
}
```

#### **Top Brands by Reach**
```typescript
{
  leaderboard_id: 'global_brands_reach',
  entity_type: 'brand',
  calculation: 'unique_users_engaged',
  time_window: '30d',
  scope: 'global',
  badge: '📡 Viral Reach'
}
```

#### **Top Brands by DNA Match Quality**
```typescript
{
  leaderboard_id: 'global_brands_dna_match',
  entity_type: 'brand',
  calculation: 'avg(dna_match_score) * conversion_rate',
  time_window: '30d',
  scope: 'global',
  badge: '🧬 Precision Targeting'
}
```

---

### **5. TRACK LEADERBOARDS** 🎵

#### **Top Tracks by Plays**
```typescript
{
  leaderboard_id: 'global_tracks_plays',
  entity_type: 'track',
  metric_type: 'player.track_played',
  aggregation: 'count',
  time_window: '7d',
  scope: 'global'
}
```

#### **Viral Tracks (Shares + Growth)**
```typescript
{
  leaderboard_id: 'global_tracks_viral',
  entity_type: 'track',
  calculation: '(shares * 2) + (plays_growth_percent * plays)',
  time_window: '7d',
  scope: 'global',
  badge: '🚀 Viral'
}
```

#### **Most Favorited**
```typescript
{
  leaderboard_id: 'global_tracks_favorites',
  entity_type: 'track',
  metric_type: 'player.track_favorited',
  aggregation: 'count',
  time_window: '30d',
  scope: 'global'
}
```

#### **Highest Completion Rate**
```typescript
{
  leaderboard_id: 'global_tracks_completion',
  entity_type: 'track',
  calculation: 'track_completed / track_played',
  time_window: '30d',
  scope: 'global',
  badge: '💯 Can\'t Skip'
}
```

---

## 🔗 ARTIST-EVENT METRIC LINKAGE

> **Requirement:** "If artist in event and has an artist account tie metrics together"

### **Artist-Event Junction Tracking**

**Database Addition:**
```sql
-- Add to coliseum_metrics table (already has these fields)
-- artist_id: Links to artist_profiles(id)
-- event_id: Links to events(id)

-- New: Track artist participation in events
CREATE TABLE artist_event_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Participation details
  participation_type TEXT NOT NULL, -- 'performer', 'judge', 'host', 'competitor'
  confirmed BOOLEAN DEFAULT false,

  -- Aggregated metrics (cached from coliseum_metrics)
  total_votes INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  rank_in_event INTEGER,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  event_date TIMESTAMPTZ,

  UNIQUE(artist_id, event_id)
);

CREATE INDEX idx_artist_event_artist ON artist_event_participation(artist_id);
CREATE INDEX idx_artist_event_event ON artist_event_participation(event_id);
```

### **Unified Artist Metrics Query**

```sql
-- Get artist's complete metrics (global + per-event breakdown)
SELECT
  ap.id as artist_id,
  ap.artist_name,

  -- Global metrics
  COALESCE(gm.total_plays, 0) as total_plays,
  COALESCE(gm.total_favorites, 0) as total_favorites,

  -- Event-specific metrics
  jsonb_agg(
    jsonb_build_object(
      'event_id', aep.event_id,
      'event_name', e.title,
      'votes', aep.total_votes,
      'rank', aep.rank_in_event,
      'event_date', aep.event_date
    )
  ) FILTER (WHERE aep.event_id IS NOT NULL) as event_history

FROM artist_profiles ap

-- Global plays
LEFT JOIN (
  SELECT
    artist_id,
    COUNT(*) as total_plays
  FROM coliseum_metrics
  WHERE metric_type = 'player.track_played'
  GROUP BY artist_id
) gm ON gm.artist_id = ap.id

-- Event participation
LEFT JOIN artist_event_participation aep ON aep.artist_id = ap.id
LEFT JOIN events e ON e.id = aep.event_id

WHERE ap.id = $1
GROUP BY ap.id, ap.artist_name, gm.total_plays, gm.total_favorites;
```

### **Artist Profile Display**

```typescript
// Artist Profile Component
interface ArtistMetrics {
  globalRank: number
  totalPlays: number
  totalFavorites: number

  // Event history with ranks
  eventHistory: Array<{
    event_id: string
    event_name: string
    votes: number
    rank: number
    event_date: string
    badge?: string // '🏆 Winner', '🥈 2nd Place'
  }>

  // Current events (live)
  activeEvents: Array<{
    event_id: string
    event_name: string
    current_votes: number
    current_rank: number
    live: boolean
  }>
}
```

---

## 📈 CONVERSION TRACKING SYSTEM

> **Requirement:** "We might need some type of tracking conversion management system"

### **Conversion Funnel Definitions**

```typescript
interface ConversionFunnel {
  id: string
  name: string
  entity_type: 'brand' | 'artist' | 'event'
  entity_id: string

  stages: FunnelStage[]

  // Tracking
  attribution_window_hours: number // How long to credit conversion
  attribution_model: 'first_touch' | 'last_touch' | 'multi_touch'
}

interface FunnelStage {
  stage_id: string
  stage_name: string
  stage_order: number

  // Event that marks stage completion
  event_types: string[] // e.g., ['locker.viewed', 'locker.clicked']

  // Metrics
  entered: number
  exited: number
  converted_to_next: number
  conversion_rate: number
  avg_time_in_stage_seconds: number
}
```

### **Example Funnels**

#### **Brand Locker Conversion Funnel**
```typescript
{
  id: 'brand_locker_conversion',
  name: 'Brand Locker Unlock',
  entity_type: 'brand',
  stages: [
    {
      stage_id: 'impression',
      stage_name: 'Locker Viewed',
      event_types: ['locker.viewed']
    },
    {
      stage_id: 'engagement',
      stage_name: 'Locker Clicked',
      event_types: ['locker.clicked', 'locker.explored']
    },
    {
      stage_id: 'intent',
      stage_name: 'Unlock Started',
      event_types: ['locker.unlock_started']
    },
    {
      stage_id: 'conversion',
      stage_name: 'Content Unlocked',
      event_types: ['locker.content_unlocked']
    }
  ],
  attribution_window_hours: 24,
  attribution_model: 'last_touch'
}
```

#### **Event Attendance Funnel**
```typescript
{
  id: 'event_attendance',
  name: 'Event Attendance',
  entity_type: 'event',
  stages: [
    {
      stage_id: 'awareness',
      stage_name: 'Event Viewed',
      event_types: ['concierto.event_viewed']
    },
    {
      stage_id: 'interest',
      stage_name: 'Artists Explored',
      event_types: ['concierto.artist_viewed']
    },
    {
      stage_id: 'intent',
      stage_name: 'RSVP Submitted',
      event_types: ['concierto.event_rsvp']
    },
    {
      stage_id: 'conversion',
      stage_name: 'Attended Event',
      event_types: ['concierto.event_attended']
    },
    {
      stage_id: 'engagement',
      stage_name: 'Voted',
      event_types: ['concierto.vote_cast']
    }
  ]
}
```

#### **Artist Subscription Funnel**
```typescript
{
  id: 'artist_subscription',
  name: 'Artist Subscription',
  entity_type: 'artist',
  stages: [
    {
      stage_id: 'discovery',
      stage_name: 'Track Played',
      event_types: ['player.track_played']
    },
    {
      stage_id: 'interest',
      stage_name: 'Track Completed',
      event_types: ['player.track_completed']
    },
    {
      stage_id: 'engagement',
      stage_name: 'Track Favorited',
      event_types: ['player.track_favorited']
    },
    {
      stage_id: 'intent',
      stage_name: 'Artist Profile Viewed',
      event_types: ['artist.profile_viewed']
    },
    {
      stage_id: 'conversion',
      stage_name: 'Subscription Started',
      event_types: ['treasury.subscription_started']
    }
  ]
}
```

### **Conversion Attribution**

```sql
-- Conversion attribution table
CREATE TABLE conversion_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conversion details
  funnel_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Attribution
  first_touch_event_id UUID REFERENCES coliseum_metrics(id),
  last_touch_event_id UUID REFERENCES coliseum_metrics(id),
  conversion_event_id UUID REFERENCES coliseum_metrics(id),

  -- Journey
  journey_events UUID[], -- Array of event IDs in journey
  journey_duration_seconds INTEGER,

  -- Value
  conversion_value_cents INTEGER,

  -- Timestamps
  journey_started_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_conversions_funnel ON conversion_attributions(funnel_id);
CREATE INDEX idx_conversions_entity ON conversion_attributions(entity_type, entity_id);
CREATE INDEX idx_conversions_user ON conversion_attributions(user_id);
```

---

## 🎮 GAMIFICATION & COMPETITION

### **Achievement Badges**

```typescript
interface AchievementBadge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'

  // Unlock criteria
  criteria: {
    metric_type: string
    threshold: number
    time_window?: string
  }
}

// Example badges
const ACHIEVEMENT_BADGES = [
  // Artist Badges
  {
    id: 'artist_1k_plays',
    name: '1K Plays',
    description: 'Reached 1,000 plays',
    icon: '🎵',
    rarity: 'common',
    criteria: { metric_type: 'player.track_played', threshold: 1000 }
  },
  {
    id: 'artist_event_winner',
    name: 'Event Champion',
    description: 'Won an event voting competition',
    icon: '🏆',
    rarity: 'epic',
    criteria: { metric_type: 'concierto.event_rank', threshold: 1 }
  },

  // Fan Badges
  {
    id: 'fan_100_votes',
    name: 'Super Voter',
    description: 'Cast 100 votes',
    icon: '🗳️',
    rarity: 'rare',
    criteria: { metric_type: 'concierto.vote_cast', threshold: 100 }
  },

  // Brand Badges
  {
    id: 'brand_1k_conversions',
    name: 'Conversion Master',
    description: '1,000 locker unlocks',
    icon: '🔓',
    rarity: 'legendary',
    criteria: { metric_type: 'locker.content_unlocked', threshold: 1000 }
  }
]
```

### **Live Competition Features**

#### **Real-Time Event Jumbotron**
```typescript
// For physical events - display on big screen
interface EventJumbotronData {
  event_id: string
  event_name: string

  // Live artist rankings (updates every 5 seconds)
  artist_rankings: Array<{
    rank: number
    artist_name: string
    votes: number
    change: number // votes in last minute
    trend: 'up' | 'down' | 'stable'
    visual_indicator: string // '🔥🔥🔥' for hot streaks
  }>

  // Live stats
  total_votes: number
  total_attendees: number
  votes_per_minute: number

  // Recent activity feed
  recent_votes: Array<{
    voter_name: string // Anonymous or display name
    artist_name: string
    timestamp: Date
  }>
}
```

#### **Rank Change Notifications**
```typescript
// Push notifications when rank changes
interface RankChangeNotification {
  entity_type: 'artist' | 'user' | 'brand'
  entity_id: string
  leaderboard_id: string
  old_rank: number
  new_rank: number
  change: number
  message: string // "You moved up 3 spots to #7!"
}
```

---

## 🎨 VISUALIZATION CONCEPTS

### **Coliseum Dashboard Layout**

```
┌─────────────────────────────────────────────────────────────┐
│  🏛️ COLISEUM - THE ARENA                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │  🎤 TOP ARTISTS │  │  🎵 HOT TRACKS  │  │  🏢 BRANDS   ││
│  │  ═════════════  │  │  ═════════════  │  │  ══════════  ││
│  │  #1  Artist A   │  │  #1  Track X    │  │  #1  Brand P ││
│  │  ▲ +2  12.5K ♪  │  │  ▲ +1  5.2K ♪   │  │  ▲ +3  2.1K  ││
│  │                 │  │                 │  │              ││
│  │  #2  Artist B   │  │  #2  Track Y    │  │  #2  Brand Q ││
│  │  ▼ -1  11.8K ♪  │  │  ━ 0   4.9K ♪   │  │  ▲ +1  1.8K  ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  🎪 LIVE EVENTS                                          ││
│  │  ═════════════                                           ││
│  │  📍 Boston Showcase - 245 votes/min  [View Jumbotron →] ││
│  │  📍 LA Battle - 180 votes/min        [View Jumbotron →] ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### **Event-Specific Jumbotron**

```
┌─────────────────────────────────────────────────────────────┐
│  🎪 BOSTON SHOWCASE - LIVE RANKINGS                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  🏆 #1  ARTIST NAME              1,250 votes  🔥🔥🔥     ││
│  │      ▲ +50 in last hour                                  ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │  🥈 #2  ARTIST NAME                 980 votes  🔥🔥      ││
│  │      ▲ +35 in last hour                                  ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │  🥉 #3  ARTIST NAME                 720 votes  🔥        ││
│  │      ━ +5 in last hour                                   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  📊 2,450 TOTAL VOTES  |  180 VOTES/MIN  |  350 ATTENDEES  │
│                                                               │
│  🎯 RECENT ACTIVITY                                          │
│  • Fan123 voted for Artist A  (2s ago)                      │
│  • Fan456 voted for Artist C  (5s ago)                      │
│  • Fan789 voted for Artist A  (8s ago)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 IMPLEMENTATION PRIORITY

### **Phase 1: Core Infrastructure** (Week 1)
1. ✅ Database tables created
2. ⏳ Update useColiseum hook with real DB operations
3. ⏳ Create `artist_event_participation` table
4. ⏳ Create `conversion_attributions` table

### **Phase 2: Basic Leaderboards** (Week 2)
1. ⏳ Implement `refresh_leaderboard()` function for each type
2. ⏳ Top Artists by Plays
3. ⏳ Top Tracks by Plays
4. ⏳ Event-specific voting leaderboards
5. ⏳ Basic Coliseum Dashboard UI

### **Phase 3: Advanced Metrics** (Week 3)
1. ⏳ Brand conversion tracking
2. ⏳ Funnel tracking system
3. ⏳ DNA match scoring in leaderboards
4. ⏳ Trending/viral calculations

### **Phase 4: Real-Time Competition** (Week 4)
1. ⏳ Real-time leaderboard updates (Supabase Realtime)
2. ⏳ Event jumbotron display
3. ⏳ Rank change notifications
4. ⏳ Achievement badge system

---

**Status:** ✅ Design Complete - Ready for Implementation
**Next Action:** Update useColiseum hook + create artist-event participation table
**Priority:** Event-specific leaderboards (core competition feature)
