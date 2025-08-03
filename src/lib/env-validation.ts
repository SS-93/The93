interface EnvironmentConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  stripePublishableKey?: string
  appUrl: string
  apiUrl: string
  environment: string
  maxFileSize: number
  allowedFileTypes: string[]
  debugMode: boolean
  enableLogging: boolean
  googleAnalyticsId?: string
  mixpanelToken?: string
}

const requiredEnvVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_APP_URL',
  'REACT_APP_API_URL',
  'REACT_APP_ENVIRONMENT'
]

const optionalEnvVars = [
  'REACT_APP_STRIPE_PUBLISHABLE_KEY',
  'REACT_APP_GOOGLE_ANALYTICS_ID',
  'REACT_APP_MIXPANEL_TOKEN',
  'REACT_APP_MAX_FILE_SIZE',
  'REACT_APP_ALLOWED_FILE_TYPES',
  'REACT_APP_DEBUG_MODE',
  'REACT_APP_ENABLE_LOGGING'
]

export function validateEnvironment(): EnvironmentConfig {
  const missing: string[] = []
  
  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See ENVIRONMENT_SETUP.md for the complete list of required variables.'
    )
    console.error('Environment validation failed:', error.message)
    throw error
  }

  // Validate URLs
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
  const appUrl = process.env.REACT_APP_APP_URL!
  const apiUrl = process.env.REACT_APP_API_URL!

  if (!isValidUrl(supabaseUrl)) {
    throw new Error(`Invalid REACT_APP_SUPABASE_URL: ${supabaseUrl}`)
  }

  if (!isValidUrl(appUrl)) {
    throw new Error(`Invalid REACT_APP_APP_URL: ${appUrl}`)
  }

  if (!isValidUrl(apiUrl)) {
    throw new Error(`Invalid REACT_APP_API_URL: ${apiUrl}`)
  }

  // Parse configuration
  const config: EnvironmentConfig = {
    supabaseUrl,
    supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY!,
    stripePublishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    appUrl,
    apiUrl,
    environment: process.env.REACT_APP_ENVIRONMENT!,
    maxFileSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '52428800'),
    allowedFileTypes: (process.env.REACT_APP_ALLOWED_FILE_TYPES || 'audio/mpeg,audio/wav,video/mp4,image/jpeg,image/png,image/gif').split(','),
    debugMode: process.env.REACT_APP_DEBUG_MODE === 'true',
    enableLogging: process.env.REACT_APP_ENABLE_LOGGING === 'true',
    googleAnalyticsId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,
    mixpanelToken: process.env.REACT_APP_MIXPANEL_TOKEN
  }

  // Log configuration in development
  if (config.debugMode) {
    console.log('Environment configuration:', {
      ...config,
      supabaseAnonKey: config.supabaseAnonKey ? '***' : 'Not set',
      stripePublishableKey: config.stripePublishableKey ? '***' : 'Not set'
    })
  }

  return config
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Export singleton config
export const env = validateEnvironment() 