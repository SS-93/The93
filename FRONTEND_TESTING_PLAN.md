# 🎯 COLISEUM FRONTEND TESTING PLAN

**Date:** February 1, 2026
**Goal:** Verify frontend leaderboard displays real data from backend processor

---

## ✅ PREREQUISITES VERIFIED

1. **Backend Processor** ✅
   - Deployed and active (Version 3)
   - Manual test successful: 100 events processed, 162 mutations
   - Processing real audio plays

2. **Database Tables** 🔄
   - Run verification SQL (in progress)
   - Waiting for user confirmation

3. **Frontend Route** ✅
   - `/coliseum` route exists and configured
   - ColiseumDashboard component ready
   - Router integration complete

---

## 2️⃣ FRONTEND TESTING STEPS

### Step 1: Start Development Server
```bash
cd /Users/pks.ml/Desktop/93/my-app
npm start
```

### Step 2: Access Coliseum Dashboard
1. Open browser: http://localhost:3000/coliseum
2. **Expected behavior:**
   - Page loads without errors
   - Shows "Public Access Banner" (if not logged in)
   - Displays domain tabs: A, T, G, C
   - Shows time range selector: 7d, 30d, All Time
   - Leaderboard table appears

### Step 3: Verify Data Display

**Check for real data:**
- Leaderboard should show artists with:
  - Rank numbers (#1, #2, #3, etc.)
  - Artist names
  - DNA Strength scores
  - Domain-specific metrics

**If NO data shows:**
- Check browser console for errors
- Verify Supabase connection
- Check materialized views exist

### Step 4: Test Domain Switching
1. Click each domain tab (A, T, G, C)
2. **Expected:** Different rankings per domain
3. **If locked domains:** Shows 🔒 icon (requires login/upgrade)

### Step 5: Test Time Ranges
1. Click "7 Days", "30 Days", "All Time"
2. **Expected:** Rankings update based on time window
3. **Note:** Data might be same if processor just started

### Step 6: Test Artist Profile Panel
1. Click on any artist in leaderboard
2. **Expected:**
   - Right panel shows artist DNA profile
   - DNA strength bars (A, T, G, C)
   - Growth trajectory metrics
   - Detailed metrics (if authenticated)

---

## 🔍 KNOWN ISSUES TO CHECK

### Issue 1: Missing Materialized Views
**Symptom:** Leaderboard shows "Failed to fetch leaderboard" error

**Cause:** Views like `coliseum_leaderboard_a_7d` don't exist

**Fix:** Run migration to create materialized views

### Issue 2: No Data in Leaderboard
**Symptom:** Empty leaderboard despite processor working

**Causes:**
1. Views need to be refreshed
2. Artist names missing (NULL in rankings)
3. Time range has no data yet

**Fix:** Manually refresh views or wait for CRON

### Issue 3: Authentication Required
**Symptom:** Can't access dashboard or shows limited data

**Status:** Should work in public mode (top 50)

**Fix:** Verify entitlements system allows public access

---

## 3️⃣ INTEGRATION TESTING PROTOCOL

### Test 1: Complete Play-to-Leaderboard Pipeline

**Goal:** Play audio → Passport logs → Processor runs → Leaderboard updates

**Steps:**

#### A. Play Audio Content
```
1. Login as test user
2. Navigate to artist dashboard or catalog
3. Play an audio track for at least 30 seconds
4. Note: Track ID, Artist ID, Timestamp
```

#### B. Verify Passport Logging
```sql
-- Run in Supabase Dashboard SQL Editor
SELECT
  id,
  event_type,
  event_data->>'content_id' as content_id,
  event_data->>'artist_id' as artist_id,
  coliseum_processed_at,
  created_at
FROM passport_entries
WHERE event_type = 'audio_play'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** New entry with NULL `coliseum_processed_at`

#### C. Trigger Processor Manually
```bash
curl -X POST \
  "https://iutnwgvzwyupsuguxnls.supabase.co/functions/v1/coliseum-processor" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected:**
```json
{
  "success": true,
  "processed": 1,
  "mutations": 1,
  "artists_updated": 1
}
```

#### D. Verify Mutations Created
```sql
-- Check DNA mutations were created
SELECT
  artist_id,
  domain,
  strength,
  created_at
FROM coliseum_dna_mutations
WHERE artist_id = 'YOUR_ARTIST_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** New mutations with timestamp matching processor run

#### E. Refresh Materialized Views
```sql
-- Refresh all leaderboard views
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_artist_rankings;
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_domain_rankings;
```

#### F. Check Frontend Updates
```
1. Refresh /coliseum page
2. Artist should appear in rankings or rank updated
3. DNA strength should increase
4. Recent activity timestamp updated
```

---

### Test 2: Multi-Domain Tracking

**Goal:** Verify all 4 domains (A, T, G, C) calculate correctly

**Test plays:**
- Domain A: Play diverse genres
- Domain T: Repeated plays by same user
- Domain G: Play premium content
- Domain C: Play from different locations (if tracked)

**Verify:** Each domain shows appropriate mutations

---

### Test 3: Time Window Accuracy

**Goal:** Verify 7d, 30d, alltime rankings differ

**Steps:**
1. View "All Time" rankings
2. Switch to "7 Days"
3. Compare: Recent activity artists should rank higher in 7d
4. Switch to "30 Days"
5. Compare: Should be between 7d and alltime

---

## 🐛 TROUBLESHOOTING GUIDE

### Problem: AudioPlayer not logging to Passport

**Check:**
```typescript
// In AudioPlayerContext.tsx
// Should call trackPlay which logs to media_engagement_log
await trackPlay({
  userId: user.id,
  contentId: state.currentTrack.id,
  ...
})
```

**Issue:** Currently logs to `media_engagement_log`, not `passport_entries`

**Fix Required:** Need to hook up Passport logging

**Files to check:**
- `/src/context/AudioPlayerContext.tsx`
- `/src/lib/listeningHistory.ts`
- `/src/lib/passport/passportClient.ts`

---

### Problem: Processor not picking up events

**Check:**
```sql
-- See unprocessed events
SELECT COUNT(*)
FROM passport_entries
WHERE coliseum_processed_at IS NULL
AND event_type = 'audio_play';
```

**If count = 0:** Events not being logged to passport_entries
**If count > 0:** Processor not running or failing

**Fixes:**
1. Verify CRON schedule (should be */5 * * * *)
2. Check processor logs in Supabase Dashboard
3. Test manual invocation

---

### Problem: Leaderboard shows stale data

**Cause:** Materialized views not refreshing

**Fix:**
```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY coliseum_artist_rankings;

-- Check last refresh time
SELECT viewname, schemaname
FROM pg_matviews
WHERE viewname LIKE 'coliseum%';
```

**Permanent fix:** Setup pg_cron to refresh every 5 minutes

---

## 📊 SUCCESS CRITERIA

### ✅ Frontend Testing Complete When:
- [ ] Coliseum dashboard loads without errors
- [ ] Leaderboard displays artists with real data
- [ ] Domain switching works (A, T, G, C)
- [ ] Time range switching works (7d, 30d, alltime)
- [ ] Artist profile panel loads on click
- [ ] DNA strength bars display correctly
- [ ] Public access banner shows for unauthenticated users

### ✅ Integration Testing Complete When:
- [ ] Play audio → Event logged to passport_entries
- [ ] Processor runs → Creates DNA mutations
- [ ] Mutations → Update artist rankings
- [ ] Rankings → Display on leaderboard
- [ ] Entire pipeline completes in < 10 minutes
- [ ] All 4 domains tracked correctly
- [ ] Time windows show accurate data

---

## 🎯 NEXT STEPS AFTER TESTING

### If Tests Pass:
1. ✅ Mark Coliseum V1 as Production Ready
2. 🚀 Deploy to production
3. 📊 Setup monitoring/analytics
4. 📝 Document API for enterprise customers
5. 💰 Enable subscription paywall

### If Tests Fail:
1. 🐛 Fix identified issues
2. 🔄 Re-run test protocol
3. 📝 Update documentation
4. ✅ Verify fixes work end-to-end

---

## 📎 RELATED DOCUMENTS

- `/Users/pks.ml/Desktop/93/Documents/Backend.Verification.Results.md`
- `/Users/pks.ml/Desktop/93/my-app/verify_coliseum_tables.sql`
- Original processor test results (100 events processed)

---

## 🚨 CRITICAL PATH BLOCKER

**Discovered Issue:** AudioPlayer logs to `media_engagement_log`, NOT `passport_entries`

**Impact:** Processor reads from `passport_entries`, so audio plays not being tracked for Coliseum

**Required Fix:**
1. Add Passport logging to AudioPlayerContext
2. Call `passport.logEvent('audio_play', {...})` when track plays
3. Ensure event_data includes artist_id for processor

**Files to modify:**
- `/src/context/AudioPlayerContext.tsx` - Add passport.logEvent call
- `/src/lib/passport/passportClient.ts` - Verify logEvent method exists

**Priority:** HIGH - This is the integration gap

---

**Status:** Ready to proceed with Step 1 (Database Verification) then Step 2 (Frontend Testing)
