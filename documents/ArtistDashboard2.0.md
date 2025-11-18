# ArtistDashboard 2.0 - Real Data Integration Plan

**Created**: 2025-09-30
**Status**: Implementation Plan
**Goal**: Transform ArtistDashboardTemplateUI from mock data to real-time analytics with Apple glassmorphism design

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Database Schema Review](#database-schema-review)
3. [Mock Data Inventory](#mock-data-inventory)
4. [Real Data Architecture](#real-data-architecture)
5. [Google Maps API Integration](#google-maps-api-integration)
6. [Glassmorphism UI Improvements](#glassmorphism-ui-improvements)
7. [Implementation Phases](#implementation-phases)
8. [Technical Requirements](#technical-requirements)
9. [Migration Strategy](#migration-strategy)

---

## Current State Analysis

### Existing Dashboard Components

**Primary Component**: `src/components/ArtistDashboardTemplateUI.tsx` (443 lines)

**Key Features**:
- Hero stats: Total Streams, Locker Access, Fan Conversion Rate
- Global fan map with geographic hotspots
- Revenue streams breakdown by platform
- Weekly engagement momentum chart
- Top fan promoters/referrals
- Content DNA theme analysis
- Upload manager integration

**Design System**:
- Large spacing (p-16, mb-24)
- Massive hero cards with 8xl text
- Gradient backgrounds with backdrop blur
- Framer Motion animations with staggered delays
- Color-coded metrics (green for growth, red for decline)

---

## Database Schema Review

### Existing Tables (Production)

#### Core User Tables
```sql
-- profiles (extends auth.users)
- id (UUID, FK to auth.users)
- display_name
- avatar_url
- role (enum: fan, artist, brand, developer, admin)
- email_verified
- onboarding_completed
- created_at, updated_at

-- artist_profiles (renamed from artists in migration 003)
- id (UUID, PK)
- user_id (UUID, FK to auth.users) UNIQUE
- artist_name
- bio
- banner_url
- social_links (JSONB)
- verification_status (default: 'pending')
- record_label, publisher
- bsl_enabled, bsl_tier
- upload_preferences (JSONB)
- created_at, updated_at
```

#### Content & Engagement
```sql
-- content_items (Artist Locker content)
- id (UUID, PK)
- artist_id (FK to artist_profiles)
- title, description
- content_type (enum: audio, video, image, document)
- file_path, file_size_bytes
- duration_seconds
- unlock_date
- milestone_condition (JSONB)
- is_premium
- metadata (JSONB)
- album_id, album_name, track_number
- license_type, isrc
- explicit, p_line, record_label, publisher
- enable_direct_downloads, offline_listening
- availability_scope, availability_regions
- created_at, updated_at

-- media_engagement_log (Anonymous by default)
- id (UUID, PK)
- user_id (FK to auth.users)
- content_id (FK to content_items)
- event_type (TEXT: 'view', 'play', 'like', 'share', 'download')
- session_id, user_agent, ip_address
- is_anonymous (default: true)
- metadata (JSONB)
- timestamp
```

#### Subscriptions & Revenue
```sql
-- subscriptions
- id (UUID, PK)
- fan_id (FK to auth.users)
- artist_id (FK to artist_profiles)
- tier, price_cents
- status (enum: active, canceled, paused, expired)
- stripe_subscription_id
- current_period_start, current_period_end
- cancel_at_period_end
- created_at, updated_at

-- transactions
- id (UUID, PK)
- user_id (FK to auth.users)
- amount_cents, currency
- transaction_type ('subscription', 'campaign_payment', 'payout')
- status ('pending', 'completed', 'failed')
- stripe_payment_intent_id
- description, metadata (JSONB)
- created_at, updated_at
```

#### Events & Voting (Concierto System)
```sql
-- events
- id (UUID, PK)
- title, description, cover_image_url
- start_date, end_date, voting_opens_at, voting_closes_at
- shareable_code (UNIQUE, 8-char alphanumeric)
- max_votes_per_participant
- allow_multiple_votes_per_artist
- host_user_id (FK to auth.users)
- status (enum: draft, published, live, completed, cancelled)
- analytics_data (JSONB)
- settings (JSONB)
- created_at, updated_at

-- event_artists
- id (UUID, PK)
- event_id (FK to events)
- artist_profile_id (FK to artist_profiles)
- registration_status (invited, confirmed, declined, withdrawn)
- event_bio, featured_track_id
- vote_count (INTEGER, auto-updated via trigger)
- engagement_data (JSONB)
- display_order
- registered_at, created_at, updated_at

-- event_participants (Pre-signup capture for anonymous voting)
- id (UUID, PK)
- event_id (FK to events)
- email, phone, name
- vote_token (UNIQUE, session identifier)
- total_votes_cast, votes_remaining
- registration_source ('qr', 'link', 'referral', 'direct')
- session_duration_seconds, interactions_count
- marketing_consent, platform_invite_sent
- engagement_data (JSONB)
- created_at, updated_at

-- event_votes
- id (UUID, PK)
- event_id (FK to events)
- participant_id (FK to event_participants)
- event_artist_id (FK to event_artists)
- vote_weight (INTEGER, default: 1)
- vote_source ('web', 'qr', 'embedded')
- device_info (JSONB)
- created_at
- UNIQUE(event_id, participant_id, event_artist_id) -- prevents duplicate votes
```

#### Albums
```sql
-- albums
- id (UUID, PK)
- name
- artist_id (FK to artist_profiles)
- description, release_date
- artwork_url
- total_tracks (auto-updated via trigger)
- created_at, updated_at
```

### Missing Tables (Need to Create)

#### Analytics Tables
```sql
-- artist_analytics_daily (to be created)
- id (UUID, PK)
- artist_id (FK to artist_profiles)
- date (DATE)
- total_streams (INTEGER)
- unique_listeners (INTEGER)
- locker_logins (INTEGER)
- new_subscribers (INTEGER)
- revenue_cents (INTEGER)
- engagement_score (FLOAT)
- created_at

-- artist_geography_stats (to be created)
- id (UUID, PK)
- artist_id (FK to artist_profiles)
- country_code (TEXT, ISO 3166-1 alpha-2)
- country_name (TEXT)
- latitude (FLOAT)
- longitude (FLOAT)
- fan_count (INTEGER)
- growth_percentage (FLOAT)
- last_updated (TIMESTAMP)

-- artist_revenue_breakdown (to be created)
- id (UUID, PK)
- artist_id (FK to artist_profiles)
- channel (TEXT: 'Buckets', 'Spotify', 'YouTube', 'Apple Music', 'Other')
- revenue_cents (INTEGER)
- percentage (FLOAT)
- month (DATE)
- created_at

-- artist_top_promoters (to be created)
- id (UUID, PK)
- artist_id (FK to artist_profiles)
- promoter_user_id (FK to auth.users)
- promoter_name (TEXT)
- promoter_avatar (TEXT)
- referral_count (INTEGER)
- earnings_cents (INTEGER)
- last_referral_at (TIMESTAMP)

-- content_themes (to be created)
- id (UUID, PK)
- artist_id (FK to artist_profiles)
- theme (TEXT: 'Aggressive', 'Emotional', 'Dark', 'Uplifting', 'Chill', 'Energetic')
- track_count (INTEGER)
- color (TEXT, hex color)
- created_at, updated_at
```

---

## Mock Data Inventory

### Current Mock Data (from ArtistDashboardTemplateUI.tsx lines 7-51)

```typescript
const mockArtistData = {
  artist: {
    name: "Dextron",
    avatar: "/default-avatar.png",
    tier: "Platinum",
    verified: true
  },

  // Hero Stats
  totalStreams: 2485691,              // → artist_analytics_daily SUM(total_streams)
  lockerLogins: 1247,                 // → artist_analytics_daily.locker_logins (latest)
  fanConversionRate: 12.8,            // → CALCULATED: subscribers / unique_listeners * 100

  // Geography Data (5 locations with coordinates)
  fanGeoData: [
    { country: "USA", fans: 127483, growth: 24, lat: 37.7749, lng: -122.4194 },
    { country: "UK", fans: 89235, growth: 18, lat: 51.5074, lng: -0.1278 },
    { country: "Canada", fans: 64829, growth: 31, lat: 45.4215, lng: -75.6972 },
    { country: "Australia", fans: 48329, growth: 15, lat: -33.8688, lng: 151.2093 },
    { country: "Germany", fans: 38291, growth: 22, lat: 52.5200, lng: 13.4050 }
  ],
  // → artist_geography_stats table with lat/lng for Google Maps

  // Revenue Streams (4 channels)
  revenueByChannel: [
    { channel: "Buckets", revenue: 18394, percentage: 45.2, color: "#00ff88" },
    { channel: "Spotify", revenue: 10706, percentage: 26.3, color: "#1DB954" },
    { channel: "YouTube", revenue: 7371, percentage: 18.1, color: "#FF0000" },
    { channel: "Apple Music", revenue: 4234, percentage: 10.4, color: "#FC3C44" }
  ],
  // → artist_revenue_breakdown table

  // Weekly Engagement (7 days)
  dropEngagement: [
    { date: "Mon", score: 84, plays: 15832 },
    { date: "Tue", score: 92, plays: 18291 },
    // ... 5 more days
  ],
  // → media_engagement_log aggregated by day

  // Top Promoters (4 fans)
  topPromoters: [
    { name: "Alex Rivera", avatar: "🎸", referrals: 142, earnings: 1420 },
    { name: "Sam Chen", avatar: "🎧", referrals: 98, earnings: 980 },
    // ... 2 more
  ],
  // → artist_top_promoters table (referral system)

  // Content Themes (6 categories)
  contentThemes: [
    { theme: "Aggressive", count: 34, color: "#FF6B6B" },
    { theme: "Emotional", count: 28, color: "#4ECDC4" },
    // ... 4 more
  ]
  // → content_themes table (AI-analyzed mood tags)
}
```

---

## Real Data Architecture

### Data Fetching Strategy

#### 1. **Custom Hooks for Data Fetching**

```typescript
// src/hooks/useArtistAnalytics.ts
export const useArtistAnalytics = (artistId: string, timeframe: '7d' | '30d' | '90d') => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ArtistAnalytics | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Aggregate from artist_analytics_daily
      const { data, error } = await supabase
        .from('artist_analytics_daily')
        .select('*')
        .eq('artist_id', artistId)
        .gte('date', getStartDate(timeframe))
        .order('date', { ascending: true })

      if (error) throw error
      setData(aggregateAnalytics(data))
    }

    fetchAnalytics()
  }, [artistId, timeframe])

  return { data, loading, error }
}

// src/hooks/useArtistGeography.ts
export const useArtistGeography = (artistId: string) => {
  // Fetch from artist_geography_stats
  // Real-time updates via Supabase Realtime subscriptions
}

// src/hooks/useArtistRevenue.ts
export const useArtistRevenue = (artistId: string, timeframe: string) => {
  // Fetch from artist_revenue_breakdown and transactions
  // Aggregate by channel
}

// src/hooks/useContentEngagement.ts
export const useContentEngagement = (artistId: string, days: number) => {
  // Aggregate from media_engagement_log
  // Group by date, calculate plays and scores
}

// src/hooks/useTopPromoters.ts
export const useTopPromoters = (artistId: string, limit: number = 4) => {
  // Fetch from artist_top_promoters
  // Join with profiles for avatar/name
}

// src/hooks/useContentThemes.ts
export const useContentThemes = (artistId: string) => {
  // Fetch from content_themes
  // Could integrate with AI mood analysis from audio_features
}
```

#### 2. **Real-Time Updates with Supabase Realtime**

```typescript
// Enable realtime subscriptions for live dashboard updates
const subscription = supabase
  .channel('artist-analytics')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'media_engagement_log',
    filter: `content_id=in.(SELECT id FROM content_items WHERE artist_id=${artistId})`
  }, (payload) => {
    // Update local state with new engagement data
    updateEngagementMetrics(payload.new)
  })
  .subscribe()
```

#### 3. **Data Aggregation Service**

```typescript
// src/services/artistAnalyticsService.ts
export class ArtistAnalyticsService {
  // Calculate fan conversion rate
  static calculateConversionRate(artistId: string, timeframe: string) {
    // Query subscriptions (new subscribers) / unique_listeners
    // Return percentage
  }

  // Aggregate daily stats into timeframe totals
  static aggregateDailyStats(dailyRecords: DailyAnalytics[]) {
    return {
      totalStreams: sum(dailyRecords.map(r => r.total_streams)),
      avgDailyListeners: avg(dailyRecords.map(r => r.unique_listeners)),
      totalRevenue: sum(dailyRecords.map(r => r.revenue_cents)),
      engagementScore: weightedAvg(dailyRecords.map(r => r.engagement_score))
    }
  }

  // Calculate weekly momentum trend
  static calculateWeeklyMomentum(dailyRecords: DailyAnalytics[]) {
    // Compare week-over-week growth
    // Return percentage and trend direction
  }
}
```

#### 4. **Background Data Pipeline**

**Cron Jobs via Supabase Edge Functions**:

```typescript
// supabase/functions/aggregate-artist-analytics/index.ts
// Runs daily at midnight UTC
// Aggregates previous day's engagement data into artist_analytics_daily

Deno.serve(async (req) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  // For each artist with content
  const artists = await supabase.from('artist_profiles').select('id')

  for (const artist of artists) {
    // Aggregate media_engagement_log for yesterday
    const engagement = await aggregateEngagement(artist.id, yesterday)
    const revenue = await aggregateRevenue(artist.id, yesterday)
    const subscribers = await countNewSubscribers(artist.id, yesterday)

    // Insert into artist_analytics_daily
    await supabase.from('artist_analytics_daily').insert({
      artist_id: artist.id,
      date: yesterday,
      total_streams: engagement.plays,
      unique_listeners: engagement.uniqueUsers,
      locker_logins: engagement.lockerAccess,
      new_subscribers: subscribers,
      revenue_cents: revenue,
      engagement_score: calculateEngagementScore(engagement)
    })
  }

  return new Response('Analytics aggregated', { status: 200 })
})
```

---

## Google Maps API Integration

### Requirements

1. **API Key Setup**
   - Google Maps JavaScript API
   - Geocoding API (for converting locations to lat/lng)
   - Cost: $0.007 per map load, $0.005 per geocode

2. **Environment Variables**
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **React Google Maps Library**
   ```bash
   npm install @react-google-maps/api
   ```

### Implementation

```typescript
// src/components/ArtistGeographyMap.tsx
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'

interface GeographyMapProps {
  fanGeoData: ArtistGeographyData[]
}

const ArtistGeographyMap: React.FC<GeographyMapProps> = ({ fanGeoData }) => {
  const [selectedLocation, setSelectedLocation] = useState<ArtistGeographyData | null>(null)

  const mapStyles = {
    height: "600px",
    width: "100%",
    borderRadius: "2rem"
  }

  const defaultCenter = {
    lat: 20, // Center on global view
    lng: 0
  }

  // Custom marker styling based on fan count
  const getMarkerIcon = (location: ArtistGeographyData) => {
    const baseSize = 20
    const scaleFactor = Math.min(location.fan_count / 30000, 2)
    const size = baseSize + (baseSize * scaleFactor)

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: location.growth_percentage > 20 ? '#00ff88' : '#ffd23f',
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: size,
    }
  }

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={2}
        center={defaultCenter}
        options={{
          styles: darkMapStyles, // Custom dark theme JSON
          disableDefaultUI: true,
          zoomControl: true
        }}
      >
        {fanGeoData.map((location) => (
          <Marker
            key={location.country_code}
            position={{ lat: location.latitude, lng: location.longitude }}
            icon={getMarkerIcon(location)}
            onClick={() => setSelectedLocation(location)}
            animation={google.maps.Animation.DROP}
          />
        ))}

        {selectedLocation && (
          <InfoWindow
            position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <div className="p-4 bg-black/90 text-white rounded-xl">
              <p className="font-bold text-2xl text-green-400">{selectedLocation.country_name}</p>
              <p className="text-xl">{selectedLocation.fan_count.toLocaleString()} fans</p>
              <p className="text-green-400 text-lg">+{selectedLocation.growth_percentage}% growth</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}
```

### Geocoding Service

```typescript
// src/services/geocodingService.ts
export class GeocodingService {
  private static apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY

  // Convert country name to coordinates
  static async geocodeCountry(countryName: string): Promise<{ lat: number, lng: number }> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(countryName)}&key=${this.apiKey}`
    )
    const data = await response.json()

    if (data.results.length > 0) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng
      }
    }

    throw new Error(`Could not geocode country: ${countryName}`)
  }

  // Batch geocode multiple locations
  static async batchGeocode(countries: string[]): Promise<Map<string, {lat: number, lng: number}>> {
    const results = new Map()

    for (const country of countries) {
      try {
        const coords = await this.geocodeCountry(country)
        results.set(country, coords)

        // Rate limiting: 50 requests per second
        await new Promise(resolve => setTimeout(resolve, 20))
      } catch (error) {
        console.error(`Failed to geocode ${country}:`, error)
      }
    }

    return results
  }
}
```

### Automatic Geography Data Collection

```typescript
// Collect geography from media_engagement_log.ip_address
// Run as background job to populate artist_geography_stats

// supabase/functions/update-artist-geography/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  // For each artist
  const artists = await supabase.from('artist_profiles').select('id')

  for (const artist of artists) {
    // Get unique IP addresses from engagement log
    const { data: engagements } = await supabase
      .from('media_engagement_log')
      .select('ip_address')
      .in('content_id',
        supabase.from('content_items').select('id').eq('artist_id', artist.id)
      )

    // Use IP geolocation service to get country
    const countryStats = await aggregateByCountry(engagements)

    // Update artist_geography_stats
    for (const [countryCode, stats] of countryStats) {
      await supabase.from('artist_geography_stats').upsert({
        artist_id: artist.id,
        country_code: countryCode,
        country_name: stats.name,
        latitude: stats.lat,
        longitude: stats.lng,
        fan_count: stats.count,
        growth_percentage: calculateGrowth(stats),
        last_updated: new Date()
      })
    }
  }

  return new Response('Geography updated', { status: 200 })
})
```

---

## Glassmorphism UI Improvements

### Enhanced CSS Classes

```css
/* src/index.css - Enhanced glassmorphism utilities */

/* Primary Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
  border-radius: 3rem;
}

/* Glass Card Hover State */
.glass-card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card-hover:hover {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow:
    0 12px 48px 0 rgba(0, 0, 0, 0.5),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}

/* Metric Cards */
.glass-metric {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 3rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.06);
}

