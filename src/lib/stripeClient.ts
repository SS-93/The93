import { loadStripe } from '@stripe/stripe-js'

// Add error handling for ad blockers
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY

let stripePromise: Promise<any> | null = null

try {
  if (stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey)
  } else {
    console.warn('⚠️ Stripe publishable key not found. Payment features will be disabled.')
    // Create a mock stripe instance for development
    stripePromise = Promise.resolve(null)
  }
} catch (error) {
  console.error('❌ Failed to load Stripe (likely blocked by ad blocker):', error)
  // Fallback for when Stripe is blocked
  stripePromise = Promise.resolve(null)
}

// Handle the case where Stripe fails to load
stripePromise?.catch((error) => {
  console.error('❌ Stripe failed to initialize:', error)
  console.log('💡 This is usually caused by:')
  console.log('   - Ad blockers blocking Stripe')
  console.log('   - Network connectivity issues')
  console.log('   - Missing REACT_APP_STRIPE_PUBLISHABLE_KEY')
  return null
})

export default stripePromise 