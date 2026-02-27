# 🔍 COLISEUM SYSTEM - GAP ANALYSIS

**Date:** February 1, 2026
**Goal:** Identify missing schema, features, and migrations

---

## 📊 EXECUTIVE SUMMARY

**Status:** 🔴 **MAJOR GAPS FOUND**

### Critical Issues:
1. **Core migrations NOT applied to production database**
2. **Schema mismatch between local files and production database**
3. **Legacy tables referenced in code but missing from migrations**
4. **Frontend expects tables/views that don't exist in production**

---

## 🎯 WHAT THE SYSTEM SHOULD HAVE

Based on migrations (011, 011b, 012, 013, 018) and frontend code analysis:

### Core Tables
| Table | Purpose | Status | Migration |
|-------|---------|--------|-----------|
| `coliseum_domain_strength` | Stores aggregated A/T/G/C scores per artist | ❓ Unknown | 011 |
| `coliseum_dna_mutations` | Individual mutation log from Passport events | ❓ Unknown | 011b |
| `passport_entries.coliseum_processed_at` | Tracking column for processor | ✅ Probably exists | 012 |
| `coliseum_metrics` | Legacy raw metrics table | ❌ MISSING | None! |
| `coliseum_leaderboards` | Legacy cached rankings | ❌ MISSING | None! |
| `coliseum_entitlements` | Subscription/access control | ❌ MISSING | None! |

### Materialized Views (12 total)
| View Name | Domain | Time Range | Status | Migration |
|-----------|--------|------------|--------|-----------|
| `coliseum_leaderboard_a_7d` | Cultural | 7 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_a_30d` | Cultural | 30 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_a_alltime` | Cultural | All time | ❌ MISSING | 011 |
| `coliseum_leaderboard_t_7d` | Behavioral | 7 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_t_30d` | Behavioral | 30 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_t_alltime` | Behavioral | All time | ❌ MISSING | 011 |
| `coliseum_leaderboard_g_7d` | Economic | 7 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_g_30d` | Economic | 30 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_g_alltime` | Economic | All time | ❌ MISSING | 011 |
| `coliseum_leaderboard_c_7d` | Spatial | 7 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_c_30d` | Spatial | 30 days | ❌ MISSING | 011 |
| `coliseum_leaderboard_c_alltime` | Spatial | All time | ❌ MISSING | 011 |

### Regular Views (Treasury Integration)
| View Name | Purpose | Status | Migration |
|-----------|---------|--------|-----------|
| `artist_revenue_summary` | Gross/net revenue per artist | ❓ Unknown | 013 |
| `artist_event_revenue` | Revenue breakdown per event | ❓ Unknown | 013 |
| `artist_revenue_per_fan` | G-domain metric | ❓ Unknown | 013 |

### Analytics Functions
| Function | Purpose | Status | Migration |
|----------|---------|--------|-----------|
| `coliseum_genre_diversity_score()` | A-domain calculation | ❓ Unknown | 018 |
| `coliseum_repeat_engagement_rate()` | T-domain calculation | ❓ Unknown | 018 |
| `coliseum_revenue_per_fan()` | G-domain calculation | ❓ Unknown | 018 |
| `coliseum_geographic_reach()` | C-domain calculation | ❓ Unknown | 018 |
| `coliseum_get_artist_dna()` | Combined DNA profile | ❓ Unknown | 018 |

---

## 🚨 ERRORS INDICATE MISSING SCHEMA

### Error 1: `column "effective_delta" does not exist`
**What happened:** Trying to query `coliseum_dna_mutations.strength`
**Actual column name:** `effective_delta`
**Root cause:** Verification SQL used wrong column name
**Fix:** ✅ Fixed in verification SQL

### Error 2: `relation "coliseum_artist_rankings" does not exist`
**What happened:** Verification SQL tried to query non-existent view
**Reality:** This view was never created in migrations
**Actual views:** `coliseum_leaderboard_a_7d` etc. (12 separate views)
**Fix:** ✅ Verification SQL needs to check correct view names

### Error 3: `column "created_at" does not exist`
**What happened:** Trying to query `coliseum_dna_mutations.created_at`
**Reality:** Migration 011b DOES include `created_at` column
**Root cause:** **Migration 011b was NEVER applied to production!**
**Fix:** 🔴 **CRITICAL: Need to apply migrations to production**

---

## 🔎 EVIDENCE: PROCESSOR CLAIMS IT WORKED

### Processor Test Results (From earlier):
```json
{
  "success": true,
  "processed": 100,
  "mutations": 162,
  "artists_updated": 2,
  "timestamp": "2026-02-01T03:00:01.876Z"
}
```

### The Mystery:
**Question:** If `coliseum_dna_mutations` table doesn't exist, where did the 162 mutations go?

**Possible explanations:**
1. **Processor is using different table** (maybe in Edge Function's internal schema)
2. **Processor is mocked/simulated** (just returns success without actual writes)
3. **Table exists but is empty** (processor created it but couldn't write due to schema mismatch)
4. **Processor wrote to a different database/project**

**We need to investigate:** Check Edge Function code to see what it actually does

---

## 📋 MISSING FEATURES (Code References vs Migrations)

### 1. Legacy Metrics System
**Referenced in code:**
- `/src/lib/passport/processor.ts` - Inserts to `coliseum_metrics`
- `/src/hooks/useDNA.tsx` - Inserts to `coliseum_metrics`
- `/src/hooks/useColiseum.tsx` - Queries `coliseum_metrics`

**Migration status:** ❌ NO migration creates this table

**Impact:** HIGH - Multiple code paths try to write to non-existent table

**Decision needed:**
- Create the table (backward compatibility)
- Remove references (migrate fully to DNA mutations)

### 2. Generic Leaderboards Table
**Referenced in code:**
- `/src/hooks/useColiseum.tsx` - Queries `coliseum_leaderboards`
- `/src/types/coliseum.ts` - Documents it as cached rankings table

**Migration status:** ❌ NO migration creates this table

**Reality:** Leaderboards are materialized views, not a generic table

**Decision needed:**
- Remove references (use materialized views directly) ✅ RECOMMENDED
- Create generic table (unnecessary duplication)

### 3. Entitlements System
**Referenced in code:**
- `/src/lib/coliseum/entitlements.ts` - Queries `coliseum_entitlements`
- `/src/routes/coliseum-dashboard.tsx` - Uses entitlements for access control

**Migration status:** ❌ NO migration creates this table

**Impact:** HIGH - Access control and paywall won't work

**Required schema:**
```sql
CREATE TABLE coliseum_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan TEXT NOT NULL, -- 'free', 'basic', 'pro', 'enterprise'
  domains TEXT[] NOT NULL, -- ['A', 'T', 'G', 'C']
  leaderboard_depth INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Artist Profiles Integration