/* Frosted Navigation Bar */
.glass-nav {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Glass Button */
.glass-button {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1.5rem;
  transition: all 0.2s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.02);
}

.glass-button:active {
  transform: scale(0.98);
}

/* Accent Glow Effect */
.glow-green {
  box-shadow:
    0 0 20px rgba(0, 255, 136, 0.3),
    0 0 40px rgba(0, 255, 136, 0.1);
}

.glow-yellow {
  box-shadow:
    0 0 20px rgba(252, 211, 77, 0.3),
    0 0 40px rgba(252, 211, 77, 0.1);
}

/* Loading Skeleton Glass */
.glass-skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02) 25%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.02) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Component-Level Glassmorphism Updates

**Replace existing gradient backgrounds**:
```tsx
// BEFORE:
className="p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"

// AFTER (Apple glassmorphism):
className="p-16 glass-card glass-card-hover"
```

**Enhanced metric cards**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  className="text-center p-16 glass-metric glow-green"
>
  <div className="w-24 h-24 mx-auto mb-8 bg-green-400/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
    <span className="text-5xl">🎵</span>
  </div>
  <p className="text-8xl font-black text-green-400 mb-4">
    {realData.totalStreams}
  </p>
  <p className="text-2xl text-gray-300 mb-2">Total Streams</p>
