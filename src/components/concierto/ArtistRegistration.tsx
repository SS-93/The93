import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import ArtistPhotoUploader from './ArtistPhotoUploader'
import { syncAttendeeFromRegistration } from '../../lib/concierto/attendeeConversion'

interface ArtistProspect {
  id: string
  artist_name: string
  email?: string
  instagram_handle?: string
  bio?: string
  contact_status: string
  event_id: string
  registration_token: string
  host_notes?: string
  migrated_to_user_id?: string | null
  profile_image_url?: string | null
}

interface EventInfo {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  shareable_code: string
}

const ArtistRegistration: React.FC = () => {
  const { registrationToken } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [artist, setArtist] = useState<ArtistProspect | null>(null)
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    instagram: '',
    bio: '',
    profilePhoto: ''
  })
  const [isRegistered, setIsRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLinked, setIsLinked] = useState(false)
  const [linking, setLinking] = useState(false)
  const [linkMessage, setLinkMessage] = useState<string | null>(null)

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (registrationToken) {
      loadArtistData()
    }
  }, [registrationToken])

  const loadArtistData = async () => {
    try {
      setError(null)

      // Find artist by registration token
      const { data: artistData, error: artistError } = await supabase
        .from('event_artist_prospects')
        .select(`
          *,
          events (
            id,
            title,
            description,
            start_date,
            end_date,
            shareable_code
          )
        `)
        .eq('registration_token', registrationToken)
        .single()

      if (artistError || !artistData) {
        setError('Invalid or expired registration link')
        return
      }

      setArtist(artistData)
      setEvent(artistData.events)

      // Pre-fill form with existing data
      setFormData({
        name: artistData.artist_name || '',
        email: artistData.email || '',
        instagram: artistData.instagram_handle || '',
        bio: artistData.bio || '',
        profilePhoto: artistData.profile_image_url || ''
      })

      // Check if already registered/confirmed
      setIsRegistered(artistData.contact_status === 'confirmed')

      // Check if account is already linked
      if (artistData.migrated_to_user_id) {
        setIsLinked(true)
      }

    } catch (error) {
      console.error('Error loading artist data:', error)
      setError('Failed to load registration information')
    } finally {
      setLoading(false)
    }
  }

  // Link Account — sets migrated_to_user_id on the artist prospect
  const handleLinkAccount = async () => {
    if (!currentUser || !artist) return

    setLinking(true)
    setLinkMessage(null)
    try {
      // Update the prospect row with the logged-in user's ID
      const { error: updateError } = await supabase
        .from('event_artist_prospects')
        .update({
          migrated_to_user_id: currentUser.id,
          contact_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', artist.id)

      if (updateError) throw updateError

      // Also connect via backend for passport logging
      try {
        await fetch(`${API_URL}/api/treasury/connect-artist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: artist.event_id,
            artistUserId: currentUser.id,
            artistName: formData.name || artist.artist_name
          })
        })
      } catch (apiErr) {
        // Non-critical — the direct update above is the important one
        console.warn('Backend connect-artist call failed (non-critical):', apiErr)
      }

      setIsLinked(true)
      setLinkMessage('✅ Account linked! Revenue splits will now flow to your wallet.')
      console.log('✅ Artist account linked:', currentUser.id)

    } catch (err: any) {
      console.error('Error linking account:', err)
      setLinkMessage(`❌ Failed to link: ${err.message}`)
    } finally {
      setLinking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artist || !formData.name.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('event_artist_prospects')
        .update({
          artist_name: formData.name.trim(),
          email: formData.email || null,
          instagram_handle: formData.instagram || null,
          bio: formData.bio || null,
          profile_image_url: formData.profilePhoto || null,
          contact_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', artist.id)

      if (error) {
        throw error
      }

      setIsRegistered(true)
      setArtist(prev => prev ? { ...prev, contact_status: 'confirmed' } : null)

      // Sync to conversion pipeline
      if (formData.email && artist) {
        try {
          await syncAttendeeFromRegistration(
            artist.event_id,
            'artist',
            {
              id: artist.id,
              email: formData.email,
              name: formData.name,
              phone: null
            },
            'registration_form'
          )
          console.log('✅ Artist synced to conversion pipeline')
        } catch (conversionError) {
          console.warn('⚠️ Conversion sync failed (non-critical):', conversionError)
          // Don't fail registration if conversion sync fails
        }
      }

    } catch (error) {
      console.error('Error updating artist registration:', error)
      setError('Failed to save your information. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <p>Loading registration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Registration Error</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => navigate('/events')}
            className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
          >
            Browse Events
          </button>
        </div>
      </div>
    )
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Registration Complete!</h1>
          <p className="text-gray-400 mb-2">Thank you for confirming your participation in</p>
          <h2 className="text-xl font-semibold text-accent-yellow mb-6">{event?.title}</h2>

          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium mb-3">Your Information:</h3>

            {/* Artist Photo Preview */}
            {formData.profilePhoto && (
              <div className="flex justify-center mb-4">
                <img
                  src={formData.profilePhoto}
                  alt={formData.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-accent-yellow"
                />
              </div>
            )}

            <div className="space-y-1 text-sm text-gray-300">
              <p><strong>Name:</strong> {formData.name}</p>
              {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
              {formData.instagram && <p><strong>Instagram:</strong> {formData.instagram}</p>}
              {formData.bio && <p><strong>Bio:</strong> {formData.bio}</p>}
            </div>
          </div>

          {/* Link Account Section */}
          <div className={`border rounded-lg p-4 mb-6 ${isLinked
              ? 'bg-green-900/20 border-green-700/50'
              : 'bg-purple-900/20 border-purple-700/50'
            }`}>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              {isLinked ? '✅ Account Linked' : '🔗 Link Your Buckets Account'}
            </h3>
            {isLinked ? (
              <p className="text-sm text-green-400">
                Your Buckets account is connected. Revenue splits from this event will flow directly to your wallet.
              </p>
            ) : currentUser ? (
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  Link your Buckets account to receive revenue splits from ticket sales directly in your wallet.
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">
                    Signed in as <span className="text-purple-400 font-mono">{currentUser.email}</span>
                  </div>
                  <button
                    onClick={handleLinkAccount}
                    disabled={linking}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    {linking ? 'Linking...' : '🔗 Link Account'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  Sign in to your Buckets account to receive revenue splits from this event.
                </p>
                <button
                  onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  🔐 Sign In to Link
                </button>
              </div>
            )}
            {linkMessage && (
              <p className={`text-sm mt-2 ${linkMessage.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {linkMessage}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(`/events/view/${event?.shareable_code}`)}
              className="w-full bg-accent-yellow text-black px-4 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
            >
              🎉 Go to Event Page
            </button>
            <button
              onClick={() => setIsRegistered(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Edit Information
            </button>
            <button
              onClick={() => navigate('/events')}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Other Events
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Artist Registration</h1>
          <p className="text-gray-400">Complete your information for</p>
          <h2 className="text-xl font-semibold text-accent-yellow mt-2">{event?.title}</h2>
        </div>

        {event && (
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 mb-8">
            <h3 className="font-medium mb-4">Event Details</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Description:</strong> {event.description}</p>
              <p><strong>Start:</strong> {new Date(event.start_date).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(event.end_date).toLocaleString()}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6">
            <h3 className="font-medium mb-6">Your Information</h3>

            <div className="space-y-6">
              {/* Artist Photo Upload - Prominent */}
              <div>
                <label className="block text-sm font-medium mb-3 text-center">
                  Artist Photo *
                </label>
                <ArtistPhotoUploader
                  currentPhotoUrl={formData.profilePhoto}
                  onPhotoUploaded={(photoUrl) => setFormData(prev => ({ ...prev, profilePhoto: photoUrl }))}
                  artistId={artist?.id}
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Artist/Band Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your stage name or band name"
                  required
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium mb-2">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@yourusername"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-2">
                  Artist Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about your music, style, and what makes you unique..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Link Account Section (on form) */}
          <div className={`border rounded-lg p-6 ${isLinked
              ? 'bg-green-900/20 border-green-700/50'
              : 'bg-purple-900/20 border-purple-700/50'
            }`}>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              {isLinked ? '✅ Account Linked' : '🔗 Link Your Buckets Account'}
            </h3>
            {isLinked ? (
              <p className="text-sm text-green-400">
                Your Buckets account is connected. You'll receive revenue splits from ticket sales in your wallet.
              </p>
            ) : currentUser ? (
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  Connect your Buckets account to receive event revenue splits directly in your wallet.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Signed in as <span className="text-purple-400 font-mono">{currentUser.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLinkAccount}
                    disabled={linking}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    {linking ? 'Linking...' : '🔗 Link Account'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  Have a Buckets account? Sign in to link it and receive event revenue directly.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  🔐 Sign In to Link
                </button>
              </div>
            )}
            {linkMessage && (
              <p className={`text-sm mt-2 ${linkMessage.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {linkMessage}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || saving}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${!formData.name.trim() || saving
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
                }`}
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              )}
              <span>{saving ? 'Saving...' : 'Confirm Registration'}</span>
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center mt-8">
          By registering, you confirm your participation in this voting event and agree to have your information displayed to event participants.
        </p>
      </div>
    </div>
  )
}

export default ArtistRegistration