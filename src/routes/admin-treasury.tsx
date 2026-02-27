/**
 * Treasury Admin Dashboard (moved from app/ to routes/)
 * 
 * System health monitoring and financial oversight
 * Access at: http://localhost:3000/admin/treasury (Admin only)
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  getUserBalance, 
  validateLedgerBalance,
  formatCentsToDollars,
  PLATFORM_RESERVE_ID
} from '../lib/treasury/ledgerService'

interface LedgerEntry {
  id: string
  user_id: string
  amount_cents: number
  type: 'credit' | 'debit'
  event_source: string
  reference_id: string
  correlation_id: string
  created_at: string
}

interface Payout {
  id: string
  user_id: string
  amount_cents: number
  status: string
  payout_type: string
  scheduled_for: string
  metadata: any
}

interface WebhookLog {
  id: string
  stripe_event_id: string
  event_type: string
  status: string
  created_at: string
  processed_at?: string
  error_message?: string
}

export default function TreasuryAdminDashboard() {
  const [platformBalance, setPlatformBalance] = useState<number | null>(null)
  const [ledgerValidation, setLedgerValidation] = useState<any>(null)
  const [recentEntries, setRecentEntries] = useState<LedgerEntry[]>([])
  const [pendingPayouts, setPendingPayouts] = useState<Payout[]>([])
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchData = async () => {
    try {
      setError(null)

      // Fetch platform balance
      const balance = await getUserBalance(PLATFORM_RESERVE_ID)
      setPlatformBalance(balance)

      // Validate ledger
      const validation = await validateLedgerBalance()
      setLedgerValidation(validation)

      // Fetch recent ledger entries
      const { data: entries, error: entriesError } = await supabase
        .from('ledger_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (entriesError) throw entriesError
      setRecentEntries(entries || [])

      // Fetch pending payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('scheduled_for', { ascending: true })
        .limit(20)

      if (payoutsError) throw payoutsError
      setPendingPayouts(payouts || [])

      // Fetch recent webhook logs
      const { data: webhooks, error: webhooksError } = await supabase
        .from('stripe_webhook_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15)

      if (webhooksError) throw webhooksError
      setWebhookLogs(webhooks || [])

      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching treasury data:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000)
    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Treasury Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">💰 Treasury Admin Dashboard (DIA)</h1>
            <p className="text-gray-400">System health monitoring and financial oversight</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Platform Balance */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Platform Reserve Balance</h3>
            <p className="text-3xl font-bold text-green-400">
              {platformBalance !== null ? formatCentsToDollars(platformBalance) : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Total funds held</p>
          </div>

          {/* Ledger Health */}
          <div className={`bg-gray-800 rounded-lg p-6 border-2 ${
            ledgerValidation?.isBalanced ? 'border-green-500' : 'border-red-500'
          }`}>
            <h3 className="text-sm text-gray-400 mb-2">Ledger Balance Status</h3>
            <p className="text-3xl font-bold">
              {ledgerValidation?.isBalanced ? (
                <span className="text-green-400">✅ Balanced</span>
              ) : (
                <span className="text-red-400">❌ Imbalanced</span>
              )}
            </p>
            {!ledgerValidation?.isBalanced && (
              <p className="text-xs text-red-400 mt-2">
                Imbalance: {formatCentsToDollars(ledgerValidation?.totalImbalance || 0)}
              </p>
            )}
          </div>

          {/* Pending Payouts */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Pending Payouts</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {pendingPayouts.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Total: {formatCentsToDollars(
                pendingPayouts.reduce((sum, p) => sum + p.amount_cents, 0)
              )}
            </p>
          </div>
        </div>

        {/* Recent Ledger Entries */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">📊 Recent Ledger Entries</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">User ID</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Source</th>
                  <th className="py-2 px-3">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-3 text-center text-gray-500">
                      No ledger entries yet
                    </td>
                  </tr>
                ) : (
                  recentEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-700/50">
                      <td className="py-2 px-3 text-xs text-gray-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono">
                        {entry.user_id.substring(0, 8)}...
                      </td>
                      <td className={`py-2 px-3 text-sm font-semibold ${
                        entry.type === 'credit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {entry.type === 'credit' ? '+' : '-'}
                        {formatCentsToDollars(Math.abs(entry.amount_cents))}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          entry.type === 'credit' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        {entry.event_source}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono text-gray-500">
                        {entry.correlation_id?.substring(0, 12)}...
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Payouts Queue */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">⏳ Pending Payouts Queue</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="py-2 px-3">User ID</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Scheduled For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {pendingPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-3 text-center text-gray-500">
                      No pending payouts
                    </td>
                  </tr>
                ) : (
                  pendingPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-700/50">
                      <td className="py-2 px-3 text-xs font-mono">
                        {payout.user_id.substring(0, 8)}...
                      </td>
                      <td className="py-2 px-3 text-sm font-semibold text-yellow-400">
                        {formatCentsToDollars(payout.amount_cents)}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        {payout.payout_type}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                          {payout.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-400">
                        {new Date(payout.scheduled_for).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Webhook Logs */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🔔 Recent Webhook Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Event Type</th>
                  <th className="py-2 px-3">Stripe Event ID</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {webhookLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-3 text-center text-gray-500">
                      No webhook logs yet
                    </td>
                  </tr>
                ) : (
                  webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-700/50">
                      <td className="py-2 px-3 text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        {log.event_type}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono text-gray-500">
                        {log.stripe_event_id.substring(0, 20)}...
                      </td>
                      <td className="py-2 px-3 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          log.status === 'processed' 
                            ? 'bg-green-500/20 text-green-400'
                            : log.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-red-400">
                        {log.error_message ? log.error_message.substring(0, 30) + '...' : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
            href="/test-checkout"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            Test Ticket Checkout
          </a>
        </div>
      </div>
    </div>
  )
}

