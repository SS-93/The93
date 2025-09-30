import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface MediaIDSettingsProps {
  user: any
  profile: any
  hostPrivileges?: any
  hasHostPrivileges?: boolean
  onProfileUpdate: () => void
}

interface MediaIDData {
  interests: string[]
  genre_preferences: string[]
  privacy_settings: {
    data_sharing: boolean
    location_access: boolean
    audio_capture: boolean
    anonymous_logging: boolean
    marketing_communications: boolean
  }
  location_code?: string
}

const MediaIDSettings: React.FC<MediaIDSettingsProps> = ({ user, profile, onProfileUpdate }) => {
  const [mediaIDData, setMediaIDData] = useState<MediaIDData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const availableInterests = [
    'Music', 'Art', 'Technology', 'Fashion', 'Food', 'Travel', 'Sports', 
    'Gaming', 'Movies', 'Books', 'Photography', 'Fitness', 'Nature'
  ]

  const availableGenres = [
    'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical',
    'Country', 'Reggae', 'Latin', 'Alternative', 'Indie', 'Folk'
  ]

  useEffect(() => {
    fetchMediaIDData()
  }, [user])

  const fetchMediaIDData = async () => {
    try {
      const { data, error } = await supabase
        .from('media_ids')
        .select('*')
        .eq('user_uuid', user.id)
        .eq('role', profile?.role || 'fan')
        .order('updated_at', { ascending: false })
        .limit(1)

      if (error) throw error
      
      // Handle multiple rows by taking the first (most recent) one
      const mediaData = Array.isArray(data) ? data[0] : data

      setMediaIDData(mediaData)
    } catch (error) {
      console.error('Error fetching MediaID data:', error)
      // Set default values if no MediaID exists
      setMediaIDData({
        interests: [],
        genre_preferences: [],
        privacy_settings: {
          data_sharing: true,
          location_access: false,
          audio_capture: false,
          anonymous_logging: true,
          marketing_communications: false
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!mediaIDData) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('media_ids')
        .upsert({
          user_uuid: user.id,
          role: profile?.role || 'fan',
          interests: mediaIDData.interests,
          genre_preferences: mediaIDData.genre_preferences,
          privacy_settings: mediaIDData.privacy_settings,
          location_code: mediaIDData.location_code,
          version: 1,
          is_active: true
        }, {
          onConflict: 'user_uuid,role'
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'MediaID preferences updated successfully!' })
      onProfileUpdate()
    } catch (error: any) {
      console.error('Error updating MediaID:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update MediaID preferences' })
    } finally {
      setSaving(false)
    }
  }

  const toggleInterest = (interest: string) => {
    if (!mediaIDData) return

    setMediaIDData(prev => ({
      ...prev!,
      interests: prev!.interests.includes(interest)
        ? prev!.interests.filter(i => i !== interest)
        : [...prev!.interests, interest]
    }))
  }

  const toggleGenre = (genre: string) => {
    if (!mediaIDData) return

    setMediaIDData(prev => ({
      ...prev!,
      genre_preferences: prev!.genre_preferences.includes(genre)
        ? prev!.genre_preferences.filter(g => g !== genre)
        : [...prev!.genre_preferences, genre]
    }))
  }

  const updatePrivacySetting = (key: keyof MediaIDData['privacy_settings'], value: boolean) => {
    if (!mediaIDData) return

    setMediaIDData(prev => ({
      ...prev!,
      privacy_settings: {
        ...prev!.privacy_settings,
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">MediaID & Privacy</h2>
        <p className="text-gray-400">Control your data preferences and content personalization</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Interests */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Interests</h3>
          <p className="text-sm text-gray-400 mb-4">
            Select your interests to personalize your experience and event recommendations
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  mediaIDData?.interests.includes(interest)
                    ? 'bg-accent-yellow text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Genre Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Music Genres</h3>
          <p className="text-sm text-gray-400 mb-4">
            Choose your favorite music genres for better event and artist matching
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  mediaIDData?.genre_preferences.includes(genre)
                    ? 'bg-accent-yellow text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Privacy Controls</h3>
          <p className="text-sm text-gray-400 mb-4">
            Control how your data is used and shared across the platform
          </p>
          <div className="space-y-4">
            {[
              {
                key: 'data_sharing' as const,
                title: 'Data Sharing',
                description: 'Allow anonymized data to improve platform recommendations'
              },
              {
                key: 'location_access' as const,
                title: 'Location Access',
                description: 'Use location data for local event discovery'
              },
              {
                key: 'audio_capture' as const,
                title: 'Audio Capture',
                description: 'Allow audio capture for music recognition features'
              },
              {
                key: 'anonymous_logging' as const,
                title: 'Anonymous Logging',
                description: 'Help improve the platform with anonymous usage data'
              },
              {
                key: 'marketing_communications' as const,
                title: 'Marketing Communications',
                description: 'Receive updates about new features and events'
              }
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium">{setting.title}</h4>
                  <p className="text-sm text-gray-400">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mediaIDData?.privacy_settings[setting.key] || false}
                    onChange={(e) => updatePrivacySetting(setting.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-yellow"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Location Preferences</h3>
          <input
            type="text"
            value={mediaIDData?.location_code || ''}
            onChange={(e) => setMediaIDData(prev => ({ ...prev!, location_code: e.target.value }))}
            placeholder="Enter your city or region (optional)"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-yellow"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for discovering local events and regional content
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent-yellow text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save MediaID Preferences'}
        </button>
      </div>
    </div>
  )
}

export default MediaIDSettings
