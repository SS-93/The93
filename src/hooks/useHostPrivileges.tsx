import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

interface HostPrivileges {
  can_create_events: boolean
  max_concurrent_events: number
  can_use_premium_features: boolean
  tier: 'none' | 'basic' | 'premium'
  enabled_at: string | null
  enabled_by: string | null
  request_id: string | null
}

interface HostPrivilegesHook {
  hostPrivileges: HostPrivileges | null
  hasHostPrivileges: boolean
  loading: boolean
  refreshPrivileges: () => Promise<void>
  requestHostAccess: (tier: string, justification: string) => Promise<boolean>
  getCurrentEventCount: () => Promise<number>
  canCreateMoreEvents: () => Promise<boolean>
}

const defaultPrivileges: HostPrivileges = {
  can_create_events: false,
  max_concurrent_events: 0,
  can_use_premium_features: false,
  tier: 'none',
  enabled_at: null,
  enabled_by: null,
  request_id: null
}

export const useHostPrivileges = (): HostPrivilegesHook => {
  const { user } = useAuth()
  const [hostPrivileges, setHostPrivileges] = useState<HostPrivileges | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHostPrivileges = async () => {
    if (!user) {
      setHostPrivileges(defaultPrivileges)
      setLoading(false)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('host_privileges')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const privileges = profile?.host_privileges || defaultPrivileges
      setHostPrivileges(privileges)
    } catch (error) {
      console.error('Error fetching host privileges:', error)
      setHostPrivileges(defaultPrivileges)
    } finally {
      setLoading(false)
    }
  }

  const refreshPrivileges = async () => {
    setLoading(true)
    await fetchHostPrivileges()
  }

  const requestHostAccess = async (tier: string, justification: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('host_access_requests')
        .insert({
          user_id: user.id,
          requested_tier: tier,
          justification: justification.trim()
        })
        .select()
        .single()

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error requesting host access:', error)
      return false
    }
  }

  const getCurrentEventCount = async (): Promise<number> => {
    if (!user || !hostPrivileges?.can_create_events) return 0

    try {
      // This will need to be implemented when we create the events table
      // For now, return 0
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id)
        .in('status', ['draft', 'published', 'live'])

      if (error) {
        // If events table doesn't exist yet, return 0
        if (error.code === 'PGRST106') return 0
        throw error
      }

      return count || 0
    } catch (error) {
      console.error('Error getting current event count:', error)
      return 0
    }
  }

  const canCreateMoreEvents = async (): Promise<boolean> => {
    if (!hostPrivileges?.can_create_events) return false

    const currentCount = await getCurrentEventCount()
    return currentCount < hostPrivileges.max_concurrent_events
  }

  useEffect(() => {
    fetchHostPrivileges()
  }, [user])

  // Set up real-time subscription for profile changes
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const newPrivileges = payload.new?.host_privileges || defaultPrivileges
          setHostPrivileges(newPrivileges)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const hasHostPrivileges = hostPrivileges?.can_create_events || false

  return {
    hostPrivileges,
    hasHostPrivileges,
    loading,
    refreshPrivileges,
    requestHostAccess,
    getCurrentEventCount,
    canCreateMoreEvents
  }
}
