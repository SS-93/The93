# 🗄️ DIA USER MATRIX REQUIREMENTS
**Mirror Supabase User Database with Buckets Context**

---

## 📋 REQUIREMENT

**DIA Dashboard needs a "User Database" view that mirrors Supabase's user management interface but adds Buckets-specific metadata and actions.**

### **Why This Matters:**
- **Supabase User Management** shows: email, created_at, last_sign_in, providers, metadata
- **DIA User Matrix** shows: Same data + MediaID + DNA state + interactions + role + privilege level
- **Goal**: Admin can see complete user picture without leaving Buckets app

---

## 🗂️ SUPABASE USER DATABASE STRUCTURE

### **Core Tables to Mirror:**

#### **1. auth.users** (Supabase Auth)
```sql
auth.users
├── id (UUID) ← Primary key
├── email
├── email_confirmed_at
├── phone
├── phone_confirmed_at
├── created_at
├── updated_at
├── last_sign_in_at
├── confirmed_at
├── confirmation_sent_at
├── recovery_sent_at
├── email_change_sent_at
├── new_email
├── banned_until
├── reauthentication_sent_at
├── is_sso_user
├── deleted_at
└── raw_user_meta_data (JSONB)
    └── full_name, avatar_url, etc.
```

#### **2. profiles** (Buckets Extension)
```sql
profiles
├── id (UUID) → auth.users(id)
├── display_name
├── avatar_url
├── role ('fan' | 'artist' | 'brand' | 'developer' | 'admin')
├── email_verified
├── onboarding_completed
├── created_at
└── updated_at
```

#### **3. media_ids** (Buckets MediaID)
```sql
media_ids
├── id (UUID)
├── user_uuid → auth.users(id)
├── interests[]
├── genre_preferences[]
├── content_flags (JSONB)
├── location_code
├── profile_embedding (vector 1536) ← DNA
├── privacy_settings (JSONB)
├── version
├── is_active
├── created_at
└── updated_at
```

#### **4. artist_profiles** (If applicable)
```sql
artist_profiles
├── id (UUID)
├── user_id → auth.users(id)
├── artist_name
├── bio
├── banner_url
├── social_links (JSONB)
├── verification_status
└── bsl_enabled
```

---

## 🎨 DIA USER MATRIX DESIGN

