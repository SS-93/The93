import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

// Types
interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    messageType?: 'vote' | 'command' | 'info' | 'error' | 'confirmation' | 'score' | 'feedback'
    voteConfirmed?: boolean
    artistId?: string
    score?: number
    feedbackType?: string
    command?: string
    styling?: {
      highlight?: boolean
      color?: string
      animation?: string
    }
  }
}

interface Event {
  id: string
  title: string
  description: string
  status: string
  max_votes_per_participant: number
  shareable_code: string
  start_date: string
  end_date: string
  voting_opens_at: string
  voting_closes_at: string
}

interface Artist {
  id: string
  artist_name: string
  bio?: string
  profile_image_url?: string
  vote_count: number
  contact_status: string
  average_score?: number
  total_ratings?: number
  performance_feedback?: {
    energy: number
    vocals: number
    stage_presence: number
    originality: number
    overall: number
  }
}

interface VotingSession {
  participantId: string
  votesRemaining: number
  votedArtists: string[]
  totalVotes: number
  sessionStarted: Date
  scoredArtists: string[]
  feedbackGiven: string[]
}

interface ScoreCategory {
  id: string
  key: string
  label: string
  icon: string
  description?: string
  weight?: number
}

interface ScoreCardTemplate {
  id: string
  name: string
  description: string
  categories: ScoreCategory[]
  platform_type: 'music' | 'food' | 'art' | 'film' | 'sports' | 'general'
  is_mobile_optimized: boolean
  max_score: number
}

interface ScoreCard {
  artistId: string
  scores: Record<string, number>
  templateId: string
  feedback: string
}

type PortalMode = 'chat' | 'scorecard' | 'feedback' | 'results'

