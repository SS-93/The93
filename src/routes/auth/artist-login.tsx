import React from 'react'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import ArtistLogin from '../../components/auth/ArtistLogin'

const ArtistLoginRoute: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
      <ArtistLogin />
    </SmartRouteGuard>
  )
}

export default ArtistLoginRoute 