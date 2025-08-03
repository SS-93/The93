import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import FanDashboard from '../../components/FanDashboard'

const FanDashboardRoute: React.FC = () => {
  const navigate = useNavigate()

  const handleRoleSwitch = (role: 'fan' | 'artist' | 'brand' | 'developer') => {
    navigate(`/dashboard/${role}`)
  }

  return (
    <SmartRouteGuard allowedRoles={['fan', 'admin']} requireAuth={true} requireOnboarding={true}>
      <FanDashboard userRole="fan" onRoleSwitch={handleRoleSwitch} />
    </SmartRouteGuard>
  )
}

export default FanDashboardRoute 