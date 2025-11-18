/**
 * Ticket Checkout Test Page
 * 
 * Demonstrates the TicketCheckoutCard component
 * Access at: http://localhost:3000/test-checkout
 */

import React, { useState, useEffect } from 'react'
import TicketCheckoutCard from '../components/concierto/TicketCheckoutCard'
import { supabase } from '../lib/supabaseClient'

export default function TestCheckoutPage() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Get current user
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || '')
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  // Sample ticket tiers
  const sampleTiers = [
    {
      id: 'tier_general',
      name: 'General',
      price: 2000, // $20.00
      quantity: 100,
      available: 85,
      description: 'Standard admission',
      perks: [
        'General admission',
        'Access to main floor',
        'Cash bar available',
        'Commemorative poster'
      ]
    },
    {
      id: 'tier_vip',
      name: 'VIP',
      price: 5000, // $50.00
      quantity: 50,
      available: 12, // Low stock!
      description: 'Premium experience',
      perks: [
        'All General perks',
        'VIP lounge access',
        'Complimentary drinks',
        'Meet & greet with artists',
        'Exclusive merch bundle',
        'Priority entry'
      ]
    },
    {
      id: 'tier_backstage',
      name: 'Backstage',
      price: 10000, // $100.00
      quantity: 20,
      available: 20,
      description: 'Ultimate backstage access',
      perks: [
        'All VIP perks',
        'Backstage tour',
        'Soundcheck access',
        'Photo with headliner',
        'Signed setlist',
        'Private after-party invite'
      ]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎫 Ticket Checkout Test</h1>
          <p className="text-gray-400">
            Test the Stripe Checkout integration with sample ticket tiers
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">⚙️ Setup Required</h2>
          <ol className="list-decimal ml-4 space-y-2 text-sm">
            <li>
              <strong>Add Stripe Keys to .env:</strong>
              <pre className="bg-gray-900 p-2 rounded mt-1 text-xs overflow-x-auto">
{`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...`}
              </pre>
            </li>
            <li>
              <strong>Install Stripe package:</strong>
              <code className="bg-gray-900 px-2 py-1 rounded ml-1">
                npm install stripe @stripe/stripe-js
              </code>
            </li>
            <li>
              <strong>Run database migration:</strong>
              <code className="bg-gray-900 px-2 py-1 rounded ml-1">
                007_treasury_complete.sql
              </code>
            </li>
            <li>
              <strong>Start Stripe CLI webhook forwarding:</strong>
              <code className="bg-gray-900 px-2 py-1 rounded ml-1 block mt-1">
                stripe listen --forward-to localhost:3000/api/stripe/webhook
              </code>
            </li>
          </ol>
        </div>

        {/* User Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">👤 Current User</h2>
          {userId ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-gray-400">User ID:</span>
                <code className="bg-gray-900 px-3 py-1 rounded text-sm font-mono">
                  {userId}
                </code>
              </div>
              {userEmail && (
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">Email:</span>
                  <code className="bg-gray-900 px-3 py-1 rounded text-sm">
                    {userEmail}
                  </code>
                </div>
              )}
              <div className="text-green-400 text-sm mt-2">✓ Ready to test checkout</div>
            </div>
          ) : (
            <div className="text-yellow-400">
              ⚠️ No user logged in. Please sign in to test checkout.
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Event Poster */}
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
              🎵
            </div>
            
            {/* Event Details */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">Underground Beats Showcase</h2>
              <div className="space-y-1 text-gray-300 mb-4">
                <p className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Friday, December 15, 2025 • 9:00 PM</span>
                </p>
                <p className="flex items-center gap-2">
                  <span>📍</span>
                  <span>The Warehouse • Los Angeles, CA</span>
                </p>
                <p className="flex items-center gap-2">
                  <span>🎤</span>
                  <span>Featuring: DJ Shadow, Bonobo, Four Tet</span>
                </p>
              </div>
              <p className="text-gray-400 text-sm">
                Join us for an unforgettable night of cutting-edge electronic music in an intimate warehouse setting.
                Limited capacity for the ultimate underground experience.
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Checkout Card */}
        {userId ? (
          <TicketCheckoutCard
            eventId="test_event_123"
            eventTitle="Underground Beats Showcase"
            tiers={sampleTiers}
            userId={userId}
            userEmail={userEmail}
            onPurchaseInitiated={(tier) => {
              console.log('Purchase initiated for tier:', tier.name)
            }}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <p className="text-gray-400 mb-4">
              Please sign in to view ticket options
            </p>
            <a 
              href="/login"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600"
            >
              Sign In
            </a>
          </div>
        )}

        {/* Testing Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">🧪 Testing Instructions</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">1. Test with Stripe Test Cards</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Success:</strong>{' '}
                  <code className="bg-gray-900 px-2 py-0.5 rounded">4242 4242 4242 4242</code>
                </li>
                <li>
                  <strong>Decline:</strong>{' '}
                  <code className="bg-gray-900 px-2 py-0.5 rounded">4000 0000 0000 0002</code>
                </li>
                <li>
                  <strong>3D Secure:</strong>{' '}
                  <code className="bg-gray-900 px-2 py-0.5 rounded">4000 0027 6000 3184</code>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">2. Watch the Flow</h3>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Click "Buy Ticket" on any tier</li>
                <li>Redirects to Stripe Checkout</li>
                <li>Enter test card details</li>
                <li>Complete payment</li>
                <li>Redirects to success page</li>
                <li>Webhook processes in background</li>
                <li>Check database for purchase + ledger entries</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">3. Verify in Database</h3>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`-- Check purchase
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 1;

-- Check ledger entries
SELECT * FROM ledger_entries ORDER BY created_at DESC LIMIT 10;

-- Check ticket issued
SELECT * FROM event_tickets ORDER BY created_at DESC LIMIT 1;`}
              </pre>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/test-treasury"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            Test Treasury Functions
          </a>
          <a
            href="/admin/treasury"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            View Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

