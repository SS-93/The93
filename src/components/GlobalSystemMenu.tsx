// Global System Menu - Glassmorphism slide-out panel
// Apple-inspired design with backdrop blur and minimal icons

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAudioPlayer } from '../context/AudioPlayerContext'
import { useAuth } from '../hooks/useAuth'

interface GlobalSystemMenuProps {
  isOpen: boolean
  onClose: () => void
}

const GlobalSystemMenu: React.FC<GlobalSystemMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { state, togglePlay, setVolume, dispatch } = useAudioPlayer()
  const { user } = useAuth()
  const [showQueue, setShowQueue] = useState(false)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  // Menu sections
  const quickActions = [
    { label: 'Discover', icon: '🔍', path: '/discover', color: 'from-purple-500 to-blue-500' },
    { label: 'Events', icon: '🎪', path: '/events', color: 'from-orange-500 to-red-500' },
    { label: 'Library', icon: '📚', path: '/library', color: 'from-green-500 to-teal-500' },
    { label: 'Settings', icon: '⚙️', path: '/settings', color: 'from-gray-500 to-gray-700' }
  ]

  const eventActions = [
    { label: 'Browse Events', icon: '🎭', path: '/events' },
    { label: 'Host Dashboard', icon: '👑', path: '/host/dashboard', requiresAuth: true },
    { label: 'Create Event', icon: '✨', path: '/events/create', requiresAuth: true },
    { label: 'Voting Live', icon: '🗳️', path: '/events/live' }
  ]

  const musicActions = [
    { label: 'Lyrics', icon: '📝', action: () => console.log('Show lyrics') },
    { label: 'Queue', icon: '📋', action: () => setShowQueue(!showQueue) },
    { label: 'Vertical Player', icon: '📱', action: () => console.log('Open vertical player') },
    { label: 'Share', icon: '🔗', action: () => console.log('Share track') }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-gray-900/95 backdrop-blur-2xl border-l border-white/10 z-[100] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Now Playing Section */}
              {state.currentTrack && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-6 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Now Playing</h3>
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_LIKE' })}
                      className={`text-xl transition-colors ${state.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                    >
                      {state.isLiked ? '♥' : '♡'}
                    </button>
                  </div>

                  {/* Album Art & Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                      {state.currentTrack.albumArt ? (
                        <img
                          src={state.currentTrack.albumArt}
                          alt={state.currentTrack.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🎵</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{state.currentTrack.title}</h4>
                      <p className="text-gray-400 text-sm truncate">{state.currentTrack.artist}</p>
                      <p className="text-gray-500 text-xs mt-1">{formatTime(state.currentTime)} / {formatTime(state.duration)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent-yellow to-orange-400"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-center space-x-6">
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_SHUFFLE' })}
                      className={`transition-colors ${state.shuffleMode ? 'text-accent-yellow' : 'text-gray-400 hover:text-white'}`}
                      title="Shuffle"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 5h3l1 1 3-3 2 2-3 3 1 1h3v3l-3-3-4 4-3-3 4-4z"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => console.log('Previous')}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Previous"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3v14l-7-7 7-7zm1 0l7 7-7 7V3z"/>
                      </svg>
                    </button>

                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg"
                      title={state.isPlaying ? 'Pause' : 'Play'}
                    >
                      {state.isPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6 4h3v12H6V4zm5 0h3v12h-3V4z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6 4l10 6-10 6V4z"/>
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => console.log('Next')}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Next"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3v14l7-7-7-7zM9 3L2 10l7 7V3z"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        const modes: ('none' | 'track' | 'queue')[] = ['none', 'track', 'queue']
                        const currentIndex = modes.indexOf(state.repeatMode)
                        const nextMode = modes[(currentIndex + 1) % modes.length]
                        dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode })
                      }}
                      className={`transition-colors ${state.repeatMode !== 'none' ? 'text-accent-yellow' : 'text-gray-400 hover:text-white'}`}
                      title={`Repeat: ${state.repeatMode}`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 5h12l-3-3m3 3l-3 3m3 3v3H4l3 3m-3-3l3-3"/>
                      </svg>
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {state.isMuted || state.volume === 0 ? '🔇' : state.volume < 0.5 ? '🔉' : '🔊'}
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={state.isMuted ? 0 : state.volume * 100}
                        onChange={(e) => setVolume(Number(e.target.value) / 100)}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{Math.round((state.isMuted ? 0 : state.volume) * 100)}%</span>
                  </div>

                  {/* Music Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    {musicActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={action.action}
                        className="flex flex-col items-center space-y-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-xl">{action.icon}</span>
                        <span className="text-xs text-gray-400">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Quick Access</h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        navigate(action.path)
                        onClose()
                      }}
                      className="glass p-4 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                        {action.icon}
                      </div>
                      <p className="text-sm font-medium text-white">{action.label}</p>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Events Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Events & Voting</h3>
                <div className="glass rounded-xl overflow-hidden">
                  {eventActions.map((action, index) => {
                    if (action.requiresAuth && !user) return null

                    return (
                      <button
                        key={action.label}
                        onClick={() => {
                          navigate(action.path)
                          onClose()
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors ${
                          index !== eventActions.length - 1 ? 'border-b border-white/10' : ''
                        }`}
                      >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-sm font-medium text-white">{action.label}</span>
                        <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </motion.div>

              {/* User Profile Section */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass p-4 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      <p className="text-xs text-gray-400">View Profile</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/settings')
                        onClose()
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default GlobalSystemMenu