import React from 'react'
import { supabase } from './supabaseClient'

export interface ParticipantSession {
  email?: string
  name?: string
  sessionToken: string
  eventId: string
  shareableCode: string
  canVote: boolean
  hasVoted: boolean
  votesRemaining: number
  registeredAt: string
  lastActive: string
}

export interface AccessPersistenceConfig {
  enableCookies: boolean
  enableLocalStorage: boolean
  enableNameMatching: boolean
  sessionExpireDays: number
}

const DEFAULT_CONFIG: AccessPersistenceConfig = {
  enableCookies: true,
  enableLocalStorage: true,
  enableNameMatching: true,
  sessionExpireDays: 7
}

/**
 * Access Persistence Manager
 * Handles multiple strategies for maintaining user voting access
 */
export class AccessPersistenceManager {
  private config: AccessPersistenceConfig

  constructor(config: Partial<AccessPersistenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ===== SESSION STORAGE =====

  /**
   * Store session using multiple persistence methods
   */
  async storeSession(session: ParticipantSession): Promise<void> {
    const sessionData = {
      ...session,
      lastActive: new Date().toISOString()
    }

    // 1. Local Storage (primary)
    if (this.config.enableLocalStorage) {
      try {
        localStorage.setItem(
          `voting_session_${session.shareableCode}`,
          JSON.stringify(sessionData)
        )
      } catch (error) {
        console.warn('Failed to store in localStorage:', error)
      }
    }

    // 2. Cookies (cross-tab persistence)
    if (this.config.enableCookies) {
      try {
        const expires = new Date()
        expires.setDate(expires.getDate() + this.config.sessionExpireDays)

        document.cookie = `voting_token_${session.shareableCode}=${session.sessionToken}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
        document.cookie = `voting_name_${session.shareableCode}=${encodeURIComponent(session.name || '')}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
      } catch (error) {
        console.warn('Failed to store cookies:', error)
      }
    }

    // 3. Database backup (for cross-device access)
    try {
      await supabase.from('participant_sessions').upsert({
        session_token: session.sessionToken,
        event_id: session.eventId,
        participant_email: session.email,
        participant_name: session.name,
        shareable_code: session.shareableCode,
        session_data: sessionData,
        last_active: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.config.sessionExpireDays * 24 * 60 * 60 * 1000).toISOString()
      })
    } catch (error) {
      console.warn('Failed to store session in database:', error)
    }
  }

