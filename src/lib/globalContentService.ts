// Global Content Service - Updated for Client-Side Signed URLs
// Handles global music content discovery and streaming via artist-content bucket

import { supabase } from './supabaseClient'

// Database schema interfaces matching actual structure
export interface GlobalTrack {
  id: string
  title: string
  description?: string
  content_type: 'audio' | 'video' | 'image' | 'document'
  file_path: string
  duration_seconds?: number
  metadata: any
  created_at: string
  updated_at: string
  
  // Artist relationship
  artist_id: string
  artists?: {
    id: string
    artist_name: string
    user_id: string
  } | {
    id: string
    artist_name: string
    user_id: string
  }[]
  
  // Audio intelligence features
  audio_features?: {
    bpm?: number
    key?: string
    mode?: string
    energy?: number
    valence?: number
    danceability?: number
  }[]
  
  // Mood tags
  mood_tags?: {
    tags: string[]
    confidence: number
  }[]
}

export class GlobalContentService {
  
  // Add is_published field to content_items table
  static async addPublishingFields() {
    try {
      // This would typically be done via Supabase migration
      // For now, we'll work with existing structure and add logic
      console.log('Publishing fields should be added via database migration')
      
      return { success: true }
    } catch (error) {
      console.error('Error adding publishing fields:', error)
      return { success: false, error }
    }
  }
  
  // Get all published/public tracks for discovery
  static async getPublishedTracks(limit = 50): Promise<{ data: GlobalTrack[] | null, error: any }> {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select(`
          id,
          title,
          description,
          content_type,
          file_path,
          duration_seconds,
          metadata,
          created_at,
          updated_at,
          artist_id,
          artists (
            id,
            artist_name,
            user_id
          ),
          audio_features (
            bpm,
            key,
            mode,
            energy,
            valence,
            danceability
          ),
          mood_tags (
            tags,
            confidence
          )
        `)
        .eq('content_type', 'audio')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching published tracks:', error)
        return { data: null, error }
      }
      
