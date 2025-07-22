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

  // For public routes (requireAuth=false), only show auth loading and ignore profile routing
  if (!requireAuth) {
    if (authLoading) {
      return <LoadingState message="Loading..." />
    }
    return <>{children}</>
  }

  // For protected routes, show loading while checking auth and profile state
  if (authLoading || profileLoading) {
    return <LoadingState message="Loading your profile..." />
  }

  // If auth required but no user, redirect to welcome
  if (requireAuth && !user) {
    return <Navigate to="/welcome" replace />
  }

  // If user exists but hasn't completed onboarding, redirect to onboarding
  if (user && requireOnboarding && (!profileState.hasCompletedOnboarding || !profileState.hasMediaID)) {
    return <Navigate to="/onboarding" replace />
  }

  // If role restrictions apply, check user's role
  if (allowedRoles && profileState.selectedRole) {
    if (!allowedRoles.includes(profileState.selectedRole)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // All checks passed, render children
  return <>{children}</>
} 