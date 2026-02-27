// Player Controls Component
// Main playback controls (previous, play/pause, next, shuffle, repeat)

import React from 'react'
import { motion } from 'framer-motion'
import { useAudioPlayer } from '../../context/AudioPlayerContext'

const PlayerControls: React.FC = () => {
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

  return (
    <div className="flex items-center space-x-6">
      {/* Shuffle button */}
      <motion.button
        onClick={toggleShuffle}
        className={`p-2 rounded-lg transition-colors ${
          state.shuffleMode 
            ? 'text-accent-yellow bg-accent-yellow/20' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
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
        className="p-2 rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50"
        title="Previous track"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-xl">⏮️</span>
      </motion.button>

      {/* Play/Pause button */}
      <motion.button
        onClick={togglePlay}
        disabled={!state.currentTrack}
        className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        title={state.isPlaying ? 'Pause' : 'Play'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {state.isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full"
          />
        ) : (
          <span className="text-xl ml-0.5">
            {state.isPlaying ? '⏸️' : '▶️'}
          </span>
        )}
      </motion.button>

      {/* Next track */}
      <motion.button
        onClick={nextTrack}
        disabled={state.queue.length === 0}
        className="p-2 rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50"
        title="Next track"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-xl">⏭️</span>
      </motion.button>

      {/* Repeat button */}
      <motion.button
        onClick={toggleRepeat}
        className={`p-2 rounded-lg transition-colors ${
          state.repeatMode !== 'none'
            ? 'text-accent-yellow bg-accent-yellow/20' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
        title={`Repeat: ${state.repeatMode}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-lg">{getRepeatIcon()}</span>
        {state.repeatMode === 'track' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-yellow rounded-full text-xs flex items-center justify-center text-black font-bold">
            1
          </span>
        )}
      </motion.button>
    </div>
  )
}

export default PlayerControls
