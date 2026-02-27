/**
 * Concierto MediaID Service
 * Privacy-first integration between MediaID system and event voting
 */

import { supabase } from './supabaseClient'

export interface MediaIdProfile {
  id: string
  user_uuid: string
  interests: string[]
  privacy_settings: {
    level: 'minimal' | 'balanced' | 'enhanced'
    personalization_enabled: boolean
    data_sharing_consent: boolean
  }
  listening_patterns?: {
    genres: string[]
    energy_preference: number
    recent_activity: any[]
  }
}

export interface EventRecommendation {
  artist_id: string
  compatibility_score: number
  reason: string
  confidence: number
}

export interface AnonymousVotingSession {
  id: string
  event_id: string
  session_fingerprint: string
  consent_level: 'minimal' | 'functional' | 'personalized'
  recommendations?: EventRecommendation[]
}

export interface VotingRecommendationsRequest {
  event_id: string
  mediaid_profile_id?: string
  user_agent?: string
  consent_preferences?: {
    data_sharing: boolean
    personalized_recommendations: boolean
    consent_level: 'minimal' | 'functional' | 'personalized'
  }
}

export class ConciertoMediaIdService {

  /**
   * Create anonymous event profile for privacy-first participation
   */
  static async createAnonymousEventProfile(
    eventId: string,
    userAgent?: string,
    consentPreferences: any = { data_sharing: false }
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('create_anonymous_event_profile', {
          p_event_id: eventId,
          p_user_agent: userAgent || 'unknown',
          p_consent_preferences: consentPreferences
        })

      if (error) {
        console.error('Error creating anonymous profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to create anonymous event profile:', error)
      return null
    }
  }

  /**
   * Get MediaID-powered voting recommendations
   */
  static async getVotingRecommendations(
    request: VotingRecommendationsRequest
  ): Promise<EventRecommendation[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_mediaid_voting_recommendations', {
          p_event_id: request.event_id,
          p_mediaid_profile_id: request.mediaid_profile_id || null
        })

      if (error) {
        console.error('Error getting voting recommendations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to get voting recommendations:', error)
      return []
    }
  }

  /**
   * Get current user's MediaID profile if available
   */
  static async getCurrentUserMediaId(): Promise<MediaIdProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('media_ids')
        .select('*')
        .eq('user_uuid', user.id)
        .single()

      if (error || !data) return null

      return data as MediaIdProfile
    } catch (error) {
      console.error('Failed to get MediaID profile:', error)
      return null
    }
  }

  /**
   * Create MediaID-enhanced vote with privacy controls
   */
  static async castMediaIdVote(
    participantId: string,
    eventId: string,
    artistId: string,
    mediaIdProfile?: MediaIdProfile,
    context?: {
      recommendation_influence?: any
      listening_context?: any
      confidence_score?: number
    }
  ): Promise<boolean> {
    try {
      const voteData: any = {
        participant_id: participantId,
        event_id: eventId,
        artist_id: artistId,
        created_at: new Date().toISOString()
      }

      // Add MediaID enhancements if user consents
      if (mediaIdProfile?.privacy_settings.personalization_enabled && context) {
        voteData.vote_confidence_score = context.confidence_score || 0.8
        voteData.recommendation_influence = context.recommendation_influence || {}
        voteData.listening_context = context.listening_context || {}
      }

      const { error } = await supabase
        .from('event_votes')
        .insert(voteData)

      return !error
    } catch (error) {
      console.error('Failed to cast MediaID vote:', error)
      return false
    }
  }

  /**
   * Get privacy-compliant event analytics
   */
  static async getEventAnalytics(eventId: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .rpc('get_event_analytics_anonymized', {
          p_event_id: eventId,
          p_requester_user_id: user.id
        })

      if (error) {
        console.error('Error getting event analytics:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to get event analytics:', error)
      return null
    }
  }

  /**
   * Update user consent preferences for an event
   */
  static async updateEventConsent(
    participantId: string,
    consentPreferences: {
      data_sharing: boolean
      personalized_recommendations: boolean
      follow_up_marketing: boolean
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({
          consent_preferences: consentPreferences
        })
        .eq('id', participantId)

      return !error
    } catch (error) {
      console.error('Failed to update consent preferences:', error)
      return false
    }
  }

  /**
   * Get user's event participation history (privacy-aware)
   */
  static async getUserEventHistory(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const mediaId = await this.getCurrentUserMediaId()
      if (!mediaId) return []

      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          event_id,
          joined_at,
          consent_preferences,
          events:event_id (
            title,
            status,
            start_date,
            end_date
          )
        `)
        .eq('mediaid_profile_id', mediaId.id)
        .order('joined_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Failed to get user event history:', error)
      return []
    }
  }

  /**
   * Generate anonymous session fingerprint for privacy tracking
   */
  static generateSessionFingerprint(userAgent: string = navigator.userAgent): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const fingerprint = `${userAgent}-${timestamp}-${random}`

    // Create simple hash for privacy
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16)
  }

  /**
   * Check if user can participate in event based on MediaID settings
   */
  static async canParticipateInEvent(
    eventId: string,
    mediaIdProfile?: MediaIdProfile
  ): Promise<{
    canParticipate: boolean
    requiresConsent: boolean
    availableFeatures: string[]
  }> {
    try {
      // Get event details
      const { data: event, error } = await supabase
        .from('events')
        .select('privacy_mode, mediaid_integration_enabled, personalization_settings')
        .eq('id', eventId)
        .single()

      if (error || !event) {
        return {
          canParticipate: false,
          requiresConsent: false,
          availableFeatures: []
        }
      }

      const availableFeatures = ['basic_voting']
      let requiresConsent = false

      // Check MediaID integration features
      if (event.mediaid_integration_enabled && mediaIdProfile) {
        if (mediaIdProfile.privacy_settings.personalization_enabled) {
          availableFeatures.push('personalized_recommendations')
          availableFeatures.push('enhanced_analytics')
        }

        if (mediaIdProfile.privacy_settings.data_sharing_consent) {
          availableFeatures.push('social_features')
          availableFeatures.push('artist_connections')
        }

        requiresConsent = event.privacy_mode === 'enhanced'
      }

      return {
        canParticipate: true,
        requiresConsent,
        availableFeatures
      }
    } catch (error) {
      console.error('Failed to check event participation eligibility:', error)
      return {
        canParticipate: false,
        requiresConsent: false,
        availableFeatures: []
      }
    }
  }
}