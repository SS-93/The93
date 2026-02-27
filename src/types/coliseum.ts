/**
 * =============================================================================
 * COLISEUM ANALYTICS TYPE DEFINITIONS
 * =============================================================================
 * 
 * Part of: Buckets V2 Trinity Architecture
 * V2 Living Index: #3 Coliseum Analytics (Jumbotron)
 * Frontend Architecture: Trinity → Coliseum System
 * 
 * PURPOSE:
 * Type definitions for Coliseum Analytics - the data intelligence and
 * impact reporting engine that powers all metrics, leaderboards, and
 * insights across Buckets Nation.
 * 
 * CONCEPT:
 * Coliseum is the "Jumbotron" of Buckets Nation - a massive analytics
 * engine that tracks, aggregates, and visualizes all engagement metrics.
 * If this world was in VR, users would see a giant jumbotron displaying
 * real-time stats, leaderboards, and resonance heatmaps.
 * 
 * WHAT COLISEUM TRACKS:
 * - Event attendance, votes, and engagement (Concierto)
 * - Music plays, skips, favorites (Player)
 * - Link shares and opens (CALS)
 * - Purchase and subscription events (Treasury)
 * - DNA evolution and matching events (MediaID)
 * - Artist growth and fan resonance (Vault Map)
 * - City-to-City tournament rankings (#14)
 * 
 * INTEGRATION POINTS:
 * - Consumes from: ALL systems (event bus or API gateway)
 * - Powers: JumbotronDashboard, LeaderboardWidget, AnalyticsReport
 * - Feeds: DIA (oversight), Treasury (ROI reports), Brands (campaign analytics)
 * - Enables: DNA-based audience insights, Resonance visualization
 * 
 * COMPONENTS USING THESE TYPES:
 * - JumbotronDashboard.tsx (public leaderboards)
 * - AnalyticsReport.tsx (campaign/event reports)
 * - DNACompatibilityReport.tsx (audience DNA insights)
 * - FunnelVisualization.tsx (conversion funnels)
 * - MetricsIngestion.tsx (admin monitoring)
 * 
 * ============================================================================
 * COLISEUM ANALYTICS SYSTEM - DATABASE ARCHITECTURE
 *
 * ============================================================================
 * PRODUCTION TABLES (Exist and Active):
 * ============================================================================
 *
 * - coliseum_domain_strength
 *   Purpose: Aggregated A/T/G/C strength scores per artist per time range
 *   Updated by: Edge Function processor
 *
 * - coliseum_dna_mutations
 *   Purpose: Individual mutation log from each Passport event
 *   Source: passport_entries with event_type = 'audio_play', etc.
 *
 * - passport_entries
 *   Purpose: All user events across platform
 *   Tracking: coliseum_processed_at column (nullable)
 *
 * ============================================================================
 * MATERIALIZED VIEWS (15 total - for leaderboard queries):
 * ============================================================================
 *
 * Pattern: coliseum_leaderboard_{domain}_{timeRange}
 *
 * Domains: a, t, g, c, composite
 * Time Ranges: 7d, 30d, alltime
 *
 * Examples:
 * - coliseum_leaderboard_a_7d (Cultural domain, 7-day)
 * - coliseum_leaderboard_t_30d (Behavioral, 30-day)
 * - coliseum_leaderboard_composite_alltime (Overall, all-time)
 *
 * ============================================================================
 * DEPRECATED / NEVER EXISTED (DO NOT USE):
 * ============================================================================
 *
 * - coliseum_metrics ❌ (legacy design, never created)
 * - coliseum_leaderboards ❌ (replaced by materialized views)
 * - coliseum_artist_rankings ❌ (incorrect view name)
 * - coliseum_domain_rankings ❌ (incorrect view name)
 *
 * Last updated: February 1, 2026
 * 
 * =============================================================================
 */

import { DNADomain, DNACluster } from './dna'
import { TimeRange } from './treasury'

// =============================================================================
// CORE METRIC TYPES
// =============================================================================

/**
 * Coliseum Metric
 * Individual tracked event/metric in the analytics system
 * 
 * Used in: All event tracking, MetricsIngestion component
 * Database: coliseum_metrics table
 * 
 * Flow:
 * 1. User action occurs (play, vote, share, etc.)
 * 2. Component calls useColiseum().trackEvent()
 * 3. Metric logged to Coliseum
 * 4. Aggregated for leaderboards, reports, insights
 */
