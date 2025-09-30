import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface Event {
  id: string
  title: string
  description: string
  status: string
  max_votes_per_participant: number
  shareable_code: string
  start_date: string
  end_date: string
}

interface Artist {
  id: string
  name: string
  bio: string
  profile_image_url?: string
  vote_count: number
}

interface VotingSession {
  participantId: string
  votesRemaining: number
  votedArtists: string[]
}

const VotingInterface: React.FC = () => {
  const { shareableCode } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participantToken, setParticipantToken] = useState<string | null>(null)

  useEffect(() => {
    if (shareableCode) {
      initializeVotingSession()
    }
  }, [shareableCode])

  const generateParticipantToken = () => {
    return `voter_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  const initializeVotingSession = async () => {
    try {
      setError(null)

      // Get event details - allow published and live events for voting
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('shareable_code', shareableCode)
        .in('status', ['published', 'live'])
        .single()

      if (eventError || !eventData) {
        console.error('Event not found or not available for voting. Error:', eventError)
        setError('Event not found or not available for voting.')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Get participating artists from prospects table
      const { data: artistsData, error: artistsError } = await supabase
        .from('event_artist_prospects')
        .select('*')
        .eq('event_id', eventData.id)
        .eq('contact_status', 'confirmed')

      if (artistsError) {
        console.error('Failed to load artists:', artistsError)
      }

      if (artistsData) {
        const formattedArtists = artistsData.map((artist: any) => ({
          id: artist.id,
          name: artist.artist_name || artist.name || 'Unknown Artist',
          bio: artist.bio || 'No bio available',
          profile_image_url: artist.profile_image_url,
          vote_count: 0 // Will be loaded from votes table
        }))
        setArtists(formattedArtists)

        // Load current vote counts
        await loadVoteCounts(eventData.id, formattedArtists.map(a => a.id))
      }

      // Create or get participant session
      const token = localStorage.getItem(`voter_${eventData.id}`) || generateParticipantToken()
      localStorage.setItem(`voter_${eventData.id}`, token)
      setParticipantToken(token)

      // Check existing votes for this participant
      const { data: existingVotes } = await supabase
        .from('event_votes')
        .select('artist_id')
        .eq('event_id', eventData.id)
        .eq('participant_token', token)

      const votedArtists = existingVotes?.map(v => v.artist_id) || []

      setVotingSession({
        participantId: token,
        votesRemaining: Math.max(0, eventData.max_votes_per_participant - votedArtists.length),
        votedArtists
      })

    } catch (error) {
      console.error('Failed to initialize voting session:', error)
      setError('Failed to load voting interface. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadVoteCounts = async (eventId: string, artistIds: string[]) => {
    const { data: voteCounts } = await supabase
      .from('event_votes')
      .select('artist_id')
      .eq('event_id', eventId)
      .in('artist_id', artistIds)

    if (voteCounts) {
      const countMap = voteCounts.reduce((acc, vote) => {
        acc[vote.artist_id] = (acc[vote.artist_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setArtists(prev => prev.map(artist => ({
        ...artist,
        vote_count: countMap[artist.id] || 0
      })))
    }
  }

  const castVote = async (artistId: string) => {
    if (!votingSession || !event || !participantToken || votingSession.votesRemaining <= 0) {
      return
    }

    if (votingSession.votedArtists.includes(artistId)) {
      setError('You have already voted for this artist.')
      return
    }

    try {
      // Insert vote into database
      const { error: voteError } = await supabase
        .from('event_votes')
        .insert({
          event_id: event.id,
          artist_id: artistId,
          participant_token: participantToken,
          created_at: new Date().toISOString()
        })

      if (voteError) {
        console.error('Failed to cast vote:', voteError)
        setError('Failed to cast vote. Please try again.')
        return
      }

      // Update local state
      setVotingSession(prev => prev ? {
        ...prev,
        votesRemaining: prev.votesRemaining - 1,
        votedArtists: [...prev.votedArtists, artistId]
      } : null)

      // Update local artist vote count
      setArtists(prev => prev.map(artist =>
        artist.id === artistId
          ? { ...artist, vote_count: artist.vote_count + 1 }
          : artist
      ))

      setError(null)

    } catch (error) {
      console.error('Error casting vote:', error)
      setError('Failed to cast vote. Please try again.')
    }
  }

  const viewResults = () => {
    navigate(`/events/results/${shareableCode}`)
  }

  const goToEventPage = () => {
    navigate(`/events/view/${shareableCode}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <p>Loading voting interface...</p>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-6">🗳️</div>
          <h2 className="text-2xl font-bold mb-4">Voting Not Available</h2>
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

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Event not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-accent-yellow to-orange-400 bg-clip-text text-transparent">
            {event.title}
          </h1>
          <p className="text-gray-300 mb-6">{event.description}</p>

          {votingSession && (
            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 inline-block">
              <div className="flex items-center space-x-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-accent-yellow">{votingSession.votesRemaining}</div>
                  <div className="text-sm text-gray-400">Votes Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{votingSession.votedArtists.length}</div>
                  <div className="text-sm text-gray-400">Votes Cast</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6 text-center"
          >
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Artists Grid */}
        {artists.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {artists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`bg-gray-900/50 border rounded-lg p-6 text-center transition-all ${
                  votingSession?.votedArtists.includes(artist.id)
                    ? 'border-green-500/50 bg-green-900/20'
                    : 'border-gray-700/50 hover:border-accent-yellow/50'
                }`}
              >
                {/* Artist Image */}
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 overflow-hidden">
                  {artist.profile_image_url ? (
                    <img
                      src={artist.profile_image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎤
                    </div>
                  )}
                </div>

                {/* Artist Info */}
                <h3 className="text-xl font-bold mb-2">{artist.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{artist.bio}</p>

                {/* Vote Count */}
                <div className="text-accent-yellow font-medium mb-4">
                  {artist.vote_count} votes
                </div>

                {/* Vote Button */}
                <button
                  onClick={() => castVote(artist.id)}
                  disabled={
                    !votingSession ||
                    votingSession.votesRemaining <= 0 ||
                    votingSession.votedArtists.includes(artist.id)
                  }
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    votingSession?.votedArtists.includes(artist.id)
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : votingSession?.votesRemaining && votingSession.votesRemaining > 0
                      ? 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {votingSession?.votedArtists.includes(artist.id)
                    ? '✓ Voted'
                    : votingSession?.votesRemaining && votingSession.votesRemaining > 0
                    ? 'Vote'
                    : 'No Votes Left'
                  }
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🎤</div>
            <h3 className="text-2xl font-bold mb-4">No Artists Yet</h3>
            <p className="text-gray-400 mb-8">
              Artists are still being added to this event. Check back soon!
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center space-x-4"
        >
          <button
            onClick={goToEventPage}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            📅 Event Details
          </button>
          <button
            onClick={viewResults}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            📊 View Results
          </button>
        </motion.div>

        {/* Voting Complete Message */}
        {votingSession && votingSession.votesRemaining === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg"
          >
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Thank You for Voting!</h3>
            <p className="text-gray-300">
              You've used all your votes. Check back later to see the results!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default VotingInterface