# 🗺️ DIA IMPLEMENTATION ROADMAP

**Purpose:** Step-by-step implementation plan for Department of Internal Affairs (DIA) admin dashboard with DNA mirroring integration

**Status:** Ready for Phase 1 implementation
**Last Updated:** 2025-11-09

---

## 📊 PHASE 1: FOUNDATION (Week 1-2)

### 1.1 Generic DIAMatrix Component Library

**Location:** `/src/components/dia/shared/`

**Components to Build:**

```typescript
// DIAMatrix.tsx - Generic container
interface DIAMatrixProps<T> {
  title: string
  data: T[]
  columns: ColumnDef<T>[]
  filters: FilterDef[]
  actions: ActionDef<T>[]
  onRefresh: () => Promise<void>
  expandableDetail?: (row: T) => React.ReactNode
}

// DIAMatrixHeader.tsx
interface DIAMatrixHeaderProps {
  title: string
  stats: { label: string; value: string | number }[]
  onExport: () => void
  onRefresh: () => void
}

// DIAMatrixFilters.tsx
interface DIAMatrixFiltersProps {
  filters: FilterDef[]
  activeFilters: Record<string, any>
  onFilterChange: (filters: Record<string, any>) => void
}

// DIAMatrixTable.tsx
interface DIAMatrixTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  expandableDetail?: (row: T) => React.ReactNode
  onSort: (column: string, direction: 'asc' | 'desc') => void
}

// DIAMatrixPagination.tsx
interface DIAMatrixPaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

// DIAMatrixBulkActions.tsx
interface DIAMatrixBulkActionsProps<T> {
  selectedRows: T[]
  actions: BulkActionDef<T>[]
  onAction: (action: string, rows: T[]) => Promise<void>
}
```

**Files to Create:**
- `/src/components/dia/shared/DIAMatrix.tsx`
- `/src/components/dia/shared/DIAMatrixHeader.tsx`
- `/src/components/dia/shared/DIAMatrixFilters.tsx`
- `/src/components/dia/shared/DIAMatrixTable.tsx`
- `/src/components/dia/shared/DIAMatrixPagination.tsx`
- `/src/components/dia/shared/DIAMatrixBulkActions.tsx`
- `/src/components/dia/shared/types.ts`

---

### 1.2 DIA Dashboard Layout & Routing

**Location:** `/src/components/dia/DIADashboard.tsx`

**Structure:**
```typescript
// DIADashboard.tsx - Main layout
<DIADashboard>
  <DIASidebar>
    <DIAMatrixNav matrices={allMatrices} />
  </DIASidebar>
  <DIAContent>
    <Routes>
      <Route path="/dia/users" element={<UserMatrix />} />
      <Route path="/dia/engagement" element={<MediaEngagementMatrix />} />
      <Route path="/dia/listening" element={<ListeningHistoryMatrix />} />
      <Route path="/dia/events" element={<EventsMatrix />} />
      <Route path="/dia/artists" element={<ArtistMatrix />} />
      <Route path="/dia/content" element={<ContentMatrix />} />
      <Route path="/dia/subscriptions" element={<SubscriptionMatrix />} />
      <Route path="/dia/voting" element={<VotingMatrix />} />
      {/* Phase 2 */}
      <Route path="/dia/treasury/transactions" element={<TreasuryTransactionMatrix />} />
      <Route path="/dia/treasury/accounts" element={<TreasuryAccountMatrix />} />
      {/* Phase 3 */}
      <Route path="/dia/coliseum/metrics" element={<ColiseumMetricsMatrix />} />
      <Route path="/dia/coliseum/leaderboards" element={<LeaderboardMatrix />} />
      <Route path="/dia/passport" element={<PassportMatrix />} />
    </Routes>
  </DIAContent>
</DIADashboard>
```

**Files to Create:**
- `/src/components/dia/DIADashboard.tsx`
- `/src/components/dia/DIASidebar.tsx`
- `/src/components/dia/DIAMatrixNav.tsx`

**Route Protection:**
```typescript
// App.tsx - Add DIA route
<Route
  path="/dia/*"
  element={
    <SmartRouteGuard allowedRoles={['admin']}>
      <DIADashboard />
    </SmartRouteGuard>
  }
/>
```

---

### 1.3 User Matrix MVP (Test with dmstest49@gmail.com)

**Location:** `/src/components/dia/matrices/UserMatrix.tsx`

**Implementation:**

