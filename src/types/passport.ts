/**
 * =============================================================================
 * PASSPORT TYPE DEFINITIONS
 * =============================================================================
 * 
 * Part of: Buckets V2 Core Infrastructure
 * V2 Living Index: #0 Passport (Citizen Interaction Ledger)
 * Frontend Architecture: Passport System
 * 
 * PURPOSE:
 * Passport is the immutable event log for ALL user interactions across
 * Buckets Nation. It serves as the single source of truth for user journey,
 * enabling event sourcing, full audit trails, and system recovery.
 * 
 * THE METAPHOR:
 * Like a real passport showing travel stamps from every country visited,
 * the Passport system logs every interaction "stamp" as users traverse
 * the Buckets Nation ecosystem.
 * 
 * - MediaID = Your citizenship papers (WHO you are)
 * - Passport = Your travel history (WHERE you've been, WHAT you've done)
 * 
 * RELATIONSHIP TO TRINITY:
 * MediaID : Macro :: Passport : Micro
 * - MediaID: Identity + aggregate DNA state
 * - Passport: Individual interaction events that shape DNA
 * 
 * DATA FLOW (EVENT SOURCING):
 * 1. User Action → Passport Entry (append-only, immutable)
 * 2. Background Processor reads unprocessed entries
 * 3. Routes events to appropriate Trinity systems:
 *    - MediaID DNA (enrichment via mirroring)
 *    - Treasury (balance updates, attribution)
 *    - Coliseum (metrics aggregation)
 * 4. Mark entry as processed
 * 5. Trinity systems are "projections" from Passport event stream
 * 
 * BENEFITS:
 * - Single ingestion point (easier to scale)
 * - Full audit trail (compliance, debugging)
 * - Event replay (can rebuild Trinity state)
 * - Load balancing (decouple writes from processing)
 * - User journey reconstruction (analytics)
 * 
 * INTEGRATION POINTS:
 * - Logs from: ALL user interactions across platform
 * - Consumed by: Event processor → Trinity systems
 * - Displayed in: Passport Viewer (travel history UI)
 * - Queried by: Coliseum Analytics, DIA oversight
 * - Accessible via: CALS/Locker interface (like listening history)
 * 
 * DATABASE:
 * - passport_entries (TimescaleDB hypertable for time-series optimization)
 * - Append-only (immutable audit log)
 * - Partitioned by time for performance
 * - Indexed by user_id, timestamp, event_type, processed status
 * 
 * =============================================================================
 */

// =============================================================================
// CORE PASSPORT TYPES
// =============================================================================

/**
 * Passport Entry (Event)
 * 
 * Immutable log entry for every interaction in Buckets Nation.
 * This is the fundamental unit of the event sourcing system.
 * 
 * Database: passport_entries table (TimescaleDB hypertable)
 * Used by: All components tracking user actions
 */
export interface PassportEntry {
  // Identity
  id: string                    // UUID
  user_id: string               // WHO performed the action
  mediaid_id: string            // MediaID reference
  
  // Event classification
  event_type: PassportEventType // WHAT happened (strongly typed)
  event_category: PassportEventCategory
  
  // Trinity routing
  affects_systems: PassportSystem[]  // Which Trinity systems need updating
  
  // Event data (flexible JSON for different event types)
  payload: PassportPayload
  
  // Context
  timestamp: Date               // WHEN (indexed for time-series queries)
  source: PassportSource        // WHERE it came from (web, ios, android, api)
  session_id: string            // User session (for journey reconstruction)
  ip_address?: string           // For security/fraud detection
  user_agent?: string           // Device/browser info
  
  // Processing state (for background processor)
  processed: boolean            // Has this been routed to Trinity?
  processed_at?: Date
  processing_attempts: number   // Retry count
  processing_errors?: string[]  // Error log if processing fails
  
  // Metadata
  created_at: Date
}

/**
 * Passport Event Category
 * High-level categorization for filtering and routing
 */