### **View Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│ DIA USER MATRIX                                    🔍 Search    │
├─────────────────────────────────────────────────────────────────┤
│ Filters: [All Users ▼] [All Roles ▼] [Active ▼] [30 days ▼]  │
├─────────────────────────────────────────────────────────────────┤
│ 📊 Summary:                                                      │
│ Total Users: 1,247 | Active (7d): 823 | New (30d): 156         │
│ By Role: Fan (987) | Artist (143) | Brand (12) | Admin (5)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Table View (mirrors Supabase users table):                      │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Email              │ Role   │ MediaID │ DNA   │ Last Active ││
│ ├──────────────────────────────────────────────────────────────┤│
│ │ dmstest49@gmail.com│ fan    │ ✅ Yes  │ 0.72  │ 2h ago      ││
│ │ artist1@mail.com   │ artist │ ✅ Yes  │ 0.85  │ 1d ago      ││
│ │ brand@company.com  │ brand  │ ✅ Yes  │ 0.63  │ 5d ago      ││
│ │ newuser@mail.com   │ fan    │ ⚠️ No   │ N/A   │ Just now    ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ [← Previous]  Page 1 of 25  [Next →]                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Click user row to expand detailed view ↓                        │
└─────────────────────────────────────────────────────────────────┘
```

### **Expanded User Detail View:**

```
┌─────────────────────────────────────────────────────────────────┐
│ USER DETAILS: dmstest49@gmail.com                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────┬─────────────────────────────────────────┐│
│ │ 🔐 AUTH INFO        │ 🧬 MEDIAID DNA                          ││
│ │ (Supabase mirror)   │ (Buckets-specific)                      ││
│ ├─────────────────────┼─────────────────────────────────────────┤│
│ │ User ID:            │ MediaID ID:                             ││
│ │ 15480116-8c78...    │ a1b2c3d4-5e6f...                        ││
│ │                     │                                         ││
│ │ Email Confirmed:    │ ATGC Bases:                             ││
│ │ ✅ Yes (Aug 3)      │ A (Interests): Music, Tech, Art         ││
│ │                     │ T (Genres): Hip Hop, Jazz, Electronic   ││
│ │ Created:            │ G (Flags): {mood: "upbeat", ...}        ││
│ │ Aug 3, 2025         │ C (Location): US-NY                     ││
│ │                     │                                         ││
│ │ Last Sign In:       │ DNA Confidence: 0.72                    ││
│ │ Nov 7, 23:06 UTC    │ Last DNA Update: Nov 7, 22:45           ││
│ │                     │                                         ││
│ │ Provider:           │ DNA Evolution:                          ││
│ │ Email/Password      │ Generation: v23                         ││
│ │                     │ [View DNA Timeline →]                   ││
│ └─────────────────────┴─────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────┬─────────────────────────────────────────┐│
│ │ 👤 PROFILE          │ 📊 ACTIVITY SUMMARY                     ││
│ ├─────────────────────┼─────────────────────────────────────────┤│
│ │ Display Name:       │ Total Interactions: 1,247               ││
│ │ DJ Test 49          │ Listening History: 856                  ││
│ │                     │ Event Votes: 23                         ││
│ │ Role: fan           │ Shares (CALS): 12                       ││
│ │                     │                                         ││
│ │ Onboarding:         │ Last Interaction:                       ││
│ │ ✅ Completed        │ Nov 7, 23:06 (track_play)               ││
│ │                     │                                         ││
│ │ Email Verified:     │ Most Active:                            ││
│ │ ✅ Yes              │ Weekends, 8-11pm                        ││
│ └─────────────────────┴─────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 🛠️ ADMIN ACTIONS                                             ││
│ ├──────────────────────────────────────────────────────────────┤│
│ │ [View Full Journey] [Export Data] [Suspend User]            ││
│ │ [Regenerate DNA] [Clear History] [Send Notification]        ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 COLUMNS IN USER MATRIX TABLE

### **Default Columns (Visible):**

| Column | Source | Description | Width |
|--------|--------|-------------|-------|
| **Email** | `auth.users.email` | User email (clickable) | 200px |
| **Role** | `profiles.role` | Badge: fan/artist/brand/admin | 80px |
| **MediaID** | `media_ids.id` | ✅/⚠️ Has MediaID or not | 80px |
| **DNA Score** | Calculated | Confidence score 0-1 | 80px |
| **Last Active** | `auth.users.last_sign_in_at` | Relative time | 100px |
| **Status** | Calculated | 🟢 Active / 🟡 Idle / 🔴 Inactive | 80px |
| **Actions** | N/A | Quick action buttons | 100px |

### **Additional Columns (Toggleable):**

| Column | Source | Description |
|--------|--------|-------------|
| **User ID** | `auth.users.id` | Full UUID |
| **Created** | `auth.users.created_at` | Account creation date |
| **Email Confirmed** | `auth.users.email_confirmed_at` | Verification status |
| **Phone** | `auth.users.phone` | Phone number (if provided) |
| **Provider** | `auth.users` | Auth provider (email, google, etc.) |
| **Interactions** | Count from `listening_history` + `media_engagement_log` | Total interaction count |
| **Listening Time** | Sum from `listening_history` | Total minutes listened |
| **Event Votes** | Count from `event_votes` | Total votes cast |
| **Subscriptions** | `subscriptions.status` | Active/Cancelled |
| **Artist Profile** | `artist_profiles` | ✅ Has artist profile |
| **Content Uploaded** | Count from `content_items` | Tracks uploaded (if artist) |
| **Location** | `media_ids.location_code` | Geographic code |
| **Onboarding** | `profiles.onboarding_completed` | ✅/⏳ Status |
| **Banned Until** | `auth.users.banned_until` | Suspension info |

