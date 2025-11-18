/**
 * =============================================================================
 * useColiseum CUSTOM HOOK
 * =============================================================================
 * 
 * Part of: Buckets V2 Trinity → Coliseum System
 * V2 Living Index: #3 Coliseum Analytics (Jumbotron)
 * Frontend Architecture: hooks/useColiseum.tsx
 * 
 * PURPOSE:
 * React hook providing access to all Coliseum Analytics operations:
 * - Track metrics and events
 * - Fetch leaderboards
 * - Generate analytics reports
 * - Subscribe to real-time metric updates
 * - Access DNA insights
 * 
 * USE CASES:
 * - ANY component tracking user engagement
 * - JumbotronDashboard component: Display leaderboards
 * - AnalyticsReport component: Generate reports
 * - MetricsIngestion component: Admin monitoring
 * 
 * INTEGRATION POINTS:
 * - Tracks to: coliseum_metrics table (Supabase)
 * - Powers: All analytics and insights
 * - Feeds: Treasury (for ROI), DIA (for oversight)
 * - Real-time: Supabase Realtime for live metrics
 * 
 * EXAMPLE USAGE:
 * ```tsx
 * const { trackEvent, leaderboard, loading } = useColiseum()
 * 
 * // Track user action
 * trackEvent('player.track_played', {
 *   trackId: 'track123',
 *   duration: 180
 * })
 * 
 * // Display leaderboard
 * {leaderboard.map(entry => <div>{entry.entity_name}</div>)}
 * ```
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  ColiseumMetric,
  MetricType,
  LeaderboardEntry,
  AnalyticsReport,
  TimeRange
} from '@/types/coliseum'

// =============================================================================
// HOOK INTERFACE
// =============================================================================

interface UseColiseumReturn {
  // Data
  leaderboard: LeaderboardEntry[]
  loading: boolean
  error: Error | null
  
  // Operations
  trackEvent: (
    metricType: MetricType | string,
    metadata?: Record<string, any>
  ) => Promise<void>
  fetchLeaderboard: (
    leaderboardId: string,
    limit?: number
  ) => Promise<LeaderboardEntry[]>
  generateReport: (
    entityId: string,
    entityType: 'event' | 'artist' | 'brand_campaign',
    timeRange?: TimeRange
  ) => Promise<AnalyticsReport>
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * useColiseum Hook
 * 
 * Provides access to all Coliseum Analytics operations
 * 
 * @param options - Hook options
 * @returns Coliseum operations and state
 */
