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
    // Redirect to main app
    window.location.href = '/fans/dashboard'
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveForm('signup')}
                  className="w-full max-w-md px-12 py-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all"
                >
                  Get Started Free
                </motion.button>
                
                <div className="flex items-center space-x-4 max-w-md mx-auto">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-gray-400 text-sm">Already have an account?</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveForm('signin')}
                  className="w-full max-w-md px-12 py-6 bg-gray-800/50 border-2 border-gray-600 text-white text-xl font-bold rounded-2xl hover:border-gray-500 transition-all"
                >
                  Sign In
                </motion.button>
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
                  onSuccess={(user) => window.location.href = '/fans/dashboard'}
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
          onComplete={handleMediaIDComplete}
          onClose={() => setShowMediaIDModal(false)}
        />
      )}
    </>
  )
}

export default WelcomePage 