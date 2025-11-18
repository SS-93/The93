# 🗄️ DIA MIRROR MATRICES - COMPREHENSIVE SYSTEM
**Admin Dashboard Database Mirrors for All Buckets Systems**

---

## 🎯 CORE CONCEPT

**DIA (Department of Internal Affairs) needs mirror matrices for EVERY major data table in Buckets:**

```
Supabase Database Tables    →    DIA Mirror Matrices
─────────────────────────────────────────────────────────
auth.users                   →    User Matrix ✅
listening_history            →    Engagement Log Matrix
media_engagement_log         →    Media Engagement Matrix
passport_entries (future)    →    Passport Events Matrix
treasury_transactions        →    Treasury Matrix (not built)
treasury_accounts            →    Treasury Accounts Matrix
coliseum_metrics (future)    →    Coliseum Metrics Matrix
events                       →    Events Matrix
event_votes                  →    Voting Matrix
content_items                →    Content Matrix
artist_profiles              →    Artist Matrix
subscriptions                →    Subscription Matrix
```

**Purpose:** Admin can see, filter, search, and manage ALL data without leaving the app.

---

## 📊 MATRIX ARCHITECTURE PATTERN

### **Universal Matrix Structure:**

Every DIA matrix follows this pattern:

```typescript
interface DIAMatrix<T> {
  // Data
  items: T[]
  totalCount: number

  // Pagination
  page: number
  pageSize: number
  hasNextPage: boolean

  // Filters
  filters: MatrixFilter[]
  activeFilters: Record<string, any>

  // Search
  searchTerm: string
  searchFields: string[]

  // Sorting
  sortBy: string
  sortOrder: 'asc' | 'desc'

  // Selection
  selectedItems: string[]

  // Actions
  availableActions: MatrixAction[]
  bulkActions: MatrixBulkAction[]
}

interface MatrixFilter {
  field: string
  label: string
  type: 'select' | 'multiselect' | 'daterange' | 'boolean' | 'number'
  options?: { value: any; label: string }[]
}

interface MatrixAction {
  id: string
  label: string
  icon: string
  handler: (item: any) => void
  requiresConfirmation?: boolean
}
```

### **Common Components:**

```
DIAMatrix (Generic Container)
├── DIAMatrixHeader
│   ├── Title + Icon
│   ├── Summary Stats
│   └── Export Button
├── DIAMatrixFilters
│   ├── Search Input
│   ├── Filter Dropdowns
│   └── Date Range Picker
├── DIAMatrixTable
│   ├── Column Headers (sortable)
│   ├── Data Rows (selectable)
│   ├── Expandable Detail
│   └── Quick Actions
├── DIAMatrixPagination
└── DIAMatrixBulkActions (when items selected)
```

---

## 🧑 MATRIX 1: USER MATRIX
**Status:** ✅ Defined (see DIA_USER_MATRIX_REQUIREMENTS.md)

**Source Tables:**
- `auth.users`
- `profiles`
- `media_ids`
- `artist_profiles`

**Key Columns:**
- Email, Role, MediaID Status, DNA Score, Last Active

**Filters:**
- Role, Activity Status, MediaID, Verification

**Actions:**
- View Journey, Export Data, Suspend, Regenerate DNA

---

