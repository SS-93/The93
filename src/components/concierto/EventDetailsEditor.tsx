import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import EventBannerUploader from './EventBannerUploader'
import TicketTierConfig, { TicketTier } from './TicketTierConfig'

interface EventDetails {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location?: string
  max_votes_per_participant: number
  privacy_mode: string
  cover_image_url?: string
  video_url?: string
  video_thumbnail_url?: string
  banner_settings?: {
    applyToBackground: boolean
    overlayOpacity: number
  }
  ticketing_enabled?: boolean
  ticket_tiers?: TicketTier[]
  ticket_sales_start?: string
  ticket_sales_end?: string
}

interface EventDetailsEditorProps {
  event: EventDetails
  onSave: (updatedEvent: EventDetails) => void
  onCancel: () => void
}

const EventDetailsEditor: React.FC<EventDetailsEditorProps> = ({
  event,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    start_date: event.start_date.split('T')[0],
    end_date: event.end_date.split('T')[0],
    location: event.location || '',
    max_votes_per_participant: event.max_votes_per_participant,
    privacy_mode: event.privacy_mode,
    cover_image_url: event.cover_image_url || '',
    video_url: event.video_url || '',
    banner_settings: event.banner_settings || { applyToBackground: false, overlayOpacity: 0.5 }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'ticketing'>('basic')
  
  // Ticketing state
  const [ticketingEnabled, setTicketingEnabled] = useState(event.ticketing_enabled || false)
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(event.ticket_tiers || [])
  const [ticketSalesStart, setTicketSalesStart] = useState(
    event.ticket_sales_start ? event.ticket_sales_start.split('T')[0] : ''
  )
  const [ticketSalesEnd, setTicketSalesEnd] = useState(
    event.ticket_sales_end ? event.ticket_sales_end.split('T')[0] : ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Event title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Prepare base update data (always present fields)
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        location: formData.location || null,
        max_votes_per_participant: formData.max_votes_per_participant,
        privacy_mode: formData.privacy_mode,
        updated_at: new Date().toISOString()
      }

      // Only include media fields if they exist in the event object (meaning column exists)
      if ('cover_image_url' in event) {
        updateData.cover_image_url = formData.cover_image_url || null
      }
      if ('video_url' in event) {
        updateData.video_url = formData.video_url || null
      }
      if ('banner_settings' in event) {
        updateData.banner_settings = formData.banner_settings
      }

      // Prepare ticketing data
      const ticketingData: any = {
        ticketing_enabled: ticketingEnabled,
        ticket_tiers: ticketTiers.length > 0 ? ticketTiers : null,
        ticket_sales_start: ticketSalesStart ? new Date(ticketSalesStart).toISOString() : null,
        ticket_sales_end: ticketSalesEnd ? new Date(ticketSalesEnd).toISOString() : null
      }

      // If ticketing is disabled, clear ticket tiers
      if (!ticketingEnabled) {
        ticketingData.ticket_tiers = null
      }

      // Only include ticketing fields if they exist in the event object
      if ('ticketing_enabled' in event || ticketingEnabled) {
        Object.assign(updateData, ticketingData)
      }

      const { data, error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id)
        .select()
        .single()

      if (updateError) {
        // If error is about missing column, try again without media fields
        if (updateError.message?.includes('column') && updateError.message?.includes('schema cache')) {
          console.warn('Missing column detected, retrying without media fields:', updateError.message)
          
          // Remove media fields and retry
          const retryData = { ...updateData }
          delete retryData.cover_image_url
          delete retryData.video_url
          delete retryData.video_thumbnail_url
          delete retryData.banner_settings
          
          const { data: retryDataResult, error: retryError } = await supabase
            .from('events')
            .update(retryData)
            .eq('id', event.id)
            .select()
            .single()
          
          if (retryError) throw retryError
          if (retryDataResult) {
            onSave(retryDataResult)
            return
          }
        }
        throw updateError
      }

      if (data) {
        onSave(data)
      }
    } catch (err) {
      console.error('Error updating event:', err)
      setError(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Edit Event Details</h2>
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              📝 Basic Info
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'media'
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              📸 Media
            </button>
            <button
              onClick={() => setActiveTab('ticketing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'ticketing'
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              🎫 Ticketing
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Summer Music Festival 2025"
                    required
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your event..."
                    rows={4}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Brooklyn Bowl, New York"
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                  />
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="max_votes" className="block text-sm font-medium mb-2">
                      Max Votes Per Person
                    </label>
                    <input
                      type="number"
                      id="max_votes"
                      value={formData.max_votes_per_participant}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_votes_per_participant: parseInt(e.target.value) || 3 }))}
                      min="1"
                      max="10"
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="privacy_mode" className="block text-sm font-medium mb-2">
                      Privacy Mode
                    </label>
                    <select
                      id="privacy_mode"
                      value={formData.privacy_mode}
                      onChange={(e) => setFormData(prev => ({ ...prev, privacy_mode: e.target.value }))}
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="anonymous">Anonymous</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Event Banner & Video</h3>
                  <EventBannerUploader
                    eventId={event.id}
                    currentBannerUrl={formData.cover_image_url}
                    currentVideoUrl={formData.video_url}
                    applyToBackground={formData.banner_settings.applyToBackground}
                    onBannerUploaded={(url) => {
                      setFormData(prev => ({ ...prev, cover_image_url: url }))
                    }}
                    onVideoUploaded={(url) => {
                      setFormData(prev => ({ ...prev, video_url: url }))
                    }}
                    onBackgroundToggle={(apply) => {
                      setFormData(prev => ({
                        ...prev,
                        banner_settings: {
                          applyToBackground: apply,
                          overlayOpacity: 0.5
                        }
                      }))
                    }}
                  />
                </div>

                {/* Media Tips */}
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <h4 className="font-medium text-blue-300 mb-2">💡 Media Tips</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Banner photos work best at 3:1 aspect ratio (e.g., 1500x500px)</li>
                    <li>• Use "Apply to Background" to show your banner behind event content</li>
                    <li>• Videos should be under 50MB for optimal loading</li>
                    <li>• Your media will appear on the public event page and voting interface</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Ticketing Tab */}
            {activeTab === 'ticketing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Ticket Configuration</h3>
                  
                  {/* Ticket Sales Dates */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="ticket_sales_start" className="block text-sm font-medium mb-2">
                        Sales Start Date
                      </label>
                      <input
                        type="date"
                        id="ticket_sales_start"
                        value={ticketSalesStart}
                        onChange={(e) => setTicketSalesStart(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="ticket_sales_end" className="block text-sm font-medium mb-2">
                        Sales End Date
                      </label>
                      <input
                        type="date"
                        id="ticket_sales_end"
                        value={ticketSalesEnd}
                        onChange={(e) => setTicketSalesEnd(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Ticket Tier Configuration */}
                  <TicketTierConfig
                    ticketingEnabled={ticketingEnabled}
                    onTicketingToggle={setTicketingEnabled}
                    tiers={ticketTiers}
                    onTiersChange={setTicketTiers}
                    hideToggle={false}
                  />
                </div>

                {/* Ticketing Tips */}
                <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <h4 className="font-medium text-green-300 mb-2">💡 Ticketing Tips</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Set sales dates to control when tickets are available</li>
                    <li>• Create multiple tiers (General, VIP, Backstage) to maximize revenue</li>
                    <li>• Add perks to higher tiers to incentivize upgrades</li>
                    <li>• Review your revenue split settings in the Revenue tab</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">❌ {error}</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              saving
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
            }`}
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventDetailsEditor
