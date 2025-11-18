/**
 * Passport Client - Event Logging
 * 
 * Logs all system events to Passport (#0) for audit trail
 * MVP Integration: Treasury, CALS, Concierto, all systems log here
 */

import { supabase } from '../supabaseClient'

/**
 * Log event to Passport
 * 
 * @param eventType - Event type (e.g., 'treasury.transaction_created')
 * @param data - Event data
 */
export async function logEvent(
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  try {
    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Determine system routing
    const systemRouting = getSystemRouting(eventType)

    // Log to Passport entries table
    await supabase.from('passport_entries').insert({
      user_id: user?.id,
      event_type: eventType,
      event_data: data,
      system_routing: systemRouting,
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'web_app',
        version: '1.0.0'
      }
    })

    console.log('[Passport] Logged event:', eventType)
  } catch (error) {
    // Don't throw - logging failure shouldn't break main flow
    console.error('[Passport] Failed to log event:', error)
  }
}

/**
 * Route events to Trinity systems
 * 
 * @param eventType - Event type
 * @returns Array of systems to route to
 */
function getSystemRouting(eventType: string): string[] {
  const routes: string[] = []
  
  // Treasury events
  if (eventType.startsWith('treasury.')) {
    routes.push('treasury', 'coliseum')
  }
  
  // Concierto events
  if (eventType.startsWith('concierto.')) {
    routes.push('concierto', 'coliseum')
  }
  
  // CALS events
  if (eventType.startsWith('cals.')) {
    routes.push('cals', 'treasury', 'coliseum')
  }
  
  // MediaID events
  if (eventType.startsWith('mediaid.')) {
    routes.push('mediaid_dna')
  }
  
  return routes
}

/**
 * Get or create session ID
 * 
 * @returns Session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }
  
  let sessionId = sessionStorage.getItem('passport_session_id')
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('passport_session_id', sessionId)
  }
  
  return sessionId
}

/**
 * Batch log multiple events
 * 
 * @param events - Array of events to log
 */
export async function logEvents(
  events: Array<{ eventType: string; data: Record<string, any> }>
): Promise<void> {
  for (const event of events) {
    await logEvent(event.eventType, event.data)
  }
}

export default {
  logEvent,
  logEvents
}