</motion.div>
```

---

## Implementation Phases

### Phase 1: Database Schema Setup (Week 1)

**Tasks**:
1. Create new analytics tables migration file
2. Create `artist_analytics_daily` table
3. Create `artist_geography_stats` table with lat/lng columns
4. Create `artist_revenue_breakdown` table
5. Create `artist_top_promoters` table (referral system)
6. Create `content_themes` table
7. Add indexes for performance
8. Enable RLS policies for artist-only access

**Migration File**: `supabase/migrations/20250930140000_artist_analytics_tables.sql`

**Deliverable**: All analytics tables created and accessible via Supabase Studio

---

### Phase 2: Data Collection Pipeline (Week 1-2)

**Tasks**:
1. Create Edge Function: `aggregate-artist-analytics` (daily cron)
2. Create Edge Function: `update-artist-geography` (weekly cron)
3. Create Edge Function: `calculate-revenue-breakdown` (daily cron)
4. Implement IP geolocation service integration
5. Set up Supabase cron job scheduler
6. Backfill historical data from `media_engagement_log`

**Deliverables**:
- `/supabase/functions/aggregate-artist-analytics/index.ts`
- `/supabase/functions/update-artist-geography/index.ts`
- `/supabase/functions/calculate-revenue-breakdown/index.ts`

---

### Phase 3: Custom Hooks & Services (Week 2)

**Tasks**:
1. Create `useArtistAnalytics` hook
2. Create `useArtistGeography` hook
3. Create `useArtistRevenue` hook
4. Create `useContentEngagement` hook
5. Create `useTopPromoters` hook
6. Create `useContentThemes` hook
7. Create `ArtistAnalyticsService` class
8. Create `GeocodingService` class
9. Add TypeScript interfaces for all analytics types

**Deliverables**:
- `/src/hooks/useArtistAnalytics.ts`
- `/src/hooks/useArtistGeography.ts`
- `/src/hooks/useArtistRevenue.ts`
- `/src/hooks/useContentEngagement.ts`
- `/src/hooks/useTopPromoters.ts`
- `/src/hooks/useContentThemes.ts`
- `/src/services/artistAnalyticsService.ts`
- `/src/services/geocodingService.ts`
- `/src/types/analytics.ts`

---

### Phase 4: Google Maps Integration (Week 2-3)

**Tasks**:
1. Set up Google Cloud project and enable APIs
2. Generate and secure API key
3. Install `@react-google-maps/api` package
4. Create `ArtistGeographyMap` component
5. Implement custom marker styling
6. Add InfoWindow tooltips
7. Apply dark theme map styles
8. Test with real geography data

**Deliverables**:
- `/src/components/ArtistGeographyMap.tsx`
- Environment variable `REACT_APP_GOOGLE_MAPS_API_KEY`
- Custom dark map styles JSON

---

### Phase 5: UI Glassmorphism Upgrade (Week 3)

**Tasks**:
1. Update `src/index.css` with enhanced glass utilities
2. Replace gradient backgrounds with glass classes
3. Update all metric cards with `glass-metric` and glow effects
4. Enhance hover states with `glass-card-hover`
5. Add loading skeleton states with `glass-skeleton`
6. Test cross-browser compatibility (Chrome, Safari, Firefox)

**Deliverables**:
- Updated `/src/index.css` with glassmorphism utilities
- Updated component className props throughout dashboard

---

### Phase 6: Dashboard Component Refactor (Week 3-4)

**Tasks**:
1. Create `ArtistDashboard2.tsx` (new real-data version)
2. Remove mock data object
3. Integrate all custom hooks
4. Replace static map with `ArtistGeographyMap`
5. Add real-time Supabase subscriptions
6. Implement loading states for async data
7. Add error boundaries and fallbacks
8. Add timeframe filtering (7d, 30d, 90d)
9. Test with multiple artist accounts

**File Structure**:
```
src/components/
├── ArtistDashboard2.tsx (NEW - main component)
├── ArtistDashboardTemplateUI.tsx (KEEP - legacy/fallback)
└── artist-dashboard/
    ├── HeroStats.tsx
    ├── GeographySection.tsx (uses ArtistGeographyMap)
    ├── RevenueBreakdown.tsx
    ├── WeeklyMomentum.tsx
    ├── TopPromoters.tsx
    ├── ContentDNA.tsx
    └── LoadingStates.tsx
