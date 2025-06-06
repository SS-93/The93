import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
const stripePromise = loadStripe(stripePublishableKey)

export default stripePromise 