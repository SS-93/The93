import React from 'react'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import BrandLogin from '../../components/auth/BrandLogin'

const BrandLoginRoute: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
      <BrandLogin />
    </SmartRouteGuard>
  )
}

export default BrandLoginRoute 