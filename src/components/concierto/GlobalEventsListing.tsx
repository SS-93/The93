import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface PublicEvent {
  id: string
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  status: 'published' | 'live' | 'completed'
  shareable_code: string
  participant_count: number
  artist_count: number
  created_at: string
}

const GlobalEventsListing: React.FC = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    loadPublicEvents()
  }, [searchTerm, statusFilter, locationFilter])

  const loadPublicEvents = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_events', {
        p_limit: 50,
        p_offset: 0,
        p_search: searchTerm || null,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_location: locationFilter || null
      })

      if (error) {
        console.error('Error loading events:', error)
        // Fallback to direct query if function doesn't exist
        const { data: fallbackData } = await supabase
          .from('events')
          .select('*')
          .in('status', ['published', 'live', 'completed'])
          .order('start_date', { ascending: true })
          .limit(50)

        if (fallbackData) {
          const formattedEvents = fallbackData.map(event => ({
            ...event,
            participant_count: 0,
            artist_count: 0
          }))
          setEvents(formattedEvents)
        }
      } else if (data) {
        setEvents(data)
      }

    } catch (error) {
      console.error('Error loading public events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white'
      case 'published': return 'bg-green-500 text-white'
      case 'completed': return 'bg-gray-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return '🔴'
      case 'published': return '🟢'
      case 'completed': return '⚪'
      default: return '🔵'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays < 7) {
      return `In ${diffDays} days`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleEventClick = (event: PublicEvent) => {
    navigate(`/events/view/${event.shareable_code}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <p>Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-accent-yellow to-orange-400 bg-clip-text text-transparent"
          >
            Discover Events
          </motion.h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find and join music events happening around the world. Vote for your favorite artists and be part of the community.
          </p>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4"
        >
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events by name or description..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
            />
          </div>

          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
            >
              <option value="all">All Events</option>
              <option value="live">🔴 Live Now</option>
              <option value="published">🟢 Upcoming</option>
              <option value="completed">⚪ Completed</option>
            </select>

            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location..."
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
            />
          </div>
        </motion.div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden cursor-pointer hover:border-accent-yellow/50 transition-all"
                onClick={() => handleEventClick(event)}
              >
                {/* Event Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-3">{event.description}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)} {event.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-300">
                      <span className="mr-2">📅</span>
                      <span>{formatDate(event.start_date)}</span>
                      {event.status === 'live' && (
                        <span className="ml-2 text-red-400 animate-pulse">• Live Now</span>
                      )}
                    </div>

                    {event.location && (
                      <div className="flex items-center text-sm text-gray-300">
                        <span className="mr-2">📍</span>
                        <span>{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <span className="mr-1">🎤</span>
                        <span>{event.artist_count} Artists</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">👥</span>
                        <span>{event.participant_count} Participants</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex space-x-2">
                    {event.status === 'live' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/events/vote/${event.shareable_code}`)
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        🗳️ Vote Now
                      </button>
                    )}

                    {event.status === 'published' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/events/register/${event.shareable_code}`)
                        }}
                        className="flex-1 bg-accent-yellow text-black hover:bg-accent-yellow/90 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        📝 Register
                      </button>
                    )}

                    {event.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/events/results/${event.shareable_code}`)
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        📊 View Results
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      👁️ View
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🎵</div>
            <h3 className="text-2xl font-bold mb-4">No Events Found</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || locationFilter
                ? 'Try adjusting your search filters to find more events.'
                : 'No public events are currently available. Check back soon!'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setLocationFilter('')
              }}
              className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center p-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg"
        >
          <h3 className="text-2xl font-bold mb-4">Host Your Own Event</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Create and manage your own music voting events. Engage your community,
            discover new talent, and build meaningful connections through music.
          </p>
          <button
            onClick={() => navigate('/events/create')}
            className="bg-accent-yellow text-black px-8 py-3 rounded-lg font-bold hover:bg-accent-yellow/90 transition-colors"
          >
            Create Event
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default GlobalEventsListing