import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileRouting } from '../hooks/useProfileRouting'
import { useAuth } from '../hooks/useAuth'
import LoadingState from './LoadingState'

export const AutoRouter: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const { profileState, loading: profileLoading } = useProfileRouting()
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading || profileLoading) return

    // If no user, go to welcome
    if (!user) {
      navigate('/welcome', { replace: true })
      return
    }

    // If user hasn't completed onboarding, go to onboarding
    if (!profileState.hasCompletedOnboarding || !profileState.hasMediaID) {
      navigate('/onboarding', { replace: true })
      return
    }

    // If user has completed onboarding, route to their dashboard
    if (profileState.selectedRole) {
      navigate(`/dashboard/${profileState.selectedRole}`, { replace: true })
      return
    }

    // Fallback to onboarding if no role
    navigate('/onboarding', { replace: true })
  }, [user, profileState, authLoading, profileLoading, navigate])

  return <LoadingState message="Routing to your dashboard..." />
} 