export interface ColiseumMetric {
  id: string
  
  // Entity identifiers
  user_id?: string             // User who performed action (optional for privacy)
  artist_id?: string           // Artist associated with action
  event_id?: string            // Event associated with action
  track_id?: string            // Track associated with action
  brand_id?: string            // Brand associated with action
  
  // Metric details
  metric_type: MetricType
  metric_value: number         // Numeric value (1 for boolean events, N for counts)
  metric_unit?: string         // Unit if applicable ("seconds", "dollars", etc.)
  
  // Context
  source: MetricSource         // Where the metric came from
  session_id?: string          // User session for behavior tracking
  
  // DNA context (for DNA-enriched analytics)
  dna_match_score?: number     // If action involves matching
  dna_domain?: DNADomain       // Which domain most influenced action
  
  // Attribution
  attribution_id?: string      // If attributed to CALS link
  campaign_id?: string         // If part of brand campaign
  
  // Metadata
  metadata?: Record<string, any>
  timestamp: Date
}

/**
 * Metric Type
 * Categories of tracked metrics across Buckets ecosystem
 * 
 * Maps to V2 Living Index systems:
 */
export type MetricType =
  // MediaID / DNA (#1)
  | 'mediaid.dna_generated'
  | 'mediaid.dna_evolved'
  | 'mediaid.profile_viewed'
  | 'mediaid.simulator_used'
  
  // Player / Content (#6)
  | 'player.track_played'
  | 'player.track_completed'
  | 'player.track_skipped'
  | 'player.track_favorited'
  | 'player.playlist_created'
  
  // Concierto / Events (#7)
  | 'concierto.event_created'
  | 'concierto.event_viewed'
  | 'concierto.event_rsvp'
  | 'concierto.vote_cast'
  | 'concierto.artist_scored'
  | 'concierto.ticket_purchased'
  | 'concierto.event_attended'
  
  // Locker (#8)
  | 'locker.item_unlocked'
  | 'locker.content_viewed'
  | 'locker.reward_claimed'
  
  // CALS (#5)
  | 'cals.link_shared'
  | 'cals.link_opened'
  | 'cals.thread_created'
  | 'cals.message_sent'
  
  // Treasury (#2)
  | 'treasury.subscription_started'
  | 'treasury.subscription_renewed'
  | 'treasury.purchase_completed'
  | 'treasury.payout_requested'
  
  // Social / Engagement
  | 'social.follow'
  | 'social.like'
  | 'social.comment'
  | 'social.share'
  
  // Discovery
  | 'discovery.search'
  | 'discovery.recommendation_clicked'
  | 'discovery.artist_discovered'

/**
 * Metric Source
 * System/component that generated the metric
 */
export type MetricSource =
  | 'web'
  | 'ios'
  | 'android'
  | 'api'
  | 'system'        // Auto-generated metrics
  | 'admin'         // DIA actions

// =============================================================================
// LEADERBOARD TYPES
// =============================================================================

/**
 * Leaderboard Entry
 * Single entry in a leaderboard ranking
 * 
 * Used in: JumbotronDashboard, LeaderboardWidget
 * Database: coliseum_leaderboards (cached)
 */
export interface LeaderboardEntry {
  // Ranking
  rank: number
  previous_rank?: number
  
  // Entity
  entity_id: string
  entity_type: 'artist' | 'event' | 'user' | 'track' | 'city'
  entity_name: string
  entity_image_url?: string
  
  // Score
  score: number
  score_type: string           // "plays", "votes", "resonance", etc.
  
  // Trends
  trend: 'up' | 'down' | 'stable' | 'new'
  change: number               // Change from previous period
  change_percent?: number
  
  // Additional context
  metadata?: {
    subtitle?: string          // "Boston, MA" for artist location
    badge?: string             // "🔥 Trending" badge
  }
}

/**
 * Leaderboard Config
 * Configuration for a leaderboard
 * 
 * Used in: LeaderboardWidget, JumbotronDashboard
 */
export interface LeaderboardConfig {
  id: string
  
  // Leaderboard details
  name: string
  description: string
  entity_type: 'artist' | 'event' | 'user' | 'track' | 'city'
  
  // Scoring
  metric_type: MetricType
  aggregation: 'sum' | 'avg' | 'count' | 'max'
  time_window: TimeRange
  
  // Filters
  filters?: {
    city?: string
    genre?: string
    event_id?: string
  }
  