**Frontend expects:**
- `artist_profiles.artist_name` to exist
- Join between `coliseum_domain_strength` and `artist_profiles`

**Migration 011 references:**
```sql
join artist_profiles ap on ap.id = ds.entity_id
```

**Risk:** If `artist_profiles` table doesn't exist or lacks `artist_name` column, views will fail

---

## 🎯 ROOT CAUSE ANALYSIS

### Why the gaps exist:

1. **Migrations not applied to production**
   - Files exist locally in `/database/migrations/`
   - Never pushed to Supabase production database
   - Processor test claims success but tables don't exist = contradiction

2. **Code evolved faster than migrations**
   - Legacy code references `coliseum_metrics`, `coliseum_leaderboards`
   - Newer architecture uses DNA mutations + materialized views
   - No cleanup/migration from old to new

3. **Missing migration for entitlements**
   - Feature implemented in code
   - Database schema never created
   - Access control won't work

4. **Edge Function vs Database mismatch**
   - Processor deployed and "working"
   - But underlying tables missing
   - Suggests processor might have its own schema or is mocked

---

## ✅ WHAT WE NEED TO DO (Priority Order)

### STEP 1: Verify Current Production State
**Goal:** Understand what ACTUALLY exists in production

**Action:**
```sql
-- Run in Supabase Dashboard SQL Editor
-- Check which tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'coliseum%'
ORDER BY tablename;

-- Check which views exist
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE 'coliseum%'
ORDER BY viewname;

-- Check which materialized views exist
SELECT matviewname
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname LIKE 'coliseum%'
ORDER BY matviewname;

-- Check passport_entries columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'passport_entries'
  AND column_name LIKE 'coliseum%';
```

### STEP 2: Apply Missing Core Migrations (IN ORDER)
**Goal:** Create foundational tables and views

**Required migrations:**
1. ✅ `011_coliseum_dna_leaderboards.sql` - Create domain_strength table + 12 views
2. ✅ `011b_coliseum_dna_mutations_table.sql` - Create mutations table
3. ✅ `012_coliseum_enable_processor.sql` - Add passport tracking column
4. ✅ `013_treasury_coliseum_analytics.sql` - Create revenue views
5. ✅ `018_coliseum_analytics_functions.sql` - Create calculation functions

**Application method:**
- Option A: Supabase Dashboard SQL Editor (most reliable given CLI issues)
- Option B: Direct psql connection
- Option C: Fix CLI and use `supabase db push`

### STEP 3: Create Missing Tables
**Goal:** Fill gaps for features code expects

**A. Entitlements Table**
```sql
CREATE TABLE IF NOT EXISTS coliseum_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Default: Everyone starts on free plan
CREATE OR REPLACE FUNCTION get_user_coliseum_plan(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT plan FROM coliseum_entitlements WHERE user_id = p_user_id),
    'free'
  );
$$ LANGUAGE SQL;
```

