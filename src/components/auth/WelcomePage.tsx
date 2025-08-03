import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SignUpForm from './SignUpForm'
import SignInForm from './SignInForm'
import MediaIDModal from './MediaIDModal'

const WelcomePage: React.FC = () => {
  const [activeForm, setActiveForm] = useState<'signup' | 'signin' | null>(null)
  const [showMediaIDModal, setShowMediaIDModal] = useState(false)
  const [newUser, setNewUser] = useState<any>(null)

  const handleSignUpSuccess = (user: any) => {
    setNewUser(user)
    setActiveForm(null)
    setShowMediaIDModal(true)
  }

  const handleMediaIDComplete = (mediaIdData: any) => {
    console.log('MediaID setup complete:', mediaIdData)
    setShowMediaIDModal(false)
    // Redirect to appropriate dashboard based on user role
    const userRole = newUser?.user_metadata?.role || 'fan'
    window.location.href = `/dashboard/${userRole}`
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          {!activeForm ? (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl"
            >
              {/* Logo & Title */}
              <div className="mb-12">
                <h1 className="text-7xl font-black mb-4">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                    Bucket
                  </span>
                  <span className="text-white mx-4">&</span>
                  <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                    MediaID
                  </span>
                </h1>
                <p className="text-2xl text-gray-300 mb-8">
                  Where artists monetize creativity through authentic fan connections
                </p>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  Join the platform where daily drops, subscription tiers, and privacy-first brand collaborations 
                  create sustainable revenue for independent artists.
                </p>
              </div>

              {/* Value Props */}
              <div className="grid grid-cols-3 gap-8 mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50"
                >
                  <div className="text-4xl mb-4">🎵</div>
                  <h3 className="text-xl font-bold text-white mb-2">Daily Artist Drops</h3>
                  <p className="text-gray-400">Exclusive content unlocked each day for subscribers</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50"
                >
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold text-white mb-2">Privacy-First</h3>
                  <p className="text-gray-400">MediaID gives you full control over your data</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50"
                >
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-bold text-white mb-2">Cultural Collabs</h3>
                  <p className="text-gray-400">Authentic brand partnerships, not advertisements</p>
                </motion.div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveForm('signup')}
                    className="w-full bg-accent-yellow text-black font-bold py-4 rounded-xl hover:bg-accent-yellow/90 transition-colors"
                  >
                    Create Fan Account
                  </button>
                  
                  <button
                    onClick={() => setActiveForm('signin')}
                    className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition-colors border border-gray-600"
                  >
                    Sign In to Dashboard
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm mb-3">
                    Looking for a different experience?
                  </p>
                  <div className="flex justify-center gap-4">
                    <a href="/artist/login" className="text-green-400 hover:underline text-sm font-medium">
                      🎤 Artist Portal
                    </a>
                    <a href="/brand/login" className="text-blue-400 hover:underline text-sm font-medium">
                      🏢 Brand Portal
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              {activeForm === 'signup' && (
                <SignUpForm 
                  onSuccess={handleSignUpSuccess}
                  onBack={() => setActiveForm(null)}
                />
              )}
              
              {activeForm === 'signin' && (
                <SignInForm 
                  onSuccess={(user) => {
                    const userRole = user?.user_metadata?.role || 'fan'
                    window.location.href = `/dashboard/${userRole}`
                  }}
                  onBack={() => setActiveForm(null)}
                />
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* MediaID Modal */}
      {showMediaIDModal && (
        <MediaIDModal
          user={newUser}
          role={newUser?.user_metadata?.role || 'fan'}
          onComplete={handleMediaIDComplete}
          onClose={() => setShowMediaIDModal(false)}
        />
      )}
    </>
  )
}

export default WelcomePage 