```

**Deliverables**:
- `/src/components/ArtistDashboard2.tsx`
- 6 sub-components in `/src/components/artist-dashboard/`

---

### Phase 7: Testing & Optimization (Week 4)

**Tasks**:
1. Load testing with 100k+ engagement records
2. Optimize Supabase queries with proper indexes
3. Implement React.memo for expensive components
4. Add Suspense boundaries for lazy loading
5. Test real-time subscriptions with concurrent users
6. Browser performance profiling (Chrome DevTools)
7. Accessibility audit (WCAG 2.1 AA)
8. Mobile responsive testing

**Deliverables**:
- Performance report with metrics
- Optimized queries and indexes
- A11y compliance report

---

### Phase 8: Deployment & Monitoring (Week 4)

**Tasks**:
1. Deploy analytics migrations to production Supabase
2. Deploy Edge Functions with cron schedules
3. Update environment variables in Vercel
4. Enable Supabase realtime for analytics tables
5. Set up error monitoring (Sentry integration)
6. Create analytics dashboard in Supabase Studio
7. Document API usage for Google Maps billing
8. Update CLAUDE.md with new dashboard architecture

**Deliverables**:
- Production deployment checklist
- Monitoring dashboard URLs
- Updated documentation

---

## Technical Requirements

### Environment Variables

```env
# Supabase (existing)
REACT_APP_SUPABASE_URL=https://iutnwgvzwyupsuguxnls.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key

