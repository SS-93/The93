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

interface AdvancedMetadataAccordionProps {
  metadata: BucketsTrackMetadata
  onMetadataChange: (metadata: BucketsTrackMetadata) => void
  artistId: string
}

type AccordionSection = 'details' | 'album' | 'visuals' | 'lyrics' | 'permissions' | 'geoblocking' | 'preview' | 'licensing'

const AdvancedMetadataAccordion: React.FC<AdvancedMetadataAccordionProps> = ({
  metadata,
  onMetadataChange,
  artistId
}) => {
  const [openSections, setOpenSections] = useState<Set<AccordionSection>>(new Set())
  const [existingAlbums, setExistingAlbums] = useState<Album[]>([])
  const [newAlbumName, setNewAlbumName] = useState('')
  const [showNewAlbumInput, setShowNewAlbumInput] = useState(false)
  const [visualFile, setVisualFile] = useState<File | null>(null)
  const [uploadingVisual, setUploadingVisual] = useState(false)

  // Fetch existing albums for this artist
  useEffect(() => {
    const fetchAlbums = async () => {
      if (!artistId) return

      try {
        // Query content_items for unique album names
        const { data, error } = await supabase
          .from('content_items')
          .select('metadata')
          .eq('artist_id', artistId)
          .not('metadata->album_name', 'is', null)

        if (error) {
          console.error('Error fetching albums:', error)
          return
        }

        // Extract unique albums
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

    fetchAlbums()
  }, [artistId])

  const toggleSection = (section: AccordionSection) => {
    setOpenSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const updateMetadata = (updates: Partial<BucketsTrackMetadata>) => {
    onMetadataChange({ ...metadata, ...updates })
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
    
    // Add to existing albums list
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
      // Upload to Supabase Storage
      const fileName = `visual_${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('artist-content')
        .upload(`visuals/${artistId}/${fileName}`, file)

      if (error) {
        console.error('Error uploading visual:', error)
        return
      }

      // Update metadata with visual clip info
      updateMetadata({
        visual_clip: {
          file_path: data.path,
          duration_sec: 30, // Default 30 seconds
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

  const AccordionHeader: React.FC<{ 
    section: AccordionSection
    title: string
    icon: string
    description: string
  }> = ({ section, title, icon, description }) => {
    const isOpen = openSections.has(section)
    
    return (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 rounded-lg transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          ▼
        </motion.div>
      </button>
    )
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Advanced Metadata</h2>
        <p className="text-sm text-gray-400">
          {openSections.size > 0 ? `${openSections.size} section(s) expanded` : 'All sections collapsed'}
        </p>
      </div>

      {/* Advanced Details Section */}
      <div>
        <AccordionHeader
          section="details"
          title="Advanced Details"
          icon="📋"
          description="Buy links, record label, release info, ISRC"
        />
        
        <AnimatePresence>
          {openSections.has('details') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-900/30 border-x border-b border-gray-700 rounded-b-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Buy Link URL"
                    value={metadata.buy_link_url || ''}
                    onChange={(value) => updateMetadata({ buy_link_url: value })}
                    placeholder="https://store.example.com/track"
                    type="url"
                  />
                  <InputField
                    label="Buy Link Title"
                    value={metadata.buy_link_title || ''}
                    onChange={(value) => updateMetadata({ buy_link_title: value })}
                    placeholder="Buy Now"
                    maxLength={30}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Record Label"
                    value={metadata.record_label || ''}
                    onChange={(value) => updateMetadata({ record_label: value })}
                    placeholder="Your Record Label"
                  />
                  <InputField
                    label="Release Date"
                    value={metadata.release_date || ''}
                    onChange={(value) => updateMetadata({ release_date: value })}
                    type="date"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Publisher"
                    value={metadata.publisher || ''}
                    onChange={(value) => updateMetadata({ publisher: value })}
                    placeholder="Music Publisher"
                  />
                  <InputField
                    label="ISRC Code"
                    value={metadata.isrc || ''}
                    onChange={(value) => updateMetadata({ isrc: value.toUpperCase() })}
                    placeholder="USABC2500123"
                    maxLength={12}
                  />
                </div>
                
                <InputField
                  label="℗ Line (P Line)"
                  value={metadata.p_line || ''}
                  onChange={(value) => updateMetadata({ p_line: value })}
                  placeholder="℗ 2025 Your Label Name"
                />
                
                <ToggleField
                  label="Contains Explicit Content"
                  description="Mark if this track contains explicit language or content"
                  checked={metadata.explicit}
                  onChange={(checked) => updateMetadata({ explicit: checked })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Album Linking Section */}
      <div>
        <AccordionHeader
          section="album"
          title="Album Linking"
          icon="💿"
          description="Link to existing album or create new one"
        />
        
        <AnimatePresence>
          {openSections.has('album') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-900/30 border-x border-b border-gray-700 rounded-b-lg space-y-4">
                {metadata.album_name && (
                  <div className="bg-accent-yellow/20 border border-accent-yellow/30 rounded-lg p-3">
                    <p className="text-accent-yellow font-medium">
                      Selected Album: {metadata.album_name}
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
                            metadata.album_id === album.id
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
                
                {metadata.album_name && (
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Track Number"
                      value={metadata.track_number?.toString() || ''}
                      onChange={(value) => updateMetadata({ track_number: parseInt(value) || undefined })}
                      placeholder="1"
                      type="number"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual/Video Clips Section */}
      <div>
        <AccordionHeader
          section="visuals"
          title="Visual Clips"
          icon="🎬"
          description="TikTok/Spotify-style short visual clips (20-30 seconds)"
        />
        
        <AnimatePresence>
          {openSections.has('visuals') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-900/30 border-x border-b border-gray-700 rounded-b-lg space-y-4">
                {metadata.visual_clip ? (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 font-medium">Visual clip uploaded</p>
                        <p className="text-sm text-gray-400">
                          Duration: {metadata.visual_clip.duration_sec}s • 
                          Loop: {metadata.visual_clip.loop_enabled ? 'Enabled' : 'Disabled'}
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
                    
                    <div className="mt-4 text-xs text-gray-500">
                      Supported formats: MP4, MOV, AVI • Max 50MB • 20-30 seconds
                    </div>
                  </div>
                )}
                
                {metadata.visual_clip && (
                  <ToggleField
                    label="Loop Playback"
                    description="Automatically loop the visual clip during playback"
                    checked={metadata.visual_clip.loop_enabled}
                    onChange={(checked) => 
                      updateMetadata({ 
                        visual_clip: { 
                          ...metadata.visual_clip!, 
                          loop_enabled: checked 
                        }
                      })
                    }
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Permissions Section */}
      <div>
        <AccordionHeader
          section="permissions"
          title="Permissions & Access"
          icon="🔐"
          description="Control how fans can interact with your content"
        />
        
        <AnimatePresence>
          {openSections.has('permissions') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-900/30 border-x border-b border-gray-700 rounded-b-lg space-y-3">
                <ToggleField
                  label="Enable Direct Downloads"
                  description="Allow listeners to download the original audio file"
                  checked={metadata.enable_direct_downloads}
                  onChange={(checked) => updateMetadata({ enable_direct_downloads: checked })}
                />
                
                <ToggleField
                  label="Offline Listening"
                  description="Allow playback on devices without internet connection"
                  checked={metadata.offline_listening}
                  onChange={(checked) => updateMetadata({ offline_listening: checked })}
                />
                
                <ToggleField
                  label="Include in RSS Feed"
                  description="Include this track in your public RSS feed"
                  checked={metadata.include_in_rss}
                  onChange={(checked) => updateMetadata({ include_in_rss: checked })}
                />
                
                <ToggleField
                  label="Display Embed Code"
                  description="Show an embeddable player code publicly"
                  checked={metadata.display_embed_code}
                  onChange={(checked) => updateMetadata({ display_embed_code: checked })}
                />
                
                <ToggleField
                  label="Enable App Playback"
                  description="Permit playback in external apps and services"
                  checked={metadata.enable_app_playback}
                  onChange={(checked) => updateMetadata({ enable_app_playback: checked })}
                />
                
                <ToggleField
                  label="Allow Comments"
                  description="Permit people to comment on your track"
                  checked={metadata.allow_comments}
                  onChange={(checked) => updateMetadata({ allow_comments: checked })}
                />
                
                <ToggleField
                  label="Show Comments to Public"
                  description="Make existing comments publicly visible"
                  checked={metadata.show_comments_public}
                  onChange={(checked) => updateMetadata({ show_comments_public: checked })}
                />
                
                <ToggleField
                  label="Show Insights to Public"
                  description="Make track statistics and insights publicly visible"
                  checked={metadata.show_insights_public}
                  onChange={(checked) => updateMetadata({ show_insights_public: checked })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Licensing Section */}
      <div>
        <AccordionHeader
          section="licensing"
          title="Licensing"
          icon="📜"
          description="Choose copyright license for your track"
        />
        
        <AnimatePresence>
          {openSections.has('licensing') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-900/30 border-x border-b border-gray-700 rounded-b-lg space-y-3">
                <div className="space-y-3">
                  {[
                    { value: 'all_rights_reserved', label: 'All Rights Reserved', description: 'Traditional full copyright protection' },
                    { value: 'cc_by', label: 'Creative Commons BY', description: 'Attribution required' },
                    { value: 'cc_by_sa', label: 'Creative Commons BY-SA', description: 'Attribution + ShareAlike' },
                    { value: 'cc_by_nc', label: 'Creative Commons BY-NC', description: 'Attribution + Non-Commercial' },
                    { value: 'cc_by_nc_sa', label: 'Creative Commons BY-NC-SA', description: 'Attribution + Non-Commercial + ShareAlike' }
                  ].map((license) => (
                    <button
                      key={license.value}
                      onClick={() => updateMetadata({ license_type: license.value as any })}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        metadata.license_type === license.value
                          ? 'bg-accent-yellow/20 border-accent-yellow text-accent-yellow'
                          : 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium">{license.label}</div>
                      <div className="text-sm text-gray-400">{license.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdvancedMetadataAccordion