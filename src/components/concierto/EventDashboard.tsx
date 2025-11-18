import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ConciertoMediaIdService } from '../../lib/conciertoMediaIdService'
import { supabase } from '../../lib/supabaseClient'
import ArtistPhotoUploader from './ArtistPhotoUploader'
import EventBannerUploader from './EventBannerUploader'
import EventVideoPlayer from './EventVideoPlayer'
import EventDetailsEditor from './EventDetailsEditor'

interface EventDetails {
  id: string
  title: string
  description: string
  status: string
  shareable_code: string
  start_date: string
  end_date: string
  max_votes_per_participant: number
  mediaid_integration_enabled: boolean
  privacy_mode: string
  cover_image_url?: string
  video_url?: string
  video_thumbnail_url?: string
  banner_settings?: {
    applyToBackground: boolean
    overlayOpacity: number
  }
}

interface EventAnalytics {
  total_participants: number
  total_votes: number
  engagement_metrics: {
    avg_session_duration: number
    participation_rate: number
  }
  privacy_compliance: {
    anonymized_data_points: number
    consent_levels_summary: Record<string, number>
  }
}

interface Artist {
  id: string
  name: string
  vote_count: number
  registration_status: string
  email?: string
  instagram?: string
  bio?: string
  notes?: string
  tags?: string[]
  priority?: number
  lastContacted?: string
  createdAt: string
  registrationToken?: string
  profilePhoto?: string
}

interface AudienceMember {
  id: string
  name: string
  email: string
  phone?: string
  registered_at: string
  registration_token: string
  can_edit: boolean
  updated_at?: string
}

