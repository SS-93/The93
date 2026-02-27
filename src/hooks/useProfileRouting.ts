import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabaseClient'

interface ProfileState {
  hasCompletedOnboarding: boolean
  selectedRole: 'fan' | 'artist' | 'brand' | 'developer' | 'admin' | null
  hasMediaID: boolean
  loading: boolean
  databaseAvailable: boolean
  needsProfileCreation: boolean
}

export const useProfileRouting = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profileState, setProfileState] = useState<ProfileState>({
    hasCompletedOnboarding: false,
    selectedRole: null,
    hasMediaID: false,
    loading: true,
    databaseAvailable: true,
    needsProfileCreation: false
  })

  useEffect(() => {
    if (!user || authLoading) return

    const checkProfileState = async () => {
      try {
        // First, test if database tables exist by checking profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single()

        // Handle table not existing (database setup issue)
        if (profileError && (
          profileError.code === 'PGRST106' || // table not found
          profileError.message?.includes('relation "public.profiles" does not exist') ||
          profileError.message?.includes('does not exist')
        )) {
          console.warn('Database tables not set up yet. Using fallback routing.')
          
          const fallbackRole = user.user_metadata?.role || 'fan'
          setProfileState({
            hasCompletedOnboarding: false,
            selectedRole: fallbackRole,
            hasMediaID: false,
            loading: false,
            databaseAvailable: false,
            needsProfileCreation: false
          })
          return
        }

        // Handle user not having a profile record (PGRST116 - no rows found)
        if (profileError && profileError.code === 'PGRST116') {
          console.log('User profile not found. Will create during onboarding.')
          
          const fallbackRole = user.user_metadata?.role || 'fan'
          setProfileState({
            hasCompletedOnboarding: false,
            selectedRole: fallbackRole,
            hasMediaID: false,
            loading: false,
            databaseAvailable: true, // Database exists, user just needs profile
            needsProfileCreation: true
          })
          return
        }

        // Handle other profile errors
        if (profileError) {
          console.error('Profile check error:', profileError)
          const fallbackRole = user.user_metadata?.role || 'fan'
          setProfileState({
            hasCompletedOnboarding: false,
            selectedRole: fallbackRole,
            hasMediaID: false,
            loading: false,
            databaseAvailable: false,
            needsProfileCreation: false
          })
          return
        }

        // Profile found! Now check MediaID for the user's role
        const selectedRole = profile?.role || null
        let hasMediaID = false
        if (selectedRole) {
          const { data: mediaRows, error: mediaIdError } = await supabase
            .from('media_ids')
            .select('id')
            .eq('user_uuid', user.id)
            .eq('role', selectedRole)
            .limit(1)

          if (mediaIdError && mediaIdError.code !== 'PGRST116') {
            console.warn('MediaID check error:', mediaIdError)
          }
          hasMediaID = Array.isArray(mediaRows) && mediaRows.length > 0
        }

        setProfileState({
          hasCompletedOnboarding: profile?.onboarding_completed || false,
          selectedRole,
          hasMediaID,
          loading: false,
          databaseAvailable: true,
          needsProfileCreation: false
        })
      } catch (error) {
        console.error('Profile routing error:', error)
        
        const fallbackRole = user?.user_metadata?.role || 'fan'
        setProfileState({
          hasCompletedOnboarding: false,
          selectedRole: fallbackRole,
          hasMediaID: false,
          loading: false,
          databaseAvailable: false,
          needsProfileCreation: false
        })
      }
    }

    checkProfileState()
  }, [user, authLoading])

  const switchToRole = async (targetRole: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      // Update user's role in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: targetRole })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update local state
      setProfileState(prev => ({
        ...prev,
        selectedRole: targetRole
      }))

      // Navigate to the new role's dashboard
      navigate(`/dashboard/${targetRole}`)
      
    } catch (error) {
      console.error('Error switching role:', error)
      throw error
    }
  }

  const getRoleInfo = (role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
    const roleIcons: Record<string, string> = {
      fan: '🎵',
      artist: '🎤',
      brand: '🏢',
      developer: '👨‍💻',
      admin: '⚙️'
    }

    const roleNames: Record<string, string> = {
      fan: 'Fan',
      artist: 'Artist',
      brand: 'Brand',
      developer: 'Developer',
      admin: 'Admin'
    }

    // Mock role availability logic - in real app this would check user's MediaID profiles
    const isAvailable = true // For now, assume all roles are available
    const needsSetup = false // For now, assume no setup needed

    return {
      icon: roleIcons[role] || '👤',
      name: roleNames[role] || role,
      isAvailable,
      needsSetup
    }
  }

  const routeUser = () => {
    if (profileState.loading || authLoading) return

    if (!user) {
      navigate('/welcome')
      return
    }

    // If database isn't available, route directly to appropriate dashboard
    if (!profileState.databaseAvailable) {
      const role = profileState.selectedRole || 'fan'
      console.log(`Database not ready, routing to ${role} dashboard`)
      navigate(`/dashboard/${role}`)
      return
    }

    // If user needs profile creation or hasn't completed onboarding
    // Exception: admins bypass onboarding/MediaID requirements
    if (profileState.selectedRole !== 'admin' && (profileState.needsProfileCreation || !profileState.hasCompletedOnboarding || !profileState.hasMediaID)) {
      navigate('/onboarding')
      return
    }

    // If user has completed onboarding, route to their selected dashboard
    if (profileState.selectedRole) {
      // Special case: admin role goes to DIA instead of dashboard
      if (profileState.selectedRole === 'admin') {
        navigate('/dia')
        return
      }
      navigate(`/dashboard/${profileState.selectedRole}`)
      return
    }

    // Fallback to onboarding if no role selected
    navigate('/onboarding')
  }

  return {
    profileState,
    routeUser,
    switchToRole,
    getRoleInfo,
    loading: profileState.loading || authLoading
  }
} 