**B. Metrics Table (Optional - for legacy compatibility)**
```sql
CREATE TABLE IF NOT EXISTS coliseum_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coliseum_metrics_entity ON coliseum_metrics(entity_id, entity_type, timestamp DESC);
CREATE INDEX idx_coliseum_metrics_type ON coliseum_metrics(metric_type, timestamp DESC);
```

**C. Leaderboards Table (Optional - probably not needed)**
Skip this - use materialized views instead

### STEP 4: Verify Processor Integration
**Goal:** Understand what the processor actually does

**Actions:**
1. Read Edge Function source code at `/supabase/functions/coliseum-processor/`
2. Check what tables it writes to
3. Verify it matches schema expectations
4. Test manual invocation with real data

### STEP 5: Fix Frontend Queries
**Goal:** Remove references to non-existent tables

**Files to update:**
- `/src/hooks/useColiseum.tsx` - Remove `coliseum_leaderboards` queries
- `/src/lib/passport/processor.ts` - Remove or create `coliseum_metrics` table
- `/src/hooks/useDNA.tsx` - Same as above

### STEP 6: Add Passport Logging to AudioPlayer
**Goal:** Connect play events to Coliseum pipeline

**Current state:** AudioPlayer logs to `media_engagement_log`, NOT `passport_entries`
**Processor expects:** Events in `passport_entries` with `event_type = 'audio_play'`

**Required change:**
```typescript
// In AudioPlayerContext.tsx
import { passportClient } from '../lib/passport/passportClient';

// When track plays > 30 seconds:
await passportClient.logEvent({
  userId: user.id,
  eventType: 'audio_play',
  eventData: {
    content_id: track.id,
    artist_id: track.artistId,
    artist_name: track.artist,
    duration_seconds: playDuration,
    // ... other metadata
  }
});
```

---

## 📊 FEATURE COMPLETENESS MATRIX

| Feature | Code | Migrations | Production DB | Integration | Status |
|---------|------|------------|---------------|-------------|--------|
| DNA Mutations Table | ✅ | ✅ | ❌ | ⚠️ | 🔴 BLOCKED |
| Domain Strength Table | ✅ | ✅ | ❌ | ⚠️ | 🔴 BLOCKED |
| 12 Materialized Views | ✅ | ✅ | ❌ | ❌ | 🔴 BLOCKED |
| Passport Tracking Column | ✅ | ✅ | ❓ | ⚠️ | 🟡 UNKNOWN |
| Treasury Revenue Views | ⚠️ | ✅ | ❌ | ❌ | 🟡 PARTIAL |
| Analytics Functions | ⚠️ | ✅ | ❌ | ❌ | 🟡 PARTIAL |
| Entitlements/Paywall | ✅ | ❌ | ❌ | ❌ | 🔴 MISSING |
| Legacy Metrics Table | ✅ | ❌ | ❌ | ❌ | 🔴 MISSING |
| Processor Edge Function | ❓ | N/A | ✅ | ❓ | 🟡 UNKNOWN |
| AudioPlayer → Passport | ❌ | N/A | N/A | ❌ | 🔴 MISSING |
| Frontend Dashboard | ✅ | N/A | N/A | ❌ | 🟡 READY |

**Legend:**
- ✅ Complete
- ⚠️ Partial
- ❌ Missing
- ❓ Unknown
- 🔴 Critical blocker
- 🟡 Needs attention
- 🟢 Good to go

---

## 🎯 NEXT ACTIONS (Immediate)

### For You (User):
1. **Run production state check SQL** (from STEP 1 above)
2. **Share results** so we know what exists vs what's missing
3. **Decide on migration strategy:**
   - Apply all 5 migrations via Dashboard?
   - Fix CLI and push migrations?
   - Manual application?

### For Me (Claude):
1. **Read Edge Function code** to understand processor behavior
2. **Create entitlements migration** if needed
3. **Fix AudioPlayer integration** to log to Passport
4. **Update frontend queries** to remove dead references

---

## 💡 STRATEGIC RECOMMENDATIONS

### Short Term (Next 2 hours):
1. ✅ Run production state check
2. ✅ Apply migrations 011, 011b, 012 to production
3. ✅ Create entitlements table
4. ✅ Test frontend loads without errors

### Medium Term (Next day):
1. ✅ Hook AudioPlayer to Passport logging
2. ✅ Test full pipeline (play → mutation → leaderboard)
3. ✅ Apply migrations 013, 018 for advanced analytics
4. ✅ Remove legacy code references

### Long Term (Next week):
1. ✅ Setup automated CRON for view refreshes
2. ✅ Add monitoring/alerting for processor
3. ✅ Implement subscription paywall
4. ✅ Production deployment

---

**Ready to proceed with STEP 1 (production state check)?**
