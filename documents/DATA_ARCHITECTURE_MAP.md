# 🗺️ BUCKETS DATA ARCHITECTURE MAP
**Comprehensive Mapping for DIA Admin Dashboard Development**

---

## 📊 CURRENT STATE ANALYSIS

### **Existing Tables (Deployed in Supabase)**

#### **1. Identity & Auth**
```sql
auth.users               -- Supabase auth (email, password, etc.)
├── profiles             -- Extended user data (display_name, avatar_url, role)
└── media_ids            -- MediaID preferences & DNA foundation
    ├── interests[]
    ├── genre_preferences[]
    ├── content_flags (JSONB)
    ├── location_code
    ├── profile_embedding (vector 1536) ← DNA STORAGE
    └── privacy_settings (JSONB)
```

#### **2. Engagement Tracking** ⭐ *KEY FOR PASSPORT*
```sql
listening_history        -- Detailed playback events
├── content_id (FK to content_items)
├── event_type ('played', 'added', 'downloaded', etc.)
├── play_duration_seconds
├── progress_percentage
├── session_id (FK to listening_sessions)
└── created_at

media_engagement_log     -- Granular interaction events
├── event_type (track_play, track_complete, track_pause, etc.)
├── content_id (FK nullable)
├── external_content_id (for non-Buckets content)
├── metadata (JSONB) ← Flexible data
├── timestamp
├── session_id
└── is_anonymous

listening_sessions       -- Session grouping
├── session_start/end
├── device_type
├── total_tracks_played
├── total_duration_seconds
└── context ('discovery', 'playlist', 'vertical_player')
```

#### **3. Concierto (Events & Voting)**
```sql
events
├── title, description
├── start_date, end_date
├── shareable_code
├── host_user_id
└── status

event_artists            -- Artists in events
├── event_id
├── artist_profile_id
├── vote_count
└── registration_status

event_participants       -- Voters (pre-signup capture)
├── email, phone, name
├── vote_token
├── total_votes_cast
└── marketing_consent

event_votes              -- Individual votes
├── event_id
├── participant_id
├── event_artist_id
└── created_at
```

#### **4. Content Management**
```sql
artist_profiles
content_items            -- Uploaded tracks/media
albums
audio_features           -- BPM, key, energy, valence
mood_tags
lyrics
subscriptions
```

---

## 🧬 DNA HELIX ARCHITECTURE

### **The Biomimicry Model**

```
MediaID Inputs = ATGC Bases (Static Identity)
     A = Interests
     T = Genre Preferences
     G = Content Flags
     C = Location + Privacy Settings

User Interactions = Helix Structure (Dynamic Evolution)
     Every interaction twists the helix
     DNA evolves through mirroring (engagement reflection)
     Carbon decay weakens old signals over time
```

### **Current DNA Implementation**

**Storage:**
- `media_ids.profile_embedding` (vector 1536) ← Composite DNA
- Not yet split into 4-domain vectors (cultural, behavioral, economic, spatial)

**Processing:**
- ✅ DNA generation: `/src/lib/dna/generator.ts`
- ✅ DNA matching: `/src/lib/dna/matcher.ts`
- ✅ DNA decay: `/src/lib/dna/decay.ts`
- ✅ DNA simulator: `/src/lib/dna/simulator.ts`

**Hook:**
- ✅ `useDNA` hook: `/src/hooks/useDNA.tsx`

**Missing:**
- ❌ Passport → DNA mirroring pipeline
- ❌ 4-domain DNA vectors (only composite exists)
- ❌ DNA evolution tracking over time

---

## 🎯 PASSPORT INTEGRATION PLAN

### **What Exists**
✅ Types defined: `/src/types/passport.ts`
✅ Processor skeleton: `/src/lib/passport/processor.ts`
✅ Hook: `/src/hooks/usePassport.tsx`

### **What's Missing**
❌ **Database table**: `passport_entries` (not yet created)
❌ **Migration from existing logs**: `listening_history` + `media_engagement_log` → `passport_entries`
❌ **Event logging integration**: Components not yet logging to Passport
❌ **Background processor deployment**: Edge Function not deployed

### **Migration Strategy**

