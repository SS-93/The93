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
  role: 'fan' | 'artist' | 'brand' | 'developer'| 'admin'
  interests: string[]
  genre_preferences: string[]
  content_flags: any
  location_code: string
  privacy_settings: any
  profile_embedding?: number[]
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}

export const setupMediaID = async (data: MediaIDData, role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin' = 'fan') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Validate interests (3-5 required)
    if (!data.interests || data.interests.length < 3 || data.interests.length > 5) {
      throw new Error('Please select 3-5 interests')
    }

    // Create or update MediaID record for this specific role using upsert
    const { error } = await supabase
      .from('media_ids')
      .upsert({
        user_uuid: user.id,
        role: role,
        interests: data.interests,
        genre_preferences: data.genrePreferences,
        privacy_settings: data.privacySettings,
        content_flags: data.contentFlags,
        location_code: data.locationCode,
        is_active: true,
        version: 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_uuid,role',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('MediaID setup error:', error)
      throw new Error(`Failed to setup MediaID for ${role} role`)
    }

    // Log the setup completion
    await supabase
      .from('media_engagement_log')
      .insert({
        user_id: user.id,
        event_type: 'mediaid_setup_completed',
        is_anonymous: data.privacySettings.anonymousLogging,
        metadata: {
          role: role,
          interests_count: data.interests.length,
          privacy_level: Object.values(data.privacySettings).filter(Boolean).length
        }
      })

    return { success: true, role }
  } catch (error) {
    console.error('MediaID setup error:', error)
    throw error
  }
}

export const getMediaIDProfile = async (role?: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'): Promise<MediaIDProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // If no role specified, get the user's current role from profiles
    let targetRole = role
    if (!targetRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      targetRole = profile?.role || 'fan'
    }

    // Get MediaID for specific role
    const { data, error } = await supabase
      .from('media_ids')
      .select('*')
      .eq('user_uuid', user.id)
      .eq('role', targetRole)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('MediaID fetch error:', error)
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Error fetching MediaID profile:', error)
    return null
  }
}

export const getAllMediaIDProfiles = async (): Promise<MediaIDProfile[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get all MediaID records for this user across all roles
    const { data, error } = await supabase
      .from('media_ids')
      .select('*')
      .eq('user_uuid', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('MediaID profiles fetch error:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching all MediaID profiles:', error)
    return []
  }
}

export const updateMediaIDPreferences = async (preferences: Partial<MediaIDData>, role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Build update object only with provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (preferences.interests) updateData.interests = preferences.interests
    if (preferences.genrePreferences) updateData.genre_preferences = preferences.genrePreferences
    if (preferences.privacySettings) updateData.privacy_settings = preferences.privacySettings
    if (preferences.contentFlags) updateData.content_flags = preferences.contentFlags
    if (preferences.locationCode !== undefined) updateData.location_code = preferences.locationCode

    // Update MediaID for specific role
    const { error } = await supabase
      .from('media_ids')
      .update(updateData)
      .eq('user_uuid', user.id)
      .eq('role', role)
      .eq('is_active', true)

    if (error) {
      console.error('MediaID update error:', error)
      throw new Error(`Failed to update MediaID preferences for ${role} role`)
    }

    // Log the preference update
    await supabase
      .from('media_engagement_log')
      .insert({
        user_id: user.id,
        event_type: 'mediaid_preferences_updated',
        is_anonymous: preferences.privacySettings?.anonymousLogging ?? true,
        metadata: {
          role: role,
          updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at')
        }
      })

    return { success: true, role }
  } catch (error) {
    console.error('Error updating MediaID preferences:', error)
    throw error
  }
}

export const switchMediaIDRole = async (newRole: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if MediaID exists for the target role
    const targetProfile = await getMediaIDProfile(newRole)
    if (!targetProfile) {
      throw new Error(`No MediaID setup found for ${newRole} role. Please complete setup first.`)
    }

    // Update user's active role in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile role update error:', profileError)
      throw new Error(`Failed to switch to ${newRole} role`)
    }

    // Log the role switch
    await supabase
      .from('media_engagement_log')
      .insert({
        user_id: user.id,
        event_type: 'role_switched',
        is_anonymous: targetProfile.privacy_settings?.anonymous_logging ?? true,
        metadata: {
          new_role: newRole,
          timestamp: new Date().toISOString()
        }
      })

    return { success: true, newRole, profile: targetProfile }
  } catch (error) {
    console.error('Error switching MediaID role:', error)
    throw error
  }
}

export const deactivateMediaIDRole = async (role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Deactivate MediaID for specific role
    const { error } = await supabase
      .from('media_ids')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_uuid', user.id)
      .eq('role', role)

    if (error) {
      console.error('MediaID deactivation error:', error)
      throw new Error(`Failed to deactivate MediaID for ${role} role`)
    }

    return { success: true, role }
  } catch (error) {
    console.error('Error deactivating MediaID role:', error)
    throw error
  }
}

export const logMediaEngagement = async (contentId: string, eventType: string, metadata?: any, role?: 'fan' | 'artist' | 'brand' | 'developer' | 'admin') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get privacy settings for the specified role or current role
    const mediaIdProfile = await getMediaIDProfile(role)
    const isAnonymous = mediaIdProfile?.privacy_settings?.anonymous_logging ?? true

    await supabase
      .from('media_engagement_log')
      .insert({
        user_id: user.id,
        content_id: contentId,
        event_type: eventType,
        is_anonymous: isAnonymous,
        metadata: {
          ...metadata,
          role: role || mediaIdProfile?.role || 'fan'
        }
      })
  } catch (error) {
    console.error('Error logging media engagement:', error)
  }
}

export const clearEngagementHistory = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('media_engagement_log')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error clearing engagement history:', error)
    throw error
  }
}

export const getEngagementHistory = async (limit = 100, role?: 'fan' | 'artist' | 'brand' | 'developer'| 'admin') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('media_engagement_log')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit)

    // Filter by role if specified
    if (role) {
      query = query.eq('metadata->>role', role)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching engagement history:', error)
    return []
  }
}

export const generateRecommendations = async (type: 'artists' | 'content' | 'brands', role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin' = 'fan') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get MediaID profile for the specified role
    const profile = await getMediaIDProfile(role)
    if (!profile) {
      throw new Error(`No MediaID profile found for ${role} role`)
    }

    // This would typically call an AI service or recommendation engine
    // For now, return mock data based on interests
    const mockRecommendations = [
      { id: '1', name: 'Sample Artist', relevance: 0.95, reason: 'Based on your electronic music interest' },
      { id: '2', name: 'Underground Scene', relevance: 0.87, reason: 'Matches your underground preferences' },
    ]

    return mockRecommendations
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return []
  }
}

// New helper functions for multi-role management
export const getUserAvailableRoles = async (): Promise<('fan' | 'artist' | 'brand' | 'developer' | 'admin')[]> => {
  try {
    const profiles = await getAllMediaIDProfiles()
    return profiles.map(profile => profile.role)
  } catch (error) {
    console.error('Error getting available roles:', error)
    return []
  }
}

export const checkRoleSetupRequired = async (role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'): Promise<boolean> => {
  try {
    const profile = await getMediaIDProfile(role)
    return !profile
  } catch (error) {
    console.error('Error checking role setup:', error)
    return true
  }
} 