const EnhancedVotingInterface: React.FC = () => {
  const { shareableCode } = useParams<{ shareableCode: string }>()

  // State
  const [event, setEvent] = useState<Event | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participantToken, setParticipantToken] = useState<string | null>(null)

  // Portal state
  const [portalMode, setPortalMode] = useState<PortalMode>('chat')
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [currentScoreCard, setCurrentScoreCard] = useState<ScoreCard | null>(null)

  // Template state
  const [scoreTemplate, setScoreTemplate] = useState<ScoreCardTemplate | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load score template function
  const loadScoreTemplate = async (templateId?: string) => {
    try {
      let template: ScoreCardTemplate

      if (templateId) {
        // Try to load custom template
        const { data: customTemplate, error } = await supabase
          .from('score_card_templates')
          .select('*')
          .eq('id', templateId)
          .single()

        if (error || !customTemplate) {
          // Fallback to default music template
          template = getDefaultTemplate()
        } else {
          template = {
            ...customTemplate,
            categories: Array.isArray(customTemplate.categories) ? customTemplate.categories : []
          }
        }
      } else {
        // Use default template
        template = getDefaultTemplate()
      }

      setScoreTemplate(template)
    } catch (error) {
      console.error('Error loading score template:', error)
      setScoreTemplate(getDefaultTemplate())
    }
  }

  const getDefaultTemplate = (): ScoreCardTemplate => {
    return {
      id: 'default-music',
      name: 'Music Performance',
      description: 'Professional music competition scoring',
      platform_type: 'music',
      is_mobile_optimized: true,
      max_score: 5,
      categories: [
        { id: 'energy', key: 'energy', label: 'Energy & Stage Performance', icon: '⚡', description: 'Stage presence and crowd engagement', weight: 1 },
        { id: 'vocals', key: 'vocals', label: 'Vocal Ability', icon: '🎵', description: 'Technical vocal skills and pitch', weight: 1.2 },
        { id: 'stage_presence', key: 'stage_presence', label: 'Stage Presence', icon: '🎭', description: 'Charisma and audience connection', weight: 1 },
        { id: 'originality', key: 'originality', label: 'Originality & Creativity', icon: '✨', description: 'Unique style and creative expression', weight: 1.1 },
        { id: 'overall', key: 'overall', label: 'Overall Performance', icon: '🏆', description: 'Complete performance evaluation', weight: 1.3 }
      ]
    }
  }

  // Get all artists function
  const getAllArtists = async (eventId: string): Promise<Artist[]> => {
    try {
      const { data: artistsData, error: artistsError } = await supabase
        .from('event_artist_prospects')
        .select(`
          id,
          artist_name,
          bio,
          profile_image_url,
          vote_count,
          contact_status,
          tags,
          host_notes
        `)
        .eq('event_id', eventId)
        .eq('contact_status', 'confirmed')
        .order('vote_count', { ascending: false })

      if (artistsError) {
        console.error('Error fetching artists:', artistsError)
        return []
      }

      return (artistsData || []).map((artist: any) => ({
        id: artist.id,
        artist_name: artist.artist_name || 'Unknown Artist',
        bio: artist.bio || 'No bio available',
        profile_image_url: artist.profile_image_url,
        vote_count: artist.vote_count || 0,
        contact_status: artist.contact_status,
        average_score: Math.random() * 2 + 3, // Mock data for demo
        total_ratings: Math.floor(Math.random() * 50) + 10,
        performance_feedback: {
          energy: Math.random() * 2 + 3,
          vocals: Math.random() * 2 + 3,
          stage_presence: Math.random() * 2 + 3,
          originality: Math.random() * 2 + 3,
          overall: Math.random() * 2 + 3
        }
      }))
    } catch (error) {
      console.error('Failed to get all artists:', error)
      return []
    }
  }

  // Initialize voting session
  useEffect(() => {
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    if (shareableCode) {
      initializeVotingSession()
    }

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [shareableCode])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateParticipantToken = () => {
    return `enhanced_voter_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  const addMessage = (type: ChatMessage['type'], content: string, metadata?: ChatMessage['metadata']) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type,
      content,
      timestamp: new Date(),
      metadata
    }

    setMessages(prev => [...prev, newMessage])
    return newMessage
  }

  const addBotMessage = (content: string, metadata?: ChatMessage['metadata']) => {
    return addMessage('bot', content, { ...metadata, messageType: 'info' })
  }

  const initializeVotingSession = async () => {
    try {
      setError(null)
      setLoading(true)

      // Handle test event
      if (shareableCode === 'test') {
        await initializeTestEvent()
        return
      }

      // Get event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('shareable_code', shareableCode)
        .in('status', ['published', 'live'])
        .single()

      if (eventError || !eventData) {
        setError('Event not found or not available for voting.')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Load score template
      await loadScoreTemplate(eventData.score_template_id || eventData.id)

      // Load all artists
      const allArtists = await getAllArtists(eventData.id)
      setArtists(allArtists)

      // Initialize session
      const token = localStorage.getItem(`enhanced_voter_${eventData.id}`) || generateParticipantToken()
      localStorage.setItem(`enhanced_voter_${eventData.id}`, token)
      setParticipantToken(token)

      // Check existing votes
      const { data: existingVotes } = await supabase
        .from('event_votes')
        .select('artist_id')
        .eq('event_id', eventData.id)
        .eq('participant_token', token)

      const votedArtists = existingVotes?.map(v => v.artist_id) || []

      setVotingSession({
        participantId: token,
        votesRemaining: Math.max(0, eventData.max_votes_per_participant - votedArtists.length),
        votedArtists,
        totalVotes: eventData.max_votes_per_participant,
        sessionStarted: new Date(),
        scoredArtists: [], // Track who user has scored
        feedbackGiven: []  // Track feedback given
      })

      setIsConnected(true)

      // Welcome messages
      addMessage('system', `🎤 Connected to ${eventData.title}`)
      addBotMessage(`Welcome to the enhanced voting experience! You can vote, score, and give feedback.`)

    } catch (error) {
      console.error('Failed to initialize voting session:', error)
      setError('Failed to load voting interface.')
    } finally {
      setLoading(false)
    }
  }

  const initializeTestEvent = async () => {
    const testEvent: Event = {
      id: 'test-event-123',
      title: 'The Voice - Live Finals',
      description: 'Vote for your favorite contestant',
      status: 'live',
      max_votes_per_participant: 5,
      shareable_code: 'test',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      voting_opens_at: new Date().toISOString(),
      voting_closes_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    }

    const testArtists: Artist[] = [
      {
        id: 'artist1',
        artist_name: 'Luna Starlight',
        bio: 'Soulful vocalist with electronic influences',
        vote_count: 127,
        contact_status: 'confirmed',
        average_score: 4.2,
        total_ratings: 34,
        performance_feedback: {
          energy: 4.5,
          vocals: 4.8,
          stage_presence: 3.9,
          originality: 4.1,
          overall: 4.2
        }
      },
      {
        id: 'artist2',
        artist_name: 'Neon Waves',
        bio: 'High-energy synthwave producer',
        vote_count: 203,
        contact_status: 'confirmed',
        average_score: 3.9,
        total_ratings: 45,
        performance_feedback: {
          energy: 4.9,
          vocals: 3.2,
          stage_presence: 4.1,
          originality: 4.3,
          overall: 3.9
        }
      },
      {
        id: 'artist3',
        artist_name: 'Midnight Echo',
        bio: 'Indie folk trio with haunting harmonies',
        vote_count: 89,
        contact_status: 'confirmed',
        average_score: 4.6,
        total_ratings: 28,
        performance_feedback: {
          energy: 3.8,
          vocals: 4.9,
          stage_presence: 4.2,
          originality: 4.7,
          overall: 4.6
        }
      },
      {
        id: 'artist4',
        artist_name: 'Digital Dreams',
        bio: 'Future bass collective with live instruments',
        vote_count: 156,
        contact_status: 'confirmed',
        average_score: 4.1,
        total_ratings: 52,
        performance_feedback: {
          energy: 4.6,
          vocals: 3.8,
          stage_presence: 4.2,
          originality: 4.4,
          overall: 4.1
        }
      }
    ]

    setEvent(testEvent)
    setArtists(testArtists)

    const token = generateParticipantToken()
    setParticipantToken(token)

    setVotingSession({
      participantId: token,
      votesRemaining: 5,
      votedArtists: [],
      totalVotes: 5,
      sessionStarted: new Date(),
      scoredArtists: [],
      feedbackGiven: []
    })

    setIsConnected(true)

    // Welcome messages
    addMessage('system', '🎤 Connected to The Voice - Live Finals')
    addBotMessage('🏆 Welcome to the enhanced competition experience!')
    addBotMessage('Vote, score performances, and give feedback to contestants. Click on artists or use commands below!')

    setLoading(false)
  }

  // Portal mode handlers
  const switchToScoreCard = (artist: Artist) => {
    setSelectedArtist(artist)
    setPortalMode('scorecard')
    // Initialize scores based on template categories
    const initialScores: Record<string, number> = {}
    if (scoreTemplate) {
      scoreTemplate.categories.forEach(category => {
        initialScores[category.key] = Math.ceil(scoreTemplate.max_score / 2) // Start at middle score
      })
    }

    setCurrentScoreCard({
      artistId: artist.id,
      scores: initialScores,
      templateId: scoreTemplate?.id || 'default',
      feedback: ''
    })
    addBotMessage(`📊 Scoring ${artist.artist_name} using ${scoreTemplate?.name || 'default'} template!`)
  }

  const switchToFeedback = (artist: Artist) => {
    setSelectedArtist(artist)
    setPortalMode('feedback')
    addBotMessage(`💬 Leave feedback for ${artist.artist_name}`)
  }

  const submitScore = () => {
    if (!selectedArtist || !currentScoreCard) return

    // Update local state
    setVotingSession(prev => prev ? {
      ...prev,
      scoredArtists: [...prev.scoredArtists, selectedArtist.id]
    } : null)

    addBotMessage(`✅ Score submitted for ${selectedArtist.artist_name}!`, {
      messageType: 'confirmation',
      styling: { highlight: true, color: 'text-green-400' }
    })

    const totalCategories = scoreTemplate?.categories.length || 5
    const maxScore = scoreTemplate?.max_score || 5
    const avgScore = Object.values(currentScoreCard.scores).reduce((a, b) => a + b, 0) / totalCategories
    addBotMessage(`Your overall score: ${avgScore.toFixed(1)}/${maxScore}.0 ${maxScore <= 5 ? '⭐' : 'points'}`)

    setPortalMode('chat')
  }

  const castVote = async (artistId: string) => {
    if (!votingSession || votingSession.votesRemaining <= 0) return

    const artist = artists.find(a => a.id === artistId)
    if (!artist) return

    // Update local state
    setVotingSession(prev => prev ? {
      ...prev,
      votesRemaining: prev.votesRemaining - 1,
      votedArtists: [...prev.votedArtists, artistId]
    } : null)

    setArtists(prev => prev.map(a =>
      a.id === artistId ? { ...a, vote_count: a.vote_count + 1 } : a
    ))

    addBotMessage(`🗳️ Vote cast for ${artist.artist_name}!`, {
      messageType: 'confirmation',
      styling: { highlight: true, color: 'text-green-400' }
    })
  }

  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-600'}>
        ⭐
      </span>
    ))
  }

  const renderMobileArtistCard = (artist: Artist) => {
    const isVoted = votingSession?.votedArtists.includes(artist.id)
    const isScored = votingSession?.scoredArtists.includes(artist.id)

    return (
      <motion.div
        key={artist.id}
        whileTap={{ scale: 0.95 }}
        className={`flex-none w-16 text-center cursor-pointer transition-all ${
          isVoted ? 'bg-green-900/30' : 'bg-gray-800/50'
        } rounded-lg p-2 border ${
          isVoted ? 'border-green-500/50' : 'border-gray-600/50'
        }`}
        onClick={() => switchToScoreCard(artist)}
      >
        {/* Avatar */}
        <div className="w-12 h-12 bg-gray-700 rounded-lg mb-1 mx-auto overflow-hidden">
          {artist.profile_image_url ? (
            <img
              src={artist.profile_image_url}
              alt={artist.artist_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">
              🎤
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-xs font-medium text-white truncate mb-1">
          {artist.artist_name.split(' ')[0]}
        </div>

        {/* Quick Stats */}
        <div className="text-xs text-accent-yellow">
          {artist.vote_count}
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center space-x-1 mt-1">
          {isVoted && <span className="text-xs">✓</span>}
          {isScored && <span className="text-xs text-blue-400">★</span>}
        </div>
      </motion.div>
    )
  }

  const renderArtistCard = (artist: Artist) => {
    const isVoted = votingSession?.votedArtists.includes(artist.id)
    const isScored = votingSession?.scoredArtists.includes(artist.id)

    return (
      <motion.div
        key={artist.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-gray-800/50 border rounded-xl p-4 cursor-pointer transition-all ${
          isVoted ? 'border-green-500/50 bg-green-900/20' : 'border-gray-600/50 hover:border-accent-yellow/50'
        }`}
        onClick={() => setSelectedArtist(artist)}
      >
        {/* Artist Avatar */}
        <div className="w-full aspect-square bg-gray-700 rounded-xl mb-3 overflow-hidden">
          {artist.profile_image_url ? (
            <img
              src={artist.profile_image_url}
              alt={artist.artist_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              🎤
            </div>
          )}
        </div>

        {/* Artist Info */}
        <h3 className="font-bold text-white truncate mb-1">{artist.artist_name}</h3>

        {/* Star Rating */}
        <div className="flex items-center mb-2">
          {renderStarRating(artist.average_score || 0)}
          <span className="text-xs text-gray-400 ml-2">
            ({artist.total_ratings || 0})
          </span>
        </div>

        {/* Vote Count */}
        <div className="text-accent-yellow font-medium text-sm mb-3">
          {artist.vote_count} votes
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={(e) => { e.stopPropagation(); castVote(artist.id) }}
            disabled={!votingSession || votingSession.votesRemaining <= 0 || isVoted}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              isVoted
                ? 'bg-green-600 text-white cursor-not-allowed'
                : votingSession?.votesRemaining && votingSession.votesRemaining > 0
                ? 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isVoted ? '✓ Voted' : 'Vote'}
          </button>

          <div className="flex space-x-1">
            <button
              onClick={(e) => { e.stopPropagation(); switchToScoreCard(artist) }}
              className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
            >
              {isScored ? '✓ Scored' : 'Score'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); switchToFeedback(artist) }}
              className="flex-1 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
            >
              Feedback
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderScoreCard = () => {
    if (!selectedArtist || !currentScoreCard) return null

    const categories = [
      { key: 'energy', label: 'Energy & Stage Performance', icon: '⚡' },
      { key: 'vocals', label: 'Vocal Ability', icon: '🎵' },
      { key: 'stage_presence', label: 'Stage Presence', icon: '🎭' },
      { key: 'originality', label: 'Originality & Creativity', icon: '✨' },
      { key: 'overall', label: 'Overall Performance', icon: '🏆' }
    ]

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-accent-yellow">
            Score {selectedArtist.artist_name}
          </h3>
          <p className="text-gray-400 text-sm">Rate each category from 1-5 stars</p>
        </div>

        {categories.map(category => (
          <div key={category.key} className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium text-white">{category.label}</span>
            </div>

            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => setCurrentScoreCard(prev => prev ? {
                    ...prev,
                    scores: { ...prev.scores, [category.key]: score }
                  } : null)}
                  className={`w-8 h-8 rounded-full text-lg transition-all ${
                    currentScoreCard.scores[category.key as keyof typeof currentScoreCard.scores] >= score
                      ? 'text-yellow-400 hover:text-yellow-300'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => setPortalMode('chat')}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitScore}
            className="flex-1 bg-accent-yellow text-black py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
          >
            Submit Score
          </button>
        </div>
      </div>
    )
  }

  const renderFeedbackForm = () => {
    if (!selectedArtist) return null

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-accent-yellow">
            Feedback for {selectedArtist.artist_name}
          </h3>
          <p className="text-gray-400 text-sm">Share your thoughts on their performance</p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {['🔥 Fire!', '👏 Amazing', '💫 Unique', '❤️ Love it', '🎵 Great vocals', '⚡ High energy'].map(tag => (
              <button
                key={tag}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                onClick={() => addBotMessage(`You tagged ${selectedArtist.artist_name}: ${tag}`)}
              >
                {tag}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Write your feedback..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-yellow"
            rows={4}
          />

          <div className="flex space-x-3">
            <button
              onClick={() => setPortalMode('chat')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                addBotMessage(`✅ Feedback submitted for ${selectedArtist.artist_name}!`)
                setPortalMode('chat')
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Send Feedback
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderMainPortal = () => {
    switch (portalMode) {
      case 'scorecard':
        return renderScoreCard()
      case 'feedback':
        return renderFeedbackForm()
      case 'results':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-accent-yellow text-center">🏆 Live Results</h3>
            {artists.slice(0, 5).map((artist, index) => (
              <div key={artist.id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                <span className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{artist.artist_name}</div>
                  <div className="text-sm text-gray-400">{artist.vote_count} votes • {renderStarRating(artist.average_score || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'chat':
      default:
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start space-x-2 ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' :
                    message.type === 'system' ? 'justify-center' : 'flex-row'
                  }`}
                >
                  {message.type !== 'system' && (
                    <div className="text-lg flex-shrink-0 mt-1">
                      {message.type === 'user' ? '👤' : '🤖'}
                    </div>
                  )}

                  <div className={`max-w-[80%] p-3 rounded-2xl break-words ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : message.type === 'system'
                      ? 'bg-gray-800/50 text-gray-400 text-center text-sm rounded-full'
                      : 'bg-gray-700 text-white rounded-bl-md'
                  } ${message.metadata?.styling?.highlight ? 'ring-2 ring-green-400' : ''}`}>
                    <p className={message.metadata?.styling?.color || ''}>{message.content}</p>
                    <div className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <p>Loading enhanced voting experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-black text-white ${isMobile ? 'flex flex-col' : 'flex'}`}>
      {/* Left Sidebar - Cast/Artists - Mobile: Top bar, Desktop: Sidebar */}
      <div className={`${isMobile
        ? 'order-2 bg-gray-900/30 border-t border-gray-700 h-32 overflow-x-auto'
        : 'w-80 bg-gray-900/30 border-r border-gray-700 overflow-y-auto'
      }`}>
        <div className={`${isMobile ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center ${isMobile ? 'justify-center mb-2' : 'justify-between mb-4'}`}>
            <h2 className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-accent-yellow`}>
              {isMobile ? '🎤' : '🎤 Cast'}
            </h2>
            {!isMobile && (
              <div className="text-sm text-gray-400">{artists.length} artists</div>
            )}
          </div>

          <div className={`${isMobile ? 'flex space-x-2 overflow-x-auto pb-2' : 'space-y-3'}`}>
            {artists.map(artist => isMobile ? renderMobileArtistCard(artist) : renderArtistCard(artist))}
          </div>
        </div>
      </div>

      {/* Main Portal Area */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'order-1' : ''}`}>
        {/* Header */}
        <div className={`bg-gray-900/50 border-b border-gray-700 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-accent-yellow`}>
                {isMobile ? (event?.title || 'Voting') : (event?.title || 'Enhanced Voting')}
              </h1>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>
                {isConnected ? '🟢' : '🔴'}
                {!isMobile && (isConnected ? ' Live' : ' Offline')}
                {' • '}
                {portalMode === 'chat' ? (isMobile ? 'Chat' : 'Chat Mode') :
                 portalMode === 'scorecard' ? (isMobile ? 'Score' : 'Scoring Mode') :
                 portalMode === 'feedback' ? (isMobile ? 'Feedback' : 'Feedback Mode') :
                 (isMobile ? 'Results' : 'Results Mode')}
                {scoreTemplate && !isMobile && ` • ${scoreTemplate.name}`}
              </p>
            </div>
            {votingSession && (
              <div className="text-right">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-accent-yellow`}>
                  {votingSession.votesRemaining}
                </div>
                <div className="text-xs text-gray-400">votes left</div>
              </div>
            )}
          </div>
        </div>

        {/* Main Portal Content */}
        <div className="flex-1 p-4">
          {renderMainPortal()}
        </div>

        {/* Fixed Footer - Chat Input + Command Bubbles */}
        <div className={`bg-gray-900/50 border-t border-gray-700 ${isMobile ? 'p-3' : 'p-4'}`}>
          {/* Chat Input */}
          <div className={`flex ${isMobile ? 'space-x-2 mb-2' : 'space-x-3 mb-3'}`}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isMobile ? "Type command..." : "Type message or command..."}
              disabled={!isConnected}
              className={`flex-1 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-yellow ${
                isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
              }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addMessage('user', inputMessage)
                  setInputMessage('')
                }
              }}
            />
            <button
              disabled={!inputMessage.trim() || !isConnected}
              className={`bg-accent-yellow text-black rounded-full font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 ${
                isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'
              }`}
            >
              {isMobile ? '📤' : 'Send 📤'}
            </button>
          </div>

          {/* Command Bubbles */}
          <div className={`flex ${isMobile ? 'justify-between gap-1' : 'flex-wrap gap-2'}`}>
            {[
              { label: isMobile ? 'VOTE' : 'VOTE', mode: 'chat', icon: '🗳️' },
              { label: isMobile ? 'SCORE' : 'SCORE', mode: 'scorecard', icon: '⭐' },
              { label: isMobile ? 'TALK' : 'FEEDBACK', mode: 'feedback', icon: '💬' },
              { label: isMobile ? 'RESULTS' : 'RESULTS', mode: 'results', icon: '🏆' },
              { label: isMobile ? 'CHAT' : 'CHAT', mode: 'chat', icon: '💭' }
            ].map(({ label, mode, icon }) => (
              <button
                key={label}
                onClick={() => setPortalMode(mode as PortalMode)}
                className={`rounded-full font-medium transition-colors ${
                  isMobile
                    ? 'flex-1 py-2 px-1 text-xs'
                    : 'px-4 py-2 text-sm'
                } ${
                  portalMode === mode
                    ? 'bg-accent-yellow text-black'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <span className={isMobile ? 'block' : ''}>{icon}</span>
                {!isMobile && ' '}
                <span className={isMobile ? 'text-xs' : ''}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedVotingInterface