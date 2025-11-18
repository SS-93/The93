/**
 * =============================================================================
 * usePassport CUSTOM HOOK
 * =============================================================================
 * 
 * Part of: Buckets V2 Core Infrastructure
 * V2 Living Index: #0 Passport (Citizen Interaction Ledger)
 * Frontend Architecture: hooks/usePassport.tsx
 * 
 * PURPOSE:
 * React hook providing easy access to Passport logging from ANY component.
 * This is the primary interface for appending events to the Passport ledger.
 * 
 * USAGE PHILOSOPHY:
 * Every meaningful user interaction should be logged to Passport.
 * This hook makes it trivially easy:
 * 
 * ```tsx
 * const { logEvent } = usePassport()
 * 
 * // One line to log any interaction
 * logEvent('player.track_played', { trackId, duration })
 * ```
 * 
 * INTEGRATION POINTS:
 * - Called by: ALL components tracking user actions
 * - Writes to: passport_entries table (TimescaleDB)
 * - Triggers: Background processor → Trinity updates
 * - Powers: Passport viewer, analytics, audit trails
 * 
 * EVENT SOURCING FLOW:
 * 1. Component calls logEvent()
 * 2. Entry appended to Passport (fast write, returns immediately)
 * 3. Background processor picks up unprocessed entries
 * 4. Processor routes to Trinity systems (async)
 * 5. Trinity projections updated (MediaID DNA, Treasury, Coliseum)
 * 
 * EXAMPLE USAGE:
 * ```tsx
 * function TrackPlayer({ trackId }) {
 *   const { logEvent } = usePassport()
 *   
 *   const handlePlay = () => {
 *     // Play the track
 *     playAudio(trackId)
 *     
 *     // Log to Passport (one line!)
 *     logEvent('player.track_played', {
 *       trackId,
 *       artistId: track.artistId,
 *       duration: track.duration,
 *       source: 'player_page'
 *     })
 *   }
 *   
 *   return <button onClick={handlePlay}>Play</button>
 * }
 * ```
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  PassportEntry,
  PassportEventType,
  PassportPayload,
  PassportQueryFilters,
  PassportQueryResult,
  PassportJourney,
  PassportAnalyticsSummary,
  PassportSystem,
  PassportEventCategory
} from '@/types/passport'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// HOOK INTERFACE
// =============================================================================

interface UsePassportReturn {
  // Logging
  logEvent: (
    eventType: PassportEventType,
    payload?: PassportPayload,
    options?: LogEventOptions
  ) => Promise<void>
  
  // Batch logging (for performance)
  logEventsBatch: (
    events: Array<{ eventType: PassportEventType; payload?: PassportPayload }>
  ) => Promise<void>
  
  // Querying
  fetchJourney: (filters?: PassportQueryFilters) => Promise<PassportJourney>
  fetchEntries: (filters?: PassportQueryFilters) => Promise<PassportQueryResult>
  fetchAnalytics: (timeRange?: 'week' | 'month' | 'year') => Promise<PassportAnalyticsSummary>
  
  // State
  journey: PassportJourney | null
  recentEntries: PassportEntry[]
  loading: boolean
  error: Error | null
}

interface LogEventOptions {
  affects_systems?: PassportSystem[]  // Override default system routing
  session_id?: string                 // Custom session ID
  source?: string                     // Override source
}

// =============================================================================
// EVENT ROUTING CONFIGURATION
// =============================================================================

/**
 * Determines which Trinity systems are affected by each event type
 * This configuration drives the background processor routing
 */
