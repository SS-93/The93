import React, { useState, useEffect } from 'react'
import { audioIntelligenceService } from '../lib/audioIntelligence'
import { supabase } from '../lib/supabaseClient'
import ArtistUploadManager from './ArtistUploadManager'
import { useAudioPlayer } from '../context/AudioPlayerContext'
import { ffmpegAudioService } from '../lib/ffmpegService'
import FFmpegAudioService from '../lib/ffmpegService'
import { displaySupportInfo } from '../utils/ffmpegTest'
import { hybridAudioService } from '../lib/hybridAudioService'
import GlobalAudioPlayer from './player/GlobalAudioPlayer'

interface ProcessingStats {
  queued: number
  running: number
  completed: number
  failed: number
}

interface ContentWithIntelligence {
  id: string
  title: string
  processing_status: string
  audio_features?: {
    bpm?: number
    key?: string
    mode?: string
    energy?: number
    valence?: number
    danceability?: number
    loudness?: number
    confidence?: number
    source?: string
  }
  mood_tags?: {
    tags: string[]
    confidence: number
    derived_from?: {
      audio: boolean
      lyrics: boolean
      engagement: boolean
    }
    rationale?: string[]
  }
}

const AudioProcessingDashboard: React.FC = () => {
  const [stats, setStats] = useState<ProcessingStats>({ queued: 0, running: 0, completed: 0, failed: 0 })
  const [content, setContent] = useState<ContentWithIntelligence[]>([])
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [recentlyUploadedItems, setRecentlyUploadedItems] = useState<Set<string>>(new Set())
  
  // Audio player hook
  const { playTrack, addToQueue } = useAudioPlayer()

  const fetchStats = async () => {
    const queueStats = await audioIntelligenceService.getQueueStatus()
    setStats(queueStats)
  }

    const fetchContent = async () => {
    console.log('🔍 Fetching content from database...')
    const { data, error } = await supabase
      .from('content_items')
      .select(`
        id,
        title,
        processing_status,
        audio_features (bpm, key, mode, energy, valence, danceability, loudness, confidence, source),
        mood_tags (tags, confidence, derived_from, rationale)
      `)
      .eq('content_type', 'audio')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching content:', error)
      return
    }

    if (data) {
      console.log(`📦 Fetched ${data.length} content items from database`)
      console.log('🔍 Raw query data:', data)
      
      // Log the first item to see join structure
      if (data.length > 0) {
        console.log('🔬 First item raw:', data[0])
        console.log('🔬 First item audio_features:', data[0].audio_features)
        console.log('🔬 First item mood_tags:', data[0].mood_tags)
      }
      
      // Transform the data - Supabase returns objects directly for 1:1 relationships
      const transformedData = data.map(item => ({
        ...item,
        audio_features: item.audio_features && typeof item.audio_features === 'object' && !Array.isArray(item.audio_features)
          ? item.audio_features 
          : Array.isArray(item.audio_features) && item.audio_features.length > 0 
          ? item.audio_features[0] 
          : undefined,
        mood_tags: item.mood_tags && typeof item.mood_tags === 'object' && !Array.isArray(item.mood_tags)
          ? item.mood_tags 
          : Array.isArray(item.mood_tags) && item.mood_tags.length > 0 
          ? item.mood_tags[0] 
          : undefined
      })) as ContentWithIntelligence[]

      console.log('📋 Transformed data:', transformedData.map(item => ({
        id: item.id,
        title: item.title,
        status: item.processing_status,
        hasFeatures: !!item.audio_features,
        hasMoodTags: !!item.mood_tags,
        rawFeatures: item.audio_features,
        rawMoodTags: item.mood_tags
      })))

      setContent(transformedData)
      console.log('✅ Content state updated')
    }
  }

  const processQueue = async () => {
    setProcessing(true)
    try {
      await audioIntelligenceService.processQueuedJobs(5)
      await fetchStats()
      await fetchContent()
    } catch (error) {
      console.error('Failed to process queue:', error)
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchStats(), fetchContent()])
      setLoading(false)
    }
    loadData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchStats()
      fetchContent()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'queued': return 'text-yellow-400'
      case 'running': return 'text-blue-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const formatBPM = (bpm?: number) => {
    return bpm ? `${Math.round(bpm)} BPM` : 'N/A'
  }

  const formatKey = (key?: string, mode?: string) => {
    if (!key) return 'N/A'
    return mode ? `${key} ${mode}` : key
  }

  const formatPercentage = (value?: number) => {
    return value !== undefined ? `${Math.round(value * 100)}%` : 'N/A'
  }

  const convertToTrack = async (item: ContentWithIntelligence) => {
    // Get signed URL for the audio file
    const { data: signedUrlData } = await supabase.storage
      .from('artist-content')
      .createSignedUrl(item.id + '.mp3', 3600) // Assuming mp3 files, adjust as needed

    return {
      id: item.id,
      title: item.title,
      artist: 'Unknown Artist', // You might want to fetch this from the database
      artistId: 'unknown',
      audioUrl: signedUrlData?.signedUrl || '',
      audioFeatures: item.audio_features ? {
        bpm: item.audio_features.bpm,
        key: item.audio_features.key,
        mode: item.audio_features.mode,
        energy: item.audio_features.energy,
        valence: item.audio_features.valence,
        danceability: item.audio_features.danceability
      } : undefined,
      moodTags: item.mood_tags ? {
        tags: item.mood_tags.tags,
        confidence: item.mood_tags.confidence
      } : undefined
    }
  }

  const handlePlayTrack = async (item: ContentWithIntelligence) => {
    try {
      const track = await convertToTrack(item)
      if (track.audioUrl) {
        playTrack(track)
        
        // Add other tracks to queue
        const otherItems = content.filter(c => c.id !== item.id)
        const queueTracks = await Promise.all(otherItems.map(convertToTrack))
        const validQueueTracks = queueTracks.filter(t => t.audioUrl)
        addToQueue(validQueueTracks)
      }
    } catch (error) {
      console.error('Error playing track:', error)
    }
  }

  const generateWaveform = async (item: ContentWithIntelligence) => {
    try {
      // Check browser support first
      if (!FFmpegAudioService.isSupported()) {
        alert('❌ FFmpeg not supported: This browser needs Cross-Origin Isolation. Please run: npm run start:ffmpeg')
        return
      }
      
      console.log('🌊 Generating waveform for:', item.title)
      
      // Get the audio file from Supabase Storage
      const { data: fileData } = await supabase.storage
        .from('artist-content')
        .download(item.id + '.mp3') // Assuming mp3 files
      
      if (!fileData) {
        throw new Error('Failed to download audio file')
      }

      // Convert blob to File
      const audioFile = new File([fileData], `${item.title}.mp3`, { type: 'audio/mp3' })
      
      // Generate waveform
      const waveformData = await ffmpegAudioService.generateWaveform(audioFile, {
        width: 800,
        height: 100,
        samples: 200,
        color: '#f59e0b'
      })

      console.log('✅ Waveform generated:', waveformData)
      
      // You could save this waveform data to the database here
      // For now, we'll just log it
      alert(`Waveform generated! Duration: ${waveformData.duration.toFixed(2)}s, Peaks: ${waveformData.peaks.length}`)
      
    } catch (error) {
      console.error('❌ Error generating waveform:', error)
      alert('Failed to generate waveform. Make sure FFmpeg is supported in your browser.')
    }
  }

  const analyzeAudioWithFFmpeg = async (item: ContentWithIntelligence) => {
    try {
      // Check browser support first
      if (!FFmpegAudioService.isSupported()) {
        alert('❌ FFmpeg not supported: This browser needs Cross-Origin Isolation. Please run: npm run start:ffmpeg')
        return
      }
      
      console.log('🔍 Analyzing audio with FFmpeg:', item.title)
      
      // Get the audio file from Supabase Storage
      const { data: fileData } = await supabase.storage
        .from('artist-content')
        .download(item.id + '.mp3')
      
      if (!fileData) {
        throw new Error('Failed to download audio file')
      }

      // Convert blob to File
      const audioFile = new File([fileData], `${item.title}.mp3`, { type: 'audio/mp3' })
      
      // Analyze audio
      const analysis = await ffmpegAudioService.analyzeAudio(audioFile)

      console.log('✅ Audio analysis completed:', analysis)
      
      // Display results
      alert(`Audio Analysis Results:
Duration: ${analysis.duration.toFixed(2)}s
Channels: ${analysis.channels}
Sample Rate: ${analysis.sampleRate}Hz
RMS Level: ${(analysis.rms * 100).toFixed(1)}%
Peaks: ${analysis.peaks.length} samples`)
      
    } catch (error) {
      console.error('❌ Error analyzing audio:', error)
      alert('Failed to analyze audio. Make sure FFmpeg is supported in your browser.')
    }
  }

  const processWithHybridService = async (item: ContentWithIntelligence, mode: 'client' | 'server' | 'hybrid' = 'hybrid') => {
    try {
      console.log(`🔄 Processing with hybrid service (${mode}):`, item.title)
      
      // Get the audio file from Supabase Storage
      const { data: fileData } = await supabase.storage
        .from('artist-content')
        .download(item.id + '.mp3')
      
      if (!fileData) {
        throw new Error('Failed to download audio file')
      }

      // Convert blob to File
      const audioFile = new File([fileData], `${item.title}.mp3`, { type: 'audio/mp3' })
      
      // Process with hybrid service
      const result = await hybridAudioService.processAudio(audioFile, item.id, {
        preferClient: mode === 'client',
        preferServer: mode === 'server',
        quality: 'standard',
        realTime: mode === 'client'
      })

      console.log('✅ Hybrid processing completed:', result)
      
      // Display comprehensive results
      const resultText = `🎵 Hybrid Audio Processing Results
      
🔧 Processing Method: ${result.source.toUpperCase()}
⏱️ Processing Time: ${result.processingTime}ms

${result.waveform ? `🌊 Waveform:
• Duration: ${result.waveform.duration.toFixed(2)}s
• Sample Rate: ${result.waveform.sampleRate}Hz
• Peaks: ${result.waveform.peaks.length} samples
` : ''}
${result.analysis ? `🔍 Audio Analysis:
• Channels: ${result.analysis.channels}
• Sample Rate: ${result.analysis.sampleRate}Hz
• Format: ${result.analysis.format}
• RMS Level: ${(result.analysis.rms * 100).toFixed(1)}%
` : ''}
${result.features ? `🎶 Audio Features:
• BPM: ${result.features.bpm}
• Key: ${result.features.key} ${result.features.mode}
• Energy: ${((result.features.energy || 0) * 100).toFixed(1)}%
• Valence: ${((result.features.valence || 0) * 100).toFixed(1)}%
• Confidence: ${((result.features.confidence || 0) * 100).toFixed(1)}%
` : ''}`

      alert(resultText)
      
    } catch (error) {
      console.error('❌ Error with hybrid processing:', error)
      alert(`Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const debugContentItem = async (contentId: string, title: string) => {
    console.log(`🔍 Debugging content item: ${title} (${contentId})`)
    
    try {
      // First, check the content_items table
      const { data: contentData, error: contentError } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', contentId)
        .single()

      console.log('📋 Content Item:', contentData)
      if (contentError) console.error('❌ Content Error:', contentError)

      // Check audio_features table directly
      const { data: featuresData, error: featuresError } = await supabase
        .from('audio_features')
        .select('*')
        .eq('content_id', contentId)

      console.log('🎼 Audio Features:', featuresData)
      console.log('🎼 Features Details:', featuresData?.[0])
      if (featuresError) console.error('❌ Features Error:', featuresError)

      // Check mood_tags table directly
      const { data: moodData, error: moodError } = await supabase
        .from('mood_tags')
        .select('*')
        .eq('content_id', contentId)

      console.log('🎭 Mood Tags:', moodData)
      console.log('🎭 Mood Details:', moodData?.[0])
      if (moodError) console.error('❌ Mood Error:', moodError)

      // Check processing jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('audio_processing_jobs')
        .select('*')
        .eq('content_id', contentId)

      console.log('⚙️ Processing Jobs:', jobsData)
      if (jobsError) console.error('❌ Jobs Error:', jobsError)

    } catch (error) {
      console.error('🚨 Debug error:', error)
    }
  }

  const deleteContent = async (contentId: string, title: string) => {
    // Use window.confirm to avoid linting issues
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      console.log(`🗑️ Deleting content: ${title} (${contentId})`)
      
      // Delete from content_items table (this will cascade to related tables)
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', contentId)

      if (error) {
        console.error('Delete error:', error)
        alert(`Failed to delete file: ${error.message}`)
        return
      }

      console.log(`✅ Successfully deleted: ${title}`)
      
      // Remove from local state
      setContent(prev => prev.filter(item => item.id !== contentId))
      setExpandedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(contentId)
        return newSet
      })
      setRecentlyUploadedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(contentId)
        return newSet
      })
      
      // Refresh stats
      await fetchStats()
      
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const getDetailsButtonState = (item: ContentWithIntelligence) => {
    const hasData = item.audio_features || item.mood_tags
    const isProcessing = item.processing_status === 'queued' || item.processing_status === 'running'
    const isRecentUpload = recentlyUploadedItems.has(item.id)
    
    return {
      isDisabled: !hasData && !isRecentUpload,
      isProcessing: isProcessing,
      showButton: isRecentUpload || hasData,
      buttonText: isProcessing ? 'Processing...' : hasData ? 'Details' : 'Waiting...',
      buttonStyle: hasData 
        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 border-blue-500/30' 
        : isProcessing
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 cursor-wait'
        : 'bg-gray-500/20 text-gray-500 border-gray-500/30 cursor-not-allowed'
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">🎵 Audio Processing Dashboard</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            📊 Stats
          </button>
          <button
            onClick={() => {
              console.log('🔄 Force refreshing content and stats...')
              fetchContent()
              fetchStats()
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 transition-colors"
          >
            🔄 Refresh All
          </button>
          <button
            onClick={async () => {
              console.log('🔍 Running comprehensive database debug...')
              
              // Check total records in each table
              const { count: contentCount } = await supabase
                .from('content_items')
                .select('*', { count: 'exact', head: true })
                .eq('content_type', 'audio')
              
              const { count: featuresCount } = await supabase
                .from('audio_features')
                .select('*', { count: 'exact', head: true })
              
              const { count: moodCount } = await supabase
                .from('mood_tags')
                .select('*', { count: 'exact', head: true })
              
              console.log(`📊 Database counts:`)
              console.log(`   Content items (audio): ${contentCount}`)
              console.log(`   Audio features: ${featuresCount}`)
              console.log(`   Mood tags: ${moodCount}`)
              
              // Test the exact query we use in fetchContent
              const { data: testData, error: testError } = await supabase
                .from('content_items')
                .select(`
                  id,
                  title,
                  processing_status,
                  audio_features (bpm, key, mode, energy, valence, danceability, loudness, confidence, source),
                  mood_tags (tags, confidence, derived_from, rationale)
                `)
                .eq('content_type', 'audio')
                .order('created_at', { ascending: false })
                .limit(3)
              
              console.log('🧪 Test query result:', testData)
              if (testError) console.error('❌ Test query error:', testError)
            }}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500 transition-colors"
          >
            🔍 Debug DB
          </button>
          <button
            onClick={() => displaySupportInfo()}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 transition-colors"
          >
            🔍 Check FFmpeg
          </button>
          <button
            onClick={async () => {
              const capabilities = hybridAudioService.getCapabilities()
              const clientAvailable = await hybridAudioService.canProcessClientSide()
              const serverAvailable = await hybridAudioService.canProcessServerSide()
              
              const info = `🔧 Hybrid Audio Service Capabilities

📱 Client-Side Processing:
• Available: ${clientAvailable ? '✅ Yes' : '❌ No'}
• Features: ${capabilities.client.features.join(', ')}
• Limitations: ${capabilities.client.limitations.join(', ')}

☁️ Server-Side Processing:
• Available: ${serverAvailable ? '✅ Yes' : '❌ No'}
• Features: ${capabilities.server.features.join(', ')}
• Limitations: ${capabilities.server.limitations.join(', ')}

🎯 Recommended Strategy: ${capabilities.recommended.toUpperCase()}

💡 This hybrid approach follows industry standards used by Spotify, SoundCloud, and other major platforms.`

              alert(info)
            }}
            className="px-3 py-1 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded text-sm hover:from-green-500 hover:to-blue-500 transition-colors"
          >
            🔧 Capabilities
          </button>
          <button
            onClick={async () => {
              try {
                // Check browser support first
                if (!FFmpegAudioService.isSupported()) {
                  alert('❌ FFmpeg not supported: This browser needs Cross-Origin Isolation (COOP/COEP headers) and SharedArrayBuffer support. Try using: npm run start:ffmpeg')
                  return
                }
                
                console.log('🎬 Initializing FFmpeg...')
                await ffmpegAudioService.initialize()
                alert('✅ FFmpeg initialized successfully! You can now use waveform generation and audio analysis.')
              } catch (error) {
                console.error('❌ FFmpeg initialization failed:', error)
                alert(`❌ FFmpeg initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure you're using a modern browser with Cross-Origin Isolation enabled.`)
              }
            }}
            className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-500 transition-colors"
          >
            🎬 Init FFmpeg
          </button>
          <button
            onClick={async () => {
              console.log('🧪 Testing different query approaches...')
              
              // Test 1: Simple join approach
              const { data: test1, error: error1 } = await supabase
                .from('content_items')
                .select(`
                  id,
                  title,
                  processing_status,
                  audio_features!inner(bpm, key, mode, energy, confidence),
                  mood_tags!inner(tags, confidence)
                `)
                .eq('content_type', 'audio')
                .limit(1)
              
              console.log('🧪 Test 1 (inner join):', test1)
              if (error1) console.error('❌ Test 1 error:', error1)
              
              // Test 2: Left join approach
              const { data: test2, error: error2 } = await supabase
                .from('content_items')
                .select(`
                  id,
                  title,
                  processing_status,
                  audio_features(bpm, key, mode, energy, confidence),
                  mood_tags(tags, confidence)
                `)
                .eq('content_type', 'audio')
                .limit(1)
              
              console.log('🧪 Test 2 (left join):', test2)
              if (error2) console.error('❌ Test 2 error:', error2)
              
              // Test 3: Manual join approach
              const { data: contentItems } = await supabase
                .from('content_items')
                .select('id, title, processing_status')
                .eq('content_type', 'audio')
                .limit(1)
              
              if (contentItems && contentItems.length > 0) {
                const contentId = contentItems[0].id
                
                const { data: features } = await supabase
                  .from('audio_features')
                  .select('*')
                  .eq('content_id', contentId)
                
                const { data: moods } = await supabase
                  .from('mood_tags')
                  .select('*')
                  .eq('content_id', contentId)
                
                console.log('🧪 Test 3 (manual):', {
                  content: contentItems[0],
                  features: features,
                  moods: moods
                })
              }
            }}
            className="px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-500 transition-colors"
          >
            🧪 Test Queries
          </button>
          <button
            onClick={processQueue}
            disabled={processing || stats.queued === 0}
            className="px-4 py-2 bg-accent-yellow text-black rounded font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : `Process Queue (${stats.queued})`}
          </button>
          {/* Circular Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-10 h-10 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-green-500/25"
            title="Upload new audio files"
          >
            +
          </button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.queued}</div>
          <div className="text-sm text-gray-400">Queued</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.running}</div>
          <div className="text-sm text-gray-400">Running</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
          <div className="text-sm text-gray-400">Failed</div>
        </div>
      </div>

      {/* Recent Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Audio Content</h3>
          <div className="text-sm text-gray-400">
            {content.length} items • Expanded: {expandedItems.size} • Recent: {recentlyUploadedItems.size}
          </div>
        </div>
        <div className="space-y-4">
          {content.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              <div className="text-4xl mb-4">🎵</div>
              <p className="text-lg mb-2">No audio content found</p>
              <p className="text-sm">Upload some audio files to see them here with AI analysis!</p>
            </div>
          ) : (
            content.map((item) => {
              const isExpanded = expandedItems.has(item.id)
              const hasAudioFeatures = item.audio_features && Object.keys(item.audio_features).some(key => item.audio_features![key as keyof typeof item.audio_features] !== undefined)
              const hasMoodTags = item.mood_tags && item.mood_tags.tags.length > 0
              const buttonState = getDetailsButtonState(item)

              return (
                <div key={item.id} className="bg-gray-800/30 rounded-lg border border-gray-700/50 overflow-hidden">
                  {/* Header Section */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-bold text-white text-lg">{item.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.processing_status)} bg-current bg-opacity-20`}>
                              {item.processing_status.charAt(0).toUpperCase() + item.processing_status.slice(1)}
                            </span>
                            {(hasAudioFeatures || hasMoodTags) && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                ✨ AI Analyzed
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            {/* Play Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePlayTrack(item)
                              }}
                              className="px-2 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 transition-colors rounded-lg border border-green-500/30 text-sm font-medium flex items-center space-x-1 group"
                              title={`Play ${item.title}`}
                            >
                              <span className="group-hover:animate-pulse">▶️</span>
                              <span className="hidden group-hover:inline">Play</span>
                            </button>
                            
                            {/* Waveform Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                generateWaveform(item)
                              }}
                              className="px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-colors rounded-lg border border-blue-500/30 text-sm font-medium flex items-center space-x-1 group"
                              title={`Generate waveform for ${item.title}`}
                            >
                              <span className="group-hover:animate-pulse">🌊</span>
                              <span className="hidden group-hover:inline">Wave</span>
                            </button>
                            
                            {/* FFmpeg Analysis Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                analyzeAudioWithFFmpeg(item)
                              }}
                              className="px-2 py-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 hover:text-orange-300 transition-colors rounded-lg border border-orange-500/30 text-sm font-medium flex items-center space-x-1 group"
                              title={`Analyze audio with FFmpeg: ${item.title}`}
                            >
                              <span className="group-hover:animate-pulse">🎬</span>
                              <span className="hidden group-hover:inline">FFmpeg</span>
                            </button>
                            
                            {/* Hybrid Processing Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                processWithHybridService(item, 'hybrid')
                              }}
                              className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 hover:from-blue-500/30 hover:to-purple-500/30 hover:text-blue-300 transition-colors rounded-lg border border-blue-500/30 text-sm font-medium flex items-center space-x-1 group"
                              title={`Process with Hybrid Service: ${item.title}`}
                            >
                              <span className="group-hover:animate-pulse">🔄</span>
                              <span className="hidden group-hover:inline">Hybrid</span>
                            </button>
                            
                            {/* Debug Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                debugContentItem(item.id, item.title)
                              }}
                              className="px-2 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 transition-colors rounded-lg border border-purple-500/30 text-sm font-medium flex items-center space-x-1 group"
                              title={`Debug ${item.title}`}
                            >
                              <span className="group-hover:animate-pulse">🔍</span>
                              <span className="hidden group-hover:inline">Debug</span>
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteContent(item.id, item.title)
                              }}
                              className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors rounded-lg border border-red-500/30 text-sm font-medium flex items-center space-x-1 group"
                              title={`Delete ${item.title}`}
                            >
                              <span className="group-hover:animate-pulse">🗑️</span>
                              <span className="hidden group-hover:inline">Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Summary */}
                        {(hasAudioFeatures || hasMoodTags) && (
                          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-300">
                            {item.audio_features?.bpm && (
                              <div className="flex items-center space-x-1">
                                <span className="text-blue-400">♪</span>
                                <span>{formatBPM(item.audio_features.bpm)}</span>
                              </div>
                            )}
                            {item.audio_features?.key && (
                              <div className="flex items-center space-x-1">
                                <span className="text-purple-400">♫</span>
                                <span>{formatKey(item.audio_features.key, item.audio_features.mode)}</span>
                              </div>
                            )}
                            {item.audio_features?.energy !== undefined && (
                              <div className="flex items-center space-x-1">
                                <span className="text-orange-400">⚡</span>
                                <span>{formatPercentage(item.audio_features.energy)} Energy</span>
                              </div>
                            )}
                            {hasMoodTags && (
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-400">🎭</span>
                                <span>{item.mood_tags!.tags.slice(0, 2).join(', ')}{item.mood_tags!.tags.length > 2 ? '...' : ''}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mood Tags Preview */}
                        {hasMoodTags && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.mood_tags!.tags.slice(0, isExpanded ? item.mood_tags!.tags.length : 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-accent-yellow/20 text-accent-yellow text-xs rounded-full border border-accent-yellow/30"
                              >
                                {tag}
                              </span>
                            ))}
                            {!isExpanded && item.mood_tags!.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-600/50 text-gray-400 text-xs rounded-full">
                                +{item.mood_tags!.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expand/Collapse Button */}
                      {buttonState.showButton && (
                        <button
                          onClick={() => !buttonState.isDisabled && toggleItemExpansion(item.id)}
                          disabled={buttonState.isDisabled}
                          className={`ml-4 px-3 py-1 transition-colors rounded-lg border text-sm font-medium flex items-center space-x-1 ${buttonState.buttonStyle}`}
                          title={buttonState.isDisabled ? 'Processing in progress' : isExpanded ? 'Hide details' : 'Show details'}
                        >
                          <span>
                            {buttonState.isProcessing ? '⏳' : (isExpanded ? '🔼' : '🔽')}
                          </span>
                          <span>
                            {buttonState.isProcessing 
                              ? buttonState.buttonText
                              : isExpanded 
                              ? 'Hide Details' 
                              : 'Show Details'
                            }
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Always visible Details button - positioned below the main content */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm">
                        <button
                          onClick={() => !buttonState.isDisabled && toggleItemExpansion(item.id)}
                          disabled={buttonState.isDisabled}
                          className={`flex items-center space-x-1 font-medium transition-colors rounded px-2 py-1 hover:bg-blue-500/10 ${
                            buttonState.isDisabled 
                              ? 'text-gray-500 cursor-not-allowed' 
                              : 'text-blue-400 hover:text-blue-300 cursor-pointer'
                          }`}
                          title={buttonState.isDisabled ? 'Processing in progress' : isExpanded ? 'Hide details' : 'Show details'}
                        >
                          <span>📋</span>
                          <span>Details</span>
                          <span className="text-xs ml-1">
                            {isExpanded ? '🔼' : '🔽'}
                          </span>
                        </button>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">
                          {buttonState.isProcessing 
                            ? 'Processing analysis...'
                            : (hasAudioFeatures || hasMoodTags)
                            ? 'AI analysis available'
                            : 'No analysis data'
                          }
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex items-center space-x-1">
                        {buttonState.isProcessing && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        )}
                        {(hasAudioFeatures || hasMoodTags) && !buttonState.isProcessing && (
                          <span className="text-green-400 text-xs">✓ Ready</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Extended AI Analysis Display Window */}
                  {isExpanded && (
                    <div className="border-t border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/60 animate-in slide-in-from-top duration-300">
                      <div className="p-8 space-y-8">
                        {/* Header with AI Analysis Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <span className="text-2xl">🤖</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">AI Audio Intelligence Report</h3>
                              <p className="text-gray-400">Comprehensive analysis results for {item.title}</p>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                            ✓ Analysis Complete
                          </div>
                        </div>

                        {/* Audio Features Professional Analysis */}
                        {hasAudioFeatures && item.audio_features && (
                          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 rounded-xl p-6 border border-blue-500/30">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-xl font-bold text-white flex items-center">
                                <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">🎼</span>
                                Audio Features Analysis
                              </h4>
                              <div className="text-sm text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">
                                Source: {item.audio_features.source || 'AI Engine'}
                              </div>
                            </div>

                            {/* Primary Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              {/* Tempo Card */}
                              <div className="bg-gray-800/50 rounded-xl p-6 border border-blue-400/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-6 translate-x-6"></div>
                                <div className="relative">
                                  <div className="text-sm font-semibold text-blue-300 mb-2">🎵 TEMPO</div>
                                  <div className="text-4xl font-black text-blue-400 mb-1">{Math.round(item.audio_features.bpm || 0)}</div>
                                  <div className="text-xs text-gray-400">Beats per minute</div>
                                  <div className="mt-3 text-xs text-blue-300">
                                    {(item.audio_features.bpm || 0) < 80 ? '🐌 Slow' : 
                                     (item.audio_features.bpm || 0) < 120 ? '🚶 Moderate' : 
                                     (item.audio_features.bpm || 0) < 140 ? '🏃 Fast' : '⚡ Very Fast'}
                                  </div>
                                </div>
                              </div>

                              {/* Key Card */}
                              <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-400/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-6 translate-x-6"></div>
                                <div className="relative">
                                  <div className="text-sm font-semibold text-purple-300 mb-2">🎹 MUSICAL KEY</div>
                                  <div className="text-4xl font-black text-purple-400 mb-1">{item.audio_features.key || 'N/A'}</div>
                                  <div className="text-xs text-gray-400">{item.audio_features.mode || 'Unknown'} mode</div>
                                  <div className="mt-3 text-xs text-purple-300">
                                    {item.audio_features.mode === 'major' ? '😊 Bright' : 
                                     item.audio_features.mode === 'minor' ? '😔 Dark' : '🎭 Unknown'}
                                  </div>
                                </div>
                              </div>

                              {/* Energy Card */}
                              <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-400/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -translate-y-6 translate-x-6"></div>
                                <div className="relative">
                                  <div className="text-sm font-semibold text-orange-300 mb-2">⚡ ENERGY LEVEL</div>
                                  <div className="text-4xl font-black text-orange-400 mb-1">{Math.round((item.audio_features.energy || 0) * 100)}%</div>
                                  <div className="text-xs text-gray-400">Audio intensity</div>
                                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                                    <div 
                                      className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${(item.audio_features.energy || 0) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Secondary Metrics */}
                            {(item.audio_features.valence !== undefined || item.audio_features.danceability !== undefined || item.audio_features.confidence !== undefined) && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {item.audio_features.valence !== undefined && (
                                  <div className="bg-gray-800/30 rounded-lg p-4 border border-pink-400/20">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-medium text-pink-300">Valence</div>
                                        <div className="text-2xl font-bold text-pink-400">{Math.round((item.audio_features.valence || 0) * 100)}%</div>
                                      </div>
                                      <div className="text-2xl">
                                        {(item.audio_features.valence || 0) > 0.6 ? '😊' : (item.audio_features.valence || 0) > 0.4 ? '😐' : '😔'}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {item.audio_features.danceability !== undefined && (
                                  <div className="bg-gray-800/30 rounded-lg p-4 border border-cyan-400/20">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-medium text-cyan-300">Danceability</div>
                                        <div className="text-2xl font-bold text-cyan-400">{Math.round((item.audio_features.danceability || 0) * 100)}%</div>
                                      </div>
                                      <div className="text-2xl">
                                        {(item.audio_features.danceability || 0) > 0.7 ? '💃' : (item.audio_features.danceability || 0) > 0.4 ? '🕺' : '🚶'}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {item.audio_features.confidence !== undefined && (
                                  <div className="bg-gray-800/30 rounded-lg p-4 border border-green-400/20">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-medium text-green-300">Confidence</div>
                                        <div className="text-2xl font-bold text-green-400">{Math.round((item.audio_features.confidence || 0) * 100)}%</div>
                                      </div>
                                      <div className="text-2xl">
                                        {(item.audio_features.confidence || 0) > 0.8 ? '✅' : (item.audio_features.confidence || 0) > 0.6 ? '👍' : '⚠️'}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mood Analysis Professional Display */}
                        {hasMoodTags && item.mood_tags && (
                          <div className="bg-gradient-to-r from-yellow-900/20 to-amber-800/10 rounded-xl p-6 border border-yellow-500/30">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-xl font-bold text-white flex items-center">
                                <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">🎭</span>
                                Mood & Emotion Analysis
                              </h4>
                              <div className="flex items-center space-x-2">
                                <div className="text-sm text-yellow-300 bg-yellow-500/20 px-3 py-1 rounded-full">
                                  {Math.round(item.mood_tags.confidence * 100)}% Confidence
                                </div>
                                <div className="text-lg">
                                  {item.mood_tags.confidence > 0.8 ? '🎯' : item.mood_tags.confidence > 0.6 ? '👍' : '🤔'}
                                </div>
                              </div>
                            </div>

                            {/* Mood Tags Display */}
                            <div className="space-y-6">
                              {/* Primary Mood Tags */}
                              <div>
                                <div className="text-sm font-semibold text-yellow-300 mb-3 uppercase tracking-wide">Detected Moods</div>
                                <div className="flex flex-wrap gap-3">
                                  {item.mood_tags.tags.map((tag, index) => (
                                    <div
                                      key={index}
                                      className="group relative px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 rounded-xl border border-yellow-500/40 font-medium hover:from-yellow-500/30 hover:to-amber-500/30 transition-all duration-200 cursor-default"
                                    >
                                      <span className="text-lg mr-2">
                                        {tag === 'contemplative' ? '🤔' :
                                         tag === 'atmospheric' ? '🌌' :
                                         tag === 'high-energy' ? '⚡' :
                                         tag === 'danceable' ? '💃' :
                                         tag === 'uplifting' ? '😊' :
                                         tag === 'melancholic' ? '😔' :
                                         tag === 'chill' ? '😌' :
                                         tag === 'aggressive' ? '😤' :
                                         tag === 'romantic' ? '💕' :
                                         tag === 'epic' ? '⚔️' : '🎵'}
                                      </span>
                                      <span className="capitalize">{tag}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Analysis Breakdown */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Confidence Meter */}
                                <div className="bg-gray-800/30 rounded-lg p-4">
                                  <div className="text-sm font-medium text-yellow-300 mb-3">Analysis Confidence</div>
                                  <div className="relative">
                                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                                      <div 
                                        className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 h-4 rounded-full transition-all duration-1000 shadow-lg relative"
                                        style={{ width: `${item.mood_tags.confidence * 100}%` }}
                                      >
                                        <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                                      </div>
                                    </div>
                                    <div className="text-center mt-2">
                                      <span className="text-2xl font-bold text-yellow-400">{Math.round(item.mood_tags.confidence * 100)}%</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Analysis Sources */}
                                <div className="bg-gray-800/30 rounded-lg p-4">
                                  <div className="text-sm font-medium text-yellow-300 mb-3">Analysis Sources</div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400 flex items-center">
                                        <span className="mr-2">🎵</span> Audio Features
                                      </span>
                                      <span className="text-green-400">
                                        {item.mood_tags.derived_from?.audio ? '✓' : '○'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400 flex items-center">
                                        <span className="mr-2">📝</span> Lyrics Analysis
                                      </span>
                                      <span className="text-green-400">
                                        {item.mood_tags.derived_from?.lyrics ? '✓' : '○'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400 flex items-center">
                                        <span className="mr-2">👥</span> User Engagement
                                      </span>
                                      <span className="text-green-400">
                                        {item.mood_tags.derived_from?.engagement ? '✓' : '○'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* AI Rationale */}
                              {item.mood_tags.rationale && item.mood_tags.rationale.length > 0 && (
                                <div className="bg-gray-800/30 rounded-lg p-4">
                                  <div className="text-sm font-medium text-yellow-300 mb-3 flex items-center">
                                    <span className="mr-2">🧠</span> AI Reasoning
                                  </div>
                                  <div className="space-y-2">
                                    {item.mood_tags.rationale.map((reason, index) => (
                                      <div key={index} className="text-gray-300 text-sm italic pl-4 border-l-2 border-yellow-500/30">
                                        "{reason}"
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Processing State */}
                        {buttonState.isProcessing && (
                          <div className="text-center py-12 text-yellow-400">
                            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <div className="text-4xl animate-spin">⏳</div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">AI Analysis in Progress</h3>
                            <p className="text-gray-300">Our AI is analyzing audio features, extracting mood patterns, and generating insights...</p>
                            <div className="mt-6 flex justify-center">
                              <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* No Data Message */}
                        {!hasAudioFeatures && !hasMoodTags && !buttonState.isProcessing && (
                          <div className="text-center py-12 text-gray-400">
                            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <div className="text-4xl">🤔</div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">No AI Analysis Available</h3>
                            <p className="text-gray-300">This track hasn't been processed yet or the analysis failed.</p>
                            <div className="mt-4">
                              <button
                                onClick={processQueue}
                                className="px-4 py-2 bg-accent-yellow text-black rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
                              >
                                Process Now
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Analysis Complete Summary */}
                        {(hasAudioFeatures || hasMoodTags) && !buttonState.isProcessing && (
                          <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                Analysis Completed
                              </span>
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                {hasAudioFeatures ? 'Audio Features ✓' : 'Audio Features ○'}
                              </span>
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                {hasMoodTags ? 'Mood Analysis ✓' : 'Mood Analysis ○'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <ArtistUploadManager
          onUploadComplete={(files) => {
            console.log('✅ Upload completed from processing dashboard:', files)
            setShowUploadModal(false)
            
            // Mark newly uploaded items for auto-expansion and tracking
            if (files && files.length > 0) {
              const fileIds = files.map(file => file.id).filter(Boolean)
              
              if (fileIds.length > 0) {
                // Track recently uploaded items
                setRecentlyUploadedItems(prev => {
                  const newSet = new Set(prev)
                  fileIds.forEach(id => newSet.add(id))
                  return newSet
                })
                
                // Auto-expand newly uploaded items
                setExpandedItems(prev => {
                  const newSet = new Set(prev)
                  fileIds.forEach(id => newSet.add(id))
                  return newSet
                })
                
                console.log('🔽 Auto-expanding newly uploaded items:', fileIds)
              }
            }
            
            // Refresh the content list and stats after upload
            setTimeout(() => {
              fetchContent()
              fetchStats()
            }, 1000)
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      
      {/* Audio Player at Bottom */}
      <div className="mt-8 border-t border-gray-800 pt-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-white flex items-center">
            🎵 Audio Player
            <span className="ml-2 text-sm text-gray-400 font-normal">
              Click Play on any track to start playback
            </span>
          </h3>
        </div>
        <GlobalAudioPlayer />
      </div>
    </div>
  )
}

export default AudioProcessingDashboard
