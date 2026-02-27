import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../lib/supabaseClient'

interface ArtistPhotoUploaderProps {
  currentPhotoUrl?: string | null
  onPhotoUploaded: (photoUrl: string) => void
  artistId?: string
}

const ArtistPhotoUploader: React.FC<ArtistPhotoUploaderProps> = ({
  currentPhotoUrl,
  onPhotoUploaded,
  artistId
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPG, PNG, or WebP)')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB')
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `artist_${artistId || Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `artist-photos/${fileName}`

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type
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
        console.log('✅ Artist photo uploaded:', publicData.publicUrl)
      }

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setPreviewUrl(currentPhotoUrl || null)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [artistId, currentPhotoUrl, onPhotoUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <div className="w-full">
      {/* Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden cursor-pointer
          transition-all duration-300 border-2
          ${isDragActive
            ? 'border-accent-yellow bg-accent-yellow/10 scale-105'
            : 'border-gray-600 hover:border-gray-500'
          }
          ${uploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Preview or Placeholder */}
        <div className="relative w-full h-full">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Artist"
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              {!uploading && (
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="font-medium">Change Photo</p>
                  <p className="text-xs text-gray-300">Click or drag to replace</p>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white">
              <div className="text-6xl mb-4">🎤</div>
              <p className="font-semibold text-lg mb-2">
                {isDragActive ? 'Drop your photo here' : 'Upload Artist Photo'}
              </p>
              <p className="text-sm text-gray-400 text-center px-4">
                Drag & drop or click<br />
                Max 5MB • JPG, PNG, WebP
              </p>
            </div>
          )}

          {/* Upload Progress */}
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
      </div>

      {/* Upload Instructions */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-400">
          This photo will appear on your trading card
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}
    </div>
  )
}

export default ArtistPhotoUploader