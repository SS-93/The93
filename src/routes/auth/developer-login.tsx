import React from 'react'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import DeveloperLogin from '../../components/auth/DeveloperLogin'

const DeveloperLoginRoute: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
      <DeveloperLogin />
    </SmartRouteGuard>
  )
}

export default DeveloperLoginRoute 