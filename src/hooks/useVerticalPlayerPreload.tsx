import { useEffect, useRef, useCallback } from 'react'

interface VideoTrack {
  id: string
  videoUrl?: string
  audioUrl: string
}

interface UseVerticalPlayerPreloadProps {
  tracks: VideoTrack[]
  currentIndex: number
  isOnWifi?: boolean
}

interface PreloadCache {
  [trackId: string]: {
    video?: HTMLVideoElement
    audio?: HTMLAudioElement
    loadPromise?: Promise<void>
    quality?: 'low' | 'high'
  }
}

export const useVerticalPlayerPreload = ({
  tracks,
  currentIndex,
  isOnWifi = true
}: UseVerticalPlayerPreloadProps) => {
  const preloadCache = useRef<PreloadCache>({})
  const preloadQueue = useRef<string[]>([])
  const isPreloading = useRef(false)

  // Detect network type
  const getConnectionType = useCallback((): 'wifi' | 'cellular' | 'unknown' => {
    // @ts-ignore - Navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      const effectiveType = connection.effectiveType
      const type = connection.type
      
      // Consider wifi, ethernet as high-speed
      if (type === 'wifi' || type === 'ethernet' || effectiveType === '4g') {
        return 'wifi'
      } else if (effectiveType === '3g' || effectiveType === '2g' || type === 'cellular') {
        return 'cellular'
      }
    }
    
    // Default assumption
    return isOnWifi ? 'wifi' : 'cellular'
  }, [isOnWifi])

  // Get preload strategy based on network
  const getPreloadStrategy = useCallback(() => {
    const connectionType = getConnectionType()
    
    switch (connectionType) {
      case 'wifi':
        return {
          videoPreloadCount: 2, // Preload next 2 videos
          audioPreloadCount: 3, // Preload next 3 audio tracks
          videoQuality: 'high' as const,
          preloadDuration: 3000 // 3 seconds of video
        }
      case 'cellular':
        return {
          videoPreloadCount: 1, // Preload next 1 video only
          audioPreloadCount: 2, // Preload next 2 audio tracks
          videoQuality: 'low' as const,
          preloadDuration: 1000 // 1 second of video
        }
      default:
        return {
          videoPreloadCount: 1,
          audioPreloadCount: 2,
          videoQuality: 'low' as const,
          preloadDuration: 1000
        }
    }
  }, [getConnectionType])

  // Create video element with preload settings
  const createVideoElement = useCallback((track: VideoTrack, quality: 'low' | 'high') => {
    if (!track.videoUrl) return null
    
    const video = document.createElement('video')
    video.src = track.videoUrl
    video.muted = true
    video.playsInline = true
    video.loop = true
    video.crossOrigin = 'anonymous'
    
    // Set quality-based attributes
    if (quality === 'low') {
      video.preload = 'metadata'
    } else {
      video.preload = 'auto'
    }
    
    return video
  }, [])

  // Create audio element with preload settings
  const createAudioElement = useCallback((track: VideoTrack) => {
    const audio = document.createElement('audio')
    audio.src = track.audioUrl
    audio.preload = 'metadata'
    audio.crossOrigin = 'anonymous'
    
    return audio
  }, [])

  // Preload a single track
  const preloadTrack = useCallback(async (track: VideoTrack, strategy: ReturnType<typeof getPreloadStrategy>) => {
    if (preloadCache.current[track.id]) {
      return // Already cached
    }
    
    const cacheEntry: PreloadCache[string] = {}
    
    // Preload video if available
    if (track.videoUrl) {
      const video = createVideoElement(track, strategy.videoQuality)
      if (video) {
        cacheEntry.video = video
        cacheEntry.quality = strategy.videoQuality
        
        // Create load promise
        cacheEntry.loadPromise = new Promise<void>((resolve, reject) => {
          let resolved = false
          
          const handleCanPlay = () => {
            if (!resolved) {
              resolved = true
              resolve()
            }
          }
          
          const handleError = () => {
            if (!resolved) {
              resolved = true
              console.warn(`Failed to preload video: ${track.videoUrl}`)
              resolve() // Resolve anyway to not block
            }
          }
          
          const handleTimeout = () => {
            if (!resolved) {
              resolved = true
              console.warn(`Video preload timeout: ${track.videoUrl}`)
              resolve()
            }
          }
          
          video.addEventListener('canplay', handleCanPlay, { once: true })
          video.addEventListener('error', handleError, { once: true })
          
          // Timeout after 10 seconds
          setTimeout(handleTimeout, 10000)
          
          // Start loading
          video.load()
        })
      }
    }
    
    // Preload audio
    const audio = createAudioElement(track)
    cacheEntry.audio = audio
    
    // Add to cache
    preloadCache.current[track.id] = cacheEntry
    
    // Wait for load if we have a promise
    if (cacheEntry.loadPromise) {
      await cacheEntry.loadPromise
    }
    
    console.log(`✅ Preloaded track: ${track.id}`)
  }, [createVideoElement, createAudioElement])

  // Process preload queue
  const processPreloadQueue = useCallback(async () => {
    if (isPreloading.current || preloadQueue.current.length === 0) {
      return
    }
    
    isPreloading.current = true
    const strategy = getPreloadStrategy()
    
    try {
      while (preloadQueue.current.length > 0) {
        const trackId = preloadQueue.current.shift()
        if (!trackId) continue
        
        const track = tracks.find(t => t.id === trackId)
        if (track) {
          await preloadTrack(track, strategy)
        }
      }
    } catch (error) {
      console.error('Preload queue processing error:', error)
    } finally {
      isPreloading.current = false
    }
  }, [tracks, getPreloadStrategy, preloadTrack])

  // Update preload queue based on current index
  const updatePreloadQueue = useCallback(() => {
    const strategy = getPreloadStrategy()
    const newQueue: string[] = []
    
    // Add next tracks for video preloading
    for (let i = 1; i <= strategy.videoPreloadCount; i++) {
      const nextIndex = currentIndex + i
      if (nextIndex < tracks.length) {
        const track = tracks[nextIndex]
        if (track.videoUrl && !preloadCache.current[track.id]) {
          newQueue.push(track.id)
        }
      }
    }
    
    // Add previous tracks for quick navigation
    for (let i = 1; i <= Math.min(2, currentIndex); i++) {
      const prevIndex = currentIndex - i
      if (prevIndex >= 0) {
        const track = tracks[prevIndex]
        if (track.videoUrl && !preloadCache.current[track.id]) {
          newQueue.push(track.id)
        }
      }
    }
    
    // Add audio preloading for more tracks
    for (let i = 1; i <= strategy.audioPreloadCount; i++) {
      const nextIndex = currentIndex + i
      if (nextIndex < tracks.length) {
        const track = tracks[nextIndex]
        if (!preloadCache.current[track.id]) {
          newQueue.push(track.id)
        }
      }
    }
    
    // Update queue if changed
    const queueChanged = JSON.stringify(newQueue) !== JSON.stringify(preloadQueue.current)
    if (queueChanged) {
      preloadQueue.current = newQueue
      processPreloadQueue()
    }
  }, [currentIndex, tracks, getPreloadStrategy, processPreloadQueue])

  // Clean up old cache entries
  const cleanupCache = useCallback(() => {
    const strategy = getPreloadStrategy()
    const keepRange = strategy.videoPreloadCount + 2 // Keep a bit extra
    
    Object.keys(preloadCache.current).forEach(trackId => {
      const trackIndex = tracks.findIndex(t => t.id === trackId)
      const distance = Math.abs(trackIndex - currentIndex)
      
      if (distance > keepRange) {
        const cacheEntry = preloadCache.current[trackId]
        
        // Clean up video element
        if (cacheEntry.video) {
          cacheEntry.video.src = ''
          cacheEntry.video.load()
        }
        
        // Clean up audio element
        if (cacheEntry.audio) {
          cacheEntry.audio.src = ''
          cacheEntry.audio.load()
        }
        
        delete preloadCache.current[trackId]
        console.log(`🧹 Cleaned up cache for track: ${trackId}`)
      }
    })
  }, [tracks, currentIndex, getPreloadStrategy])

  // Get preloaded elements for a track
  const getPreloadedElements = useCallback((trackId: string) => {
    return preloadCache.current[trackId] || null
  }, [])

  // Main effect to manage preloading
  useEffect(() => {
    updatePreloadQueue()
    cleanupCache()
  }, [currentIndex, updatePreloadQueue, cleanupCache])

  // Network change effect
  useEffect(() => {
    const handleNetworkChange = () => {
      console.log('📶 Network conditions changed, updating preload strategy')
      updatePreloadQueue()
    }
    
    // @ts-ignore - Navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      connection.addEventListener('change', handleNetworkChange)
      
      return () => {
        connection.removeEventListener('change', handleNetworkChange)
      }
    }
  }, [updatePreloadQueue])

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up all cache entries on unmount
      Object.values(preloadCache.current).forEach(cacheEntry => {
        if (cacheEntry.video) {
          cacheEntry.video.src = ''
          cacheEntry.video.load()
        }
        if (cacheEntry.audio) {
          cacheEntry.audio.src = ''
          cacheEntry.audio.load()
        }
      })
      preloadCache.current = {}
    }
  }, [])

  return {
    getPreloadedElements,
    preloadQueue: preloadQueue.current,
    cacheSize: Object.keys(preloadCache.current).length,
    connectionType: getConnectionType(),
    strategy: getPreloadStrategy()
  }
}