  // Display
  max_entries: number
  update_frequency: 'realtime' | 'hourly' | 'daily'
  is_public: boolean
  
  // Status
  is_active: boolean
  created_at: Date
}

// =============================================================================
// ANALYTICS REPORT TYPES
// =============================================================================

/**
 * Analytics Report
 * Comprehensive analytics report for an entity
 * 
 * Used in: AnalyticsReport component
 * Generated by: Coliseum analytics engine
 * V2 Integration: Powers brand ROI reports, event post-mortems
 */
export interface AnalyticsReport {
  id: string
  
  // Report context
  report_type: 'event' | 'artist' | 'brand_campaign' | 'city' | 'tournament'
  entity_id: string
  entity_name: string
  time_range: TimeRange
  custom_date_range?: {
    start: Date
    end: Date
  }
  
  // Core metrics
  metrics: ReportMetrics
  
  // Conversion funnels
  funnels: FunnelData[]
  
  // DNA insights (audience analysis)
  dna_insights: DNAInsights
  
  // Engagement timeline
  engagement_timeline: Array<{
    date: Date
    [metric: string]: number | Date
  }>
  
  // Comparisons
  comparison?: {
    previous_period: ReportMetrics
    percent_change: Record<string, number>
  }
  
  // Status
  generated_at: Date
  generated_by?: string        // User who requested report
}

/**
 * Report Metrics
 * Core metrics included in analytics reports
 */
export interface ReportMetrics {
  // Reach
  impressions: number
  unique_visitors: number
  page_views: number
  
  // Engagement
  engagements: number          // Total interactions
  engagement_rate: number      // Engagements / Impressions
  avg_session_duration_seconds: number
  
  // Conversion
  conversions: number          // Purchases, RSVPs, subscriptions
  conversion_rate: number      // Conversions / Visitors
  
  // Revenue (from Treasury)
  revenue_cents: number
  avg_transaction_cents: number
  
  // Social
  shares: number
  likes: number
  comments: number
  
  // DNA-specific
  avg_dna_match_score?: number
  dna_match_distribution?: {
    strong: number             // % with >0.8 match
    good: number
    moderate: number
    weak: number
  }
}

/**
 * Funnel Data
 * Conversion funnel tracking
 * 
 * Used in: FunnelVisualization component
 * Example funnel: Event Page → RSVP → Attend → Vote
 */
export interface FunnelData {
  funnel_id: string
  funnel_name: string
  
  stages: FunnelStage[]
  
  // Overall funnel metrics
  total_entered: number
  total_completed: number
  completion_rate: number
  
  // Drop-off analysis
  biggest_drop_off_stage?: string
  avg_time_to_complete_seconds?: number
}

/**
 * Funnel Stage
 * Individual stage in a conversion funnel
 */
export interface FunnelStage {
  stage_name: string
  stage_order: number
  
  // Stage metrics
  entered: number
  exited: number
  completed: number            // Proceeded to next stage
  
  // Rates
  conversion_rate: number      // % who proceeded to next stage
  drop_off_rate: number        // % who left at this stage
  
  // Timing
  avg_time_in_stage_seconds: number
}

// =============================================================================
// DNA INSIGHTS TYPES (AUDIENCE ANALYSIS)
// =============================================================================

/**
 * DNA Insights
 * DNA-based audience analysis for an entity
 * 
 * Used in: DNACompatibilityReport component
 * V2 Integration: #1 MediaID DNA → #3 Coliseum Analytics
 * Powers: Brand targeting, Event recommendations, Artist growth
 */
export interface DNAInsights {
  entity_id: string
  entity_type: 'artist' | 'event' | 'brand' | 'track'
  
  // Match statistics
  total_matches_analyzed: number
  average_match_score: number
  median_match_score: number
  
  // Match distribution
  match_distribution: {
    strong: number             // Count with >0.8 match
    good: number               // Count with 0.6-0.8 match
    moderate: number           // Count with 0.4-0.6 match
    weak: number               // Count with <0.4 match
  }
  
  // Domain breakdown
  top_matching_domains: Array<{
    domain: DNADomain
    avg_score: number
    median_score: number
  }>
  
  // Audience segmentation
  audience_clusters: DNACluster[]
  dominant_cluster_id?: string
  
  // Geographic insights
  top_cities?: Array<{
    city: string
    match_count: number
    avg_match_score: number
  }>
  
