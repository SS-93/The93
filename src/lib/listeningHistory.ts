// Listening History Service for MediaID Profile
// Tracks user interactions with audio content across the platform

import { supabase } from './supabaseClient'

// Types based on the UX spec
export interface ListeningHistoryEntry {
  id: string
  user_id: string
  media_id_profile_id: string
  
  // Content identification
  content_id: string
  content_type: 'music' | 'podcast' | 'audiobook' | 'playlist' | 'album'
  content_title: string
  content_artist?: string
  content_provider?: string // 'spotify', 'upload', 'buckets', etc.
  
  // Event details
  event_type: 'played' | 'added' | 'downloaded' | 'resumed' | 'completed'
  event_context?: string // 'discovery', 'search', 'playlist', 'vertical_player'
  
  // Playback details
  play_duration_seconds?: number
  total_duration_seconds?: number
  progress_percentage?: number
  play_count?: number
  
  // Session information
  session_id?: string
  device_type?: string
  device_name?: string
  
  // Metadata
  explicit_content: boolean
  artwork_url?: string
  created_at: string
  updated_at: string
}

export interface ListeningSession {
  id: string
  user_id: string
  session_start: string
  session_end?: string
  device_type: string
  device_name?: string
  total_tracks_played: number
  total_duration_seconds: number
  primary_content_type: 'music' | 'podcast' | 'audiobook'
  context: string // 'discovery', 'playlist', 'vertical_player', 'search'
}

// Analytics event structure from the UX spec
export interface ListeningAnalyticsEvent {
  user_id: string
  filter?: 'music' | 'podcasts' | 'audiobooks'
  date_group: string
  items: Array<{
    type: 'playlist' | 'album' | 'track'
    id: string
    title: string
    provider?: string
    played_count?: number
    action?: 'added' | 'played'
    count?: number
  }>
  interaction?: {
    kind: 'open' | 'menu' | 'play' | 'pause' | 'device_transfer' | 'add_to_playlist'
    item_type: 'playlist' | 'album' | 'track'
    item_id: string
    timestamp: string
    device?: string
    from_surface: 'recents' | 'vertical_player' | 'global_player'
  }
}

class ListeningHistoryService {
  private currentSessionId: string | null = null
  
  // Start a new listening session (simplified - just generate an ID)
  async startSession(userId: string, deviceType: string, deviceName?: string, context: string = 'general'): Promise<string> {
    try {
      this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log('🎵 Started listening session:', this.currentSessionId)
      return this.currentSessionId
    } catch (error) {
      console.error('Failed to start listening session:', error)
      return `fallback_${Date.now()}`
    }
  }
  
  // End current session
  async endSession(): Promise<void> {
    if (this.currentSessionId) {
      console.log('🎵 Ended listening session:', this.currentSessionId)
      this.currentSessionId = null
    }
  }
  
  // Track a listening event using media_engagement_log
  async trackListeningEvent(params: {
    userId: string
    contentId: string
    contentType: ListeningHistoryEntry['content_type']
    contentTitle: string
    contentArtist?: string
    contentProvider?: string
    eventType: ListeningHistoryEntry['event_type']
    eventContext?: string
    playDurationSeconds?: number
    totalDurationSeconds?: number
    progressPercentage?: number
    explicitContent?: boolean
    artworkUrl?: string
    forceDuplicate?: boolean // Optional: Allow duplicate plays (for testing)
  }): Promise<void> {
    try {
      // For play events, check if we already logged this track today (unique daily plays)
      if (params.eventType === 'played' && !params.forceDuplicate) {
        const today = new Date().toISOString().split('T')[0] // Get YYYY-MM-DD format

        const { data: existingPlay, error: checkError } = await supabase
          .from('media_engagement_log')
          .select('id')
          .eq('user_id', params.userId)
          .eq('content_id', params.contentId)
          .eq('event_type', 'track_play')
          .gte('timestamp', `${today}T00:00:00.000Z`)
          .lt('timestamp', `${today}T23:59:59.999Z`)
          .limit(1)

        if (checkError) {
          console.warn('Failed to check existing play, proceeding with logging:', checkError)
        } else if (existingPlay && existingPlay.length > 0) {
          console.log('🎵 Track already played today, skipping duplicate log:', params.contentTitle)
          return // Skip logging duplicate play
        }
      }

      // Map our event types to the ones used in media_engagement_log
      const eventTypeMap = {
        'played': 'track_play',
        'completed': 'track_complete',
        'paused': 'track_pause',
        'added': 'content_add',
        'downloaded': 'content_download',
        'resumed': 'track_resume'
      }
      
      const engagementEvent = {
        user_id: params.userId,
        content_id: params.contentId,
        event_type: eventTypeMap[params.eventType] || 'track_play',
        metadata: {
          content_type: params.contentType,
          content_title: params.contentTitle,
          content_artist: params.contentArtist,
          provider: params.contentProvider || 'buckets',
          context: params.eventContext,
          duration_seconds: params.playDurationSeconds,
          total_duration: params.totalDurationSeconds,
          progress_percentage: params.progressPercentage,
          explicit_content: params.explicitContent || false,
          artwork_url: params.artworkUrl,
          session_id: this.currentSessionId,
          device_type: 'web',
          device_name: navigator.userAgent,
          play_count: 1
        },
        timestamp: new Date().toISOString(),
        is_anonymous: false // Set based on user's MediaID privacy settings later
      }

      // Insert into media_engagement_log
      const { error } = await supabase
        .from('media_engagement_log')
        .insert(engagementEvent)
      
      if (error) throw error
      
      if (params.eventType === 'played') {
        console.log('🎵 First play today logged:', params.contentTitle, 'by', params.contentArtist)
      } else {
        console.log('📊 Tracked listening event:', params.eventType, params.contentTitle)
      }
    } catch (error) {
      console.error('Failed to track listening event:', error)
    }
  }
  
