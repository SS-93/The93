import React from 'react'
import { Navigate } from 'react-router-dom'
import { useProfileRouting } from '../hooks/useProfileRouting'
import { useAuth } from '../hooks/useAuth'
import { useBadges } from '../hooks/useBadges'
import { BadgeType } from '../types/badge'
import LoadingState from './LoadingState'

interface SmartRouteGuardProps {
  children: React.ReactNode
  /** Legacy: role-based access control */
  allowedRoles?: ('fan' | 'artist' | 'brand' | 'developer' | 'admin')[]
  /** New: badge-based access control (takes precedence over allowedRoles) */
  requiredBadge?: BadgeType | BadgeType[]
  requireAuth?: boolean
  requireOnboarding?: boolean
}

export const SmartRouteGuard: React.FC<SmartRouteGuardProps> = ({
  children,
  allowedRoles,
  requiredBadge,
  requireAuth = true,
  requireOnboarding = true
}) => {
  const { user, loading: authLoading } = useAuth()

  // Always call all hooks unconditionally (React rules)
  const { profileState, loading: profileLoading } = useProfileRouting()
  const { activeBadge, hasBadge, loading: badgeLoading } = useBadges()

  console.log('🛡️ [SmartRouteGuard] Checking access...')
  console.log('🛡️ [SmartRouteGuard] allowedRoles:', allowedRoles)
  console.log('🛡️ [SmartRouteGuard] requiredBadge:', requiredBadge)
  console.log('🛡️ [SmartRouteGuard] activeBadge:', activeBadge)

  // For public routes (requireAuth=false), only show auth loading
  if (!requireAuth) {
    if (authLoading) {
      return <LoadingState message="Loading..." />
    }
    return <>{children}</>
  }

  // For protected routes, show loading while checking auth, profile, and badges
  if (authLoading || profileLoading || badgeLoading) {
    return <LoadingState message="Loading your profile..." />
  }

  // If auth required but no user, redirect to welcome
  if (requireAuth && !user) {
    console.log('🛡️ [SmartRouteGuard] No user, redirecting to /welcome')
    return <Navigate to="/welcome" replace />
  }

  // Admin bypass: Admins don't need onboarding/MediaID
  const isAdmin = profileState.selectedRole === 'admin' || activeBadge === 'admin'

  // Onboarding check (admins bypass)
  if (user && requireOnboarding && !isAdmin && (!profileState.hasCompletedOnboarding || !profileState.hasMediaID)) {
    console.log('🛡️ [SmartRouteGuard] Onboarding incomplete, redirecting to /onboarding')
    return <Navigate to="/onboarding" replace />
  }

  // ── Badge-based access control (new system) ──────────────────────────────
  if (requiredBadge) {
    const requiredBadges = Array.isArray(requiredBadge) ? requiredBadge : [requiredBadge]
    const hasRequiredBadge = requiredBadges.some(badge => hasBadge(badge))

    if (!hasRequiredBadge) {
      console.log('🛡️ [SmartRouteGuard] Access denied — missing required badge:', requiredBadges)
      console.log('🛡️ [SmartRouteGuard] Active badge:', activeBadge)
      return <Navigate to="/unauthorized" replace />
    }
  }

  // ── Legacy role-based access control (backward compatible) ───────────────
  // Now ALSO checks badges — if the user has ANY allowed role as a badge, grant access
  if (allowedRoles && !requiredBadge) {
    const roleMatch = profileState.selectedRole && allowedRoles.includes(profileState.selectedRole)
    const badgeMatch = allowedRoles.some(role => hasBadge(role as BadgeType))

    if (!roleMatch && !badgeMatch) {
      console.log('🛡️ [SmartRouteGuard] Access denied - no matching role or badge')
      console.log('🛡️ [SmartRouteGuard] - profileRole:', profileState.selectedRole)
      console.log('🛡️ [SmartRouteGuard] - allowedRoles:', allowedRoles)
      console.log('🛡️ [SmartRouteGuard] - activeBadge:', activeBadge)
      return <Navigate to="/unauthorized" replace />
    }
  }

  // All checks passed
  console.log('✅ [SmartRouteGuard] Access granted!')
  return <>{children}</>
}