**Phase 1: Create Passport Table (Flexible JSONB)**
```sql
CREATE TABLE passport_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  mediaid_id UUID REFERENCES media_ids(id),

  -- Event classification
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,

  -- Flexible payload (NO schema changes needed!)
  payload JSONB DEFAULT '{}',

  -- Trinity routing
  affects_systems TEXT[] DEFAULT '{}',

  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_attempts INT DEFAULT 0,

  -- Context
  source TEXT DEFAULT 'web',
  session_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_passport_user_time ON passport_entries(user_id, timestamp DESC);
CREATE INDEX idx_passport_unprocessed ON passport_entries(processed, timestamp) WHERE NOT processed;
CREATE INDEX idx_passport_payload ON passport_entries USING GIN (payload);
```

**Phase 2: Migrate Existing Data**
```sql
-- Migrate listening_history
INSERT INTO passport_entries (
  user_id, event_type, event_category, payload, timestamp
)
SELECT
  user_id,
  'player.track_' || event_type as event_type,
  'interaction' as event_category,
  jsonb_build_object(
    'content_id', content_id,
    'content_title', content_title,
    'content_artist', content_artist,
    'play_duration_seconds', play_duration_seconds,
    'progress_percentage', progress_percentage,
    'session_id', session_id
  ) as payload,
  created_at as timestamp
FROM listening_history;

-- Migrate media_engagement_log
INSERT INTO passport_entries (
  user_id, event_type, event_category, payload, timestamp
)
SELECT
  user_id,
  event_type as event_type,
  'interaction' as event_category,
  jsonb_build_object(
    'content_id', content_id,
    'external_content_id', external_content_id,
    'metadata', metadata,
    'session_id', session_id
  ) as payload,
  timestamp
FROM media_engagement_log;
```

---

## 🏛️ DIA ADMIN DASHBOARD - DATA REQUIREMENTS

### **V1 Dashboard Goals**
1. **Find test user**: Query by email → user_id
2. **View MediaID**: Current DNA state, preferences, privacy
3. **View interaction history**: All Passport entries (or current logs)
4. **Visualize DNA helix**: Show ATGC bases + interaction patterns
5. **Test DNA mirroring**: Manually trigger DNA update from interaction

### **Required Queries**

