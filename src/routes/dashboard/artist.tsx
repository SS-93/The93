import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import ArtistDashboardTemplateUI from '../../components/ArtistDashboardTemplateUI'

const ArtistDashboardRoute: React.FC = () => {
  const navigate = useNavigate()

  const handleRoleSwitch = (role: 'fan' | 'artist' | 'brand' | 'developer') => {
    navigate(`/dashboard/${role}`)
  }

  return (
    <SmartRouteGuard allowedRoles={['artist', 'admin']} requireAuth={true} requireOnboarding={true}>
      <ArtistDashboardTemplateUI userRole="artist" onRoleSwitch={handleRoleSwitch} />
    </SmartRouteGuard>
  )
}

export default ArtistDashboardRoute 