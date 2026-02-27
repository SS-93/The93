import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import ProfilePhotoUpload from './ProfilePhotoUpload'
import { syncAttendeeFromRegistration } from '../../lib/concierto/attendeeConversion'

interface EventInfo {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  shareable_code: string
}

interface AudienceMember {
  id: string
  event_id: string
  name: string
  email: string
  phone?: string
  registration_token: string
  registered_at: string
  can_edit: boolean
}

const AudienceRegistration: React.FC = () => {
  const { eventCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [existingMember, setExistingMember] = useState<AudienceMember | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePhoto: ''
  })
  const [isRegistered, setIsRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editToken, setEditToken] = useState<string | null>(null)

  useEffect(() => {
    if (eventCode) {
      loadEventData()
    }

    // Check for edit token in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('edit')
    if (token) {
      setEditToken(token)
      loadExistingRegistration(token)
    }
  }, [eventCode])

  const loadEventData = async () => {
    try {
      setError(null)

      // Find event by shareable code
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date, shareable_code')
        .eq('shareable_code', eventCode)
        .single()

      if (eventError || !eventData) {
        setError('Event not found or no longer available')
        return
      }

      setEvent(eventData)

    } catch (error) {
      console.error('Error loading event data:', error)
      setError('Failed to load event information')
    } finally {
      setLoading(false)
    }
  }

  const loadExistingRegistration = async (token: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('event_audience_members')
        .select('*')
        .eq('registration_token', token)
        .single()

      if (memberData) {
        setExistingMember(memberData)
        setFormData({
          name: memberData.name || '',
          email: memberData.email || '',
          phone: memberData.phone || '',
          profilePhoto: memberData.profile_image_url || ''
        })
        setIsRegistered(true)

        // Check if still within 24-hour edit window
        const registeredAt = new Date(memberData.registered_at)
        const now = new Date()
        const hoursSinceRegistration = (now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceRegistration > 24) {
          setError('Edit window has expired. You can only edit your information within 24 hours of registration.')
        }
      }
    } catch (error) {
      console.error('Error loading existing registration:', error)
    }
  }

  const generateRegistrationToken = () => {
    return 'aud_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(36))
      .join('')
      .slice(0, 40)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !formData.name.trim() || !formData.email.trim()) return

    setSaving(true)
    try {
      if (existingMember && editToken) {
        // Update existing registration
        const { error } = await supabase
          .from('event_audience_members')
          .update({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            profile_image_url: formData.profilePhoto || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMember.id)

        if (error) throw error
        console.log('✅ Audience member updated successfully')

      } else {
        // Create new registration
        const registrationToken = generateRegistrationToken()

        const { data, error } = await supabase
          .from('event_audience_members')
          .insert({
            event_id: event.id,
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            profile_image_url: formData.profilePhoto || null,
            registration_token: registrationToken,
            registered_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error

        setExistingMember(data)
        setEditToken(registrationToken)
        console.log('✅ Audience member registered successfully')

        // Sync to conversion pipeline
        if (data.email) {
          try {
            await syncAttendeeFromRegistration(
              event.id,
              'fan',
              {
                id: data.id,
                email: data.email,
                name: data.name,
                phone: data.phone || null
              },
              'registration_form'
            )
            console.log('✅ Attendee synced to conversion pipeline')
          } catch (conversionError) {
            console.warn('⚠️ Conversion sync failed (non-critical):', conversionError)
            // Don't fail registration if conversion sync fails
          }
        }
      }

      setIsRegistered(true)

      // Navigate to event preview page with countdown after successful registration
      setTimeout(() => {
        navigate(`/events/view/${event?.shareable_code}`)
      }, 1000)

    } catch (error) {
      console.error('Error saving registration:', error)
      setError('Failed to save your registration. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePerformerRegister = () => {
    if (event) {
      // Navigate to artist registration page for this event
      // This would be a different flow where artists get added by admin first
      navigate(`/events/create?performer=true&event=${event.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow mx-auto mb-4"></div>
          <p>Loading event...</p>
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

  if (isRegistered && !editToken) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Registration Complete!</h1>
          <p className="text-gray-400 mb-2">You're now registered for</p>
          <h2 className="text-xl font-semibold text-accent-yellow mb-6">{event?.title}</h2>

          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium mb-2">Your Registration:</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
            </div>
            {existingMember && (
              <p className="text-xs text-gray-500 mt-3">
                ✏️ You can edit this information for 24 hours after registration.
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
              onClick={() => navigate(`/events/vote/${event?.shareable_code}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              🗳️ Go to Voting
            </button>
            <button
              onClick={() => navigate('/events')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
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
          <h1 className="text-3xl font-bold mb-2">
            {editToken ? 'Edit Registration' : 'Register for Event'}
          </h1>
          <p className="text-gray-400">
            {editToken ? 'Update your information for' : 'Join the audience for'}
          </p>
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
                  userId={existingMember?.id || 'new'}
                  currentPhotoUrl={formData.profilePhoto}
                  onPhotoUploaded={(photoUrl) => setFormData(prev => ({ ...prev, profilePhoto: photoUrl }))}
                  size="large"
                  userType="audience"
                  className="mx-auto mb-2"
                />
                <p className="text-xs text-gray-400">Upload your profile photo</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
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
              disabled={!formData.name.trim() || !formData.email.trim() || saving}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                !formData.name.trim() || !formData.email.trim() || saving
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
              }`}
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              )}
              <span>{saving ? 'Saving...' : editToken ? 'Update Registration' : 'Register'}</span>
            </button>
          </div>
        </form>

        {/* Performer Registration Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm mb-4">
            Are you a performer looking to participate in this event?
          </p>
          <p className="text-center">
            <button
              onClick={handlePerformerRegister}
              className="text-accent-yellow hover:text-accent-yellow/80 underline transition-colors"
            >
              Register as a Performer →
            </button>
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            Note: Performer registration requires approval from the event host.
          </p>
        </div>

        {editToken && (
          <p className="text-xs text-gray-500 text-center mt-8">
            ⏰ You can edit your registration information for 24 hours after signing up.
            After that, your information will be locked for event security.
          </p>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          By registering, you agree to receive event-related communications and confirm your participation in this voting event.
        </p>
      </div>
    </div>
  )
}

export default AudienceRegistration