const EVENT_SYSTEM_ROUTING: Record<PassportEventType, {
  affects_systems: PassportSystem[]
  category: PassportEventCategory
}> = {
  // MediaID events
  'mediaid.setup_started': { affects_systems: ['mediaid'], category: 'trinity' },
  'mediaid.setup_completed': { affects_systems: ['mediaid'], category: 'trinity' },
  'mediaid.dna_generated': { affects_systems: ['mediaid'], category: 'trinity' },
  'mediaid.dna_evolved': { affects_systems: ['mediaid'], category: 'trinity' },
  'mediaid.dna_match_calculated': { affects_systems: ['mediaid', 'coliseum'], category: 'trinity' },
  'mediaid.simulator_used': { affects_systems: ['mediaid', 'coliseum'], category: 'trinity' },
  'mediaid.profile_viewed': { affects_systems: ['coliseum'], category: 'interaction' },
  'mediaid.consent_updated': { affects_systems: ['mediaid'], category: 'trinity' },
  
  // Treasury events
  'treasury.transaction_created': { affects_systems: ['treasury', 'coliseum'], category: 'transaction' },
  'treasury.balance_updated': { affects_systems: ['treasury'], category: 'transaction' },
  'treasury.payout_requested': { affects_systems: ['treasury', 'coliseum'], category: 'transaction' },
  'treasury.payout_completed': { affects_systems: ['treasury', 'coliseum'], category: 'transaction' },
  'treasury.attribution_credited': { affects_systems: ['treasury', 'coliseum'], category: 'transaction' },
  'treasury.subscription_started': { affects_systems: ['treasury', 'mediaid', 'coliseum'], category: 'transaction' },
  'treasury.subscription_renewed': { affects_systems: ['treasury', 'coliseum'], category: 'transaction' },
  'treasury.subscription_cancelled': { affects_systems: ['treasury', 'coliseum'], category: 'transaction' },
  
  // Coliseum events
  'coliseum.metric_tracked': { affects_systems: ['coliseum'], category: 'trinity' },
  'coliseum.milestone_reached': { affects_systems: ['coliseum'], category: 'trinity' },
  'coliseum.leaderboard_updated': { affects_systems: ['coliseum'], category: 'trinity' },
  'coliseum.report_generated': { affects_systems: ['coliseum'], category: 'trinity' },
  
  // Player interactions (affect DNA + analytics)
  'player.track_played': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'player.track_completed': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'player.track_skipped': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'player.track_favorited': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'player.playlist_created': { affects_systems: ['coliseum'], category: 'interaction' },
  'player.queue_updated': { affects_systems: ['coliseum'], category: 'interaction' },
  
  // Concierto interactions
  'concierto.event_created': { affects_systems: ['coliseum'], category: 'interaction' },
  'concierto.event_viewed': { affects_systems: ['coliseum'], category: 'interaction' },
  'concierto.event_rsvp': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'concierto.event_attended': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'concierto.vote_cast': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'concierto.artist_scored': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'concierto.ticket_purchased': { affects_systems: ['treasury', 'mediaid', 'coliseum'], category: 'transaction' },
  
  // Locker interactions
  'locker.item_unlocked': { affects_systems: ['coliseum'], category: 'interaction' },
  'locker.content_viewed': { affects_systems: ['coliseum'], category: 'interaction' },
  'locker.reward_claimed': { affects_systems: ['treasury', 'coliseum'], category: 'interaction' },
  
  // CALS interactions
  'cals.link_shared': { affects_systems: ['coliseum'], category: 'interaction' },
  'cals.link_opened': { affects_systems: ['coliseum'], category: 'interaction' },
  'cals.thread_created': { affects_systems: ['coliseum'], category: 'interaction' },
  'cals.message_sent': { affects_systems: ['coliseum'], category: 'interaction' },
  
  // Social interactions
  'social.user_followed': { affects_systems: ['mediaid', 'coliseum'], category: 'social' },
  'social.user_unfollowed': { affects_systems: ['mediaid', 'coliseum'], category: 'social' },
  'social.content_liked': { affects_systems: ['mediaid', 'coliseum'], category: 'social' },
  'social.content_commented': { affects_systems: ['coliseum'], category: 'social' },
  'social.content_shared': { affects_systems: ['coliseum'], category: 'social' },
  
  // Discovery interactions
  'discovery.search_performed': { affects_systems: ['coliseum'], category: 'interaction' },
  'discovery.artist_discovered': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'discovery.recommendation_clicked': { affects_systems: ['mediaid', 'coliseum'], category: 'interaction' },
  'discovery.filter_applied': { affects_systems: ['coliseum'], category: 'interaction' },
  
  // Access events
  'access.login': { affects_systems: ['coliseum'], category: 'access' },
  'access.logout': { affects_systems: ['coliseum'], category: 'access' },
  'access.permission_granted': { affects_systems: ['coliseum'], category: 'access' },
  'access.permission_revoked': { affects_systems: ['coliseum'], category: 'access' },
  'access.system_accessed': { affects_systems: ['coliseum'], category: 'access' },
  'access.oauth_connected': { affects_systems: ['mediaid', 'coliseum'], category: 'access' },
  
  // System events
  'system.error_occurred': { affects_systems: [], category: 'system' },
  'system.notification_sent': { affects_systems: ['coliseum'], category: 'system' },
  'system.email_sent': { affects_systems: ['coliseum'], category: 'system' }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * usePassport Hook
 * 
 * Primary interface for Passport logging and querying
 * 
 * @param options - Hook options
 * @returns Passport operations and state
 */
export function usePassport(
  options?: {
    autoFetchJourney?: boolean    // Auto-fetch journey on mount
    sessionId?: string             // Custom session ID
  }
): UsePassportReturn {
  // State
  const [journey, setJourney] = useState<PassportJourney | null>(null)
  const [recentEntries, setRecentEntries] = useState<PassportEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Session ID (persistent per page load)
  const [sessionId] = useState(options?.sessionId || uuidv4())
  
  // =============================================================================
  // LOG EVENT (PRIMARY FUNCTION)
  // =============================================================================
  
  /**
   * Log a single event to Passport
   * 
   * This is the main function you'll call from components
   * 
   * @param eventType - Type of event
   * @param payload - Event-specific data
   * @param options - Optional overrides
   */
  const logEvent = useCallback(async (
    eventType: PassportEventType,
    payload: PassportPayload = {},
    logOptions?: LogEventOptions
  ): Promise<void> => {
    console.log('🛂 ========================================')
    console.log('🛂 [usePassport] logEvent() called')
    console.log('🛂 Event Type:', eventType)
    console.log('🛂 Payload:', payload)
    console.log('🛂 ========================================')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.warn('⚠️ [usePassport] Cannot log event without authenticated user')
        return
      }

      console.log('✅ [usePassport] User authenticated:', user.email)
      console.log('👤 [usePassport] User ID:', user.id)

      // Get MediaID
      console.log('🔍 [usePassport] Fetching MediaID...')
      const { data: mediaId } = await supabase
        .from('media_ids')
        .select('id')
        .eq('user_uuid', user.id)
        .single()

      if (mediaId) {
        console.log('✅ [usePassport] MediaID found:', mediaId.id)
      } else {
        console.log('⚠️ [usePassport] No MediaID found for user')
      }

      // Get event routing configuration
      const routing = EVENT_SYSTEM_ROUTING[eventType]

      if (!routing) {
        console.warn(`❌ [usePassport] Unknown event type: ${eventType}`)
        return
      }

      console.log('📍 [usePassport] Event category:', routing.category)
      console.log('🎯 [usePassport] Affects systems:', routing.affects_systems.join(', '))

      // Build Passport entry (aligned with new schema)
      const entry = {
        user_id: user.id,
        session_id: logOptions?.session_id || sessionId,
        device_id: null, // TODO: Add device fingerprinting
        event_type: eventType,
        event_category: routing.category,
        entity_type: payload.entity_type || null,
        entity_id: payload.entity_id || null,
        metadata: payload, // Store full payload in JSONB metadata
        processed_by_mediaid: false,
        processed_by_treasury: false,
        processed_by_coliseum: false,
        dna_influence: null // Will be calculated by processor
      }

      console.log('📝 [usePassport] Passport entry prepared:', {
        event_type: entry.event_type,
        event_category: entry.event_category,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        session_id: entry.session_id
      })

      // Insert to Passport (fast write)
      console.log('💾 [usePassport] Inserting to passport_entries table...')
      const { data: insertedData, error: insertError } = await supabase
        .from('passport_entries')
        .insert(entry)
        .select()

      if (insertError) {
        console.error('❌ [usePassport] Error logging event:', insertError)
        throw insertError
      }

      console.log('✅ [usePassport] ✓ Event logged successfully!')
      console.log('📊 [usePassport] Event:', eventType)
      console.log('📊 [usePassport] Category:', routing.category)
      console.log('📊 [usePassport] User:', user.email)
      console.log('🛂 ========================================')
      
      // Update recent entries (optimistic)
      setRecentEntries(prev => [
        {
          ...entry,
          id: uuidv4(),
          created_at: new Date(),
          // Map new schema to old types for compatibility
          mediaid_id: mediaId?.id || user.id,
          affects_systems: routing.affects_systems,
          payload: payload,
          timestamp: new Date(),
          source: 'web' as const,
          processed: false,
          processing_attempts: 0
        } as PassportEntry,
        ...prev.slice(0, 9) // Keep last 10
      ])
    } catch (err) {
      console.error('[usePassport] Error in logEvent:', err)
      // Don't throw - logging failures shouldn't break UX
    }
  }, [sessionId])
  
  // =============================================================================
  // BATCH LOGGING
  // =============================================================================
  
  /**
   * Log multiple events in a single batch (performance optimization)
   * 
   * Use this when logging many events at once (e.g., bulk import)
   * 
   * @param events - Array of events to log
   */
  const logEventsBatch = useCallback(async (
    events: Array<{ eventType: PassportEventType; payload?: PassportPayload }>
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: mediaId } = await supabase
        .from('media_ids')
        .select('id')
        .eq('user_uuid', user.id)
        .single()
      
      const entries = events.map(({ eventType, payload = {} }) => {
        const routing = EVENT_SYSTEM_ROUTING[eventType]

        return {
          user_id: user.id,
          session_id: sessionId,
          device_id: null,
          event_type: eventType,
          event_category: routing.category,
          entity_type: payload.entity_type || null,
          entity_id: payload.entity_id || null,
          metadata: payload,
          processed_by_mediaid: false,
          processed_by_treasury: false,
          processed_by_coliseum: false,
          dna_influence: null
        }
      })
      
      const { error: insertError } = await supabase
        .from('passport_entries')
        .insert(entries)
      
      if (insertError) throw insertError
      
      console.log(`[usePassport] ✓ Batch logged ${events.length} events`)
    } catch (err) {
      console.error('[usePassport] Error in batch logging:', err)
    }
  }, [sessionId])
  
  // =============================================================================
  // FETCH JOURNEY
  // =============================================================================
  
  /**
   * Fetch user's Passport journey (travel history)
   * 
   * @param filters - Optional filters
   * @returns Complete journey data
   */
  const fetchJourney = useCallback(async (
    filters?: PassportQueryFilters
  ): Promise<PassportJourney> => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Fetch entries (using new schema with created_at)
      const { data: entries, error: fetchError } = await supabase
        .from('passport_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (fetchError) throw fetchError
      
      // Build journey from entries
      const journey: PassportJourney = {
        user_id: user.id,
        mediaid_id: user.id, // Will fetch from media_ids if needed
        first_stamp: new Date(entries?.[entries.length - 1]?.created_at || Date.now()),
        last_stamp: new Date(entries?.[0]?.created_at || Date.now()),
        total_stamps: entries?.length || 0,
        days_active: 0, // TODO: Calculate
        by_category: {} as any,
        by_system: {} as any,
        timeline: [], // TODO: Build timeline
        most_active_hour: 0,
        most_active_day: 'Monday',
        favorite_interactions: [],
        milestones: [],
        generated_at: new Date()
      }
      
      setJourney(journey)
      return journey
    } catch (err) {
      console.error('[usePassport] Error fetching journey:', err)
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  // =============================================================================
  // FETCH ENTRIES
  // =============================================================================
  
  /**
   * Fetch Passport entries with filters
   * 
   * @param filters - Query filters
   * @returns Paginated entries
   */
  const fetchEntries = useCallback(async (
    filters?: PassportQueryFilters
  ): Promise<PassportQueryResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      let query = supabase
        .from('passport_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
      
      // Apply filters
      if (filters?.event_types) {
        query = query.in('event_type', filters.event_types)
      }

      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString())
      }

      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date.toISOString())
      }

      // Pagination
      const limit = filters?.limit || 50
      const offset = filters?.offset || 0

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      const { data, error: fetchError, count } = await query
      
      if (fetchError) throw fetchError
      
      return {
        entries: data as PassportEntry[],
        total_count: count || 0,
        has_more: (count || 0) > offset + limit,
        next_offset: offset + limit
      }
    } catch (err) {
      console.error('[usePassport] Error fetching entries:', err)
      throw err
    }
  }, [])
  
  // =============================================================================
  // FETCH ANALYTICS
  // =============================================================================
  
  /**
   * Fetch analytics summary from Passport data
   * 
   * @param timeRange - Time range for analytics
   * @returns Analytics summary
   */
  const fetchAnalytics = useCallback(async (
    timeRange: 'week' | 'month' | 'year' = 'month'
  ): Promise<PassportAnalyticsSummary> => {
    try {
      // TODO: Implement full analytics calculation
      throw new Error('Analytics not yet implemented')
    } catch (err) {
      console.error('[usePassport] Error fetching analytics:', err)
      throw err
    }
  }, [])
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  /**
   * Auto-fetch journey on mount
   */
  useEffect(() => {
    if (options?.autoFetchJourney) {
      fetchJourney()
    }
  }, [options?.autoFetchJourney, fetchJourney])
  
  // =============================================================================
  // RETURN
  // =============================================================================
  
  return {
    logEvent,
    logEventsBatch,
    fetchJourney,
    fetchEntries,
    fetchAnalytics,
    journey,
    recentEntries,
    loading,
    error
  }
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Simple hook for logging only (no state)
 * Use this when you only need to log events
 */
export function usePassportLogger(): {
  log: (eventType: PassportEventType, payload?: PassportPayload) => Promise<void>
} {
  const { logEvent } = usePassport()
  
  return {
    log: logEvent
  }
}

