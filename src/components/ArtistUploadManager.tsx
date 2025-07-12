import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

interface UploadFile extends File {
  id: string
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  metadata: {
    title: string
    album?: string
    genre?: string
    description?: string
    tags: string[]
    isPublic: boolean
    unlockDate?: string
    subscriptionTier?: 'free' | 'tier1' | 'tier2' | 'tier3'
    collaborators?: string[]
    credits?: { role: string; name: string }[]
  }
}

interface ArtistUploadManagerProps {
  onUploadComplete?: (files: UploadFile[]) => void
  onClose?: () => void
}

const ArtistUploadManager: React.FC<ArtistUploadManagerProps> = ({ 
  onUploadComplete, 
  onClose 
}) => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'upload' | 'metadata' | 'review' | 'complete'>('upload')
  
  const { user } = useAuth()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file, index) => ({
      ...file,
      id: `${Date.now()}-${index}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending',
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        tags: [],
        isPublic: false,
        subscriptionTier: 'free'
      }
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    if (files.length === 0 && newFiles.length > 0) {
      setStep('metadata')
    }
  }, [files.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a'],
      'video/*': ['.mp4', '.mov', '.avi'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    multiple: true
  })

  const updateFileMetadata = (fileId: string, metadata: Partial<UploadFile['metadata']>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, metadata: { ...file.metadata, ...metadata } }
        : file
    ))
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(file => file.id !== fileId)
      if (currentFileIndex >= newFiles.length && newFiles.length > 0) {
        setCurrentFileIndex(newFiles.length - 1)
      } else if (newFiles.length === 0) {
        setStep('upload')
      }
      return newFiles
    })
  }

  const uploadFiles = async () => {
    if (!user) return

    setUploading(true)
    setStep('review')

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        // Create unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${file.metadata.title}.${fileExt}`

        // Simulate progress updates (since Supabase doesn't provide native progress tracking)
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => {
            if (f.id === file.id && f.progress < 90) {
              return { ...f, progress: f.progress + Math.random() * 20 }
            }
            return f
          }))
        }, 200)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('content')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        // Clear progress interval
        clearInterval(progressInterval)

        if (uploadError) throw uploadError

        // Create content record in database
        const { error: dbError } = await supabase
          .from('content_items')
          .insert({
            artist_id: user.id,
            title: file.metadata.title,
            description: file.metadata.description,
            file_path: uploadData.path,
            file_type: file.type,
            file_size: file.size,
            metadata: {
              album: file.metadata.album,
              genre: file.metadata.genre,
              tags: file.metadata.tags,
              credits: file.metadata.credits,
              collaborators: file.metadata.collaborators
            },
            is_public: file.metadata.isPublic,
            subscription_tier_required: file.metadata.subscriptionTier,
            unlock_date: file.metadata.unlockDate || null
          })

        if (dbError) throw dbError

        // Mark as completed
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ))

      } catch (error) {
        console.error('Upload error:', error)
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ))
      }
    }

    setUploading(false)
    setStep('complete')
    onUploadComplete?.(files)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('audio/')) return '🎵'
    if (type.startsWith('video/')) return '🎬'
    if (type.startsWith('image/')) return '🖼️'
    return '📄'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-400'
      case 'uploading': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const currentFile = files[currentFileIndex]

  if (step === 'complete') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black border border-white/10 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Upload Complete!</h2>
          <p className="text-gray-400 mb-6">
            {files.filter(f => f.status === 'completed').length} of {files.length} files uploaded successfully
          </p>
          
          <button
            onClick={onClose}
            className="w-full bg-accent-yellow text-black font-bold py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Upload Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {['Upload', 'Metadata', 'Review'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ['upload', 'metadata', 'review'].indexOf(step) >= index
                    ? 'bg-accent-yellow text-black'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 ${
                  ['upload', 'metadata', 'review'].indexOf(step) >= index
                    ? 'text-white'
                    : 'text-gray-400'
                }`}>
                  {stepName}
                </span>
                {index < 2 && <div className="w-8 h-px bg-gray-700 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'upload' && (
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  isDragActive
                    ? 'border-accent-yellow bg-accent-yellow/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </h3>
                <p className="text-gray-400 mb-4">
                  or click to browse your files
                </p>
                <p className="text-sm text-gray-500">
                  Supports: MP3, WAV, FLAC, MP4, MOV, JPG, PNG
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-white mb-4">Selected Files</h4>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getFileIcon(file.type)}</span>
                          <div>
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-gray-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-400 hover:text-red-300 text-xl"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep('metadata')}
                    className="w-full mt-6 bg-accent-yellow text-black font-bold py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors"
                  >
                    Continue to Metadata
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'metadata' && currentFile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* File Navigation */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    File {currentFileIndex + 1} of {files.length}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentFileIndex(Math.max(0, currentFileIndex - 1))}
                      disabled={currentFileIndex === 0}
                      className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentFileIndex(Math.min(files.length - 1, currentFileIndex + 1))}
                      disabled={currentFileIndex === files.length - 1}
                      className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/30 rounded-lg mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getFileIcon(currentFile.type)}</span>
                    <p className="text-white font-medium">{currentFile.name}</p>
                  </div>
                  {currentFile.preview && (
                    <img 
                      src={currentFile.preview} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-lg mt-3"
                    />
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('review')}
                    className="w-full bg-accent-yellow text-black font-bold py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors"
                  >
                    Save & Continue to Review
                  </button>
                  <button
                    onClick={() => setStep('upload')}
                    className="w-full bg-gray-700 text-white font-bold py-2 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>

              {/* Metadata Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={currentFile.metadata.title}
                    onChange={(e) => updateFileMetadata(currentFile.id, { title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-accent-yellow/50 focus:outline-none"
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Album/Project
                  </label>
                  <input
                    type="text"
                    value={currentFile.metadata.album || ''}
                    onChange={(e) => updateFileMetadata(currentFile.id, { album: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-accent-yellow/50 focus:outline-none"
                    placeholder="Album or project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    value={currentFile.metadata.genre || ''}
                    onChange={(e) => updateFileMetadata(currentFile.id, { genre: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-accent-yellow/50 focus:outline-none"
                  >
                    <option value="">Select genre</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Hip-Hop">Hip-Hop</option>
                    <option value="R&B">R&B</option>
                    <option value="Indie Rock">Indie Rock</option>
                    <option value="Folk">Folk</option>
                    <option value="Jazz">Jazz</option>
                    <option value="Pop">Pop</option>
                    <option value="Alternative">Alternative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentFile.metadata.description || ''}
                    onChange={(e) => updateFileMetadata(currentFile.id, { description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-accent-yellow/50 focus:outline-none resize-none"
                    placeholder="Describe your content..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subscription Tier
                  </label>
                  <select
                    value={currentFile.metadata.subscriptionTier}
                    onChange={(e) => updateFileMetadata(currentFile.id, { subscriptionTier: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-accent-yellow/50 focus:outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="tier1">Tier 1 ($5/month)</option>
                    <option value="tier2">Tier 2 ($10/month)</option>
                    <option value="tier3">Tier 3 ($20/month)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                  <div>
                    <h4 className="font-medium text-white">Public Release</h4>
                    <p className="text-sm text-gray-400">Make this content publicly discoverable</p>
                  </div>
                  <button
                    onClick={() => updateFileMetadata(currentFile.id, { isPublic: !currentFile.metadata.isPublic })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      currentFile.metadata.isPublic ? 'bg-accent-yellow' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      currentFile.metadata.isPublic ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Review Your Upload</h3>
              
              <div className="space-y-4 mb-8">
                {files.map((file) => (
                  <div key={file.id} className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-xl">{getFileIcon(file.type)}</span>
                          <h4 className="font-bold text-white">{file.metadata.title}</h4>
                          <span className={`text-sm ${getStatusColor(file.status)}`}>
                            {file.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Album: </span>
                            <span className="text-white">{file.metadata.album || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Genre: </span>
                            <span className="text-white">{file.metadata.genre || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Tier: </span>
                            <span className="text-white">{file.metadata.subscriptionTier}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Public: </span>
                            <span className="text-white">{file.metadata.isPublic ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        
                        {file.status === 'uploading' && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-accent-yellow h-2 rounded-full transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{Math.round(file.progress)}% uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('metadata')}
                  disabled={uploading}
                  className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Back to Metadata
                </button>
                <button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="flex-1 bg-accent-yellow text-black font-bold py-3 rounded-xl hover:bg-accent-yellow/90 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Start Upload'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ArtistUploadManager 