import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const ConciertoLanding: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-accent-yellow to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">🎤</span>
              </div>
              <div>
                <h1 className="text-2xl font-black">Concierto</h1>
                <p className="text-xs text-gray-400">Event Management & Voting</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/discover')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Discovery
              </button>

              {user ? (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Signed in as</div>
                  <div className="font-medium">{user.email}</div>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-accent-yellow text-black px-4 py-2 rounded-lg font-bold hover:bg-accent-yellow/90 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <motion.h2
            className="text-6xl font-black bg-gradient-to-r from-accent-yellow via-white to-accent-yellow bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Live Event Voting
          </motion.h2>

          <motion.p
            className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Create interactive voting events, engage fans with text-style voting,
            and build your artist community with powerful CRM tools.
          </motion.p>

          {user ? (
            <motion.button
              onClick={() => navigate('/events/create')}
              className="bg-accent-yellow text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-yellow/90 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Your First Event
            </motion.button>
          ) : (
            <motion.button
              onClick={() => navigate('/login')}
              className="bg-accent-yellow text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-yellow/90 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Text-Style Voting</h3>
            <p className="text-gray-400">
              Mobile-first voting experience that feels like sending a text message
            </p>
          </motion.div>

          <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Interactive Links & QR</h3>
            <p className="text-gray-400">
              Share events with QR codes and interactive links for viral growth
            </p>
          </motion.div>

          <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">CRM & Analytics</h3>
            <p className="text-gray-400">
              Capture fan data, send follow-ups, and share insights with artists
            </p>
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          className="bg-gradient-to-r from-gray-900/30 to-gray-800/30 border border-gray-800 rounded-2xl p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Create Event</h4>
              <p className="text-gray-400 text-sm">
                Set up your event, invite artists, and configure voting rules
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Share & Vote</h4>
              <p className="text-gray-400 text-sm">
                Share QR codes, fans vote with interactive mobile interface
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Engage & Follow-up</h4>
              <p className="text-gray-400 text-sm">
                Use CRM tools to engage fans and promote artists
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ConciertoLanding