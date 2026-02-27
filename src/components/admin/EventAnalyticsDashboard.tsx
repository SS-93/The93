import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

interface AnalyticsData {
  totalVotes: number
  totalScores: number
  totalFeedback: number
  uniqueParticipants: number
  averageSessionDuration: number
  deviceBreakdown: { mobile: number; desktop: number }
  hourlyActivity: Array<{ hour: number; votes: number; scores: number }>
  artistPerformance: Array<{
    artist_name: string
    vote_count: number
    average_score: number
    total_ratings: number
    feedback_count: number
    sentiment_breakdown: { positive: number; negative: number; neutral: number }
  }>
  realtimeActivity: Array<{
    timestamp: string
    action_type: string
    artist_name: string
    participant_id: string
  }>
}

interface EventAnalyticsDashboardProps {
  eventId: string
  eventTitle: string
}

const EventAnalyticsDashboard: React.FC<EventAnalyticsDashboardProps> = ({
  eventId,
  eventTitle
}) => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | 'all'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadAnalytics()

    if (autoRefresh) {
      const interval = setInterval(loadAnalytics, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [eventId, selectedTimeframe, autoRefresh])

  const loadAnalytics = async () => {
    try {
      // Check if user is authorized (event host)
      const { data: eventData } = await supabase
        .from('events')
        .select('host_user_id')
        .eq('id', eventId)
        .single()

      if (!eventData || eventData.host_user_id !== user?.id) {
        console.error('Unauthorized access to analytics')
        return
      }

      const timeFilter = getTimeFilter()

      // Load comprehensive analytics
      const [
        votesData,
        scoresData,
        feedbackData,
        participantsData,
        analyticsData,
        artistData,
        realtimeData
      ] = await Promise.all([
        // Total votes
        supabase
          .from('event_votes')
          .select('id, created_at, participant_id')
          .eq('event_id', eventId)
          .eq('vote_type', 'vote')
          .gte('created_at', timeFilter),

        // Total scores
        supabase
          .from('event_scores')
          .select('id, created_at, participant_id, average_score')
          .eq('event_id', eventId)
          .gte('created_at', timeFilter),

        // Total feedback
        supabase
          .from('event_feedback')
          .select('id, created_at, participant_id, sentiment')
          .eq('event_id', eventId)
          .gte('created_at', timeFilter),

        // Unique participants
        supabase
          .from('event_votes')
          .select('participant_id')
          .eq('event_id', eventId)
          .gte('created_at', timeFilter),

        // Analytics data
        supabase
          .from('event_analytics')
          .select('session_data, timestamp, action_type')
          .eq('event_id', eventId)
          .gte('timestamp', timeFilter),

        // Artist performance
        supabase
          .from('event_artist_prospects')
          .select('id, artist_name, vote_count, average_score, total_ratings')
          .eq('event_id', eventId),

        // Real-time activity (last 50 actions)
        supabase
          .from('event_analytics')
          .select(`
            timestamp,
            action_type,
            participant_id,
            event_artist_prospects(artist_name)
          `)
          .eq('event_id', eventId)
          .order('timestamp', { ascending: false })
          .limit(50)
      ])

      // Process data
      const participantIds = participantsData.data?.map(v => v.participant_id) || []
      const uniqueParticipants = Array.from(new Set(participantIds)).length

      const sessionDurations = analyticsData.data?.map(a => a.session_data?.session_duration || 0) || []
      const averageSessionDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0

      const deviceBreakdown = analyticsData.data?.reduce((acc, item) => {
        const deviceType = item.session_data?.device_type || 'desktop'
        acc[deviceType as 'mobile' | 'desktop'] = (acc[deviceType as 'mobile' | 'desktop'] || 0) + 1
        return acc
      }, { mobile: 0, desktop: 0 }) || { mobile: 0, desktop: 0 }

      // Hourly activity
      const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        votes: votesData.data?.filter(v =>
          new Date(v.created_at).getHours() === hour
        ).length || 0,
        scores: scoresData.data?.filter(s =>
          new Date(s.created_at).getHours() === hour
        ).length || 0
      }))

      // Artist performance with feedback sentiment
      const artistPerformance = await Promise.all(
        (artistData.data || []).map(async (artist) => {
          const { data: feedbackForArtist } = await supabase
            .from('event_feedback')
            .select('sentiment')
            .eq('event_id', eventId)
            .eq('artist_id', artist.id)

          const sentimentBreakdown = feedbackForArtist?.reduce((acc, f) => {
            acc[f.sentiment as 'positive' | 'negative' | 'neutral'] += 1
            return acc
          }, { positive: 0, negative: 0, neutral: 0 }) || { positive: 0, negative: 0, neutral: 0 }

          return {
            artist_name: artist.artist_name,
            vote_count: artist.vote_count,
            average_score: artist.average_score || 0,
            total_ratings: artist.total_ratings || 0,
            feedback_count: feedbackForArtist?.length || 0,
            sentiment_breakdown: sentimentBreakdown
          }
        })
      )

      const processedAnalytics: AnalyticsData = {
        totalVotes: votesData.data?.length || 0,
        totalScores: scoresData.data?.length || 0,
        totalFeedback: feedbackData.data?.length || 0,
        uniqueParticipants,
        averageSessionDuration: Math.round(averageSessionDuration / 1000), // Convert to seconds
        deviceBreakdown,
        hourlyActivity,
        artistPerformance: artistPerformance.sort((a, b) => b.vote_count - a.vote_count),
        realtimeActivity: realtimeData.data?.map(activity => ({
          timestamp: activity.timestamp,
          action_type: activity.action_type,
          artist_name: (activity as any).event_artist_prospects?.artist_name || 'Unknown',
          participant_id: activity.participant_id
        })) || []
      }

      setAnalytics(processedAnalytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeFilter = () => {
    const now = new Date()
    switch (selectedTimeframe) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(0).toISOString() // All time
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getEngagementRate = () => {
    if (!analytics || analytics.uniqueParticipants === 0) return 0
    const totalActions = analytics.totalVotes + analytics.totalScores + analytics.totalFeedback
    return ((totalActions / analytics.uniqueParticipants) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <div>Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌</div>
          <div>Failed to load analytics data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent-yellow">{eventTitle} Analytics</h1>
            <p className="text-gray-400">Real-time insights and performance metrics</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timeframe Selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Auto-refresh Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh</span>
            </label>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Votes</p>
                <p className="text-3xl font-bold text-accent-yellow">{analytics.totalVotes}</p>
              </div>
              <div className="text-4xl">🗳️</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Scores</p>
                <p className="text-3xl font-bold text-blue-400">{analytics.totalScores}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unique Participants</p>
                <p className="text-3xl font-bold text-green-400">{analytics.uniqueParticipants}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Engagement Rate</p>
                <p className="text-3xl font-bold text-purple-400">{getEngagementRate()}%</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </motion.div>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Device Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-4">Device Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Mobile</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{analytics.deviceBreakdown.mobile}</span>
                  <span className="text-gray-400 text-sm">
                    ({((analytics.deviceBreakdown.mobile / (analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Desktop</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{analytics.deviceBreakdown.desktop}</span>
                  <span className="text-gray-400 text-sm">
                    ({((analytics.deviceBreakdown.desktop / (analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Average session: {formatDuration(analytics.averageSessionDuration)}
            </div>
          </motion.div>

          {/* Real-time Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-4">Live Activity Feed</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.realtimeActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      activity.action_type === 'vote' ? 'bg-yellow-400' :
                      activity.action_type === 'score' ? 'bg-blue-400' : 'bg-purple-400'
                    }`}></span>
                    <span className="text-gray-300">
                      {activity.action_type === 'vote' ? '🗳️' :
                       activity.action_type === 'score' ? '⭐' : '💬'} {activity.artist_name}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Artist Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold mb-4">Artist Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Artist</th>
                  <th className="py-3 px-4">Votes</th>
                  <th className="py-3 px-4">Avg Score</th>
                  <th className="py-3 px-4">Total Ratings</th>
                  <th className="py-3 px-4">Feedback</th>
                  <th className="py-3 px-4">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {analytics.artistPerformance.map((artist, index) => (
                  <tr key={artist.artist_name} className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' : 'text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{artist.artist_name}</td>
                    <td className="py-3 px-4">{artist.vote_count}</td>
                    <td className="py-3 px-4">
                      {artist.average_score > 0 ? artist.average_score.toFixed(1) : '--'}
                    </td>
                    <td className="py-3 px-4">{artist.total_ratings}</td>
                    <td className="py-3 px-4">{artist.feedback_count}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-1">
                        {artist.sentiment_breakdown.positive > 0 && (
                          <span className="bg-green-600 text-xs px-1 rounded">
                            +{artist.sentiment_breakdown.positive}
                          </span>
                        )}
                        {artist.sentiment_breakdown.negative > 0 && (
                          <span className="bg-red-600 text-xs px-1 rounded">
                            -{artist.sentiment_breakdown.negative}
                          </span>
                        )}
                        {artist.sentiment_breakdown.neutral > 0 && (
                          <span className="bg-gray-600 text-xs px-1 rounded">
                            ={artist.sentiment_breakdown.neutral}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default EventAnalyticsDashboard