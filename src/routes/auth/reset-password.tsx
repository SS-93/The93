import React from 'react'
import { SmartRouteGuard } from '../../components/SmartRouteGuard'
import ResetPasswordForm from '../../components/auth/ResetPasswordForm'

const ResetPasswordRoute: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
      <ResetPasswordForm />
    </SmartRouteGuard>
  )
}

export default ResetPasswordRoute 