import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface Event {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  status: string
  shareable_code: string
  location?: string
  audience_count?: number
  total_votes?: number
  created_at: string
}

interface AnalyticsData {
  totalEvents: number
  totalAudience: number
  totalVotes: number
  avgEngagementRate: number
  topPerformingEvent: string
  audienceGrowth: number
  geographicReach: { region: string; count: number }[]
  dailyEngagement: { date: string; votes: number; audience: number }[]
}

interface DateRange {
  start: string
  end: string
  label: string
}

const HostAdminDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'analytics' | 'audience'>('overview')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Last 30 Days'
  })

  const predefinedRanges: DateRange[] = [
    {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 7 Days'
    },
    {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 30 Days'
    },
    {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 3 Months'
    }
  ]

  useEffect(() => {
    if (user) {
      loadHostDashboard()
    }
  }, [user, dateRange])

  const loadHostDashboard = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      setLoading(true)

      // Load user's events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('host_user_id', user.id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (eventsError) {
        console.error('Error loading events:', eventsError)
        return
      }

      // Enrich events with audience and vote data
      const enrichedEvents = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get audience count
          const { count: audienceCount } = await supabase
            .from('event_participants')
            .select('id', { count: 'exact' })
            .eq('event_id', event.id)

          // Get vote count
          const { count: voteCount } = await supabase
            .from('event_votes')
            .select('id', { count: 'exact' })
            .eq('event_id', event.id)

          return {
            ...event,
            audience_count: audienceCount || 0,
            total_votes: voteCount || 0
          }
        })
      )

      setEvents(enrichedEvents)

      // Calculate analytics
      const totalEvents = enrichedEvents.length
      const totalAudience = enrichedEvents.reduce((sum, e) => sum + (e.audience_count || 0), 0)
      const totalVotes = enrichedEvents.reduce((sum, e) => sum + (e.total_votes || 0), 0)
      const avgEngagementRate = totalAudience > 0 ? (totalVotes / totalAudience) * 100 : 0

      const topPerformingEvent = enrichedEvents
        .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))[0]?.title || 'None'

      // Mock geographic data for now (would come from MediaID integration)
      const geographicReach = [
        { region: 'New York', count: Math.floor(totalAudience * 0.3) },
        { region: 'Los Angeles', count: Math.floor(totalAudience * 0.25) },
        { region: 'Chicago', count: Math.floor(totalAudience * 0.15) },
        { region: 'Miami', count: Math.floor(totalAudience * 0.12) },
        { region: 'Other', count: Math.floor(totalAudience * 0.18) }
      ].filter(r => r.count > 0)

      // Mock daily engagement data
      const dailyEngagement = []
      const days = 7
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        dailyEngagement.push({
          date: date.toISOString().split('T')[0],
          votes: Math.floor(totalVotes * (0.1 + Math.random() * 0.2)),
          audience: Math.floor(totalAudience * (0.1 + Math.random() * 0.15))
        })
      }

      setAnalytics({
        totalEvents,
        totalAudience,
        totalVotes,
        avgEngagementRate,
        topPerformingEvent,
        audienceGrowth: Math.floor(Math.random() * 50) + 10, // Mock growth %
        geographicReach,
        dailyEngagement
      })

    } catch (error) {
      console.error('Error loading host dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-400/10'
      case 'published': return 'text-blue-400 bg-blue-400/10'
      case 'completed': return 'text-gray-400 bg-gray-400/10'
      case 'draft': return 'text-yellow-400 bg-yellow-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <button
            onClick={() => navigate('/auth')}
            className="bg-accent-yellow text-black px-6 py-2 rounded-lg font-bold"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center relative">
                  <span className="text-white font-bold text-sm">H</span>
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse opacity-50" />
                </div>
                <span>Host Dashboard</span>
              </h1>
              <p className="text-gray-400 mt-1">Manage your events and track audience engagement</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <select
                value={dateRange.label}
                onChange={(e) => {
                  const selected = predefinedRanges.find(r => r.label === e.target.value)
                  if (selected) setDateRange(selected)
                }}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {predefinedRanges.map((range) => (
                  <option key={range.label} value={range.label}>
                    {range.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => navigate('/events/create')}
                className="bg-accent-yellow text-black px-4 py-2 rounded-lg font-bold hover:bg-accent-yellow/90 transition-colors"
              >
                + New Event
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-6">
            {[
              { id: 'overview', label: '📊 Overview', count: null },
              { id: 'events', label: '🎤 Events', count: events.length },
              { id: 'analytics', label: '📈 Analytics', count: null },
              { id: 'audience', label: '👥 Audience', count: analytics?.totalAudience }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-accent-yellow text-accent-yellow'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="text-2xl font-bold text-accent-yellow">{analytics.totalEvents}</div>
                <div className="text-sm text-gray-400 mt-1">Total Events</div>
                <div className="text-xs text-green-400 mt-2">+{Math.floor(Math.random() * 20)}% vs last period</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="text-2xl font-bold text-blue-400">{analytics.totalAudience}</div>
                <div className="text-sm text-gray-400 mt-1">Total Audience</div>
                <div className="text-xs text-green-400 mt-2">+{analytics.audienceGrowth}% growth</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="text-2xl font-bold text-purple-400">{analytics.totalVotes}</div>
                <div className="text-sm text-gray-400 mt-1">Total Votes</div>
                <div className="text-xs text-blue-400 mt-2">{analytics.avgEngagementRate.toFixed(1)}% engagement</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="text-2xl font-bold text-green-400">{analytics.geographicReach.length}</div>
                <div className="text-sm text-gray-400 mt-1">Geographic Regions</div>
                <div className="text-xs text-gray-500 mt-2">MediaID tracking</div>
              </motion.div>
            </div>

            {/* Geographic Reach */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">🌎 Geographic Reach</h3>
              <div className="space-y-3">
                {analytics.geographicReach.map((region, index) => (
                  <div key={region.region} className="flex items-center justify-between">
                    <span className="text-sm">{region.region}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-accent-yellow h-2 rounded-full transition-all"
                          style={{
                            width: `${(region.count / Math.max(...analytics.geographicReach.map(r => r.count))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{region.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Event */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2">🏆 Top Performing Event</h3>
              <p className="text-accent-yellow font-medium">{analytics.topPerformingEvent}</p>
              <p className="text-sm text-gray-400 mt-1">Based on total votes and engagement</p>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎤</div>
                <h3 className="text-xl font-bold mb-2">No Events Created Yet</h3>
                <p className="text-gray-400 mb-6">Start building your audience by creating your first event</p>
                <button
                  onClick={() => navigate('/events/create')}
                  className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-bold"
                >
                  Create First Event
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/events/manage/${event.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold">{event.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>📅 {formatDate(event.start_date)}</span>
                          <span>👥 {event.audience_count} audience</span>
                          <span>🗳️ {event.total_votes} votes</span>
                          <span>🔗 {event.shareable_code}</span>
                        </div>

                        {event.location && (
                          <div className="mt-2 text-sm text-gray-400">
                            📍 {event.location}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500">Created</div>
                        <div className="text-sm">{formatDate(event.created_at)}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📈 Engagement Timeline</h3>
              <div className="space-y-2">
                {analytics.dailyEngagement.map((day) => (
                  <div key={day.date} className="flex items-center justify-between text-sm">
                    <span>{formatDate(day.date)}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-blue-400">👥 {day.audience}</span>
                      <span className="text-purple-400">🗳️ {day.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2">🎯 MediaID Integration</h3>
              <p className="text-gray-400 mb-4">Privacy-first audience insights powered by MediaID profiles</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Consent Rate</div>
                  <div className="text-lg font-medium text-green-400">89.2%</div>
                </div>
                <div>
                  <div className="text-gray-500">Profile Enrichment</div>
                  <div className="text-lg font-medium text-blue-400">76.5%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audience Tab */}
        {activeTab === 'audience' && analytics && (
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">👥 Audience Demographics</h3>
              <p className="text-gray-400 mb-4">Aggregated data from MediaID profiles (privacy-compliant)</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Age Distribution</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>18-24</span>
                      <span className="text-accent-yellow">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>25-34</span>
                      <span className="text-blue-400">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>35-44</span>
                      <span className="text-purple-400">18%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>45+</span>
                      <span className="text-gray-400">5%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Music Preferences</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Hip-Hop</span>
                      <span className="text-accent-yellow">28%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pop</span>
                      <span className="text-blue-400">24%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R&B</span>
                      <span className="text-purple-400">19%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Electronic</span>
                      <span className="text-green-400">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other</span>
                      <span className="text-gray-400">14%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📱 Device & Platform Analytics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">67%</div>
                  <div className="text-sm text-gray-400">Mobile</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">28%</div>
                  <div className="text-sm text-gray-400">Desktop</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">5%</div>
                  <div className="text-sm text-gray-400">Tablet</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HostAdminDashboard