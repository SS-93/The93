// Buckets System Tray - Production Implementation
// Three-cluster layout with full accessibility and interaction specs

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../../context/AudioPlayerContext'

// Device interface for handoff functionality
interface Device {
  id: string
  name: string
  type: 'web' | 'mobile' | 'desktop' | 'speaker'
  isActive: boolean
  isAvailable: boolean
}

const BucketsSystemTray: React.FC = () => {
  const { 
    state, 
    togglePlay, 
    nextTrack, 
    previousTrack, 
    seekTo, 
    setVolume,
    dispatch 
  } = useAudioPlayer()
  
  // Component state
  const [dominantColor, setDominantColor] = useState('#1db954')
  const [isVisible, setIsVisible] = useState(false)
  const [devices, setDevices] = useState<Device[]>([
    { id: 'web', name: 'Web Player', type: 'web', isActive: true, isAvailable: true }
  ])
  const [activeDevice, setActiveDevice] = useState<Device | null>(devices[0])
  const [showDeviceMenu, setShowDeviceMenu] = useState(false)
  
  // Scrubber state
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [showTimeTooltip, setShowTimeTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState(0)
  
  // Volume state
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false)
  const [isVolumeDragging, setIsVolumeDragging] = useState(false)
  
  // UI state
  const [showLyrics, setShowLyrics] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Refs for interaction handling
  const scrubberRef = useRef<HTMLDivElement>(null)
  const volumeRef = useRef<HTMLDivElement>(null)
  const trayRef = useRef<HTMLDivElement>(null)

  // Show/hide tray based on current track
  useEffect(() => {
    setIsVisible(!!state.currentTrack)
  }, [state.currentTrack])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (state.currentTrack) togglePlay()
          break
        case 'ArrowLeft':
          if (e.target === scrubberRef.current || document.activeElement === scrubberRef.current) {
            e.preventDefault()
            seekTo(Math.max(0, state.currentTime - 5))
          }
          break
        case 'ArrowRight':
          if (e.target === scrubberRef.current || document.activeElement === scrubberRef.current) {
            e.preventDefault()
            seekTo(Math.min(state.duration, state.currentTime + 5))
          }
          break
        case 'ArrowUp':
          if (e.target === volumeRef.current || document.activeElement === volumeRef.current) {
            e.preventDefault()
            setVolume(Math.min(1, state.volume + 0.05))
          }
          break
        case 'ArrowDown':
          if (e.target === volumeRef.current || document.activeElement === volumeRef.current) {
            e.preventDefault()
            setVolume(Math.max(0, state.volume - 0.05))
          }
          break
        case 'KeyL':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            setShowLyrics(!showLyrics)
          }
          break
        case 'KeyQ':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            setShowQueue(!showQueue)
          }
          break
        case 'KeyM':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            dispatch({ type: 'TOGGLE_MUTE' })
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state, togglePlay, seekTo, setVolume, dispatch, showLyrics, showQueue])

  // Scrubber interaction handlers
  const handleScrubberMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current || state.duration === 0) return
    
    setIsDragging(true)
    const rect = scrubberRef.current.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const newTime = clickPosition * state.duration
    setHoverTime(newTime)
    
    // Don't seek immediately - wait for mouse up for better UX
  }, [state.duration])

  const handleScrubberMouseMove = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current || state.duration === 0) return
    
    const rect = scrubberRef.current.getBoundingClientRect()
    const hoverPosition = (e.clientX - rect.left) / rect.width
    const hoveredTime = Math.max(0, Math.min(state.duration, hoverPosition * state.duration))
    
    setHoverTime(hoveredTime)
    setTooltipPosition(e.clientX - rect.left)
    setShowTimeTooltip(true)
    
    if (isDragging) {
      // Visual feedback during drag but don't seek yet
      dispatch({ type: 'SET_CURRENT_TIME', payload: hoveredTime })
    }
  }, [isDragging, state.duration, dispatch])

  const handleScrubberMouseUp = useCallback(() => {
    if (isDragging) {
      seekTo(hoverTime)
    }
    setIsDragging(false)
  }, [isDragging, hoverTime, seekTo])

  const handleScrubberMouseLeave = useCallback(() => {
    setShowTimeTooltip(false)
    if (isDragging) {
      setIsDragging(false)
    }
  }, [isDragging])

  // Volume interaction handlers
  const handleVolumeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!volumeRef.current) return
    
    setIsVolumeDragging(true)
    const rect = volumeRef.current.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const newVolume = Math.max(0, Math.min(1, clickPosition))
    setVolume(newVolume)
  }, [setVolume])

  const handleVolumeMouseMove = useCallback((e: React.MouseEvent) => {
    if (!volumeRef.current || !isVolumeDragging) return
    
    const rect = volumeRef.current.getBoundingClientRect()
    const hoverPosition = (e.clientX - rect.left) / rect.width
    const newVolume = Math.max(0, Math.min(1, hoverPosition))
    setVolume(newVolume)
  }, [isVolumeDragging, setVolume])

  const handleVolumeMouseUp = useCallback(() => {
    setIsVolumeDragging(false)
  }, [])

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Device handoff handler
  const handleDeviceSelect = (device: Device) => {
    setActiveDevice(device)
    setShowDeviceMenu(false)
    // TODO: Implement actual device transfer logic
    console.log(`Transferring playback to ${device.name}`)
  }

  // Progress calculation
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  if (!state.currentTrack) {
    return null
  }

  return (
    <>
      {/* Global click handler for closing menus */}
      {(showDeviceMenu || showQueue || showLyrics) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDeviceMenu(false)
            setShowQueue(false)
            setShowLyrics(false)
          }}
        />
      )}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={trayRef}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 px-4 py-3"
            role="region"
            aria-label="Media player controls"
          >
            <div className="max-w-screen-2xl mx-auto grid grid-cols-3 items-center gap-4">
              
              {/* LEFT CLUSTER: Now Playing */}
              <div className="flex items-center space-x-3 min-w-0">
                {/* Album Art */}
                <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  {state.currentTrack.albumArt ? (
                    <img 
                      src={state.currentTrack.albumArt} 
                      alt={`${state.currentTrack.title} album art`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🎵
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="min-w-0 flex-1">
                  <button
                    className="block text-white text-sm font-medium truncate hover:underline focus:underline focus:outline-none"
                    title={state.currentTrack.title}
                    onClick={() => console.log('Navigate to track page')}
                  >
                    {state.currentTrack.title}
                  </button>
                  <button
                    className="block text-gray-400 text-xs truncate hover:underline hover:text-white focus:underline focus:text-white focus:outline-none"
                    title={state.currentTrack.artist}
                    onClick={() => console.log('Navigate to artist page')}
                  >
                    {state.currentTrack.artist}
                  </button>
                </div>

                {/* Like Button */}
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    state.isLiked 
                      ? 'text-green-500 hover:text-green-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label={state.isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                  onClick={() => dispatch({ type: 'TOGGLE_LIKE' })}
                  title={state.isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                >
                  {state.isLiked ? '♥' : '♡'}
                </button>
              </div>

              {/* CENTER CLUSTER: Transport Controls */}
              <div className="flex flex-col items-center space-y-2">
                {/* Control Buttons */}
                <div className="flex items-center space-x-4">
                  {/* Shuffle */}
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      state.shuffleMode 
                        ? 'text-green-500 hover:text-green-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    aria-label={state.shuffleMode ? 'Disable shuffle' : 'Enable shuffle'}
                    onClick={() => dispatch({ type: 'TOGGLE_SHUFFLE' })}
                    title={state.shuffleMode ? 'Disable shuffle' : 'Enable shuffle'}
                  >
                    🔀
                  </button>

                  {/* Previous */}
                  <button
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous track"
                    onClick={previousTrack}
                    disabled={!state.canSeekPrevious}
                    title="Previous track"
                  >
                    ⏮
                  </button>

                  {/* Play/Pause */}
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-transform focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
                    aria-label={state.isPlaying ? 'Pause' : 'Play'}
                    onClick={togglePlay}
                    title={state.isPlaying ? 'Pause' : 'Play'}
                  >
                    {state.isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                      />
                    ) : state.isPlaying ? (
                      '⏸'
                    ) : (
                      '▶️'
                    )}
                  </button>

                  {/* Next */}
                  <button
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next track"
                    onClick={nextTrack}
                    disabled={!state.canSeekNext}
                    title="Next track"
                  >
                    ⏭
                  </button>

                  {/* Repeat */}
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      state.repeatMode !== 'none'
                        ? 'text-green-500 hover:text-green-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    aria-label={`Repeat: ${state.repeatMode}`}
                    onClick={() => {
                      const modes: ('none' | 'track' | 'queue')[] = ['none', 'track', 'queue']
                      const currentIndex = modes.indexOf(state.repeatMode)
                      const nextMode = modes[(currentIndex + 1) % modes.length]
                      dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode })
                    }}
                    title={`Repeat: ${state.repeatMode}`}
                  >
                    {state.repeatMode === 'track' ? '🔂' : '🔁'}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center space-x-2 w-full max-w-md">
                  <span className="text-xs text-gray-400 tabular-nums min-w-[40px]">
                    {formatTime(state.currentTime)}
                  </span>
                  
                  <div className="flex-1 relative">
                    {/* Time Tooltip */}
                    {showTimeTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full mb-2 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
                        style={{ 
                          left: tooltipPosition,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        {formatTime(hoverTime)}
                      </motion.div>
                    )}

                    <div
                      ref={scrubberRef}
                      className="h-1 bg-gray-600 rounded-full cursor-pointer group"
                      onMouseDown={handleScrubberMouseDown}
                      onMouseMove={handleScrubberMouseMove}
                      onMouseUp={handleScrubberMouseUp}
                      onMouseLeave={handleScrubberMouseLeave}
                      role="slider"
                      aria-label="Seek slider"
                      aria-valuemin={0}
                      aria-valuemax={state.duration}
                      aria-valuenow={state.currentTime}
                      aria-valuetext={`${formatTime(state.currentTime)} of ${formatTime(state.duration)}`}
                      tabIndex={0}
                    >
                      {/* Progress Fill */}
                      <div 
                        className="h-full bg-white rounded-full relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 tabular-nums min-w-[40px]">
                    {formatTime(state.duration)}
                  </span>
                </div>
              </div>

              {/* RIGHT CLUSTER: Secondary Controls */}
              <div className="flex items-center justify-end space-x-2">
                {/* Lyrics */}
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                    showLyrics 
                      ? 'text-green-500 hover:text-green-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Show lyrics"
                  onClick={() => setShowLyrics(!showLyrics)}
                  title="Lyrics (L)"
                >
                  🎤
                </button>

                {/* Queue */}
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                    showQueue 
                      ? 'text-green-500 hover:text-green-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Show queue"
                  onClick={() => setShowQueue(!showQueue)}
                  title="Queue (Q)"
                >
                  📋
                </button>

                {/* Device Connect */}
                <div className="relative">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded transition-colors text-gray-400 hover:text-white"
                    aria-label={`Connect to a device. Currently playing on ${activeDevice?.name}`}
                    onClick={() => setShowDeviceMenu(!showDeviceMenu)}
                    title={`Playing on ${activeDevice?.name}`}
                  >
                    📱
                    {activeDevice?.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>

                  {/* Device Menu */}
                  <AnimatePresence>
                    {showDeviceMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 min-w-[200px] z-50"
                      >
                        <div className="text-xs text-gray-400 mb-2 px-2">Connect to a device</div>
                        {devices.map((device) => (
                          <button
                            key={device.id}
                            className={`w-full flex items-center space-x-2 px-2 py-2 rounded text-sm transition-colors ${
                              device.isActive 
                                ? 'text-green-500 bg-gray-700' 
                                : 'text-white hover:bg-gray-700'
                            }`}
                            onClick={() => handleDeviceSelect(device)}
                            disabled={!device.isAvailable}
                          >
                            <span>{device.isActive ? '🔊' : '📱'}</span>
                            <span className="flex-1 text-left">{device.name}</span>
                            {device.isActive && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  {/* Volume Icon */}
                  <button
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    aria-label="Mute"
                    onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
                    title="Mute (M)"
                  >
                    {state.isMuted || state.volume === 0 ? '🔇' : state.volume < 0.5 ? '🔉' : '🔊'}
                  </button>

                  {/* Volume Slider */}
                  <div className="w-20 h-1 bg-gray-600 rounded-full relative group">
                    <div
                      ref={volumeRef}
                      className="h-full bg-white rounded-full cursor-pointer"
                      style={{ width: `${(state.isMuted ? 0 : state.volume) * 100}%` }}
                      onMouseDown={handleVolumeMouseDown}
                      onMouseMove={handleVolumeMouseMove}
                      onMouseUp={handleVolumeMouseUp}
                      role="slider"
                      aria-label="Volume"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(state.volume * 100)}
                      aria-valuetext={`Volume ${Math.round(state.volume * 100)}%`}
                      tabIndex={0}
                    >
                      <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                {/* Fullscreen Toggle */}
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                >
                  {isFullscreen ? '🗗' : '⛶'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default BucketsSystemTray