# Google Maps (new)
REACT_APP_GOOGLE_MAPS_API_KEY=AIza...

# IP Geolocation Service (optional, for analytics)
REACT_APP_IPSTACK_API_KEY=your_ipstack_key
```

### Package Installations

```bash
npm install @react-google-maps/api
npm install @supabase/realtime-js  # If not already included
npm install date-fns  # For date calculations in analytics
```

### Database Migration Order

1. Run `/supabase/migrations/20250930131500_add_mediaid_role_and_trigger.sql` (pending from previous work)
2. Create and run `/supabase/migrations/20250930140000_artist_analytics_tables.sql` (new analytics tables)
3. Backfill historical data script (one-time execution)

---

## Migration Strategy

### Rollout Plan

**Option A: Gradual Rollout (Recommended)**
1. Deploy ArtistDashboard2.tsx alongside existing ArtistDashboardTemplateUI.tsx
2. Add feature flag in user preferences: `use_new_dashboard`
3. Beta test with 5-10 verified artists
4. Gather feedback and iterate
5. Enable for all artists after 2-week beta period
6. Deprecate old dashboard after 1 month

**Option B: Direct Replacement**
1. Deploy all changes to production simultaneously
2. Replace ArtistDashboardTemplateUI import with ArtistDashboard2 in routing
3. Monitor error rates and performance
4. Keep old component as emergency fallback

### Data Seeding for Development

```sql
-- Seed sample analytics data for testing
-- Run in Supabase SQL Editor

