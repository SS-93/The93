import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../lib/supabaseClient'

interface EventBannerUploaderProps {
  eventId: string
  currentBannerUrl?: string | null
  currentVideoUrl?: string | null
  applyToBackground?: boolean
  onBannerUploaded: (url: string) => void
  onVideoUploaded?: (url: string) => void
  onBackgroundToggle?: (apply: boolean) => void
}

const EventBannerUploader: React.FC<EventBannerUploaderProps> = ({
  eventId,
  currentBannerUrl,
  currentVideoUrl,
  applyToBackground = false,
  onBannerUploaded,
  onVideoUploaded,
  onBackgroundToggle
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'banner' | 'video'>('banner')

  const onDropBanner = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file')
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be smaller than 10MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${eventId}/banner_${Date.now()}.${fileExt}`
      const filePath = fileName

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const { error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('event-media')
        .getPublicUrl(filePath)

      if (publicData?.publicUrl) {
        // Update event cover_image_url
        await supabase
          .from('events')
          .update({ cover_image_url: publicData.publicUrl })
          .eq('id', eventId)

        onBannerUploaded(publicData.publicUrl)
      }
    } catch (err) {
      console.error('Banner upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [eventId, onBannerUploaded])

  const onDropVideo = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      if (!file.type.startsWith('video/')) {
        throw new Error('Please upload a video file (MP4, WebM, MOV)')
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Video must be smaller than 50MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${eventId}/video_${Date.now()}.${fileExt}`
      const filePath = fileName

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90))
      }, 200)

      const { error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('event-media')
        .getPublicUrl(filePath)

      if (publicData?.publicUrl) {
        // Update event video_url
        await supabase
          .from('events')
          .update({ video_url: publicData.publicUrl })
          .eq('id', eventId)

        if (onVideoUploaded) {
          onVideoUploaded(publicData.publicUrl)
        }
      }
    } catch (err) {
      console.error('Video upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [eventId, onVideoUploaded])

  const { getRootProps: getBannerRootProps, getInputProps: getBannerInputProps, isDragActive: isBannerDragActive } = useDropzone({
    onDrop: onDropBanner,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: uploading || activeTab !== 'banner'
  })

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onDropVideo,
    accept: {
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov']
    },
    maxFiles: 1,
    disabled: uploading || activeTab !== 'video'
  })

  const handleBackgroundToggle = async () => {
    const newValue = !applyToBackground

    // Update database
    await supabase
      .from('events')
      .update({
        banner_settings: {
          applyToBackground: newValue,
          overlayOpacity: 0.5
        }
      })
      .eq('id', eventId)

    if (onBackgroundToggle) {
      onBackgroundToggle(newValue)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('banner')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'banner'
              ? 'border-b-2 border-accent-yellow text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📸 Banner Photo
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'video'
              ? 'border-b-2 border-accent-yellow text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎥 Event Video
        </button>
      </div>

      {/* Banner Upload */}
      {activeTab === 'banner' && (
        <div className="space-y-4">
          <div
            {...getBannerRootProps()}
            className={`
              relative w-full aspect-[3/1] rounded-2xl overflow-hidden cursor-pointer
              transition-all duration-300 border-2
              ${isBannerDragActive
                ? 'border-accent-yellow bg-accent-yellow/10 scale-105'
                : 'border-gray-600 hover:border-gray-500'
              }
              ${uploading ? 'pointer-events-none opacity-75' : ''}
            `}
          >
            <input {...getBannerInputProps()} />

            {currentBannerUrl ? (
              <>
                <img
                  src={currentBannerUrl}
                  alt="Event Banner"
                  className="w-full h-full object-cover"
                />
                {!uploading && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="font-medium">Change Banner</p>
                    <p className="text-xs text-gray-300">Click or drag to replace</p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white">
                <div className="text-6xl mb-4">🏞️</div>
                <p className="font-semibold text-lg mb-2">
                  {isBannerDragActive ? 'Drop banner here' : 'Upload Event Banner'}
                </p>
                <p className="text-sm text-gray-400">
                  Facebook-style cover photo • Max 10MB • JPG, PNG, WebP
                </p>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p className="text-white font-medium mb-2">Uploading...</p>
                <div className="w-3/4 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-yellow to-green-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-accent-yellow text-sm mt-2">{uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Apply to Background Toggle */}
          {currentBannerUrl && onBackgroundToggle && (
            <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Apply Banner as Page Background</p>
                <p className="text-sm text-gray-400">Show banner behind event content with overlay</p>
              </div>
              <button
                onClick={handleBackgroundToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  applyToBackground ? 'bg-accent-yellow' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    applyToBackground ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video Upload */}
      {activeTab === 'video' && (
        <div>
          <div
            {...getVideoRootProps()}
            className={`
              relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer
              transition-all duration-300 border-2
              ${isVideoDragActive
                ? 'border-accent-yellow bg-accent-yellow/10 scale-105'
                : 'border-gray-600 hover:border-gray-500'
              }
              ${uploading ? 'pointer-events-none opacity-75' : ''}
            `}
          >
            <input {...getVideoInputProps()} />

            {currentVideoUrl ? (
              <>
                <video
                  src={currentVideoUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                {!uploading && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <div className="text-4xl mb-2">🎥</div>
                    <p className="font-medium">Change Video</p>
                    <p className="text-xs text-gray-300">Click or drag to replace</p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white">
                <div className="text-6xl mb-4">🎬</div>
                <p className="font-semibold text-lg mb-2">
                  {isVideoDragActive ? 'Drop video here' : 'Upload Event Video'}
                </p>
                <p className="text-sm text-gray-400">
                  Promo or highlight reel • Max 50MB • MP4, WebM, MOV
                </p>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p className="text-white font-medium mb-2">Uploading Video...</p>
                <div className="w-3/4 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-yellow to-green-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-accent-yellow text-sm mt-2">{uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}
    </div>
  )
}

export default EventBannerUploader
