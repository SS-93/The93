import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import BrandDashboardTemplateUI from '../../components/BrandDashboardTemplateUI'

const BrandDashboardRoute: React.FC = () => {
  const navigate = useNavigate()

  const handleRoleSwitch = (role: 'fan' | 'artist' | 'brand' | 'developer') => {
    navigate(`/dashboard/${role}`)
  }

  return (
    <SmartRouteGuard allowedRoles={['brand', 'admin']} requireAuth={true} requireOnboarding={true}>
      <BrandDashboardTemplateUI userRole="brand" onRoleSwitch={handleRoleSwitch} />
    </SmartRouteGuard>
  )
}

export default BrandDashboardRoute 