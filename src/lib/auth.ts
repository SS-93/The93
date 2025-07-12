import { supabase } from './supabaseClient'
import { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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