import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import VerticalMusicPlayer from './VerticalMusicPlayer'
import { useAudioPlayer, Track } from '../../context/AudioPlayerContext'
import { logMediaEngagement } from '../../lib/mediaId'

// Extended track for vertical player
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

interface VerticalPlayerToggleProps {
  className?: string
  buttonLabel?: string
  tracks?: VideoTrack[]
}

// Mock data for demonstration - this would come from your discovery API
const mockVerticalTracks: VideoTrack[] = [
  {
    id: 'track-1',
    title: 'Want Love',
    artist: 'Lil West',
    artistId: 'lil-west-id',
    audioUrl: '/demo-audio.mp3',
    videoUrl: '/demo-video-1.mp4',
    albumArt: '/demo-artwork-1.jpg',
    duration: 180,
    topicHashtag: 'melodic rap',
    tags: ['melodic rap', 'english hip hop', 'sad trap'],
    isExplicit: true,
    followerCount: '24K',
    isFollowing: false,
    creatorId: 'lil-west-creator',
    audioFeatures: {
      bpm: 140,
      key: 'Am',
      mode: 'minor',
      energy: 0.7,
      valence: 0.3,
      danceability: 0.8
    },
    moodTags: {
      tags: ['melancholic', 'emotional', 'introspective'],
      confidence: 0.85
    }
  },
  {
    id: 'track-2',
    title: 'Underwater',
    artist: '1up Tee',
    artistId: '1up-tee-id',
    audioUrl: '/demo-audio-2.mp3',
    videoUrl: '/demo-video-2.mp4',
    albumArt: '/demo-artwork-2.jpg',
    duration: 210,
    topicHashtag: 'underground hip hop',
    tags: ['underground', 'experimental', 'trap'],
    isExplicit: false,
    followerCount: '8.2K',
    isFollowing: true,
    creatorId: '1up-tee-creator',
    audioFeatures: {
      bpm: 128,
      key: 'F#m',
      mode: 'minor',
      energy: 0.6,
      valence: 0.4,
      danceability: 0.7
    },
    moodTags: {
      tags: ['atmospheric', 'contemplative', 'dark'],
      confidence: 0.92
    }
  },
  {
    id: 'track-3',
    title: 'No Hook',
    artist: 'Young Nudy',
    artistId: 'young-nudy-id',
    audioUrl: '/demo-audio-3.mp3',
    videoUrl: '/demo-video-3.mp4',
    albumArt: '/demo-artwork-3.jpg',
    duration: 195,
    topicHashtag: 'american trap',
    tags: ['trap', 'atlanta', 'hard'],
    isExplicit: true,
    followerCount: '1.6M',
    isFollowing: false,
    creatorId: 'young-nudy-creator',
    audioFeatures: {
      bpm: 150,
      key: 'Dm',
      mode: 'minor',
      energy: 0.9,
      valence: 0.6,
      danceability: 0.85
    },
    moodTags: {
      tags: ['high-energy', 'aggressive', 'confident'],
      confidence: 0.88
    }
  }
]

const VerticalPlayerToggle: React.FC<VerticalPlayerToggleProps> = ({
  className = '',
  buttonLabel = 'Stories',
  tracks = mockVerticalTracks
}) => {
  const { state: playerState, playTrack } = useAudioPlayer()
  const [isVerticalPlayerOpen, setIsVerticalPlayerOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  // Open vertical player
  const openVerticalPlayer = useCallback((initialIndex: number = 0) => {
    setStartIndex(initialIndex)
    setIsVerticalPlayerOpen(true)
    
    // Start playing the first track
    if (tracks[initialIndex]) {
      playTrack(tracks[initialIndex])
    }
    
    // Log engagement
    logMediaEngagement(tracks[initialIndex]?.id || '', 'vertical_player_open', {
      source: 'toggle_button',
      initial_index: initialIndex,
      total_tracks: tracks.length
    })
  }, [tracks, playTrack])

  // Close vertical player
  const closeVerticalPlayer = useCallback(() => {
    setIsVerticalPlayerOpen(false)
    
    // Log session end
    logMediaEngagement('', 'vertical_player_close', {
      session_duration: Date.now(), // Would need proper session tracking
      tracks_viewed: startIndex + 1 // Approximate
    })
  }, [startIndex])

  // Find current track index in vertical tracks
  const getCurrentTrackIndex = useCallback(() => {
    if (!playerState.currentTrack) return 0
    
    const index = tracks.findIndex(track => track.id === playerState.currentTrack?.id)
    return index >= 0 ? index : 0
  }, [playerState.currentTrack, tracks])

  // Handle opening from current playing track
  const openFromCurrentTrack = useCallback(() => {
    const currentIndex = getCurrentTrackIndex()
    openVerticalPlayer(currentIndex)
  }, [getCurrentTrackIndex, openVerticalPlayer])

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className={`
          inline-flex items-center justify-center
          px-4 py-2 rounded-full
          bg-gradient-to-r from-purple-500 to-pink-500
          text-white font-semibold text-sm
          shadow-lg hover:shadow-xl
          transition-all duration-200
          ${className}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openFromCurrentTrack}
        aria-label={`Open ${buttonLabel} vertical music player`}
      >
        {/* Stories icon */}
        <svg 
          className="w-5 h-5 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v14a1 1 0 01-1 1H8a1 1 0 01-1-1V4m0 0H5a1 1 0 00-1 1v16a1 1 0 001 1h4m4-8H9m4-4H9m8-2V7" 
          />
        </svg>
        {buttonLabel}
      </motion.button>

      {/* Vertical Music Player Modal */}
      <AnimatePresence>
        {isVerticalPlayerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999]"
          >
            <VerticalMusicPlayer
              tracks={tracks}
              initialIndex={startIndex}
              onClose={closeVerticalPlayer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Export for use in other components
export default VerticalPlayerToggle

// Helper component for integrating into existing player
export const VerticalPlayerButton: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'ghost'
}> = ({ 
  size = 'md',
  variant = 'primary'
}) => {
  const { state: playerState, playTrack } = useAudioPlayer()
  const [isVerticalPlayerOpen, setIsVerticalPlayerOpen] = useState(false)
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm', 
    lg: 'w-12 h-12 text-base'
  }
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    secondary: 'bg-white/10 backdrop-blur-sm text-white border border-white/20',
    ghost: 'bg-transparent text-white hover:bg-white/10'
  }

  // Open vertical player
  const openVerticalPlayer = useCallback(() => {
    setIsVerticalPlayerOpen(true)
    
    // Start playing the first mock track if none is playing
    if (!playerState.currentTrack && mockVerticalTracks[0]) {
      playTrack(mockVerticalTracks[0])
    }
    
    // Log engagement
    logMediaEngagement(playerState.currentTrack?.id || '', 'vertical_player_open', {
      source: 'icon_button'
    })
  }, [playerState.currentTrack, playTrack])

  // Close vertical player
  const closeVerticalPlayer = useCallback(() => {
    setIsVerticalPlayerOpen(false)
  }, [])

  return (
    <>
      <motion.button
        className={`
          inline-flex items-center justify-center
          ${sizeClasses[size]} 
          ${variantClasses[variant]}
          rounded-full transition-all duration-200
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openVerticalPlayer}
        aria-label="Open vertical music player"
        title="Stories"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </motion.button>

      {/* Vertical Music Player Modal */}
      <AnimatePresence>
        {isVerticalPlayerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999]"
          >
            <VerticalMusicPlayer
              tracks={mockVerticalTracks}
              initialIndex={0}
              onClose={closeVerticalPlayer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}