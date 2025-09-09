import React from 'react'
import { SmartRouteGuard } from '../components/SmartRouteGuard'
import UserCatalog from '../components/UserCatalog'

const CatalogRoute: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
      <UserCatalog />
    </SmartRouteGuard>
  )
}

export default CatalogRoute 