import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface AIInsights {
  id: string
  artist_id: string
  event_id: string
  aggregate_scores: {
    overall_rating: number
    vocal_quality: number
    stage_presence: number
    crowd_engagement: number
    [key: string]: number
  }
  strengths: string[]
  improvement_areas: string[]
  sentiment_analysis: {
    positive_ratio: number
    neutral_ratio: number
    negative_ratio: number
    dominant_emotions: string[]
  }
  ai_summary: string
  ai_recommendations: string
  total_evaluations: number
  confidence_score: number
  generated_at: string
}

interface DigitalMemorabilia {
  id: string
  title: string
  description: string
  memorabilia_type: string
  content_data: any
  shareable_url: string
  view_count: number
  created_at: string
}

interface AIArtistAnalyticsDashboardProps {
  artistId: string
  artistName: string
  eventId: string
  eventName: string
}

const AIArtistAnalyticsDashboard: React.FC<AIArtistAnalyticsDashboardProps> = ({
  artistId,
  artistName,
  eventId,
  eventName
}) => {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [memorabilia, setMemorabilia] = useState<DigitalMemorabilia[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'memorabilia'>('overview')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [artistId, eventId])

  const loadAnalytics = async () => {
    try {
      // Load AI insights
      const { data: insightsData } = await supabase
        .from('artist_ai_insights')
        .select('*')
        .eq('artist_id', artistId)
        .eq('event_id', eventId)
        .single()

      if (insightsData) {
        setInsights(insightsData)
      }

      // Load digital memorabilia
      const { data: memorabiliaData } = await supabase
        .from('digital_memorabilia')
        .select('*')
        .eq('artist_id', artistId)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (memorabiliaData) {
        setMemorabilia(memorabiliaData)
      }

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewInsights = async () => {
    setGenerating(true)
    try {
      await supabase.rpc('generate_ai_artist_insights', {
        p_artist_id: artistId,
        p_event_id: eventId
      })

      await loadAnalytics()
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setGenerating(false)
    }
  }

  const shareMemorabiliaItem = async (memorabiliaId: string, shareableUrl: string) => {
    const fullUrl = `${window.location.origin}/memorabilia/${shareableUrl}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${artistName} - Performance Analytics`,
          text: `Check out ${artistName}'s performance insights from ${eventName}`,
          url: fullUrl
        })
      } catch (error) {
        navigator.clipboard.writeText(fullUrl)
      }
    } else {
      navigator.clipboard.writeText(fullUrl)
    }

    // Increment view count
    await supabase.rpc('increment_memorabilia_views', {
      memorabilia_id: memorabiliaId
    })
  }

  const renderMetricChart = (label: string, value: number, maxValue: number = 5, color: string = 'accent-yellow') => {
    const percentage = (value / maxValue) * 100

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold">{value.toFixed(1)}/{maxValue}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`bg-${color} h-2 rounded-full relative`}
          >
            <div className={`absolute right-0 top-0 h-2 w-2 bg-${color} rounded-full animate-pulse`} />
          </motion.div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-4"></div>
        <p>Loading AI analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">🧠 AI Artist Analytics</h2>
        <p className="text-gray-400">
          Powered by audience evaluations and machine learning insights for <strong>{artistName}</strong>
        </p>
        {insights && (
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{insights.total_evaluations} Evaluations</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>{Math.round(insights.confidence_score * 100)}% Confidence</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Updated {new Date(insights.generated_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {!insights ? (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-700/50 rounded-lg">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-4">No Analytics Yet</h3>
          <p className="text-gray-400 mb-6">
            AI insights will be generated once audience members start evaluating this artist
          </p>
          <button
            onClick={generateNewInsights}
            disabled={generating}
            className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8">
              {(['overview', 'detailed', 'memorabilia'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Overall Performance Score */}
                <div className="text-center p-8 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50 rounded-lg">
                  <div className="text-6xl font-bold text-yellow-400 mb-2">
                    {insights.aggregate_scores.overall_rating?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-lg font-semibold mb-2">Overall Performance Score</div>
                  <div className="flex justify-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= (insights.aggregate_scores.overall_rating || 0) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300">
                    Based on {insights.total_evaluations} audience evaluations
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                    <h3 className="text-lg font-bold mb-4">🎯 Performance Metrics</h3>
                    <div className="space-y-4">
                      {renderMetricChart('Vocal Quality', insights.aggregate_scores.vocal_quality || 0)}
                      {renderMetricChart('Stage Presence', insights.aggregate_scores.stage_presence || 0)}
                      {renderMetricChart('Crowd Engagement', insights.aggregate_scores.crowd_engagement || 0)}
                    </div>
                  </div>

                  <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                    <h3 className="text-lg font-bold mb-4">💡 AI Insights</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-green-400 mb-2">✅ Strengths</h4>
                        <ul className="text-sm space-y-1">
                          {insights.strengths.length > 0 ? insights.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span>•</span>
                              <span>{strength}</span>
                            </li>
                          )) : (
                            <li className="text-gray-400 italic">Analyzing performance strengths...</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-blue-400 mb-2">🎯 Growth Areas</h4>
                        <ul className="text-sm space-y-1">
                          {insights.improvement_areas.length > 0 ? insights.improvement_areas.map((area, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span>•</span>
                              <span>{area}</span>
                            </li>
                          )) : (
                            <li className="text-gray-400 italic">Identifying improvement opportunities...</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg">
                  <h3 className="text-lg font-bold mb-4">🧠 AI Performance Summary</h3>
                  <p className="text-gray-200 leading-relaxed">
                    {insights.ai_summary || 'Comprehensive AI analysis is being generated based on audience feedback and performance metrics...'}
                  </p>
                  {insights.ai_recommendations && (
                    <div className="mt-4 p-4 bg-black/30 rounded-lg">
                      <h4 className="font-medium text-purple-400 mb-2">🎯 AI Recommendations</h4>
                      <p className="text-sm text-gray-300">{insights.ai_recommendations}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Detailed Analytics Tab */}
            {activeTab === 'detailed' && (
              <motion.div
                key="detailed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">📈 Detailed Analytics Coming Soon</h3>
                  <p className="text-gray-400">
                    Advanced sentiment analysis, performance trends, and comparative metrics will be available here
                  </p>
                </div>
              </motion.div>
            )}

            {/* Digital Memorabilia Tab */}
            {activeTab === 'memorabilia' && (
              <motion.div
                key="memorabilia"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">🎭 Digital Memorabilia</h3>
                  <p className="text-gray-400">
                    Shareable digital memories and achievements from your performance
                  </p>
                </div>

                {memorabilia.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {memorabilia.map(item => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg cursor-pointer"
                        onClick={() => shareMemorabiliaItem(item.id, item.shareable_url)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                            <p className="text-sm text-gray-400">{item.description}</p>
                          </div>
                          <div className="text-2xl">
                            {item.memorabilia_type === 'performance_report' && '📊'}
                            {item.memorabilia_type === 'audience_highlights' && '🌟'}
                            {item.memorabilia_type === 'achievement_badge' && '🏆'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>👁️ {item.view_count} views</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="mt-4 p-3 bg-black/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-purple-400">Click to share</span>
                            <span className="text-xs text-gray-500">🔗 Shareable link</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                    <div className="text-4xl mb-4">🎭</div>
                    <h4 className="font-bold mb-2">No Memorabilia Yet</h4>
                    <p className="text-gray-400 mb-4">
                      Digital memorabilia will be generated as you receive more evaluations
                    </p>
                    <button
                      onClick={generateNewInsights}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Generate Memorabilia
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Update Button */}
          <div className="text-center">
            <button
              onClick={generateNewInsights}
              disabled={generating}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {generating ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </span>
              ) : (
                'Update Analytics'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AIArtistAnalyticsDashboard