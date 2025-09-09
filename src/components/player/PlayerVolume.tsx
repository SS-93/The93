// Player Volume Component
// Volume control with mute button and slider

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../context/AudioPlayerContext'
import './PlayerVolume.css'

const PlayerVolume: React.FC = () => {
  const { state, setVolume, dispatch } = useAudioPlayer()
  const [showSlider, setShowSlider] = useState(false)

  const getVolumeIcon = () => {
    if (state.isMuted || state.volume === 0) return '🔇'
    if (state.volume < 0.3) return '🔈'
    if (state.volume < 0.7) return '🔉'
    return '🔊'
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  const toggleMute = () => {
    dispatch({ type: 'TOGGLE_MUTE' })
  }

  return (
    <div className="relative flex items-center">
      {/* Volume button */}
      <motion.button
        onClick={toggleMute}
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
        className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors hover:bg-gray-700/50"
        title={state.isMuted ? 'Unmute' : 'Mute'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-lg">{getVolumeIcon()}</span>
      </motion.button>

      {/* Volume slider */}
      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-full ml-2 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg"
            onMouseEnter={() => setShowSlider(true)}
            onMouseLeave={() => setShowSlider(false)}
          >
            {/* Volume percentage display */}
            <div className="text-center text-xs text-gray-400 mb-2">
              {Math.round((state.isMuted ? 0 : state.volume) * 100)}%
            </div>

            {/* Volume slider */}
            <div className="w-24 relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.isMuted ? 0 : state.volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(state.isMuted ? 0 : state.volume) * 100}%, #374151 ${(state.isMuted ? 0 : state.volume) * 100}%, #374151 100%)`
                }}
              />
              
              {/* Volume level indicators */}
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Quick volume presets */}
            <div className="flex justify-between mt-2 space-x-1">
              {[0.25, 0.5, 0.75, 1].map((volume) => (
                <button
                  key={volume}
                  onClick={() => setVolume(volume)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    Math.abs(state.volume - volume) < 0.05
                      ? 'bg-accent-yellow text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {Math.round(volume * 100)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  )
}

export default PlayerVolume
