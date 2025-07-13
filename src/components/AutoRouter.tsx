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

    // If database isn't available, route directly to dashboard
    if (!profileState.databaseAvailable) {
      const role = profileState.selectedRole || 'fan'
      console.log(`Database not ready, routing to ${role} dashboard`)
      navigate(`/dashboard/${role}`, { replace: true })
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

  // Show different messages based on the state
  if (authLoading) {
    return <LoadingState message="Checking authentication..." />
  }

  if (profileLoading) {
    return <LoadingState message="Loading your profile..." />
  }

  if (!profileState.databaseAvailable) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Backend Setup Required</h2>
          <p className="text-gray-400 mb-6">
            Your backend database tables need to be set up. 
            Routing to dashboard with limited functionality.
          </p>
          <div className="text-sm text-gray-500">
            Contact your backend engineer to run the database migrations.
          </div>
        </div>
      </div>
    )
  }

  return <LoadingState message="Routing to your dashboard..." />
} 