import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { setupMediaID, MediaIDData } from '../../lib/mediaId'

interface MediaIDModalProps {
  user: any
  role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'
  onComplete: (data: any) => void
  onClose: () => void
}

const MediaIDModal: React.FC<MediaIDModalProps> = ({ user, role, onComplete, onClose }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    interests: [] as string[],
    genres: [] as string[],
    privacySettings: {
      data_sharing: true,
      location_access: false,
      audio_capture: false,
      anonymous_logging: true,
      marketing_communications: false
    }
  })

  const interestOptions = [
    '🎵 Discovering new music',
    '🎤 Supporting independent artists', 
    '🎧 High-quality audio',
    '🔥 Underground scenes',
    '📱 Exclusive content',
    '🎬 Behind-the-scenes access',
    '💬 Artist interactions',
    '🎯 Early releases',
    '🌟 Rising talent',
    '🎹 Production insights'
  ]

  const genreOptions = [
    'Electronic', 'Hip-Hop', 'R&B', 'Indie Rock', 'Folk', 'Jazz',
    'Synthwave', 'Lo-fi', 'Ambient', 'Experimental', 'Pop', 'Alternative'
  ]

  const handleInterestToggle = (interest: string) => {
    setError(null) // Clear any existing errors
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }))
  }

  const handlePrivacyChange = (setting: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [setting]: value
      }
    }))
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Validate interests (3-5 required)
      if (!formData.interests || formData.interests.length < 3) {
        throw new Error('Please select at least 3 interests to personalize your experience.')
      }
      
      if (formData.interests.length > 5) {
        throw new Error('Please select no more than 5 interests to keep your profile focused.')
      }

      // Prepare MediaID data
      const mediaIdData: MediaIDData = {
          interests: formData.interests,
        genrePreferences: formData.genres,
        privacySettings: {
          dataSharing: formData.privacySettings.data_sharing,
          locationAccess: formData.privacySettings.location_access,
          audioCapture: formData.privacySettings.audio_capture,
          anonymousLogging: formData.privacySettings.anonymous_logging,
          marketingCommunications: formData.privacySettings.marketing_communications
        },
        locationCode: '',
        contentFlags: {
          mood: '',
          likes: [],
          dislikes: []
        }
      }

      // Set up MediaID for the specific role
      const result = await setupMediaID(mediaIdData, role)

      onComplete({ 
        success: true, 
        message: `MediaID setup completed for ${role} role! 🎉`,
        role: role,
        data: result
      })
    } catch (error) {
      console.error('MediaID setup error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('interests')) {
          errorMessage = error.message
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network connection issue. Please check your internet and try again.'
        } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          errorMessage = 'Authentication expired. Please sign in again.'
        } else if (error.message.includes('database') || error.message.includes('unique')) {
          errorMessage = `You already have a MediaID set up for the ${role} role. Updating your preferences...`
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleInfo = {
      fan: { name: 'Fan', icon: '🎧', description: 'Discover and enjoy exclusive content' },
      artist: { name: 'Artist', icon: '🎤', description: 'Create and share your music' },
      brand: { name: 'Brand', icon: '🏢', description: 'Connect with engaged audiences' },
      developer: { name: 'Developer', icon: '⚡', description: 'Build privacy-first integrations' }
    }
    return roleInfo[role as keyof typeof roleInfo] || { name: role, icon: '👤', description: '' }
  }

  const roleInfo = getRoleDisplayName(role)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-3xl border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">{roleInfo.icon}</span>
              </div>
            <div>
                <h2 className="text-3xl font-bold text-white mb-1">Setup Your MediaID</h2>
                <p className="text-gray-400">
                  {roleInfo.description} • {roleInfo.name} Role
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>
          
          {/* Progress */}
          <div className="flex items-center mt-6 space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= stepNum ? 'bg-accent-yellow text-black' : 'bg-gray-700 text-gray-400'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && <div className={`w-8 h-1 ${step > stepNum ? 'bg-accent-yellow' : 'bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <h3 className="text-2xl font-bold text-white mb-6">What interests you most?</h3>
                <p className="text-gray-400 mb-6">
                  Select 3-5 interests to personalize your {roleInfo.name.toLowerCase()} experience
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-accent-yellow text-black border-accent-yellow'
                          : 'bg-gray-800/50 text-white border-gray-600/50 hover:border-gray-500'
                      } border`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>

                {/* Interest count indicator */}
                <div className="mb-6 p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-sm text-gray-400">
                    Selected: {formData.interests.length}/5 interests
                    {formData.interests.length < 3 && (
                      <span className="text-orange-400 ml-2">
                        (Need at least 3)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={formData.interests.length < 3}
                    className="bg-accent-yellow text-black font-bold px-6 py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Favorite genres?</h3>
                <p className="text-gray-400 mb-6">
                  Optional: Help us understand your musical taste (select any that appeal to you)
                </p>
                
                <div className="flex flex-wrap gap-3 mb-8">
                  {genreOptions.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-4 py-2 rounded-full transition-all ${
                        formData.genres.includes(genre)
                          ? 'bg-accent-yellow text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="px-6 py-3 text-gray-400 hover:text-white">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="bg-accent-yellow text-black font-bold px-6 py-3 rounded-xl hover:bg-accent-yellow/90">
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Privacy Controls</h3>
                <p className="text-gray-400 mb-6">
                  You're in control. Adjust these settings anytime from your profile.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    { key: 'data_sharing', title: 'Data Sharing', desc: 'Share anonymized data for recommendations' },
                    { key: 'location_access', title: 'Location Access', desc: 'For local events and discovery' },
                    { key: 'audio_capture', title: 'Audio Recognition', desc: 'Music identification features' },
                    { key: 'anonymous_logging', title: 'Usage Analytics', desc: 'Help improve the platform' },
                    { key: 'marketing_communications', title: 'Updates', desc: 'New features and releases' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                      <div>
                        <h4 className="font-medium text-white">{setting.title}</h4>
                        <p className="text-sm text-gray-400">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyChange(setting.key, !formData.privacySettings[setting.key as keyof typeof formData.privacySettings])}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          formData.privacySettings[setting.key as keyof typeof formData.privacySettings] 
                            ? 'bg-accent-yellow' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          formData.privacySettings[setting.key as keyof typeof formData.privacySettings] 
                            ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="px-6 py-3 text-gray-400 hover:text-white">
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="bg-accent-yellow text-black font-bold px-8 py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Setting up...
                      </div>
                    ) : (
                      `Complete ${roleInfo.name} Setup`
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default MediaIDModal
