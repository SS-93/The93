/**
 * =============================================================================
 * useDNA CUSTOM HOOK
 * =============================================================================
 * 
 * Part of: Buckets V2 Trinity → MediaID System
 * V2 Living Index: #1 MediaID (Citizen ID + DNA)
 * Frontend Architecture: hooks/useDNA.tsx
 * 
 * PURPOSE:
 * React hook providing access to all DNA operations:
 * - Fetch user DNA
 * - Calculate DNA matches
 * - Simulate DNA changes (for DNASimulator component)
 * - Track engagement for DNA evolution
 * - Subscribe to real-time DNA updates
 * 
 * USE CASES:
 * - DNAProfile component: Display user's DNA
 * - DNASimulator component: Simulate DNA changes
 * - DNAMatchScore component: Calculate matches
 * - Any component tracking user engagement
 * 
 * INTEGRATION POINTS:
 * - Consumes: lib/dna/* utilities
 * - Updates: mediaid_dna table (Supabase)
 * - Tracks: Engagement via Coliseum
 * - Real-time: Supabase Realtime subscriptions
 * 
 * EXAMPLE USAGE:
 * ```tsx
 * const { dna, loading, simulateDNA, trackEngagement } = useDNA(userId)
 * 
 * // Simulate DNA changes
 * const simulation = await simulateDNA([
 *   { type: 'attend_event', entity_id: 'event123', ... }
 * ])
 * 
 * // Track engagement
 * trackEngagement('track_played', { trackId: 'track456' })
 * ```
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MediaIDDNA, DNAMatchResult, DNAMatchContext, SimulatedAction, DNASimulation } from '@/types/dna'
import { calculateDNAMatch } from '@/lib/dna/matcher'
import { simulateDNA as runSimulation } from '@/lib/dna/simulator'
import { generateMediaIDDNA } from '@/lib/dna/generator'

// =============================================================================
// HOOK INTERFACE
// =============================================================================

interface UseDNAReturn {
  // DNA data
  dna: MediaIDDNA | null
  loading: boolean
  error: Error | null
  
  // Operations
  refreshDNA: () => Promise<void>
  generateDNA: () => Promise<MediaIDDNA>
  calculateMatch: (
    entityAId: string,
    entityBId: string,
    context: DNAMatchContext
  ) => Promise<DNAMatchResult>
  simulateDNA: (actions: SimulatedAction[]) => Promise<DNASimulation>
  trackEngagement: (
    eventType: string,
    metadata: Record<string, any>
  ) => Promise<void>
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * useDNA Hook
 * 
 * Provides access to all DNA operations for a user
 * 
 * @param userId - User ID to manage DNA for (optional, uses current user if not provided)
 * @param options - Hook options
 * @returns DNA operations and state
 */
