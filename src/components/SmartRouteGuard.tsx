import React from 'react'
import { Navigate } from 'react-router-dom'
import { useProfileRouting } from '../hooks/useProfileRouting'
import { useAuth } from '../hooks/useAuth'
import LoadingState from './LoadingState'

interface SmartRouteGuardProps {
  children: React.ReactNode
  allowedRoles?: ('fan' | 'artist' | 'brand' | 'developer' | 'admin')[]
  requireAuth?: boolean
  requireOnboarding?: boolean
}

export const SmartRouteGuard: React.FC<SmartRouteGuardProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  requireOnboarding = true
}) => {
  const { user, loading: authLoading } = useAuth()

  // Always call useProfileRouting (React hooks must be called unconditionally)
  const { profileState, loading: profileLoading } = useProfileRouting()

  console.log('🛡️ [SmartRouteGuard] Checking access...')
  console.log('🛡️ [SmartRouteGuard] allowedRoles:', allowedRoles)
  console.log('🛡️ [SmartRouteGuard] requireAuth:', requireAuth)
  console.log('🛡️ [SmartRouteGuard] requireOnboarding:', requireOnboarding)
  console.log('🛡️ [SmartRouteGuard] user:', user?.id)
  console.log('🛡️ [SmartRouteGuard] profileState:', profileState)

  // For public routes (requireAuth=false), only show auth loading and ignore profile routing
  if (!requireAuth) {
    console.log('🛡️ [SmartRouteGuard] Public route, allowing access')
    if (authLoading) {
      return <LoadingState message="Loading..." />
    }
    return <>{children}</>
  }

  // For protected routes, show loading while checking auth and profile state
  if (authLoading || profileLoading) {
    console.log('🛡️ [SmartRouteGuard] Still loading...')
    return <LoadingState message="Loading your profile..." />
  }

  // If auth required but no user, redirect to welcome
  if (requireAuth && !user) {
    console.log('🛡️ [SmartRouteGuard] No user, redirecting to /welcome')
    return <Navigate to="/welcome" replace />
  }

  // Admin bypass: Admins don't need onboarding/MediaID
  const isAdmin = profileState.selectedRole === 'admin'

  // If user exists but hasn't completed onboarding, redirect to onboarding
  // Exception: Admins bypass this check
  if (user && requireOnboarding && !isAdmin && (!profileState.hasCompletedOnboarding || !profileState.hasMediaID)) {
    console.log('🛡️ [SmartRouteGuard] Onboarding incomplete, redirecting to /onboarding')
    console.log('🛡️ [SmartRouteGuard] - hasCompletedOnboarding:', profileState.hasCompletedOnboarding)
    console.log('🛡️ [SmartRouteGuard] - hasMediaID:', profileState.hasMediaID)
    return <Navigate to="/onboarding" replace />
  }

  // If role restrictions apply, check user's role
  if (allowedRoles && profileState.selectedRole) {
    if (!allowedRoles.includes(profileState.selectedRole)) {
      console.log('🛡️ [SmartRouteGuard] Access denied - role not allowed')
      console.log('🛡️ [SmartRouteGuard] - user role:', profileState.selectedRole)
      console.log('🛡️ [SmartRouteGuard] - allowed roles:', allowedRoles)
      return <Navigate to="/unauthorized" replace />
    }
  }

  // All checks passed, render children
  console.log('✅ [SmartRouteGuard] Access granted!')
  return <>{children}</>
} 