import { supabase } from './supabaseClient'
import { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export const signUp = async (email: string, password: string, userMetadata?: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata || {}
      }
    })
    
    if (error) {
      console.error('Supabase signup error:', error)
      
      // Check for placeholder URL error
      if (error.message?.includes('placeholder') || error.message?.includes('NAME_NOT_RESOLVED')) {
        return { 
          data: null, 
          error: { 
            message: 'Environment configuration error. Please create a .env.local file with your Supabase credentials and restart the development server.' 
          } 
        }
      }
      
      return { data: null, error: { message: error.message || 'Failed to create account' } }
    }

    // If user was created successfully, create the database records
    if (data.user) {
      await createUserProfile(data.user, userMetadata)
    }
    
    return { data, error }
  } catch (err: any) {
    console.error('Network error during signup:', err)
    
    // Check for placeholder URL in network errors
    if (err.message?.includes('placeholder') || err.message?.includes('NAME_NOT_RESOLVED')) {
      return { 
        data: null, 
        error: { 
          message: 'Missing Supabase configuration. Please set up your .env.local file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY, then restart the server.' 
        }
      }
    }
    
    return { 
      data: null, 
      error: { message: 'Unable to connect to authentication service. Please check your internet connection and environment configuration.' }
    }
  }
}

// Helper function to create initial user profile and MediaID
const createUserProfile = async (user: any, userMetadata: any) => {
  try {
    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: userMetadata?.display_name || '',
        role: userMetadata?.role || 'fan',
        email_verified: false,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't throw - let onboarding handle this
    }

    // Create initial MediaID record
    const { error: mediaIdError } = await supabase
      .from('media_ids')
      .insert({
        user_uuid: user.id,
        interests: [],
        genre_preferences: [],
        content_flags: {},
        privacy_settings: {
          data_sharing: true,
          location_access: false,
          audio_capture: false,
          anonymous_logging: true,
          marketing_communications: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (mediaIdError) {
      console.error('MediaID creation error:', mediaIdError)
      // Don't throw - let onboarding handle this
    }

    console.log('✅ User profile and MediaID created successfully')
  } catch (error) {
    console.error('Error creating user profile:', error)
    // Don't throw - let the signup succeed and onboarding handle missing records
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Supabase signin error:', error)
      
      // Check for placeholder URL error
      if (error.message?.includes('placeholder') || error.message?.includes('NAME_NOT_RESOLVED')) {
        return { 
          data: null, 
          error: { 
            message: 'Environment configuration error. Please create a .env.local file with your Supabase credentials and restart the development server.' 
          } 
        }
      }
      
      return { data: null, error: { message: error.message || 'Failed to sign in' } }
    }
    
    return { data, error }
  } catch (err: any) {
    console.error('Network error during signin:', err)
    
    // Check for placeholder URL in network errors
    if (err.message?.includes('placeholder') || err.message?.includes('NAME_NOT_RESOLVED')) {
      return { 
        data: null, 
        error: { 
          message: 'Missing Supabase configuration. Please set up your .env.local file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY, then restart the server.' 
        }
      }
    }
    
    return { 
      data: null, 
      error: { message: 'Unable to connect to authentication service. Please check your internet connection and environment configuration.' }
    }
  }
}

export const signInWithOAuth = async (provider: 'google' | 'facebook') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/onboarding`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  return { data, error }
} 