## 💰 MATRIX 2: TREASURY MATRIX
**Status:** ❌ Not Built (Treasury tables don't exist yet)

### **2A: Treasury Transactions Matrix**

**Purpose:** View all financial transactions across the platform

**Source Table (Future):**
```sql
CREATE TABLE treasury_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  transaction_type TEXT, -- 'purchase', 'payout', 'refund', 'attribution', 'split'
  amount_cents BIGINT NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Related entities
  related_entity_type TEXT, -- 'event', 'track', 'subscription', 'ticket'
  related_entity_id UUID,

  -- Stripe data
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  stripe_charge_id TEXT,

  -- Status
  status TEXT, -- 'pending', 'completed', 'failed', 'refunded'

  -- Attribution
  referrer_user_id UUID REFERENCES auth.users(id),
  attribution_percent NUMERIC,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
```

**Matrix Columns:**

| Column | Description | Width | Sortable |
|--------|-------------|-------|----------|
| **Transaction ID** | UUID (truncated) | 120px | ❌ |
| **User Email** | Who made transaction | 180px | ✅ |
| **Type** | Badge: purchase/payout/refund | 100px | ✅ |
| **Amount** | $XX.XX (colored: green +, red -) | 100px | ✅ |
| **Status** | 🟢 Completed / 🟡 Pending / 🔴 Failed | 100px | ✅ |
| **Related To** | Event/Track/Subscription name | 200px | ❌ |
| **Stripe ID** | Payment intent ID (copy) | 150px | ❌ |
| **Date** | Relative + full timestamp | 120px | ✅ |
| **Actions** | Quick actions | 80px | ❌ |

**Filters:**
- Transaction Type (purchase, payout, refund, attribution)
- Status (pending, completed, failed, refunded)
- Date Range (today, week, month, custom)
- Amount Range (min-max)
- User (search by email)
- Related Entity Type (event, track, subscription)

**Search Fields:**
- User email
- Transaction ID
- Stripe payment intent ID
- Related entity name

**Expandable Detail View:**
```
┌─ TRANSACTION DETAILS ──────────────────────────────────────────┐
│ Transaction ID: f3a1b2c4-...                                    │
│ Type: ticket_purchase                                           │
│ Amount: $25.00                                                  │
│ Status: ✅ Completed                                            │
│                                                                 │
│ ┌─ USER INFO ─────────┬─ STRIPE DATA ──────┬─ RELATED ENTITY ─┐│
│ │ User: test@mail.com │ Payment Intent:     │ Event:           ││
│ │ Role: fan           │ pi_3Abc...          │ "Local Showcase" ││
│ │ User ID: 15480...   │                     │                  ││
│ │                     │ Charge:             │ Organizer:       ││
│ │                     │ ch_3Def...          │ host@mail.com    ││
│ │                     │                     │                  ││
│ │                     │ Transfer:           │ Artists:         ││
│ │                     │ tr_3Ghi...          │ - Artist A (40%) ││
│ │                     │                     │ - Artist B (30%) ││
│ │                     │                     │ - Platform (30%) ││
│ └─────────────────────┴────────────────────┴──────────────────┘│
│                                                                 │
│ ┌─ SPLIT BREAKDOWN ──────────────────────────────────────────┐ │
│ │ Total: $25.00                                              │ │
│ │ - Artist A:     $10.00 (40%)  [Status: Pending]           │ │
│ │ - Artist B:     $7.50  (30%)  [Status: Completed]         │ │
│ │ - Platform:     $7.50  (30%)  [Status: Completed]         │ │
│ │                                                            │ │
│ │ Referral Attribution:                                      │ │
│ │ - Referrer: friend@mail.com                                │ │
│ │ - Attribution Fee: $1.25 (5%)  [Status: Pending]          │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ TIMELINE ─────────────────────────────────────────────────┐ │
│ │ 2025-11-07 22:30:00 - Transaction initiated                │ │
│ │ 2025-11-07 22:30:15 - Stripe payment intent created        │ │
│ │ 2025-11-07 22:30:45 - Payment succeeded                    │ │
│ │ 2025-11-07 22:31:00 - Split calculations completed         │ │
│ │ 2025-11-07 22:31:30 - Platform fee transferred            │ │
│ │ 2025-11-07 22:32:00 - Artist B payout queued              │ │
│ │ 2025-11-09 10:00:00 - Artist A payout queued (pending)    │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [View in Stripe] [Refund Transaction] [Export Details]         │
└─────────────────────────────────────────────────────────────────┘
```

**Admin Actions:**
- View in Stripe Dashboard (open Stripe)
- Refund Transaction (with confirmation)
- Retry Failed Transaction
- Export Transaction Details (JSON/PDF)
- View Related Entity (jump to Event/Track)
- View User Profile (jump to User Matrix)

**Summary Stats:**
- Total Volume (24h, 7d, 30d)
- Total Transactions
- Average Transaction Value
- Success Rate %
- Pending Payouts Total
- Platform Revenue (24h, 7d, 30d)

---

### **2B: Treasury Accounts Matrix**

**Purpose:** View all user treasury balances and payout history

**Source Table (Future):**
```sql
CREATE TABLE treasury_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance_cents BIGINT DEFAULT 0 CHECK (balance_cents >= 0),
  pending_balance_cents BIGINT DEFAULT 0,
  lifetime_earned_cents BIGINT DEFAULT 0,
  lifetime_paid_out_cents BIGINT DEFAULT 0,

  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_account_status TEXT, -- 'pending', 'active', 'restricted', 'rejected'
  stripe_onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Payout settings
  auto_payout_enabled BOOLEAN DEFAULT FALSE,
  auto_payout_threshold_cents INTEGER DEFAULT 2500, -- $25 minimum

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **User Email** | Account holder | 180px |
| **Current Balance** | $XX.XX (available) | 120px |
| **Pending** | $XX.XX (in hold period) | 120px |
| **Lifetime Earned** | Total all-time | 120px |
| **Lifetime Paid Out** | Total withdrawn | 120px |
| **Stripe Status** | Connect account status | 120px |
| **Last Payout** | Relative time | 120px |
| **Actions** | Quick actions | 80px |

**Filters:**
- Balance Range (min-max)
- Stripe Status (active, pending, restricted)
- Has Pending Balance
- Auto-Payout Enabled
- Role (artist, host, brand)

**Admin Actions:**
- Process Payout
- View Payout History
- View Stripe Account
- Adjust Balance (with reason + audit)
- Export Account Statement

---

## 📊 MATRIX 3: COLISEUM METRICS MATRIX
**Status:** ❌ Not Built (Coliseum tables don't exist yet)

### **3A: Coliseum Metrics Matrix**

**Purpose:** View all tracked metrics (plays, votes, shares, etc.)

**Source Table (Future):**
```sql
CREATE TABLE coliseum_metrics (
  id UUID PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'play', 'vote', 'share', 'follow', 'purchase'

  -- Entity being measured
  entity_type TEXT NOT NULL, -- 'track', 'artist', 'event', 'user'
  entity_id UUID NOT NULL,

  -- User who generated metric
  user_id UUID REFERENCES auth.users(id),

  -- Metric value
  value NUMERIC DEFAULT 1,

  -- Context
  context TEXT, -- 'discovery', 'playlist', 'event', 'search'
  source TEXT, -- 'web', 'ios', 'android', 'api'

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partitioned by timestamp for performance
CREATE INDEX idx_coliseum_entity ON coliseum_metrics(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_coliseum_user ON coliseum_metrics(user_id, timestamp DESC);
CREATE INDEX idx_coliseum_type ON coliseum_metrics(metric_type, timestamp DESC);
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **Metric Type** | Badge: play/vote/share/follow | 100px |
| **Entity** | Track/Artist/Event name (linked) | 200px |
| **User** | Who generated metric | 150px |
| **Value** | Metric value (usually 1) | 60px |
| **Context** | discovery/playlist/event | 100px |
| **Source** | web/ios/android | 80px |
| **Timestamp** | Relative + full | 120px |

**Filters:**
- Metric Type (play, vote, share, follow, purchase)
- Entity Type (track, artist, event, user)
- Context (discovery, playlist, event, search)
- Source (web, ios, android, api)
- Date Range
- User (search by email)

**Aggregation Views:**
- **By Entity:** Top tracks, top artists, top events (leaderboards)
- **By User:** Most active users, power users
- **By Time:** Hourly, daily, weekly, monthly trends
- **By Context:** Discovery vs playlist vs event performance

**Admin Actions:**
- View Entity Details
- View User Profile
- Export Metrics (CSV)
- Generate Report
- Delete Metric (with audit log)

---

### **3B: Leaderboard Matrix**

**Purpose:** Pre-aggregated leaderboards for quick access

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **Rank** | #1, #2, #3... | 60px |
| **Entity** | Track/Artist/Event name | 250px |
| **Metric** | Total plays/votes/shares | 100px |
| **Trend** | ↑5 or ↓2 (change from last period) | 80px |
| **Growth Rate** | +15% | 80px |
| **Last Update** | Relative time | 100px |

**Leaderboard Types:**
- Top Tracks (by plays, 24h/7d/30d/all-time)
- Top Artists (by followers, plays, engagement)
- Top Events (by attendance, votes, revenue)
- Trending (fastest growth)
- Regional (by city, state, country)

---

## 🎵 MATRIX 4: MEDIA ENGAGEMENT LOG MATRIX
**Status:** ✅ Table Exists (needs matrix view)

**Purpose:** View all granular user interactions with media

**Source Table (Existing):**
```sql
media_engagement_log
├── id UUID
├── user_id UUID
├── content_id UUID (nullable)
├── external_content_id TEXT
├── event_type TEXT ('track_play', 'track_complete', 'track_pause', etc.)
├── metadata JSONB
├── timestamp TIMESTAMPTZ
├── is_anonymous BOOLEAN
└── session_id UUID
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **User Email** | Who interacted | 150px |
| **Event Type** | Badge: play/complete/pause/skip | 120px |
| **Content** | Track title (linked) | 200px |
| **Duration** | Play time (if applicable) | 80px |
| **Session** | Session ID (linked) | 100px |
| **Anonymous** | ✅/❌ | 60px |
| **Timestamp** | Relative + full | 120px |
| **Actions** | Quick actions | 60px |

**Filters:**
- Event Type (track_play, track_complete, track_pause, track_skip, etc.)
- User (search by email)
- Content (search by title)
- Is Anonymous
- Date Range
- Session ID

**Expandable Detail:**
```
┌─ ENGAGEMENT DETAILS ───────────────────────────────────────────┐
│ Event: track_play                                               │
│ User: dmstest49@gmail.com                                       │
│ Content: "Blue in Green (Remix)" by Miles Reborn                │
│                                                                 │
│ ┌─ PLAYBACK DATA ───────────────────────────────────────────┐  │
│ │ Duration Played: 2:15 / 3:30 (64%)                        │  │
│ │ Completion: No (skipped)                                   │  │
│ │ Device: Chrome Desktop                                     │  │
│ │ Context: discovery                                         │  │
│ │ Session: ses_abc123...                                     │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ METADATA (JSONB) ────────────────────────────────────────┐  │
│ │ {                                                          │  │
│ │   "progress_percentage": 64,                               │  │
│ │   "playback_rate": 1.0,                                    │  │
│ │   "volume_level": 0.8,                                     │  │
│ │   "queue_position": 3,                                     │  │
│ │   "came_from": "recommendation_engine",                    │  │
│ │   "recommendation_score": 0.87                             │  │
│ │ }                                                          │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ [View Session] [View User] [View Content] [Export]             │
└─────────────────────────────────────────────────────────────────┘
```

**Admin Actions:**
- View User Profile
- View Content Details
- View Full Session
- Delete Entry (with audit)
- Export Data

**Summary Stats:**
- Total Events (24h, 7d, 30d)
- Unique Users
- Unique Content
- Anonymous %
- Average Session Length

---

## 📖 MATRIX 5: LISTENING HISTORY MATRIX
**Status:** ✅ Table Exists (needs matrix view)

**Purpose:** Detailed playback history (higher-level than engagement log)

**Source Table (Existing):**
```sql
listening_history
├── id UUID
├── user_id UUID
├── media_id_profile_id TEXT
├── content_id UUID
├── content_type TEXT
├── content_title TEXT
├── content_artist TEXT
├── event_type TEXT ('played', 'added', 'downloaded', etc.)
├── play_duration_seconds INTEGER
├── progress_percentage DECIMAL
├── session_id UUID
└── created_at TIMESTAMPTZ
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **User Email** | Listener | 150px |
| **Content** | Title by Artist | 250px |
| **Event** | Badge: played/added/downloaded | 100px |
| **Duration** | X:XX / X:XX (completion %) | 100px |
| **Device** | device_type | 80px |
| **Session** | session_id (linked) | 100px |
| **Date** | Relative + full | 120px |

**Filters:**
- Event Type (played, added, downloaded, resumed, completed)
- Content Type (music, podcast, audiobook)
- User
- Artist
- Completion % (0-100%)
- Date Range

**Admin Actions:**
- View User Journey (all history)
- View Content Details
- View Session
- Export History (CSV)

---

## 🛂 MATRIX 6: PASSPORT EVENTS MATRIX
**Status:** ❌ Not Built (Passport table doesn't exist yet)

**Purpose:** Universal event log (future replacement for engagement logs)

**Source Table (Future):**
```sql
passport_entries
├── id UUID
├── user_id UUID
├── mediaid_id UUID
├── event_type TEXT
├── event_category TEXT
├── payload JSONB
├── affects_systems TEXT[]
├── processed BOOLEAN
├── processed_at TIMESTAMPTZ
├── source TEXT
├── session_id TEXT
└── timestamp TIMESTAMPTZ
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **User Email** | Who | 150px |
| **Event Type** | player.track_played, concierto.vote_cast, etc. | 180px |
| **Category** | Badge: interaction/transaction/social | 100px |
| **Affects** | DNA/Treasury/Coliseum badges | 120px |
| **Processed** | ✅ Yes / ⏳ Pending / ❌ Failed | 80px |
| **Source** | web/ios/android/api | 80px |
| **Timestamp** | Relative + full | 120px |

**Filters:**
- Event Type (all interaction types)
- Event Category (trinity, interaction, transaction, etc.)
- Affects Systems (DNA, Treasury, Coliseum)
- Processed Status (processed, pending, failed)
- Source (web, ios, android)
- Date Range
- User

**Expandable Detail:**
```
┌─ PASSPORT EVENT DETAILS ───────────────────────────────────────┐
│ Event: player.track_played                                      │
│ User: dmstest49@gmail.com                                       │
│ Category: interaction                                           │
│                                                                 │
│ ┌─ ROUTING ──────────────────────────────────────────────────┐ │
│ │ Affects Systems: [DNA ✅] [Treasury ❌] [Coliseum ✅]      │ │
│ │ Processed: ✅ Yes (processed_at: 2025-11-07 22:31:05)      │ │
│ │ Processing Time: 234ms                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ PAYLOAD (JSONB) ──────────────────────────────────────────┐ │
│ │ {                                                           │ │
│ │   "entity_id": "track_abc123",                              │ │
│ │   "entity_type": "track",                                   │ │
│ │   "content_title": "Blue in Green (Remix)",                 │ │
│ │   "content_artist": "Miles Reborn",                         │ │
│ │   "play_duration_seconds": 135,                             │ │
│ │   "progress_percentage": 64,                                │ │
│ │   "session_id": "ses_xyz789",                               │ │
│ │   "context": "discovery",                                   │ │
│ │   "device": "Chrome Desktop"                                │ │
│ │ }                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ DNA INFLUENCE ────────────────────────────────────────────┐ │
│ │ Cultural:   0.8 (HIGH)                                      │ │
│ │ Behavioral: 0.6 (MEDIUM)                                    │ │
│ │ Economic:   0.2 (LOW)                                       │ │
│ │ Spatial:    0.3 (LOW-MED)                                   │ │
│ │                                                             │ │
│ │ DNA Delta Norms:                                            │ │
│ │ - Cultural:   +0.023                                        │ │
│ │ - Behavioral: +0.015                                        │ │
│ │ - Economic:   +0.003                                        │ │
│ │ - Spatial:    +0.007                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [View User DNA] [Reprocess Event] [Export] [Delete]            │
└─────────────────────────────────────────────────────────────────┘
```

**Admin Actions:**
- Reprocess Event (trigger DNA/Treasury/Coliseum update manually)
- View User DNA Timeline
- View Processing Errors
- Delete Event (with audit)
- Export Event Data

---

## 🎪 MATRIX 7: EVENTS MATRIX (Concierto)
**Status:** ✅ Table Exists (needs matrix view)

**Purpose:** View all events (past, upcoming, draft)

**Source Table (Existing):**
```sql
events
├── id UUID
├── title TEXT
├── description TEXT
├── start_date TIMESTAMPTZ
├── end_date TIMESTAMPTZ
├── shareable_code TEXT
├── host_user_id UUID
├── status TEXT ('draft', 'published', 'live', 'completed', 'cancelled')
└── created_at TIMESTAMPTZ
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **Event Title** | Name (linked) | 250px |
| **Status** | Badge: draft/published/live/completed | 100px |
| **Host** | Email (linked) | 150px |
| **Start Date** | Date + time | 120px |
| **Artists** | Count of registered artists | 60px |
| **Attendees** | Count of participants | 80px |
| **Votes** | Total votes cast | 60px |
| **Revenue** | Total ticket sales | 100px |
| **Actions** | Quick actions | 80px |

**Filters:**
- Status (draft, published, live, completed, cancelled)
- Date Range (upcoming, past, today)
- Host (search by email)
- Has Tickets
- Has Voting

**Admin Actions:**
- View Event Dashboard
- Approve/Reject Event
- Suspend Event
- Export CRM Data
- View Analytics

---

## 🎤 MATRIX 8: ARTIST MATRIX
**Status:** ✅ Table Exists (needs matrix view)

**Purpose:** View all artist profiles

**Source Table (Existing):**
```sql
artist_profiles
├── id UUID
├── user_id UUID
├── artist_name TEXT
├── bio TEXT
├── verification_status TEXT ('pending', 'verified', 'rejected')
├── bsl_enabled BOOLEAN
└── created_at TIMESTAMPTZ
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **Artist Name** | Stage name | 200px |
| **Email** | User email (linked) | 150px |
| **Verification** | Badge: pending/verified/rejected | 100px |
| **BSL Status** | ✅/❌ (Black Star Line enabled) | 80px |
| **Uploads** | Count of tracks | 60px |
| **Followers** | Count | 80px |
| **Events** | Count of events performed | 60px |
| **Revenue** | Lifetime earned | 100px |
| **Actions** | Quick actions | 80px |

**Filters:**
- Verification Status
- BSL Enabled
- Has Uploads
- Has Events
- Revenue Range

**Admin Actions:**
- Approve/Reject Verification
- Enable/Disable BSL
- View Content
- View Events
- Export Profile

---

## 📦 MATRIX 9: CONTENT MATRIX
**Status:** ✅ Table Exists (needs matrix view)

**Purpose:** View all uploaded content (tracks, videos, etc.)

**Source Table (Existing):**
```sql
content_items
├── id UUID
├── artist_id UUID
├── title TEXT
├── content_type TEXT
├── is_published BOOLEAN
├── processing_status TEXT
├── play_count INTEGER (from metrics)
└── created_at TIMESTAMPTZ
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **Title** | Track name | 200px |
| **Artist** | Artist name (linked) | 150px |
| **Type** | audio/video/image | 80px |
| **Status** | Published/Draft/Processing | 100px |
| **Plays** | Total play count | 80px |
| **Favorites** | Count | 60px |
| **Revenue** | Lifetime earned | 100px |
| **Uploaded** | Date | 100px |
| **Actions** | Quick actions | 80px |

**Filters:**
- Content Type
- Published Status
- Processing Status
- Artist
- Play Count Range
- Date Range

**Admin Actions:**
- Approve/Reject Content
- Delete Content
- View Analytics
- Regenerate Waveform
- Export Metadata

---

## 💳 MATRIX 10: SUBSCRIPTION MATRIX
**Status:** ✅ Table Exists (needs matrix view)

**Purpose:** View all subscriptions

**Source Table (Existing):**
```sql
subscriptions
├── id UUID
├── fan_id UUID
├── artist_id UUID
├── status TEXT ('active', 'canceled', 'paused', 'expired')
├── created_at TIMESTAMPTZ
└── updated_at TIMESTAMPTZ
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **Fan Email** | Subscriber | 150px |
| **Artist** | Subscribed to | 150px |
| **Status** | Badge: active/canceled/paused | 100px |
| **Started** | Date | 100px |
| **Last Payment** | Date | 100px |
| **Next Billing** | Date | 100px |
| **Lifetime Value** | Total paid | 100px |
| **Actions** | Quick actions | 80px |

**Filters:**
- Status (active, canceled, paused, expired)
- Artist
- Fan
- Lifetime Value Range
- Date Range

**Admin Actions:**
- Cancel Subscription
- Refund Payment
- View Payment History
- Export Data

---

## 🗳️ MATRIX 11: VOTING MATRIX
**Status:** ✅ Table Exists (needs matrix view)

**Purpose:** View all votes cast at events

**Source Table (Existing):**
```sql
event_votes
├── id UUID
├── event_id UUID
├── participant_id UUID
├── event_artist_id UUID
├── vote_weight INTEGER
└── created_at TIMESTAMPTZ
```

**Matrix Columns:**

| Column | Description | Width |
|--------|-------------|-------|
| **Event** | Event name (linked) | 200px |
| **Voter Email** | Who voted | 150px |
| **Artist** | Voted for | 150px |
| **Weight** | Vote value | 60px |
| **Source** | web/qr/embedded | 80px |
| **Date** | Timestamp | 120px |

**Filters:**
- Event
- Artist
- Voter
- Date Range

**Admin Actions:**
- Delete Vote (with audit)
- View Event Details
- Export Votes

---

## 📋 IMPLEMENTATION PRIORITY

### **Phase 1: Core Matrices (Week 1-2)**
1. ✅ User Matrix (DONE - documented)
2. 🔄 Media Engagement Log Matrix (table exists, need UI)
3. 🔄 Listening History Matrix (table exists, need UI)
4. 🔄 Events Matrix (table exists, need UI)

### **Phase 2: Transaction Matrices (Week 3-4)**
5. ❌ Treasury Transactions Matrix (table doesn't exist)
6. ❌ Treasury Accounts Matrix (table doesn't exist)
7. 🔄 Subscription Matrix (table exists, need UI)

### **Phase 3: Analytics Matrices (Week 5-6)**
8. ❌ Coliseum Metrics Matrix (table doesn't exist)
9. ❌ Leaderboard Matrix (derived from Coliseum)
10. ❌ Passport Events Matrix (table doesn't exist)

### **Phase 4: Supporting Matrices (Week 7-8)**
11. 🔄 Artist Matrix (table exists, need UI)
12. 🔄 Content Matrix (table exists, need UI)
13. 🔄 Voting Matrix (table exists, need UI)

---

## 🎨 SHARED COMPONENTS LIBRARY

Create reusable components for all matrices:

```
/src/components/dia/shared/
├── DIAMatrix.tsx               ← Generic matrix container
├── DIAMatrixHeader.tsx         ← Title + stats + export
├── DIAMatrixFilters.tsx        ← Unified filter bar
├── DIAMatrixSearch.tsx         ← Search input
├── DIAMatrixTable.tsx          ← Generic data table
├── DIAMatrixRow.tsx            ← Table row with expand
├── DIAMatrixPagination.tsx     ← Page controls
├── DIAMatrixBulkActions.tsx    ← Bulk action bar
├── DIAMatrixExport.tsx         ← Export modal (CSV/JSON/PDF)
├── DIAMatrixColumnToggle.tsx   ← Show/hide columns
└── DIAMatrixSummaryCard.tsx    ← Stat card component
```

---

## 🔐 SECURITY & AUDIT

### **Access Control:**
- All matrices: Admin role only
- RLS policies: Admin can read all tables
- API endpoints: Require admin JWT

### **Audit Logging:**
```sql
CREATE TABLE dia_admin_audit_log (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  matrix_type TEXT,
  target_entity_type TEXT,
  target_entity_id UUID,
  changes JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

Every admin action logged:
- View user details
- Export data
- Delete records
- Suspend accounts
- Regenerate DNA
- Process payouts
- etc.

---

## 📊 SUMMARY

**Total Matrices to Build:** 13

**Status:**
- ✅ Documented: 1 (User Matrix)
- 🔄 Tables Exist, Need UI: 7
- ❌ Tables Don't Exist Yet: 5

**Next Steps:**
1. Build generic `DIAMatrix` component library
2. Implement matrices for existing tables first
3. Build Treasury/Coliseum/Passport tables
4. Implement remaining matrices

---

**Document Status:** Comprehensive Requirements Defined
**Last Updated:** 2025-11-09
**Priority:** HIGH (Core DIA functionality)