      console.log(`Found ${data?.length || 0} tracks in database`)
      return { data: (data as unknown) as GlobalTrack[], error: null }
      
    } catch (error) {
      console.error('Error in getPublishedTracks:', error)
      return { data: null, error }
    }
  }
  
  // Get tracks by specific user (like dmstest49@gmail)
  static async getTracksByUserEmail(email: string): Promise<{ data: GlobalTrack[] | null, error: any }> {
    try {
      // First get the user_id from auth.users by email
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single()
      
      if (userError) {
        console.error('Error finding user:', userError)
        return { data: null, error: userError }
      }
      
      // Then get tracks by that user
      const { data, error } = await supabase
        .from('content_items')
        .select(`
          id,
          title,
          description,
          content_type,
          file_path,
          duration_seconds,
          metadata,
          created_at,
          updated_at,
          artist_id,
          artists (
            id,
            artist_name,
            user_id
          ),
          audio_features (
            bpm,
            key,
            mode,
            energy,
            valence,
            danceability
          ),
          mood_tags (
            tags,
            confidence
          )
        `)
        .eq('content_type', 'audio')
        .eq('artists.user_id', userData.id)
        .order('created_at', { ascending: false })
      
      console.log(`Found ${data?.length || 0} tracks for user ${email}`)
      return { data: (data as unknown) as GlobalTrack[], error: null }
      
    } catch (error) {
      console.error('Error in getTracksByUserEmail:', error)
      return { data: null, error }
    }
  }
  
  // Create signed URL for streaming from private artist-content bucket
  static async createStreamingUrl(filePath: string, expiresIn = 3600): Promise<{ url: string | null, error: any }> {
    try {
      const { data, error } = await supabase.storage
        .from('artist-content')
        .createSignedUrl(filePath, expiresIn)
      
      if (error) {
        console.error('Error creating signed URL:', error)
        return { url: null, error }
      }
      
      return { url: data.signedUrl, error: null }
      
    } catch (error) {
      console.error('Error in createStreamingUrl:', error)
      return { url: null, error }
    }
  }
  
  // Convert database track to player format
  static trackToPlayerFormat(track: GlobalTrack): any {
    const artistField = (track as any).artists
    const artistObj = Array.isArray(artistField) ? artistField[0] : artistField
    return {
      id: track.id,
      title: track.title,
      artist: artistObj?.artist_name || '',
      artistId: track.artist_id,
      duration: track.duration_seconds,
      albumArt: `https://picsum.photos/400/400?random=${track.id}`, // Placeholder
      audioFeatures: track.audio_features?.[0] || undefined,
      moodTags: track.mood_tags?.[0] ? {
        tags: track.mood_tags[0].tags || [],
        confidence: (track.mood_tags[0] as any).confidence || 0
      } : undefined,
      // audioUrl will be set separately via streaming URL
      audioUrl: ''
    }
  }
  
  // Get streaming-ready tracks for discovery/player
  static async getStreamingTracks(limit = 50): Promise<{ tracks: any[], error: any }> {
    try {
      const { data: tracks, error } = await this.getPublishedTracks(limit)
      
      if (error || !tracks) {
        return { tracks: [], error }
      }
      
      // Convert tracks and get streaming URLs
      const streamingTracks = await Promise.all(
        tracks.map(async (track) => {
          const playerTrack = this.trackToPlayerFormat(track)
          
          // Generate signed URL using client-side method
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('artist-content')
            .createSignedUrl(track.file_path, 3600)

          if (urlError || !signedUrlData?.signedUrl) {
            console.warn(`Failed to create streaming URL for track ${track.id}:`, urlError)
            return null
          }
          
          playerTrack.audioUrl = signedUrlData.signedUrl
          console.log(`✅ Generated signed URL for ${track.title}:`, signedUrlData.signedUrl.substring(0, 100) + '...')
          
          // Test if the URL is reachable and check headers
          try {
            const response = await fetch(signedUrlData.signedUrl, { method: 'HEAD' })
            if (response.ok) {
              const contentType = response.headers.get('content-type')
              const contentLength = response.headers.get('content-length')
              console.log(`✅ URL is reachable for ${track.title}`)
              console.log(`📋 Content-Type: ${contentType}`)
              console.log(`📏 Content-Length: ${contentLength} bytes`)
              
              // Check if content-type is proper for audio
              if (!contentType || !contentType.startsWith('audio/')) {
                console.warn(`⚠️ Invalid content-type for ${track.title}: ${contentType}`)
              }
            } else {
              console.warn(`⚠️ URL not reachable for ${track.title}: HTTP ${response.status}`)
            }
          } catch (fetchError) {
            console.warn(`⚠️ URL fetch failed for ${track.title}:`, fetchError)
          }
          
          return playerTrack
        })
      )
      
      // Filter out tracks that couldn't get streaming URLs
      const validTracks = streamingTracks.filter(track => track !== null)
      console.log(`Successfully prepared ${validTracks.length} streaming tracks`)
      
      return { tracks: validTracks, error: null }
      
    } catch (error) {
      console.error('Error in getStreamingTracks:', error)
      return { tracks: [], error }
    }
  }
  
  // Test audio streaming for a specific track
  static async testAudioStreaming(trackId: string): Promise<{ success: boolean, url?: string, error?: any }> {
    try {
      const { data: track, error } = await supabase
        .from('content_items')
        .select('file_path, title')
        .eq('id', trackId)
        .single()
      
      if (error || !track) {
        return { success: false, error: 'Track not found' }
      }
      
      const { url, error: urlError } = await this.createStreamingUrl(track.file_path)
      
      if (urlError || !url) {
        return { success: false, error: urlError }
      }
      
      // Test if URL is accessible
      try {
        const response = await fetch(url, { method: 'HEAD' })
        if (response.ok) {
          return { success: true, url, error: null }
        } else {
          return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
        }
      } catch (fetchError) {
        return { success: false, error: fetchError }
      }
      
    } catch (error) {
      return { success: false, error }
    }
  }
}

export default GlobalContentService