  // Behavioral insights
  engagement_patterns?: {
    peak_hours: number[]       // Hours of day with highest engagement
    peak_days: string[]        // Days of week
    avg_session_duration_seconds: number
  }
  
  // Temporal trends
  match_score_trend: 'improving' | 'stable' | 'declining'
  growth_rate?: number         // % change in audience size
  
  // Generated metadata
  generated_at: Date
  sample_size: number
}

// =============================================================================
// RESONANCE TRACKING (VAULT MAP INTEGRATION)
// =============================================================================

/**
 * Resonance Heatmap Data
 * Geographic resonance visualization data
 * 
 * V2 Integration: #11 Vault Map (geospatial visualization)
 * Used in: Vault Map component, City-to-City tournament (#14)
 */
export interface ResonanceHeatmapData {
  entity_id: string
  entity_type: 'artist' | 'genre' | 'event'
  
  // Geographic points
  points: Array<{
    city: string
    state?: string
    country: string
    latitude: number
    longitude: number
    
    // Resonance metrics
    resonance_score: number    // 0-100
    engagement_count: number
    dna_match_avg: number
    
    // Visual properties
    heat_intensity: number     // 0-1 for heatmap color
    marker_size: number        // For map markers
  }>
  
  // Aggregates
  total_cities: number
  top_city: string
  geographic_spread_score: number  // How widespread the resonance is
  
  generated_at: Date
}

// =============================================================================
// REAL-TIME STREAMING TYPES
// =============================================================================

/**
 * Real-Time Metric Stream
 * For WebSocket/Server-Sent Events streaming
 * 
 * Used in: JumbotronDashboard (live updates)
 * V2 Integration: Supabase Realtime subscriptions
 */
export interface MetricStreamEvent {
  event_type: 'metric_logged' | 'leaderboard_updated' | 'milestone_reached'
  
  // Event data
  metric?: ColiseumMetric
  leaderboard_entry?: LeaderboardEntry
  milestone?: MilestoneEvent
  
  timestamp: Date
}

/**
 * Milestone Event
 * Significant achievement worthy of celebration
 * 
 * Used in: Jumbotron notifications, Achievement system
 */
export interface MilestoneEvent {
  id: string
  entity_id: string
  entity_type: 'artist' | 'event' | 'user'
  entity_name: string
  
  milestone_type: 'play_count' | 'follower_count' | 'vote_count' | 'revenue' | 'resonance'
  threshold: number            // E.g., 10000 for "10K plays"
  current_value: number
  
  // Display
  title: string                // "10,000 Plays!"
  description: string          // "Artist X reached 10K plays"
  badge_url?: string
  
  achieved_at: Date
}

// =============================================================================
// CITY-TO-CITY TOURNAMENT TYPES
// =============================================================================

/**
 * Tournament Bracket
 * March Madness-style tournament for artists
 * 
 * V2 Living Index: #14 City-to-City Tournament
 * Used in: Tournament visualization, Coliseum Evolution Tracker (#15)
 */
export interface TournamentBracket {
  id: string
  name: string
  
  // Structure
  rounds: TournamentRound[]
  
  // Status
  status: 'upcoming' | 'active' | 'completed'
  current_round: number
  
  // Participants
  total_participants: number
  cities_represented: string[]
  
  // Timing
  starts_at: Date
  ends_at: Date
  created_at: Date
}

/**
 * Tournament Round
 * Single round in tournament bracket
 */
export interface TournamentRound {
  round_number: number
  round_name: string           // "Round of 16", "Quarter Finals", etc.
  
  matchups: TournamentMatchup[]
  
  starts_at: Date
  ends_at: Date
}

/**
 * Tournament Matchup
 * Head-to-head matchup between two artists
 */
export interface TournamentMatchup {
  id: string
  
  // Participants
  artist_a_id: string
  artist_a_name: string
  artist_a_city: string
  artist_a_votes: number
  
  artist_b_id: string
  artist_b_name: string
  artist_b_city: string
  artist_b_votes: number
  
  // Result
  winner_id?: string
  status: 'scheduled' | 'active' | 'completed'
  
  // DNA insights
  avg_dna_match_a: number
  avg_dna_match_b: number
  
  completed_at?: Date
}

// =============================================================================
// EXPORTS
// =============================================================================

// All types exported for use across the application
// Import as: import { ColiseumMetric, LeaderboardEntry } from '@/types/coliseum'

