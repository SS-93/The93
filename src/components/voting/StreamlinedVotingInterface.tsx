import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import ArtistTradingCard from './ArtistTradingCard'

// Types
interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    messageType?: 'vote' | 'command' | 'info' | 'error' | 'confirmation' | 'score' | 'feedback'
    artistId?: string
    artistName?: string
    isClickable?: boolean
    styling?: { highlight?: boolean; color?: string }
  }
}

interface VotingArtist {
  id: string
  artist_name: string
  email?: string
  phone?: string
  instagram_handle?: string
  spotify_url?: string
  apple_music_url?: string
  bio?: string
  stage_name?: string
  performance_notes?: string
  contact_status?: string
  registration_token?: string
  vote_count: number
  final_placement?: number
  host_notes?: string
  tags?: string[]
  priority?: number
  created_at?: string
  updated_at?: string
  profile_image_url?: string
  average_score?: number
  total_ratings?: number
}

interface Event {
  id: string
  title: string
  description: string
  status: string
  shareable_code: string
  score_template_id?: string
}

interface VotingSession {
  eventId: string
  participantId: string
  memorableCode: string // Human-readable code like "LUNA-STAR-2024"
  votesRemaining: number
  maxVotes: number
  votedArtists: string[]
  scoredArtists: string[]
  sessionStart: number
  digitalTicket?: {
    eventName: string
    dateAttended: string
    totalInteractions: number
    favoriteArtists: string[]
  }
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
  categories: ScoreCategory[]
  max_score: number
  is_mobile_optimized: boolean
}

type ActiveMode = 'chat' | 'voting' | 'scoring' | 'feedback' | 'artist-gallery'

