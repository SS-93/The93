import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingState from './LoadingState'

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles: ('fan' | 'artist' | 'brand' | 'admin')[]
  requireAuth?: boolean
  fallbackPath?: string
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  allowedRoles, 
  requireAuth = true,
  fallbackPath = '/welcome'
}) => {
  const { user, session, loading } = useAuth()
  const location = useLocation()
  
  // Show loading while checking auth
  if (loading) {
    return <LoadingState message="Authenticating..." />
  }
  
  // Redirect to login if auth required but no session
  if (requireAuth && !session) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }
  
  // If auth is required and we have a user, check role permissions
  if (requireAuth && user) {
    const userRole = user.user_metadata?.role || 'fan'
    
    // Check if user's role is allowed for this route
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />
    }
    
    // Check if user has completed onboarding
    const needsOnboarding = !user.user_metadata?.onboarding_completed
    if (needsOnboarding && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />
    }
  }
  
  // All checks passed, render children
  return <>{children}</>
}
