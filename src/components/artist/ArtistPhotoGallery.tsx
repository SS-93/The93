import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../lib/supabaseClient'

interface ArtistPhoto {
  id: string
  url: string
  uploaded_at: string
  is_primary: boolean
  caption?: string
  metadata?: {
    width?: number
    height?: number
    format?: string
  }
}

interface ArtistPhotoGalleryProps {
  artistId: string
  photos: ArtistPhoto[]
  onPhotosUpdate: (photos: ArtistPhoto[]) => void
  isOwner?: boolean
}

const ArtistPhotoGallery: React.FC<ArtistPhotoGalleryProps> = ({
  artistId,
  photos,
  onPhotosUpdate,
  isOwner = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState<ArtistPhoto | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Upload photo to Supabase Storage
  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${artistId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('artist-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('artist-photos')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  // Add photo to artist's gallery in database
  const addPhotoToGallery = async (photoUrl: string, setAsPrimary: boolean = false) => {
    const { data, error } = await supabase.rpc('add_artist_photo', {
      artist_id: artistId,
      photo_url: photoUrl,
      caption: null,
      set_as_primary: setAsPrimary
    })

    if (error) throw error
    return data
  }

  // Set photo as primary
  const setPrimaryPhoto = async (photoUrl: string) => {
    const { error } = await supabase.rpc('set_artist_primary_photo', {
      artist_id: artistId,
      photo_url: photoUrl
    })

    if (error) throw error

    // Update local state
    const updatedPhotos = photos.map(p => ({
      ...p,
      is_primary: p.url === photoUrl
    }))
    onPhotosUpdate(updatedPhotos)
  }

  // Remove photo from gallery
  const removePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Delete from storage
      const fileName = photoUrl.split('/artist-photos/')[1]
      await supabase.storage.from('artist-photos').remove([fileName])

      // Remove from database
      await supabase.rpc('remove_artist_photo', {
        artist_id: artistId,
        photo_id: photoId
      })

      // Update local state
      const updatedPhotos = photos.filter(p => p.id !== photoId)
      onPhotosUpdate(updatedPhotos)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Dropzone configuration
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const file = acceptedFiles[0]

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image (JPEG, PNG, or WebP)')
      }

      setUploadProgress(30)

      // Upload to storage
      const photoUrl = await uploadPhoto(file)
      setUploadProgress(60)

      // Add to database
      const setAsPrimary = photos.length === 0 // Set as primary if first photo
      const photoId = await addPhotoToGallery(photoUrl, setAsPrimary)
      setUploadProgress(90)

      // Update local state
      const newPhoto: ArtistPhoto = {
        id: photoId,
        url: photoUrl,
        uploaded_at: new Date().toISOString(),
        is_primary: setAsPrimary
      }
      onPhotosUpdate([...photos, newPhoto])

      setUploadProgress(100)
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
      setUploadProgress(0)
    }
  }, [artistId, photos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: !isOwner
  })

  return (
    <div className="space-y-6">
      {/* Upload Area (only for owner) */}
      {isOwner && (
        <div
          {...getRootProps()}
          className={`
            relative p-8 border-2 border-dashed rounded-3xl cursor-pointer
            transition-all duration-300 backdrop-blur-xl
            ${isDragActive
              ? 'border-accent-yellow bg-accent-yellow/10'
              : 'border-gray-600 bg-white/5 hover:border-gray-500 hover:bg-white/10'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="text-center">
            {uploading ? (
              <>
                <motion.div
                  className="text-4xl mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.div>
                <p className="text-white font-medium mb-2">Uploading...</p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-yellow to-green-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📸</div>
                <p className="text-white font-medium text-lg mb-2">
                  {isDragActive ? 'Drop your photo here' : 'Upload Artist Photo'}
                </p>
                <p className="text-gray-400 text-sm">
                  Drag & drop or click to select • Max 5MB • JPEG, PNG, or WebP
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400"
        >
          ❌ {error}
        </motion.div>
      )}

      {/* Photo Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            {/* Photo Card */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-800 border-2 border-gray-700 hover:border-accent-yellow transition-all">
              <img
                src={photo.url}
                alt={photo.caption || 'Artist photo'}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />

              {/* Primary Badge */}
              {photo.is_primary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-accent-yellow text-black text-xs font-bold rounded-full">
                  ⭐ Primary
                </div>
              )}

              {/* Hover Actions (owner only) */}
              {isOwner && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  {!photo.is_primary && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPrimaryPhoto(photo.url)}
                      className="p-2 bg-accent-yellow text-black rounded-full font-bold text-sm"
                      title="Set as primary photo"
                    >
                      ⭐
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removePhoto(photo.id, photo.url)}
                    className="p-2 bg-red-600 text-white rounded-full font-bold text-sm"
                    title="Delete photo"
                  >
                    🗑️
                  </motion.button>
                </div>
              )}
            </div>

            {/* Caption */}
            {photo.caption && (
              <p className="mt-2 text-gray-300 text-sm text-center">
                {photo.caption}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {photos.length === 0 && !isOwner && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">📷</div>
          <p>No photos uploaded yet</p>
        </div>
      )}

      {/* Photo Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Artist photo'}
                className="w-full h-auto rounded-2xl"
              />

              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-2 -right-2 w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white font-bold transition-colors"
              >
                ✕
              </button>

              {/* Photo Info */}
              {selectedPhoto.caption && (
                <div className="mt-4 p-4 bg-white/10 backdrop-blur-xl rounded-xl text-white text-center">
                  {selectedPhoto.caption}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ArtistPhotoGallery