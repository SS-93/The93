import { supabase } from './supabaseClient'

export interface MediaIDData {
  interests: string[]
  genrePreferences: string[]
  privacySettings: {
    dataSharing: boolean
    locationAccess: boolean
    audioCapture: boolean
    anonymousLogging: boolean
    marketingCommunications: boolean
  }
  locationCode: string
  contentFlags: {
    mood: string
    likes: string[]
    dislikes: string[]
  }
}

export interface MediaIDProfile {
  id: string
  user_uuid: string
  interests: string[]
  genre_preferences: string[]
  content_flags: any
  location_code: string
  profile_embedding?: number[]
  created_at: string
  updated_at: string
}

export const setupMediaID = async (data: MediaIDData) => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const mediaIdPayload = {
      user_uuid: user.user.id,
      interests: data.interests,
      genre_preferences: data.genrePreferences,
      location_code: data.locationCode || 'US',
      content_flags: {
        mood: data.contentFlags.mood,
        likes: data.contentFlags.likes,
        dislikes: data.contentFlags.dislikes,
        privacy_settings: data.privacySettings
      }
    }

    const { data: mediaId, error } = await supabase
      .from('media_ids')
      .insert([mediaIdPayload])
      .select()
      .single()

    if (error) throw error

    return { data: mediaId, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const getMediaIDProfile = async (): Promise<MediaIDProfile | null> => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    const { data, error } = await supabase
      .from('media_ids')
      .select('*')
      .eq('user_uuid', user.user.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching MediaID profile:', error)
    return null
  }
}

export const updateMediaIDPreferences = async (preferences: Partial<MediaIDData>) => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const updatePayload: any = {}
    
    if (preferences.interests) updatePayload.interests = preferences.interests
    if (preferences.genrePreferences) updatePayload.genre_preferences = preferences.genrePreferences
    if (preferences.locationCode) updatePayload.location_code = preferences.locationCode
    if (preferences.contentFlags || preferences.privacySettings) {
      const currentProfile = await getMediaIDProfile()
      updatePayload.content_flags = {
        ...currentProfile?.content_flags,
        ...(preferences.contentFlags && {
          mood: preferences.contentFlags.mood,
          likes: preferences.contentFlags.likes,
          dislikes: preferences.contentFlags.dislikes
        }),
        ...(preferences.privacySettings && {
          privacy_settings: preferences.privacySettings
        })
      }
    }

    const { data, error } = await supabase
      .from('media_ids')
      .update(updatePayload)
      .eq('user_uuid', user.user.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const logMediaEngagement = async (contentId: string, eventType: string, metadata?: any) => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    // Check if anonymous logging is enabled
    const profile = await getMediaIDProfile()
    if (!profile?.content_flags?.privacy_settings?.anonymousLogging) return

    const { error } = await supabase
      .from('media_engagement_log')
      .insert([{
        user_id: user.user.id,
        content_id: contentId,
        event_type: eventType,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      }])

    if (error) throw error
  } catch (error) {
    console.error('Error logging media engagement:', error)
  }
}

export const clearEngagementHistory = async () => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('media_engagement_log')
      .delete()
      .eq('user_id', user.user.id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export const getEngagementHistory = async (limit = 100) => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return []

    const { data, error } = await supabase
      .from('media_engagement_log')
      .select('*')
      .eq('user_id', user.user.id)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching engagement history:', error)
    return []
  }
}

export const generateRecommendations = async (type: 'artists' | 'content' | 'brands') => {
  try {
    const profile = await getMediaIDProfile()
    if (!profile) return []

    // This would typically call an AI/ML service
    // For now, we'll return mock recommendations based on interests
    const mockRecommendations = {
      artists: [
        { id: '1', name: 'Luna Starlight', match: 0.95, reason: 'Electronic & Ambient interests' },
        { id: '2', name: 'Neon Waves', match: 0.87, reason: 'Synthwave & Experimental genres' }
      ],
      content: [
        { id: '1', title: 'Midnight Dreams EP', match: 0.92, artist: 'Luna Starlight' },
        { id: '2', title: 'Digital Sunrise', match: 0.88, artist: 'Cyber Collective' }
      ],
      brands: [
        { id: '1', name: 'Future Sounds', match: 0.85, reason: 'Audio technology focus' },
        { id: '2', name: 'Neon Apparel', match: 0.78, reason: 'Aesthetic alignment' }
      ]
    }

    return mockRecommendations[type] || []
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return []
  }
} 