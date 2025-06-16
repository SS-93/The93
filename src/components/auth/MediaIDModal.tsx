import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MediaIDModalProps {
  user: any
  onComplete: (mediaIdData: any) => void
  onClose: () => void
}

const MediaIDModal: React.FC<MediaIDModalProps> = ({ user, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [mediaIdData, setMediaIdData] = useState({
    interests: [] as string[],
    genrePreferences: [] as string[],
    privacySettings: {
      dataSharing: true,
      locationAccess: false,
      audioCapture: false,
      anonymousLogging: true,
      marketingCommunications: false
    },
    locationCode: '',
    contentFlags: {
      mood: 'curious',
      likes: [],
      dislikes: []
    }
  })

  const interestOptions = [
    'Electronic Music', 'Hip Hop', 'Indie Rock', 'Jazz', 'Classical',
    'Pop', 'R&B', 'Folk', 'Experimental', 'Ambient', 'Techno', 'House',
    'Art & Design', 'Fashion', 'Photography', 'Film', 'Literature',
    'Technology', 'Gaming', 'Sports', 'Travel', 'Food & Cooking'
  ]

  const genreOptions = [
    'Trap', 'Lofi', 'Synthwave', 'Garage', 'Drum & Bass', 'UK Drill',
    'Afrobeat', 'Reggaeton', 'K-Pop', 'Shoegaze', 'Post Rock', 'Vaporwave'
  ]

  const moodOptions = [
    { value: 'energetic', emoji: '⚡', label: 'Energetic' },
    { value: 'chill', emoji: '🌊', label: 'Chill' },
    { value: 'curious', emoji: '🔍', label: 'Curious' },
    { value: 'adventurous', emoji: '🚀', label: 'Adventurous' },
    { value: 'introspective', emoji: '🌙', label: 'Introspective' }
  ]

  const toggleInterest = (interest: string) => {
    setMediaIdData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const toggleGenre = (genre: string) => {
    setMediaIdData(prev => ({
      ...prev,
      genrePreferences: prev.genrePreferences.includes(genre)
        ? prev.genrePreferences.filter(g => g !== genre)
        : [...prev.genrePreferences, genre]
    }))
  }

  const updatePrivacySetting = (key: string, value: boolean) => {
    setMediaIdData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: value
      }
    }))
  }

  const setMood = (mood: string) => {
    setMediaIdData(prev => ({
      ...prev,
      contentFlags: {
        ...prev.contentFlags,
        mood
      }
    }))
  }

  const handleComplete = async () => {
    try {
      // Call the MediaID setup function
      const response = await fetch('/functions/v1/mediaid-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: mediaIdData.interests,
          genre_preferences: mediaIdData.genrePreferences,
          location_code: mediaIdData.locationCode,
          privacy_settings: {
            data_sharing: mediaIdData.privacySettings.dataSharing,
            location_access: mediaIdData.privacySettings.locationAccess,
            audio_capture: mediaIdData.privacySettings.audioCapture,
            anonymous_logging: mediaIdData.privacySettings.anonymousLogging,
            marketing_communications: mediaIdData.privacySettings.marketingCommunications
          },
          content_flags: mediaIdData.contentFlags
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      onComplete(mediaIdData)
    } catch (error) {
      console.error('MediaID setup error:', error)
    }
  }

  const steps = [
    {
      title: 'Welcome to MediaID',
      subtitle: 'Your privacy-first identity layer'
    },
    {
      title: 'What interests you?',
      subtitle: 'Select 3-5 topics that resonate with you'
    },
    {
      title: 'Musical taste',
      subtitle: 'Choose genres that move you'
    },
    {
      title: 'Current mood',
      subtitle: 'How are you feeling today?'
    },
    {
      title: 'Privacy controls',
      subtitle: 'You decide what to share'
    }
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* MediaID Header - Distinctive Design */}
          <div className="p-8 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">M</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-blue-600">MediaID</h1>
                  <p className="text-green-600 text-sm font-medium">Privacy-first identity</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-800 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 text-lg">
                {steps[currentStep].subtitle}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-100 to-green-100 rounded-3xl flex items-center justify-center">
                    <span className="text-4xl">🔐</span>
                  </div>
                  <div className="max-w-md mx-auto space-y-4">
                    <p className="text-gray-700">
                      MediaID gives you complete control over your data and preferences. 
                      You decide what to share, when to share it, and with whom.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <div className="text-blue-600 text-lg mb-1">🛡️</div>
                        <div className="font-bold text-blue-800">Private</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl">
                        <div className="text-green-600 text-lg mb-1">⚡</div>
                        <div className="font-bold text-green-800">Fast</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <div className="text-purple-600 text-lg mb-1">🎯</div>
                        <div className="font-bold text-purple-800">Personal</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="interests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {interestOptions.map((interest) => (
                      <motion.button
                        key={interest}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleInterest(interest)}
                        className={`p-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                          mediaIdData.interests.includes(interest)
                            ? 'bg-blue-100 border-blue-400 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {interest}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    Selected: {mediaIdData.interests.length} / 5
                  </p>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="genres"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-4 gap-3">
                    {genreOptions.map((genre) => (
                      <motion.button
                        key={genre}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleGenre(genre)}
                        className={`p-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                          mediaIdData.genrePreferences.includes(genre)
                            ? 'bg-green-100 border-green-400 text-green-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {genre}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    Selected: {mediaIdData.genrePreferences.length} genres
                  </p>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="mood"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-5 gap-4">
                    {moodOptions.map((mood) => (
                      <motion.button
                        key={mood.value}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMood(mood.value)}
                        className={`p-6 rounded-3xl border-2 text-center transition-all ${
                          mediaIdData.contentFlags.mood === mood.value
                            ? 'bg-purple-100 border-purple-400 scale-110'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{mood.emoji}</div>
                        <div className="text-sm font-bold text-gray-800">{mood.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {[
                      {
                        key: 'dataSharing',
                        title: 'Anonymous Data Sharing',
                        description: 'Share aggregated preferences to improve recommendations',
                        recommended: true
                      },
                      {
                        key: 'locationAccess',
                        title: 'Location Access',
                        description: 'Allow location-based content and event discovery',
                        recommended: false
                      },
                      {
                        key: 'audioCapture',
                        title: 'Audio Fingerprinting',
                        description: 'Detect music you\'re listening to for better matching',
                        recommended: false
                      },
                      {
                        key: 'anonymousLogging',
                        title: 'Anonymous Activity Logging',
                        description: 'Track interactions to personalize your experience',
                        recommended: true
                      },
                      {
                        key: 'marketingCommunications',
                        title: 'Marketing Communications',
                        description: 'Receive updates about new artists and features',
                        recommended: false
                      }
                    ].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-800">{setting.title}</h4>
                            {setting.recommended && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                        </div>
                        <button
                          onClick={() => updatePrivacySetting(setting.key, !mediaIdData.privacySettings[setting.key as keyof typeof mediaIdData.privacySettings])}
                          className={`w-12 h-7 rounded-full transition-colors relative ${
                            mediaIdData.privacySettings[setting.key as keyof typeof mediaIdData.privacySettings]
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                              mediaIdData.privacySettings[setting.key as keyof typeof mediaIdData.privacySettings]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl disabled:opacity-50 hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && mediaIdData.interests.length < 3) ||
                    (currentStep === 2 && mediaIdData.genrePreferences.length === 0)
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-green-600 transition-all disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-green-600 transition-all"
                >
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MediaIDModal 