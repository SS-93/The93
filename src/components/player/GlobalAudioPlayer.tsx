// Global Audio Player Component
// Persistent player bar that appears at the bottom of the screen

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../context/AudioPlayerContext'
import PlayerControls from './PlayerControls'
import PlayerProgress from './PlayerProgress'
import PlayerVolume from './PlayerVolume'
import PlayerQueue from './PlayerQueue'

const GlobalAudioPlayer: React.FC = () => {
  const { state, dispatch } = useAudioPlayer()

  if (!state.currentTrack) {
    return null // Don't render if no track is loaded
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl"
      >
        {/* Progress bar at the very top */}
        <PlayerProgress />
        
        {/* Main player content */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            
            {/* Left section: Track info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Album art */}
              <motion.div
                className="w-14 h-14 bg-gray-700 rounded-lg overflow-hidden cursor-pointer group relative"
                onClick={() => dispatch({ type: 'TOGGLE_EXPANDED' })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {state.currentTrack.albumArt ? (
                  <img
                    src={state.currentTrack.albumArt}
                    alt={state.currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-2xl">🎵</span>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">
                    {state.isExpanded ? '🔽' : '🔼'}
                  </span>
                </div>
              </motion.div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {state.currentTrack.title}
                    </h3>
                    <p className="text-gray-400 text-xs truncate">
                      {state.currentTrack.artist}
                    </p>
                  </div>
                  
                  {/* Social actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_LIKE' })}
                      className={`p-1 rounded-full transition-colors ${
                        state.isLiked 
                          ? 'text-red-500 hover:text-red-400' 
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                      title={state.isLiked ? 'Unlike' : 'Like'}
                    >
                      <span className="text-lg">
                        {state.isLiked ? '❤️' : '🤍'}
                      </span>
                    </button>
                    
                    <button
                      className="text-gray-400 hover:text-white transition-colors p-1"
                      title="Share"
                    >
                      <span className="text-sm">📤</span>
                    </button>
                  </div>
                </div>

                {/* Mood tags if available */}
                {state.currentTrack.moodTags && state.currentTrack.moodTags.tags.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    {state.currentTrack.moodTags.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-accent-yellow/20 text-accent-yellow text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {state.currentTrack.moodTags.tags.length > 2 && (
                      <span className="text-gray-500 text-xs">
                        +{state.currentTrack.moodTags.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Center section: Player controls */}
            <div className="flex-shrink-0 mx-8">
              <PlayerControls />
            </div>

            {/* Right section: Volume and queue */}
            <div className="flex items-center space-x-4 flex-1 justify-end min-w-0">
              {/* Audio features display */}
              {state.currentTrack.audioFeatures && (
                <div className="hidden md:flex items-center space-x-3 text-xs text-gray-400">
                  {state.currentTrack.audioFeatures.bpm && (
                    <span className="flex items-center space-x-1">
                      <span>♪</span>
                      <span>{Math.round(state.currentTrack.audioFeatures.bpm)} BPM</span>
                    </span>
                  )}
                  {state.currentTrack.audioFeatures.key && (
                    <span className="flex items-center space-x-1">
                      <span>♫</span>
                      <span>{state.currentTrack.audioFeatures.key} {state.currentTrack.audioFeatures.mode}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Queue button */}
              <PlayerQueue />
              
              {/* Volume control */}
              <div className="hidden sm:block">
                <PlayerVolume />
              </div>

              {/* Expand button */}
              <button
                onClick={() => dispatch({ type: 'TOGGLE_EXPANDED' })}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
                title={state.isExpanded ? 'Minimize player' : 'Expand player'}
              >
                <span className="text-lg">
                  {state.isExpanded ? '🔽' : '🔼'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {state.isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-700 overflow-hidden">
            <motion.div
              className="h-full bg-accent-yellow"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default GlobalAudioPlayer