**1. User Lookup**
```typescript
async function findUser(email: string) {
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      media_ids(*),
      artist_profiles(*)
    `)
    .eq('email', email)
    .single()
  return data
}
```

**2. Get User Journey**
```typescript
async function getUserJourney(userId: string, days = 30) {
  // Current: Query listening_history + media_engagement_log
  // Future: Query passport_entries

  const { data: history } = await supabase
    .from('listening_history')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000))
    .order('created_at', { ascending: false })

  const { data: engagements } = await supabase
    .from('media_engagement_log')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000))
    .order('timestamp', { ascending: false })

  return { history, engagements }
}
```

**3. Get DNA State**
```typescript
async function getUserDNA(userId: string) {
  const { data } = await supabase
    .from('media_ids')
    .select('*')
    .eq('user_uuid', userId)
    .single()

  return {
    bases: {
      A: data.interests,           // Adenine
      T: data.genre_preferences,   // Thymine
      G: data.content_flags,       // Guanine
      C: {                         // Cytosine
        location: data.location_code,
        privacy: data.privacy_settings
      }
    },
    helix: data.profile_embedding,  // Vector representation
    lastUpdated: data.updated_at
  }
}
```

**4. System Health**
```typescript
async function getSystemHealth() {
  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Active today
  const { count: activeToday } = await supabase
    .from('listening_history')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000))

  // Total interactions (last 24h)
  const { count: interactions24h } = await supabase
    .from('media_engagement_log')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000))

  return { totalUsers, activeToday, interactions24h }
}
```

---

## 📁 CODEBASE STRUCTURE

### **Frontend** (`/Users/pks.ml/Desktop/93/my-app`)

```
src/
├── components/
│   ├── admin/                  ← DIA dashboard goes here
│   │   ├── EnableVotingTool.tsx
│   │   └── EventAnalyticsDashboard.tsx
│   ├── concierto/              ← 19 event components
│   ├── player/                 ← Audio player + enhanced
│   ├── auth/                   ← Login, signup
│   ├── settings/               ← User settings
│   └── voting/                 ← Voting UI
├── hooks/
│   ├── useAuth.tsx
│   ├── usePassport.tsx         ← Passport hook (exists!)
│   ├── useDNA.tsx              ← DNA hook (exists!)
│   ├── useTreasury.tsx         ← Treasury hook (exists!)
│   ├── useColiseum.tsx         ← Coliseum hook (exists!)
│   └── useProfileRouting.ts
├── lib/
│   ├── passport/
│   │   └── processor.ts        ← Event processor (skeleton)
│   ├── dna/
│   │   ├── generator.ts        ← DNA generation
│   │   ├── matcher.ts          ← DNA matching
│   │   ├── decay.ts            ← Carbon decay
│   │   └── simulator.ts        ← DNA simulator
│   ├── mediaId.ts              ← MediaID CRUD
│   ├── listeningHistory.ts     ← Listening tracking
│   ├── supabaseClient.ts
│   └── audioIntelligence.ts
├── types/
│   ├── passport.ts             ← Comprehensive types
│   ├── dna.ts
│   ├── treasury.ts
│   ├── coliseum.ts
│   └── cals.ts
└── routes/                     ← Route definitions
```

### **Backend** (`/Users/pks.ml/Desktop/EPK-93/Buckets_SB`)

```
Buckets_SB/
├── supabase/
│   └── migrations/             ← 16 migration files
│       ├── 20250926200000_create_concierto_schema.sql
│       ├── 20250930150000_add_opt_in_and_photos.sql
│       └── ...
├── Routes/                     ← API routes
├── database/
│   └── migrations/             ← Older migrations
└── Documents/                  ← Backend docs
```

---

## 🎨 DIA V1 DASHBOARD - COMPONENT ARCHITECTURE

### **Route**
`/admin/dia` (protected, admin-only)

### **Components to Build**

```
DIADashboard.tsx                  ← Main container
├── DIAUserSearch.tsx             ← Search by email
├── DIAUserProfile.tsx            ← User overview card
├── DIAMediaIDViewer.tsx          ← MediaID + DNA bases (ATGC)
├── DIADNAHelix.tsx               ← Visual helix representation
├── DIAInteractionTimeline.tsx    ← Passport/history timeline
├── DIASystemHealth.tsx           ← System metrics
└── DIARealTimeActivity.tsx       ← Live event feed
```

### **Data Flow**

```
1. User enters email in DIAUserSearch
2. Query Supabase for user_id
3. Fetch user data:
   - profiles
   - media_ids (DNA bases)
   - listening_history (interactions)
   - media_engagement_log (engagements)
   - event_votes (Concierto)
4. Display in dashboard components
5. Allow admin to:
   - View full journey
   - Manually trigger DNA update
   - Export data
   - View system health
```

---

## ✅ IMPLEMENTATION CHECKLIST

### **Phase 1: Query Test User** ✅ (Next)
- [ ] Run `QUERY_TEST_USER.sql` in Supabase Dashboard
- [ ] Document user_id for dmstest49@gmail.com
- [ ] Identify what data exists
- [ ] Map data to dashboard requirements

### **Phase 2: Build DIA V1 Dashboard**
- [ ] Create `/admin/dia` route
- [ ] Build DIADashboard container
- [ ] Build DIAUserSearch component
- [ ] Build DIAUserProfile component
- [ ] Build DIAMediaIDViewer (ATGC bases)
- [ ] Build DIAInteractionTimeline
- [ ] Connect to real test user data

### **Phase 3: Passport Migration** (After DIA works)
- [ ] Create `passport_entries` table
- [ ] Migrate `listening_history` → Passport
- [ ] Migrate `media_engagement_log` → Passport
- [ ] Update DIA to query Passport instead
- [ ] Deploy Edge Function processor

### **Phase 4: DNA Integration**
- [ ] Implement DNA mirroring from Passport
- [ ] Add DNA evolution tracking
- [ ] Build DNA helix visualization
- [ ] Test DNA simulator with real data

---

## 🔍 TEST USER: dmstest49@gmail.com

**Next Step:** Run `QUERY_TEST_USER.sql` in Supabase Dashboard to get:
1. user_id
2. MediaID data
3. Listening history count
4. Engagement log count
5. Event votes
6. Artist profile (if exists)
7. Uploaded content (if exists)

This will tell us **exactly** what data we have to display in DIA V1.

---

**Document Status:** Ready for DIA Development
**Last Updated:** 2025-11-09
**Next Action:** Query test user data → Build DIA dashboard
