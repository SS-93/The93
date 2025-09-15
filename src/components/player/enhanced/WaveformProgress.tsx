// Waveform Progress Component - Phase 1
// Interactive waveform-based progress bar

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAudioPlayer } from '../../../context/AudioPlayerContext'

interface WaveformProgressProps {
  dominantColor: string
}

const WaveformProgress: React.FC<WaveformProgressProps> = ({ dominantColor }) => {
  const { state, seekTo } = useAudioPlayer()
  const [isHovering, setIsHovering] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  // Generate mock waveform data if not available
  const waveformData = state.currentTrack?.waveformData || generateMockWaveform()

  function generateMockWaveform() {
    return Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2)
  }

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  const handleClick = (e: React.MouseEvent) => {
    if (!progressRef.current || state.duration === 0) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const newTime = clickPosition * state.duration
    seekTo(newTime)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!progressRef.current || state.duration === 0) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const hoverPosition = (e.clientX - rect.left) / rect.width
    const hoveredTime = hoverPosition * state.duration
    setHoverTime(hoveredTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative">
      {/* Hover time tooltip */}
      {isHovering && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 transform -translate-y-8 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
          style={{
            left: `${(hoverTime / state.duration) * 100}%`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          {formatTime(hoverTime)}
        </motion.div>
      )}

      {/* Main progress bar */}
      <div
        ref={progressRef}
        className="relative h-2 cursor-pointer group"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Background waveform */}
        <div className="absolute inset-0 flex items-end justify-between px-1 opacity-30">
          {waveformData.map((amplitude, index) => (
            <motion.div
              key={index}
              className="w-0.5 bg-white/40 rounded-full"
              style={{ 
                height: `${amplitude * 100}%`,
                minHeight: '2px'
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ 
                delay: index * 0.01,
                duration: 0.3
              }}
            />
          ))}
        </div>

        {/* Progress overlay */}
        <div className="absolute inset-0 flex items-end justify-between px-1">
          {waveformData.map((amplitude, index) => {
            const barProgress = (index / (waveformData.length - 1)) * 100
            const isPlayed = barProgress <= progress
            
            return (
              <motion.div
                key={`progress-${index}`}
                className="w-0.5 rounded-full transition-all duration-150"
                style={{ 
                  height: `${amplitude * 100}%`,
                  minHeight: '2px',
                  backgroundColor: isPlayed 
                    ? dominantColor 
                    : 'transparent'
                }}
                animate={{
                  opacity: isPlayed ? 1 : 0
                }}
              />
            )
          })}
        </div>

        {/* Hover effect overlay */}
        {isHovering && (
          <div 
            className="absolute top-0 bottom-0 bg-white/10 pointer-events-none"
            style={{
              left: 0,
              width: `${(hoverTime / state.duration) * 100}%`
            }}
          />
        )}

        {/* Current position indicator */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 rounded-full shadow-lg"
          style={{
            left: `${progress}%`,
            backgroundColor: dominantColor,
            boxShadow: `0 0 8px ${dominantColor}80`
          }}
          animate={{
            scale: isHovering ? 1.2 : 1
          }}
        >
          {/* Glowing dot */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: dominantColor }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Interactive hover line */}
        {isHovering && (
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50 pointer-events-none"
            style={{
              left: `${(hoverTime / state.duration) * 100}%`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>

      {/* Buffer progress (if available) */}
      {state.duration > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="h-full bg-white/20 rounded-full transition-all duration-300"
            style={{
              width: '100%' // Would show buffered amount in real implementation
            }}
          />
        </div>
      )}
    </div>
  )
}

export default WaveformProgress