const EventDashboard: React.FC = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [audienceMembers, setAudienceMembers] = useState<AudienceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'artists' | 'audience' | 'media' | 'share'>('overview')
  const [showAddArtist, setShowAddArtist] = useState(false)
  const [isAddingArtist, setIsAddingArtist] = useState(false)
  const [newArtist, setNewArtist] = useState({
    name: '',
    email: '',
    bio: '',
    instagram: '',
    profilePhoto: ''
  })
  const [showEditArtist, setShowEditArtist] = useState<string | null>(null)
  const [isEditingArtist, setIsEditingArtist] = useState(false)
  const [editArtist, setEditArtist] = useState({
    name: '',
    email: '',
    bio: '',
    instagram: '',
    contactStatus: '',
    notes: '',
    profilePhoto: ''
  })
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadEventDashboard()
    }
  }, [eventId])

  const loadEventDashboard = async () => {
    try {
      // Verify user is event host
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }

      // Get event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('host_user_id', user.id)
        .single()

      if (eventError || !eventData) {
        console.error('Event not found or access denied')
        return
      }

      setEvent(eventData)

      // Get event analytics
      const analyticsData = eventId ? await ConciertoMediaIdService.getEventAnalytics(eventId) : null
      if (analyticsData) {
        setAnalytics(analyticsData)
      }

      // 🎯 Get artist prospects (CRM approach)
      const { data: artistsData, error: artistsError } = await supabase
        .from('event_artist_prospects')
        .select(`
          id,
          artist_name,
          email,
          instagram_handle,
          bio,
          contact_status,
          vote_count,
          registration_token,
          host_notes,
          tags,
          priority,
          last_contacted_at,
          created_at,
          profile_image_url
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (artistsData) {
        const formattedArtists = artistsData.map((prospect: any) => ({
          id: prospect.id,
          artist_name: prospect.artist_name, // MVP: Keep consistent with database field
          name: prospect.artist_name, // For backward compatibility
          vote_count: prospect.vote_count || 0,
          contact_status: prospect.contact_status, // MVP: Keep consistent with database field
          registration_status: prospect.contact_status, // For backward compatibility
          email: prospect.email,
          instagram: prospect.instagram_handle,
          bio: prospect.bio || undefined,
          registrationToken: prospect.registration_token,
          notes: prospect.host_notes,
          tags: prospect.tags || [],
          priority: prospect.priority || 5,
          lastContacted: prospect.last_contacted_at,
          createdAt: prospect.created_at,
          profilePhoto: prospect.profile_image_url
        }))
        setArtists(formattedArtists)
      }

      // 🎯 Get audience members
      const { data: audienceData, error: audienceError } = await supabase
        .from('event_audience_members')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false })

      if (audienceData) {
        const formattedAudience = audienceData.map((member: any) => {
          const registeredAt = new Date(member.registered_at)
          const now = new Date()
          const hoursSinceRegistration = (now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60)

          return {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            registered_at: member.registered_at,
            registration_token: member.registration_token,
            can_edit: hoursSinceRegistration < 24,
            updated_at: member.updated_at
          }
        })
        setAudienceMembers(formattedAudience)
      }

    } catch (error) {
      console.error('Failed to load event dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateEventStatus = async (newStatus: string) => {
    if (!event) return

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', event.id)

      if (!error) {
        setEvent(prev => prev ? { ...prev, status: newStatus } : null)
        console.log(`✅ Event status updated to: ${newStatus}`)
      }
    } catch (error) {
      console.error('Failed to update event status:', error)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setPendingStatusChange(newStatus)
    setShowPublishModal(true)
  }

  const confirmStatusChange = async () => {
    if (pendingStatusChange) {
      await updateEventStatus(pendingStatusChange)
      setShowPublishModal(false)
      setPendingStatusChange(null)
    }
  }

  const cancelStatusChange = () => {
    setShowPublishModal(false)
    setPendingStatusChange(null)
  }

  const copyShareableLink = () => {
    if (event) {
      const link = `${window.location.origin}/events/vote/${event.shareable_code}`
      navigator.clipboard.writeText(link)
    }
  }

  const handleAddArtist = async () => {
    if (!event || !newArtist.name.trim()) return

    setIsAddingArtist(true)
    try {
      // 🎯 NEW CRM APPROACH: Add artist as prospect (no auth required)
      const { data: prospectId, error: prospectError } = await supabase
        .rpc('add_artist_prospect_to_event', {
          p_event_id: event.id,
          p_artist_name: newArtist.name.trim(),
          p_email: newArtist.email || null,
          p_instagram_handle: newArtist.instagram || null,
          p_bio: newArtist.bio || null,
          p_host_notes: `Added via dashboard on ${new Date().toLocaleDateString()}`
        })

      if (prospectError) {
        console.error('Error adding artist prospect:', prospectError)
        throw prospectError
      }

      console.log('✅ Artist prospect added successfully:', prospectId)

      // Update profile photo if provided
      if (newArtist.profilePhoto && prospectId) {
        await supabase
          .from('event_artist_prospects')
          .update({ profile_image_url: newArtist.profilePhoto })
          .eq('id', prospectId as string)
      }

      // Refresh artists list
      await loadEventDashboard()

      // Reset form
      setShowAddArtist(false)
      setNewArtist({ name: '', email: '', bio: '', instagram: '', profilePhoto: '' })

    } catch (error) {
      console.error('Failed to add artist:', error)
    } finally {
      setIsAddingArtist(false)
    }
  }

  const handleEditArtist = (artist: Artist) => {
    setEditArtist({
      name: artist.name,
      email: artist.email || '',
      bio: artist.bio || '',
      instagram: artist.instagram || '',
      contactStatus: artist.registration_status,
      notes: artist.notes || '',
      profilePhoto: artist.profilePhoto || ''
    })
    setShowEditArtist(artist.id)
  }

  const handleUpdateArtist = async () => {
    if (!showEditArtist || !editArtist.name.trim()) return

    setIsEditingArtist(true)
    try {
      const { error } = await supabase
        .from('event_artist_prospects')
        .update({
          artist_name: editArtist.name.trim(),
          email: editArtist.email || null,
          instagram_handle: editArtist.instagram || null,
          bio: editArtist.bio || null,
          contact_status: editArtist.contactStatus,
          host_notes: editArtist.notes || null,
          profile_image_url: editArtist.profilePhoto || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', showEditArtist)

      if (error) {
        console.error('Error updating artist prospect:', error)
        throw error
      }

      console.log('✅ Artist prospect updated successfully')

      // Refresh artists list
      await loadEventDashboard()

      // Reset form
      setShowEditArtist(null)
      setEditArtist({ name: '', email: '', bio: '', instagram: '', contactStatus: '', notes: '', profilePhoto: '' })

    } catch (error) {
      console.error('Failed to update artist:', error)
    } finally {
      setIsEditingArtist(false)
    }
  }

  const copyRegistrationLink = async (artistId: string) => {
    try {
      // Find the artist in our current artists list to get the registration token
      const artist = artists.find(a => a.id === artistId)
      if (!artist?.registrationToken) {
        console.error('No registration token found for artist')
        return
      }

      const registrationLink = `${window.location.origin}/events/artist/${artist.registrationToken}`
      await navigator.clipboard.writeText(registrationLink)

      // Show success feedback
      console.log('Registration link copied to clipboard:', registrationLink)
    } catch (error) {
      console.error('Failed to copy registration link:', error)
    }
  }

  const sendRegistrationEmail = async (artistId: string) => {
    try {
      // Find the artist in our current artists list
      const artist = artists.find(a => a.id === artistId)
      if (!artist?.email) {
        console.error('No email found for artist')
        return
      }

      const registrationLink = `${window.location.origin}/events/artist/${artist.registrationToken}`

      // For now, just copy the email template to clipboard
      // In a real implementation, you'd integrate with an email service
      const emailTemplate = `
Subject: Invitation to participate in ${event?.title}

Hi ${artist.name},

You've been invited to participate in our voting event "${event?.title}".

Complete your registration here: ${registrationLink}

Event Details:
- Start: ${event?.start_date ? new Date(event.start_date).toLocaleString() : 'TBD'}
- End: ${event?.end_date ? new Date(event.end_date).toLocaleString() : 'TBD'}

Looking forward to having you participate!

Best regards,
The Event Team
      `.trim()

      await navigator.clipboard.writeText(emailTemplate)
      console.log('Email template copied to clipboard')

    } catch (error) {
      console.error('Failed to prepare registration email:', error)
    }
  }

  const copyAudienceRegistrationLink = () => {
    if (event) {
      const link = `${window.location.origin}/events/register/${event.shareable_code}`
      navigator.clipboard.writeText(link)
      console.log('Audience registration link copied:', link)
    }
  }

  const copyAudienceEditLink = (member: AudienceMember) => {
    if (event && member.can_edit) {
      const link = `${window.location.origin}/events/register/${event.shareable_code}?edit=${member.registration_token}`
      navigator.clipboard.writeText(link)
      console.log('Audience edit link copied:', link)
    }
  }

  const exportToCSV = (type: 'artists' | 'audience' | 'all') => {
    let data: any[] = []
    let filename = ''

    if (type === 'artists') {
      data = artists.map(artist => ({
        Name: artist.name,
        Email: artist.email || 'N/A',
        Instagram: artist.instagram || 'N/A',
        Status: artist.registration_status,
        'Vote Count': artist.vote_count,
        'Created At': artist.createdAt,
        Notes: artist.notes || 'N/A'
      }))
      filename = `${event?.title || 'event'}_artists.csv`
    } else if (type === 'audience') {
      data = audienceMembers.map(member => ({
        Name: member.name,
        Email: member.email,
        Phone: member.phone || 'N/A',
        'Registered At': member.registered_at,
        'Can Edit': member.can_edit ? 'Yes' : 'No',
        'Last Updated': member.updated_at || 'Never'
      }))
      filename = `${event?.title || 'event'}_audience.csv`
    } else {
      data = [
        ...artists.map(artist => ({
          Type: 'Artist',
          Name: artist.name,
          Email: artist.email || 'N/A',
          'Phone/Instagram': artist.instagram || 'N/A',
          Status: artist.registration_status,
          'Vote Count': artist.vote_count,
          'Date': artist.createdAt
        })),
        ...audienceMembers.map(member => ({
          Type: 'Audience',
          Name: member.name,
          Email: member.email,
          'Phone/Instagram': member.phone || 'N/A',
          Status: 'Registered',
          'Vote Count': 0,
          'Date': member.registered_at
        }))
      ]
      filename = `${event?.title || 'event'}_all_participants.csv`
    }

    // Convert to CSV
    if (data.length === 0) {
      console.log('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`Exported ${data.length} records to ${filename}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-400">You don't have access to this event or it doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.status === 'live' ? 'bg-green-900/30 text-green-300 border border-green-700/50' :
                event.status === 'published' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' :
                event.status === 'draft' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50' :
                'bg-gray-900/30 text-gray-300 border border-gray-700/50'
              }`}>
                {event.status.toUpperCase()}
              </span>
              {event.mediaid_integration_enabled && (
                <span className="px-3 py-1 bg-purple-900/30 text-purple-300 border border-purple-700/50 rounded-full text-xs font-medium">
                  MediaID Enhanced
                </span>
              )}
              <span className="text-gray-400">Code: {event.shareable_code}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Edit Details Button */}
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Details</span>
            </button>

            {/* Status Controls */}
            {/* Publish/Unpublish Toggle */}
            {event.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('published')}
                className="px-4 py-2 bg-accent-yellow text-black hover:bg-accent-yellow/90 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>📢</span>
                <span>Publish Event</span>
              </button>
            )}

            {event.status === 'published' && (
              <>
                <button
                  onClick={() => handleStatusChange('draft')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>Unpublish</span>
                </button>
                <button
                  onClick={() => handleStatusChange('live')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>🎬</span>
                  <span>Start Event</span>
                </button>
              </>
            )}

            {event.status === 'live' && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🏁</span>
                <span>End Event</span>
              </button>
            )}

            {/* Copy Link - available for published and live events */}
            {(event.status === 'published' || event.status === 'live') && (
              <button
                onClick={copyShareableLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔗</span>
                <span>Copy Voting Link</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {(['overview', 'analytics', 'artists', 'audience', 'media', 'share'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Key Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Total Participants</h3>
                  <p className="text-3xl font-bold">{analytics?.total_participants || 0}</p>
                </div>
                <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Total Votes</h3>
                  <p className="text-3xl font-bold">{analytics?.total_votes || 0}</p>
                </div>
              </div>

              {/* Top Artists */}
              <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Leaderboard</h3>
                <div className="space-y-3">
                  {artists.slice(0, 5).map((artist, index) => (
                    <div key={artist.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{artist.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          artist.registration_status === 'confirmed' ? 'bg-green-900/30 text-green-300' : 'bg-yellow-900/30 text-yellow-300'
                        }`}>
                          {artist.registration_status}
                        </span>
                      </div>
                      <span className="font-bold text-lg">{artist.vote_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-6">
              <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Event Settings</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Start Date:</span>
                    <p>{new Date(event.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">End Date:</span>
                    <p>{new Date(event.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Max Votes per Person:</span>
                    <p>{event.max_votes_per_participant}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Privacy Mode:</span>
                    <p className="capitalize">{event.privacy_mode}</p>
                  </div>
                </div>
              </div>

              {analytics?.privacy_compliance && (
                <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Privacy Compliance</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Data Points:</span>
                      <p>{analytics.privacy_compliance.anonymized_data_points}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Consent Levels:</span>
                      {Object.entries(analytics.privacy_compliance.consent_levels_summary).map(([level, count]) => (
                        <div key={level} className="flex justify-between mt-1">
                          <span className="capitalize">{level}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Engagement Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400">Participation Rate:</span>
                    <p className="text-2xl font-bold">{Math.round(analytics.engagement_metrics.participation_rate * 100)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg Session Duration:</span>
                    <p className="text-2xl font-bold">{Math.round(analytics.engagement_metrics.avg_session_duration)}s</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium mb-4">MediaID Integration</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Privacy-first analytics powered by MediaID system
                </p>
                <div className="text-sm">
                  <p>✓ Anonymous vote tracking</p>
                  <p>✓ Consent-based personalization</p>
                  <p>✓ GDPR-compliant data handling</p>
                </div>
              </div>
            </div>

            {/* Subscription Features Management */}
            <div className="p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    🚀 Host Features & Subscriptions
                    <span className="ml-2 px-2 py-1 bg-accent-yellow text-black text-xs rounded-full font-medium">BETA</span>
                  </h3>
                  <p className="text-sm text-gray-400">
                    Unlock advanced analytics, audience insights, and brand collaboration tools
                  </p>
                </div>
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
                  Manage Features
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-black/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Basic Analytics</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Active"></div>
                  </div>
                  <p className="text-xs text-gray-400">Vote counts, participation rates</p>
                </div>

                <div className="p-4 bg-black/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Geographic Data</span>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Coming Soon"></div>
                  </div>
                  <p className="text-xs text-gray-400">Audience location insights</p>
                </div>

                <div className="p-4 bg-black/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Brand Sharing</span>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Premium"></div>
                  </div>
                  <p className="text-xs text-gray-400">Share data with sponsors</p>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                🟢 Active  🟡 Premium/Coming Soon  • Upgrade to unlock advanced features and monetization tools
              </div>
            </div>

            {/* Data Export Section */}
            <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">📊 Data Export & CRM</h3>
              <p className="text-sm text-gray-400 mb-6">
                Export participant data for external CRM, marketing, or analysis tools
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2">🎤 Artists</h4>
                  <p className="text-sm text-gray-400 mb-4">{artists.length} records</p>
                  <button
                    onClick={() => exportToCSV('artists')}
                    disabled={artists.length === 0}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      artists.length === 0
                        ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Export CSV
                  </button>
                </div>

                <div className="text-center p-4 border border-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2">👥 Audience</h4>
                  <p className="text-sm text-gray-400 mb-4">{audienceMembers.length} records</p>
                  <button
                    onClick={() => exportToCSV('audience')}
                    disabled={audienceMembers.length === 0}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      audienceMembers.length === 0
                        ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Export CSV
                  </button>
                </div>

                <div className="text-center p-4 border border-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2">📋 All Data</h4>
                  <p className="text-sm text-gray-400 mb-4">{artists.length + audienceMembers.length} records</p>
                  <button
                    onClick={() => exportToCSV('all')}
                    disabled={artists.length + audienceMembers.length === 0}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      artists.length + audienceMembers.length === 0
                        ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                        : 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
                    }`}
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-black/50 rounded-lg border border-gray-700">
                <h5 className="font-medium mb-2">Export includes:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                  <div>• Contact information (name, email, phone)</div>
                  <div>• Registration timestamps</div>
                  <div>• Vote counts and engagement metrics</div>
                  <div>• Status and notes (CRM fields)</div>
                  <div>• Social media handles</div>
                  <div>• MediaID compliance markers</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Participating Artists</h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">{artists.length} total artists</span>
                <button
                  onClick={() => setShowAddArtist(true)}
                  className="bg-accent-yellow text-black px-4 py-2 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
                >
                  + Add Artist
                </button>
              </div>
            </div>

            {/* Add Artist Form */}
            {showAddArtist && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-xl font-bold mb-4">Add Artist to Event</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Artist Name</label>
                      <input
                        type="text"
                        value={newArtist.name}
                        onChange={(e) => setNewArtist(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Artist or Band Name"
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email (Optional)</label>
                      <input
                        type="email"
                        value={newArtist.email}
                        onChange={(e) => setNewArtist(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="artist@example.com"
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Bio (Optional)</label>
                      <textarea
                        value={newArtist.bio}
                        onChange={(e) => setNewArtist(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Artist description..."
                        rows={3}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Instagram (Optional)</label>
                      <input
                        type="text"
                        value={newArtist.instagram}
                        onChange={(e) => setNewArtist(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@artistname"
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Artist Photo (Optional)</label>
                      <ArtistPhotoUploader
                        currentPhotoUrl={newArtist.profilePhoto}
                        onPhotoUploaded={(photoUrl) => setNewArtist(prev => ({ ...prev, profilePhoto: photoUrl }))}
                        artistId={`temp_${Date.now()}`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAddArtist(false)
                        setNewArtist({ name: '', email: '', bio: '', instagram: '', profilePhoto: '' })
                      }}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddArtist}
                      disabled={!newArtist.name.trim() || isAddingArtist}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        !newArtist.name.trim() || isAddingArtist
                          ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                          : 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
                      }`}
                    >
                      {isAddingArtist && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      )}
                      <span>{isAddingArtist ? 'Adding...' : 'Add Artist'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Artist Modal */}
            {showEditArtist && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-xl font-bold mb-4">Edit Artist</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Artist Name</label>
                      <input
                        type="text"
                        value={editArtist.name}
                        onChange={(e) => setEditArtist(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Artist or Band Name"
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={editArtist.email}
                        onChange={(e) => setEditArtist(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="artist@example.com"
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Bio</label>
                      <textarea
                        value={editArtist.bio}
                        onChange={(e) => setEditArtist(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Artist description..."
                        rows={3}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Instagram</label>
                      <input
                        type="text"
                        value={editArtist.instagram}
                        onChange={(e) => setEditArtist(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@artistname"
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Status</label>
                      <select
                        value={editArtist.contactStatus}
                        onChange={(e) => setEditArtist(prev => ({ ...prev, contactStatus: e.target.value }))}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      >
                        <option value="invited">Invited</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="declined">Declined</option>
                        <option value="no-response">No Response</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Host Notes</label>
                      <textarea
                        value={editArtist.notes}
                        onChange={(e) => setEditArtist(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Internal notes about this artist..."
                        rows={2}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Artist Photo</label>
                      <ArtistPhotoUploader
                        currentPhotoUrl={editArtist.profilePhoto}
                        onPhotoUploaded={(photoUrl) => setEditArtist(prev => ({ ...prev, profilePhoto: photoUrl }))}
                        artistId={showEditArtist || undefined}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowEditArtist(null)
                        setEditArtist({ name: '', email: '', bio: '', instagram: '', contactStatus: '', notes: '', profilePhoto: '' })
                      }}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateArtist}
                      disabled={!editArtist.name.trim() || isEditingArtist}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        !editArtist.name.trim() || isEditingArtist
                          ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                          : 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
                      }`}
                    >
                      {isEditingArtist && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      )}
                      <span>{isEditingArtist ? 'Updating...' : 'Update Artist'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map(artist => (
                <div key={artist.id} className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{artist.name}</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditArtist(artist)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        title="Edit artist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <span className={`px-2 py-1 rounded text-xs ${
                        artist.registration_status === 'confirmed' ? 'bg-green-900/30 text-green-300' :
                        artist.registration_status === 'pending' ? 'bg-yellow-900/30 text-yellow-300' :
                        'bg-red-900/30 text-red-300'
                      }`}>
                        {artist.registration_status}
                      </span>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold mb-2">{artist.vote_count}</p>
                    <p className="text-sm text-gray-400">votes</p>
                  </div>

                  {/* Artist Info */}
                  <div className="mb-4 space-y-1 text-xs text-gray-400">
                    {artist.email && <p>📧 {artist.email}</p>}
                    {artist.instagram && <p>📱 {artist.instagram}</p>}
                    {artist.notes && <p className="truncate">💬 {artist.notes}</p>}
                    <p>📅 Added {new Date(artist.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => copyRegistrationLink(artist.id)}
                      className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      📋 Copy Registration Link
                    </button>

                    {artist.registration_status === 'pending' && (
                      <button
                        onClick={() => sendRegistrationEmail(artist.id)}
                        className="w-full text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        📧 Send Email Invite
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audience' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Audience Members</h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">{audienceMembers.length} registered</span>
                <button
                  onClick={copyAudienceRegistrationLink}
                  className="bg-accent-yellow text-black px-4 py-2 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
                >
                  📋 Copy Registration Link
                </button>
              </div>
            </div>

            {audienceMembers.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium mb-2">No audience members yet</h4>
                <p className="text-gray-400 mb-6">Share the registration link to get your first audience members!</p>
                <button
                  onClick={copyAudienceRegistrationLink}
                  className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
                >
                  Copy Registration Link
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {audienceMembers.map(member => (
                    <div key={member.id} className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-400">{member.email}</p>
                          {member.phone && <p className="text-sm text-gray-400">📱 {member.phone}</p>}
                        </div>
                        {member.can_edit && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Can edit (within 24 hours)"></div>
                            <span className="text-xs text-green-400">Editable</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 mb-4">
                        <p>📅 Registered: {new Date(member.registered_at).toLocaleString()}</p>
                        {member.updated_at && (
                          <p>✏️ Updated: {new Date(member.updated_at).toLocaleString()}</p>
                        )}
                        {member.can_edit && (
                          <p className="text-green-400">
                            ⏰ Edit window: {Math.ceil(24 - (new Date().getTime() - new Date(member.registered_at).getTime()) / (1000 * 60 * 60))} hours remaining
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {member.can_edit && (
                          <button
                            onClick={() => copyAudienceEditLink(member)}
                            className="w-full text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                          >
                            📝 Copy Edit Link
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const voteLink = `${window.location.origin}/events/vote/${event?.shareable_code}`
                            navigator.clipboard.writeText(voteLink)
                          }}
                          className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          🗳️ Copy Voting Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6">
                  <h4 className="font-medium mb-4">Registration Links</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-black border border-gray-700 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Universal Registration Link:</p>
                      <p className="font-mono text-sm break-all text-accent-yellow">
                        {window.location.origin}/events/register/{event?.shareable_code}
                      </p>
                      <button
                        onClick={copyAudienceRegistrationLink}
                        className="mt-2 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                      >
                        Copy Link
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>• Share this link for new audience members to register</p>
                      <p>• Audience members can edit their info for 24 hours after registration</p>
                      <p>• After 24 hours, their information locks for event security</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Event Media</h2>
              <p className="text-gray-400 mb-6">
                Customize your event's visual appearance with a banner photo and promotional video
              </p>
            </div>

            {/* Banner & Video Upload */}
            <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">📸 Event Banner & Video</h3>
              <EventBannerUploader
                eventId={event.id}
                currentBannerUrl={event.cover_image_url}
                currentVideoUrl={event.video_url}
                applyToBackground={event.banner_settings?.applyToBackground || false}
                onBannerUploaded={(url) => {
                  setEvent(prev => prev ? { ...prev, cover_image_url: url } : null)
                }}
                onVideoUploaded={(url) => {
                  setEvent(prev => prev ? { ...prev, video_url: url } : null)
                }}
                onBackgroundToggle={(apply) => {
                  setEvent(prev => prev ? {
                    ...prev,
                    banner_settings: {
                      applyToBackground: apply,
                      overlayOpacity: 0.5
                    }
                  } : null)
                }}
              />
            </div>

            {/* Video Preview */}
            {event.video_url && (
              <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium mb-4">🎥 Video Preview</h3>
                <EventVideoPlayer
                  videoUrl={event.video_url}
                  thumbnailUrl={event.video_thumbnail_url}
                  eventTitle={event.title}
                />
              </div>
            )}

            {/* Media Tips */}
            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <h4 className="font-medium text-blue-300 mb-2">💡 Media Tips</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Banner photos work best at 3:1 aspect ratio (e.g., 1500x500px)</li>
                <li>• Use "Apply to Background" to show your banner behind event content</li>
                <li>• Videos should be under 50MB for optimal loading</li>
                <li>• Supported formats: MP4, WebM, MOV for videos</li>
                <li>• Your media will appear on the public event page and voting interface</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'share' && (
          <div className="max-w-2xl mx-auto">
            <div className="p-8 bg-gray-900/50 border border-gray-700/50 rounded-lg text-center">
              <h3 className="text-2xl font-bold mb-4">Share Your Event</h3>
              <p className="text-gray-400 mb-8">Get participants to join your event voting</p>

              <div className="space-y-6">
                <div className="p-4 bg-black border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">🎉 Public Event Page:</p>
                  <p className="font-mono text-sm break-all text-accent-yellow mb-2">
                    {window.location.origin}/events/view/{event.shareable_code}
                  </p>
                  <p className="text-xs text-gray-500">Community hub with countdown, videos, and member directory</p>
                </div>

                <div className="p-4 bg-black border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">🗳️ Voting Link:</p>
                  <p className="font-mono text-sm break-all">
                    {window.location.origin}/events/vote/{event.shareable_code}
                  </p>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      const eventViewLink = `${window.location.origin}/events/view/${event.shareable_code}`
                      navigator.clipboard.writeText(eventViewLink)
                    }}
                    className="px-6 py-3 bg-accent-yellow text-black hover:bg-accent-yellow/90 rounded-lg font-medium transition-colors"
                  >
                    Copy Event Page
                  </button>
                  <button
                    onClick={copyShareableLink}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                  >
                    Copy Voting Link
                  </button>
                  <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
                    Generate QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publish/Status Change Confirmation Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4">Confirm Status Change</h3>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Are you sure you want to change the event status?
                </p>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">From:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event?.status === 'draft' ? 'bg-yellow-900/30 text-yellow-300' :
                      event?.status === 'published' ? 'bg-blue-900/30 text-blue-300' :
                      event?.status === 'live' ? 'bg-green-900/30 text-green-300' :
                      'bg-gray-900/30 text-gray-300'
                    }`}>
                      {event?.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400">To:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pendingStatusChange === 'draft' ? 'bg-yellow-900/30 text-yellow-300' :
                      pendingStatusChange === 'published' ? 'bg-blue-900/30 text-blue-300' :
                      pendingStatusChange === 'live' ? 'bg-green-900/30 text-green-300' :
                      pendingStatusChange === 'completed' ? 'bg-red-900/30 text-red-300' :
                      'bg-gray-900/30 text-gray-300'
                    }`}>
                      {pendingStatusChange?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {pendingStatusChange === 'published' && (
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-sm text-blue-300">
                      ✅ Publishing will make the event visible to voters and enable the voting link.
                    </p>
                  </div>
                )}

                {pendingStatusChange === 'draft' && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <p className="text-sm text-yellow-300">
                      ⚠️ Unpublishing will hide the event from voters and disable voting.
                    </p>
                  </div>
                )}

                {pendingStatusChange === 'live' && (
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                    <p className="text-sm text-green-300">
                      🎬 Starting the event will activate real-time voting and notifications.
                    </p>
                  </div>
                )}

                {pendingStatusChange === 'completed' && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <p className="text-sm text-red-300">
                      🏁 Ending the event will stop all voting and lock results.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelStatusChange}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pendingStatusChange === 'published' ? 'bg-accent-yellow text-black hover:bg-accent-yellow/90' :
                    pendingStatusChange === 'live' ? 'bg-green-600 text-white hover:bg-green-700' :
                    pendingStatusChange === 'completed' ? 'bg-red-600 text-white hover:bg-red-700' :
                    'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Event Details Modal */}
        {showEditModal && event && (
          <EventDetailsEditor
            event={event}
            onSave={(updatedEvent) => {
              // Merge updated fields while preserving other event properties
              setEvent(prev => prev ? { ...prev, ...updatedEvent } : null)
              setShowEditModal(false)
            }}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </div>
    </div>
  )
}

export default EventDashboard