-- Get a test artist ID
SELECT id FROM artist_profiles WHERE user_id = auth.uid() LIMIT 1;

-- Insert 30 days of sample analytics
INSERT INTO artist_analytics_daily (artist_id, date, total_streams, unique_listeners, locker_logins, new_subscribers, revenue_cents, engagement_score)
SELECT
  'YOUR_ARTIST_ID'::uuid,
  generate_series(
    current_date - interval '30 days',
    current_date - interval '1 day',
    interval '1 day'
  )::date,
  (random() * 10000)::integer,
  (random() * 5000)::integer,
  (random() * 200)::integer,
  (random() * 50)::integer,
  (random() * 5000)::integer,
  (random() * 100)::float;

-- Insert sample geography data
INSERT INTO artist_geography_stats (artist_id, country_code, country_name, latitude, longitude, fan_count, growth_percentage)
VALUES
  ('YOUR_ARTIST_ID', 'US', 'USA', 37.7749, -122.4194, 127483, 24.0),
  ('YOUR_ARTIST_ID', 'GB', 'United Kingdom', 51.5074, -0.1278, 89235, 18.0),
  ('YOUR_ARTIST_ID', 'CA', 'Canada', 45.4215, -75.6972, 64829, 31.0),
  ('YOUR_ARTIST_ID', 'AU', 'Australia', -33.8688, 151.2093, 48329, 15.0),
  ('YOUR_ARTIST_ID', 'DE', 'Germany', 52.5200, 13.4050, 38291, 22.0);
