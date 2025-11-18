/**
 * useStripeCheckout Hook
 * 
 * React hook for initiating Stripe Checkout sessions
 * Handles session creation and redirect
 */

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe (singleton)
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ''
)

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

    try {
      console.log('[useStripeCheckout] Initiating checkout:', params)

      // Validate Stripe is configured
      if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe publishable key not configured')
      }

      // Create checkout session via API
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/stripe/create-checkout-session`, {
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
      setError(errorMessage)
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

