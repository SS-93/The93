import React, { useState } from 'react'
import BucketTemplateUI from '../components/BucketTemplateUI'

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

// Mock data for demonstration
const mockContentItems: ContentItem[] = [
  {
    id: '1',
    name: "IT'S UP - DRAKE.MP3",
    type: 'audio',
    size: '11MB',
    uploadDate: '2024-08-06T07:04:00Z',
    downloadUrl: '/demo-audio.mp3',
    isLocked: false,
    metadata: { duration: '3:45', artist: 'Drake', album: 'New Singles' }
  },
  {
    id: '2',
    name: "BLUE GREEN RED - DRAKE.MP3",
    type: 'audio',
    size: '9MB',
    uploadDate: '2024-08-02T06:42:00Z',
    downloadUrl: '/demo-audio-2.mp3',
    isLocked: true,
    metadata: { duration: '4:12', artist: 'Drake', album: 'New Singles' }
  },
  {
    id: '3',
    name: "HOUSEKEEPING KNOWS - DRAKE.MP3",
    type: 'audio',
    size: '8MB',
    uploadDate: '2024-08-06T07:04:00Z',
    downloadUrl: '/demo-audio-3.mp3',
    isLocked: false,
    metadata: { duration: '3:28', artist: 'Drake', album: 'New Singles' }
  },
  {
    id: '4',
    name: '2_SOTA',
    type: 'folder',
    size: '1GB',
    uploadDate: '2024-07-03T09:17:00Z',
    children: [
      {
        id: '4-1',
        name: 'MIAMI_STORM.MP3',
        type: 'audio',
        size: '565MB',
        uploadDate: '2024-07-03T09:03:00Z',
        downloadUrl: '/demo-audio-4.mp3',
        isLocked: false,
        metadata: { duration: '5:23' }
      }
    ]
  },
  {
    id: '5',
    name: '40_KEYS',
    type: 'folder',
    size: '3GB',
    uploadDate: '2024-08-05T06:34:00Z',
    children: []
  }
]

const BucketDemo: React.FC = () => {
  const [userRole, setUserRole] = useState<'artist' | 'fan'>('fan')
  const [contentItems, setContentItems] = useState<ContentItem[]>(mockContentItems)
  const [loading, setLoading] = useState(false)

  const handleUpload = (files: File[], metadata: any) => {
    console.log('Upload triggered:', { files, metadata })
    setLoading(true)
    
    // Simulate upload processing
    setTimeout(() => {
      const newItems: ContentItem[] = files.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        name: file.name,
        type: file.type.startsWith('audio/') ? 'audio' : 
              file.type.startsWith('image/') ? 'image' : 'document',
        size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        uploadDate: new Date().toISOString(),
        downloadUrl: URL.createObjectURL(file),
        isLocked: !metadata.isPublic,
        metadata: {
          duration: file.type.startsWith('audio/') ? '3:45' : undefined,
          artist: 'You',
          album: metadata.album || undefined
        }
      }))
      
      setContentItems(prev => [...newItems, ...prev])
      setLoading(false)
    }, 2000)
  }

  const handleDownload = (item: ContentItem) => {
    console.log('Download triggered:', item)
    // In real app, this would trigger actual download
    alert(`Downloading: ${item.name}`)
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Demo Controls */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-white">Bucket Template Demo</h1>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-300">View as:</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as 'artist' | 'fan')}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="fan">Fan</option>
              <option value="artist">Artist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bucket UI */}
      <BucketTemplateUI
        userRole={userRole}
        artistName="Drake"
        contentItems={contentItems}
        onUpload={handleUpload}
        onDownload={handleDownload}
        loading={loading}
      />
    </div>
  )
}

export default BucketDemo 