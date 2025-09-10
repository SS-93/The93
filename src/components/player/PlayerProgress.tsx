// Player Progress Component
// Progress bar with waveform visualization and time display

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAudioPlayer } from '../../context/AudioPlayerContext'

const PlayerProgress: React.FC = () => {
  const { state, seekTo } = useAudioPlayer()
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || state.duration === 0) return

    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * state.duration

    seekTo(Math.max(0, Math.min(state.duration, newTime)))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || state.duration === 0) return

    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * state.duration

    setHoverTime(Math.max(0, Math.min(state.duration, time)))
  }

  const handleMouseLeave = () => {
    setHoverTime(null)
  }

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  return (
    <div className="relative">
      {/* Progress bar */}
      <div
        ref={progressRef}
        className="h-1 bg-gray-700 cursor-pointer group relative overflow-hidden"
        onClick={handleSeek}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Waveform background (if available) */}
        {state.currentTrack?.waveformData && (
          <div className="absolute inset-0 flex items-center">
            {state.currentTrack.waveformData.map((amplitude, index) => (
              <div
                key={index}
                className="flex-1 bg-gray-600 mx-px"
                style={{
                  height: `${Math.max(2, amplitude * 100)}%`,
                  opacity: index / state.currentTrack!.waveformData!.length < progress / 100 ? 1 : 0.3
                }}
              />
            ))}
          </div>
        )}

        {/* Progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-accent-yellow to-yellow-400 relative"
          style={{ width: `${progress}%` }}
          transition={{ duration: isDragging ? 0 : 0.1 }}
        >
          {/* Progress handle */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </motion.div>

        {/* Hover indicator */}
        {hoverTime !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white opacity-50 pointer-events-none"
            style={{ left: `${(hoverTime / state.duration) * 100}%` }}
          />
        )}
      </div>

      {/* Time display (hidden on very small screens) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between text-xs text-gray-400 pointer-events-none">
        <span>{formatTime(state.currentTime)}</span>
        
        {/* Hover time tooltip */}
        {hoverTime !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-gray-800 text-white px-2 py-1 rounded text-xs pointer-events-none"
            style={{ 
              left: `${(hoverTime / state.duration) * 100}%`,
              transform: 'translateX(-50%)',
              top: '-30px'
            }}
          >
            {formatTime(hoverTime)}
          </motion.div>
        )}
        
        <span>{formatTime(state.duration)}</span>
      </div>
    </div>
  )
}

export default PlayerProgress
