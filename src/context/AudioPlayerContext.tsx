// Global Audio Player Context
// Provides centralized state management for audio playback across the entire app

import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react'
import { listeningHistoryService, trackPlay } from '../lib/listeningHistory'
import { useAuth } from '../hooks/useAuth'

// Types for the audio player
export interface Track {
  id: string
  title: string
  artist: string
  artistId: string
  audioUrl: string
  duration?: number
  albumArt?: string
  waveformData?: number[]
  audioFeatures?: {
    bpm?: number
    key?: string
    mode?: string
    energy?: number
    valence?: number
    danceability?: number
  }
  moodTags?: {
    tags: string[]
    confidence: number
  }
}

export interface PlayerState {
  // Current track and playback
  currentTrack: Track | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  
  // Queue management
  queue: Track[]
  queueIndex: number
  history: Track[]
  recentTracks?: Track[]
  
  // Player modes
  shuffleMode: boolean
  repeatMode: 'none' | 'track' | 'queue'
  
  // UI state
  isExpanded: boolean
  showLyrics: boolean
  showVisualizer: boolean
  
  // Navigation capabilities
  canSeekNext: boolean
  canSeekPrevious: boolean
  
  // Social features
  isLiked: boolean
  playCount: number
}

type PlayerAction = 
  | { type: 'PLAY_TRACK'; payload: Track }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'ADD_TO_QUEUE'; payload: Track[] }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'SET_REPEAT_MODE'; payload: 'none' | 'track' | 'queue' }
  | { type: 'TOGGLE_EXPANDED' }
  | { type: 'TOGGLE_LYRICS' }
  | { type: 'TOGGLE_VISUALIZER' }
  | { type: 'TOGGLE_LIKE' }
  | { type: 'SEEK_TO'; payload: number }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'UPDATE_RECENT_TRACKS'; payload: Track[] }

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  queue: [],
  queueIndex: 0,
  history: [],
  recentTracks: [],
  shuffleMode: false,
  repeatMode: 'none',
  isExpanded: false,
  showLyrics: false,
  showVisualizer: true,
  canSeekNext: false,
  canSeekPrevious: false,
  isLiked: false,
  playCount: 0
}

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY_TRACK':
      const newHistory = state.currentTrack && state.currentTrack.id !== action.payload.id
        ? [state.currentTrack, ...state.history].slice(0, 50) // Keep last 50 tracks
        : state.history
      return {
        ...state,
        currentTrack: action.payload,
        isPlaying: true,
        isLoading: true,
        currentTime: 0,
        history: newHistory,
        recentTracks: newHistory.slice(0, 10), // Keep last 10 for UI
        canSeekNext: state.queue.length > 0,
        canSeekPrevious: newHistory.length > 0
      }
      
    case 'TOGGLE_PLAY':
      return {
        ...state,
        isPlaying: !state.isPlaying
      }
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
      
    case 'UPDATE_TIME':
      return {
        ...state,
        currentTime: action.payload
      }
      
    case 'SET_DURATION':
      return {
        ...state,
        duration: action.payload
      }
      
    case 'SET_VOLUME':
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload)),
        isMuted: action.payload === 0
      }
      
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted
      }
      
    case 'NEXT_TRACK':
      if (state.queue.length === 0) return state
      
      let nextIndex = state.queueIndex + 1
      if (nextIndex >= state.queue.length) {
        nextIndex = state.repeatMode === 'queue' ? 0 : state.queueIndex
      }
      
      return {
        ...state,
        queueIndex: nextIndex,
        currentTrack: state.queue[nextIndex] || state.currentTrack,
        currentTime: 0,
        isLoading: true
      }
      
    case 'PREVIOUS_TRACK':
      if (state.queue.length === 0) return state
      
      let prevIndex = state.queueIndex - 1
      if (prevIndex < 0) {
        prevIndex = state.repeatMode === 'queue' ? state.queue.length - 1 : 0
      }
      
      return {
        ...state,
        queueIndex: prevIndex,
        currentTrack: state.queue[prevIndex] || state.currentTrack,
        currentTime: 0,
        isLoading: true
      }
      
    case 'ADD_TO_QUEUE':
      return {
        ...state,
        queue: [...state.queue, ...action.payload]
      }
      
    case 'REMOVE_FROM_QUEUE':
      const newQueue = state.queue.filter((_, index) => index !== action.payload)
      return {
        ...state,
        queue: newQueue,
        queueIndex: action.payload <= state.queueIndex ? Math.max(0, state.queueIndex - 1) : state.queueIndex
      }
      
    case 'TOGGLE_SHUFFLE':
      return {
        ...state,
        shuffleMode: !state.shuffleMode
      }
      
    case 'SET_REPEAT_MODE':
      return {
        ...state,
        repeatMode: action.payload
      }
      
    case 'TOGGLE_EXPANDED':
      return {
        ...state,
        isExpanded: !state.isExpanded
      }
      
    case 'TOGGLE_LYRICS':
      return {
        ...state,
        showLyrics: !state.showLyrics
      }
      
    case 'TOGGLE_VISUALIZER':
      return {
        ...state,
        showVisualizer: !state.showVisualizer
      }
      
    case 'TOGGLE_LIKE':
      return {
        ...state,
        isLiked: !state.isLiked
      }
      
    case 'SEEK_TO':
      return {
        ...state,
        currentTime: action.payload
      }
      
    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.payload
      }
      
    case 'UPDATE_RECENT_TRACKS':
      return {
        ...state,
        recentTracks: action.payload
      }
      
    default:
      return state
  }
}