---

## 🔍 FILTERS & SEARCH

### **Filter Options:**

1. **Role Filter:**
   - All Users
   - Fans
   - Artists
   - Brands
   - Developers
   - Admins

2. **Activity Filter:**
   - All Users
   - Active (last 7 days)
   - Idle (7-30 days)
   - Inactive (30+ days)
   - Never Signed In

3. **MediaID Filter:**
   - All
   - Has MediaID
   - No MediaID
   - DNA Initialized
   - DNA Not Initialized

4. **Verification Filter:**
   - All
   - Email Verified
   - Email Unverified
   - Phone Verified
   - Artist Verified

5. **Date Range Filter:**
   - All Time
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - Custom Range

### **Search:**
- **Search by:** Email, User ID, Display Name, Artist Name
- **Real-time:** Debounced search as user types
- **Fuzzy matching:** Tolerant of typos

---

## 🗃️ DATA FETCHING STRATEGY

### **Query Structure:**

```typescript
interface UserMatrixQuery {
  // Filters
  role?: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'
  activityStatus?: 'active' | 'idle' | 'inactive'
  hasMediaId?: boolean
  hasDNA?: boolean
  emailVerified?: boolean

  // Search
  searchTerm?: string

  // Date range
  createdAfter?: Date
  lastActiveAfter?: Date

  // Pagination
  page: number
  pageSize: number

  // Sorting
  sortBy: 'email' | 'created_at' | 'last_sign_in_at' | 'role'
  sortOrder: 'asc' | 'desc'
}
```

### **SQL Query (Single JOIN):**

```sql
SELECT
  -- Auth data
  u.id as user_id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  u.phone,
  u.banned_until,
  u.raw_user_meta_data,

  -- Profile data
  p.display_name,
  p.role,
  p.avatar_url,
  p.onboarding_completed,

  -- MediaID data
  m.id as mediaid_id,
  m.interests,
  m.genre_preferences,
  m.location_code,
  m.profile_embedding IS NOT NULL as has_dna,
  m.updated_at as dna_updated_at,

  -- Artist profile (if exists)
  ap.artist_name,
  ap.verification_status,

  -- Activity counts (pre-aggregated)
  COALESCE(lh.listening_count, 0) as listening_count,
  COALESCE(ev.vote_count, 0) as vote_count,
  COALESCE(ci.content_count, 0) as content_count

FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN media_ids m ON m.user_uuid = u.id
LEFT JOIN artist_profiles ap ON ap.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as listening_count
  FROM listening_history
  GROUP BY user_id
) lh ON lh.user_id = u.id
LEFT JOIN (
  SELECT ep.email, COUNT(*) as vote_count
  FROM event_votes ev
  JOIN event_participants ep ON ep.id = ev.participant_id
  GROUP BY ep.email
) ev ON ev.email = u.email
LEFT JOIN (
  SELECT artist_id, COUNT(*) as content_count
  FROM content_items
  GROUP BY artist_id
) ci ON ci.artist_id = ap.id

WHERE
  -- Apply filters here
  ($1::text IS NULL OR p.role = $1)
  AND ($2::text IS NULL OR u.email ILIKE '%' || $2 || '%')
  AND ($3::timestamptz IS NULL OR u.last_sign_in_at >= $3)

ORDER BY u.last_sign_in_at DESC NULLS LAST
LIMIT $4 OFFSET $5;
```

### **Performance Optimization:**

1. **Materialized View** for user matrix (refresh every 5 minutes):
```sql
CREATE MATERIALIZED VIEW user_matrix_view AS
SELECT ... (full query above)

-- Refresh schedule
CREATE INDEX idx_user_matrix_email ON user_matrix_view(email);
CREATE INDEX idx_user_matrix_role ON user_matrix_view(role);
CREATE INDEX idx_user_matrix_last_active ON user_matrix_view(last_sign_in_at);
```

2. **Caching Strategy:**
- Cache full matrix for 5 minutes
- Cache individual user details for 1 minute
- Invalidate on user updates

---