export type PassportEventCategory =
  | 'trinity'        // Direct Trinity system events (DNA gen, balance update)
  | 'interaction'    // User content interactions (play, vote, share)
  | 'transaction'    // Financial transactions
  | 'access'         // Auth and permission events
  | 'social'         // Social interactions (follow, like, comment)
  | 'system'         // System-generated events

/**
 * Passport Event Type
 * Specific event types (extensible)
 * 
 * Naming convention: system.action
 * Examples: mediaid.dna_generated, treasury.payout_requested
 */
export type PassportEventType =
  // MediaID / DNA Events (#1 Trinity)
  | 'mediaid.setup_started'
  | 'mediaid.setup_completed'
  | 'mediaid.dna_generated'
  | 'mediaid.dna_evolved'
  | 'mediaid.dna_match_calculated'
  | 'mediaid.simulator_used'
  | 'mediaid.profile_viewed'
  | 'mediaid.consent_updated'
  
  // Treasury Events (#2 Trinity)
  | 'treasury.transaction_created'
  | 'treasury.balance_updated'
  | 'treasury.payout_requested'
  | 'treasury.payout_completed'
  | 'treasury.attribution_credited'
  | 'treasury.subscription_started'
  | 'treasury.subscription_renewed'
  | 'treasury.subscription_cancelled'
  
  // Coliseum Events (#3 Trinity)
  | 'coliseum.metric_tracked'
  | 'coliseum.milestone_reached'
  | 'coliseum.leaderboard_updated'
  | 'coliseum.report_generated'
  
  // Player Interactions (#6 Buckets Core)
  | 'player.track_played'
  | 'player.track_completed'
  | 'player.track_skipped'
  | 'player.track_favorited'
  | 'player.playlist_created'
  | 'player.queue_updated'
  
  // Concierto Interactions (#7 Events)
  | 'concierto.event_created'
  | 'concierto.event_viewed'
  | 'concierto.event_rsvp'
  | 'concierto.event_attended'
  | 'concierto.vote_cast'
  | 'concierto.artist_scored'
  | 'concierto.ticket_purchased'
  
  // Locker Interactions (#8)
  | 'locker.item_unlocked'
  | 'locker.content_viewed'
  | 'locker.reward_claimed'
  
  // CALS Interactions (#5)
  | 'cals.link_shared'
  | 'cals.link_opened'
  | 'cals.thread_created'
  | 'cals.message_sent'
  
  // Social Interactions
  | 'social.user_followed'
  | 'social.user_unfollowed'
  | 'social.content_liked'
  | 'social.content_commented'
  | 'social.content_shared'
  
  // Discovery Interactions
  | 'discovery.search_performed'
  | 'discovery.artist_discovered'
  | 'discovery.recommendation_clicked'
  | 'discovery.filter_applied'
  
  // Access Events
  | 'access.login'
  | 'access.logout'
  | 'access.permission_granted'
  | 'access.permission_revoked'
  | 'access.system_accessed'
  | 'access.oauth_connected'
  
  // System Events
  | 'system.error_occurred'
  | 'system.notification_sent'
  | 'system.email_sent'

/**
 * Passport System
 * Which Trinity systems are affected by this event
 */
export type PassportSystem = 'mediaid' | 'treasury' | 'coliseum'

/**
 * Passport Source
 * Where the event originated
 */
export type PassportSource = 'web' | 'ios' | 'android' | 'api' | 'system' | 'admin'

/**
 * Passport Payload
 * Flexible structure for event-specific data
 * 
 * Each event type can have its own payload structure
 */
export interface PassportPayload {
  // Common fields
  entity_id?: string             // ID of entity involved (track, event, artist)
  entity_type?: string           // Type of entity
  
  // Event-specific data (flexible)
  [key: string]: any
  
  // Examples:
  // player.track_played: { trackId, artistId, duration, progress }
  // concierto.vote_cast: { eventId, artistId, voteType, scores }
  // treasury.transaction_created: { amount_cents, transaction_type }
}

// =============================================================================
// PASSPORT QUERY TYPES
// =============================================================================

/**
 * Passport Query Filters
 * For querying user's Passport history
 * 
 * Used by: Passport viewer, analytics, audit tools
 */
