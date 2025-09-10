// Player Page - Dedicated Player Interface
// Full-page player experience at /player/:userId

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../context/AudioPlayerContext'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import EnhancedGlobalPlayer from './enhanced/EnhancedGlobalPlayer'
import GlobalContentService from '../../lib/globalContentService'

interface Track {
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

const PlayerPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { state, playTrack, addToQueue } = useAudioPlayer()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load global tracks for all users
  useEffect(() => {
    const loadTracks = async () => {
      try {
        setLoading(true)
        
        console.log('Loading global tracks for player...')
        
        // Load all streaming tracks from global content
        const { tracks: streamingTracks, error } = await GlobalContentService.getStreamingTracks(50)
        
        if (error) {
          console.error('Error loading global tracks:', error)
          setError('Failed to load global music library')
          return
        }
        
        console.log(`Loaded ${streamingTracks.length} tracks for player`)
        
        if (streamingTracks.length === 0) {
          setError('No music available - the global library is empty')
          return
        }

        // Convert to Track format
        const playerTracks: Track[] = streamingTracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          artistId: track.artistId,
          audioUrl: track.audioUrl,
          duration: track.duration,
          albumArt: track.albumArt,
          audioFeatures: track.audioFeatures,
          moodTags: track.moodTags
        }))

        setTracks(playerTracks)
        
      } catch (error) {
        console.error('Error loading global tracks:', error)
        setError('Failed to load player')
      } finally {
        setLoading(false)
      }
    }

    loadTracks()
  }, [])

  // Auto-play first track if none is currently playing
  useEffect(() => {
    if (tracks.length > 0 && !state.currentTrack) {
      playTrack(tracks[0])
      addToQueue(tracks.slice(1))
    }
  }, [tracks, state.currentTrack, playTrack, addToQueue])

  const handleTrackSelect = (track: Track, index: number) => {
    playTrack(track)
    // Add remaining tracks to queue
    const remainingTracks = [...tracks.slice(index + 1), ...tracks.slice(0, index)]
    addToQueue(remainingTracks)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-4xl"
            >
              🎵
            </motion.div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading Player...</h3>
          <p className="text-gray-400">Getting your music ready</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">🎵</div>
          <h3 className="text-2xl font-bold text-white mb-4">{error}</h3>
          <p className="text-gray-400 mb-8">
            {error.includes('log in') 
              ? 'You need to be logged in to access your personal music library.'
              : 'Upload some tracks to get started with your personal music experience!'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-gray-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
            >
              Go Home
            </button>
            {!error.includes('log in') && user && (
              <button
                onClick={() => navigate('/upload')}
                className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors"
              >
                Upload Music
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-24">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to App</span>
          </button>
          
          <h1 className="text-2xl font-bold text-white">Music Player</h1>
          
          <div className="text-sm text-gray-400">
            {tracks.length} tracks
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Track Display */}
          {state.currentTrack && (
            <motion.div
              className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-bold text-white mb-4">Now Playing</h2>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-700 rounded-xl overflow-hidden">
                  {state.currentTrack.albumArt ? (
                    <img
                      src={state.currentTrack.albumArt}
                      alt={state.currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🎵
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{state.currentTrack.title}</h3>
                  <p className="text-gray-400">{state.currentTrack.artist}</p>
                  {state.currentTrack.moodTags && (
                    <div className="flex space-x-1 mt-2">
                      {state.currentTrack.moodTags.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-accent-yellow/20 text-accent-yellow text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Queue/Playlist */}
          <motion.div
            className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-bold text-white mb-4">Playlist</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tracks.map((track, index) => (
                <motion.button
                  key={track.id}
                  onClick={() => handleTrackSelect(track, index)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    state.currentTrack?.id === track.id
                      ? 'bg-accent-yellow/20 text-accent-yellow'
                      : 'text-white hover:bg-gray-700/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                    {track.albumArt ? (
                      <img
                        src={track.albumArt}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        🎵
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-sm opacity-70 truncate">{track.artist}</p>
                  </div>
                  {track.duration && (
                    <span className="text-sm opacity-70">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Keyboard shortcuts help */}
        <motion.div
          className="mt-8 bg-gray-800/20 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white font-semibold mb-3">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-gray-300"><kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> Play/Pause</div>
            <div className="text-gray-300"><kbd className="bg-gray-700 px-2 py-1 rounded">←/→</kbd> Previous/Next</div>
            <div className="text-gray-300"><kbd className="bg-gray-700 px-2 py-1 rounded">⌘/Ctrl + S</kbd> Shuffle</div>
            <div className="text-gray-300"><kbd className="bg-gray-700 px-2 py-1 rounded">⌘/Ctrl + L</kbd> Like</div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Global Player */}
      <EnhancedGlobalPlayer />
    </div>
  )
}

export default PlayerPage