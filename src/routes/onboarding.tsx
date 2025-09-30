import React from 'react'
import { SmartRouteGuard } from '../components/SmartRouteGuard'
import OnboardingFlow from '../components/OnboardingFlow'

const OnboardingRoute: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={true} requireOnboarding={false}>
      <OnboardingFlow onComplete={() => {
        // After onboarding completion, use auto-router
        window.location.href = '/auto-route'
      }} />
    </SmartRouteGuard>
  )
}

export default OnboardingRoute 