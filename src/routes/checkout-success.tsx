/**
 * Checkout Success Page
 * 
 * Shown after successful Stripe payment
 * Access at: http://localhost:3000/checkout/success?session_id=...
 */

import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ReceiptModal, ReceiptData } from '../components/treasury/ReceiptModal'

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        // Look up the purchase by Stripe checkout session ID
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .select('*')
          .eq('stripe_checkout_session_id', sessionId)
          .single()

        if (purchaseError) throw purchaseError

        // Look up the ticket
        const { data: ticket, error: ticketError } = await supabase
          .from('event_tickets')
          .select('*')
          .eq('purchase_id', purchase.id)
          .single()

        setPurchaseDetails({ ...purchase, ticket })

        // Transform to ReceiptData format
        const receipt: ReceiptData = {
          purchaseId: purchase.id,
          sessionId: sessionId,
          items: [{
            name: ticket?.tier_display_name || 'Event Ticket',
            description: ticket?.event_title,
            quantity: 1,
            priceCents: purchase.amount_cents
          }],
          subtotalCents: purchase.amount_cents,
          totalCents: purchase.amount_cents,
          currency: purchase.currency || 'usd',
          event: ticket ? {
            title: ticket.event_title || 'Event',
            date: ticket.event_date,
            venue: ticket.event_venue || 'TBA',
            imageUrl: ticket.event_image_url
          } : undefined,
          paymentMethod: {
            type: 'card',
            last4: '••••', // We don't store this, Stripe does
            brand: 'Card'
          },
          ticketNumber: ticket?.ticket_number,
          tier: ticket?.tier,
          purchasedAt: purchase.created_at
        }

        setReceiptData(receipt)
        setShowReceipt(true)
        setLoading(false)
      } catch (err: any) {
        console.error('Error fetching purchase:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    // Wait a few seconds to allow webhook to process
    const timer = setTimeout(fetchPurchaseDetails, 3000)
    return () => clearTimeout(timer)
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-400 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Processing Your Purchase...
          </h2>
          <p className="text-gray-400">
            We're confirming your payment and issuing your ticket. This should only take a moment.
          </p>
        </div>
      </div>
    )
  }

  if (error || !purchaseDetails) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Payment Received!
          </h2>
          <p className="text-gray-400 mb-6">
            Your payment was successful. Your ticket is being processed and will appear in your account shortly.
          </p>
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6 text-sm text-left">
            <strong className="block mb-2">What's next?</strong>
            <ul className="list-disc ml-4 space-y-1">
              <li>Check your email for a receipt</li>
              <li>Your ticket will be available in your dashboard within 1-2 minutes</li>
              <li>You'll receive a confirmation email with your ticket details</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/dashboard/fan')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={receiptData}
      />

      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Your ticket has been issued
          </p>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowReceipt(true)}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
            >
              View Receipt
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
            >
              View My Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
