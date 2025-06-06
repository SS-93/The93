import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FileUploadModal from './FileUploadModal'
import AudioPreview from './AudioPreview'
import LoadingState from './LoadingState'

interface ContentItem {
  id: string
  name: string
  type: 'audio' | 'image' | 'video' | 'document' | 'folder'
  size: string
  uploadDate: string
  downloadUrl?: string
  isLocked?: boolean
  children?: ContentItem[]
  metadata?: {
    duration?: string
    artist?: string
    album?: string
  }
}

interface BucketTemplateUIProps {
  userRole: 'artist' | 'fan'
  artistName: string
  contentItems: ContentItem[]
  onUpload?: (files: File[], metadata: any) => void
  onDownload?: (item: ContentItem) => void
  loading?: boolean
}

const BucketTemplateUI: React.FC<BucketTemplateUIProps> = ({
  userRole,
  artistName,
  contentItems,
  onUpload,
  onDownload,
  loading = false
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date')
  const [filterBy, setFilterBy] = useState<'all' | 'audio' | 'unlocked' | 'locked'>('all')

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (type: string, isLocked?: boolean) => {
    const color = isLocked ? 'text-gray-500' : 'text-gray-300'
    
    if (type === 'audio') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={color}>
          <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
    
    if (type === 'folder') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={color}>
          <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-9l-2-2H5a2 2 0 0 0-2 2z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
    
    if (type === 'image') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={color}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
    
    // Default file icon
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={color}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid Date"
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...contentItems]
    
    // Apply filters
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => {
        if (filterBy === 'audio') return item.type === 'audio'
        if (filterBy === 'unlocked') return !item.isLocked
        if (filterBy === 'locked') return item.isLocked
        return true
      })
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })
  }, [contentItems, sortBy, filterBy])

  const renderContentItem = (item: ContentItem, depth = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(item.id)
    const isPlaying = currentlyPlaying === item.id
    const canAccess = userRole === 'artist' || !item.isLocked

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-b border-gray-800 ${!canAccess ? 'opacity-60' : ''}`}
      >
        <div 
          className="flex items-center justify-between p-3 hover:bg-gray-900/50 transition-colors cursor-pointer"
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {item.type === 'folder' ? (
              <button onClick={() => toggleFolder(item.id)} type="button" className="flex-shrink-0">
                {isExpanded ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                    <polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}
            
            <div className="flex-shrink-0">
              {getFileIcon(item.type, item.isLocked)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`font-mono text-sm truncate ${
                  canAccess ? 'text-white' : 'text-gray-500'
                }`}>
                  {item.name}
                </span>
                {item.isLocked && userRole === 'fan' && (
                  <span className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded">
                    LOCKED
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(item.uploadDate)} • {item.size}
                {item.metadata?.duration && ` • ${item.metadata.duration}`}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {item.type === 'audio' && canAccess && item.downloadUrl && (
              <button
                onClick={() => setCurrentlyPlaying(isPlaying ? null : item.id)}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
                type="button"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-yellow">
                    <rect x="6" y="4" width="4" height="16" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="4" width="4" height="16" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400 hover:text-white">
                    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                  </svg>
                )}
              </button>
            )}
            
            {canAccess && item.downloadUrl && (
              <button
                onClick={() => onDownload?.(item)}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400 hover:text-white">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Audio Preview */}
        {item.type === 'audio' && isPlaying && canAccess && item.downloadUrl && (
          <AudioPreview
            src={item.downloadUrl}
            onEnded={() => setCurrentlyPlaying(null)}
          />
        )}

        {/* Nested items for folders */}
        <AnimatePresence>
          {item.type === 'folder' && isExpanded && item.children && item.children.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-950/50"
            >
              {item.children.map(child => renderContentItem(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (loading) {
    return <LoadingState message="Loading bucket contents..." />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-mono font-bold">{artistName.toUpperCase()}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {userRole === 'artist' ? 'Your Bucket' : 'Artist Bucket'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Filters */}
            <select 
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Files</option>
              <option value="audio">Audio Only</option>
              {userRole === 'fan' && (
                <>
                  <option value="unlocked">Unlocked</option>
                  <option value="locked">Locked</option>
                </>
              )}
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="type">Sort by Type</option>
            </select>

            {userRole === 'artist' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 bg-accent-yellow text-black px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-black">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
                  <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-sm font-medium">Upload</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="glass border-x border-gray-800">
        {filteredAndSortedItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 opacity-50 text-gray-500">
              <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p>No content available</p>
            {userRole === 'artist' && (
              <p className="text-sm mt-2">Upload your first track to get started</p>
            )}
          </div>
        ) : (
          filteredAndSortedItems.map(item => renderContentItem(item))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && userRole === 'artist' && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={(files, metadata) => {
            onUpload?.(files, metadata)
            setShowUploadModal(false)
          }}
        />
      )}
    </div>
  )
}

export default BucketTemplateUI 