export function useColiseum(
  options?: {
    leaderboardId?: string    // Auto-fetch specific leaderboard
    realtime?: boolean         // Subscribe to real-time updates
  }
): UseColiseumReturn {
  // State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const realtime = options?.realtime === true
  
  // =============================================================================
  // TRACK EVENT
  // =============================================================================
  
  /**
   * Track a metric/event to Coliseum
   * 
   * This is the main function for logging all user actions
   */
  const trackEvent = useCallback(async (
    metricType: MetricType | string,
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Prepare metric
      const metric: Partial<ColiseumMetric> = {
        user_id: user?.id,
        metric_type: metricType as MetricType,
        metric_value: metadata.value || 1,
        source: 'web',
        metadata: metadata,
        timestamp: new Date()
      }
      
      // Add entity IDs if provided
      if (metadata.artistId) metric.artist_id = metadata.artistId
      if (metadata.eventId) metric.event_id = metadata.eventId
      if (metadata.trackId) metric.track_id = metadata.trackId
      if (metadata.brandId) metric.brand_id = metadata.brandId
      
      // Add DNA context if provided
      if (metadata.dnaMatchScore) metric.dna_match_score = metadata.dnaMatchScore
      
      // Insert into database
      const { error: insertError } = await supabase
        .from('coliseum_metrics')
        .insert(metric)
      
      if (insertError) {
        console.error('[useColiseum] Error tracking event:', insertError)
        // Don't throw - tracking failures shouldn't break UX
      } else {
        console.log(`[useColiseum] Tracked: ${metricType}`)
      }
    } catch (err) {
      console.error('[useColiseum] Error in trackEvent:', err)
      // Don't throw - tracking failures shouldn't break UX
    }
  }, [])
  
  // =============================================================================
  // FETCH LEADERBOARD
  // =============================================================================
  
  /**
   * Fetch leaderboard data
   */
  const fetchLeaderboard = useCallback(async (
    leaderboardId: string,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`[useColiseum] Fetching leaderboard: ${leaderboardId}`)
      
      const { data, error: fetchError } = await supabase
        .from('coliseum_leaderboards')
        .select('*')
        .eq('leaderboard_id', leaderboardId)
        .order('rank', { ascending: true })
        .limit(limit)
      
      if (fetchError) throw fetchError
      
      console.log(`[useColiseum] Fetched ${data?.length || 0} leaderboard entries`)
      const entries = (data as LeaderboardEntry[]) || []
      setLeaderboard(entries)
      return entries
    } catch (err) {
      console.error('[useColiseum] Error fetching leaderboard:', err)
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  // =============================================================================
  // GENERATE REPORT
  // =============================================================================
  
  /**
   * Generate analytics report for an entity
   */
  const generateReport = useCallback(async (
    entityId: string,
    entityType: 'event' | 'artist' | 'brand_campaign',
    timeRange: TimeRange = '30d'
  ): Promise<AnalyticsReport> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`[useColiseum] Generating report for ${entityType} ${entityId}`)
      
      // Calculate date range
      let startDate = new Date()
      if (timeRange !== 'all') {
        const days = parseInt(timeRange.replace('d', ''))
        startDate.setDate(startDate.getDate() - days)
      }
      
      // Fetch metrics for entity
      let query = supabase
        .from('coliseum_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
      
      // Filter by entity type
      if (entityType === 'event') {
        query = query.eq('event_id', entityId)
      } else if (entityType === 'artist') {
        query = query.eq('artist_id', entityId)
      } else if (entityType === 'brand_campaign') {
        query = query.eq('brand_id', entityId)
      }
      
      if (timeRange !== 'all') {
        query = query.gte('timestamp', startDate.toISOString())
      }
      
      const { data: metrics, error: metricsError } = await query
      
      if (metricsError) throw metricsError
      
      // Calculate aggregated metrics
      const report: AnalyticsReport = {
        id: `report-${entityId}-${Date.now()}`,
        report_type: entityType,
        entity_id: entityId,
        entity_name: 'Entity Name', // TODO: Fetch from respective table
        time_range: timeRange,
        metrics: {
          impressions: metrics?.filter(m => m.metric_type.includes('viewed')).length || 0,
          unique_visitors: new Set(metrics?.map(m => m.user_id).filter(Boolean)).size,
          page_views: metrics?.length || 0,
          engagements: metrics?.filter(m => 
            m.metric_type.includes('play') ||
            m.metric_type.includes('vote') ||
            m.metric_type.includes('like')
          ).length || 0,
          engagement_rate: 0, // Calculated below
          avg_session_duration_seconds: 0,
          conversions: metrics?.filter(m => 
            m.metric_type.includes('purchase') ||
            m.metric_type.includes('subscribe')
          ).length || 0,
          conversion_rate: 0,
          revenue_cents: 0,
          avg_transaction_cents: 0,
          shares: metrics?.filter(m => m.metric_type.includes('share')).length || 0,
          likes: metrics?.filter(m => m.metric_type.includes('like')).length || 0,
          comments: metrics?.filter(m => m.metric_type.includes('comment')).length || 0
        },
        funnels: [], // TODO: Implement funnel analysis
        dna_insights: {
          entity_id: entityId,
          entity_type: entityType as any,
          total_matches_analyzed: 0,
          average_match_score: 0,
          median_match_score: 0,
          match_distribution: { strong: 0, good: 0, moderate: 0, weak: 0 },
          top_matching_domains: [],
          audience_clusters: [],
          match_score_trend: 'stable',
          generated_at: new Date(),
          sample_size: 0
        },
        engagement_timeline: [],
        generated_at: new Date()
      }
      
      // Calculate rates
      if (report.metrics.impressions > 0) {
        report.metrics.engagement_rate = 
          report.metrics.engagements / report.metrics.impressions
      }
      if (report.metrics.unique_visitors > 0) {
        report.metrics.conversion_rate =
          report.metrics.conversions / report.metrics.unique_visitors
      }
      
      console.log('[useColiseum] Report generated')
      return report
    } catch (err) {
      console.error('[useColiseum] Error generating report:', err)
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  /**
   * Auto-fetch leaderboard if specified
   */
  useEffect(() => {
    if (options?.leaderboardId) {
      fetchLeaderboard(options.leaderboardId)
    }
  }, [options?.leaderboardId, fetchLeaderboard])
  
  /**
   * Subscribe to real-time leaderboard updates
   */
  useEffect(() => {
    if (!realtime || !options?.leaderboardId) return
    
    console.log(`[useColiseum] Subscribing to leaderboard updates: ${options.leaderboardId}`)
    
    const subscription = supabase
      .channel(`coliseum_leaderboards:${options.leaderboardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coliseum_leaderboards',
          filter: `leaderboard_id=eq.${options.leaderboardId}`
        },
        (payload) => {
          console.log('[useColiseum] Leaderboard update received')
          
          // Refresh leaderboard
          fetchLeaderboard(options.leaderboardId!)
        }
      )
      .subscribe()
    
    return () => {
      console.log('[useColiseum] Unsubscribing from leaderboard updates')
      subscription.unsubscribe()
    }
  }, [realtime, options?.leaderboardId, fetchLeaderboard])
  
  // =============================================================================
  // RETURN
  // =============================================================================
  
  return {
    leaderboard,
    loading,
    error,
    trackEvent,
    fetchLeaderboard,
    generateReport
  }
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook for simple event tracking (no return data needed)
 */
export function useTrackEvent(): (
  metricType: MetricType | string,
  metadata?: Record<string, any>
) => void {
  const { trackEvent } = useColiseum()
  return trackEvent
}