```

### Backward Compatibility

- Keep `mockArtistData` as fallback in case real data queries fail
- Add error boundaries around dashboard sections
- Graceful degradation: if Google Maps API fails, show static table of countries
- Loading states for all async data sections

---

## Success Metrics

### Performance Targets

- Dashboard initial load: < 2 seconds
- Real-time updates: < 500ms latency
- Google Maps render: < 1 second
- Database query response: < 200ms (p95)

### Data Quality Targets

- Analytics aggregation accuracy: 99.9%
- Geography data coverage: > 95% of engagement events
- Revenue calculation accuracy: 100% (matches Stripe)

### User Experience Targets

- Dashboard crash rate: < 0.1%
- Mobile responsive score: 100/100 (Lighthouse)
- Accessibility score: > 95/100 (Lighthouse)
- User satisfaction: > 4.5/5 stars (post-rollout survey)

---

## Future Enhancements (Post-v2.0)

1. **Predictive Analytics**: Use ML to forecast streams and revenue
2. **Comparative Benchmarks**: Show how artist compares to similar artists
3. **Exportable Reports**: PDF/CSV export of analytics data
4. **Custom Dashboard Builder**: Drag-and-drop widgets for personalization
5. **Integration with Spotify/Apple Music APIs**: Pull external platform data
6. **Fan Demographics**: Age, gender, listening habits analysis
7. **Content Recommendations**: AI-suggested themes based on top-performing tracks
8. **Revenue Optimization Tips**: Personalized advice to increase earnings

---

## Appendix: TypeScript Interfaces

```typescript
// src/types/analytics.ts

