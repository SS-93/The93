import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabaseClient'
import { 
  getAllMediaIDProfiles, 
  getUserAvailableRoles, 
  switchMediaIDRole, 
  checkRoleSetupRequired 
} from '../lib/mediaId'

interface ProfileState {
  hasCompletedOnboarding: boolean
  selectedRole: 'fan' | 'artist' | 'brand' | 'developer' | null
  hasMediaID: boolean
  hasRoleSpecificMediaID: boolean
  availableRoles: ('fan' | 'artist' | 'brand' | 'developer' | 'admin')[]
  loading: boolean
  databaseAvailable: boolean
  needsProfileCreation: boolean
  roleSetupStatuses: Record<string, boolean> // Track which roles need setup
}

export const useProfileRouting = (currentRole?: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profileState, setProfileState] = useState<ProfileState>({
    hasCompletedOnboarding: false,
    selectedRole: null,
    hasMediaID: false,
    hasRoleSpecificMediaID: false,
    availableRoles: [],
    loading: true,
    databaseAvailable: true,
    needsProfileCreation: false,
    roleSetupStatuses: {}
  })

  const checkProfileState = useCallback(async () => {
    if (!user) return

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
        
        const fallbackRole = currentRole || user.user_metadata?.role || 'fan'
        setProfileState({
          hasCompletedOnboarding: false,
          selectedRole: fallbackRole,
          hasMediaID: false,
          hasRoleSpecificMediaID: false,
          availableRoles: [fallbackRole],
          loading: false,
          databaseAvailable: false,
          needsProfileCreation: false,
          roleSetupStatuses: { [fallbackRole]: true }
        })
        return
      }

      // Handle user not having a profile record (PGRST116 - no rows found)
      if (profileError && profileError.code === 'PGRST116') {
        console.log('User profile not found. Will create during onboarding.')
        
        const fallbackRole = currentRole || user.user_metadata?.role || 'fan'
        setProfileState({
          hasCompletedOnboarding: false,
          selectedRole: fallbackRole,
          hasMediaID: false,
          hasRoleSpecificMediaID: false,
          availableRoles: [fallbackRole],
          loading: false,
          databaseAvailable: true, // Database exists, user just needs profile
          needsProfileCreation: true,
          roleSetupStatuses: { [fallbackRole]: true }
        })
        return
      }

      // Handle other profile errors
      if (profileError) {
        console.error('Profile check error:', profileError)
        const fallbackRole = currentRole || user.user_metadata?.role || 'fan'
        setProfileState({
          hasCompletedOnboarding: false,
          selectedRole: fallbackRole,
          hasMediaID: false,
          hasRoleSpecificMediaID: false,
          availableRoles: [fallbackRole],
          loading: false,
          databaseAvailable: false,
          needsProfileCreation: false,
          roleSetupStatuses: { [fallbackRole]: true }
        })
        return
      }

      // Profile found! Now get all available roles and their setup status
      const availableRoles = await getUserAvailableRoles()
      const targetRole = currentRole || profile?.role || 'fan'
      const hasRoleSpecificMediaID = availableRoles.includes(targetRole)
      const hasAnyMediaID = availableRoles.length > 0

      // Check setup status for all roles
      const allRoles: ('fan' | 'artist' | 'brand' | 'developer' | 'admin')[] = ['fan', 'artist', 'brand', 'developer', 'admin']
      const roleSetupStatuses: Record<string, boolean> = {}
      
      for (const role of allRoles) {
        roleSetupStatuses[role] = await checkRoleSetupRequired(role)
      }

      setProfileState({
        hasCompletedOnboarding: profile?.onboarding_completed || false,
        selectedRole: profile?.role || null,
        hasMediaID: hasAnyMediaID,
        hasRoleSpecificMediaID: hasRoleSpecificMediaID,
        availableRoles: availableRoles,
        loading: false,
        databaseAvailable: true,
        needsProfileCreation: false,
        roleSetupStatuses
      })
    } catch (error) {
      console.error('Profile routing error:', error)
      
      const fallbackRole = currentRole || user?.user_metadata?.role || 'fan'
      setProfileState({
        hasCompletedOnboarding: false,
        selectedRole: fallbackRole,
        hasMediaID: false,
        hasRoleSpecificMediaID: false,
        availableRoles: [fallbackRole],
        loading: false,
        databaseAvailable: false,
        needsProfileCreation: false,
        roleSetupStatuses: { [fallbackRole]: true }
      })
    }
  }, [user, currentRole])

  useEffect(() => {
    if (!user || authLoading) return
    checkProfileState()
  }, [user, authLoading, checkProfileState])

  const routeUser = () => {
    if (profileState.loading || authLoading) return

    if (!user) {
      navigate('/welcome')
      return
    }

    // If database isn't available, route directly to appropriate dashboard
    if (!profileState.databaseAvailable) {
      const role = currentRole || profileState.selectedRole || 'fan'
      console.log(`Database not ready, routing to ${role} dashboard`)
      navigate(`/dashboard/${role}`)
      return
    }

    // If user needs profile creation
    if (profileState.needsProfileCreation) {
      navigate('/onboarding')
      return
    }

    // Determine if user needs MediaID setup for the current role
    const targetRole = currentRole || profileState.selectedRole || 'fan'
    const needsRoleSpecificMediaID = profileState.roleSetupStatuses[targetRole] || false
    
    // If user hasn't completed basic onboarding or needs role-specific MediaID
    if (!profileState.hasCompletedOnboarding || needsRoleSpecificMediaID) {
      navigate('/onboarding')
      return
    }

    // If user has completed onboarding and has MediaID for current role, route to dashboard
    if (profileState.selectedRole) {
      navigate(`/dashboard/${profileState.selectedRole}`)
      return
    }

    // Fallback to onboarding if no role selected
    navigate('/onboarding')
  }

  // Enhanced helper function to check if user can switch to a specific role
  const canSwitchToRole = (role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
    return profileState.availableRoles.includes(role)
  }

  // Helper function to check if user needs MediaID setup for a specific role
  const needsMediaIDForRole = (role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
    return profileState.roleSetupStatuses[role] || false
  }

  // New function to switch user's active role
  const switchToRole = async (newRole: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
    try {
      if (!canSwitchToRole(newRole)) {
        throw new Error(`MediaID not set up for ${newRole} role. Please complete setup first.`)
      }

      await switchMediaIDRole(newRole)
      
      // Refresh profile state
      await checkProfileState()
      
      // Navigate to new role dashboard
      navigate(`/dashboard/${newRole}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error switching role:', error)
      throw error
    }
  }

  // Function to refresh profile state (useful after MediaID setup)
  const refreshProfileState = useCallback(async () => {
    await checkProfileState()
  }, [checkProfileState])

  // Function to get role display information
  const getRoleInfo = (role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
    const roleInfo = {
      fan: { name: 'Fan', icon: '🎧', color: 'yellow' },
      artist: { name: 'Artist', icon: '🎤', color: 'green' },
      brand: { name: 'Brand', icon: '🏢', color: 'blue' },
      developer: { name: 'Developer', icon: '⚡', color: 'purple' },
      admin: { name: 'Admin', icon: '⚙️', color: 'red' }
    }
    
    return {
      ...roleInfo[role],
      isAvailable: canSwitchToRole(role),
      needsSetup: needsMediaIDForRole(role),
      isCurrent: profileState.selectedRole === role
    }
  }

  return {
    profileState,
    routeUser,
    canSwitchToRole,
    needsMediaIDForRole,
    switchToRole,
    refreshProfileState,
    getRoleInfo,
    loading: profileState.loading || authLoading
  }
} 