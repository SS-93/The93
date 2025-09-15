import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface UploadMetadata {
  title: string
  album?: string
  releaseDate?: string
  description?: string
  isPublic: boolean
  unlockDate?: string
}

interface FileUploadModalProps {
  onClose: () => void
  onUpload: (files: File[], metadata: UploadMetadata) => void
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ onClose, onUpload }) => {
  const [files, setFiles] = useState<File[]>([])
  const [metadata, setMetadata] = useState<UploadMetadata>({
    title: '',
    album: '',
    releaseDate: '',
    description: '',
    isPublic: true,
    unlockDate: ''
  })
  const [uploading, setUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) {
      // Default file icon
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
          <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }

    const mainType = mimeType.split('/')[0]
    
    if (mainType === 'audio') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-yellow">
          <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
    
    if (mainType === 'image') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-green">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
    
    // Default file icon
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
        <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setUploading(true)
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    onUpload(files, metadata)
    setUploading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Upload Content</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            {/* X icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative ${
              isDragActive 
                ? 'border-accent-yellow bg-yellow-900/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={() => setIsDragActive(true)}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={() => setIsDragActive(false)}
          >
            <input
              type="file"
              multiple
              accept="audio/*,image/*,video/*,.pdf,.txt,.md"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Upload icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 text-gray-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {isDragActive ? (
              <p className="text-yellow-400">Drop files here...</p>
            ) : (
              <div>
                <p className="text-gray-300 mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-gray-500">
                  Supported: MP3, WAV, AAC, M4A, JPG, PNG, PDF, TXT
                </p>
              </div>
            )}
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Selected Files</h3>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm text-white">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {/* X icon for remove */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Metadata Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent-yellow focus:outline-none"
                placeholder="Enter content title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Album/Collection
              </label>
              <input
                type="text"
                value={metadata.album}
                onChange={(e) => setMetadata(prev => ({ ...prev, album: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent-yellow focus:outline-none"
                placeholder="Optional album name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Release Date
              </label>
              <input
                type="date"
                value={metadata.releaseDate}
                onChange={(e) => setMetadata(prev => ({ ...prev, releaseDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent-yellow focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent-yellow focus:outline-none resize-none"
                placeholder="Optional description or notes"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={metadata.isPublic}
                  onChange={(e) => setMetadata(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-800 text-accent-yellow focus:ring-accent-yellow"
                />
                <span className="text-sm text-gray-300">Make publicly available to subscribers</span>
              </label>
            </div>

            {!metadata.isPublic && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unlock Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={metadata.unlockDate}
                  onChange={(e) => setMetadata(prev => ({ ...prev, unlockDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent-yellow focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to manually unlock later
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={files.length === 0 || !metadata.title || uploading}
              className="px-6 py-2 bg-accent-yellow text-black rounded font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default FileUploadModal 