export interface PassportQueryFilters {
  user_id?: string
  mediaid_id?: string
  event_types?: PassportEventType[]
  event_categories?: PassportEventCategory[]
  affects_systems?: PassportSystem[]
  source?: PassportSource
  
  // Time range
  start_date?: Date
  end_date?: Date
  
  // Processing status
  processed?: boolean
  has_errors?: boolean
  
  // Pagination
  limit?: number
  offset?: number
  
  // Sorting
  sort_by?: 'timestamp' | 'event_type' | 'processed_at'
  sort_order?: 'asc' | 'desc'
}

/**
 * Passport Query Result
 * Result of querying Passport entries
 */
export interface PassportQueryResult {
  entries: PassportEntry[]
  total_count: number
  has_more: boolean
  next_offset?: number
}

// =============================================================================
// PASSPORT JOURNEY TYPES (USER HISTORY VISUALIZATION)
// =============================================================================

/**
 * Passport Journey
 * Reconstructed user journey from Passport entries
 * 
 * Used in: Passport viewer UI (travel history)
 * Shows: User's journey through Buckets Nation
 */
export interface PassportJourney {
  user_id: string
  mediaid_id: string
  
  // Journey summary
  first_stamp: Date             // First Passport entry
  last_stamp: Date              // Most recent entry
  total_stamps: number          // Total interactions
  days_active: number           // Days with at least one stamp
  
  // Journey breakdown by category
  by_category: Record<PassportEventCategory, number>
  by_system: Record<PassportSystem, number>
  
  // Journey timeline (chronological stamps)
  timeline: PassportStamp[]
  
  // Journey insights
  most_active_hour: number      // Hour of day with most activity
  most_active_day: string       // Day of week
  favorite_interactions: string[] // Most common event types
  
  // Journey milestones
  milestones: PassportMilestone[]
  
  generated_at: Date
}

/**
 * Passport Stamp
 * Visual representation of a Passport entry for timeline
 * 
 * Used in: Passport viewer timeline
 */
export interface PassportStamp {
  id: string
  timestamp: Date
  event_type: PassportEventType
  event_category: PassportEventCategory
  
  // Display info
  icon: string                  // Emoji/icon for event
  title: string                 // "Played Track", "Voted for Artist"
  description: string           // Human-readable description
  
  // Visual grouping
  is_grouped: boolean           // Part of a session group
  group_id?: string             // Session or time-based group
  
  // Links
  entity_link?: string          // Link to entity (track, event, etc.)
}

/**
 * Passport Milestone
 * Significant achievements in user's journey
 * 
 * Used in: Passport viewer, gamification
 */
export interface PassportMilestone {
  id: string
  milestone_type: string        // "first_vote", "100_plays", "1_year_member"
  achieved_at: Date
  title: string
  description: string
  badge_icon?: string
  
  // Context
  triggered_by_entry_id: string
  entry_count: number           // Number of entries that led to this
}

// =============================================================================
// PASSPORT ANALYTICS TYPES
// =============================================================================

/**
 * Passport Analytics Summary
 * Aggregated analytics from Passport data
 * 
 * Used by: Coliseum Analytics, DIA oversight
 * Powers: Real-time dashboards, user insights
 */
export interface PassportAnalyticsSummary {
  user_id: string
  time_range: {
    start: Date
    end: Date
  }
  
  // Activity metrics
  total_events: number
  events_per_day: number
  active_days: number
  longest_streak_days: number
  
  // Engagement breakdown
  by_category: Record<PassportEventCategory, {
    count: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }>
  
  by_system: Record<PassportSystem, {
    count: number
    dna_impact: number            // How much this affected DNA
    revenue_generated: number     // Treasury impact (cents)
  }>
  
  // Top activities
  top_event_types: Array<{
    event_type: PassportEventType
    count: number
    percentage: number
  }>
  
  // Journey insights
  peak_activity_hours: number[]
  peak_activity_days: string[]
  session_count: number
  avg_session_duration_minutes: number
  
  generated_at: Date
}

// =============================================================================
// PASSPORT PROCESSING TYPES
// =============================================================================

