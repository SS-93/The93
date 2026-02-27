/**
 * useStripeCheckout Hook
 * 
 * React hook for initiating Stripe Checkout sessions
 * Handles session creation and redirect
 */

import { useState } from 'react'
import stripePromise from '../lib/stripeClient'

// Debug: confirm mode at module load
const stripeMode = process.env.REACT_APP_STRIPE_MODE || 'test'
console.log(`[useStripeCheckout] Running in ${stripeMode === 'live' ? '🔴 LIVE' : '🟡 TEST'} mode`)

// =============================================================================
// TYPES
// =============================================================================

export interface CheckoutParams {
  productType: string
  productId: string
  eventId?: string
  tier?: string
  amountCents: number
  userId: string
  customerEmail?: string
  metadata?: Record<string, string>
}

export interface CheckoutResponse {
  sessionId: string
  url?: string
}

// =============================================================================
// HOOK
// =============================================================================

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  /**
   * Initiate Stripe Checkout
   * 
   * Creates a checkout session and redirects user to Stripe Checkout
   * 
   * @param params - Checkout parameters
   */
  const initiateCheckout = async (params: CheckoutParams) => {
    setLoading(true)
    setError(null)
    setSessionId(null)

    // Create checkout session via API
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000'
    const endpoint = `${apiUrl}/stripe/create-checkout-session`

    try {
      console.log('[useStripeCheckout] Initiating checkout:', params)

      // Validate Stripe is configured
      const mode = process.env.REACT_APP_STRIPE_MODE || 'test'
      const keyVar = mode === 'live'
        ? process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY_LIVE
        : process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY_TEST
      if (!keyVar) {
        throw new Error(`Stripe publishable key not configured for ${mode} mode. Check REACT_APP_STRIPE_PUBLISHABLE_KEY_${mode.toUpperCase()} in .env.local`)
      }

      console.log('[useStripeCheckout] API URL:', apiUrl)
      console.log('[useStripeCheckout] Endpoint:', endpoint)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'payment',
          intent: 'purchase',
          ...params,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data: CheckoutResponse = await response.json()

      console.log('[useStripeCheckout] Session created:', data.sessionId)
      setSessionId(data.sessionId)

      // Load Stripe and redirect to checkout
      const stripe = await stripePromise

      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      console.log('[useStripeCheckout] Redirecting to Stripe Checkout...')

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Something went wrong'

      // Enhanced error logging
      if (err.message === 'Failed to fetch') {
        console.error('[useStripeCheckout] Connection Error Details:', {
          apiUrl,
          endpoint,
          error: err,
          message: 'Cannot connect to backend server. Is it running on port 8000?'
        })
        setError('Cannot connect to server. Please ensure the backend is running on port 8000.')
      } else {
        setError(errorMessage)
      }

      console.error('[useStripeCheckout] Error:', errorMessage, err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset error state
   */
  const clearError = () => {
    setError(null)
  }

  return {
    initiateCheckout,
    loading,
    error,
    sessionId,
    clearError
  }
}

export default useStripeCheckout

