/**
 * Treasury Test Page (moved from app/ to routes/)
 * 
 * Manual testing interface for Treasury Protocol functions
 * Access at: http://localhost:3000/test-treasury
 */

import React, { useState } from 'react'
import { 
  createPairedEntries, 
  getUserBalance,
  validateLedgerBalance,
  formatCentsToDollars,
  PLATFORM_RESERVE_ID
} from '../lib/treasury/ledgerService'
import { applySplits } from '../lib/treasury/splitEngine'
import { queuePayout } from '../lib/treasury/payoutScheduler'

export default function TestTreasuryPage() {
  const [testUserId, setTestUserId] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Test: Create a mock purchase
  const handleMockPurchase = async () => {
    if (!testUserId) {
      setMessage('❌ Please enter a test user ID first')
      return
    }

    setLoading(true)
    setMessage('Creating mock $50 ticket purchase...')

    try {
      // Create paired entries (buyer pays $50)
      const correlationId = await createPairedEntries({
        debitUserId: testUserId,
        creditUserId: PLATFORM_RESERVE_ID,
        amountCents: 5000,
        eventSource: 'stripe_charge',
        referenceId: `test_purchase_${Date.now()}`,
        description: 'Test ticket purchase',
        metadata: {
          test: true,
          eventId: 'test_event_123',
          tier: 'vip'
        }
      })

      setMessage(`✅ Purchase created! Correlation ID: ${correlationId}`)
      
      // Refresh balance
      const newBalance = await getUserBalance(testUserId)
      setBalance(newBalance)

    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Test: Apply splits
  const handleApplySplits = async () => {
    setLoading(true)
    setMessage('Applying revenue splits (70% artist, 20% platform, 10% host)...')

    try {
      await applySplits({
        purchaseId: 'test_purchase',
        amountCents: 5000,
        entityType: 'event',
        entityId: 'test_event_123'
      })

      setMessage('✅ Splits applied! Check ledger_entries table.')
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Test: Queue payout
  const handleQueuePayout = async () => {
    if (!testUserId) {
      setMessage('❌ Please enter a test user ID first')
      return
    }

    setLoading(true)
    setMessage('Queueing payout for $35 (artist share)...')

    try {
      const payout = await queuePayout({
        userId: testUserId,
        amountCents: 3500,
        payoutType: 'scheduled',
        metadata: { test: true }
      })

      setMessage(`✅ Payout queued! ID: ${payout.id}`)
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Test: Get balance
  const handleGetBalance = async () => {
    if (!testUserId) {
      setMessage('❌ Please enter a test user ID first')
      return
    }

    setLoading(true)
    try {
      const userBalance = await getUserBalance(testUserId)
      setBalance(userBalance)
      setMessage(`Balance: ${formatCentsToDollars(userBalance)}`)
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Test: Validate ledger
  const handleValidateLedger = async () => {
    setLoading(true)
    setMessage('Validating ledger balance...')

    try {
      const result = await validateLedgerBalance()
      setValidationResult(result)
      
      if (result.isBalanced) {
        setMessage('✅ Ledger is balanced!')
      } else {
        setMessage(`❌ LEDGER IMBALANCE: ${formatCentsToDollars(result.totalImbalance)}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🏦 Treasury Test Page</h1>
          <p className="text-gray-400">
            Manual testing interface for Treasury Protocol functions
          </p>
          <div className="mt-4 bg-blue-500/20 border border-blue-500 rounded p-3 text-sm">
            <strong>⚠️ Setup Required:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Run database migration: <code className="bg-gray-800 px-2 py-1 rounded">007_treasury_complete.sql</code></li>
              <li>Get a test user ID from your <code className="bg-gray-800 px-2 py-1 rounded">auth.users</code> table</li>
              <li>Enter it below to test</li>
            </ol>
          </div>
        </div>

        {/* Test User ID Input */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test User Configuration</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">
                Test User ID (UUID from auth.users)
              </label>
              <input
                type="text"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white font-mono"
              />
            </div>
            <button
              onClick={handleGetBalance}
              disabled={loading || !testUserId}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Get Balance
            </button>
          </div>
          {balance !== null && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded">
              <strong>Current Balance:</strong> {formatCentsToDollars(balance)}
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mock Purchase */}
            <button
              onClick={handleMockPurchase}
              disabled={loading || !testUserId}
              className="p-4 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 text-left"
            >
              <div className="text-lg font-semibold mb-1">1. Create Mock Purchase</div>
              <div className="text-sm opacity-80">
                Simulate $50 ticket purchase<br/>
                Creates paired ledger entries
              </div>
            </button>

            {/* Apply Splits */}
            <button
              onClick={handleApplySplits}
              disabled={loading}
              className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-left"
            >
              <div className="text-lg font-semibold mb-1">2. Apply Splits</div>
              <div className="text-sm opacity-80">
                Split $50 revenue<br/>
                70% artist, 20% platform, 10% host
              </div>
            </button>

            {/* Queue Payout */}
            <button
              onClick={handleQueuePayout}
              disabled={loading || !testUserId}
              className="p-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-left"
            >
              <div className="text-lg font-semibold mb-1">3. Queue Payout</div>
              <div className="text-sm opacity-80">
                Queue $35 artist payout<br/>
                Scheduled for next batch
              </div>
            </button>

            {/* Validate Ledger */}
            <button
              onClick={handleValidateLedger}
              disabled={loading}
              className="p-4 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 text-left"
            >
              <div className="text-lg font-semibold mb-1">4. Validate Ledger</div>
              <div className="text-sm opacity-80">
                Check ledger balance<br/>
                Should always be 0
              </div>
            </button>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`bg-gray-800 rounded-lg p-6 mb-6 border-2 ${
            validationResult.isBalanced ? 'border-green-500' : 'border-red-500'
          }`}>
            <h2 className="text-xl font-semibold mb-4">Ledger Validation Result</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-bold ${
                  validationResult.isBalanced ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validationResult.isBalanced ? '✅ BALANCED' : '❌ IMBALANCED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Imbalance:</span>
                <span className="font-mono">
                  {formatCentsToDollars(validationResult.totalImbalance)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.startsWith('✅') ? 'bg-green-500/20 border border-green-500' :
            message.startsWith('❌') ? 'bg-red-500/20 border border-red-500' :
            'bg-blue-500/20 border border-blue-500'
          }`}>
            {message}
          </div>
        )}

        {/* Database Queries */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Verification Queries</h2>
          <p className="text-sm text-gray-400 mb-4">
            Run these in Supabase SQL Editor to verify data:
          </p>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold mb-1">Check Ledger Entries:</div>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`SELECT id, user_id, amount_cents, type, event_source, correlation_id, created_at 
FROM ledger_entries 
ORDER BY created_at DESC 
LIMIT 10;`}
              </pre>
            </div>
            <div>
              <div className="text-sm font-semibold mb-1">Check Payouts:</div>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`SELECT id, user_id, amount_cents, status, payout_type, scheduled_for 
FROM payouts 
WHERE status = 'pending';`}
              </pre>
            </div>
            <div>
              <div className="text-sm font-semibold mb-1">Validate Balance:</div>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`SELECT * FROM validate_ledger_balance();`}
              </pre>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/test-checkout"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            Test Ticket Checkout
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