  // Get listening history for recents page using media_engagement_log
  async getListeningHistory(
    userId: string,
    contentType?: 'music' | 'podcasts' | 'audiobooks',
    limit: number = 50
  ): Promise<ListeningHistoryEntry[]> {
    try {
      let query = supabase
        .from('media_engagement_log')
        .select('*')
        .eq('user_id', userId)
        .in('event_type', ['track_play', 'track_pause', 'track_complete', 'content_play'])
        .order('timestamp', { ascending: false })
        .limit(limit)
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Convert media_engagement_log format to ListeningHistoryEntry format
      const historyEntries: ListeningHistoryEntry[] = (data || []).map(entry => ({
        id: entry.id || `${entry.user_id}-${entry.content_id}-${entry.timestamp}`,
        user_id: entry.user_id,
        media_id_profile_id: 'default', // Use default since we don't have this in engagement log
        content_id: entry.content_id,
        content_type: entry.metadata?.content_type || 'music',
        content_title: entry.metadata?.title || entry.metadata?.content_title || 'Unknown Track',
        content_artist: entry.metadata?.artist || entry.metadata?.content_artist,
        content_provider: entry.metadata?.provider || 'buckets',
        event_type: entry.event_type === 'track_play' ? 'played' : 
                   entry.event_type === 'track_complete' ? 'completed' :
                   entry.event_type === 'content_play' ? 'played' : 'played',
        event_context: entry.metadata?.context,
        play_duration_seconds: entry.metadata?.duration_seconds,
        total_duration_seconds: entry.metadata?.total_duration,
        progress_percentage: entry.metadata?.progress_percentage,
        play_count: entry.metadata?.play_count || 1,
        session_id: entry.metadata?.session_id,
        device_type: entry.metadata?.device_type || 'web',
        device_name: entry.metadata?.device_name,
        explicit_content: entry.metadata?.explicit_content || false,
        artwork_url: entry.metadata?.artwork_url,
        created_at: entry.timestamp,
        updated_at: entry.timestamp
      }))
      
      // Apply content type filter if specified
      if (contentType) {
        const typeMap = {
          'music': ['music', 'album', 'playlist'],
          'podcasts': ['podcast'],
          'audiobooks': ['audiobook']
        }
        return historyEntries.filter(entry => 
          typeMap[contentType].includes(entry.content_type)
        )
      }
      
      return historyEntries
    } catch (error) {
      console.error('Failed to get listening history:', error)
      return []
    }
  }
  
  // Get grouped history by date for the recents UI
  async getGroupedListeningHistory(
    userId: string,
    contentType?: 'music' | 'podcasts' | 'audiobooks'
  ): Promise<Record<string, ListeningHistoryEntry[]>> {
    const history = await this.getListeningHistory(userId, contentType)
    
    const grouped: Record<string, ListeningHistoryEntry[]> = {}
    const now = new Date()
    
    history.forEach(entry => {
      const entryDate = new Date(entry.created_at)
      const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let dateKey: string
      if (diffDays === 0) {
        dateKey = 'Today'
      } else if (diffDays === 1) {
        dateKey = 'Yesterday'
      } else if (diffDays <= 7) {
        dateKey = entryDate.toLocaleDateString('en-US', { weekday: 'long' })
      } else {
        dateKey = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(entry)
    })
    
    return grouped
  }
  
  // Track interaction events for analytics
  async trackInteraction(event: ListeningAnalyticsEvent['interaction']): Promise<void> {
    try {
      await supabase
        .from('listening_interactions')
        .insert({
          ...event,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to track interaction:', error)
    }
  }
}

// Export singleton instance
export const listeningHistoryService = new ListeningHistoryService()

// Convenience functions for common tracking events
export const trackPlay = (params: {
  userId: string
  contentId: string
  contentTitle: string
  contentArtist?: string
  contentType?: ListeningHistoryEntry['content_type']
  durationSeconds?: number
  totalDuration?: number
  context?: string
}) => {
  return listeningHistoryService.trackListeningEvent({
    ...params,
    contentType: params.contentType || 'music',
    eventType: 'played',
    eventContext: params.context,
    playDurationSeconds: params.durationSeconds,
    totalDurationSeconds: params.totalDuration,
    progressPercentage: params.durationSeconds && params.totalDuration 
      ? (params.durationSeconds / params.totalDuration) * 100 
      : undefined
  })
}

export const trackAdd = (params: {
  userId: string
  contentId: string
  contentTitle: string
  contentArtist?: string
  contentType?: ListeningHistoryEntry['content_type']
  context?: string
}) => {
  return listeningHistoryService.trackListeningEvent({
    ...params,
    contentType: params.contentType || 'music',
    eventType: 'added',
    eventContext: params.context
  })
}

export const trackResume = (params: {
  userId: string
  contentId: string
  contentTitle: string
  contentArtist?: string
  contentType?: ListeningHistoryEntry['content_type']
  resumeTime: number
  totalDuration: number
}) => {
  return listeningHistoryService.trackListeningEvent({
    ...params,
    contentType: params.contentType || 'music',
    eventType: 'resumed',
    playDurationSeconds: params.resumeTime,
    totalDurationSeconds: params.totalDuration,
    progressPercentage: (params.resumeTime / params.totalDuration) * 100
  })
}