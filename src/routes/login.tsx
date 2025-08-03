import React from 'react'
import { SmartRouteGuard } from '../components/SmartRouteGuard'
import SignInForm from '../components/auth/SignInForm'

const LoginPage: React.FC = () => {
  return (
    <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-8">
        <SignInForm 
          onSuccess={(user) => {
            // Use auto-router to handle smart routing
            window.location.href = '/auto-route'
          }}
          onBack={() => window.location.href = '/welcome'}
        />
      </div>
    </SmartRouteGuard>
  )
}

export default LoginPage 