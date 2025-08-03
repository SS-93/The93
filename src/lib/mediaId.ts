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
  role?: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'
  interests: string[]
  genre_preferences: string[]
  content_flags: any
  location_code: string
  profile_embedding?: number[]
  privacy_settings?: {
    data_sharing: boolean
    location_access: boolean
    audio_capture: boolean
    anonymous_logging: boolean
    marketing_communications: boolean
  }
  version?: number
  is_active?: boolean
  created_at: string
  updated_at: string
}

export const setupMediaID = async (data: MediaIDData, userRole: 'fan' | 'artist' | 'brand' | 'developer' | 'admin' = 'fan') => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const mediaIdPayload = {
      user_uuid: user.user.id,
      role: userRole,
      interests: data.interests,
      genre_preferences: data.genrePreferences,
      location_code: data.locationCode || 'US',
      privacy_settings: data.privacySettings,
      content_flags: {
        mood: data.contentFlags.mood,
        likes: data.contentFlags.likes,
        dislikes: data.contentFlags.dislikes
      },
      version: 1,
      is_active: true
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
    
    // Handle privacy settings as a separate field
    if (preferences.privacySettings) {
      updatePayload.privacy_settings = preferences.privacySettings
    }
    
    // Handle content flags
    if (preferences.contentFlags) {
      const currentProfile = await getMediaIDProfile()
      updatePayload.content_flags = {
        ...currentProfile?.content_flags,
        mood: preferences.contentFlags.mood,
        likes: preferences.contentFlags.likes,
        dislikes: preferences.contentFlags.dislikes
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

// Get all MediaID profiles for the current user (for multi-role support)
export const getAllMediaIDProfiles = async (): Promise<MediaIDProfile[]> => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return []

    const { data, error } = await supabase
      .from('media_ids')
      .select('*')
      .eq('user_uuid', user.user.id)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all MediaID profiles:', error)
    return []
  }
}

// Get available roles for the current user
export const getUserAvailableRoles = async (): Promise<('fan' | 'artist' | 'brand' | 'developer' | 'admin')[]> => {
  try {
    const profiles = await getAllMediaIDProfiles()
    const roles = profiles.map(profile => profile.role).filter(Boolean) as ('fan' | 'artist' | 'brand' | 'developer' | 'admin')[]
    return roles.length > 0 ? roles : ['fan'] // Default to fan if no roles found
  } catch (error) {
    console.error('Error getting available roles:', error)
    return ['fan'] // Default fallback
  }
}

// Switch to a different MediaID role
export const switchMediaIDRole = async (targetRole: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    // Check if user already has a MediaID profile for this role
    const { data: existingProfile } = await supabase
      .from('media_ids')
      .select('*')
      .eq('user_uuid', user.user.id)
      .eq('role', targetRole)
      .single()

    if (existingProfile) {
      return { data: existingProfile, error: null }
    }

    // Create new MediaID profile for this role
    const { data, error } = await supabase
      .from('media_ids')
      .insert({
        user_uuid: user.user.id,
        role: targetRole,
        interests: [],
        genre_preferences: [],
        privacy_settings: {
          data_sharing: true,
          location_access: false,
          audio_capture: false,
          anonymous_logging: true,
          marketing_communications: false
        },
        version: 1,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Check if role-specific setup is required
export const checkRoleSetupRequired = async (role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return true

    const { data: profile } = await supabase
      .from('media_ids')
      .select('*')
      .eq('user_uuid', user.user.id)
      .eq('role', role)
      .single()

    // If no profile exists for this role, setup is required
    if (!profile) return true

    // Check if profile has basic required fields
    const hasInterests = profile.interests && profile.interests.length > 0
    const hasPrivacySettings = profile.privacy_settings && typeof profile.privacy_settings === 'object'

    return !hasInterests || !hasPrivacySettings
  } catch (error) {
    console.error('Error checking role setup requirement:', error)
    return true // Default to requiring setup if there's an error
  }
} 