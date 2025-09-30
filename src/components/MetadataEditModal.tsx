import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'

interface Album {
  id: string
  name: string
  artist_id: string
  created_at: string
}

interface BucketsTrackMetadata {
  // Advanced Details
  buy_link_url?: string
  buy_link_title?: string
  record_label?: string
  release_date?: string
  publisher?: string
  isrc?: string
  explicit: boolean
  p_line?: string
  
  // Album Linking
  album_id?: string
  album_name?: string
  track_number?: number
  
  // Permissions/Access
  enable_direct_downloads: boolean
  offline_listening: boolean
  include_in_rss: boolean
  display_embed_code: boolean
  enable_app_playback: boolean
  allow_comments: boolean
  show_comments_public: boolean
  show_insights_public: boolean
  
  // Geoblocking
  availability_scope: 'worldwide' | 'exclusive_regions' | 'blocked_regions'
  availability_regions: string[]
  
  // Preview/Clips
  preview_clip?: {
    start_sec: number
    duration_sec: number
  }
  visual_clip?: {
    file_path: string
    duration_sec: number
    loop_enabled: boolean
  }
  
  // Lyrics
  lyrics?: {
    text: string
    synchronized?: boolean
    language?: string
    rights_cleared?: boolean
  }
  
  // Licensing
  license_type: 'all_rights_reserved' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc_by_nc_sa' | 'cc_by_nd' | 'cc_by_nc_nd' | 'bsl'
}

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

interface MetadataEditModalProps {
  isOpen: boolean
  onClose: () => void
  contentItem: ContentItem
  onSave: (updatedItem: ContentItem) => void
  artistId: string
}

type TabId = 'details' | 'album' | 'visuals' | 'lyrics' | 'permissions' | 'licensing'

