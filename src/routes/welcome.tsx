import React from 'react'
import { SmartRouteGuard } from '../components/SmartRouteGuard'
import WelcomePage from '../components/auth/WelcomePage'

const Welcome: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
      <WelcomePage />
    </SmartRouteGuard>
  )
}

export default Welcome 