const StreamlinedVotingInterface: React.FC = () => {
  const { shareableCode } = useParams<{ shareableCode: string }>()

  // Core state
  const [event, setEvent] = useState<Event | null>(null)
  const [artists, setArtists] = useState<VotingArtist[]>([])
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // UI state
  const [activeMode, setActiveMode] = useState<ActiveMode>('artist-gallery')
  const [selectedArtist, setSelectedArtist] = useState<VotingArtist | null>(null)
  const [scoreTemplate, setScoreTemplate] = useState<ScoreCardTemplate | null>(null)
  const [currentScores, setCurrentScores] = useState<Record<string, number>>({})
  const [feedbackText, setFeedbackText] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [pendingVoteArtist, setPendingVoteArtist] = useState<VotingArtist | null>(null)
  const [hoveredArtist, setHoveredArtist] = useState<string | null>(null)
  const [selectedArtistForAction, setSelectedArtistForAction] = useState<VotingArtist | null>(null)
  const [showTradingCard, setShowTradingCard] = useState(false)
  const [tradingCardArtist, setTradingCardArtist] = useState<VotingArtist | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize
  useEffect(() => {
    if (shareableCode) {
      initializeVotingSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareableCode])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeVotingSession = async () => {
    try {
      setLoading(true)

      if (shareableCode === 'test') {
        await initializeTestData()
        return
      }

      // Get event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('shareable_code', shareableCode)
        .in('status', ['published', 'live'])
        .single()

      if (eventError || !eventData) {
        addBotMessage('❌ Event not found or not available for voting.')
        return
      }

      setEvent(eventData)
      await loadScoreTemplate() // MVP: No template ID needed
      await loadArtists(eventData.id)

      // Initialize session
      const session: VotingSession = {
        eventId: eventData.id,
        participantId: generateParticipantId(),
        memorableCode: generateMemorableCode(),
        votesRemaining: 5,
        maxVotes: 5,
        votedArtists: [],
        scoredArtists: [],
        sessionStart: Date.now(),
        digitalTicket: {
          eventName: eventData.title,
          dateAttended: new Date().toISOString(),
          totalInteractions: 0,
          favoriteArtists: []
        }
      }

      setVotingSession(session)
      setIsConnected(true)

      // Create participant session in database for tracking and data portability
      await createParticipantSession()

      addBotMessage(`🎤 Welcome to ${eventData.title}!`)
      addBotMessage(`Your memorable code: ${session.memorableCode} 🎫`)
      addBotMessage(`You have ${session.votesRemaining} votes. Use the commands below to interact.`)

      // Automatically show artists list when the interface loads
      setTimeout(() => {
        if (artists.length > 0) {
          showArtistsList()
        }
      }, 1000)

    } catch (error) {
      console.error('Error initializing:', error)
      addBotMessage('❌ Failed to connect to event.')
    } finally {
      setLoading(false)
    }
  }

  // MVP: Hardcoded scorecard system - no database templates needed
  const loadScoreTemplate = async () => {
    try {
      // Always use hardcoded music scorecard for MVP
      setScoreTemplate({
        id: 'mvp-music-scorecard',
        name: 'Music Performance',
        max_score: 5,
        is_mobile_optimized: true,
        categories: [
          { id: 'energy', key: 'energy', label: 'Energy', icon: '⚡', weight: 1 },
          { id: 'vocals', key: 'vocals', label: 'Vocals', icon: '🎵', weight: 1 },
          { id: 'stage_presence', key: 'stage_presence', label: 'Stage Presence', icon: '🎭', weight: 1 },
          { id: 'originality', key: 'originality', label: 'Originality', icon: '✨', weight: 1 },
          { id: 'overall', key: 'overall', label: 'Overall', icon: '🏆', weight: 1 }
        ]
      })
      console.log('✅ MVP: Loaded hardcoded music scorecard')
    } catch (error) {
      console.error('Error loading scorecard:', error)
    }
  }

  const loadArtists = async (eventId: string) => {
    try {
      // Load all artists regardless of contact status for voting
      const { data, error } = await supabase
        .from('event_artist_prospects')
        .select('*')
        .eq('event_id', eventId)
        .in('contact_status', ['confirmed', 'invited', 'registered']) // Include invited artists too
        .order('vote_count', { ascending: false })

      if (error) {
        console.error('❌ Error loading artists:', error)
        addBotMessage('❌ Could not load artists for this event.')
        return
      }

      if (!data || data.length === 0) {
        console.log('No artists found for this event')
        return
      }

      // Load scores for all artists to calculate their average ratings
      const { data: scoresData, error: scoresError } = await supabase
        .from('event_scores')
        .select('artist_id, average_score')
        .eq('event_id', eventId)

      if (scoresError) {
        console.error('❌ Error loading scores:', scoresError)
        // Continue without scores - this is not critical
      }

      // Calculate average scores and rating counts for each artist
      const artistsWithScores = data.map(artist => {
        const artistScores = scoresData?.filter(score => score.artist_id === artist.id) || []
        const averageScore = artistScores.length > 0
          ? artistScores.reduce((sum, score) => sum + (score.average_score || 0), 0) / artistScores.length
          : undefined

        return {
          ...artist,
          average_score: averageScore,
          total_ratings: artistScores.length
        }
      })

      console.log(`🎤 Loaded ${artistsWithScores.length} artists for event ${eventId}:`, artistsWithScores)
      setArtists(artistsWithScores)
    } catch (error) {
      console.error('💥 Fatal error loading artists:', error)
    }
  }

  const initializeTestData = async () => {
    setEvent({
      id: 'test-event',
      title: 'Test Competition',
      description: 'Test event for voting',
      status: 'live',
      shareable_code: 'test'
    })

    setArtists([
      { id: '1', artist_name: 'Luna Eclipse', bio: 'Indie rock with ethereal vocals', vote_count: 142, contact_status: 'confirmed', average_score: 4.3 },
      { id: '2', artist_name: 'The Neon Collective', bio: 'Electronic fusion band', vote_count: 89, contact_status: 'confirmed', average_score: 4.1 },
      { id: '3', artist_name: 'Velvet Storm', bio: 'Alternative rock powerhouse', vote_count: 201, contact_status: 'confirmed', average_score: 4.6 },
      { id: '4', artist_name: 'Digital Dreams', bio: 'Future bass with live instruments', vote_count: 156, contact_status: 'confirmed', average_score: 4.1 }
    ])

    await loadScoreTemplate()

    setVotingSession({
      eventId: 'test-event',
      participantId: 'test-participant',
      memorableCode: generateMemorableCode(),
      votesRemaining: 5,
      maxVotes: 5,
      votedArtists: [],
      scoredArtists: [],
      sessionStart: Date.now(),
      digitalTicket: {
        eventName: 'Test Competition',
        dateAttended: new Date().toISOString(),
        totalInteractions: 0,
        favoriteArtists: []
      }
    })

    setIsConnected(true)
    setLoading(false)

    const session = votingSession || {
      memorableCode: generateMemorableCode()
    }

    addBotMessage('🎤 Welcome to the Test Competition!')
    addBotMessage(`Your memorable code: ${session.memorableCode} 🎫`)
    addBotMessage('You have 5 votes. Use the commands below to interact with artists.')

    // Automatically show artists list for test mode too
    setTimeout(() => {
      showArtistsList()
    }, 500)
  }

  const generateParticipantId = () => {
    return `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate memorable codes like "LUNA-STAR-2024"
  const generateMemorableCode = () => {
    const words1 = ['LUNA', 'STAR', 'FIRE', 'MOON', 'BEAT', 'WAVE', 'ECHO', 'VIBE', 'FLOW', 'BASS']
    const words2 = ['ROCK', 'SOUL', 'FUNK', 'JAZZ', 'BLUE', 'GOLD', 'NEON', 'GLOW', 'VOLT', 'RUSH']
    const year = new Date().getFullYear()

    const word1 = words1[Math.floor(Math.random() * words1.length)]
    const word2 = words2[Math.floor(Math.random() * words2.length)]

    return `${word1}-${word2}-${year}`
  }

  // MVP: Simplified vote tracking that works with current database
  const storeVote = async (artistId: string, voteType: 'vote' | 'score' | 'feedback', data?: any) => {
    if (!event || !votingSession) return false

    try {
      // For MVP, focus on updating artist vote counts directly
      if (voteType === 'vote') {
        // Update local state immediately for responsive UI
        setArtists(prev => prev.map(a =>
          a.id === artistId ? { ...a, vote_count: a.vote_count + 1 } : a
        ))

        // Update artist vote count in database
        const { error: updateError } = await supabase
          .from('event_artist_prospects')
          .update({
            vote_count: (artists.find(a => a.id === artistId)?.vote_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', artistId)

        if (updateError) {
          console.error('❌ Failed to update artist vote count:', updateError)
          // Revert local state
          setArtists(prev => prev.map(a =>
            a.id === artistId ? { ...a, vote_count: Math.max(0, a.vote_count - 1) } : a
          ))
          addBotMessage('❌ Failed to record vote. Please try again.')
          return false
        }

        console.log('✅ Vote recorded and artist count updated')
        addBotMessage('✅ Vote recorded!')

        // Update voting session
        setVotingSession(prev => prev ? {
          ...prev,
          votesRemaining: Math.max(0, prev.votesRemaining - 1),
          votedArtists: [...prev.votedArtists, artistId]
        } : null)

        return true
      }

      // Handle other vote types (scores, feedback) if needed in future
      console.log(`✅ ${voteType} processed for artist ${artistId}`)
      return true
    } catch (error) {
      console.error('Error in storeVote:', error)
      addBotMessage('❌ Technical error. Please try again.')
      return false
    }
  }

  const createParticipantSession = async () => {
    if (!event || !votingSession) return

    try {
      // MVP: For now, just log session creation - table may not exist yet
      console.log('📝 Session created for participant:', {
        event_id: event.id,
        participant_id: votingSession.participantId,
        memorable_code: votingSession.memorableCode || `session-${Date.now()}`
      })

      // Future: Create actual session record when participant_sessions table is available
      return true
    } catch (error) {
      console.error('Error creating session:', error)
      return false
    }
  }

  const storeScore = async (artistId: string, scores: Record<string, number>, templateId: string) => {
    if (!event || !votingSession) return

    try {
      // Calculate average score from individual category scores
      const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length

      // Store score in the proper event_scores table
      const { error: scoreError } = await supabase
        .from('event_scores')
        .insert({
          event_id: event.id,
          participant_id: votingSession.participantId,
          artist_id: artistId,
          scores: scores,
          template_id: templateId,
          average_score: averageScore,
          memorable_code: votingSession.memorableCode
        })

      if (scoreError) {
        console.error('Error storing score:', scoreError)
        return false
      }

      // Now calculate and update the artist's overall average from all scores
      const { data: allScores, error: fetchError } = await supabase
        .from('event_scores')
        .select('average_score')
        .eq('event_id', event.id)
        .eq('artist_id', artistId)

      if (fetchError) {
        console.error('Error fetching scores for average:', fetchError)
        // Still return true since the score was stored successfully
        return true
      }

      // Calculate new overall average and total ratings
      const totalRatings = allScores?.length || 1
      const overallAverage = allScores?.length
        ? allScores.reduce((sum, score) => sum + (score.average_score || 0), 0) / allScores.length
        : averageScore

      // Update local state with new calculated values
      setArtists(prev => prev.map(a =>
        a.id === artistId
          ? { ...a, average_score: overallAverage, total_ratings: totalRatings }
          : a
      ))

      console.log('✅ Score stored successfully:', {
        artistId,
        individualScore: averageScore,
        overallAverage,
        totalRatings
      })
      return true
    } catch (error) {
      console.error('Error in storeScore:', error)
      return false
    }
  }

  const storeFeedback = async (artistId: string, feedbackText: string) => {
    if (!event || !votingSession) return

    try {
      const sentiment = analyzeSentiment(feedbackText)
      const trimmedFeedback = feedbackText.trim()

      // Store feedback in the proper event_feedback table
      const { error } = await supabase
        .from('event_feedback')
        .insert({
          event_id: event.id,
          participant_id: votingSession.participantId,
          artist_id: artistId,
          feedback_text: trimmedFeedback,
          sentiment: sentiment,
          word_count: trimmedFeedback.split(' ').length,
          memorable_code: votingSession.memorableCode
        })

      if (error) {
        console.error('Error storing feedback:', error)
        return false
      }

      console.log('✅ Feedback stored successfully:', {
        artistId,
        sentiment,
        wordCount: trimmedFeedback.split(' ').length
      })
      return true
    } catch (error) {
      console.error('Error storing feedback:', error)
      return false
    }
  }

  // MVP: updateArtistAverageScore function removed - now handled directly in storeScore

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['great', 'amazing', 'excellent', 'fantastic', 'love', 'awesome', 'fire', 'incredible', 'outstanding']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disappointing', 'boring']

    const words = text.toLowerCase().split(' ')
    const positiveCount = words.filter(word => positiveWords.includes(word)).length
    const negativeCount = words.filter(word => negativeWords.includes(word)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  const addBotMessage = (content: string, metadata?: ChatMessage['metadata']) => {
    const message: ChatMessage = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      metadata
    }
    setMessages(prev => [...prev, message])
  }

  const addUserMessage = (content: string, metadata?: ChatMessage['metadata']) => {
    const message: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'user',
      content,
      timestamp: new Date(),
      metadata
    }
    setMessages(prev => [...prev, message])
  }

  const handleCommand = (command: string) => {
    const cmd = command.toLowerCase().trim()

    if (cmd === 'artists' || cmd === 'list') {
      showArtistsList()
    } else if (cmd === 'help') {
      showHelp()
    } else if (cmd === 'results') {
      showResults()
    } else if (cmd === 'status') {
      showStatus()
    } else if (cmd.startsWith('vote ')) {
      handleVoteCommand(cmd)
    } else if (cmd.startsWith('score ')) {
      handleScoreCommand(cmd)
    } else {
      addBotMessage("🤖 I didn't understand that command. Try 'help' for available commands.")
    }
  }

  const showArtistsList = () => {
    addBotMessage('🎤 Artists in this competition:')
    artists.forEach((artist, index) => {
      const isVoted = votingSession?.votedArtists.includes(artist.id)
      const isScored = votingSession?.scoredArtists.includes(artist.id)
      const status = isVoted ? '✅' : isScored ? '⭐' : '⚪'

      addBotMessage(
        `${status} ${index + 1}. ${artist.artist_name} - ${artist.vote_count} votes${artist.average_score ? ` (${artist.average_score.toFixed(1)}⭐)` : ''}`,
        {
          artistId: artist.id,
          messageType: 'info',
          artistName: artist.artist_name,
          isClickable: true
        }
      )
    })
    addBotMessage('💡 Tap any artist name to open their voting window!')
  }

  const showHelp = () => {
    addBotMessage('🤖 Available commands:')
    addBotMessage('• ARTISTS - View all artists')
    addBotMessage('• VOTE [artist name] - Cast your vote')
    addBotMessage('• SCORE [artist name] - Rate performance')
    addBotMessage('• FEEDBACK - Leave detailed feedback')
    addBotMessage('• RESULTS - View current standings')
    addBotMessage('• STATUS - Check your voting status')
  }

  const showResults = () => {
    const sortedArtists = [...artists].sort((a, b) => b.vote_count - a.vote_count)
    addBotMessage('🏆 Current Results:')
    sortedArtists.slice(0, 5).forEach((artist, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
      addBotMessage(`${medal} ${artist.artist_name} - ${artist.vote_count} votes`)
    })
  }

  const showStatus = () => {
    if (!votingSession) return

    addBotMessage(`📊 Your voting status:`)
    addBotMessage(`• Votes remaining: ${votingSession.votesRemaining}/${votingSession.maxVotes}`)
    addBotMessage(`• Artists voted for: ${votingSession.votedArtists.length}`)
    addBotMessage(`• Artists scored: ${votingSession.scoredArtists.length}`)
  }

  const handleVoteCommand = (cmd: string) => {
    if (!votingSession || votingSession.votesRemaining <= 0) {
      addBotMessage('❌ No votes remaining!')
      return
    }

    const artistName = cmd.replace('vote ', '').trim()
    const artist = artists.find(a =>
      a.artist_name.toLowerCase().includes(artistName.toLowerCase())
    )

    if (!artist) {
      addBotMessage(`❌ Artist "${artistName}" not found. Use ARTISTS to see the list.`)
      return
    }

    if (votingSession.votedArtists.includes(artist.id)) {
      addBotMessage(`❌ You've already voted for ${artist.artist_name}!`)
      return
    }

    // Show confirmation modal
    setPendingVoteArtist(artist)
    setShowVoteModal(true)
  }

  const confirmVote = async () => {
    if (!pendingVoteArtist || !votingSession) return

    // Cast the vote
    const success = await storeVote(pendingVoteArtist.id, 'vote')

    if (success) {
      addBotMessage(`✅ Vote cast for ${pendingVoteArtist.artist_name}!`, {
        messageType: 'confirmation',
        artistId: pendingVoteArtist.id,
        styling: { highlight: true, color: 'text-green-400' }
      })
    }

    // Close modal
    setShowVoteModal(false)
    setPendingVoteArtist(null)
  }

  const cancelVote = () => {
    setShowVoteModal(false)
    setPendingVoteArtist(null)
    addBotMessage('Vote cancelled.')
  }

  // Game-controller style selection functions
  const handleArtistSelect = (artist: VotingArtist) => {
    setSelectedArtistForAction(artist)
    addBotMessage(`🎯 Selected: ${artist.artist_name}`, {
      messageType: 'info',
      artistId: artist.id,
      styling: { highlight: true, color: 'text-accent-yellow' }
    })
  }

  const handleVoteAction = () => {
    if (!selectedArtistForAction) {
      addBotMessage('❌ Please select an artist first!')
      return
    }

    if (!votingSession || votingSession.votesRemaining <= 0) {
      addBotMessage('❌ No votes remaining!')
      return
    }

    if (votingSession.votedArtists.includes(selectedArtistForAction.id)) {
      addBotMessage(`❌ You've already voted for ${selectedArtistForAction.artist_name}!`)
      return
    }

    // Show confirmation modal (same as before)
    setPendingVoteArtist(selectedArtistForAction)
    setShowVoteModal(true)
  }

  const handleScoreAction = () => {
    if (!selectedArtistForAction) {
      addBotMessage('❌ Please select an artist first!')
      return
    }

    setSelectedArtist(selectedArtistForAction)
    setActiveMode('scoring')
    addBotMessage(`📊 Scoring ${selectedArtistForAction.artist_name}...`)
  }

  const resetSelection = () => {
    setSelectedArtistForAction(null)
    addBotMessage('🔄 Selection cleared.')
  }

  // Trading card functions
  const showArtistTradingCard = (artist: VotingArtist) => {
    setTradingCardArtist(artist)
    setShowTradingCard(true)
    addBotMessage(`🎴 Viewing ${artist.artist_name}'s trading card!`, {
      messageType: 'info',
      artistId: artist.id,
      styling: { highlight: true, color: 'text-purple-400' }
    })
  }

  const closeTradingCard = () => {
    setShowTradingCard(false)
    setTradingCardArtist(null)
  }

  const handleScoreCommand = (cmd: string) => {
    const artistName = cmd.replace('score ', '').trim()
    const artist = artists.find(a =>
      a.artist_name.toLowerCase().includes(artistName.toLowerCase())
    )

    if (!artist) {
      addBotMessage(`❌ Artist "${artistName}" not found. Use ARTISTS to see the list.`)
      return
    }

    setSelectedArtist(artist)
    setActiveMode('scoring')
    initializeScores()
    addBotMessage(`🏆 Scoring ${artist.artist_name}. Rate each category:`)
  }

  const initializeScores = () => {
    if (!scoreTemplate) return

    const initialScores: Record<string, number> = {}
    scoreTemplate.categories.forEach(category => {
      initialScores[category.key] = Math.ceil(scoreTemplate.max_score / 2)
    })
    setCurrentScores(initialScores)
  }

  const submitScore = async () => {
    if (!selectedArtist || !scoreTemplate) return

    try {
      const avgScore = Object.values(currentScores).reduce((a, b) => a + b, 0) / scoreTemplate.categories.length

      // Store score in database
      await storeScore(selectedArtist.id, currentScores, scoreTemplate.id)

      setVotingSession(prev => prev ? {
        ...prev,
        scoredArtists: [...prev.scoredArtists, selectedArtist.id]
      } : null)

      addBotMessage(`✅ Score submitted for ${selectedArtist.artist_name}!`, {
        messageType: 'confirmation',
        styling: { highlight: true, color: 'text-green-400' }
      })

      addBotMessage(`Your overall score: ${avgScore.toFixed(1)}/${scoreTemplate.max_score}.0 ⭐`)

      // Move to feedback mode
      setActiveMode('feedback')
      setFeedbackText('')
      addBotMessage(`💬 Want to leave feedback for ${selectedArtist.artist_name}?`)
    } catch (error) {
      console.error('Error submitting score:', error)
      addBotMessage('❌ Failed to submit score. Please try again.')
    }
  }

  const submitFeedback = async () => {
    if (!selectedArtist) return

    try {
      if (feedbackText.trim()) {
        // Store feedback in database
        await storeFeedback(selectedArtist.id, feedbackText)

        addBotMessage(`✅ Feedback submitted for ${selectedArtist.artist_name}!`, {
          messageType: 'confirmation',
          styling: { highlight: true, color: 'text-green-400' }
        })
        addBotMessage(`Your feedback: "${feedbackText.trim()}"`)
      } else {
        addBotMessage(`✅ Score saved for ${selectedArtist.artist_name}!`)
      }

      // Reset state
      setActiveMode('chat')
      setSelectedArtist(null)
      setFeedbackText('')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      addBotMessage('❌ Failed to submit feedback. Please try again.')
    }
  }

  const quickVote = async (artist: VotingArtist) => {
    if (!votingSession || votingSession.votesRemaining <= 0) {
      addBotMessage('❌ No votes remaining!')
      return
    }

    if (votingSession.votedArtists.includes(artist.id)) {
      addBotMessage(`❌ You've already voted for ${artist.artist_name}!`)
      return
    }

    try {
      // Store vote in database
      await storeVote(artist.id, 'vote')

      // Update local state
      setVotingSession(prev => prev ? {
        ...prev,
        votesRemaining: prev.votesRemaining - 1,
        votedArtists: [...prev.votedArtists, artist.id]
      } : null)

      setArtists(prev => prev.map(a =>
        a.id === artist.id ? { ...a, vote_count: a.vote_count + 1 } : a
      ))

      addBotMessage(`✅ Vote cast for ${artist.artist_name}!`, {
        messageType: 'confirmation',
        artistId: artist.id,
        styling: { highlight: true, color: 'text-green-400' }
      })

      if (votingSession.votesRemaining === 1) {
        addBotMessage('📢 This was your last vote!')
      }
    } catch (error) {
      console.error('Error casting vote:', error)
      addBotMessage('❌ Failed to cast vote. Please try again.')
    }
  }

  const quickScore = (artist: VotingArtist) => {
    setSelectedArtist(artist)
    setActiveMode('scoring')
    initializeScores()
    addBotMessage(`🏆 Scoring ${artist.artist_name}. Rate each category:`)
  }


  const handleArtistClick = (artistId: string) => {
    const artist = artists.find(a => a.id === artistId)
    if (artist) {
      showArtistTradingCard(artist)
    }
  }

  const handleInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputMessage.trim()) {
      addUserMessage(inputMessage)
      handleCommand(inputMessage)
      setInputMessage('')
    }
  }

  // Quick action buttons based on context
  const getContextualCommands = (): Array<{label: string, action: () => void, icon: string}> => {
    const commands = []

    if (activeMode === 'chat') {
      // Check if we have artists to show vote/score buttons
      const topArtist = artists[0]
      const canVote = votingSession && votingSession.votesRemaining > 0

      commands.push(
        { label: 'ARTISTS', action: () => handleCommand('artists'), icon: '🎤' },
        { label: 'RESULTS', action: () => handleCommand('results'), icon: '🏆' }
      )

      // Add VOTE button for top artist if possible
      if (topArtist && canVote && !votingSession?.votedArtists.includes(topArtist.id)) {
        commands.push(
          { label: `VOTE`, action: () => quickVote(topArtist), icon: '🗳️' }
        )
      }

      // Add SCORE button for top artist if not already scored
      if (topArtist && !votingSession?.scoredArtists.includes(topArtist.id)) {
        commands.push(
          { label: `SCORE`, action: () => quickScore(topArtist), icon: '⭐' }
        )
      }

      commands.push(
        { label: 'STATUS', action: () => handleCommand('status'), icon: '📊' }
      )
    } else if (activeMode === 'scoring' && selectedArtist) {
      commands.push(
        { label: 'SUBMIT', action: submitScore, icon: '✅' },
        { label: 'CANCEL', action: () => setActiveMode('chat'), icon: '❌' }
      )
    } else if (activeMode === 'feedback' && selectedArtist) {
      commands.push(
        { label: 'SUBMIT', action: submitFeedback, icon: '✅' },
        { label: 'SKIP', action: () => (setFeedbackText(''), submitFeedback()), icon: '⏭️' }
      )
    }

    return commands
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <div className="text-white">Connecting to event...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className={`backdrop-blur-xl bg-white/8 border-b border-white/10 ${isMobile ? 'px-4 py-4' : 'px-8 py-6'}`}>
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-white mb-1`}
              animate={{
                textShadow: [
                  '0 0 20px rgba(255,255,255,0.3)',
                  '0 0 25px rgba(255,255,255,0.2)',
                  '0 0 20px rgba(255,255,255,0.3)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {event?.title || 'Voting'}
            </motion.h1>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-1 ${isMobile ? 'text-xs' : 'text-sm'} text-white/60`}>
                <motion.div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span>{isConnected ? 'Live' : 'Offline'}</span>
              </div>
              {activeMode !== 'chat' && (
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/40`}>
                  • {activeMode === 'scoring' ? 'Scoring' : activeMode.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>
          {votingSession && (
            <motion.div
              className="text-right backdrop-blur-sm bg-white/5 rounded-xl px-4 py-3"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-accent-yellow`}
                animate={{
                  textShadow: [
                    '0 0 15px rgba(255,193,7,0.5)',
                    '0 0 20px rgba(255,193,7,0.3)',
                    '0 0 15px rgba(255,193,7,0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {votingSession.votesRemaining}
              </motion.div>
              <div className="text-xs text-white/60 font-medium">votes left</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-accent-yellow text-black ml-4'
                      : 'bg-gray-700 text-white mr-4'
                  } ${
                    message.metadata?.styling?.highlight
                      ? `ring-2 ring-green-400/50 ${message.metadata.styling.color || ''}`
                      : ''
                  } ${
                    message.metadata?.isClickable ? 'cursor-pointer hover:bg-gray-600 transition-colors' : ''
                  }`}
                  onClick={() => {
                    if (message.metadata?.isClickable && message.metadata?.artistId) {
                      handleArtistClick(message.metadata.artistId)
                    }
                  }}
                >
                  <div className={`${isMobile ? 'text-sm' : 'text-base'}`}>
                    {message.metadata?.isClickable && message.metadata?.artistName ? (
                      <div>
                        {message.content.replace(message.metadata.artistName, '')}
                        <span className="underline text-accent-yellow font-semibold hover:text-accent-yellow/80">
                          {message.metadata.artistName}
                        </span>
                        {message.content.split(message.metadata.artistName)[1] || ''}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-60 mt-1`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Scoring Interface Overlay */}
            <AnimatePresence>
              {activeMode === 'scoring' && selectedArtist && scoreTemplate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8
                    shadow-2xl shadow-black/20 sticky top-4 mx-4 max-w-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  {/* Glass reflection effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none" />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <motion.h3
                        className="text-2xl font-semibold text-white mb-3"
                        animate={{
                          textShadow: [
                            '0 0 20px rgba(255,255,255,0.3)',
                            '0 0 25px rgba(255,255,255,0.2)',
                            '0 0 20px rgba(255,255,255,0.3)'
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        Score {selectedArtist.artist_name}
                      </motion.h3>
                      <p className="text-white/60 text-lg">
                        Rate each category from 1 to {scoreTemplate.max_score}
                      </p>
                    </div>

                    {/* Scoring Categories */}
                    <div className="space-y-6">
                      {scoreTemplate.categories.map((category, index) => (
                        <motion.div
                          key={category.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="backdrop-blur-sm bg-white/5 rounded-2xl p-5 border border-white/10
                            hover:bg-white/8 hover:border-white/15 transition-all duration-300"
                        >
                          {/* Category Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <motion.div
                                className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center text-xl"
                                whileHover={{ scale: 1.1, rotate: 360 }}
                                transition={{ duration: 0.5 }}
                              >
                                {category.icon}
                              </motion.div>
                              <div>
                                <h4 className="font-medium text-white text-lg">
                                  {category.label}
                                </h4>
                                <p className="text-white/50 text-sm">
                                  {category.description}
                                </p>
                              </div>
                            </div>

                            {/* Current Score Display */}
                            <motion.div
                              className="backdrop-blur-sm bg-accent-yellow/20 rounded-xl px-4 py-2"
                              animate={{
                                scale: currentScores[category.key] ? [1, 1.1, 1] : 1
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <span className="text-accent-yellow font-bold text-lg">
                                {currentScores[category.key] || 0}
                              </span>
                              <span className="text-white/60 text-sm">
                                /{scoreTemplate.max_score}
                              </span>
                            </motion.div>
                          </div>

                          {/* Rating Controls */}
                          <div className="flex justify-center space-x-2">
                            {Array.from({ length: scoreTemplate.max_score }, (_, i) => i + 1).map(score => {
                              const isSelected = currentScores[category.key] >= score

                              return (
                                <motion.button
                                  key={score}
                                  onClick={() => setCurrentScores(prev => ({
                                    ...prev,
                                    [category.key]: score
                                  }))}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={`relative w-12 h-12 rounded-2xl border transition-all duration-300
                                    flex items-center justify-center text-lg font-semibold
                                    ${isSelected
                                      ? 'bg-gradient-to-br from-accent-yellow/30 to-orange-400/30 border-accent-yellow/50 text-accent-yellow shadow-lg shadow-accent-yellow/20'
                                      : 'backdrop-blur-sm bg-white/5 border-white/20 text-white/40 hover:bg-white/10 hover:border-white/30 hover:text-white/60'
                                    }`}
                                >
                                  {scoreTemplate.max_score <= 5 ? (
                                    <motion.span
                                      animate={isSelected ? { rotate: [0, 360] } : {}}
                                      transition={{ duration: 0.5 }}
                                    >
                                      ⭐
                                    </motion.span>
                                  ) : (
                                    score
                                  )}

                                  {/* Glow effect for selected */}
                                  {isSelected && (
                                    <motion.div
                                      className="absolute inset-0 rounded-2xl bg-accent-yellow/20 blur-sm"
                                      animate={{
                                        opacity: [0.5, 1, 0.5]
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    />
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Overall Score Preview */}
                    <motion.div
                      className="mt-8 text-center backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-white/60 text-sm mb-2">Overall Score</p>
                      <motion.div
                        className="text-3xl font-bold text-accent-yellow"
                        animate={{
                          textShadow: [
                            '0 0 20px rgba(255,193,7,0.5)',
                            '0 0 30px rgba(255,193,7,0.3)',
                            '0 0 20px rgba(255,193,7,0.5)'
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {Object.keys(currentScores).length > 0
                          ? (Object.values(currentScores).reduce((a, b) => a + b, 0) / scoreTemplate.categories.length).toFixed(1)
                          : '0.0'
                        }
                        <span className="text-lg text-white/60">/{scoreTemplate.max_score}</span>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Feedback Interface Overlay */}
              {activeMode === 'feedback' && selectedArtist && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8
                    shadow-2xl shadow-black/20 sticky top-4 mx-4 max-w-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  {/* Glass reflection effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none" />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <motion.h3
                        className="text-2xl font-semibold text-white mb-3"
                        animate={{
                          textShadow: [
                            '0 0 20px rgba(255,255,255,0.3)',
                            '0 0 25px rgba(255,255,255,0.2)',
                            '0 0 20px rgba(255,255,255,0.3)'
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        💬 Feedback for {selectedArtist.artist_name}
                      </motion.h3>
                      <p className="text-white/60 text-lg">
                        Share your thoughts on their performance
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Quick feedback tags */}
                      <div>
                        <h4 className="text-white/80 font-medium mb-4 text-center">Quick Tags</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {['🔥 Fire!', '👏 Amazing', '💫 Unique', '❤️ Love it', '🎵 Great vocals', '⚡ High energy'].map((tag, index) => (
                            <motion.button
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => setFeedbackText(prev =>
                                prev ? `${prev} ${tag}` : tag
                              )}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="relative backdrop-blur-sm bg-white/5 border border-white/20 rounded-2xl py-3 px-4
                                text-white text-sm transition-all duration-300 text-left font-medium
                                hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10
                                group overflow-hidden"
                            >
                              <span className="relative z-10">{tag}</span>
                              {/* Hover glow effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-accent-yellow/20 to-orange-400/20 opacity-0
                                  group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                                animate={{
                                  background: [
                                    'linear-gradient(45deg, rgba(255,193,7,0.1), rgba(255,152,0,0.1))',
                                    'linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,152,0,0.05))',
                                    'linear-gradient(45deg, rgba(255,193,7,0.1), rgba(255,152,0,0.1))'
                                  ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Feedback text area */}
                      <div className="space-y-4">
                        <h4 className="text-white/80 font-medium text-center">Custom Message</h4>
                        <div className="relative">
                          <textarea
                            value={feedbackText}
                            onChange={(e) => {
                              if (e.target.value.length <= 500) {
                                setFeedbackText(e.target.value)
                              }
                            }}
                            placeholder="Share your detailed thoughts..."
                            className="w-full backdrop-blur-sm bg-white/5 border border-white/20 rounded-2xl p-4
                              text-white placeholder-white/40 focus:outline-none resize-none transition-all duration-300
                              focus:bg-white/10 focus:border-white/30 focus:shadow-lg focus:shadow-white/10
                              hover:bg-white/8 hover:border-white/25"
                            rows={4}
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                            }}
                          />

                          {/* Character count */}
                          <motion.div
                            className="absolute bottom-2 right-3 text-xs text-white/40"
                            animate={{
                              color: feedbackText.length > 450 ? 'rgba(255,193,7,0.8)' : 'rgba(255,255,255,0.4)'
                            }}
                          >
                            {feedbackText.length}/500
                          </motion.div>
                        </div>
                      </div>

                      {/* Preview */}
                      {feedbackText && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="backdrop-blur-sm bg-accent-yellow/10 border border-accent-yellow/20 rounded-2xl p-4"
                        >
                          <p className="text-white/80 text-sm">
                            <span className="text-accent-yellow font-medium">Preview: </span>
                            {feedbackText}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Artist Gallery Interface */}
              {activeMode === 'artist-gallery' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6 mt-8"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">🎤 Select an Artist</h2>
                    <p className="text-gray-400">Choose an artist to vote for or score</p>
                    {votingSession && (
                      <div className="mt-2">
                        <span className="text-accent-yellow font-bold">
                          {votingSession.votesRemaining} votes remaining
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Artist Cards Grid */}
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                    {artists.map(artist => {
                      const isSelected = selectedArtistForAction?.id === artist.id
                      const isVoted = votingSession?.votedArtists.includes(artist.id)
                      const isHovered = hoveredArtist === artist.id

                      return (
                        <motion.div
                          key={artist.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            group relative backdrop-blur-xl bg-white/5 rounded-2xl p-5 cursor-pointer
                            transition-all duration-300 ease-out border border-white/10
                            hover:bg-white/10 hover:border-white/20 hover:shadow-2xl
                            ${isSelected ? 'bg-white/15 border-accent-yellow/40 shadow-accent-yellow/20 shadow-lg' : ''}
                            ${isVoted ? 'ring-1 ring-green-400/30' : ''}
                            before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br
                            before:from-white/10 before:via-transparent before:to-transparent before:opacity-0
                            hover:before:opacity-100 before:transition-opacity before:duration-300
                          `}
                          onClick={() => handleArtistSelect(artist)}
                          onHoverStart={() => setHoveredArtist(artist.id)}
                          onHoverEnd={() => setHoveredArtist(null)}
                        >
                          {/* Animated focus ring */}
                          {isSelected && (
                            <motion.div
                              className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-accent-yellow/40
                                via-orange-400/40 to-accent-yellow/40 opacity-60 animate-pulse"
                              animate={{
                                background: [
                                  'linear-gradient(0deg, rgba(255,193,7,0.4), rgba(255,152,0,0.4), rgba(255,193,7,0.4))',
                                  'linear-gradient(90deg, rgba(255,193,7,0.4), rgba(255,152,0,0.4), rgba(255,193,7,0.4))',
                                  'linear-gradient(180deg, rgba(255,193,7,0.4), rgba(255,152,0,0.4), rgba(255,193,7,0.4))',
                                  'linear-gradient(270deg, rgba(255,193,7,0.4), rgba(255,152,0,0.4), rgba(255,193,7,0.4))',
                                  'linear-gradient(360deg, rgba(255,193,7,0.4), rgba(255,152,0,0.4), rgba(255,193,7,0.4))'
                                ]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            />
                          )}
                          {/* Artist Image */}
                          <div className="flex items-center space-x-3 mb-3">
                            {artist.profile_image_url ? (
                              <img
                                src={artist.profile_image_url}
                                alt={artist.artist_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-accent-yellow text-black flex items-center justify-center font-bold text-lg">
                                {artist.artist_name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-lg">{artist.artist_name}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <span>🎵 {artist.vote_count} votes</span>
                                {artist.average_score && (
                                  <span>⭐ {artist.average_score.toFixed(1)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bio */}
                          {artist.bio && (
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{artist.bio}</p>
                          )}

                          {/* Status Indicators */}
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                              {isVoted && (
                                <span className="px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded-full">
                                  ✓ Voted
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                artist.contact_status === 'confirmed' ? 'bg-green-600/20 text-green-300' :
                                artist.contact_status === 'pending' ? 'bg-yellow-600/20 text-yellow-300' :
                                'bg-gray-600/20 text-gray-300'
                              }`}>
                                {artist.contact_status}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="text-accent-yellow font-bold text-sm">
                                SELECTED ✨
                              </div>
                            )}
                          </div>

                          {/* Hover Effect */}
                          {isHovered && !isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-accent-yellow/5 rounded-xl pointer-events-none"
                            />
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Selected Artist Action Panel */}
                  {selectedArtistForAction && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative backdrop-blur-xl bg-white/8 rounded-3xl p-8 border border-white/20
                        shadow-2xl shadow-black/20 before:absolute before:inset-0 before:rounded-3xl
                        before:bg-gradient-to-br before:from-white/10 before:via-transparent
                        before:to-transparent before:opacity-50"
                    >
                      <div className="relative z-10">
                        <div className="text-center mb-8">
                          <motion.h3
                            className="text-2xl font-semibold text-white mb-3"
                            animate={{
                              textShadow: [
                                '0 0 20px rgba(255,193,7,0.5)',
                                '0 0 30px rgba(255,193,7,0.3)',
                                '0 0 20px rgba(255,193,7,0.5)'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {selectedArtistForAction.artist_name}
                          </motion.h3>
                          <p className="text-white/70 text-lg">What would you like to do?</p>
                        </div>

                        {/* Controller Interface */}
                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-6'} max-w-2xl mx-auto`}>
                          {/* Vote Button */}
                          <motion.button
                            onClick={handleVoteAction}
                            disabled={!votingSession || votingSession.votesRemaining <= 0 ||
                                     votingSession.votedArtists.includes(selectedArtistForAction.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                              relative backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300
                              flex flex-col items-center justify-center space-y-3 group overflow-hidden
                              ${!votingSession || votingSession.votesRemaining <= 0 ||
                                votingSession.votedArtists.includes(selectedArtistForAction.id)
                                ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                                : `bg-gradient-to-br from-accent-yellow/20 to-orange-400/20 border-accent-yellow/30
                                  text-white hover:from-accent-yellow/30 hover:to-orange-400/30 hover:border-accent-yellow/50
                                  hover:shadow-2xl hover:shadow-accent-yellow/20`}
                            `}
                          >
                            <motion.div
                              className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center text-2xl"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                            >
                              🗳️
                            </motion.div>
                            <span className="font-semibold text-lg">VOTE</span>
                            {(!votingSession || votingSession.votesRemaining <= 0 ||
                              votingSession.votedArtists.includes(selectedArtistForAction.id)) && (
                              <span className="text-xs text-white/40">Not Available</span>
                            )}
                          </motion.button>

                          {/* Score Button */}
                          <motion.button
                            onClick={handleScoreAction}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative backdrop-blur-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20
                              border border-blue-400/30 rounded-2xl p-6 text-white transition-all duration-300
                              flex flex-col items-center justify-center space-y-3 group overflow-hidden
                              hover:from-blue-400/30 hover:to-purple-400/30 hover:border-blue-400/50
                              hover:shadow-2xl hover:shadow-blue-400/20"
                          >
                            <motion.div
                              className="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center text-2xl"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                            >
                              ⭐
                            </motion.div>
                            <span className="font-semibold text-lg">SCORE</span>
                          </motion.button>

                          {/* View Artist Button */}
                          <motion.button
                            onClick={() => showArtistTradingCard(selectedArtistForAction)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative backdrop-blur-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20
                              border border-purple-400/30 rounded-2xl p-6 text-white transition-all duration-300
                              flex flex-col items-center justify-center space-y-3 group overflow-hidden
                              hover:from-purple-400/30 hover:to-pink-400/30 hover:border-purple-400/50
                              hover:shadow-2xl hover:shadow-purple-400/20"
                          >
                            <motion.div
                              className="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center text-2xl"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                            >
                              🃏
                            </motion.div>
                            <span className="font-semibold text-lg">VIEW</span>
                          </motion.button>
                        </div>

                        {/* Clear Action - Centered below */}
                        <div className="flex justify-center mt-6">
                          <motion.button
                            onClick={resetSelection}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-8 py-3
                              text-white/60 transition-all duration-300 flex items-center space-x-3
                              hover:bg-white/10 hover:border-white/20 hover:text-white/80"
                          >
                            <span className="text-sm">✕</span>
                            <span className="font-medium text-sm">Clear Selection</span>
                          </motion.button>
                        </div>

                        {/* Status Information */}
                        <motion.div
                          className="mt-6 text-center backdrop-blur-sm bg-white/5 rounded-xl p-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="text-white/70 text-sm">
                            {!votingSession || votingSession.votesRemaining <= 0 ? (
                              <p>❌ No votes remaining</p>
                            ) : votingSession.votedArtists.includes(selectedArtistForAction.id) ? (
                              <p>✅ Already voted for this artist</p>
                            ) : (
                              <p>Choose your action above</p>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="bg-gray-900/30 border-t border-gray-800 px-4 py-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center space-x-2">
              {[
                { mode: 'artist-gallery', label: '🎤 Artists', desc: 'Visual selection' },
                { mode: 'chat', label: '💬 Chat', desc: 'Commands' },
                { mode: 'scoring', label: '⭐ Score', desc: 'Rate artists' }
              ].map(({ mode, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setActiveMode(mode as ActiveMode)
                    if (mode !== 'scoring') setSelectedArtist(null)
                  }}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeMode === mode
                      ? 'bg-accent-yellow text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="text-center">
                    <div>{label}</div>
                    <div className="text-xs opacity-70">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className={`bg-gray-900/50 border-t border-gray-700 ${isMobile ? 'p-3' : 'p-4'} ${activeMode === 'artist-gallery' ? 'hidden' : 'block'}`}>
          <div className="max-w-2xl mx-auto">
            {/* Text Input */}
            <div className={`flex ${isMobile ? 'space-x-2 mb-3' : 'space-x-3 mb-4'}`}>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleInput}
                placeholder={isMobile ? "Type command..." : "Type a command or message..."}
                disabled={!isConnected}
                className={`flex-1 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-yellow ${
                  isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
                }`}
              />
              <button
                onClick={() => inputMessage.trim() && (addUserMessage(inputMessage), handleCommand(inputMessage), setInputMessage(''))}
                disabled={!inputMessage.trim() || !isConnected}
                className={`bg-accent-yellow text-black rounded-full font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 ${
                  isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'
                }`}
              >
                {isMobile ? '📤' : 'Send'}
              </button>
            </div>

            {/* Contextual Command Bubbles */}
            <div className={`flex ${isMobile ? 'justify-between gap-1' : 'flex-wrap gap-2'}`}>
              {getContextualCommands().map(({ label, action, icon }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`rounded-full font-medium transition-colors ${
                    isMobile
                      ? 'flex-1 py-2 px-2 text-xs bg-gray-700 hover:bg-gray-600 text-white'
                      : 'px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  <span className={isMobile ? 'block mb-1' : ''}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vote Confirmation Modal */}
        {showVoteModal && pendingVoteArtist && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4">Confirm Your Vote</h3>

              <div className="mb-6">
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    {pendingVoteArtist.profile_image_url ? (
                      <img
                        src={pendingVoteArtist.profile_image_url}
                        alt={pendingVoteArtist.artist_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent-yellow text-black flex items-center justify-center font-bold">
                        {pendingVoteArtist.artist_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-lg">{pendingVoteArtist.artist_name}</h4>
                      <p className="text-gray-400 text-sm">
                        Current votes: {pendingVoteArtist.vote_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3 mb-4">
                  <p className="text-accent-yellow text-sm">
                    ⚠️ Are you sure you want to cast your vote for <strong>{pendingVoteArtist.artist_name}</strong>?
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    You have {votingSession?.votesRemaining} vote{(votingSession?.votesRemaining || 0) !== 1 ? 's' : ''} remaining. This action cannot be undone.
                  </p>
                </div>

                {votingSession?.votesRemaining === 1 && (
                  <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                    <p className="text-red-300 text-sm">
                      🚨 This will be your final vote!
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelVote}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVote}
                  className="px-4 py-2 bg-accent-yellow text-black rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
                >
                  Confirm Vote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Artist Trading Card Modal */}
        <ArtistTradingCard
          artist={tradingCardArtist as any}
          isOpen={showTradingCard}
          onClose={closeTradingCard}
          eventTitle={event?.title}
        />
      </div>
    </div>
  )
}

export default StreamlinedVotingInterface