## 🎯 DIA USER MATRIX COMPONENTS

### **Component Structure:**

```
DIAUserMatrix.tsx                    ← Main container
├── DIAUserMatrixFilters.tsx         ← Filter bar (role, activity, etc.)
├── DIAUserMatrixSearch.tsx          ← Search input
├── DIAUserMatrixSummary.tsx         ← Stats cards (total users, by role, etc.)
├── DIAUserMatrixTable.tsx           ← Main data table
│   ├── DIAUserMatrixRow.tsx         ← Table row (expandable)
│   └── DIAUserMatrixActions.tsx     ← Quick action buttons
├── DIAUserMatrixPagination.tsx      ← Page controls
└── DIAUserDetailPanel.tsx           ← Expanded user detail view
    ├── DIAUserAuthInfo.tsx          ← Supabase auth mirror
    ├── DIAUserMediaIDInfo.tsx       ← MediaID + DNA state
    ├── DIAUserProfileInfo.tsx       ← Profile data
    ├── DIAUserActivitySummary.tsx   ← Interaction stats
    └── DIAUserAdminActions.tsx      ← Admin action buttons
```

---

## 🔐 SECURITY & PERMISSIONS

### **Access Control:**

```typescript
// Only admins can access DIA User Matrix
const canAccessUserMatrix = (user: User): boolean => {
  return user.role === 'admin'
}

// RLS Policy (Supabase)
CREATE POLICY "Admins can view all users"
ON auth.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### **Audit Logging:**

Every admin action on User Matrix should be logged:

```typescript
interface AdminAuditLog {
  adminUserId: string
  action: 'view_user' | 'suspend_user' | 'export_data' | 'regenerate_dna'
  targetUserId: string
  timestamp: Date
  metadata: Record<string, any>
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Basic User Matrix (Week 1)**
- [ ] Create materialized view `user_matrix_view`
- [ ] Build `DIAUserMatrix` container component
- [ ] Build `DIAUserMatrixTable` with basic columns
- [ ] Implement search functionality
- [ ] Implement pagination
- [ ] Test with 1000+ users

### **Phase 2: Filters & Sorting (Week 2)**
- [ ] Build filter bar (role, activity, MediaID, verification)
- [ ] Implement sorting (by email, date, role, activity)
- [ ] Add column visibility toggles
- [ ] Cache query results

### **Phase 3: User Detail Panel (Week 3)**
- [ ] Build expandable row detail view
- [ ] Mirror Supabase auth data
- [ ] Display MediaID + DNA state
- [ ] Show activity summary
- [ ] Add admin action buttons

### **Phase 4: Admin Actions (Week 4)**
- [ ] Implement "View Full Journey"
- [ ] Implement "Export User Data" (GDPR)
- [ ] Implement "Suspend User"
- [ ] Implement "Regenerate DNA"
- [ ] Add audit logging for all actions

---

## 🎨 UI/UX REQUIREMENTS

### **Design Principles:**
1. **Match Supabase aesthetic** but with Buckets branding
2. **Data-dense** but readable (compact rows, clear hierarchy)
3. **Fast loading** (virtualized scrolling for 1000+ users)
4. **Keyboard navigation** (arrow keys, Enter to expand)
5. **Bulk actions** (select multiple users, bulk export)

### **Responsive Design:**
- Desktop: Full table view (1200px+)
- Tablet: Collapsible columns (768px-1199px)
- Mobile: Card view instead of table (<768px)

---

## 📊 SUCCESS METRICS

**User Matrix Performance:**
- [ ] Initial load < 1 second (100 users)
- [ ] Search response < 200ms
- [ ] Filter application < 300ms
- [ ] Pagination < 500ms
- [ ] User detail expansion < 100ms

**Admin Efficiency:**
- [ ] Find user by email in < 5 seconds
- [ ] View user's full journey in < 10 seconds
- [ ] Export user data in < 30 seconds

---

**Status:** Requirements Defined
**Next Step:** Build DIAUserMatrix component structure
**Priority:** HIGH (critical for DIA dashboard)
