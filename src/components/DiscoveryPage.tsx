// Discovery Page - Spotify-inspired fan discovery experience
// Three-panel layout: Library | Discovery | Feed

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAudioPlayer } from '../context/AudioPlayerContext'
import GlobalContentService from '../lib/globalContentService'
import { trackPlay } from '../lib/listeningHistory'

// Types for discovery system
interface PublishedTrack {
  id: string
  title: string
  artist_name: string
  artist_id: string
  audio_url: string
  album_art?: string
  duration?: number
  genre?: string
  mood_tags?: string[]
  plays_count?: number
  created_at: string
  is_published: boolean
}

interface FanLibrary {
  saved_tracks: string[]
  playlists: any[]
  followed_artists: string[]
  listening_history: string[]
}

interface DiscoveryShelf {
  id: string
  title: string
  description: string
  tracks: PublishedTrack[]
  type: 'personalized' | 'genre' | 'trending' | 'new_releases' | 'artist_spotlight'
}

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playTrack, addToQueue, state } = useAudioPlayer()
  
  // Discovery state
  const [discoveryShells, setDiscoveryShells] = useState<DiscoveryShelf[]>([])
  const [fanLibrary, setFanLibrary] = useState<FanLibrary>({
    saved_tracks: [],
    playlists: [],
    followed_artists: [],
    listening_history: []
  })
  const [selectedTrack, setSelectedTrack] = useState<PublishedTrack | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedTracksExpanded, setSavedTracksExpanded] = useState(true)

  useEffect(() => {
    loadDiscoveryData()
  }, [user])

  const loadDiscoveryData = async () => {
    try {
      setLoading(true)

      // Load streaming tracks using the proper backend service
      console.log('Loading streaming tracks from global content service...')
      const { tracks, error: tracksError } = await GlobalContentService.getStreamingTracks(50)

      if (tracksError) {
        console.error('Error loading streaming tracks:', tracksError)
        throw tracksError
      }

      console.log(`Loaded ${tracks.length} streaming tracks`)

      // Transform to PublishedTrack format
      const publishedTracks: PublishedTrack[] = tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist_name: track.artist,
        artist_id: track.artistId,
        audio_url: track.audioUrl,
        album_art: track.albumArt,
        duration: track.duration,
        genre: track.audioFeatures?.mode || 'Unknown',
        mood_tags: track.moodTags?.tags || [],
        plays_count: Math.floor(Math.random() * 10000), // Mock for now
        created_at: new Date().toISOString(),
        is_published: true
      }))

      // Create discovery shelves with unique tracks
      const usedTrackIds = new Set<string>()
      const getUniqueTrackSlice = (tracks: PublishedTrack[], count: number) => {
        const uniqueTracks = tracks.filter(track => !usedTrackIds.has(track.id))
        const selected = uniqueTracks.slice(0, count)
        selected.forEach(track => usedTrackIds.add(track.id))
        return selected
      }

      // Pre-sort tracks for different shelf types
      const shuffledTracks = shuffleArray([...publishedTracks])
      const newestTracks = [...publishedTracks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const trendingTracks = [...publishedTracks].sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
      const electronicTracks = publishedTracks.filter(t => t.genre?.toLowerCase().includes('electronic'))
      const hiphopTracks = publishedTracks.filter(t => t.genre?.toLowerCase().includes('hip'))

      const shelves: DiscoveryShelf[] = [
        {
          id: 'weekly-discovery',
          title: 'Weekly Discovery',
          description: 'Fresh tracks picked just for you',
          tracks: getUniqueTrackSlice(shuffledTracks, 10),
          type: 'personalized'
        },
        {
          id: 'new-releases',
          title: 'New Releases',
          description: 'Latest drops from artists',
          tracks: getUniqueTrackSlice(newestTracks, 8),
          type: 'new_releases'
        },
        {
          id: 'trending-now',
          title: 'Trending Now',
          description: 'What everyone\'s listening to',
          tracks: getUniqueTrackSlice(trendingTracks, 8),
          type: 'trending'
        },
        {
          id: 'electronic-vibes',
          title: 'Electronic Vibes',
          description: 'Electronic and experimental sounds',
          tracks: getUniqueTrackSlice(electronicTracks, 6),
          type: 'genre'
        },
        {
          id: 'hip-hop-heat',
          title: 'Hip-Hop Heat',
          description: 'Fresh beats and flows',
          tracks: getUniqueTrackSlice(hiphopTracks, 6),
          type: 'genre'
        }
      ]

      setDiscoveryShells(shelves.filter(shelf => shelf.tracks.length > 0))

      // Load fan library if user is logged in
      if (user) {
        loadFanLibrary()
      }

    } catch (error) {
      console.error('Error loading discovery data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFanLibrary = async () => {
    // TODO: Implement fan library loading from database
    // For now, use localStorage as temporary storage
    const savedLibrary = localStorage.getItem(`fanLibrary_${user?.id}`)
    if (savedLibrary) {
      setFanLibrary(JSON.parse(savedLibrary))
    }
  }

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleTrackPlay = async (track: PublishedTrack, shelf: DiscoveryShelf) => {
    // Convert to player format
    const playerTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist_name,
      artistId: track.artist_id,
      audioUrl: track.audio_url,
      duration: track.duration,
      albumArt: track.album_art
    }

    playTrack(playerTrack)

    // Explicitly track the listening event
    if (user) {
      try {
        await trackPlay({
          userId: user.id,
          contentId: track.id,
          contentTitle: track.title,
          contentArtist: track.artist_name,
          contentType: 'music',
          durationSeconds: 0, // Just started playing
          totalDuration: track.duration,
          context: 'discovery_page'
        })
        console.log('🎵 Tracked play event for:', track.title)
      } catch (error) {
        console.warn('Failed to track play event:', error)
      }
    }
    
    // Add remaining shelf tracks to queue
    const remainingTracks = shelf.tracks.filter(t => t.id !== track.id).map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist_name,
      artistId: t.artist_id,
      audioUrl: t.audio_url,
      duration: t.duration,
      albumArt: t.album_art
    }))
    addToQueue(remainingTracks)

    setSelectedTrack(track)
  }

  // Test function to add sample listening data
  const addTestListeningData = async () => {
    if (!user) return
    
    try {
      const testTracks = [
        { id: '550e8400-e29b-41d4-a716-446655440001', title: 'Test Song 1', artist: 'Test Artist 1' },
        { id: '550e8400-e29b-41d4-a716-446655440002', title: 'Test Song 2', artist: 'Test Artist 2' },
        { id: '550e8400-e29b-41d4-a716-446655440003', title: 'Test Song 3', artist: 'Test Artist 3' }
      ]

      for (const track of testTracks) {
        await trackPlay({
          userId: user.id,
          contentId: track.id,
          contentTitle: track.title,
          contentArtist: track.artist,
          contentType: 'music',
          durationSeconds: 180,
          totalDuration: 240,
          context: 'test_data'
        })
      }
      
      console.log('✅ Added test listening data')
      alert('Test data added! Check /recents page')
    } catch (error) {
      console.error('Failed to add test data:', error)
    }
  }

  const handleTrackSave = (trackId: string) => {
    if (!user) {
      navigate('/welcome')
      return
    }

    const newLibrary = {
      ...fanLibrary,
      saved_tracks: fanLibrary.saved_tracks.includes(trackId)
        ? fanLibrary.saved_tracks.filter(id => id !== trackId)
        : [...fanLibrary.saved_tracks, trackId]
    }
    
    setFanLibrary(newLibrary)
    localStorage.setItem(`fanLibrary_${user.id}`, JSON.stringify(newLibrary))
  }

  const isTrackSaved = (trackId: string) => {
    return fanLibrary.saved_tracks.includes(trackId)
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
          <h3 className="text-xl font-bold text-white mb-2">Loading Discovery...</h3>
          <p className="text-gray-400">Finding fresh music for you</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-white">Discover</h1>
            </div>
            
            {/* Global Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="What do you want to play?"
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-full px-4 py-2 pl-10 text-white placeholder-gray-400 focus:border-accent-yellow focus:outline-none"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Listening History Clock */}
              <button
                onClick={() => navigate('/recents')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all group"
                aria-label="View Listening History"
                title="View Listening History"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </button>
              
              {/* Track count */}
              <div className="text-gray-400 text-sm">
                {discoveryShells.reduce((total, shelf) => total + shelf.tracks.length, 0)} tracks available
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="max-w-7xl mx-auto flex">
        {/* Left Rail - Your Library */}
        <div className="w-64 p-6 border-r border-gray-800">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Your Library</h2>
            
            {user ? (
              <div className="space-y-3">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors cursor-pointer"
                  onClick={() => setSavedTracksExpanded(!savedTracksExpanded)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded flex items-center justify-center text-sm">
                    ♥
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Saved Tracks</div>
                    <motion.div
                      className="overflow-hidden"
                      animate={{
                        width: savedTracksExpanded ? 'auto' : '0px',
                        opacity: savedTracksExpanded ? 1 : 0
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="text-gray-400 text-sm whitespace-nowrap">{fanLibrary.saved_tracks.length} saved</div>
                    </motion.div>
                  </div>
                  <motion.div
                    className="text-gray-400 text-sm"
                    animate={{ rotate: savedTracksExpanded ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    −
                  </motion.div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-sm">
                    📝
                  </div>
                  <div>
                    <div className="text-white font-medium">Create Playlist</div>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3 mt-4">
                  <div className="text-gray-400 text-sm mb-2">Recently Played</div>
                  <div className="space-y-2">
                    {state.recentTracks?.slice(0, 3).map((track: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white cursor-pointer">
                        <div className="w-6 h-6 bg-gray-700 rounded overflow-hidden">
                          {track.albumArt && (
                            <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="truncate">{track.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="text-gray-400 mb-4">Sign in to save tracks and create playlists</div>
                <button
                  onClick={() => navigate('/welcome')}
                  className="bg-accent-yellow text-black px-4 py-2 rounded-full font-semibold hover:bg-accent-yellow/90 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas - Discovery */}
        <div className="flex-1 p-6">
          <div className="space-y-8">
            {discoveryShells.map((shelf, shelfIndex) => (
              <motion.div
                key={shelf.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shelfIndex * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{shelf.title}</h2>
                    <p className="text-gray-400">{shelf.description}</p>
                  </div>
                  <button className="text-gray-400 hover:text-white text-sm font-medium">
                    Show all
                  </button>
                </div>

                {/* Track Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {shelf.tracks.slice(0, 6).map((track) => (
                    <motion.div
                      key={track.id}
                      className="group relative bg-gray-800/30 hover:bg-gray-700/50 rounded-xl p-4 transition-all cursor-pointer"
                      whileHover={{ y: -4 }}
                      onClick={() => handleTrackPlay(track, shelf)}
                    >
                      {/* Album Art */}
                      <div className="relative mb-3 aspect-square rounded-lg overflow-hidden bg-gray-700">
                        {track.album_art ? (
                          <img
                            src={track.album_art}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            🎵
                          </div>
                        )}
                        
                        {/* Play Button Overlay */}
                        <motion.div
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={false}
                        >
                          <motion.button
                            className="w-12 h-12 bg-accent-yellow text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ▶️
                          </motion.button>
                        </motion.div>

                        {/* Save Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTrackSave(track.id)
                          }}
                          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isTrackSaved(track.id)
                              ? 'bg-green-500 text-white'
                              : 'bg-black/60 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isTrackSaved(track.id) ? '✓' : '+'}
                        </button>
                      </div>

                      {/* Track Info */}
                      <div className="space-y-1">
                        <h3 className="text-white font-semibold truncate">{track.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{track.artist_name}</p>
                        {track.mood_tags && track.mood_tags.length > 0 && (
                          <div className="flex space-x-1">
                            {track.mood_tags.slice(0, 2).map((tag, index) => (
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Rail - Your Feed */}
        <div className="w-80 p-6 border-l border-gray-800">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Your Feed</h2>
              
              {/* Now Playing Card */}
              {selectedTrack && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700"
                >
                  <div className="text-sm text-gray-400 mb-2">Now Playing</div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                      {selectedTrack.album_art && (
                        <img src={selectedTrack.album_art} alt={selectedTrack.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">{selectedTrack.title}</div>
                      <div className="text-gray-400 text-sm truncate">{selectedTrack.artist_name}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Activity Feed */}
              <div className="space-y-3">
                <div className="text-gray-400 text-sm">Recent Activity</div>
                
                {/* Mock activity items */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-accent-yellow rounded-full mt-2"></div>
                    <div>
                      <span className="text-white">New track from </span>
                      <span className="text-accent-yellow">Artist Name</span>
                      <div className="text-gray-400 text-xs mt-1">2 hours ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-gray-300">Weekly Discovery updated</span>
                      <div className="text-gray-400 text-xs mt-1">1 day ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-gray-300">3 new artists to discover</span>
                      <div className="text-gray-400 text-xs mt-1">2 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <div className="text-gray-400 text-sm mb-3">Recommended for you</div>
              <div className="space-y-3">
                {discoveryShells[0]?.tracks.slice(0, 3).map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/30 cursor-pointer transition-colors"
                    onClick={() => handleTrackPlay(track, discoveryShells[0])}
                  >
                    <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden">
                      {track.album_art && (
                        <img src={track.album_art} alt={track.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{track.title}</div>
                      <div className="text-gray-400 text-xs truncate">{track.artist_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscoveryPage