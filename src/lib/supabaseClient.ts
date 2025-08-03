import { createClient } from '@supabase/supabase-js'
import { env } from './env-validation'

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Export types for better TypeScript support
export type { User, Session } from '@supabase/supabase-js'

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
} 