export function useDNA(
  userId?: string,
  options?: {
    autoFetch?: boolean        // Auto-fetch DNA on mount (default: true)
    realtime?: boolean         // Subscribe to real-time updates (default: false)
  }
): UseDNAReturn {
  // State
  const [dna, setDNA] = useState<MediaIDDNA | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Options with defaults
  const autoFetch = options?.autoFetch !== false
  const realtime = options?.realtime === true
  
  // =============================================================================
  // FETCH DNA
  // =============================================================================
  
  /**
   * Fetch user's DNA from database
   */
  const fetchDNA = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`[useDNA] Fetching DNA for user ${id}`)
      
      const { data, error: fetchError } = await supabase
        .from('mediaid_dna')
        .select('*')
        .eq('user_id', id)
        .order('generation', { ascending: false })
        .limit(1)
        .single()
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No DNA found - user needs to complete setup
          console.log('[useDNA] No DNA found for user')
          setDNA(null)
          setError(null)
        } else {
          throw fetchError
        }
      } else {
        console.log(`[useDNA] DNA fetched successfully (gen ${data.generation})`)
        setDNA(data as MediaIDDNA)
      }
    } catch (err) {
      console.error('[useDNA] Error fetching DNA:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])
  
  /**
   * Refresh DNA (public API)
   */
  const refreshDNA = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID required to refresh DNA')
    }
    await fetchDNA(userId)
  }, [userId, fetchDNA])
  
  // =============================================================================
  // GENERATE DNA
  // =============================================================================
  
  /**
   * Generate new DNA for user
   * Used during MediaID setup or manual regeneration
   */
  const generateDNA = useCallback(async (): Promise<MediaIDDNA> => {
    if (!userId) {
      throw new Error('User ID required to generate DNA')
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log(`[useDNA] Generating DNA for user ${userId}`)
      
      const newDNA = await generateMediaIDDNA(userId)
      setDNA(newDNA)
      
      console.log('[useDNA] DNA generation complete')
      
      return newDNA
    } catch (err) {
      console.error('[useDNA] Error generating DNA:', err)
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [userId])
  
  // =============================================================================
  // CALCULATE MATCH
  // =============================================================================
  
  /**
   * Calculate DNA match between two entities
   */
  const calculateMatch = useCallback(async (
    entityAId: string,
    entityBId: string,
    context: DNAMatchContext = 'recommendation'
  ): Promise<DNAMatchResult> => {
    try {
      console.log(`[useDNA] Calculating ${context} match: ${entityAId} vs ${entityBId}`)
      
      // Fetch both DNAs
      const [{ data: dnaA }, { data: dnaB }] = await Promise.all([
        supabase
          .from('mediaid_dna')
          .select('*')
          .eq('user_id', entityAId)
          .order('generation', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('mediaid_dna')
          .select('*')
          .eq('user_id', entityBId)
          .order('generation', { ascending: false })
          .limit(1)
          .single()
      ])
      
      if (!dnaA || !dnaB) {
        throw new Error('DNA not found for one or both entities')
      }
      
      // Calculate match
      const match = calculateDNAMatch(
        dnaA as MediaIDDNA,
        dnaB as MediaIDDNA,
        context
      )
      
      console.log(`[useDNA] Match calculated: ${(match.composite_score * 100).toFixed(1)}%`)
      
      return match
    } catch (err) {
      console.error('[useDNA] Error calculating match:', err)
      throw err
    }
  }, [])
  
  // =============================================================================
  // SIMULATE DNA
  // =============================================================================
  
  /**
   * Simulate DNA changes from hypothetical actions
   * Used by DNASimulator component
   */
  const simulateDNA = useCallback(async (
    actions: SimulatedAction[]
  ): Promise<DNASimulation> => {
    if (!userId) {
      throw new Error('User ID required to simulate DNA')
    }
    
    try {
      console.log(`[useDNA] Simulating ${actions.length} actions for user ${userId}`)
      
      const simulation = await runSimulation(userId, actions)
      
      console.log('[useDNA] Simulation complete:', {
        recommendations: simulation.outcomes.new_recommendations.length,
        offers: simulation.outcomes.brand_offers_unlocked.length,
        earnings: `$${(simulation.outcomes.estimated_earnings.total / 100).toFixed(2)}`
      })
      
      return simulation
    } catch (err) {
      console.error('[useDNA] Error simulating DNA:', err)
      throw err
    }
  }, [userId])
  
  // =============================================================================
  // TRACK ENGAGEMENT
  // =============================================================================
  
  /**
   * Track user engagement for DNA evolution
   * 
   * This logs the engagement to Coliseum, which will trigger
   * DNA evolution via background processes
   */
  const trackEngagement = useCallback(async (
    eventType: string,
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    if (!userId) {
      console.warn('[useDNA] Cannot track engagement without user ID')
      return
    }
    
    try {
      console.log(`[useDNA] Tracking engagement: ${eventType}`)
      
      // Log to Coliseum metrics
      // This will be picked up by DNA evolution pipeline
      const { error: logError } = await supabase
        .from('coliseum_metrics')
        .insert({
          user_id: userId,
          metric_type: eventType,
          metric_value: 1,
          source: 'web',
          metadata: {
            ...metadata,
            tracked_for_dna: true
          },
          timestamp: new Date().toISOString()
        })
      
      if (logError) {
        console.error('[useDNA] Error logging engagement:', logError)
      }
      
      // Also log to media_engagement_log for backward compatibility
      const { error: engagementError } = await supabase
        .from('media_engagement_log')
        .insert({
          user_id: userId,
          content_id: metadata.entity_id || 'unknown',
          event_type: eventType,
          metadata: metadata,
          timestamp: new Date().toISOString()
        })
      
      if (engagementError) {
        console.error('[useDNA] Error logging to engagement log:', engagementError)
      }
    } catch (err) {
      console.error('[useDNA] Error tracking engagement:', err)
      // Don't throw - tracking failures shouldn't break UX
    }
  }, [userId])
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  /**
   * Auto-fetch DNA on mount or userId change
   */
  useEffect(() => {
    if (userId && autoFetch) {
      fetchDNA(userId)
    }
  }, [userId, autoFetch, fetchDNA])
  
  /**
   * Subscribe to real-time DNA updates
   */
  useEffect(() => {
    if (!userId || !realtime) return
    
    console.log(`[useDNA] Subscribing to real-time updates for user ${userId}`)
    
    const subscription = supabase
      .channel(`mediaid_dna:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mediaid_dna',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useDNA] Real-time DNA update received')
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setDNA(payload.new as MediaIDDNA)
          } else if (payload.eventType === 'DELETE') {
            setDNA(null)
          }
        }
      )
      .subscribe()
    
    return () => {
      console.log('[useDNA] Unsubscribing from real-time updates')
      subscription.unsubscribe()
    }
  }, [userId, realtime])
  
  // =============================================================================
  // RETURN
  // =============================================================================
  
  return {
    dna,
    loading,
    error,
    refreshDNA,
    generateDNA,
    calculateMatch,
    simulateDNA,
    trackEngagement
  }
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook to check if user has DNA setup
 * 
 * @param userId - User ID to check
 * @returns DNA setup status
 */
export function useHasDNA(userId?: string): {
  hasDNA: boolean
  loading: boolean
} {
  const { dna, loading } = useDNA(userId)
  
  return {
    hasDNA: dna !== null,
    loading
  }
}

/**
 * Hook to get DNA confidence score
 * 
 * @param userId - User ID
 * @returns Confidence score
 */
export function useDNAConfidence(userId?: string): {
  confidence: number
  loading: boolean
} {
  const { dna, loading } = useDNA(userId)
  
  return {
    confidence: dna?.confidence_score || 0,
    loading
  }
}