// Context interface
interface AudioPlayerContextType {
  state: PlayerState
  dispatch: React.Dispatch<PlayerAction>
  audioRef: React.RefObject<HTMLAudioElement>
  
  // Helper functions
  playTrack: (track: Track) => void
  togglePlay: () => void
  nextTrack: () => void
  previousTrack: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  addToQueue: (tracks: Track[]) => void
  clearQueue: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null)

// Provider component
export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { user } = useAuth()
  const playStartTimeRef = useRef<number | null>(null)
  const currentSessionRef = useRef<string | null>(null)

  // Helper functions
  const playTrack = async (track: Track) => {
    dispatch({ type: 'PLAY_TRACK', payload: track })
    
    // Start listening session if user is authenticated
    if (user && !currentSessionRef.current) {
      try {
        const sessionId = await listeningHistoryService.startSession(
          user.id,
          'web',
          navigator.userAgent,
          'global_player'
        )
        currentSessionRef.current = sessionId
      } catch (error) {
        console.warn('Failed to start listening session:', error)
      }
    }
    
    // Track play start time
    playStartTimeRef.current = Date.now()
  }

  const togglePlay = async () => {
    if (audioRef.current) {
      if (state.isPlaying) {
        // Track listening event before pausing
        await trackListeningEvent('paused')
        audioRef.current.pause()
      } else {
        audioRef.current.play()
        // Reset play start time when resuming
        playStartTimeRef.current = Date.now()
      }
    }
    dispatch({ type: 'TOGGLE_PLAY' })
  }

  const nextTrack = async () => {
    // Track current song before changing
    await trackListeningEvent('played')
    dispatch({ type: 'NEXT_TRACK' })
  }

  const previousTrack = async () => {
    // Track current song before changing
    await trackListeningEvent('played')
    dispatch({ type: 'PREVIOUS_TRACK' })
  }

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
    dispatch({ type: 'SEEK_TO', payload: time })
  }

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    dispatch({ type: 'SET_VOLUME', payload: volume })
  }

  const addToQueue = (tracks: Track[]) => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: tracks })
  }

  const clearQueue = () => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: [] })
  }

  // Load recent tracks from listening history
  const refreshRecentTracks = async () => {
    if (!user) return
    
    try {
      const history = await listeningHistoryService.getListeningHistory(user.id, undefined, 10)
      const recentTracks = history.map(entry => ({
        id: entry.content_id,
        title: entry.content_title,
        artist: entry.content_artist || 'Unknown Artist',
        artistId: 'unknown',
        audioUrl: '', // Would need to resolve from content_id
        albumArt: entry.artwork_url,
        duration: entry.total_duration_seconds
      }))
      
      dispatch({ type: 'UPDATE_RECENT_TRACKS', payload: recentTracks })
    } catch (error) {
      console.warn('Failed to refresh recent tracks:', error)
    }
  }

  // Track listening events
  const trackListeningEvent = async (eventType: 'played' | 'paused' | 'completed' = 'played') => {
    if (!user || !state.currentTrack || !playStartTimeRef.current) return
    
    const currentTime = Date.now()
    const playDuration = Math.floor((currentTime - playStartTimeRef.current) / 1000)
    
    try {
      await trackPlay({
        userId: user.id,
        contentId: state.currentTrack.id,
        contentTitle: state.currentTrack.title,
        contentArtist: state.currentTrack.artist,
        contentType: 'music',
        durationSeconds: playDuration,
        totalDuration: state.currentTrack.duration,
        context: 'global_player'
      })
      
      console.log(`🎵 Tracked ${eventType} event for: ${state.currentTrack.title} (${playDuration}s)`)
      
      // Refresh recent tracks after tracking
      if (eventType === 'completed' || eventType === 'played') {
        await refreshRecentTracks()
      }
    } catch (error) {
      console.warn('Failed to track listening event:', error)
    }
    
    // Reset play start time for next tracking
    if (eventType === 'completed' || eventType === 'paused') {
      playStartTimeRef.current = null
    }
  }

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadStart = () => dispatch({ type: 'SET_LOADING', payload: true })
    const handleCanPlay = () => dispatch({ type: 'SET_LOADING', payload: false })
    const handleLoadedMetadata = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration })
    }
    const handleTimeUpdate = () => {
      dispatch({ type: 'UPDATE_TIME', payload: audio.currentTime })
    }
    const handleEnded = async () => {
      // Track listening event when track ends
      await trackListeningEvent('completed')
      
      if (state.repeatMode === 'track') {
        audio.currentTime = 0
        audio.play()
      } else {
        nextTrack()
      }
    }

    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [state.repeatMode])

  // Format detection function
  const detectAudioFormat = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  // Check browser format support
  const checkFormatSupport = (): void => {
    const audio = new Audio()
    const formats = {
      mp3: audio.canPlayType('audio/mpeg'),
      wav: audio.canPlayType('audio/wav'),
      flac: audio.canPlayType('audio/flac'),
      m4a: audio.canPlayType('audio/mp4'),
      ogg: audio.canPlayType('audio/ogg')
    }
    console.log('🎼 Browser audio format support:', formats)
  }

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && state.currentTrack) {
      const format = detectAudioFormat(state.currentTrack.audioUrl)
      console.log(`🎵 Loading track: ${state.currentTrack.title}`)
      console.log(`🎵 Audio URL: ${state.currentTrack.audioUrl}`)
      console.log(`🎼 Detected format: ${format}`)
      
      // Check format support on first load
      checkFormatSupport()
      
      audioRef.current.src = state.currentTrack.audioUrl
      audioRef.current.load()
      
      // Add error event listener
      const handleError = (e: Event) => {
        console.error(`❌ Audio load error for ${state.currentTrack?.title}:`, e)
        console.error(`❌ Audio element error:`, audioRef.current?.error)
        
        if (audioRef.current?.error) {
          const errorCode = audioRef.current.error.code
          const errorMessage = audioRef.current.error.message
          console.error(`❌ Error Code: ${errorCode}`)
          console.error(`❌ Error Message: ${errorMessage}`)
          
          // MediaError codes:
          // 1 = MEDIA_ERR_ABORTED
          // 2 = MEDIA_ERR_NETWORK  
          // 3 = MEDIA_ERR_DECODE
          // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
          
          switch(errorCode) {
            case 1:
              console.error('❌ Media playback was aborted')
              break
            case 2:
              console.error('❌ Network error occurred while fetching media')
              break
            case 3:
              console.error('❌ Media decoding error - file might be corrupted')
              break
            case 4:
              const format = detectAudioFormat(state.currentTrack?.audioUrl || '')
              console.error('❌ Media format not supported by browser')
              console.error(`❌ Unsupported format: ${format}`)
              console.error('💡 Supported formats: MP3 (best), M4A, WAV, OGG')
              console.error('💡 Consider converting to MP3 for maximum compatibility')
              break
          }
        }
      }
      
      audioRef.current.addEventListener('error', handleError)
      audioRef.current.addEventListener('loadstart', () => console.log(`🎵 Load started for ${state.currentTrack?.title}`))
      audioRef.current.addEventListener('canplay', () => console.log(`✅ Can play ${state.currentTrack?.title}`))
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('error', handleError)
        }
      }
    }
  }, [state.currentTrack])

  // Separate useEffect for handling play/pause state changes
  useEffect(() => {
    if (audioRef.current && state.currentTrack) {
      if (state.isPlaying) {
        audioRef.current.play().catch(error => {
          console.error(`❌ Play failed for ${state.currentTrack?.title}:`, error)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [state.isPlaying, state.currentTrack])

  // Sync volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : state.volume
    }
  }, [state.volume, state.isMuted])

  // Load recent tracks from listening history
  useEffect(() => {
    const loadRecentTracks = async () => {
      if (!user) return
      
      try {
        const history = await listeningHistoryService.getListeningHistory(user.id, undefined, 10)
        const recentTracks = history.map(entry => ({
          id: entry.content_id,
          title: entry.content_title,
          artist: entry.content_artist || 'Unknown Artist',
          artistId: 'unknown',
          audioUrl: '', // Would need to resolve from content_id
          albumArt: entry.artwork_url,
          duration: entry.total_duration_seconds
        }))
        
        dispatch({ type: 'UPDATE_RECENT_TRACKS', payload: recentTracks })
      } catch (error) {
        console.warn('Failed to load recent tracks from listening history:', error)
      }
    }
    
    loadRecentTracks()
  }, [user])

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (currentSessionRef.current) {
        listeningHistoryService.endSession()
        currentSessionRef.current = null
      }
    }
  }, [])

  const contextValue: AudioPlayerContextType = {
    state,
    dispatch,
    audioRef,
    playTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    addToQueue,
    clearQueue
  }

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </AudioPlayerContext.Provider>
  )
}

// Hook to use the audio player context
export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider')
  }
  return context
}

export default AudioPlayerContext
