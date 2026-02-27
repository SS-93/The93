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
    console.log('🔄 [AutoRouter] Effect triggered')
    console.log('🔄 [AutoRouter] authLoading:', authLoading, 'profileLoading:', profileLoading)
    console.log('🔄 [AutoRouter] user:', user?.id)
    console.log('🔄 [AutoRouter] profileState:', profileState)

    if (authLoading || profileLoading) {
      console.log('⏳ [AutoRouter] Still loading, waiting...')
      return
    }

    // If no user, go to welcome
    if (!user) {
      console.log('👤 [AutoRouter] No user found, redirecting to /welcome')
      navigate('/welcome', { replace: true })
      return
    }

    // If database isn't available, route directly to dashboard
    if (!profileState.databaseAvailable) {
      const role = profileState.selectedRole || 'fan'
      console.log(`🗄️ [AutoRouter] Database not ready, routing to ${role} dashboard`)
      navigate(`/dashboard/${role}`, { replace: true })
      return
    }

    // If user hasn't completed onboarding, go to onboarding
    // Exception: admins bypass onboarding/MediaID requirements
    if (profileState.selectedRole !== 'admin' && (!profileState.hasCompletedOnboarding || !profileState.hasMediaID)) {
      console.log('📋 [AutoRouter] Onboarding incomplete, redirecting to /onboarding')
      console.log('📋 [AutoRouter] - hasCompletedOnboarding:', profileState.hasCompletedOnboarding)
      console.log('📋 [AutoRouter] - hasMediaID:', profileState.hasMediaID)
      navigate('/onboarding', { replace: true })
      return
    }

    // If user has completed onboarding, route to their dashboard
    if (profileState.selectedRole) {
      // Special case: admin role goes to DIA instead of dashboard
      if (profileState.selectedRole === 'admin') {
        console.log('👑 [AutoRouter] Admin detected, redirecting to /dia')
        navigate('/dia', { replace: true })
        return
      }
      console.log(`🎯 [AutoRouter] Routing to dashboard/${profileState.selectedRole}`)
      navigate(`/dashboard/${profileState.selectedRole}`, { replace: true })
      return
    }

    // Fallback to onboarding if no role
    console.log('❓ [AutoRouter] No role found, fallback to /onboarding')
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