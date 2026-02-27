import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface ScorecardMetrics {
  // Performance Metrics
  vocal_quality: number        // 1-5 stars
  stage_presence: number      // 1-5 stars
  musicality: number         // 1-5 stars
  crowd_engagement: number   // 1-5 stars
  originality: number        // 1-5 stars

  // Audience Connection
  emotional_impact: number    // 1-5 stars
  energy_level: number       // 1-5 stars
  authenticity: number       // 1-5 stars

  // Technical Aspects
  song_choice: number        // 1-5 stars
  production_quality: number // 1-5 stars

  // Overall Experience
  would_see_again: boolean
  would_recommend: boolean
  overall_rating: number     // 1-5 stars
}

interface ScorecardEvaluation {
  id: string
  event_id: string
  artist_id: string
  evaluator_id: string
  evaluator_name: string
  evaluator_type: 'audience' | 'artist' | 'host'
  metrics: ScorecardMetrics
  written_feedback?: string
  tags: string[]
  created_at: string
  is_public: boolean
}

interface ArtistScorecardProps {
  eventId: string
  artistId: string
  artistName: string
  currentUser?: {
    id: string
    name: string
    type: 'audience' | 'artist' | 'host'
  }
  onEvaluationComplete?: (evaluation: ScorecardEvaluation) => void
  showAggregateView?: boolean
}

