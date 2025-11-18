import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface EventDetails {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  status: 'draft' | 'published' | 'live' | 'completed'
  shareable_code: string
  location?: string
  voting_start_time?: string
  voting_end_time?: string
  max_votes_per_participant: number
}

interface ParticipantSession {
  email?: string
  name?: string
  sessionToken: string
  canVote: boolean
  hasVoted: boolean
  votesRemaining: number
}

const EventLandingPage: React.FC = () => {
  const { shareableCode } = useParams<{ shareableCode: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [session, setSession] = useState<ParticipantSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [allowVoting, setAllowVoting] = useState(true)
  const [allowScoring, setAllowScoring] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  // Load event and check existing session
  useEffect(() => {
    if (shareableCode) {
      loadEventAndSession()
    }
  }, [shareableCode])

  // Countdown timer
  useEffect(() => {
    if (!event?.voting_start_time) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const votingStart = new Date(event.voting_start_time!).getTime()
      const distance = votingStart - now

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setTimeRemaining({ days, hours, minutes, seconds })
      } else {
        setTimeRemaining(null)
        // Voting has started - refresh session
        checkVotingAccess()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [event])

  const loadEventAndSession = async () => {
    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('shareable_code', shareableCode)
        .single()

      if (eventError) {
        console.error('Error loading event:', eventError)
        return
      }

      setEvent(eventData)

      // Check for existing session
      const existingSession = getStoredSession()
      if (existingSession) {
        setSession(existingSession)
        await checkVotingAccess()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStoredSession = (): ParticipantSession | null => {
    try {
      const stored = localStorage.getItem(`voting_session_${shareableCode}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const storeSession = (sessionData: ParticipantSession) => {
    localStorage.setItem(`voting_session_${shareableCode}`, JSON.stringify(sessionData))
    // Also set a cookie for additional persistence
    document.cookie = `voting_token_${shareableCode}=${sessionData.sessionToken}; max-age=86400; path=/`
  }

  const checkVotingAccess = async () => {
    if (!event || !session) return

    // Check if voting window is open
    const now = new Date()
    const votingStart = event.voting_start_time ? new Date(event.voting_start_time) : null
    const votingEnd = event.voting_end_time ? new Date(event.voting_end_time) : null

    const canVote = event.status === 'live' &&
                   (!votingStart || now >= votingStart) &&
                   (!votingEnd || now <= votingEnd)

    // Update session
    const updatedSession = { ...session, canVote }
    setSession(updatedSession)
    storeSession(updatedSession)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name || !event) return

    try {
      // Generate unique session token
      const sessionToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Store participant session
      const sessionData: ParticipantSession = {
        email,
        name,
        sessionToken,
        canVote: false,
        hasVoted: false,
        votesRemaining: event.max_votes_per_participant
      }

      // Store in database for email sending
      await supabase.from('event_participants').upsert({
        event_id: event.id,
        email,
        name,
        session_token: sessionToken,
        allow_voting: allowVoting,
        allow_scoring: allowScoring,
        consent_timestamp: new Date().toISOString(),
        registered_at: new Date().toISOString()
      })

      // Send welcome email (we'll implement this Edge Function)
      await supabase.functions.invoke('send-voting-email', {
        body: {
          email,
          name,
          event,
          sessionToken,
          shareableCode
        }
      })

      setSession(sessionData)
      storeSession(sessionData)
      setShowEmailForm(false)

      // Show success message
      alert('🎉 Registration successful! Check your email for voting details.')

    } catch (error) {
      console.error('Error registering:', error)
      alert('Registration failed. Please try again.')
    }
  }

  const enterVoting = () => {
    if (session?.canVote) {
      navigate(`/vote/${shareableCode}?token=${session.sessionToken}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-white text-xl">Loading event...</div>
        </motion.div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10 text-center">
          <div className="text-red-400 text-xl mb-4">❌ Event Not Found</div>
          <div className="text-gray-300">The event code you're looking for doesn't exist.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Event Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {event.title}
          </h1>
          <p className="text-xl text-gray-300 mb-6">{event.description}</p>
          {event.location && (
            <div className="text-gray-400 mb-4">📍 {event.location}</div>
          )}

          {/* Event Status Badge */}
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            event.status === 'live' ? 'bg-green-500/20 text-green-300' :
            event.status === 'published' ? 'bg-blue-500/20 text-blue-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {event.status.toUpperCase()}
          </div>
        </motion.div>

        {/* Countdown Timer */}
        {timeRemaining && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10 mb-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-6">🕐 Voting Starts In</h2>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              {[
                { label: 'Days', value: timeRemaining.days },
                { label: 'Hours', value: timeRemaining.hours },
                { label: 'Minutes', value: timeRemaining.minutes },
                { label: 'Seconds', value: timeRemaining.seconds }
              ].map(({ label, value }) => (
                <motion.div
                  key={label}
                  className="backdrop-blur-xl bg-white/10 rounded-2xl p-4"
                  animate={{ scale: label === 'Seconds' ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1, repeat: label === 'Seconds' ? Infinity : 0 }}
                >
                  <div className="text-3xl font-bold text-white">{value}</div>
                  <div className="text-gray-300 text-sm">{label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Action Area */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {!session ? (
              // Registration Form
              <motion.div
                key="registration"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">🎫 Get Your Voting Access</h2>
                  <p className="text-gray-300">Register to receive voting instructions via email</p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      required
                    />
                  </div>

                  {/* Opt-In Checkboxes */}
                  <div className="space-y-4 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-white font-medium mb-3">Participation Preferences</p>

                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <div className="relative flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={allowVoting}
                          onChange={(e) => setAllowVoting(e.target.checked)}
                          className="w-5 h-5 bg-white/10 border-2 border-white/30 rounded checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-white group-hover:text-blue-300 transition-colors">
                          🗳️ Allow Voting
                        </span>
                        <p className="text-gray-400 text-sm mt-1">
                          I want to cast votes for artists in this event
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <div className="relative flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={allowScoring}
                          onChange={(e) => setAllowScoring(e.target.checked)}
                          className="w-5 h-5 bg-white/10 border-2 border-white/30 rounded checked:bg-purple-500 checked:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-white group-hover:text-purple-300 transition-colors">
                          ⭐ Allow Scoring
                        </span>
                        <p className="text-gray-400 text-sm mt-1">
                          I want to rate and score artist performances
                        </p>
                      </div>
                    </label>

                    {!allowVoting && !allowScoring && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-amber-400 text-sm mt-2 flex items-center space-x-2"
                      >
                        <span>⚠️</span>
                        <span>Please select at least one participation option</span>
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={!allowVoting && !allowScoring}
                    whileHover={allowVoting || allowScoring ? { scale: 1.05 } : {}}
                    whileTap={allowVoting || allowScoring ? { scale: 0.95 } : {}}
                    className={`w-full p-4 rounded-2xl text-white font-semibold shadow-lg transition-all ${
                      allowVoting || allowScoring
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    🚀 Register for Event
                  </motion.button>
                </form>
              </motion.div>
            ) : session.canVote ? (
              // Voting Access
              <motion.div
                key="voting-access"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10 text-center"
              >
                <h2 className="text-2xl font-bold text-white mb-4">🗳️ Voting is Open!</h2>
                <p className="text-gray-300 mb-6">Welcome back, {session.name}!</p>
                <p className="text-gray-400 mb-8">You have {session.votesRemaining} votes remaining</p>

                <motion.button
                  onClick={enterVoting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl text-white font-bold text-xl shadow-xl"
                >
                  ✨ Enter Voting Portal
                </motion.button>
              </motion.div>
            ) : (
              // Waiting for Voting
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10 text-center"
              >
                <h2 className="text-2xl font-bold text-white mb-4">✅ Registration Complete!</h2>
                <p className="text-gray-300 mb-6">Hi {session.name}, you're all set!</p>
                <p className="text-gray-400">Voting will be available when the event goes live.</p>

                <motion.div
                  className="mt-6 text-blue-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📧 Check your email for updates
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share Event */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Event link copied to clipboard!')
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            🔗 Share this event
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default EventLandingPage