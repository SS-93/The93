import { loadStripe } from '@stripe/stripe-js'

// ── Stripe Mode Toggle ──────────────────────────────────────────────────────
// Reads REACT_APP_STRIPE_MODE from .env.local ("test" or "live")
// Then selects the matching publishable key
const stripeMode = (process.env.REACT_APP_STRIPE_MODE || 'test').toLowerCase()
const stripePublishableKey = stripeMode === 'live'
  ? process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY_LIVE
  : process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY_TEST

console.log(`[stripeClient] Mode: ${stripeMode === 'live' ? '🔴 LIVE' : '🟡 TEST'}`)
console.log(`[stripeClient] Key: ${stripePublishableKey ? stripePublishableKey.substring(0, 15) + '...' : '❌ MISSING'}`)

let stripePromise: Promise<any> | null = null

try {
  if (stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey)
  } else {
    console.warn(`⚠️ Stripe publishable key not found for ${stripeMode} mode.`)
    console.warn(`   Check REACT_APP_STRIPE_PUBLISHABLE_KEY_${stripeMode.toUpperCase()} in .env.local`)
    stripePromise = Promise.resolve(null)
  }
} catch (error) {
  console.error('❌ Failed to load Stripe (likely blocked by ad blocker):', error)
  stripePromise = Promise.resolve(null)
}

stripePromise?.catch((error) => {
  console.error('❌ Stripe failed to initialize:', error)
  return null
})

export default stripePromise