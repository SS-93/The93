import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { ConciertoMediaIdService } from '../../lib/conciertoMediaIdService'

// Types
interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    messageType?: 'vote' | 'command' | 'info' | 'error' | 'confirmation'
    voteConfirmed?: boolean
    artistId?: string
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
}

interface VotingSession {
  participantId: string
  votesRemaining: number
  votedArtists: string[]
  totalVotes: number
  sessionStarted: Date
}

interface VotingCommands {
  VOTE: (artistName: string) => Promise<void>
  HELP: () => Promise<void>
  STATUS: () => Promise<void>
  RESULTS: () => Promise<void>
  ARTISTS: () => Promise<void>
  CLEAR: () => void
  BUZZ: () => Promise<void>
}

const SMSVotingInterface: React.FC = () => {
  const { shareableCode } = useParams<{ shareableCode: string }>()
  const navigate = useNavigate()

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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize voting session
  useEffect(() => {
    if (shareableCode) {
      initializeVotingSession()
    }
  }, [shareableCode])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const generateParticipantToken = () => {
    return `sms_voter_${Date.now()}_${Math.random().toString(36).substring(2)}`
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

  const addSystemMessage = (content: string) => {
    return addMessage('system', content, { messageType: 'info', styling: { color: 'text-gray-400' } })
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
        addSystemMessage('❌ Event not found. Please check your link and try again.')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Load artists from prospects table (CRM approach)
      const { data: artistsData, error: artistsError } = await supabase
        .from('event_artist_prospects')
        .select('*')
        .eq('event_id', eventData.id)
        .eq('contact_status', 'confirmed')

      if (artistsError) {
        console.error('Failed to load artists:', artistsError)
        addBotMessage('⚠️ Having trouble loading artists. Trying again...')
      }

      const formattedArtists = (artistsData || []).map((artist: any) => ({
        id: artist.id,
        artist_name: artist.artist_name || 'Unknown Artist',
        bio: artist.bio || 'No bio available',
        profile_image_url: artist.profile_image_url,
        vote_count: artist.vote_count || 0,
        contact_status: artist.contact_status
      }))

      setArtists(formattedArtists)

      // Initialize anonymous voting session
      const token = localStorage.getItem(`sms_voter_${eventData.id}`) || generateParticipantToken()
      localStorage.setItem(`sms_voter_${eventData.id}`, token)
      setParticipantToken(token)

      // Create anonymous participant profile
      const participantId = await ConciertoMediaIdService.createAnonymousEventProfile(
        eventData.id,
        navigator.userAgent,
        { data_sharing: false, personalized_recommendations: false }
      )

      // Check existing votes
      const { data: existingVotes } = await supabase
        .from('event_votes')
        .select('artist_id')
        .eq('event_id', eventData.id)
        .eq('participant_token', token)

      const votedArtists = existingVotes?.map(v => v.artist_id) || []

      setVotingSession({
        participantId: participantId || token,
        votesRemaining: Math.max(0, eventData.max_votes_per_participant - votedArtists.length),
        votedArtists,
        totalVotes: eventData.max_votes_per_participant,
        sessionStarted: new Date()
      })

      setIsConnected(true)

      // Welcome messages
      addSystemMessage(`📱 Connected to ${eventData.title}`)
      addBotMessage(`🎤 Welcome to ${eventData.title}! I'm your voting assistant.`)

      if (formattedArtists.length > 0) {
        addBotMessage(`You have ${eventData.max_votes_per_participant - votedArtists.length} votes remaining. Type an artist name to vote, or "HELP" for commands.`)
      } else {
        addBotMessage('Artists are still being added to this event. Check back soon!')
      }

    } catch (error) {
      console.error('Failed to initialize voting session:', error)
      setError('Failed to load voting interface. Please try again.')
      addSystemMessage('❌ Connection failed. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  const initializeTestEvent = async () => {
    // Create test event data for development
    const testEvent: Event = {
      id: 'test-event-123',
      title: 'Test Voting Event',
      description: 'SMS-style voting interface test',
      status: 'live',
      max_votes_per_participant: 5,
      shareable_code: 'test',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      voting_opens_at: new Date().toISOString(),
      voting_closes_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    }

    const testArtists: Artist[] = [
      { id: 'artist1', artist_name: 'Luna Starlight', bio: 'Electronic ambient artist', vote_count: 23, contact_status: 'confirmed' },
      { id: 'artist2', artist_name: 'Neon Waves', bio: 'Synthwave producer', vote_count: 45, contact_status: 'confirmed' },
      { id: 'artist3', artist_name: 'Midnight Echo', bio: 'Indie rock band', vote_count: 12, contact_status: 'confirmed' },
      { id: 'artist4', artist_name: 'Digital Dreams', bio: 'Future bass collective', vote_count: 67, contact_status: 'confirmed' }
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
      sessionStarted: new Date()
    })

    setIsConnected(true)

    // Welcome messages for test
    addSystemMessage('📱 Connected to Test Event')
    addBotMessage('🧪 Welcome to the SMS Voting Test! This is a demo environment.')
    addBotMessage('You have 5 test votes. Try typing "Luna Starlight" or "HELP" for commands.')

    setLoading(false)
  }

  // Command processing system
  const commands: VotingCommands = {
    async VOTE(artistName: string) {
      if (!votingSession || votingSession.votesRemaining <= 0) {
        addBotMessage('❌ No votes remaining! Type "STATUS" to check your voting summary.')
        return
      }

      // Fuzzy match artist name
      const matchedArtist = artists.find(artist =>
        artist.artist_name.toLowerCase().includes(artistName.toLowerCase()) ||
        artistName.toLowerCase().includes(artist.artist_name.toLowerCase())
      )

      if (!matchedArtist) {
        addBotMessage(`❌ Artist "${artistName}" not found. Type "ARTISTS" to see all options.`)
        return
      }

      if (votingSession.votedArtists.includes(matchedArtist.id)) {
        addBotMessage(`⚠️ You already voted for ${matchedArtist.artist_name}!`)
        return
      }

      try {
        // Cast vote (test mode doesn't hit database)
        if (shareableCode !== 'test' && event) {
          const { error: voteError } = await supabase
            .from('event_votes')
            .insert({
              event_id: event.id,
              artist_id: matchedArtist.id,
              participant_token: participantToken,
              vote_method: 'sms_chat',
              message_context: {
                original_message: artistName,
                matched_artist: matchedArtist.artist_name,
                timestamp: new Date().toISOString()
              },
              platform_source: 'web',
              created_at: new Date().toISOString()
            })

          if (voteError) {
            addBotMessage('❌ Vote failed. Please try again.')
            return
          }
        }

        // Update local state
        setVotingSession(prev => prev ? {
          ...prev,
          votesRemaining: prev.votesRemaining - 1,
          votedArtists: [...prev.votedArtists, matchedArtist.id]
        } : null)

        setArtists(prev => prev.map(artist =>
          artist.id === matchedArtist.id
            ? { ...artist, vote_count: artist.vote_count + 1 }
            : artist
        ))

        // Success message
        addBotMessage(
          `✅ Vote confirmed for ${matchedArtist.artist_name}! 🗳️`,
          { messageType: 'confirmation', voteConfirmed: true, artistId: matchedArtist.id, styling: { highlight: true, color: 'text-green-400' } }
        )

        const newVoteCount = matchedArtist.vote_count + 1
        const remainingVotes = votingSession.votesRemaining - 1

        addBotMessage(`${matchedArtist.artist_name} now has ${newVoteCount} votes. You have ${remainingVotes} votes left.`)

        if (remainingVotes === 0) {
          addBotMessage('🎉 All votes cast! Type "RESULTS" to see the leaderboard or "STATUS" for your summary.')
        }

      } catch (error) {
        addBotMessage('❌ Something went wrong. Please try again.')
      }
    },

    async HELP() {
      addBotMessage('📋 Available commands:')
      addBotMessage('• Type artist name to vote (e.g. "Luna Starlight")')
      addBotMessage('• HELP - Show this menu')
      addBotMessage('• STATUS - Your voting status')
      addBotMessage('• RESULTS - Current leaderboard')
      addBotMessage('• ARTISTS - List all artists')
      addBotMessage('• BUZZ - Show excitement! 🔥')
      addBotMessage('• CLEAR - Clear chat history')
    },

    async STATUS() {
      if (!votingSession) {
        addBotMessage('❌ No active voting session.')
        return
      }

      addBotMessage('📊 Your Voting Status:')
      addBotMessage(`• Votes cast: ${votingSession.totalVotes - votingSession.votesRemaining}/${votingSession.totalVotes}`)
      addBotMessage(`• Votes remaining: ${votingSession.votesRemaining}`)

      if (votingSession.votedArtists.length > 0) {
        const votedArtistNames = votingSession.votedArtists
          .map(id => artists.find(a => a.id === id)?.artist_name)
          .filter(Boolean)
        addBotMessage(`• You voted for: ${votedArtistNames.join(', ')}`)
      }

      addBotMessage(`• Session started: ${votingSession.sessionStarted.toLocaleTimeString()}`)
    },

    async RESULTS() {
      const sortedArtists = [...artists].sort((a, b) => b.vote_count - a.vote_count)

      addBotMessage('🏆 Current Leaderboard:')
      sortedArtists.slice(0, 5).forEach((artist, index) => {
        const position = index + 1
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`
        addBotMessage(`${medal} ${artist.artist_name} - ${artist.vote_count} votes`)
      })

      if (sortedArtists.length > 5) {
        addBotMessage(`... and ${sortedArtists.length - 5} more artists`)
      }
    },

    async ARTISTS() {
      addBotMessage('🎤 Participating Artists:')
      artists.forEach(artist => {
        addBotMessage(`• ${artist.artist_name} (${artist.vote_count} votes)`)
      })
      addBotMessage('Type any artist name to vote!')
    },

    CLEAR() {
      setMessages([])
      addSystemMessage('💬 Chat cleared')
      addBotMessage('Chat history cleared! Type "HELP" for commands.')
    },

    async BUZZ() {
      addBotMessage('🔥 BUZZ! Your excitement has been noted! 🔥')
      addSystemMessage('⚡ Buzz sent to event organizers')
    }
  }

  const processMessage = async (message: string) => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    // Add user message
    addMessage('user', trimmedMessage, { messageType: 'command' })
    setInputMessage('')

    // Process command or vote
    const upperMessage = trimmedMessage.toUpperCase()

    if (upperMessage === 'HELP') {
      await commands.HELP()
    } else if (upperMessage === 'STATUS') {
      await commands.STATUS()
    } else if (upperMessage === 'RESULTS') {
      await commands.RESULTS()
    } else if (upperMessage === 'ARTISTS') {
      await commands.ARTISTS()
    } else if (upperMessage === 'CLEAR') {
      commands.CLEAR()
    } else if (upperMessage === 'BUZZ') {
      await commands.BUZZ()
    } else {
      // Treat as artist vote
      await commands.VOTE(trimmedMessage)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !isConnected) return

    await processMessage(inputMessage)
  }

  const getMessageBubbleStyles = (message: ChatMessage) => {
    const baseStyles = "max-w-[80%] p-3 rounded-2xl break-words"

    switch (message.type) {
      case 'user':
        return `${baseStyles} bg-blue-500 text-white ml-auto rounded-br-md`
      case 'bot':
        return `${baseStyles} bg-gray-700 text-white mr-auto rounded-bl-md ${
          message.metadata?.styling?.highlight ? 'ring-2 ring-green-400' : ''
        }`
      case 'system':
        return `${baseStyles} bg-gray-800/50 text-gray-400 mx-auto text-center text-sm rounded-full`
      default:
        return baseStyles
    }
  }

  const getMessageIcon = (message: ChatMessage) => {
    if (message.type === 'user') return '👤'
    if (message.type === 'system') return '📱'
    if (message.metadata?.messageType === 'confirmation') return '🤖✅'
    return '🤖'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <p>Connecting to voting session...</p>
          <p className="text-sm text-gray-400 mt-2">Setting up SMS-style interface</p>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">📱</div>
          <h2 className="text-2xl font-bold mb-4">Connection Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/events/global')}
            className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
          >
            Browse Other Events
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 border-b border-gray-700 p-4 flex-shrink-0"
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-accent-yellow">
                📱 {event?.title || 'SMS Voting'}
              </h1>
              <p className="text-sm text-gray-400">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'} • {artists.length} artists
              </p>
            </div>
            {votingSession && (
              <div className="text-right">
                <div className="text-2xl font-bold text-accent-yellow">
                  {votingSession.votesRemaining}
                </div>
                <div className="text-xs text-gray-400">votes left</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="max-w-2xl mx-auto">
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
                  <div className="text-xl flex-shrink-0 mt-1">
                    {getMessageIcon(message)}
                  </div>
                )}

                <div className={getMessageBubbleStyles(message)}>
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
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 border-t border-gray-700 p-4 flex-shrink-0"
      >
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type artist name or command..."
              disabled={!isConnected}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected}
              className="bg-accent-yellow text-black px-6 py-3 rounded-full font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Send</span>
              <span>📤</span>
            </button>
          </form>

          {/* Quick Commands */}
          <div className="mt-3 flex flex-wrap gap-2">
            {['HELP', 'STATUS', 'RESULTS', 'ARTISTS'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => processMessage(cmd)}
                disabled={!isConnected}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SMSVotingInterface