```typescript
// UserMatrix.tsx
import { DIAMatrix } from '../shared/DIAMatrix'
import { useUserMatrix } from '@/hooks/dia/useUserMatrix'

interface UserMatrixRow {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
  last_sign_in_at: string
  email_confirmed_at: string | null
  has_dna: boolean
  has_mediaid: boolean
  listening_count: number
  engagement_count: number
  event_votes_count: number
}

export function UserMatrix() {
  const { data, loading, filters, setFilters, refresh } = useUserMatrix()

  const columns: ColumnDef<UserMatrixRow>[] = [
    { id: 'email', label: 'Email', sortable: true },
    { id: 'display_name', label: 'Display Name', sortable: true },
    { id: 'role', label: 'Role', sortable: true, badge: true },
    { id: 'created_at', label: 'Created', sortable: true, type: 'date' },
    { id: 'last_sign_in_at', label: 'Last Active', sortable: true, type: 'date' },
    { id: 'has_dna', label: 'DNA', type: 'boolean' },
    { id: 'listening_count', label: 'Listens', sortable: true },
    { id: 'engagement_count', label: 'Interactions', sortable: true },
  ]

  const filterDefs: FilterDef[] = [
    { id: 'search', type: 'text', placeholder: 'Search by email or name' },
    { id: 'role', type: 'select', options: ['fan', 'artist', 'brand', 'developer', 'admin'] },
    { id: 'has_dna', type: 'boolean', label: 'Has DNA' },
    { id: 'date_range', type: 'daterange', label: 'Created' },
  ]

  const actions: ActionDef<UserMatrixRow>[] = [
    { id: 'view_journey', label: 'View Journey', icon: 'timeline' },
    { id: 'export_data', label: 'Export Data', icon: 'download' },
    { id: 'regenerate_dna', label: 'Regenerate DNA', icon: 'refresh' },
  ]

  const expandableDetail = (row: UserMatrixRow) => (
    <UserMatrixDetailPanel userId={row.id} />
  )

  return (
    <DIAMatrix
      title="User Matrix"
      data={data}
      columns={columns}
      filters={filterDefs}
      actions={actions}
      onRefresh={refresh}
      expandableDetail={expandableDetail}
    />
  )
}
```

**Hook Implementation:**

```typescript
// /src/hooks/dia/useUserMatrix.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useUserMatrix() {
  const [data, setData] = useState<UserMatrixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchData()
  }, [filters])

  async function fetchData() {
    setLoading(true)

    let query = supabase
      .from('dia_user_matrix_view')
      .select('*')

    // Apply filters
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`)
    }
    if (filters.role) {
      query = query.eq('role', filters.role)
    }
    if (filters.has_dna !== undefined) {
      query = query.eq('has_dna', filters.has_dna)
    }
    if (filters.date_range) {
      query = query.gte('created_at', filters.date_range.start)
                   .lte('created_at', filters.date_range.end)
    }

    const { data: result, error } = await query
      .order('last_sign_in_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching user matrix:', error)
    } else {
      setData(result || [])
    }

    setLoading(false)
  }

  return { data, loading, filters, setFilters, refresh: fetchData }
}
```

**Materialized View (SQL):**

```sql
-- Create materialized view for performance
CREATE MATERIALIZED VIEW dia_user_matrix_view AS
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  p.display_name,
  p.role,
  m.id IS NOT NULL as has_mediaid,
  m.profile_embedding IS NOT NULL as has_dna,
  COALESCE(lh.listening_count, 0) as listening_count,
  COALESCE(mel.engagement_count, 0) as engagement_count,
  COALESCE(ev.votes_count, 0) as event_votes_count
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN media_ids m ON m.user_uuid = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as listening_count
  FROM listening_history
  GROUP BY user_id
) lh ON lh.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as engagement_count
  FROM media_engagement_log
  GROUP BY user_id
) mel ON mel.user_id = u.id
LEFT JOIN (
  SELECT user_uuid, COUNT(*) as votes_count
  FROM event_votes
  GROUP BY user_uuid
) ev ON ev.user_uuid = u.id;

-- Create indexes
CREATE INDEX idx_dia_user_matrix_email ON dia_user_matrix_view(email);
CREATE INDEX idx_dia_user_matrix_role ON dia_user_matrix_view(role);
CREATE INDEX idx_dia_user_matrix_last_active ON dia_user_matrix_view(last_sign_in_at DESC);

