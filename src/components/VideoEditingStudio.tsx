import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { videoEditingService, VideoProject, VideoClip, TextOverlay } from '../lib/videoEditingService'
import { useAuth } from '../hooks/useAuth'

interface VideoEditingStudioProps {
  onClose?: () => void
  initialFile?: File
}

const VideoEditingStudio: React.FC<VideoEditingStudioProps> = ({ onClose, initialFile }) => {
  const { user } = useAuth()
  const [project, setProject] = useState<VideoProject | null>(null)
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'clips' | 'filters' | 'text' | 'audio' | 'export'>('clips')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize project
  useEffect(() => {
    const initProject = async () => {
      await videoEditingService.initialize()
      const newProject = videoEditingService.createProject('Untitled Project')
      
      if (initialFile) {
        const clip = await videoEditingService.addClip(newProject, initialFile)
        setSelectedClip(clip)
      }
      
      setProject(newProject)
    }

    initProject()
  }, [initialFile])

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !project) return

    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/')) {
        const clip = await videoEditingService.addClip(project, file)
        setProject({ ...project })
        setSelectedClip(clip)
      }
    }
  }

  // Apply filter to selected clip
  const applyFilter = async (filterType: string, intensity: number = 1) => {
    if (!selectedClip || !project) return

    try {
      const filteredBlob = await videoEditingService.applyFilter(selectedClip, {
        type: filterType as any,
        intensity
      })
      
      // Create preview URL
      const url = URL.createObjectURL(filteredBlob)
      setPreviewUrl(url)
      
      // Update clip with filter
      selectedClip.filters = selectedClip.filters || []
      selectedClip.filters.push({ type: filterType as any, intensity })
      setProject({ ...project })
    } catch (error) {
      console.error('Failed to apply filter:', error)
    }
  }

  // Add text overlay
  const addTextOverlay = (text: string) => {
    if (!project) return

    const textOverlay: TextOverlay = {
      text,
      font: 'Arial',
      size: 48,
      color: '#FFFFFF',
      position: { x: 100, y: 100 },
      animation: 'fadeIn',
      startTime: 0,
      duration: 5
    }

    videoEditingService.addTextOverlay(project, textOverlay)
    setProject({ ...project })
  }

  // Export for social media
  const exportForPlatform = async (platform: 'tiktok' | 'instagram_story' | 'instagram_post' | 'youtube_shorts') => {
    if (!project || !user) return

    setIsRendering(true)
    setRenderProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setRenderProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const blob = await videoEditingService.exportForSocialMedia(project, platform)
      
      clearInterval(progressInterval)
      setRenderProgress(100)

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `buckets_${platform}_${Date.now()}.mp4`
      a.click()

      // Save project
      await videoEditingService.saveProject(project, user.id)
      
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsRendering(false)
      setRenderProgress(0)
    }
  }

  const filters = [
    { name: 'Original', type: 'none' },
    { name: 'Vintage', type: 'vintage' },
    { name: 'Cinematic', type: 'cinematic' },
    { name: 'Glow', type: 'glow' },
    { name: 'Blur', type: 'blur' },
    { name: 'Color Pop', type: 'color' }
  ]

  const socialPlatforms = [
    { name: 'TikTok', key: 'tiktok' as const, icon: '📱', aspect: '9:16' },
    { name: 'IG Story', key: 'instagram_story' as const, icon: '📸', aspect: '9:16' },
    { name: 'IG Post', key: 'instagram_post' as const, icon: '🖼️', aspect: '1:1' },
    { name: 'YouTube Shorts', key: 'youtube_shorts' as const, icon: '🎬', aspect: '9:16' }
  ]

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Loading Video Studio...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">🎬 Buckets Video Studio</h1>
          <input
            type="text"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white"
          />
        </div>
        <div className="flex items-center space-x-3">
          {isRendering && (
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-accent-yellow h-2 rounded-full transition-all duration-500"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <span className="text-sm">{renderProgress}%</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {[
              { key: 'clips' as const, label: '🎬 Clips', icon: '🎬' },
              { key: 'filters' as const, label: '✨ Filters', icon: '✨' },
              { key: 'text' as const, label: '📝 Text', icon: '📝' },
              { key: 'audio' as const, label: '🎵 Audio', icon: '🎵' },
              { key: 'export' as const, label: '📤 Export', icon: '📤' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key 
                    ? 'bg-accent-yellow text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'clips' && (
                <motion.div key="clips" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="font-semibold mb-4">Video Clips</h3>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-accent-yellow text-black py-3 rounded-lg font-medium mb-4 hover:bg-yellow-500 transition-colors"
                  >
                    + Add Video Clip
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />

                  <div className="space-y-2">
                    {project.clips.map((clip, index) => (
                      <div
                        key={clip.id}
                        onClick={() => setSelectedClip(clip)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedClip?.id === clip.id 
                            ? 'bg-accent-yellow text-black' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium">Clip {index + 1}</div>
                        <div className="text-sm opacity-70">
                          {Math.round(clip.duration)}s
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'filters' && (
                <motion.div key="filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="font-semibold mb-4">Video Filters</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {filters.map(filter => (
                      <button
                        key={filter.type}
                        onClick={() => filter.type !== 'none' && applyFilter(filter.type)}
                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-center"
                        disabled={!selectedClip}
                      >
                        <div className="font-medium">{filter.name}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'text' && (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="font-semibold mb-4">Text Overlays</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          addTextOverlay(e.currentTarget.value.trim())
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    
                    <div className="space-y-2">
                      {project.text?.map((text, index) => (
                        <div key={index} className="p-3 bg-gray-700 rounded-lg">
                          <div className="font-medium">{text.text}</div>
                          <div className="text-sm text-gray-400">
                            {text.startTime}s - {text.startTime + text.duration}s
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'export' && (
                <motion.div key="export" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="font-semibold mb-4">Export for Social Media</h3>
                  <div className="space-y-3">
                    {socialPlatforms.map(platform => (
                      <button
                        key={platform.key}
                        onClick={() => exportForPlatform(platform.key)}
                        disabled={isRendering || project.clips.length === 0}
                        className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{platform.icon}</span>
                          <div>
                            <div className="font-medium">{platform.name}</div>
                            <div className="text-sm text-gray-400">{platform.aspect}</div>
                          </div>
                        </div>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg">
                    <h4 className="font-medium text-accent-yellow mb-2">🎯 Buckets Advantage</h4>
                    <ul className="text-sm space-y-1 text-gray-300">
                      <li>• Automatic Buckets watermark</li>
                      <li>• Optimized for each platform</li>
                      <li>• Original file preserved</li>
                      <li>• Analytics tracking</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          <div className="w-full max-w-2xl">
            {selectedClip ? (
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  key={previewUrl || selectedClip.id}
                  src={previewUrl || URL.createObjectURL(selectedClip.file)}
                  controls
                  className="w-full h-auto"
                  style={{ maxHeight: '60vh' }}
                />
                
                <div className="p-4 bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Clip Preview</h3>
                      <p className="text-sm text-gray-400">
                        Duration: {Math.round(selectedClip.duration)}s
                      </p>
                    </div>
                    <div className="text-sm text-accent-yellow">
                      {selectedClip.filters?.length || 0} filters applied
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold mb-2">Select a clip to preview</h3>
                <p className="text-gray-400">Add video clips to start editing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoEditingStudio