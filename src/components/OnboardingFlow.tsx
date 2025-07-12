import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface OnboardingFlowProps {
  onComplete?: () => void
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    interests: [] as string[],
    genres: [] as string[],
    selectedRole: 'fan' as 'fan' | 'artist' | 'brand', // Add role selection
    privacySettings: {
      data_sharing: true,
      location_access: false,
      audio_capture: false,
      anonymous_logging: true,
      marketing_communications: false
    }
  })

  const { user } = useAuth()
  const navigate = useNavigate()

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

  const handleRoleSelect = (role: 'fan' | 'artist' | 'brand') => {
    setFormData(prev => ({ ...prev, selectedRole: role }))
  }

  const handleCompleteOnboarding = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Authentication required. Please sign in again.')
      }

      // Validate interests (3-5 required)
      if (!formData.interests || formData.interests.length < 3 || formData.interests.length > 5) {
        throw new Error('Please select 3-5 interests')
      }

      // Create or update MediaID with user preferences
      const { error: mediaIdError } = await supabase
        .from('media_ids')
        .upsert({
          user_uuid: user.id,
          interests: formData.interests,
          genre_preferences: formData.genres || [],
          privacy_settings: formData.privacySettings,
          content_flags: {},
          location_code: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_uuid'
        })

      if (mediaIdError) {
        console.error('MediaID upsert error:', mediaIdError)
        throw new Error('Failed to create MediaID profile')
      }

      // Update user profile with selected role and onboarding completion
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          role: formData.selectedRole,  // 🎯 This drives the routing
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw new Error('Failed to complete onboarding')
      }

      // Log the setup completion (anonymous)
      await supabase
        .from('media_engagement_log')
        .insert({
          user_id: user.id,
          event_type: 'mediaid_setup_completed',
          is_anonymous: formData.privacySettings.anonymous_logging,
          metadata: {
            interests_count: formData.interests.length,
            privacy_level: Object.values(formData.privacySettings).filter(Boolean).length,
            selected_role: formData.selectedRole
          }
        })

      // Let the onComplete callback handle routing
      onComplete?.()
    } catch (error) {
      console.error('Onboarding error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Setup failed: ${errorMessage}. Please check your connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (  // Updated to 4 steps
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            currentStep >= step 
              ? 'bg-accent-yellow text-black' 
              : 'bg-gray-700 text-gray-400'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-1 mx-4 ${
              currentStep > step ? 'bg-accent-yellow' : 'bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="glass rounded-2xl p-8 border border-white/10">
          <StepIndicator />

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to Bucket!</h2>
                <p className="text-gray-400 text-lg mb-8">
                  Let's personalize your experience with a few quick questions
                </p>
                <div className="mb-8">
                  <img 
                    src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop" 
                    alt="Music"
                    className="w-64 h-40 object-cover rounded-xl mx-auto opacity-60"
                  />
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-accent-yellow text-black font-bold px-8 py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors"
                >
                  Let's Get Started
                </button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">What interests you most?</h2>
                <p className="text-gray-400 mb-6">Select all that apply (minimum 3)</p>
                
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

                <h3 className="text-xl font-bold text-white mb-4">Favorite genres?</h3>
                <div className="flex flex-wrap gap-2 mb-8">
                  {genreOptions.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
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
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={formData.interests.length < 3}
                    className="bg-accent-yellow text-black font-bold px-6 py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">Privacy Settings</h2>
                <p className="text-gray-400 mb-6">
                  Control how your data is used. You can change these anytime.
                </p>

                <div className="space-y-6 mb-8">
                  {[
                    {
                      key: 'data_sharing',
                      title: 'Data Sharing',
                      description: 'Share anonymized listening data to improve recommendations',
                      default: true
                    },
                    {
                      key: 'location_access',
                      title: 'Location Access',
                      description: 'Access location for local events and artist discovery',
                      default: false
                    },
                    {
                      key: 'audio_capture',
                      title: 'Audio Capture',
                      description: 'Allow audio recognition for music identification features',
                      default: false
                    },
                    {
                      key: 'anonymous_logging',
                      title: 'Anonymous Analytics',
                      description: 'Help improve the platform with anonymous usage data',
                      default: true
                    },
                    {
                      key: 'marketing_communications',
                      title: 'Marketing Communications',
                      description: 'Receive updates about new features and artist releases',
                      default: false
                    }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-start justify-between p-4 bg-gray-800/30 rounded-xl">
                      <div className="flex-1 mr-4">
                        <h4 className="font-medium text-white mb-1">{setting.title}</h4>
                        <p className="text-sm text-gray-400">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyChange(setting.key, !formData.privacySettings[setting.key as keyof typeof formData.privacySettings])}
                        className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                          formData.privacySettings[setting.key as keyof typeof formData.privacySettings]
                            ? 'bg-accent-yellow'
                            : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          formData.privacySettings[setting.key as keyof typeof formData.privacySettings]
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}  // Go to step 4
                    className="bg-accent-yellow text-black font-bold px-6 py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* NEW Step 4: Role Selection */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Experience</h2>
                <p className="text-gray-400 mb-8">
                  Select how you want to engage with the Bucket ecosystem
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    {
                      role: 'fan' as const,
                      title: '🎧 Fan Dashboard',
                      description: 'Discover artists, unlock exclusive content, and build your collection',
                      features: ['Daily content unlocks', 'Artist subscriptions', 'Exclusive access']
                    },
                    {
                      role: 'artist' as const,
                      title: '🎤 Artist Dashboard',
                      description: 'Upload content, grow your fanbase, and monetize your creativity',
                      features: ['Content upload & scheduling', 'Revenue analytics', 'Fan engagement tools']
                    },
                    {
                      role: 'brand' as const,
                      title: '🏢 Brand Dashboard',
                      description: 'Connect with audiences through privacy-first brand collaborations',
                      features: ['Campaign management', 'Audience insights', 'MediaID targeting']
                    }
                  ].map((option) => (
                    <button
                      key={option.role}
                      onClick={() => handleRoleSelect(option.role)}
                      className={`w-full p-6 rounded-xl text-left transition-all border ${
                        formData.selectedRole === option.role
                          ? 'bg-accent-yellow/10 border-accent-yellow text-white'
                          : 'bg-gray-800/30 border-gray-600/50 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                      <p className="text-gray-400 mb-3">{option.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {option.features.map((feature) => (
                          <span
                            key={feature}
                            className={`px-2 py-1 rounded-full text-xs ${
                              formData.selectedRole === option.role
                                ? 'bg-accent-yellow/20 text-accent-yellow'
                                : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={loading}
                    className="bg-accent-yellow text-black font-bold px-8 py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Setting up...' : 'Enter Bucket'}
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

export default OnboardingFlow 