const ArtistScorecardEvaluation: React.FC<ArtistScorecardProps> = ({
  eventId,
  artistId,
  artistName,
  currentUser,
  onEvaluationComplete,
  showAggregateView = false
}) => {
  const [currentEvaluation, setCurrentEvaluation] = useState<Partial<ScorecardMetrics>>({})
  const [writtenFeedback, setWrittenFeedback] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [aggregateData, setAggregateData] = useState<any>(null)

  const metricCategories = {
    performance: [
      { key: 'vocal_quality', label: 'Vocal Quality', icon: '🎤' },
      { key: 'stage_presence', label: 'Stage Presence', icon: '✨' },
      { key: 'musicality', label: 'Musicality', icon: '🎵' },
      { key: 'crowd_engagement', label: 'Crowd Engagement', icon: '👥' },
      { key: 'originality', label: 'Originality', icon: '🌟' }
    ],
    connection: [
      { key: 'emotional_impact', label: 'Emotional Impact', icon: '❤️' },
      { key: 'energy_level', label: 'Energy Level', icon: '⚡' },
      { key: 'authenticity', label: 'Authenticity', icon: '💯' }
    ],
    technical: [
      { key: 'song_choice', label: 'Song Choice', icon: '🎶' },
      { key: 'production_quality', label: 'Production Quality', icon: '🎚️' }
    ]
  }

  const predefinedTags = [
    'Powerful Voice', 'Great Energy', 'Unique Style', 'Crowd Favorite',
    'Technical Excellence', 'Emotional', 'Professional', 'Charismatic',
    'Innovative', 'Memorable', 'Authentic', 'Entertaining',
    'Promising', 'Experienced', 'Natural Talent', 'Show Stopper'
  ]

  useEffect(() => {
    if (showAggregateView) {
      loadAggregateData()
    }
    checkExistingEvaluation()
  }, [artistId, currentUser])

  const checkExistingEvaluation = async () => {
    if (!currentUser) return

    try {
      const { data } = await supabase
        .from('artist_scorecard_evaluations')
        .select('*')
        .eq('event_id', eventId)
        .eq('artist_id', artistId)
        .eq('evaluator_id', currentUser.id)
        .single()

      if (data) {
        setHasSubmitted(true)
        setCurrentEvaluation(data.metrics)
        setWrittenFeedback(data.written_feedback || '')
        setSelectedTags(data.tags || [])
      }
    } catch (error) {
      // No existing evaluation
    }
  }

  const loadAggregateData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_artist_aggregate_scorecard', {
          p_artist_id: artistId,
          p_event_id: eventId
        })

      if (data) {
        setAggregateData(data)
      }
    } catch (error) {
      console.error('Error loading aggregate data:', error)
    }
  }

  const updateMetric = (key: keyof ScorecardMetrics, value: number) => {
    setCurrentEvaluation(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const calculateOverallRating = () => {
    const metrics = Object.values(currentEvaluation).filter(v => typeof v === 'number') as number[]
    if (metrics.length === 0) return 0
    return Math.round((metrics.reduce((sum, val) => sum + val, 0) / metrics.length) * 10) / 10
  }

  const submitEvaluation = async () => {
    if (!currentUser) return

    setIsSubmitting(true)
    try {
      const overallRating = calculateOverallRating()

      const evaluationData = {
        event_id: eventId,
        artist_id: artistId,
        evaluator_id: currentUser.id,
        evaluator_name: currentUser.name,
        evaluator_type: currentUser.type,
        metrics: {
          ...currentEvaluation,
          overall_rating: overallRating,
          would_see_again: overallRating >= 4,
          would_recommend: overallRating >= 4
        },
        written_feedback: writtenFeedback,
        tags: selectedTags,
        is_public: true
      }

      const { data, error } = await supabase
        .from('artist_scorecard_evaluations')
        .upsert(evaluationData)
        .select()
        .single()

      if (!error && data) {
        setHasSubmitted(true)
        onEvaluationComplete?.(data)

        // Trigger AI analysis generation
        await generateAIInsights(artistId, eventId)
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateAIInsights = async (artistId: string, eventId: string) => {
    try {
      // Trigger AI analysis of all evaluations for this artist
      await supabase.rpc('generate_ai_artist_insights', {
        p_artist_id: artistId,
        p_event_id: eventId
      })
    } catch (error) {
      console.error('Error generating AI insights:', error)
    }
  }

  const renderStarRating = (
    metric: keyof ScorecardMetrics,
    label: string,
    icon: string,
    readonly: boolean = false
  ) => {
    const currentValue = currentEvaluation[metric] || 0

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-gray-400">({currentValue}/5)</span>
        </div>

        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <motion.button
              key={star}
              whileHover={{ scale: readonly ? 1 : 1.2 }}
              whileTap={{ scale: readonly ? 1 : 0.9 }}
              onClick={() => !readonly && updateMetric(metric, star)}
              disabled={readonly}
              className={`text-xl transition-colors ${
                star <= (currentValue as number)
                  ? 'text-yellow-400'
                  : 'text-gray-600 hover:text-gray-400'
              } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              ⭐
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  if (showAggregateView && aggregateData) {
    return (
      <div className="space-y-6">
        {/* AI-Powered Analytics Dashboard will be implemented here */}
        <div className="p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            🧠 AI-Powered Artist Analytics
            <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
              BETA
            </span>
          </h3>
          <p className="text-gray-300">
            Comprehensive evaluation analysis coming soon - this will include sentiment analysis,
            performance trends, and shareable digital memorabilia generation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Evaluate {artistName}</h2>
        <p className="text-gray-400">
          Your detailed feedback helps artists improve and creates valuable insights
        </p>
        {hasSubmitted && (
          <div className="mt-2 px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-lg">
            <span className="text-green-400 text-sm">✓ Evaluation submitted! You can update it below.</span>
          </div>
        )}
      </div>

      {/* Scorecard Categories */}
      <div className="space-y-6">
        {/* Performance Metrics */}
        <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
          <h3 className="font-bold mb-4 flex items-center">
            🎭 Performance Quality
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricCategories.performance.map(({ key, label, icon }) => (
              <div key={key}>
                {renderStarRating(key as keyof ScorecardMetrics, label, icon)}
              </div>
            ))}
          </div>
        </div>

        {/* Audience Connection */}
        <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
          <h3 className="font-bold mb-4 flex items-center">
            💝 Audience Connection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricCategories.connection.map(({ key, label, icon }) => (
              <div key={key}>
                {renderStarRating(key as keyof ScorecardMetrics, label, icon)}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Aspects */}
        <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
          <h3 className="font-bold mb-4 flex items-center">
            🎚️ Technical Excellence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricCategories.technical.map(({ key, label, icon }) => (
              <div key={key}>
                {renderStarRating(key as keyof ScorecardMetrics, label, icon)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Rating Display */}
      <div className="text-center p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50 rounded-lg">
        <h3 className="font-bold mb-2">Overall Rating</h3>
        <div className="text-4xl font-bold text-yellow-400 mb-2">
          {calculateOverallRating()}/5
        </div>
        <div className="flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className={`text-2xl ${
                star <= calculateOverallRating() ? 'text-yellow-400' : 'text-gray-600'
              }`}
            >
              ⭐
            </span>
          ))}
        </div>
      </div>

      {/* Tags Selection */}
      <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
        <h3 className="font-bold mb-4">🏷️ Tags & Descriptors</h3>
        <div className="flex flex-wrap gap-2">
          {predefinedTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Written Feedback */}
      <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
        <h3 className="font-bold mb-4">💬 Written Feedback</h3>
        <textarea
          value={writtenFeedback}
          onChange={(e) => setWrittenFeedback(e.target.value)}
          placeholder="Share your thoughts, suggestions, or specific highlights from the performance..."
          rows={4}
          className="w-full p-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none resize-none"
          maxLength={1000}
        />
        <div className="text-xs text-gray-400 mt-2">
          {writtenFeedback.length}/1000 characters
        </div>
      </div>

      {/* Submit Button */}
      {currentUser && (
        <div className="text-center">
          <button
            onClick={submitEvaluation}
            disabled={isSubmitting || Object.keys(currentEvaluation).length === 0}
            className={`px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
              Object.keys(currentEvaluation).length > 0
                ? 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span>Submitting...</span>
              </span>
            ) : hasSubmitted ? (
              'Update Evaluation'
            ) : (
              'Submit Evaluation'
            )}
          </button>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="text-center text-xs text-gray-500">
        Your evaluation will be used to generate AI insights for the artist and may be included
        in aggregate analytics. Individual evaluations remain anonymous unless you choose to make them public.
      </div>
    </div>
  )
}

export default ArtistScorecardEvaluation