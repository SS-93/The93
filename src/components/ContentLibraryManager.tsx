import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useAudioPlayer } from '../context/AudioPlayerContext'
import MetadataEditModal from './MetadataEditModal'

interface ContentItem {
  id: string
  artist_id: string
  title: string
  description?: string
  content_type: 'audio' | 'video' | 'image' | 'document'
  file_path: string
  file_size_bytes?: number
  duration_seconds?: number
  unlock_date?: string
  is_premium: boolean
  metadata: any
  created_at: string
  updated_at: string
  // Enhanced fields
  status?: string
  plays_count?: number
  likes_count?: number
}

interface ArtistProfile {
  id: string
  artist_name: string
  verification_status: string
}

type ViewMode = 'grid' | 'list'
type FilterMode = 'all' | 'published' | 'scheduled' | 'draft'
type SortMode = 'newest' | 'oldest' | 'title' | 'plays'

const ContentLibraryManager: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { playTrack, addToQueue } = useAudioPlayer()
  
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Fetch artist profile
  const fetchArtistProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('artist_profiles')
      .select('id, artist_name, verification_status')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching artist profile:', error)
      return
    }

    setArtistProfile(data)
  }

  // Fetch content items
  const fetchContentItems = async () => {
    if (!artistProfile) return

    try {
      let query = supabase
        .from('content_items')
        .select('*')
        .eq('artist_id', artistProfile.id)

      // Apply sorting
      switch (sortMode) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'title':
          query = query.order('title', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching content items:', error)
        return
      }

      setContentItems(data || [])
    } catch (error) {
      console.error('Failed to fetch content items:', error)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      await fetchArtistProfile()
      setLoading(false)
    }

    if (user) {
      initialize()
    }
  }, [user])

  useEffect(() => {
    if (artistProfile) {
      fetchContentItems()
    }
  }, [artistProfile, sortMode])

  // Filter content items based on search and filter mode
  const filteredItems = contentItems.filter(item => {
    // Search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Status filter
    switch (filterMode) {
      case 'published':
        return !item.unlock_date || new Date(item.unlock_date) <= new Date()
      case 'scheduled':
        return item.unlock_date && new Date(item.unlock_date) > new Date()
      case 'draft':
        return item.status === 'draft'
      default:
        return true
    }
  })

  // Handle item selection
  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedItems(new Set(filteredItems.map(item => item.id)))
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  // Convert content item to track format
  const convertToTrack = async (item: ContentItem) => {
    const { data: signedUrlData } = await supabase.storage
      .from('artist-content')
      .createSignedUrl(item.file_path, 3600)

    return {
      id: item.id,
      title: item.title,
      artist: artistProfile?.artist_name || 'Unknown Artist',
      artistId: artistProfile?.id || '',
      audioUrl: signedUrlData?.signedUrl || '',
      duration: item.duration_seconds,
      metadata: item.metadata
    }
  }

  // Handle play track
  const handlePlayTrack = async (item: ContentItem) => {
    if (item.content_type !== 'audio') return

    try {
      const track = await convertToTrack(item)
      if (track.audioUrl) {
        playTrack(track)
        
        // Add other audio tracks to queue
        const otherAudioItems = filteredItems.filter(i => 
          i.content_type === 'audio' && i.id !== item.id
        )
        const queueTracks = await Promise.all(
          otherAudioItems.map(convertToTrack)
        )
        const validQueueTracks = queueTracks.filter(t => t.audioUrl)
        addToQueue(validQueueTracks)
      }
    } catch (error) {
      console.error('Error playing track:', error)
    }
  }

  // Delete selected items
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .in('id', Array.from(selectedItems))

      if (error) {
        console.error('Error deleting items:', error)
        return
      }

      // Remove deleted items from local state
      setContentItems(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      
      console.log(`✅ Successfully deleted ${selectedItems.size} item(s)`)
    } catch (error) {
      console.error('Failed to delete items:', error)
    }
  }

  // Handle edit item
  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  // Handle save edited item
  const handleSaveEditedItem = (updatedItem: ContentItem) => {
    setContentItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
    setEditingItem(null)
    setShowEditModal(false)
  }

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditingItem(null)
    setShowEditModal(false)
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'audio': return '🎵'
      case 'video': return '🎬'
      case 'image': return '🖼️'
      case 'document': return '📄'
      default: return '📁'
    }
  }

  const getStatusColor = (item: ContentItem) => {
    if (item.status === 'draft') return 'text-yellow-400'
    if (item.unlock_date && new Date(item.unlock_date) > new Date()) return 'text-blue-400'
    return 'text-green-400'
  }

  const getStatusText = (item: ContentItem) => {
    if (item.status === 'draft') return 'Draft'
    if (item.unlock_date && new Date(item.unlock_date) > new Date()) return 'Scheduled'
    return 'Published'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-4xl animate-spin">📚</div>
          </div>
          <h3 className="text-xl font-bold mb-2">Loading your library...</h3>
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
                onClick={() => navigate('/upload')}
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ x: -2 }}
              >
                ← Back to Upload
              </motion.button>
              <div>
                <h1 className="text-3xl font-black">Content Library</h1>
                <p className="text-gray-400">
                  {artistProfile?.artist_name} • {filteredItems.length} items
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/upload')}
              className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors"
            >
              + Upload New
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search your tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:border-accent-yellow focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filters */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-accent-yellow focus:outline-none"
            >
              <option value="all">All Items</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Drafts</option>
            </select>

            {/* Sort */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-accent-yellow focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="plays">Most Played</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-accent-yellow text-black' : 'text-gray-400 hover:text-white'}`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-accent-yellow text-black' : 'text-gray-400 hover:text-white'}`}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <motion.div
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-300">
                {selectedItems.size} item(s) selected
              </span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold mb-4">No content found</h3>
            <p className="text-gray-400 mb-8">
              {searchQuery 
                ? `No items match "${searchQuery}"`
                : "Start by uploading your first track"
              }
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors"
            >
              Upload Your First Track
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className={`bg-gray-900/30 border rounded-xl overflow-hidden hover:border-gray-600 transition-all cursor-pointer ${
                  selectedItems.has(item.id) ? 'border-accent-yellow' : 'border-gray-800'
                }`}
                whileHover={{ y: -2 }}
                onClick={() => toggleSelection(item.id)}
              >
                <div className="aspect-square bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl">{getContentIcon(item.content_type)}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold truncate flex-1">{item.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item)}`}>
                      {getStatusText(item)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-400">
                    <div>Type: {item.content_type}</div>
                    <div>Size: {formatBytes(item.file_size_bytes)}</div>
                    {item.duration_seconds && (
                      <div>Duration: {formatDuration(item.duration_seconds)}</div>
                    )}
                    <div>Uploaded: {new Date(item.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    {item.content_type === 'audio' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayTrack(item)
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                      >
                        ▶ Play
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditItem(item)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className={`bg-gray-900/30 border rounded-lg p-4 hover:border-gray-600 transition-all cursor-pointer ${
                  selectedItems.has(item.id) ? 'border-accent-yellow' : 'border-gray-800'
                }`}
                whileHover={{ x: 2 }}
                onClick={() => toggleSelection(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getContentIcon(item.content_type)}</span>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-gray-400">
                        {item.content_type} • {formatBytes(item.file_size_bytes)}
                        {item.duration_seconds && ` • ${formatDuration(item.duration_seconds)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(item)}`}>
                      {getStatusText(item)}
                    </span>
                    <div className="text-sm text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    
                    {item.content_type === 'audio' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayTrack(item)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        ▶ Play
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditItem(item)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && artistProfile && (
        <MetadataEditModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          contentItem={editingItem}
          onSave={handleSaveEditedItem}
          artistId={artistProfile.id}
        />
      )}
    </div>
  )
}

export default ContentLibraryManager