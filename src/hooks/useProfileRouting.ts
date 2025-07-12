import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabaseClient'

interface ProfileState {
  hasCompletedOnboarding: boolean
  selectedRole: 'fan' | 'artist' | 'brand' | null
  hasMediaID: boolean
  loading: boolean
}

export const useProfileRouting = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profileState, setProfileState] = useState<ProfileState>({
    hasCompletedOnboarding: false,
    selectedRole: null,
    hasMediaID: false,
    loading: true
  })

  useEffect(() => {
    if (!user || authLoading) return

    const checkProfileState = async () => {
      try {
        // Check profile completion
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile check error:', profileError)
          setProfileState(prev => ({ ...prev, loading: false }))
          return
        }

        // Check MediaID setup
        const { data: mediaId, error: mediaIdError } = await supabase
          .from('media_ids')
          .select('id, interests')
          .eq('user_uuid', user.id)
          .single()

        if (mediaIdError && mediaIdError.code !== 'PGRST116') {
          console.error('MediaID check error:', mediaIdError)
        }

        setProfileState({
          hasCompletedOnboarding: profile?.onboarding_completed || false,
          selectedRole: profile?.role || null,
          hasMediaID: !!mediaId,
          loading: false
        })
      } catch (error) {
        console.error('Profile routing error:', error)
        setProfileState(prev => ({ ...prev, loading: false }))
      }
    }

    checkProfileState()
  }, [user, authLoading])

  const routeUser = () => {
    if (profileState.loading || authLoading) return

    if (!user) {
      navigate('/welcome')
      return
    }

    // If user hasn't completed onboarding, send to onboarding flow
    if (!profileState.hasCompletedOnboarding || !profileState.hasMediaID) {
      navigate('/onboarding')
      return
    }

    // If user has completed onboarding, route to their selected dashboard
    if (profileState.selectedRole) {
      navigate(`/dashboard/${profileState.selectedRole}`)
      return
    }

    // Fallback to onboarding if no role selected
    navigate('/onboarding')
  }

  return {
    profileState,
    routeUser,
    loading: profileState.loading || authLoading
  }
} 