  /**
   * Retrieve session using multiple methods
   */
  async getSession(shareableCode: string): Promise<ParticipantSession | null> {
    // 1. Try Local Storage first (fastest)
    if (this.config.enableLocalStorage) {
      try {
        const stored = localStorage.getItem(`voting_session_${shareableCode}`)
        if (stored) {
          const session = JSON.parse(stored) as ParticipantSession
          if (!this.isSessionExpired(session)) {
            await this.updateLastActive(session)
            return session
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error)
      }
    }

    // 2. Try Cookies
    if (this.config.enableCookies) {
      const sessionToken = this.getCookie(`voting_token_${shareableCode}`)
      if (sessionToken) {
        // Try to restore session from database using token
        const session = await this.getSessionFromDatabase(sessionToken)
        if (session) {
          await this.storeSession(session) // Re-store in local storage
          return session
        }
      }
    }

    return null
  }

  /**
   * Name-based session recovery
   * If user lost their session but remembers their name/email
   */
  async recoverSessionByName(shareableCode: string, name: string, email?: string): Promise<ParticipantSession | null> {
    if (!this.config.enableNameMatching) return null

    try {
      let query = supabase
        .from('participant_sessions')
        .select('*')
        .eq('shareable_code', shareableCode)
        .gt('expires_at', new Date().toISOString())

      if (email) {
        query = query.eq('participant_email', email)
      } else {
        query = query.ilike('participant_name', `%${name}%`)
      }

      const { data: sessions } = await query

      if (sessions && sessions.length > 0) {
        const sessionData = sessions[0].session_data as ParticipantSession
        await this.storeSession(sessionData) // Re-store locally
        return sessionData
      }
    } catch (error) {
      console.error('Failed to recover session by name:', error)
    }

    return null
  }

  /**
   * Generate memorable participant code
   * Makes it easier for users to remember their access
   */
  generateMemorableCode(): string {
    const adjectives = ['Happy', 'Lucky', 'Bright', 'Swift', 'Bold', 'Kind', 'Cool', 'Star']
    const animals = ['Lion', 'Eagle', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Tiger', 'Owl']
    const numbers = Math.floor(Math.random() * 99) + 1

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const animal = animals[Math.floor(Math.random() * animals.length)]

    return `${adjective}${animal}${numbers}`
  }

  // ===== EMAIL INTEGRATION =====

  /**
   * Send session recovery email
   */
  async sendRecoveryEmail(email: string, shareableCode: string): Promise<boolean> {
    try {
      const session = await this.recoverSessionByName(shareableCode, '', email)
      if (!session) return false

      await supabase.functions.invoke('send-recovery-email', {
        body: {
          email,
          shareableCode,
          sessionToken: session.sessionToken,
          name: session.name
        }
      })

      return true
    } catch (error) {
      console.error('Failed to send recovery email:', error)
      return false
    }
  }

  /**
   * Quick access link generation
   * Creates a link that auto-restores session
   */
  generateQuickAccessLink(session: ParticipantSession): string {
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      token: session.sessionToken,
      code: session.shareableCode,
      restore: 'true'
    })

    return `${baseUrl}/vote/${session.shareableCode}?${params.toString()}`
  }

  // ===== UTILITY METHODS =====

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  private isSessionExpired(session: ParticipantSession): boolean {
    const lastActive = new Date(session.lastActive)
    const expiry = new Date(lastActive.getTime() + this.config.sessionExpireDays * 24 * 60 * 60 * 1000)
    return new Date() > expiry
  }

  private async updateLastActive(session: ParticipantSession): Promise<void> {
    session.lastActive = new Date().toISOString()
    await this.storeSession(session)
  }

  private async getSessionFromDatabase(sessionToken: string): Promise<ParticipantSession | null> {
    try {
      const { data, error } = await supabase
        .from('participant_sessions')
        .select('session_data')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) throw error
      return data?.session_data || null
    } catch (error) {
      console.warn('Failed to get session from database:', error)
      return null
    }
  }

  /**
   * Clear all session data (logout)
   */
  async clearSession(shareableCode: string): Promise<void> {
    // Clear localStorage
    try {
      localStorage.removeItem(`voting_session_${shareableCode}`)
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }

    // Clear cookies
    try {
      document.cookie = `voting_token_${shareableCode}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `voting_name_${shareableCode}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    } catch (error) {
      console.warn('Failed to clear cookies:', error)
    }
  }
}

// Create default instance
export const accessPersistence = new AccessPersistenceManager()

// React Hook for easy component integration
export const useAccessPersistence = (shareableCode: string) => {
  const [session, setSession] = React.useState<ParticipantSession | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadSession()
  }, [shareableCode])

  const loadSession = async () => {
    setLoading(true)
    try {
      const session = await accessPersistence.getSession(shareableCode)
      setSession(session)
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setLoading(false)
    }
  }

  const storeSession = async (sessionData: ParticipantSession) => {
    await accessPersistence.storeSession(sessionData)
    setSession(sessionData)
  }

  const recoverByName = async (name: string, email?: string) => {
    const recovered = await accessPersistence.recoverSessionByName(shareableCode, name, email)
    if (recovered) {
      setSession(recovered)
      return true
    }
    return false
  }

  const clearSession = async () => {
    await accessPersistence.clearSession(shareableCode)
    setSession(null)
  }

  return {
    session,
    loading,
    storeSession,
    recoverByName,
    clearSession,
    reload: loadSession
  }
}