import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export interface UserMatrixRow {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
  last_sign_in_at: string
  email_confirmed_at: string | null
  has_dna: boolean
  has_mediaid: boolean
  listening_count: number
  engagement_count: number
  event_votes_count: number
}

export function useUserMatrix() {
  const [data, setData] = useState<UserMatrixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchData()
  }, [filters])

  async function fetchData() {
    setLoading(true)
    setError(null)

    try {
      console.log('📊 [useUserMatrix] Fetching profiles...')

      // Fetch profiles (has user_id, display_name, role, etc)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(100)

      if (profilesError) {
        console.error('❌ [useUserMatrix] Error fetching profiles:', profilesError)
        throw profilesError
      }

      console.log('✅ [useUserMatrix] Fetched', profiles?.length, 'profiles')
      console.log('📋 [useUserMatrix] Profile data:', profiles)

      // Fetch all MediaIDs in one query (much faster!)
      const { data: allMediaIds } = await supabase
        .from('media_ids')
        .select('user_uuid, id, profile_embedding')
        .in('user_uuid', profiles.map(p => p.id))

      // Group MediaIDs by user_uuid
      const mediaIdsByUser = (allMediaIds || []).reduce((acc, m) => {
        if (!acc[m.user_uuid]) acc[m.user_uuid] = []
        acc[m.user_uuid].push(m)
        return acc
      }, {} as Record<string, any[]>)

      console.log('✅ [useUserMatrix] Fetched MediaIDs for', Object.keys(mediaIdsByUser).length, 'users')

      // Try to fetch interaction counts (may fail if tables don't exist)
      let listeningCounts: Record<string, number> = {}
      let engagementCounts: Record<string, number> = {}
      let votesCounts: Record<string, number> = {}

      try {
        const { data: listeningData } = await supabase
          .from('listening_history')
          .select('user_id')
          .in('user_id', profiles.map(p => p.id))

        listeningCounts = (listeningData || []).reduce((acc, l) => {
          acc[l.user_id] = (acc[l.user_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        console.log('✅ [useUserMatrix] Fetched listening history counts')
      } catch (err) {
        console.warn('⚠️ [useUserMatrix] listening_history table not found, skipping')
      }

      try {
        const { data: engagementData } = await supabase
          .from('media_engagement_log')
          .select('user_id')
          .in('user_id', profiles.map(p => p.id))

        engagementCounts = (engagementData || []).reduce((acc, e) => {
          acc[e.user_id] = (acc[e.user_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        console.log('✅ [useUserMatrix] Fetched engagement log counts')
      } catch (err) {
        console.warn('⚠️ [useUserMatrix] media_engagement_log table not found, skipping')
      }

      try {
        const { data: votesData } = await supabase
          .from('event_votes')
          .select('user_uuid')
          .in('user_uuid', profiles.map(p => p.id))

        votesCounts = (votesData || []).reduce((acc, v) => {
          acc[v.user_uuid] = (acc[v.user_uuid] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        console.log('✅ [useUserMatrix] Fetched event votes counts')
      } catch (err) {
        console.warn('⚠️ [useUserMatrix] event_votes table not found, skipping')
      }

      // Map profiles to enriched data (synchronous now!)
      const enriched = profiles.map(profile => {
        const mediaids = mediaIdsByUser[profile.id] || []

        return {
          id: profile.id,
          email: profile.email || 'unknown',
          display_name: profile.display_name || null,
          role: profile.role || 'fan',
          created_at: profile.created_at || '',
          last_sign_in_at: profile.updated_at || profile.created_at || '',
          email_confirmed_at: null, // Not in profiles table
          has_mediaid: mediaids.length > 0,
          has_dna: mediaids.some(m => m.profile_embedding),
          listening_count: listeningCounts[profile.id] || 0,
          engagement_count: engagementCounts[profile.id] || 0,
          event_votes_count: votesCounts[profile.id] || 0
        }
      })

      console.log('✅ [useUserMatrix] Enriched data:', enriched)

      // Apply filters
      let filtered = enriched

      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(
          u => u.email.toLowerCase().includes(search) ||
               u.display_name?.toLowerCase().includes(search)
        )
        console.log('🔍 [useUserMatrix] After search filter:', filtered.length)
      }

      if (filters.role) {
        filtered = filtered.filter(u => u.role === filters.role)
        console.log('🔍 [useUserMatrix] After role filter:', filtered.length)
      }

      if (filters.has_dna !== undefined) {
        filtered = filtered.filter(u => u.has_dna === filters.has_dna)
        console.log('🔍 [useUserMatrix] After DNA filter:', filtered.length)
      }

      console.log('✅ [useUserMatrix] Final filtered data:', filtered)
      setData(filtered)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchData
  }
}