/**
 * Passport Processing Job
 * Background job to process unprocessed entries
 * 
 * Used by: Supabase Edge Function processor
 */
export interface PassportProcessingJob {
  job_id: string
  started_at: Date
  
  // Batch info
  entries_to_process: number
  entries_processed: number
  entries_failed: number
  
  // Status
  status: 'running' | 'completed' | 'failed' | 'paused'
  
  // Performance
  processing_rate_per_second: number
  estimated_completion: Date
  
  // Errors
  error_summary?: Record<string, number>  // Error type → count
  
  completed_at?: Date
}

/**
 * Passport Processing Result
 * Result of processing a single entry
 */
export interface PassportProcessingResult {
  entry_id: string
  success: boolean
  
  // What was updated
  systems_updated: PassportSystem[]
  
  // Changes made
  dna_enriched?: boolean
  balance_updated?: boolean
  metrics_logged?: boolean
  
  // Performance
  processing_time_ms: number
  
  // Errors
  errors?: Array<{
    system: PassportSystem
    error: string
    retryable: boolean
  }>
}

// =============================================================================
// PASSPORT VIEWER TYPES (UI)
// =============================================================================

/**
 * Passport Viewer Config
 * Configuration for Passport viewer component
 * 
 * Used by: PassportViewer.tsx component
 */
export interface PassportViewerConfig {
  // Display options
  view_mode: 'timeline' | 'list' | 'calendar' | 'map'
  group_by: 'date' | 'category' | 'session' | 'none'
  
  // Filters (user-selectable)
  show_categories: PassportEventCategory[]
  show_systems: PassportSystem[]
  date_range: 'week' | 'month' | 'year' | 'all'
  
  // Features
  show_milestones: boolean
  show_analytics: boolean
  enable_export: boolean
  enable_search: boolean
}

/**
 * Passport Export Format
 * For exporting user's Passport data
 * 
 * Used by: Export functionality, GDPR compliance
 */
export interface PassportExport {
  user_id: string
  mediaid_id: string
  export_requested_at: Date
  export_generated_at: Date
  
  // Exported data
  entries: PassportEntry[]
  journey: PassportJourney
  analytics: PassportAnalyticsSummary
  
  // Metadata
  total_entries: number
  date_range: {
    start: Date
    end: Date
  }
  
  // Format
  format: 'json' | 'csv' | 'pdf'
  file_size_bytes: number
}

// =============================================================================
// PASSPORT CONSENT & PRIVACY
// =============================================================================

/**
 * Passport Privacy Settings
 * User's privacy preferences for Passport logging
 * 
 * Used by: Passport logging system, consent management
 * Integration: #4 DIA (privacy oversight)
 */
export interface PassportPrivacySettings {
  user_id: string
  
  // Logging consent
  enable_passport_logging: boolean  // Master switch
  
  // Category-specific consent
  log_interactions: boolean         // Content interactions
  log_transactions: boolean         // Financial events
  log_social: boolean               // Social interactions
  log_access: boolean               // Login/auth events
  
  // Data retention
  retention_days: number            // How long to keep entries (default: 730 = 2 years)
  auto_delete_old_entries: boolean
  
  // Sharing
  share_with_analytics: boolean     // Allow aggregated analytics
  share_with_brands: boolean        // Allow brand targeting from Passport data
  
  // Metadata
  updated_at: Date
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Passport Event Template
 * Pre-defined templates for common events
 * 
 * Makes logging easier with standardized payloads
 */
export interface PassportEventTemplate {
  event_type: PassportEventType
  event_category: PassportEventCategory
  affects_systems: PassportSystem[]
  required_fields: string[]
  optional_fields: string[]
  example_payload: PassportPayload
}

/**
 * Passport Batch Insert
 * For bulk inserting multiple entries (performance optimization)
 */
export interface PassportBatchInsert {
  entries: Omit<PassportEntry, 'id' | 'created_at' | 'processed' | 'processing_attempts'>[]
  batch_id: string
  total_entries: number
}

// =============================================================================
// EXPORTS
// =============================================================================

// All types exported for use across the application
// Import as: import { PassportEntry, PassportJourney } from '@/types/passport'

