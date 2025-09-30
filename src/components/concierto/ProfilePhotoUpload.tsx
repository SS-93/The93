import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { motion } from 'framer-motion'

interface ProfilePhotoUploadProps {
  userId?: string
  currentPhotoUrl?: string
  onPhotoUploaded: (photoUrl: string) => void
  size?: 'small' | 'medium' | 'large'
  userType: 'artist' | 'audience' | 'host'
  className?: string
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  userId,
  currentPhotoUrl,
  onPhotoUploaded,
  size = 'medium',
  userType,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  }

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  const iconSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  }

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userType}_${userId || Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, {
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath)

      if (publicData?.publicUrl) {
        onPhotoUploaded(publicData.publicUrl)
        console.log('✅ Photo uploaded successfully:', publicData.publicUrl)
      }

    } catch (error) {
      console.error('Upload failed:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadPhoto(file)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const getUserTypeIcon = () => {
    switch (userType) {
      case 'artist': return '🎤'
      case 'audience': return '🎵'
      case 'host': return '👑'
      default: return '👤'
    }
  }

  const getUserTypeColor = () => {
    switch (userType) {
      case 'artist': return 'from-purple-500 to-pink-500'
      case 'audience': return 'from-blue-500 to-cyan-500'
      case 'host': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${sizeClasses[size]} relative cursor-pointer group`}
        onClick={triggerFileSelect}
      >
        {/* Profile Photo Display */}
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-accent-yellow transition-colors`}>
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getUserTypeColor()} flex items-center justify-center`}>
              <span className={iconSizes[size]}>{getUserTypeIcon()}</span>
            </div>
          )}
        </div>

        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className={`${iconSizes[size]} animate-spin mb-1`}>⏳</div>
              <div className={`${textSizes[size]} text-accent-yellow font-medium`}>
                {uploadProgress}%
              </div>
            </div>
          </div>
        )}

        {/* Upload Icon Overlay */}
        {!uploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-center">
              <div className={`${iconSizes[size]} text-white mb-1`}>📷</div>
              <div className={`${textSizes[size]} text-white font-medium`}>
                {currentPhotoUrl ? 'Change' : 'Upload'}
              </div>
            </div>
          </div>
        )}

        {/* User Type Badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full border-2 border-gray-700 flex items-center justify-center">
          <span className="text-xs">{getUserTypeIcon()}</span>
        </div>
      </motion.div>

      {/* Upload Instructions */}
      {size === 'large' && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Click to upload • Max 5MB • JPG, PNG
        </p>
      )}
    </div>
  )
}

export default ProfilePhotoUpload