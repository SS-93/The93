import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import ArtistUploadManager from './ArtistUploadManager'
import { useNavigate } from 'react-router-dom'

interface ArtistProfile {
  id: string
  user_id: string
  artist_name: string
  bio?: string
  banner_url?: string
  verification_status: string
  created_at: string
}

interface UploadStats {
  totalUploads: number
  totalPlays: number
  totalStorage: number
  thisMonthUploads: number
}

const DedicatedUploadPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    totalUploads: 0,
    totalPlays: 0,
    totalStorage: 0,
    thisMonthUploads: 0
  })

  // Auto-create or fetch artist profile
  const ensureArtistProfile = async () => {
    if (!user) return

    try {
      // First, check if artist profile exists
      let { data: existingProfile, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No profile exists, create one
        console.log('🎨 Creating new artist profile for user:', user.id)
        
        // Get user's display name from profiles table
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        const artistName = userProfile?.display_name || user.email?.split('@')[0] || 'New Artist'

        const { data: newProfile, error: createError } = await supabase
          .from('artist_profiles')
          .insert({
            user_id: user.id,
            artist_name: artistName,
            bio: null,
            banner_url: null,
            social_links: {},
            verification_status: 'pending'
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating artist profile:', createError)
          throw createError
        }

        setArtistProfile(newProfile)
        console.log('✅ Artist profile created successfully:', newProfile)
      } else if (existingProfile) {
        setArtistProfile(existingProfile)
        console.log('✅ Artist profile found:', existingProfile)
      } else if (error) {
        console.error('❌ Error fetching artist profile:', error)
        throw error
      }
    } catch (error) {
      console.error('🚨 Failed to ensure artist profile:', error)
    }
  }

  // Fetch upload statistics
  const fetchUploadStats = async () => {
    if (!artistProfile) return

    try {
      const { data: contentItems, error } = await supabase
        .from('content_items')
        .select('file_size_bytes, created_at')
        .eq('artist_id', artistProfile.id)

      if (error) {
        console.error('Error fetching upload stats:', error)
        return
      }

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const stats: UploadStats = {
        totalUploads: contentItems?.length || 0,
        totalPlays: 0, // Will be implemented with analytics
        totalStorage: contentItems?.reduce((acc, item) => acc + (item.file_size_bytes || 0), 0) || 0,
        thisMonthUploads: contentItems?.filter(item => 
          new Date(item.created_at) >= thisMonth
        ).length || 0
      }

      setUploadStats(stats)
    } catch (error) {
      console.error('Failed to fetch upload stats:', error)
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      await ensureArtistProfile()
      setLoading(false)
    }

    if (user) {
      initializePage()
    }
  }, [user])

  useEffect(() => {
    if (artistProfile) {
      fetchUploadStats()
    }
  }, [artistProfile])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-4xl animate-spin">🎵</div>
          </div>
          <h3 className="text-xl font-bold mb-2">Setting up your artist profile...</h3>
          <p className="text-gray-400">This will only take a moment</p>
        </div>
      </div>
    )
  }

  if (!artistProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Unable to create artist profile</h3>
          <p className="text-gray-400 mb-6">Please try again or contact support</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => navigate('/dashboard/artist')}
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ x: -2 }}
              >
                ← Back to Dashboard
              </motion.button>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-accent-yellow via-white to-accent-yellow bg-clip-text text-transparent">
                  Upload to Bucket
                </h1>
                <p className="text-gray-400">Share your sounds with {artistProfile.artist_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/upload/library')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>📚</span>
                <span>Library</span>
              </button>
              
              <div className="text-right">
                <div className="text-sm text-gray-400">Signed in as</div>
                <div className="font-medium">{artistProfile.artist_name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-2xl font-bold text-accent-yellow">{uploadStats.totalUploads}</div>
            <div className="text-sm text-gray-400">Total Tracks</div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-2xl font-bold text-blue-400">{uploadStats.totalPlays}</div>
            <div className="text-sm text-gray-400">Total Plays</div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-2xl font-bold text-green-400">{formatBytes(uploadStats.totalStorage)}</div>
            <div className="text-sm text-gray-400">Storage Used</div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-2xl font-bold text-purple-400">{uploadStats.thisMonthUploads}</div>
            <div className="text-sm text-gray-400">This Month</div>
          </motion.div>
        </div>

        {/* Main Upload Section */}
        <motion.div
          className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {!showUploader ? (
            // Upload Hero Section
            <div className="text-center py-16 px-8">
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-accent-yellow to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-4xl">🎵</span>
              </motion.div>
              
              <h2 className="text-4xl font-black mb-4">
                Ready to share your sound?
              </h2>
              
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Upload your tracks and connect with fans through our privacy-first platform. 
                Your music, your rules, your audience.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center space-x-6 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>AI-powered mood detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Advanced audio analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>MediaID integration</span>
                  </div>
                </div>
              </div>
              
              <motion.button
                onClick={() => setShowUploader(true)}
                className="bg-accent-yellow text-black px-12 py-4 rounded-xl font-bold text-lg hover:bg-accent-yellow/90 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Upload
              </motion.button>
            </div>
          ) : (
            // Upload Interface
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Upload Your Track</h2>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to Overview
                </button>
              </div>
              
              <ArtistUploadManager
                onUploadComplete={(files) => {
                  console.log('✅ Upload completed:', files)
                  setShowUploader(false)
                  fetchUploadStats() // Refresh stats
                  
                  // Show success message
                  if (files.length > 0) {
                    // Could add a toast notification here
                    console.log(`🎉 Successfully uploaded ${files.length} file(s)!`)
                  }
                }}
                onClose={() => setShowUploader(false)}
              />
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        {!showUploader && (
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors cursor-pointer">
              <div className="text-3xl mb-4">📚</div>
              <h3 className="text-lg font-bold mb-2">Manage Library</h3>
              <p className="text-gray-400 text-sm mb-4">
                View and organize all your uploaded content
              </p>
              <button
                onClick={() => navigate('/upload/library')}
                className="text-accent-yellow hover:underline font-medium"
              >
                Open Library →
              </button>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors cursor-pointer">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-bold mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm mb-4">
                Track performance and audience insights
              </p>
              <button
                onClick={() => navigate('/dashboard/artist')}
                className="text-accent-yellow hover:underline font-medium"
              >
                View Analytics →
              </button>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors cursor-pointer">
              <div className="text-3xl mb-4">⚙️</div>
              <h3 className="text-lg font-bold mb-2">Settings</h3>
              <p className="text-gray-400 text-sm mb-4">
                Configure your artist profile and preferences
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="text-accent-yellow hover:underline font-medium"
              >
                Open Settings →
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default DedicatedUploadPage