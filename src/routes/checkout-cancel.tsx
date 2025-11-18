/**
 * Checkout Cancel Page
 * 
 * Shown when user cancels Stripe payment
 * Access at: http://localhost:3000/checkout/cancel
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CheckoutCancelPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md mx-auto text-center">
        {/* Cancel Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 border-2 border-yellow-500 rounded-full mb-6">
          <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-400 mb-8">
          Your payment was cancelled. No charges were made to your card.
        </p>

        {/* Info Box */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8 text-left">
          <h3 className="font-semibold text-white mb-3">What happened?</h3>
          <p className="text-sm text-gray-400 mb-4">
            You cancelled the checkout process before completing your payment. 
            Your ticket was not purchased and no charges were made.
          </p>
          
          <h3 className="font-semibold text-white mb-3">Want to try again?</h3>
          <p className="text-sm text-gray-400">
            You can return to the event page to purchase your ticket. 
            Tickets may sell out quickly, so don't wait too long!
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate(-2)} // Go back 2 pages (skip the checkout)
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600"
          >
            Return to Event
          </button>
          <button
            onClick={() => navigate('/events')}
            className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            Browse All Events
          </button>
          <button
            onClick={() => navigate('/dashboard/fan')}
            className="w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 border border-gray-700"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-8">
          Having trouble with checkout? Contact support at support@buckets.media
        </p>
      </div>
    </div>
  )
}

