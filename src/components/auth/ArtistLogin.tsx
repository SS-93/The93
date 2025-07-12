import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SignUpForm from './SignUpForm'
import SignInForm from './SignInForm'
import MediaIDModal from './MediaIDModal'

const ArtistLogin: React.FC = () => {
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
    // Artist always goes to artist dashboard
    window.location.href = '/dashboard/artist'
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Artist Value Proposition */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-6xl font-black mb-6">
                  <span className="bg-gradient-to-r from-accent-yellow via-white to-accent-yellow bg-clip-text text-transparent">
                    Artist Portal
                  </span>
                </h1>
                <p className="text-2xl text-gray-300 mb-8">
                  Monetize your creativity with daily drops, subscriber tiers, and privacy-first brand collaborations
                </p>
                
                <div className="space-y-6 mb-12">
                  {[
                    { icon: '🎵', title: 'Upload & Schedule', desc: 'Release content on your terms' },
                    { icon: '💰', title: 'Revenue Analytics', desc: 'Track earnings in real-time' },
                    { icon: '🎯', title: 'Fan Engagement', desc: 'Build loyal subscriber base' },
                    { icon: '🤝', title: 'Brand Partnerships', desc: 'MediaID-powered collaborations' }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="text-3xl">{feature.icon}</div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                        <p className="text-gray-400">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <a href="/catalog" className="glass border border-white/20 px-6 py-3 rounded-xl font-bold hover:border-accent-yellow/50 transition-colors">
                    Browse Artists
                  </a>
                  <a href="/" className="text-gray-400 hover:text-white transition-colors px-6 py-3">
                    ← Back to Home
                  </a>
                </div>
              </motion.div>

              {/* Right Side - Auth Forms */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center"
              >
                {!activeForm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-3xl p-8 w-full max-w-md border border-gray-700/50"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Welcome Artist</h2>
                      <p className="text-gray-400">Join the underground's premier monetization platform</p>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => setActiveForm('signup')}
                        className="w-full bg-accent-yellow text-black font-bold py-4 rounded-xl hover:bg-accent-yellow/90 transition-colors"
                      >
                        Create Artist Account
                      </button>
                      
                      <button
                        onClick={() => setActiveForm('signin')}
                        className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition-colors border border-gray-600"
                      >
                        Sign In to Dashboard
                      </button>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-gray-500 text-sm">
                        Looking for a different experience?
                      </p>
                      <div className="flex justify-center gap-4 mt-2">
                        <a href="/welcome" className="text-accent-yellow hover:underline text-sm">Fan Login</a>
                        <a href="/brand/login" className="text-accent-yellow hover:underline text-sm">Brand Login</a>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeForm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                  >
                    {activeForm === 'signup' && (
                      <SignUpForm 
                        defaultRole="artist"
                        onSuccess={handleSignUpSuccess}
                        onBack={() => setActiveForm(null)}
                      />
                    )}
                    
                    {activeForm === 'signin' && (
                      <SignInForm 
                        onSuccess={(user) => {
                          // Artists always go to artist dashboard
                          window.location.href = '/dashboard/artist'
                        }}
                        onBack={() => setActiveForm(null)}
                      />
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
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
      </div>
    </>
  )
}

export default ArtistLogin 