const MetadataEditModal: React.FC<MetadataEditModalProps> = ({
  isOpen,
  onClose,
  contentItem,
  onSave,
  artistId
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('details')
  const [editedItem, setEditedItem] = useState<ContentItem>(contentItem)
  const [existingAlbums, setExistingAlbums] = useState<Album[]>([])
  const [newAlbumName, setNewAlbumName] = useState('')
  const [showNewAlbumInput, setShowNewAlbumInput] = useState(false)
  const [visualFile, setVisualFile] = useState<File | null>(null)
  const [uploadingVisual, setUploadingVisual] = useState(false)
  const [replaceFile, setReplaceFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const tabs = [
    { id: 'details' as TabId, label: 'Details', icon: '📋' },
    { id: 'album' as TabId, label: 'Album', icon: '💿' },
    { id: 'visuals' as TabId, label: 'Visuals', icon: '🎬' },
    { id: 'lyrics' as TabId, label: 'Lyrics', icon: '🎤' },
    { id: 'permissions' as TabId, label: 'Permissions', icon: '🔐' },
    { id: 'licensing' as TabId, label: 'License', icon: '📜' }
  ]

  // Reset edited item when content item changes
  useEffect(() => {
    setEditedItem(contentItem)
  }, [contentItem])

  // Fetch existing albums for this artist
  useEffect(() => {
    const fetchAlbums = async () => {
      if (!artistId) return

      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('metadata')
          .eq('artist_id', artistId)
          .not('metadata->album_name', 'is', null)

        if (error) {
          console.error('Error fetching albums:', error)
          return
        }

        const albumsMap = new Map<string, Album>()
        data?.forEach(item => {
          const albumName = item.metadata?.album_name
          const albumId = item.metadata?.album_id
          if (albumName && !albumsMap.has(albumName)) {
            albumsMap.set(albumName, {
              id: albumId || `album_${albumName.replace(/\s+/g, '_').toLowerCase()}`,
              name: albumName,
              artist_id: artistId,
              created_at: new Date().toISOString()
            })
          }
        })

        setExistingAlbums(Array.from(albumsMap.values()))
      } catch (error) {
        console.error('Failed to fetch albums:', error)
      }
    }

    if (isOpen) {
      fetchAlbums()
    }
  }, [artistId, isOpen])

  const updateMetadata = (updates: Partial<BucketsTrackMetadata>) => {
    setEditedItem(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates }
    }))
  }

  const handleSave = async () => {
    setUploading(true)
    
    try {
      // Handle file replacement if needed
      if (replaceFile) {
        const fileExt = replaceFile.name.split('.').pop()
        const fileName = `${artistId}/${Date.now()}-${editedItem.title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('artist-content')
          .upload(fileName, replaceFile)

        if (uploadError) throw uploadError

        // Update the file path
        setEditedItem(prev => ({ ...prev, file_path: uploadData.path }))
      }

      // Update the content item in database
      const { error } = await supabase
        .from('content_items')
        .update({
          title: editedItem.title,
          description: editedItem.description,
          metadata: editedItem.metadata,
          updated_at: new Date().toISOString(),
          ...(replaceFile && { file_path: editedItem.file_path })
        })
        .eq('id', editedItem.id)

      if (error) throw error

      onSave({ ...editedItem, updated_at: new Date().toISOString() })
      onClose()
    } catch (error) {
      console.error('Failed to save changes:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleAlbumSelection = (albumId: string, albumName: string) => {
    updateMetadata({
      album_id: albumId,
      album_name: albumName
    })
    setShowNewAlbumInput(false)
  }

  const handleCreateNewAlbum = () => {
    if (!newAlbumName.trim()) return

    const newAlbumId = `album_${newAlbumName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`
    updateMetadata({
      album_id: newAlbumId,
      album_name: newAlbumName.trim()
    })
    
    setExistingAlbums(prev => [...prev, {
      id: newAlbumId,
      name: newAlbumName.trim(),
      artist_id: artistId,
      created_at: new Date().toISOString()
    }])
    
    setNewAlbumName('')
    setShowNewAlbumInput(false)
  }

  const handleVisualUpload = async (file: File) => {
    setUploadingVisual(true)
    setVisualFile(file)

    try {
      const fileName = `visual_${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('artist-content')
        .upload(`visuals/${artistId}/${fileName}`, file)

      if (error) {
        console.error('Error uploading visual:', error)
        return
      }

      updateMetadata({
        visual_clip: {
          file_path: data.path,
          duration_sec: 30,
          loop_enabled: true
        }
      })

      console.log('✅ Visual uploaded successfully:', data.path)
    } catch (error) {
      console.error('Failed to upload visual:', error)
    } finally {
      setUploadingVisual(false)
    }
  }

  const InputField: React.FC<{
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: string
    maxLength?: number
  }> = ({ label, value, onChange, placeholder, type = 'text', maxLength }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-accent-yellow focus:outline-none"
      />
    </div>
  )

  const ToggleField: React.FC<{
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
  }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
      <div>
        <h4 className="text-white font-medium">{label}</h4>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-accent-yellow' : 'bg-gray-600'
        }`}
      >
        <motion.div
          className={`absolute top-1 w-4 h-4 rounded-full transition-colors ${
            checked ? 'bg-black' : 'bg-gray-400'
          }`}
          animate={{ x: checked ? 28 : 4 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </button>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={editedItem.title}
                onChange={(e) => setEditedItem(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-accent-yellow focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={editedItem.description || ''}
                onChange={(e) => setEditedItem(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-accent-yellow focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Buy Link URL"
                value={editedItem.metadata.buy_link_url || ''}
                onChange={(value) => updateMetadata({ buy_link_url: value })}
                placeholder="https://store.example.com/track"
                type="url"
              />
              <InputField
                label="Buy Link Title"
                value={editedItem.metadata.buy_link_title || ''}
                onChange={(value) => updateMetadata({ buy_link_title: value })}
                placeholder="Buy Now"
                maxLength={30}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Record Label"
                value={editedItem.metadata.record_label || ''}
                onChange={(value) => updateMetadata({ record_label: value })}
                placeholder="Your Record Label"
              />
              <InputField
                label="Release Date"
                value={editedItem.metadata.release_date || ''}
                onChange={(value) => updateMetadata({ release_date: value })}
                type="date"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Publisher"
                value={editedItem.metadata.publisher || ''}
                onChange={(value) => updateMetadata({ publisher: value })}
                placeholder="Music Publisher"
              />
              <InputField
                label="ISRC Code"
                value={editedItem.metadata.isrc || ''}
                onChange={(value) => updateMetadata({ isrc: value.toUpperCase() })}
                placeholder="USABC2500123"
                maxLength={12}
              />
            </div>
            
            <InputField
              label="℗ Line (P Line)"
              value={editedItem.metadata.p_line || ''}
              onChange={(value) => updateMetadata({ p_line: value })}
              placeholder="℗ 2025 Your Label Name"
            />
            
            <ToggleField
              label="Contains Explicit Content"
              description="Mark if this track contains explicit language or content"
              checked={editedItem.metadata.explicit}
              onChange={(checked) => updateMetadata({ explicit: checked })}
            />

            {/* Replace File Section */}
            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-lg font-medium text-white mb-4">Replace Audio File</h4>
              <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-3">Current file: {editedItem.file_path.split('/').pop()}</p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setReplaceFile(file)
                    }
                  }}
                  className="hidden"
                  id="replace-file"
                />
                <label
                  htmlFor="replace-file"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  Choose New File
                </label>
                {replaceFile && (
                  <p className="text-sm text-green-400 mt-2">
                    New file selected: {replaceFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 'album':
        return (
          <div className="space-y-6">
            {editedItem.metadata.album_name && (
              <div className="bg-accent-yellow/20 border border-accent-yellow/30 rounded-lg p-3">
                <p className="text-accent-yellow font-medium">
                  Selected Album: {editedItem.metadata.album_name}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Select Existing Album
              </label>
              
              {existingAlbums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {existingAlbums.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => handleAlbumSelection(album.id, album.name)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        editedItem.metadata.album_id === album.id
                          ? 'bg-accent-yellow/20 border-accent-yellow text-accent-yellow'
                          : 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium">{album.name}</div>
                      <div className="text-xs text-gray-400">
                        Created {new Date(album.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  No existing albums found
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              {!showNewAlbumInput ? (
                <button
                  onClick={() => setShowNewAlbumInput(true)}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  + Create New Album
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Enter new album name"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-accent-yellow focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateNewAlbum()}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateNewAlbum}
                      disabled={!newAlbumName.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create Album
                    </button>
                    <button
                      onClick={() => {
                        setShowNewAlbumInput(false)
                        setNewAlbumName('')
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {editedItem.metadata.album_name && (
              <InputField
                label="Track Number"
                value={editedItem.metadata.track_number?.toString() || ''}
                onChange={(value) => updateMetadata({ track_number: parseInt(value) || undefined })}
                placeholder="1"
                type="number"
              />
            )}
          </div>
        )

      case 'visuals':
        return (
          <div className="space-y-6">
            {editedItem.metadata.visual_clip ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 font-medium">Visual clip uploaded</p>
                    <p className="text-sm text-gray-400">
                      Duration: {editedItem.metadata.visual_clip.duration_sec}s • 
                      Loop: {editedItem.metadata.visual_clip.loop_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button
                    onClick={() => updateMetadata({ visual_clip: undefined })}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-lg font-bold text-white mb-2">Upload Visual Clip</h3>
                <p className="text-gray-400 mb-4">
                  Add a 20-30 second visual to accompany your track
                </p>
                
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleVisualUpload(file)
                    }
                  }}
                  className="hidden"
                  id="visual-upload"
                />
                
                <label
                  htmlFor="visual-upload"
                  className={`inline-block px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer ${
                    uploadingVisual
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {uploadingVisual ? 'Uploading...' : 'Choose Video File'}
                </label>
              </div>
            )}
            
            {editedItem.metadata.visual_clip && (
              <ToggleField
                label="Loop Playback"
                description="Automatically loop the visual clip during playback"
                checked={editedItem.metadata.visual_clip.loop_enabled}
                onChange={(checked) => 
                  updateMetadata({ 
                    visual_clip: { 
                      ...editedItem.metadata.visual_clip!, 
                      loop_enabled: checked 
                    }
                  })
                }
              />
            )}
          </div>
        )

      case 'lyrics':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lyrics Text
              </label>
              <textarea
                value={editedItem.metadata.lyrics?.text || ''}
                onChange={(e) => updateMetadata({ 
                  lyrics: { 
                    ...editedItem.metadata.lyrics, 
                    text: e.target.value 
                  }
                })}
                rows={8}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-accent-yellow focus:outline-none resize-none"
                placeholder="Enter lyrics here..."
              />
            </div>
            
            <InputField
              label="Language"
              value={editedItem.metadata.lyrics?.language || ''}
              onChange={(value) => updateMetadata({ 
                lyrics: { 
                  ...editedItem.metadata.lyrics, 
                  text: editedItem.metadata.lyrics?.text || '',
                  language: value 
                }
              })}
              placeholder="e.g. English, Spanish, etc."
            />
            
            <ToggleField
              label="Synchronized Lyrics"
              description="Enable timed/synchronized lyrics for karaoke-style display"
              checked={editedItem.metadata.lyrics?.synchronized || false}
              onChange={(checked) => updateMetadata({ 
                lyrics: { 
                  ...editedItem.metadata.lyrics, 
                  text: editedItem.metadata.lyrics?.text || '',
                  synchronized: checked 
                }
              })}
            />
            
            <ToggleField
              label="Rights Cleared"
              description="Confirm that you have the rights to use these lyrics"
              checked={editedItem.metadata.lyrics?.rights_cleared || false}
              onChange={(checked) => updateMetadata({ 
                lyrics: { 
                  ...editedItem.metadata.lyrics, 
                  text: editedItem.metadata.lyrics?.text || '',
                  rights_cleared: checked 
                }
              })}
            />
          </div>
        )

      case 'permissions':
        return (
          <div className="space-y-3">
            <ToggleField
              label="Enable Direct Downloads"
              description="Allow listeners to download the original audio file"
              checked={editedItem.metadata.enable_direct_downloads}
              onChange={(checked) => updateMetadata({ enable_direct_downloads: checked })}
            />
            
            <ToggleField
              label="Offline Listening"
              description="Allow playback on devices without internet connection"
              checked={editedItem.metadata.offline_listening}
              onChange={(checked) => updateMetadata({ offline_listening: checked })}
            />
            
            <ToggleField
              label="Include in RSS Feed"
              description="Include this track in your public RSS feed"
              checked={editedItem.metadata.include_in_rss}
              onChange={(checked) => updateMetadata({ include_in_rss: checked })}
            />
            
            <ToggleField
              label="Display Embed Code"
              description="Show an embeddable player code publicly"
              checked={editedItem.metadata.display_embed_code}
              onChange={(checked) => updateMetadata({ display_embed_code: checked })}
            />
            
            <ToggleField
              label="Enable App Playback"
              description="Permit playback in external apps and services"
              checked={editedItem.metadata.enable_app_playback}
              onChange={(checked) => updateMetadata({ enable_app_playback: checked })}
            />
            
            <ToggleField
              label="Allow Comments"
              description="Permit people to comment on your track"
              checked={editedItem.metadata.allow_comments}
              onChange={(checked) => updateMetadata({ allow_comments: checked })}
            />
            
            <ToggleField
              label="Show Comments to Public"
              description="Make existing comments publicly visible"
              checked={editedItem.metadata.show_comments_public}
              onChange={(checked) => updateMetadata({ show_comments_public: checked })}
            />
            
            <ToggleField
              label="Show Insights to Public"
              description="Make track statistics and insights publicly visible"
              checked={editedItem.metadata.show_insights_public}
              onChange={(checked) => updateMetadata({ show_insights_public: checked })}
            />
          </div>
        )

      case 'licensing':
        return (
          <div className="space-y-3">
            {[
              { value: 'all_rights_reserved', label: 'All Rights Reserved', description: 'Traditional full copyright protection' },
              { value: 'bsl', label: 'Buckets Sync Library (BSL)', description: 'Available for film, TV, commercials & music supervision' },
              { value: 'cc_by', label: 'Creative Commons BY', description: 'Attribution required' },
              { value: 'cc_by_sa', label: 'Creative Commons BY-SA', description: 'Attribution + ShareAlike' },
              { value: 'cc_by_nc', label: 'Creative Commons BY-NC', description: 'Attribution + Non-Commercial' },
              { value: 'cc_by_nc_sa', label: 'Creative Commons BY-NC-SA', description: 'Attribution + Non-Commercial + ShareAlike' }
            ].map((license) => (
              <button
                key={license.value}
                onClick={() => updateMetadata({ license_type: license.value as any })}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  editedItem.metadata.license_type === license.value
                    ? 'bg-accent-yellow/20 border-accent-yellow text-accent-yellow'
                    : 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                }`}
              >
                <div className="font-medium">{license.label}</div>
                <div className="text-sm text-gray-400">{license.description}</div>
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Edit Metadata</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className="border-b border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-yellow text-accent-yellow bg-accent-yellow/10'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="px-6 py-2 bg-accent-yellow text-black font-bold rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default MetadataEditModal