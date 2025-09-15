// Enhanced Player Controls - Phase 1
// Improved visual design with dynamic theming

import React from 'react'
import { motion } from 'framer-motion'
import { useAudioPlayer } from '../../../context/AudioPlayerContext'

interface PlayerBarControlsProps {
  dominantColor: string
}

const PlayerBarControls: React.FC<PlayerBarControlsProps> = ({ dominantColor }) => {
  const { state, togglePlay, nextTrack, previousTrack, dispatch } = useAudioPlayer()

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
  }

  const toggleRepeat = () => {
    const modes: ('none' | 'track' | 'queue')[] = ['none', 'track', 'queue']
    const currentIndex = modes.indexOf(state.repeatMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode })
  }

  const getRepeatIcon = () => {
    switch (state.repeatMode) {
      case 'track': return '🔂'
      case 'queue': return '🔁'
      default: return '🔁'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Time display and controls row */}
      <div className="flex items-center space-x-6">
        {/* Shuffle button */}
        <motion.button
          onClick={toggleShuffle}
          className={`p-2 rounded-lg transition-all duration-300 ${
            state.shuffleMode 
              ? 'text-white shadow-lg' 
              : 'text-white/60 hover:text-white'
          }`}
          style={{
            backgroundColor: state.shuffleMode ? `${dominantColor}60` : 'transparent'
          }}
          title={state.shuffleMode ? 'Disable shuffle' : 'Enable shuffle'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-lg">🔀</span>
        </motion.button>

        {/* Previous track */}
        <motion.button
          onClick={previousTrack}
          disabled={state.queue.length === 0}
          className="p-2 rounded-lg text-white/80 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
          title="Previous track"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl">⏮️</span>
        </motion.button>

        {/* Enhanced Play/Pause button */}
        <motion.button
          onClick={togglePlay}
          disabled={!state.currentTrack}
          className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${dominantColor}80, ${dominantColor}60)`,
            boxShadow: `0 8px 32px ${dominantColor}40`
          }}
          title={state.isPlaying ? 'Pause' : 'Play'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {state.isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <motion.span 
              className="text-2xl text-white ml-0.5"
              key={state.isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {state.isPlaying ? '⏸️' : '▶️'}
            </motion.span>
          )}
          
          {/* Ripple effect for playing state */}
          {state.isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{ 
                scale: [1, 1.3],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </motion.button>

        {/* Next track */}
        <motion.button
          onClick={nextTrack}
          disabled={state.queue.length === 0}
          className="p-2 rounded-lg text-white/80 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
          title="Next track"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl">⏭️</span>
        </motion.button>

        {/* Repeat button */}
        <motion.button
          onClick={toggleRepeat}
          className={`relative p-2 rounded-lg transition-all duration-300 ${
            state.repeatMode !== 'none'
              ? 'text-white shadow-lg' 
              : 'text-white/60 hover:text-white'
          }`}
          style={{
            backgroundColor: state.repeatMode !== 'none' ? `${dominantColor}60` : 'transparent'
          }}
          title={`Repeat: ${state.repeatMode}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-lg">{getRepeatIcon()}</span>
          {state.repeatMode === 'track' && (
            <motion.span 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold text-black"
              style={{ backgroundColor: dominantColor }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              1
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Time display */}
      <div className="flex items-center space-x-3 text-sm text-white/70">
        <span className="font-mono">{formatTime(state.currentTime)}</span>
        <div className="w-1 h-1 bg-white/30 rounded-full" />
        <span className="font-mono">{formatTime(state.duration)}</span>
      </div>
    </div>
  )
}

export default PlayerBarControls