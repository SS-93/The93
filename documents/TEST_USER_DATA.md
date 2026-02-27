# 🧪 TEST USER DATA - dmstest49@gmail.com

**Purpose:** Baseline data for DIA dashboard development and DNA mirroring testing

---

## 📋 USER IDENTITY

```json
{
  "user_id": "15480116-8c78-4a75-af8c-2c70795333a6",
  "email": "dmstest49@gmail.com",
  "created_at": "2025-08-03 10:42:42.851076+00",
  "last_sign_in_at": "2025-11-07 23:06:25.270277+00",
  "email_confirmed_at": "2025-08-03 10:45:08.449835+00"
}
```

**Account Age:** ~3 months (created Aug 3, 2025)
**Last Active:** Nov 7, 2025 (23:06 UTC)
**Status:** ✅ Email confirmed

---

## 🔍 DATA TO QUERY NEXT

### **Pending Queries** (need to run remaining queries from QUERY_TEST_USER.sql):

1. **User Profile & MediaID**
   - Display name
   - Role (fan/artist/brand/developer/admin)
   - MediaID: interests, genre_preferences, content_flags
   - Location code
   - Profile embedding (DNA vector)

2. **Listening History**
   - Event types (played, added, downloaded)
   - Content titles + artists
   - Play duration, progress percentage
   - Session IDs

3. **Media Engagement Log**
   - Event types (track_play, track_complete, etc.)
   - Metadata (JSONB)
   - Session tracking

4. **Listening Sessions**
   - Device types
   - Total tracks played
   - Session duration
   - Context (discovery, playlist, etc.)

5. **Concierto Interactions**
   - Event votes cast
   - Events attended
   - Event titles

6. **Artist Profile** (if exists)
   - Artist name
   - Bio, banner
   - Verification status
   - Uploaded content

7. **Summary Counts**
   - Total listening history entries
   - Total engagement log entries
   - Total sessions
   - Total event votes

---

## 🧬 DNA STATE ANALYSIS

### **MediaID Records**

⚠️ **Duplicate MediaID Issue**: User has 2 MediaID records (likely from testing/reset)
- MediaID 1: `9b4324d1-009b-4cf9-b9fd-a77b985315ed` (created 2025-09-01 19:55:51)
- MediaID 2: `16899249-79f4-400b-8fef-eaaae7476d3a` (created 2025-09-01 19:59:37)

**Most Recent MediaID:** `16899249-79f4-400b-8fef-eaaae7476d3a`

### **ATGC Bases (Static Identity)**

```
A (Adenine) = Interests ✅
  - Current: ["🎵 Discovering new music", "🔥 Underground scenes", "📱 Exclusive content", "🎬 Behind-the-scenes access"]
  - Status: 4 interests selected
  - Influence: Cultural DNA foundation

T (Thymine) = Genre Preferences ❌
  - Current: [] (EMPTY)
  - Status: No genres selected yet
  - Influence: Cultural DNA primary signal (NOT SET)

G (Guanine) = Content Flags ❌
  - Current: {} (EMPTY JSONB)
  - Status: No content flags set
  - Influence: Behavioral + Economic DNA (NOT SET)

C (Cytosine) = Location + Privacy ❌
  - Location Code: "" (EMPTY)
  - Privacy Settings: Not in content_flags
  - Status: No location set
  - Influence: Spatial DNA + consent gating (NOT SET)
```

### **DNA Vector State**

```
❌ profile_embedding: NULL (has_dna_vector = false)

Status: DNA NEVER INITIALIZED
- No composite DNA vector (1536-d)
- No domain-specific vectors (cultural, behavioral, economic, spatial)
- User has NOT gone through DNA generation flow
```

### **Helix Structure (Dynamic Interactions)**

**Interaction Timeline:**
```
[Will be populated from listening_history + media_engagement_log]

Example format:
- 2025-11-07 23:06:25 | track_play | "Track Title" by Artist | 45s / 3:30 (21%)
- 2025-11-07 22:45:12 | vote_cast | Event: "Local Showcase" | Artist: XYZ
- 2025-11-06 19:30:00 | track_complete | "Another Track" | 100%
```

**Interaction Types Present:** [PENDING]
**Total Interactions:** [PENDING]
**Most Recent Interaction:** Nov 7, 2025 23:06:25 UTC
**First Interaction:** [PENDING]

---

## 📊 EXPECTED DATA STRUCTURE

### **MediaID DNA State**
```typescript
{
  userId: "15480116-8c78-4a75-af8c-2c70795333a6",
  mediaIdId: "[PENDING]",

  // ATGC Bases
  bases: {
    A_interests: string[],          // [PENDING]
    T_genres: string[],             // [PENDING]
    G_contentFlags: object,         // [PENDING]
    C_location_privacy: {           // [PENDING]
      locationCode: string,
      privacySettings: object
    }
  },

  // 4-Domain DNA (if exists)
  culturalDNA: number[384],    // [PENDING - may not exist yet]
  behavioralDNA: number[384],  // [PENDING]
  economicDNA: number[384],    // [PENDING]
  spatialDNA: number[384],     // [PENDING]
  compositeDNA: number[1536],  // profile_embedding column

  // Metadata
  lastUpdated: Date,
  generationVersion: number,
  confidenceScore: number
}
```

### **Interaction History**
```typescript
{
  listening_history: HistoryEntry[],   // [PENDING COUNT]
  engagement_log: EngagementEntry[],   // [PENDING COUNT]
  sessions: SessionEntry[],            // [PENDING COUNT]
  event_votes: VoteEntry[]             // [PENDING COUNT]
}
```

---

## 🎯 DIA DASHBOARD TEST SCENARIOS

### **Scenario 1: View User Profile**
- Input: Email `dmstest49@gmail.com`
- Expected: User profile card with role, MediaID ID, account age
- Test: Display ATGC bases visually

### **Scenario 2: View Interaction Timeline**
- Input: user_id `15480116-8c78-4a75-af8c-2c70795333a6`
- Expected: Chronological list of all interactions
- Test: Group by session, filter by type

### **Scenario 3: View DNA State**
- Input: user_id
- Expected: 4-domain DNA vectors (or default if not initialized)
- Test: Show confidence score, last updated timestamp

### **Scenario 4: Manually Trigger DNA Update**
- Input: Select an interaction, click "Apply to DNA"
- Expected: DNA vectors update with calculated influence
- Test: Show before/after delta norms

### **Scenario 5: View System Health**
- Expected: Total users, active today, interactions/24h
- Test: Real-time metrics

---

## 🔄 NEXT ACTIONS

1. **Run remaining SQL queries** to populate [PENDING] fields
2. **Document actual data** (replace PENDING with real values)
3. **Build DIA dashboard** using this user as test case
4. **Test DNA mirroring** with this user's interactions
5. **Verify influence weights** work correctly

---

## 📝 NOTES

- This is a **test account** - safe to experiment with
- Use for **inside-out development**: Build DIA → Test with real data → Iterate
- Once DIA works with this user, expand to all users
- DNA state may not exist yet (profile_embedding may be NULL) - that's OK, we'll initialize it

---

**Status:** Awaiting full query results
**Last Updated:** 2025-11-09
**Next Step:** Run full QUERY_TEST_USER.sql and populate data
