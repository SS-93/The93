import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { useAudioPlayer, Track } from '../../context/AudioPlayerContext'
import { logMediaEngagement } from '../../lib/mediaId'

// Extended track interface for video content
interface VideoTrack extends Track {
  videoUrl?: string
  videoLoopDuration?: number
  topicHashtag?: string
  tags?: string[]
  isExplicit?: boolean
  followerCount?: string
  isFollowing?: boolean
  creatorId?: string
}

interface VerticalMusicPlayerProps {
  tracks: VideoTrack[]
  initialIndex?: number
  onClose?: () => void
  className?: string
}

const VerticalMusicPlayer: React.FC<VerticalMusicPlayerProps> = ({
  tracks,
  initialIndex = 0,
  onClose,
  className = ''
}) => {
  const { state: playerState, playTrack, togglePlay, seekTo } = useAudioPlayer()
  
  // Player state
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isVideoMuted, setIsVideoMuted] = useState(true) // Default muted
  const [isBuffering, setIsBuffering] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showTimeTooltip, setShowTimeTooltip] = useState(false)
  const [tooltipTime, setTooltipTime] = useState(0)
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  
  // Motion values for swipe gestures
  const y = useMotionValue(0)
  const opacity = useTransform(y, [-100, 0, 100], [0.8, 1, 0.8])
  
  const currentTrack = tracks[currentIndex]
  const hasNext = currentIndex < tracks.length - 1
  const hasPrevious = currentIndex > 0

  // Video event handlers
  const handleVideoLoad = useCallback(() => {
    setIsBuffering(false)
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted
      videoRef.current.play().catch(console.error)
    }
  }, [isVideoMuted])

  const handleVideoError = useCallback(() => {
    console.error('Video failed to load:', currentTrack?.videoUrl)
    setIsBuffering(false)
  }, [currentTrack])

  const goToNext = useCallback(() => {
    if (hasNext) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      const nextTrack = tracks[nextIndex]
      if (nextTrack) {
        playTrack(nextTrack)
        logMediaEngagement(nextTrack.id, 'vertical_swipe_next', { 
          from_index: currentIndex,
          to_index: nextIndex 
        })
      }
    }
  }, [currentIndex, hasNext, tracks, playTrack])

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      const prevTrack = tracks[prevIndex]
      if (prevTrack) {
        playTrack(prevTrack)
        logMediaEngagement(prevTrack.id, 'vertical_swipe_previous', {
          from_index: currentIndex,
          to_index: prevIndex
        })
      }
    }
  }, [currentIndex, hasPrevious, tracks, playTrack])

  // Gesture handlers
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 50
    const velocity = info.velocity.y
    
    if (Math.abs(velocity) > 500 || Math.abs(info.offset.y) > threshold) {
      if (info.offset.y > 0 && hasPrevious) {
        // Swipe down - previous track
        goToPrevious()
      } else if (info.offset.y < 0 && hasNext) {
        // Swipe up - next track
        goToNext()
      }
    }
    
    // Reset position
    y.set(0)
  }, [hasNext, hasPrevious, goToPrevious, goToNext, y])

  // Touch handlers for tap regions
  const handleTapLeft = useCallback(() => {
    // Restart current or go to previous in topic set
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
    seekTo(0)
    logMediaEngagement(currentTrack.id, 'tap_restart')
  }, [currentTrack, seekTo])

  const handleTapRight = useCallback(() => {
    // Skip to next in topic set or next track
    goToNext()
  }, [goToNext])

  const handleLongPress = useCallback(() => {
    setIsPaused(true)
    if (videoRef.current) {
      videoRef.current.pause()
    }
    togglePlay()
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    logMediaEngagement(currentTrack.id, 'long_press_pause')
  }, [currentTrack, togglePlay])

  const handleLongPressEnd = useCallback(() => {
    setIsPaused(false)
    if (videoRef.current) {
      videoRef.current.play()
    }
    if (!playerState.isPlaying) {
      togglePlay()
    }
  }, [playerState.isPlaying, togglePlay])

  // Follow/unfollow handler
  const handleFollowToggle = useCallback(() => {
    // Implement follow logic here
    logMediaEngagement(currentTrack.id, 'follow_toggle', {
      artist_id: currentTrack.creatorId,
      action: currentTrack.isFollowing ? 'unfollow' : 'follow'
    })
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25)
    }
  }, [currentTrack])

  // Add to library/playlist
  const handleAdd = useCallback(() => {
    // Implement add to library logic
    logMediaEngagement(currentTrack.id, 'add_to_library')
    
    // Show confirmation toast and haptic
    if (navigator.vibrate) {
      navigator.vibrate(25)
    }
  }, [currentTrack])

  // Share handler
  const handleShare = useCallback(async () => {
    if (navigator.share && currentTrack) {
      try {
        await navigator.share({
          title: currentTrack.title,
          text: `Check out ${currentTrack.title} by ${currentTrack.artist}`,
          url: window.location.href
        })
        logMediaEngagement(currentTrack.id, 'native_share')
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }, [currentTrack])

  // Progress bar interaction
  const handleProgressInteraction = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!progressRef.current || !currentTrack) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const progress = (clientX - rect.left) / rect.width
    const newTime = progress * (playerState.duration || 0)
    
    setTooltipTime(newTime)
    setShowTimeTooltip(true)
    seekTo(newTime)
    
    logMediaEngagement(currentTrack.id, 'progress_seek', { seek_to: newTime })
  }, [currentTrack, playerState.duration, seekTo])

  // Initialize video and audio
  useEffect(() => {
    if (currentTrack) {
      setIsBuffering(true)
      
      // Only call playTrack if this track isn't already playing
      if (!playerState.currentTrack || playerState.currentTrack.id !== currentTrack.id) {
        playTrack(currentTrack)
      }
      
      // Set video source if available
      if (videoRef.current && currentTrack.videoUrl) {
        videoRef.current.src = currentTrack.videoUrl
        videoRef.current.load()
      }
    }
  }, [currentTrack, playTrack, playerState.currentTrack])

  // Sync video with audio playback
  useEffect(() => {
    if (videoRef.current && currentTrack?.videoUrl) {
      const video = videoRef.current
      
      if (playerState.isPlaying && !isPaused) {
        video.play().catch(console.error)
        // Sync video time with audio time
        if (playerState.currentTime && Math.abs(video.currentTime - playerState.currentTime) > 1) {
          video.currentTime = playerState.currentTime
        }
      } else {
        video.pause()
      }
    }
  }, [playerState.isPlaying, playerState.currentTime, isPaused, currentTrack?.videoUrl])

  // Volume control
  const toggleVideoMute = useCallback(() => {
    setIsVideoMuted(!isVideoMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted
    }
    logMediaEngagement(currentTrack?.id || '', 'volume_toggle', { muted: !isVideoMuted })
  }, [isVideoMuted, currentTrack])

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className={`fixed inset-0 bg-black z-50 ${className}`} ref={containerRef}>
      {/* Video Background */}
      <div className="absolute inset-0">
        {currentTrack.videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isVideoMuted}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onLoadStart={() => setIsBuffering(true)}
            preload="metadata"
          >
            <source src={currentTrack.videoUrl} type="video/mp4" />
          </video>
        ) : (
          // Blue gradient background with looping visual
          <div className="w-full h-full relative bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800">
            {/* Animated looping visual overlay */}
            <div className="absolute inset-0 opacity-20">
              <img 
                src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHE3MW1jbDZuMHgya3JkMTBhNzk4Zmw4b3NnZ3BnMDB6eDV3bWVidyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif"
                alt="looping visual"
                className="w-full h-full object-cover mix-blend-overlay"
                style={{ filter: 'hue-rotate(240deg) brightness(0.6)' }}
              />
            </div>
            
            {/* Album art overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-2xl overflow-hidden animate-pulse shadow-2xl">
                {currentTrack.albumArt && (
                  <img 
                    src={currentTrack.albumArt} 
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
            
            {/* Subtle animated particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 bg-white rounded-full animate-bounce opacity-30" 
                   style={{ top: '15%', left: '20%', animationDelay: '0s', animationDuration: '3s' }} />
              <div className="absolute w-1 h-1 bg-blue-300 rounded-full animate-pulse opacity-40" 
                   style={{ top: '70%', left: '75%', animationDelay: '1.5s', animationDuration: '2s' }} />
              <div className="absolute w-3 h-3 bg-indigo-400 rounded-full animate-ping opacity-20" 
                   style={{ top: '85%', left: '30%', animationDelay: '2.5s', animationDuration: '4s' }} />
              <div className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-bounce opacity-25" 
                   style={{ top: '40%', left: '85%', animationDelay: '1s', animationDuration: '2.5s' }} />
            </div>
          </div>
        )}
        
        {/* Frosty overlay for glass effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 backdrop-blur-[1px]" />
        
        {/* Additional frosty texture */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]" />
      </div>

      {/* Swipe Container */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{ y, opacity }}
        drag="y"
        dragConstraints={{ top: -100, bottom: 100 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 pt-safe-top px-4 py-4 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
              aria-label="Close player"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Topic hashtag and progress dots */}
            <div className="flex-1 flex flex-col items-center">
              {currentTrack.topicHashtag && (
                <span className="text-white font-semibold text-sm mb-1">
                  #{currentTrack.topicHashtag}
                </span>
              )}
              <div className="flex space-x-1">
                {tracks.slice(0, Math.min(8, tracks.length)).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={toggleVideoMute}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
              aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                {isVideoMuted ? (
                  <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l4.18 4.18a.996.996 0 001.41 0 .996.996 0 000-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-7-8l-.84.84 3.63 3.63c.24-.37.21-.85-.12-1.18L12 4z"/>
                ) : (
                  <path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Tap Regions for Navigation */}
        <div className="absolute inset-0 flex">
          <button
            className="flex-1 opacity-0"
            onTouchStart={handleLongPress}
            onTouchEnd={handleLongPressEnd}
            onMouseDown={handleLongPress}
            onMouseUp={handleLongPressEnd}
            onClick={handleTapLeft}
            aria-label="Previous or restart"
          />
          <button
            className="flex-1 opacity-0"
            onClick={handleTapRight}
            aria-label="Next track"
          />
        </div>

        {/* Mid Overlay - Artist Info */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-4 z-10">
          {/* Artist Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
              <img 
                src={currentTrack.albumArt || '/placeholder-avatar.png'} 
                alt={currentTrack.artist}
                className="w-full h-full object-cover"
              />
            </div>
            {!currentTrack.isFollowing && (
              <button
                onClick={handleFollowToggle}
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                aria-label={`Follow ${currentTrack.artist}`}
              >
                +
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleFollowToggle}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                currentTrack.isFollowing 
                  ? 'bg-white/20 text-white' 
                  : 'bg-red-500 text-white'
              }`}
              aria-pressed={currentTrack.isFollowing}
              aria-label={currentTrack.isFollowing ? `Unfollow ${currentTrack.artist}` : `Follow ${currentTrack.artist}`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.97 1.97 0 0018.07 7h-.71c-.8 0-1.54.5-1.85 1.26l-1.92 5.75c-.15.45.15.99.64.99H16v8h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2.5 16v-7H9.5l-.93-2.78c-.15-.44-.55-.72-1-.72s-.85.28-1 .72L5.64 15H7v7h1z"/>
              </svg>
            </button>

            <button
              onClick={handleAdd}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
              aria-label="Add to library"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            <button
              onClick={handleShare}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
              aria-label="Share track"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Left Side - Artist Name & Tags */}
        <div className="absolute left-4 bottom-32 z-10">
          <div className="text-white">
            <h3 className="font-bold text-lg mb-1">@{currentTrack.artist}</h3>
            {currentTrack.followerCount && (
              <p className="text-white/70 text-sm mb-3">{currentTrack.followerCount} followers</p>
            )}
            
            {/* Hashtag chips */}
            {currentTrack.tags && currentTrack.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentTrack.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white"
                  >
                    #{tag}
                  </span>
                ))}
                {currentTrack.tags.length > 3 && (
                  <button className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                    ...
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Overlay - Track Info */}
        <div className="absolute bottom-0 left-0 right-0 pb-safe-bottom p-4 z-10">
          {/* Track Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                <img 
                  src={currentTrack.albumArt || '/placeholder-artwork.png'} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate">
                  {currentTrack.title}
                  {currentTrack.isExplicit && (
                    <span className="ml-2 px-1 py-0.5 bg-gray-600 text-white text-xs rounded">E</span>
                  )}
                </h4>
                <p className="text-white/70 text-sm truncate">{currentTrack.artist}</p>
              </div>
              
              <button
                onClick={handleAdd}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white ml-3"
                aria-label="Add to playlist"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            ref={progressRef}
            className="relative h-1 bg-white/20 rounded-full cursor-pointer"
            onClick={handleProgressInteraction}
            onTouchStart={handleProgressInteraction}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={playerState.duration || 0}
            aria-valuenow={playerState.currentTime}
            aria-valuetext={`${formatTime(playerState.currentTime)} of ${formatTime(playerState.duration || 0)}`}
          >
            <div 
              className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-200"
              style={{ 
                width: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` 
              }}
            />
            
            {/* Time tooltip */}
            <AnimatePresence>
              {showTimeTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -30 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded"
                  onAnimationComplete={() => {
                    setTimeout(() => setShowTimeTooltip(false), 1000)
                  }}
                >
                  {formatTime(tooltipTime)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Handle bar */}
          <div className="w-32 h-1 bg-white/30 rounded-full mx-auto mt-2" />
        </div>

        {/* Pause Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buffering Indicator */}
        <AnimatePresence>
          {isBuffering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-safe-top left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden z-20"
            >
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ x: [-100, 400] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                style={{ width: '25%' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default VerticalMusicPlayer