export interface ArtistAnalytics {
  totalStreams: number
  uniqueListeners: number
  lockerLogins: number
  fanConversionRate: number
  revenueTotal: number
  engagementScore: number
  growthPercentage: number
}

export interface ArtistGeographyData {
  country_code: string
  country_name: string
  latitude: number
  longitude: number
  fan_count: number
  growth_percentage: number
  last_updated: Date
}

export interface RevenueBreakdown {
  channel: string
  revenue_cents: number
  percentage: number
  color: string
}

export interface DailyEngagement {
  date: string
  score: number
  plays: number
  uniqueUsers: number
}

export interface TopPromoter {
  promoter_user_id: string
  promoter_name: string
  promoter_avatar: string
  referral_count: number
  earnings_cents: number
  last_referral_at: Date
}

export interface ContentTheme {
  theme: string
  track_count: number
  color: string
}

export interface DailyAnalytics {
  artist_id: string
  date: Date
  total_streams: number
  unique_listeners: number
  locker_logins: number
  new_subscribers: number
  revenue_cents: number
  engagement_score: number
}
```

---

## Implementation Checklist

- [ ] Phase 1: Create analytics tables migration
- [ ] Phase 1: Run migration in Supabase Studio
- [ ] Phase 2: Create aggregate-artist-analytics Edge Function
- [ ] Phase 2: Create update-artist-geography Edge Function
- [ ] Phase 2: Create calculate-revenue-breakdown Edge Function
- [ ] Phase 2: Set up cron jobs in Supabase
- [ ] Phase 2: Backfill historical data
- [ ] Phase 3: Create all custom hooks
- [ ] Phase 3: Create analytics service classes
- [ ] Phase 3: Add TypeScript interfaces
- [ ] Phase 4: Set up Google Cloud project
- [ ] Phase 4: Install @react-google-maps/api
- [ ] Phase 4: Create ArtistGeographyMap component
- [ ] Phase 4: Add dark map theme
- [ ] Phase 5: Update index.css with glassmorphism utilities
- [ ] Phase 5: Apply glass classes throughout dashboard
- [ ] Phase 6: Create ArtistDashboard2.tsx
- [ ] Phase 6: Create sub-components
- [ ] Phase 6: Integrate real-time subscriptions
- [ ] Phase 6: Add loading states
- [ ] Phase 7: Performance testing
- [ ] Phase 7: Accessibility audit
- [ ] Phase 8: Deploy to production
- [ ] Phase 8: Set up monitoring
- [ ] Phase 8: Update documentation

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Next Review**: After Phase 1 completion