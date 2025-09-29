import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface EventInfo {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location?: string
  shareable_code: string
  host_user_id: string
  status: string
  cover_image?: string
}

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface EventVideo {
  id: string
  event_id: string
  title: string
  description?: string
  video_url: string
  thumbnail_url?: string
  uploaded_by: string
  upload_timestamp: string
  is_featured: boolean
}

interface CommunityMember {
  id: string
  name: string
  avatar?: string
  role: 'artist' | 'audience' | 'host'
  location?: string
  interests?: string[]
  joined_at: string
}

const PublicEventView: React.FC = () => {
  const { eventCode } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [eventVideos, setEventVideos] = useState<EventVideo[]>([])
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'community' | 'videos' | 'location'>('overview')
  const [isEventLive, setIsEventLive] = useState(false)
  const [isEventPast, setIsEventPast] = useState(false)

  useEffect(() => {
    if (eventCode) {
      loadEventData()
    }
  }, [eventCode])

  useEffect(() => {
    if (event) {
      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [event])

  const loadEventData = async () => {
    try {
      // Get event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('shareable_code', eventCode)
        .single()

      if (eventError || !eventData) {
        console.error('Event not found:', eventError)
        return
      }

      setEvent(eventData)

      // Load community members (artists + audience)
      await loadCommunityMembers(eventData.id)

      // Load event videos
      await loadEventVideos(eventData.id)

      updateCountdown()
    } catch (error) {
      console.error('Error loading event data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCommunityMembers = async (eventId: string) => {
    try {
      // Get artists
      const { data: artistsData } = await supabase
        .from('event_artist_prospects')
        .select('*')
        .eq('event_id', eventId)
        .eq('contact_status', 'confirmed')

      // Get audience members
      const { data: audienceData } = await supabase
        .from('event_audience_members')
        .select('*')
        .eq('event_id', eventId)

      const community: CommunityMember[] = [
        ...(artistsData || []).map((artist: any) => ({
          id: artist.id,
          name: artist.artist_name,
          role: 'artist' as const,
          location: 'Artist',
          interests: ['music', 'performance'],
          joined_at: artist.created_at
        })),
        ...(audienceData || []).map((member: any) => ({
          id: member.id,
          name: member.name,
          role: 'audience' as const,
          location: 'Fan',
          interests: ['music', 'events'],
          joined_at: member.registered_at
        }))
      ]

      setCommunityMembers(community)
    } catch (error) {
      console.error('Error loading community members:', error)
    }
  }

  const loadEventVideos = async (eventId: string) => {
    // Mock data for now - will connect to public-assets bucket later
    const mockVideos: EventVideo[] = [
      {
        id: '1',
        event_id: eventId,
        title: 'Event Announcement',
        description: 'Get ready for an amazing musical experience!',
        video_url: '/placeholder-video.mp4',
        thumbnail_url: '/placeholder-thumb.jpg',
        uploaded_by: 'Event Host',
        upload_timestamp: new Date().toISOString(),
        is_featured: true
      }
    ]
    setEventVideos(mockVideos)
  }

  const updateCountdown = () => {
    if (!event) return

    const startTime = new Date(event.start_date).getTime()
    const endTime = new Date(event.end_date).getTime()
    const now = new Date().getTime()

    if (now > endTime) {
      setIsEventPast(true)
      setIsEventLive(false)
    } else if (now >= startTime && now <= endTime) {
      setIsEventLive(true)
      setIsEventPast(false)
    } else {
      setIsEventLive(false)
      setIsEventPast(false)

      const timeDiff = startTime - now
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }
  }

  const handleJoinEvent = () => {
    if (isEventLive) {
      navigate(`/events/vote/${eventCode}`)
    } else {
      navigate(`/events/register/${eventCode}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-400">This event doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Countdown */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black/50 to-black"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16">

          {/* Event Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            {isEventLive && (
              <div className="bg-red-600 text-white px-6 py-2 rounded-full font-bold flex items-center">
                <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
                🔴 LIVE NOW
              </div>
            )}
            {isEventPast && (
              <div className="bg-gray-600 text-white px-6 py-2 rounded-full font-bold">
                📹 Event Concluded - Watch Highlights
              </div>
            )}
            {!isEventLive && !isEventPast && (
              <div className="bg-accent-yellow text-black px-6 py-2 rounded-full font-bold">
                🎵 Upcoming Event
              </div>
            )}
          </motion.div>

          {/* Event Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-accent-yellow to-orange-400 bg-clip-text text-transparent">
              {event.title}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">{event.description}</p>
            {event.location && (
              <p className="text-gray-400 mt-2 flex items-center justify-center">
                📍 {event.location}
              </p>
            )}
          </motion.div>

          {/* Countdown Timer */}
          {!isEventLive && !isEventPast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-300">Event Starts In:</h2>
              </div>
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                {[
                  { label: 'Days', value: countdown.days },
                  { label: 'Hours', value: countdown.hours },
                  { label: 'Minutes', value: countdown.minutes },
                  { label: 'Seconds', value: countdown.seconds }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    animate={{ scale: item.label === 'Seconds' ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 1, repeat: item.label === 'Seconds' ? Infinity : 0 }}
                    className="text-center"
                  >
                    <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-lg p-4">
                      <div className="text-3xl font-bold text-accent-yellow mb-1">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-400 uppercase">{item.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Join Event Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <button
              onClick={handleJoinEvent}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                isEventLive
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-accent-yellow hover:bg-accent-yellow/90 text-black'
              }`}
            >
              {isEventLive ? '🗳️ Vote Now' : isEventPast ? '📹 View Results' : '🎫 Register to Join'}
            </button>
          </motion.div>

          {/* Community Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
          >
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-2xl font-bold text-accent-yellow">
                {communityMembers.filter(m => m.role === 'artist').length}
              </div>
              <div className="text-sm text-gray-400">Artists</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {communityMembers.filter(m => m.role === 'audience').length}
              </div>
              <div className="text-sm text-gray-400">Audience</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{eventVideos.length}</div>
              <div className="text-sm text-gray-400">Videos</div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {new Date(event.start_date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-400">Date</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {(['overview', 'community', 'videos', 'location'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-accent-yellow text-accent-yellow'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Event Details</h3>
                  <div className="space-y-3">
                    <p><strong>Start:</strong> {new Date(event.start_date).toLocaleString()}</p>
                    <p><strong>End:</strong> {new Date(event.end_date).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{event.status}</span></p>
                    {event.location && <p><strong>Location:</strong> {event.location}</p>}
                  </div>
                </div>

                <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">How It Works</h3>
                  <div className="space-y-2 text-sm">
                    <p>🎫 Register to join the community</p>
                    <p>🗳️ Vote for your favorite artists when voting opens</p>
                    <p>📺 Watch videos and connect with other music lovers</p>
                    <p>🏆 See results and celebrate the winners</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h3 className="text-2xl font-bold">Community ({communityMembers.length})</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {communityMembers.map(member => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg text-center"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      {member.role === 'artist' ? '🎤' : member.role === 'host' ? '👑' : '🎵'}
                    </div>
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>

              {communityMembers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No community members yet. Be the first to join!</p>
                  <button
                    onClick={() => navigate(`/events/register/${eventCode}`)}
                    className="mt-4 bg-accent-yellow text-black px-6 py-2 rounded-lg font-medium"
                  >
                    Join Community
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Event Videos</h3>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                  📹 Upload Video
                </button>
              </div>

              <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
                <h4 className="font-bold mb-2">🚀 Video Upload System</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Store videos in public-assets bucket linked by event ID and host ID for community sharing
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>• Event highlights and behind-the-scenes</div>
                  <div>• Artist performances and interviews</div>
                  <div>• Community reactions and testimonials</div>
                  <div>• Sponsor content and announcements</div>
                </div>
              </div>

              {eventVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventVideos.map(video => (
                    <div key={video.id} className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-800 flex items-center justify-center">
                        <div className="text-4xl">📺</div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium mb-1">{video.title}</h4>
                        <p className="text-sm text-gray-400 mb-2">{video.description}</p>
                        <p className="text-xs text-gray-500">
                          By {video.uploaded_by} • {new Date(video.upload_timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📹</div>
                  <p className="text-gray-400 mb-4">No videos uploaded yet</p>
                  <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                    Upload First Video
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'location' && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h3 className="text-2xl font-bold">Location & Discovery</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <h4 className="text-xl font-semibold mb-4">📍 Event Location</h4>
                  <p className="text-lg text-accent-yellow mb-4">{event.location || 'Location TBD'}</p>
                  <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🗺️</div>
                      <p className="text-gray-400">Google Maps Integration</p>
                      <p className="text-xs text-gray-500">Coming Soon</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <h4 className="text-xl font-semibold mb-4">🔍 Discover Similar Events</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-black/50 rounded border border-gray-700">
                      <p className="font-medium">By Geography</p>
                      <p className="text-sm text-gray-400">Events near you</p>
                    </div>
                    <div className="p-3 bg-black/50 rounded border border-gray-700">
                      <p className="font-medium">By Interest</p>
                      <p className="text-sm text-gray-400">Music genres you love</p>
                    </div>
                    <div className="p-3 bg-black/50 rounded border border-gray-700">
                      <p className="font-medium">MediaID Preferences</p>
                      <p className="text-sm text-gray-400">Personalized recommendations</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PublicEventView