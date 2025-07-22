import React, { useState } from 'react'
import SignUpForm from './SignUpForm'
import SignInForm from './SignInForm'
import MediaIDModal from './MediaIDModal'

const DeveloperLogin: React.FC = () => {
  const [showSignUp, setShowSignUp] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMediaIDSetup, setShowMediaIDSetup] = useState(false)

  const handleSignUpSuccess = (user: any) => {
    setUser(user)
    setShowMediaIDSetup(true)
  }

  const handleMediaIDComplete = (mediaIdData: any) => {
    setShowMediaIDSetup(false)
    // Route to developer dashboard
    window.location.href = '/dashboard/developer'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* MediaID Branding Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MediaID</h1>
                <p className="text-sm text-gray-400">Developer Portal</p>
              </div>
            </div>
            <a href="/" className="text-gray-400 hover:text-white transition-colors">
              ← Back to Bucket
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-8 pt-32">
        <div className="max-w-md w-full">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
                <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 12a1 1 0 100-2h-3a1 1 0 100 2h3zM12 13a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM16 16a1 1 0 100-2h-3a1 1 0 100 2h3zM12 17a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              MediaID Developer Portal
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Build privacy-first experiences with MediaID APIs
            </p>
            
            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass border border-purple-200/20 p-4 rounded-xl">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white">OAuth2 API</h4>
                <p className="text-xs text-gray-400">Secure integrations</p>
              </div>
              <div className="glass border border-purple-200/20 p-4 rounded-xl">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white">Privacy First</h4>
                <p className="text-xs text-gray-400">User-controlled data</p>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          {!showSignUp ? (
            <div className="glass border border-purple-200/20 p-8 rounded-2xl">
              <SignInForm 
                onSuccess={(user) => {
                  // For developers, redirect directly to dashboard
                  window.location.href = '/dashboard/developer'
                }}
                onBack={() => window.location.href = '/'}
              />
              <div className="mt-6 pt-6 border-t border-gray-600">
                <p className="text-center text-gray-400 text-sm">
                  New to MediaID?{' '}
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Create Developer Account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="glass border border-purple-200/20 p-8 rounded-2xl">
              <SignUpForm 
                onSuccess={handleSignUpSuccess}
                onBack={() => setShowSignUp(false)}
                defaultRole="developer"
              />
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to MediaID's{' '}
              <a href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>

      {/* MediaID Setup Modal */}
      {showMediaIDSetup && user && (
        <MediaIDModal
          user={user}
          onComplete={handleMediaIDComplete}
          onClose={() => setShowMediaIDSetup(false)}
        />
      )}
    </div>
  )
}

export default DeveloperLogin 