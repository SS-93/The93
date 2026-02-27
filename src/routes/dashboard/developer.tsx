import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import DeveloperDashboard from '../../components/DeveloperDashboard'

const DeveloperDashboardRoute: React.FC = () => {
  const navigate = useNavigate()

  const handleRoleSwitch = (role: 'fan' | 'artist' | 'brand' | 'developer') => {
    navigate(`/dashboard/${role}`)
  }

  return (
    <SmartRouteGuard allowedRoles={['developer', 'admin']} requireAuth={true} requireOnboarding={true}>
      <DeveloperDashboard userRole="developer" onRoleSwitch={handleRoleSwitch} />
    </SmartRouteGuard>
  )
}

export default DeveloperDashboardRoute 