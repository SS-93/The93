// Enhanced Global Audio Player - Phase 1
// Spotify-inspired design with glassmorphism and dynamic theming

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../../context/AudioPlayerContext'
import PlayerBarControls from './PlayerBarControls'
import WaveformProgress from './WaveformProgress'
import DynamicPlayerTheme from './DynamicPlayerTheme'
import PlayerKeyboardShortcuts from './PlayerKeyboardShortcuts'

const EnhancedGlobalPlayer: React.FC = () => {
  const { state, dispatch } = useAudioPlayer()
  const [dominantColor, setDominantColor] = useState('#1f2937')
  const [isVisible, setIsVisible] = useState(false)

  // Show player when track is loaded
  useEffect(() => {
    setIsVisible(!!state.currentTrack)
  }, [state.currentTrack])

  if (!state.currentTrack) {
    return <PlayerKeyboardShortcuts />
  }

  return (
    <>
      <PlayerKeyboardShortcuts />
      <DynamicPlayerTheme 
        albumArt={state.currentTrack.albumArt}
        onColorExtracted={setDominantColor}
      />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ 
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* Glassmorphism background */}
            <div 
              className="relative backdrop-blur-xl border-t border-white/10 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, 
                  ${dominantColor}15 0%, 
                  ${dominantColor}25 50%, 
                  ${dominantColor}15 100%
                ), rgba(0, 0, 0, 0.8)`
              }}
            >
              {/* Waveform Progress at very top */}
              <WaveformProgress dominantColor={dominantColor} />
              
              {/* Main player content */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                  
                  {/* Left section: Track info with enhanced visuals */}
                  <div className="flex items-center space-x-5 flex-1 min-w-0 max-w-sm">
                    {/* Enhanced Album art with glow effect */}
                    <motion.div
                      className="relative group cursor-pointer"
                      onClick={() => dispatch({ type: 'TOGGLE_EXPANDED' })}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div 
                        className="w-16 h-16 rounded-xl overflow-hidden shadow-lg relative"
                        style={{
                          boxShadow: `0 8px 32px ${dominantColor}40`
                        }}
                      >
                        {state.currentTrack.albumArt ? (
                          <img
                            src={state.currentTrack.albumArt}
                            alt={state.currentTrack.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-white/70"
                            style={{ backgroundColor: dominantColor }}
                          >
                            <span className="text-3xl">🎵</span>
                          </div>
                        )}
                        
                        {/* Animated pulse for playing state */}
                        {state.isPlaying && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2 border-white/30"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {state.isExpanded ? 'Minimize' : 'Expand'}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Enhanced track info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="min-w-0 flex-1">
                          <motion.h3 
                            className="text-white font-bold text-base truncate"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={state.currentTrack.id}
                          >
                            {state.currentTrack.title}
                          </motion.h3>
                          <motion.p 
                            className="text-white/70 text-sm truncate"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            key={`${state.currentTrack.id}-artist`}
                          >
                            {state.currentTrack.artist}
                          </motion.p>
                        </div>
                        
                        {/* Enhanced social actions */}
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => dispatch({ type: 'TOGGLE_LIKE' })}
                            className={`p-2 rounded-full transition-all duration-300 ${
                              state.isLiked 
                                ? 'text-red-400 bg-red-500/20 shadow-lg' 
                                : 'text-white/50 hover:text-red-400 hover:bg-red-500/10'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title={state.isLiked ? 'Unlike' : 'Like'}
                          >
                            <span className="text-lg">
                              {state.isLiked ? '❤️' : '🤍'}
                            </span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Mood tags with enhanced styling */}
                      {state.currentTrack.moodTags && state.currentTrack.moodTags.tags.length > 0 && (
                        <motion.div 
                          className="flex items-center space-x-1 mt-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {state.currentTrack.moodTags.tags.slice(0, 2).map((tag, index) => (
                            <motion.span
                              key={index}
                              className="px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm"
                              style={{
                                backgroundColor: `${dominantColor}40`,
                                color: 'white',
                                border: `1px solid ${dominantColor}60`
                              }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              {tag}
                            </motion.span>
                          ))}
                          {state.currentTrack.moodTags.tags.length > 2 && (
                            <span className="text-white/50 text-xs ml-1">
                              +{state.currentTrack.moodTags.tags.length - 2}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Center section: Enhanced player controls */}
                  <div className="flex-shrink-0 mx-8">
                    <PlayerBarControls dominantColor={dominantColor} />
                  </div>

                  {/* Right section: Enhanced volume and utilities */}
                  <div className="flex items-center space-x-4 flex-1 justify-end min-w-0 max-w-sm">
                    {/* Audio features with enhanced display */}
                    {state.currentTrack.audioFeatures && (
                      <motion.div 
                        className="hidden lg:flex items-center space-x-4 text-sm text-white/60"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {state.currentTrack.audioFeatures.bpm && (
                          <div className="flex items-center space-x-1">
                            <span>♪</span>
                            <span className="font-mono">
                              {Math.round(state.currentTrack.audioFeatures.bpm)} BPM
                            </span>
                          </div>
                        )}
                        {state.currentTrack.audioFeatures.key && (
                          <div className="flex items-center space-x-1">
                            <span>♫</span>
                            <span className="font-mono">
                              {state.currentTrack.audioFeatures.key}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Enhanced expand button */}
                    <motion.button
                      onClick={() => dispatch({ type: 'TOGGLE_EXPANDED' })}
                      className="p-3 rounded-xl text-white/70 hover:text-white transition-all duration-300 hover:bg-white/10"
                      title={state.isExpanded ? 'Minimize player' : 'Expand player'}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="text-xl">
                        {state.isExpanded ? '🔽' : '🔼'}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Enhanced loading indicator */}
              {state.isLoading && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: dominantColor }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default EnhancedGlobalPlayer