-- Refresh every 5 minutes
CREATE OR REPLACE FUNCTION refresh_dia_user_matrix()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dia_user_matrix_view;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron extension)
SELECT cron.schedule('refresh-dia-user-matrix', '*/5 * * * *', 'SELECT refresh_dia_user_matrix()');
```

**Files to Create:**
- `/src/components/dia/matrices/UserMatrix.tsx`
- `/src/components/dia/matrices/UserMatrixDetailPanel.tsx`
- `/src/hooks/dia/useUserMatrix.ts`
- `/supabase/migrations/YYYYMMDDHHMMSS_create_dia_user_matrix_view.sql`

---

### 1.4 DNA Influence Settings UI

**Location:** `/src/components/settings/DNAInfluenceSettings.tsx`

**Integration:** Add to existing MediaIDSettings.tsx

```typescript
// DNAInfluenceSettings.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { UserInfluencePreferences } from '@/lib/dna/influenceWeights'

export function DNAInfluenceSettings({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState<UserInfluencePreferences>({
    culturalMultiplier: 1.0,
    behavioralMultiplier: 1.0,
    economicMultiplier: 1.0,
    spatialMultiplier: 1.0,
    learningRate: 0.1,
  })

  useEffect(() => {
    loadPreferences()
  }, [userId])

  async function loadPreferences() {
    const { data, error } = await supabase
      .from('media_ids')
      .select('content_flags')
      .eq('user_uuid', userId)
      .single()

    if (data?.content_flags?.dna_preferences) {
      setPreferences(data.content_flags.dna_preferences)
    }
  }

  async function savePreferences() {
    const { error } = await supabase
      .from('media_ids')
      .update({
        content_flags: {
          ...contentFlags,
          dna_preferences: preferences
        }
      })
      .eq('user_uuid', userId)

    if (error) {
      console.error('Error saving DNA preferences:', error)
    }
  }

  return (
    <div className="dna-influence-settings">
      <h3>DNA Influence Preferences</h3>
      <p>Control how your interactions shape your recommendations</p>

      {/* Cultural Domain */}
      <div className="preference-control">
        <label>
          Cultural Influence (Genre, Mood, Artist Preferences)
          <span className="value">{preferences.culturalMultiplier.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={preferences.culturalMultiplier}
          onChange={(e) => setPreferences({
            ...preferences,
            culturalMultiplier: parseFloat(e.target.value)
          })}
        />
        <p className="help-text">
          Higher = Plays/likes influence recommendations more strongly
        </p>
      </div>

      {/* Behavioral Domain */}
      <div className="preference-control">
        <label>
          Behavioral Influence (Listening Patterns, Session Context)
          <span className="value">{preferences.behavioralMultiplier.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={preferences.behavioralMultiplier}
          onChange={(e) => setPreferences({
            ...preferences,
            behavioralMultiplier: parseFloat(e.target.value)
          })}
        />
        <p className="help-text">
          Higher = Listening habits (time, device, repeat) matter more
        </p>
      </div>

      {/* Economic Domain */}
      <div className="preference-control">
        <label>
          Economic Influence (Purchases, Tips, Subscriptions)
          <span className="value">{preferences.economicMultiplier.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={preferences.economicMultiplier}
          onChange={(e) => setPreferences({
            ...preferences,
            economicMultiplier: parseFloat(e.target.value)
          })}
        />
        <p className="help-text">
          Higher = Spending signals stronger preference
        </p>
      </div>

      {/* Spatial Domain */}
      <div className="preference-control">
        <label>
          Spatial Influence (Location, Events, Local Artists)
          <span className="value">{preferences.spatialMultiplier.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={preferences.spatialMultiplier}
          onChange={(e) => setPreferences({
            ...preferences,
            spatialMultiplier: parseFloat(e.target.value)
          })}
        />
        <p className="help-text">
          Higher = Location and local events influence more
        </p>
      </div>

      {/* Learning Rate */}
      <div className="preference-control">
        <label>
          Learning Speed
          <span className="value">{(preferences.learningRate * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0.05"
          max="0.3"
          step="0.01"
          value={preferences.learningRate}
          onChange={(e) => setPreferences({
            ...preferences,
            learningRate: parseFloat(e.target.value)
          })}
        />
        <p className="help-text">
          Higher = Recommendations adapt faster to new interactions
        </p>
      </div>

      <button onClick={savePreferences} className="save-btn">
        Save DNA Preferences
      </button>

      <div className="reset-section">
        <button onClick={() => setPreferences({
          culturalMultiplier: 1.0,
          behavioralMultiplier: 1.0,
          economicMultiplier: 1.0,
          spatialMultiplier: 1.0,
          learningRate: 0.1,
        })}>
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
```

**Files to Create:**
- `/src/components/settings/DNAInfluenceSettings.tsx`
- `/src/components/settings/DNAInfluenceSettings.css`

**Integration into MediaIDSettings.tsx:**
```typescript
// Add to MediaIDSettings.tsx
import { DNAInfluenceSettings } from './DNAInfluenceSettings'

// Add tab/section:
<section id="dna-preferences">
  <DNAInfluenceSettings userId={user.id} />
</section>
```

---

## 📊 PHASE 2: EXISTING TABLE MATRICES (Week 3-4)

### 2.1 Media Engagement Log Matrix

**Location:** `/src/components/dia/matrices/MediaEngagementMatrix.tsx`

**Query:**
```sql
SELECT
  mel.id,
  mel.user_id,
  u.email as user_email,
  mel.event_type,
  mel.content_id,
  c.title as content_title,
  c.artist_name,
  mel.metadata,
  mel.session_id,
  mel.created_at
FROM media_engagement_log mel
LEFT JOIN auth.users u ON u.id = mel.user_id
LEFT JOIN content_items c ON c.id = mel.content_id
ORDER BY mel.created_at DESC
LIMIT 1000;
```

---

### 2.2 Listening History Matrix

**Location:** `/src/components/dia/matrices/ListeningHistoryMatrix.tsx`

**Query:**
```sql
SELECT
  lh.id,
  lh.user_id,
  u.email as user_email,
  lh.content_id,
  c.title as content_title,
  c.artist_name,
  lh.event_type,
  lh.play_duration,
  lh.progress_percentage,
  lh.session_id,
  lh.created_at
FROM listening_history lh
LEFT JOIN auth.users u ON u.id = lh.user_id
LEFT JOIN content_items c ON c.id = lh.content_id
ORDER BY lh.created_at DESC
LIMIT 1000;
```

---

### 2.3 Events Matrix (Concierto)

**Location:** `/src/components/dia/matrices/EventsMatrix.tsx`

**Query:**
```sql
SELECT
  e.id,
  e.title,
  e.host_id,
  u.email as host_email,
  e.location,
  e.event_date,
  e.status,
  COALESCE(v.vote_count, 0) as total_votes,
  COALESCE(a.attendee_count, 0) as total_attendees,
  e.created_at
FROM events e
LEFT JOIN auth.users u ON u.id = e.host_id
LEFT JOIN (
  SELECT event_id, COUNT(*) as vote_count
  FROM event_votes
  GROUP BY event_id
) v ON v.event_id = e.id
LEFT JOIN (
  SELECT event_id, COUNT(*) as attendee_count
  FROM event_attendees
  GROUP BY event_id
) a ON a.event_id = e.id
ORDER BY e.event_date DESC
LIMIT 100;
```

---

### 2.4 Artist Matrix

**Location:** `/src/components/dia/matrices/ArtistMatrix.tsx`

**Query:**
```sql
SELECT
  ap.id,
  ap.user_id,
  u.email,
  ap.artist_name,
  ap.verified,
  ap.bio,
  COALESCE(c.content_count, 0) as uploads_count,
  COALESCE(e.event_count, 0) as events_count,
  ap.created_at
FROM artist_profiles ap
LEFT JOIN auth.users u ON u.id = ap.user_id
LEFT JOIN (
  SELECT artist_id, COUNT(*) as content_count
  FROM content_items
  GROUP BY artist_id
) c ON c.artist_id = ap.id
LEFT JOIN (
  SELECT host_id, COUNT(*) as event_count
  FROM events
  GROUP BY host_id
) e ON e.host_id = ap.user_id
ORDER BY ap.created_at DESC;
```

---

### 2.5 Content Matrix

**Location:** `/src/components/dia/matrices/ContentMatrix.tsx`

**Query:**
```sql
SELECT
  c.id,
  c.title,
  c.artist_name,
  c.artist_id,
  c.duration,
  c.file_type,
  c.checksum,
  COALESCE(p.play_count, 0) as play_count,
  COALESCE(f.favorite_count, 0) as favorite_count,
  c.created_at
FROM content_items c
LEFT JOIN (
  SELECT content_id, COUNT(*) as play_count
  FROM listening_history
  WHERE event_type = 'played'
  GROUP BY content_id
) p ON p.content_id = c.id
LEFT JOIN (
  SELECT content_id, COUNT(*) as favorite_count
  FROM media_engagement_log
  WHERE event_type = 'favorited'
  GROUP BY content_id
) f ON f.content_id = c.id
ORDER BY c.created_at DESC
LIMIT 100;
```

---

### 2.6 Subscription Matrix

**Location:** `/src/components/dia/matrices/SubscriptionMatrix.tsx`

**Query:**
```sql
SELECT
  s.id,
  s.user_id,
  u.email as user_email,
  s.subscription_type,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.stripe_subscription_id,
  s.created_at
FROM subscriptions s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.current_period_start DESC
LIMIT 100;
```

---

### 2.7 Voting Matrix

**Location:** `/src/components/dia/matrices/VotingMatrix.tsx`

**Query:**
```sql
SELECT
  ev.id,
  ev.user_uuid,
  u.email as voter_email,
  ev.event_id,
  e.title as event_title,
  ev.artist_id,
  ap.artist_name,
  ev.created_at
FROM event_votes ev
LEFT JOIN auth.users u ON u.id = ev.user_uuid
LEFT JOIN events e ON e.id = ev.event_id
LEFT JOIN artist_profiles ap ON ap.id = ev.artist_id
ORDER BY ev.created_at DESC
LIMIT 1000;
```

---

## 💰 PHASE 3: TREASURY SYSTEM (Week 5-6)

### 3.1 Treasury Database Schema

**Migration File:** `20250930160000_create_treasury_system.sql`

```sql
-- Treasury Accounts (user balances)
CREATE TABLE treasury_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  pending_cents INTEGER NOT NULL DEFAULT 0,
  lifetime_earned_cents INTEGER NOT NULL DEFAULT 0,
  stripe_connect_account_id TEXT,
  stripe_account_status TEXT, -- 'not_connected', 'pending', 'active', 'restricted'
  payout_schedule TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  minimum_payout_cents INTEGER DEFAULT 2000, -- $20 minimum
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Treasury Transactions (all financial events)
CREATE TABLE treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'track_play', 'track_purchase', 'tip', 'subscription', 'payout', 'refund'
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'

  -- Related entities
  content_id UUID REFERENCES content_items(id),
  event_id UUID REFERENCES events(id),
  subscription_id UUID REFERENCES subscriptions(id),

  -- Stripe metadata
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_payout_id TEXT,

  -- Split metadata (JSONB)
  split_breakdown JSONB, -- { "artist1": 0.4, "artist2": 0.3, "platform": 0.3 }
  referral_attribution JSONB, -- { "referrer_id": "uuid", "commission": 0.05 }

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_transaction_type CHECK (
    transaction_type IN (
      'track_play', 'track_purchase', 'album_purchase',
      'tip', 'subscription', 'event_ticket',
      'payout', 'refund', 'platform_fee'
    )
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
  )
);

-- Payout Contracts (artist payment terms)
CREATE TABLE payout_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'custom', 'label'

  -- Split percentages (sum should = 1.0)
  artist_percentage DECIMAL(5,4) DEFAULT 0.70, -- 70%
  platform_percentage DECIMAL(5,4) DEFAULT 0.30, -- 30%
  label_percentage DECIMAL(5,4) DEFAULT 0.00, -- 0% (if label deal)

  -- Payout terms
  minimum_payout_cents INTEGER DEFAULT 2000,
  payout_schedule TEXT DEFAULT 'weekly',

  -- Contract metadata
  contract_metadata JSONB,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  expiration_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(artist_id, effective_date)
);

-- Indexes
CREATE INDEX idx_treasury_accounts_user ON treasury_accounts(user_id);
CREATE INDEX idx_treasury_accounts_stripe ON treasury_accounts(stripe_connect_account_id);
CREATE INDEX idx_treasury_transactions_from ON treasury_transactions(from_user_id);
CREATE INDEX idx_treasury_transactions_to ON treasury_transactions(to_user_id);
CREATE INDEX idx_treasury_transactions_type ON treasury_transactions(transaction_type);
CREATE INDEX idx_treasury_transactions_status ON treasury_transactions(status);
CREATE INDEX idx_treasury_transactions_created ON treasury_transactions(created_at DESC);
CREATE INDEX idx_payout_contracts_artist ON payout_contracts(artist_id);

-- RLS Policies
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_contracts ENABLE ROW LEVEL SECURITY;

-- Users can view their own account
CREATE POLICY "Users can view own treasury account"
  ON treasury_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON treasury_transactions FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Artists can view their own contracts
CREATE POLICY "Artists can view own contracts"
  ON payout_contracts FOR SELECT
  USING (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

-- Admin access (via service role)
-- Admin policies handled by service role key
```

---

### 3.2 Treasury Transaction Matrix

**Location:** `/src/components/dia/matrices/TreasuryTransactionMatrix.tsx`

**Query:**
```sql
SELECT
  tt.id,
  tt.transaction_type,
  tt.from_user_id,
  fu.email as from_email,
  tt.to_user_id,
  tu.email as to_email,
  tt.amount_cents,
  tt.currency,
  tt.status,
  tt.content_id,
  c.title as content_title,
  tt.stripe_payment_intent_id,
  tt.split_breakdown,
  tt.referral_attribution,
  tt.created_at,
  tt.completed_at
FROM treasury_transactions tt
LEFT JOIN auth.users fu ON fu.id = tt.from_user_id
LEFT JOIN auth.users tu ON tu.id = tt.to_user_id
LEFT JOIN content_items c ON c.id = tt.content_id
ORDER BY tt.created_at DESC
LIMIT 1000;
```

---

### 3.3 Treasury Account Matrix

**Location:** `/src/components/dia/matrices/TreasuryAccountMatrix.tsx`

**Query:**
```sql
SELECT
  ta.id,
  ta.user_id,
  u.email,
  p.display_name,
  ta.balance_cents,
  ta.pending_cents,
  ta.lifetime_earned_cents,
  ta.stripe_connect_account_id,
  ta.stripe_account_status,
  ta.payout_schedule,
  ta.minimum_payout_cents,
  COALESCE(t.transaction_count, 0) as transaction_count,
  ta.updated_at
FROM treasury_accounts ta
LEFT JOIN auth.users u ON u.id = ta.user_id
LEFT JOIN profiles p ON p.id = ta.user_id
LEFT JOIN (
  SELECT to_user_id, COUNT(*) as transaction_count
  FROM treasury_transactions
  WHERE status = 'completed'
  GROUP BY to_user_id
) t ON t.to_user_id = ta.user_id
ORDER BY ta.lifetime_earned_cents DESC;
```

---

## 🏟️ PHASE 4: COLISEUM SYSTEM (Week 7-8)

### 4.1 Coliseum Database Schema

**Migration File:** `20250930170000_create_coliseum_system.sql`

```sql
-- Coliseum Metrics (all tracked events)
CREATE TABLE coliseum_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'track_play', 'track_complete', 'vote_cast', 'share', 'follow', etc.

  -- Subject (who did it)
  user_id UUID REFERENCES auth.users(id),

  -- Object (what was it done to)
  entity_type TEXT NOT NULL, -- 'track', 'artist', 'event', 'playlist'
  entity_id UUID NOT NULL,

  -- Context
  context JSONB, -- { "source": "discovery", "device": "mobile", "duration": 180 }

  -- Scoring (weighted by type)
  base_score DECIMAL(10,4) DEFAULT 1.0,
  weighted_score DECIMAL(10,4) DEFAULT 1.0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  CONSTRAINT valid_metric_type CHECK (
    metric_type IN (
      'track_play', 'track_complete', 'track_skip',
      'track_favorite', 'track_share', 'track_download',
      'artist_follow', 'artist_unfollow',
      'event_vote', 'event_attend', 'event_share',
      'playlist_create', 'playlist_add', 'playlist_share'
    )
  ),
  CONSTRAINT valid_entity_type CHECK (
    entity_type IN ('track', 'artist', 'event', 'playlist', 'album')
  )
);

-- Leaderboards (pre-aggregated rankings)
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type TEXT NOT NULL, -- 'artists_weekly', 'tracks_daily', 'events_monthly'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Rankings (JSONB array)
  rankings JSONB NOT NULL, -- [{ "rank": 1, "entity_id": "uuid", "score": 1250.5, "metadata": {} }]

  -- Metadata
  total_participants INTEGER,
  total_interactions INTEGER,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(leaderboard_type, period_start)
);

-- Indexes
CREATE INDEX idx_coliseum_metrics_user ON coliseum_metrics(user_id);
CREATE INDEX idx_coliseum_metrics_entity ON coliseum_metrics(entity_type, entity_id);
CREATE INDEX idx_coliseum_metrics_type ON coliseum_metrics(metric_type);
CREATE INDEX idx_coliseum_metrics_created ON coliseum_metrics(created_at DESC);
CREATE INDEX idx_leaderboards_type_period ON leaderboards(leaderboard_type, period_start DESC);

-- RLS
ALTER TABLE coliseum_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboards
CREATE POLICY "Leaderboards are publicly readable"
  ON leaderboards FOR SELECT
  USING (true);

-- Users can view their own metrics
CREATE POLICY "Users can view own metrics"
  ON coliseum_metrics FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 4.2 Coliseum Metrics Matrix

**Location:** `/src/components/dia/matrices/ColiseumMetricsMatrix.tsx`

**Query:**
```sql
SELECT
  cm.id,
  cm.metric_type,
  cm.user_id,
  u.email as user_email,
  cm.entity_type,
  cm.entity_id,
  CASE
    WHEN cm.entity_type = 'track' THEN c.title
    WHEN cm.entity_type = 'artist' THEN ap.artist_name
    WHEN cm.entity_type = 'event' THEN e.title
  END as entity_name,
  cm.base_score,
  cm.weighted_score,
  cm.context,
  cm.created_at
FROM coliseum_metrics cm
LEFT JOIN auth.users u ON u.id = cm.user_id
LEFT JOIN content_items c ON c.id = cm.entity_id AND cm.entity_type = 'track'
LEFT JOIN artist_profiles ap ON ap.id = cm.entity_id AND cm.entity_type = 'artist'
LEFT JOIN events e ON e.id = cm.entity_id AND cm.entity_type = 'event'
ORDER BY cm.created_at DESC
LIMIT 1000;
```

---

### 4.3 Leaderboard Matrix

**Location:** `/src/components/dia/matrices/LeaderboardMatrix.tsx`

**Query:**
```sql
SELECT
  l.id,
  l.leaderboard_type,
  l.period_start,
  l.period_end,
  l.rankings,
  l.total_participants,
  l.total_interactions,
  l.created_at
FROM leaderboards l
ORDER BY l.period_start DESC
LIMIT 100;
```

---

## 🛂 PHASE 5: PASSPORT SYSTEM (Week 9-10)

### 5.1 Passport Database Schema

**Migration File:** `20250930180000_create_passport_system.sql`

```sql
-- Passport Entries (immutable event log)
CREATE TABLE passport_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  device_id TEXT,

  -- Event details
  event_type TEXT NOT NULL, -- From PassportEventType enum
  event_category TEXT NOT NULL, -- 'player', 'concierto', 'treasury', 'coliseum', 'social', 'system'

  -- Entity references (flexible)
  entity_type TEXT, -- 'track', 'artist', 'event', 'transaction', 'metric'
  entity_id UUID,

  -- Event metadata (JSONB for flexibility)
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Processing flags
  processed_by_mediaid BOOLEAN DEFAULT false,
  processed_by_treasury BOOLEAN DEFAULT false,
  processed_by_coliseum BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,

  -- Immutable timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_event_category CHECK (
    event_category IN (
      'player', 'concierto', 'treasury', 'coliseum',
      'social', 'profile', 'content', 'system'
    )
  )
);

-- Indexes (critical for query performance)
CREATE INDEX idx_passport_user_created ON passport_entries(user_id, created_at DESC);
CREATE INDEX idx_passport_event_type ON passport_entries(event_type);
CREATE INDEX idx_passport_category ON passport_entries(event_category);
CREATE INDEX idx_passport_entity ON passport_entries(entity_type, entity_id);
CREATE INDEX idx_passport_session ON passport_entries(session_id);
CREATE INDEX idx_passport_processing ON passport_entries(processed_at)
  WHERE processed_by_mediaid = false
     OR processed_by_treasury = false
     OR processed_by_coliseum = false;

-- RLS
ALTER TABLE passport_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own passport
CREATE POLICY "Users can view own passport entries"
  ON passport_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert
-- (Handled by service role key)
```

---

### 5.2 Passport Matrix

**Location:** `/src/components/dia/matrices/PassportMatrix.tsx`

**Query:**
```sql
SELECT
  pe.id,
  pe.user_id,
  u.email as user_email,
  pe.event_type,
  pe.event_category,
  pe.entity_type,
  pe.entity_id,
  pe.metadata,
  pe.processed_by_mediaid,
  pe.processed_by_treasury,
  pe.processed_by_coliseum,
  pe.session_id,
  pe.created_at
FROM passport_entries pe
LEFT JOIN auth.users u ON u.id = pe.user_id
ORDER BY pe.created_at DESC
LIMIT 1000;
```

**Special Features:**
- Color-coded by event_category
- Processing status indicators (✓ MediaID, ✓ Treasury, ✓ Coliseum)
- Filter by unprocessed events
- Expandable detail showing full metadata + DNA influence weights
- "Reprocess" action for failed events

---

## 🔐 PHASE 6: SECURITY & AUDIT (Week 11)

### 6.1 Admin Audit Log

**Migration File:** `20250930190000_create_admin_audit_log.sql`

```sql
CREATE TABLE dia_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON dia_admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_created ON dia_admin_audit_log(created_at DESC);
```

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Complete When:
- ✅ Generic DIAMatrix components built and reusable
- ✅ DIA dashboard routes accessible at /dia/*
- ✅ User Matrix displays test user (dmstest49@gmail.com) correctly
- ✅ User Matrix expandable detail shows DNA state
- ✅ DNA Influence Settings UI functional in MediaID settings

### Phase 2 Complete When:
- ✅ All 7 existing table matrices functional
- ✅ Filters, sorting, pagination work consistently
- ✅ Export functionality works for all matrices

### Phase 3 Complete When:
- ✅ Treasury tables created and migrated
- ✅ Treasury Transaction Matrix displays mock transactions
- ✅ Treasury Account Matrix shows balances

### Phase 4 Complete When:
- ✅ Coliseum tables created and migrated
- ✅ Coliseum Metrics Matrix tracks interactions
- ✅ Leaderboard Matrix shows rankings

### Phase 5 Complete When:
- ✅ Passport table created and migrated
- ✅ Passport Matrix shows all events with DNA influence weights
- ✅ Passport processor integrated with DNA mirroring

### Phase 6 Complete When:
- ✅ Admin audit log functional
- ✅ All admin actions logged
- ✅ Security review passed

---

## 📁 FILE STRUCTURE

```
/src/components/dia/
├── DIADashboard.tsx                  # Main layout
├── DIASidebar.tsx                    # Navigation sidebar
├── DIAMatrixNav.tsx                  # Matrix switcher
├── shared/
│   ├── DIAMatrix.tsx                 # Generic container
│   ├── DIAMatrixHeader.tsx
│   ├── DIAMatrixFilters.tsx
│   ├── DIAMatrixTable.tsx
│   ├── DIAMatrixPagination.tsx
│   ├── DIAMatrixBulkActions.tsx
│   └── types.ts
├── matrices/
│   ├── UserMatrix.tsx
│   ├── UserMatrixDetailPanel.tsx
│   ├── MediaEngagementMatrix.tsx
│   ├── ListeningHistoryMatrix.tsx
│   ├── EventsMatrix.tsx
│   ├── ArtistMatrix.tsx
│   ├── ContentMatrix.tsx
│   ├── SubscriptionMatrix.tsx
│   ├── VotingMatrix.tsx
│   ├── TreasuryTransactionMatrix.tsx
│   ├── TreasuryAccountMatrix.tsx
│   ├── ColiseumMetricsMatrix.tsx
│   ├── LeaderboardMatrix.tsx
│   └── PassportMatrix.tsx

/src/hooks/dia/
├── useUserMatrix.ts
├── useMediaEngagementMatrix.ts
├── useListeningHistoryMatrix.ts
├── useEventsMatrix.ts
├── useArtistMatrix.ts
├── useContentMatrix.ts
├── useSubscriptionMatrix.ts
├── useVotingMatrix.ts
├── useTreasuryTransactionMatrix.ts
├── useTreasuryAccountMatrix.ts
├── useColiseumMetricsMatrix.ts
├── useLeaderboardMatrix.ts
└── usePassportMatrix.ts

/src/components/settings/
├── DNAInfluenceSettings.tsx          # User DNA preferences UI
└── DNAInfluenceSettings.css

/supabase/migrations/
├── YYYYMMDDHHMMSS_create_dia_user_matrix_view.sql
├── 20250930160000_create_treasury_system.sql
├── 20250930170000_create_coliseum_system.sql
├── 20250930180000_create_passport_system.sql
└── 20250930190000_create_admin_audit_log.sql
```

---

## 🚀 GETTING STARTED

1. **Phase 1 First Step:**
   ```bash
   # Create shared component directory
   mkdir -p src/components/dia/shared
   mkdir -p src/components/dia/matrices
   mkdir -p src/hooks/dia

   # Start with DIAMatrix generic component
   # Then build UserMatrix as proof of concept
   ```

2. **Test with dmstest49@gmail.com:**
   - User ID: `15480116-8c78-4a75-af8c-2c70795333a6`
   - Has interactions (listening history, engagement log)
   - Safe to experiment with

3. **Iterative Development:**
   - Build one matrix at a time
   - Test with real data
   - Refine generic components based on learnings

---

**Status:** Ready for implementation
**Next Action:** Begin Phase 1 - Generic DIAMatrix component library
