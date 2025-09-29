import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import ProfilePhotoUpload from './ProfilePhotoUpload'

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

    } catch (error) {
      console.error('Error loading artist data:', error)
      setError('Failed to load registration information')
    } finally {
      setLoading(false)
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
            <h3 className="font-medium mb-2">Your Information:</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p><strong>Name:</strong> {formData.name}</p>
              {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
              {formData.instagram && <p><strong>Instagram:</strong> {formData.instagram}</p>}
              {formData.bio && <p><strong>Bio:</strong> {formData.bio}</p>}
            </div>
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

            <div className="space-y-4">
              {/* Profile Photo Upload */}
              <div className="text-center">
                <ProfilePhotoUpload
                  userId={artist?.id}
                  currentPhotoUrl={formData.profilePhoto}
                  onPhotoUploaded={(photoUrl) => setFormData(prev => ({ ...prev, profilePhoto: photoUrl }))}
                  size="large"
                  userType="artist"
                  className="mx-auto mb-2"
                />
                <p className="text-xs text-gray-400">Upload your artist photo</p>
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
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                !formData.name.trim() || saving
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