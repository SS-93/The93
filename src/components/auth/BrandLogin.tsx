import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SignUpForm from './SignUpForm'
import SignInForm from './SignInForm'
import MediaIDModal from './MediaIDModal'

const BrandLogin: React.FC = () => {
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
    // Brand always goes to brand dashboard
    window.location.href = '/dashboard/brand'
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-purple-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Brand Value Proposition */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-6xl font-black mb-6">
                  <span className="bg-gradient-to-r from-blue-400 via-white to-purple-400 bg-clip-text text-transparent">
                    Brand Portal
                  </span>
                </h1>
                <p className="text-2xl text-gray-300 mb-8">
                  Connect with engaged communities through privacy-first, MediaID-powered campaigns
                </p>
                
                <div className="space-y-6 mb-12">
                  {[
                    { icon: '🎯', title: 'Precision Targeting', desc: 'MediaID-based audience segmentation' },
                    { icon: '📊', title: 'Real-time Analytics', desc: 'Campaign performance insights' },
                    { icon: '🔒', title: 'Privacy-First', desc: 'GDPR/CCPA compliant data handling' },
                    { icon: '🤝', title: 'Artist Partnerships', desc: 'Authentic brand collaborations' }
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
                  <a href="/catalog" className="glass border border-white/20 px-6 py-3 rounded-xl font-bold hover:border-blue-400/50 transition-colors">
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
                      <h2 className="text-3xl font-bold text-white mb-2">Welcome Brand</h2>
                      <p className="text-gray-400">Join the privacy-first marketing revolution</p>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => setActiveForm('signup')}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-colors"
                      >
                        Create Brand Account
                      </button>
                      
                      <button
                        onClick={() => setActiveForm('signin')}
                        className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition-colors border border-gray-600"
                      >
                        Access Dashboard
                      </button>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-gray-500 text-sm">
                        Looking for a different experience?
                      </p>
                      <div className="flex justify-center gap-4 mt-2">
                        <a href="/welcome" className="text-blue-400 hover:underline text-sm">Fan Login</a>
                        <a href="/artist/login" className="text-blue-400 hover:underline text-sm">Artist Login</a>
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
                        defaultRole="brand"
                        onSuccess={handleSignUpSuccess}
                        onBack={() => setActiveForm(null)}
                      />
                    )}
                    
                    {activeForm === 'signin' && (
                      <SignInForm 
                        onSuccess={(user) => {
                          // Brands always go to brand dashboard
                          window.location.href = '/dashboard/brand'
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

export default BrandLogin 