/**
 * Ticket Checkout Card
 * 
 * Displays ticket tiers and handles purchase flow
 * Integrates with Stripe Checkout via useStripeCheckout hook
 */

'use client'

import { useState } from 'react'
import { useStripeCheckout } from '../../hooks/useStripeCheckout'
import { formatCentsToDollars } from '../../lib/treasury/ledgerService'

// =============================================================================
// TYPES
// =============================================================================

export interface TicketTier {
  id: string
  name: string
  price: number // cents
  quantity: number
  available: number
  perks: string[]
  description?: string
}

export interface TicketCheckoutCardProps {
  eventId: string
  eventTitle: string
  tiers: TicketTier[]
  userId: string
  userEmail?: string
  onPurchaseInitiated?: (tier: TicketTier) => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TicketCheckoutCard({
  eventId,
  eventTitle,
  tiers,
  userId,
  userEmail,
  onPurchaseInitiated
}: TicketCheckoutCardProps) {
  const { initiateCheckout, loading, error } = useStripeCheckout()
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null)

  /**
   * Handle ticket purchase
   */
  const handlePurchase = async (tier: TicketTier) => {
    // Check availability
    if (tier.available <= 0) {
      alert('Sorry, this tier is sold out!')
      return
    }

    setSelectedTier(tier)

    // Callback
    if (onPurchaseInitiated) {
      onPurchaseInitiated(tier)
    }

    // Initiate Stripe Checkout
    await initiateCheckout({
      productType: 'ticket',
      productId: tier.id,
      eventId: eventId,
      tier: tier.name.toLowerCase(),
      amountCents: tier.price,
      userId: userId,
      customerEmail: userEmail,
      metadata: {
        eventTitle: eventTitle,
        tierName: tier.name
      }
    })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Get Your Ticket</h3>
        <p className="text-gray-400">
          Select a ticket tier for <span className="text-white font-semibold">{eventTitle}</span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 font-semibold mb-1">Payment Error</p>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Ticket Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isSoldOut = tier.available <= 0
          const isSelected = selectedTier?.id === tier.id
          const isLowStock = tier.available <= 10 && tier.available > 0

          return (
            <div
              key={tier.id}
              className={`
                border-2 rounded-lg p-5 transition-all
                ${isSoldOut 
                  ? 'border-gray-700 bg-gray-900/50 opacity-50' 
                  : isSelected
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 hover:border-primary-500/50 bg-gray-900'
                }
              `}
            >
              {/* Tier Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xl font-bold text-white">{tier.name}</h4>
                  {tier.description && (
                    <p className="text-sm text-gray-400 mt-1">{tier.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-500">
                    {formatCentsToDollars(tier.price)}
                  </div>
                </div>
              </div>

              {/* Perks */}
              <ul className="space-y-2 mb-4">
                {tier.perks.map((perk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-300">{perk}</span>
                  </li>
                ))}
              </ul>

              {/* Availability */}
              <div className="mb-4">
                {isSoldOut ? (
                  <div className="text-red-400 text-sm font-semibold">
                    ✗ Sold Out
                  </div>
                ) : isLowStock ? (
                  <div className="text-yellow-400 text-sm font-semibold">
                    ⚠ Only {tier.available} left!
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    {tier.available} of {tier.quantity} available
                  </div>
                )}
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(tier)}
                disabled={loading || isSoldOut}
                className={`
                  w-full py-3 rounded-lg font-semibold transition-all
                  ${isSoldOut
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : loading && isSelected
                    ? 'bg-primary-600 text-white cursor-wait'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                  }
                `}
              >
                {loading && isSelected ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : isSoldOut ? (
                  'Sold Out'
                ) : (
                  'Buy Ticket'
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Powered by Stripe Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          <path d="M12 6c-1.654 0-3 1.346-3 3s1.346 3 3 3 3-1.346 3-3-1.346-3-3-3zm0 4.5c-.827 0-1.5-.673-1.5-1.5s.673-1.5 1.5-1.5 1.5.673 1.5 1.5-.673 1.5-1.5 1.5z"/>
        </svg>
        Secure payment powered by Stripe
      </div>
    </div>
  )
}

