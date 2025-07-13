import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://iutnwgvzwyupsuguxnls.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dG53Z3Z6d3l1cHN1Z3V4bmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MzQ4MTgsImV4cCI6MjA2NTExMDgxOH0.aC_YpMkzDJrhgf2KkGf2iFB6kZeCUCEk9dm-disMT7U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) 