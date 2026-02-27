/**
 * =============================================================================
 * useTreasury CUSTOM HOOK
 * =============================================================================
 * 
 * Part of: Buckets V2 Trinity → Treasury System
 * V2 Living Index: #2 Treasury Protocol (Central Bank)
 * Frontend Architecture: hooks/useTreasury.tsx
 * 
 * PURPOSE:
 * React hook providing access to all Treasury operations:
 * - Fetch account balance and transaction history
 * - Subscribe to real-time transaction updates
 * - Request payouts
 * - Track attribution revenue (CALS)
 * - Manage subscription tiers
 * 
 * USE CASES:
 * - TreasuryDashboard component: Display financial overview
 * - AttributionWidget component: Show CALS earnings
 * - PayoutQueue component: Admin payout management
 * - SubscriptionManager component: Tier selection
 * 
 * INTEGRATION POINTS:
 * - Consumes: treasury_* tables (Supabase)
 * - Integrates: Stripe for payments
 * - Tracks: CALS attribution revenue
 * - Real-time: Supabase Realtime subscriptions for live balance updates
 * 
 * EXAMPLE USAGE:
 * ```tsx
 * const { account, transactions, loading, requestPayout } = useTreasury(userId)
 * 
 * // Request payout
 * await requestPayout(5000) // $50.00 in cents
 * 
 * // Display balance
 * <div>Balance: ${(account.balance_cents / 100).toFixed(2)}</div>
 * ```
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryDashboardData,
  TimeRange,
  PayoutRequest
} from '@/types/treasury'

// =============================================================================
// HOOK INTERFACE
// =============================================================================

interface UseTreasuryReturn {
  // Account data
  account: TreasuryAccount | null
  transactions: TreasuryTransaction[]
  dashboardData: TreasuryDashboardData | null
  loading: boolean
  error: Error | null

  // Operations
  refreshAccount: () => Promise<void>
  fetchTransactions: (limit?: number, timeRange?: TimeRange) => Promise<TreasuryTransaction[]>
  requestPayout: (amountCents: number) => Promise<PayoutRequest>
  fetchDashboardData: (timeRange?: TimeRange) => Promise<TreasuryDashboardData>
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * useTreasury Hook
 * 
 * Provides access to all Treasury operations for a user
 * 
 * @param userId - User ID to manage Treasury for
 * @param options - Hook options
 * @returns Treasury operations and state
 */
export function useTreasury(
  userId?: string,
  options?: {
    autoFetch?: boolean        // Auto-fetch account on mount (default: true)
    realtime?: boolean         // Subscribe to real-time updates (default: false)
    fetchTransactions?: boolean // Auto-fetch transactions (default: false)
  }
): UseTreasuryReturn {
  // State
  const [account, setAccount] = useState<TreasuryAccount | null>(null)
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([])
  const [dashboardData, setDashboardData] = useState<TreasuryDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Options with defaults
  const autoFetch = options?.autoFetch !== false
  const realtime = options?.realtime === true
  const shouldFetchTransactions = options?.fetchTransactions === true

  // =============================================================================
  // FETCH ACCOUNT
  // =============================================================================

  /**
   * Fetch user's Treasury account
   */
  const fetchAccount = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`[useTreasury] Fetching account for user ${id}`)

      // Calculate balance from ledger_entries (the actual source of truth)
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('ledger_entries')
        .select('amount_cents, type, event_source')
        .eq('user_id', id)

      if (ledgerError) throw ledgerError

      let balance = 0
      let lifetimeEarned = 0
      let lifetimeWithdrawn = 0
      let pending = 0

      if (ledgerData) {
        for (const entry of ledgerData) {
          if (entry.type === 'credit') {
            balance += entry.amount_cents
            lifetimeEarned += entry.amount_cents
          } else if (entry.type === 'debit') {
            balance -= entry.amount_cents
            if (entry.event_source === 'payout') {
              lifetimeWithdrawn += entry.amount_cents
            }
          }
        }
      }

      console.log(`[useTreasury] Balance computed from ledger: $${(balance / 100).toFixed(2)}`)

      // Build a TreasuryAccount-compatible object from ledger data
      setAccount({
        user_id: id,
        balance_cents: balance,
        pending_cents: pending,
        lifetime_earned_cents: lifetimeEarned,
        lifetime_withdrawn_cents: lifetimeWithdrawn,
        auto_payout_enabled: false,
        auto_payout_threshold_cents: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as TreasuryAccount)

    } catch (err) {
      console.error('[useTreasury] Error fetching account:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])


  /**
   * Refresh account (public API)
   */
  const refreshAccount = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID required to refresh account')
    }
    await fetchAccount(userId)
  }, [userId, fetchAccount])

  // =============================================================================
  // FETCH TRANSACTIONS
  // =============================================================================

  /**
   * Fetch user's transaction history
   */
  const fetchTransactions = useCallback(async (
    limit: number = 50,
    timeRange?: TimeRange
  ): Promise<TreasuryTransaction[]> => {
    if (!userId) {
      throw new Error('User ID required to fetch transactions')
    }

    try {
      console.log(`[useTreasury] Fetching transactions (limit: ${limit})`)

      let query = supabase
        .from('treasury_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Apply time range filter
      if (timeRange && timeRange !== 'all') {
        const days = parseInt(timeRange.replace('d', ''))
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      console.log(`[useTreasury] Fetched ${data?.length || 0} transactions`)
      const txns = (data as TreasuryTransaction[]) || []
      setTransactions(txns)
      return txns
    } catch (err) {
      console.error('[useTreasury] Error fetching transactions:', err)
      throw err
    }
  }, [userId])

  // =============================================================================
  // REQUEST PAYOUT
  // =============================================================================

  /**
   * Request a payout/withdrawal
   */
  const requestPayout = useCallback(async (
    amountCents: number
  ): Promise<PayoutRequest> => {
    if (!userId) {
      throw new Error('User ID required to request payout')
    }

    if (amountCents <= 0) {
      throw new Error('Payout amount must be positive')
    }

    if (account && amountCents > account.balance_cents) {
      throw new Error('Insufficient balance for payout')
    }

    try {
      console.log(`[useTreasury] Requesting payout: $${(amountCents / 100).toFixed(2)}`)

      // Create payout request
      const { data, error: requestError } = await supabase
        .from('treasury_payout_requests')
        .insert({
          user_id: userId,
          amount_cents: amountCents,
          status: 'pending',
          requested_at: new Date().toISOString()
        })
        .select()
        .single()

      if (requestError) throw requestError

      console.log('[useTreasury] Payout requested successfully')

      // Refresh account to update balance
      await refreshAccount()

      return data as PayoutRequest
    } catch (err) {
      console.error('[useTreasury] Error requesting payout:', err)
      throw err
    }
  }, [userId, account, refreshAccount])

  // =============================================================================
  // FETCH DASHBOARD DATA
  // =============================================================================

  /**
   * Fetch comprehensive dashboard data
   */
  const fetchDashboardData = useCallback(async (
    timeRange: TimeRange = '30d'
  ): Promise<TreasuryDashboardData> => {
    if (!userId) {
      throw new Error('User ID required to fetch dashboard data')
    }

    try {
      console.log(`[useTreasury] Fetching dashboard data (${timeRange})`)

      // Fetch account
      await refreshAccount()

      // Fetch transactions
      const txns = await fetchTransactions(100, timeRange)

      // Calculate MRR (placeholder)
      const mrr_cents = 0 // TODO: Implement MRR calculation

      // Fetch attributions (CALS revenue)
      const { data: attributions } = await supabase
        .from('cals_attribution_ledger')
        .select('*')
        .eq('beneficiary_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      // Revenue breakdown
      const revenueBySource = txns.reduce((acc, txn) => {
        acc[txn.transaction_type] = (acc[txn.transaction_type] || 0) + txn.amount_cents
        return acc
      }, {} as Record<string, number>)

      const data: TreasuryDashboardData = {
        balance_cents: account?.balance_cents || 0,
        pending_cents: account?.pending_cents || 0,
        lifetime_earned_cents: account?.lifetime_earned_cents || 0,
        mrr_cents,
        mrr_change_percent: 0,
        payouts: [], // TODO: Fetch payout contracts
        attributions: attributions || [],
        transactions: txns,
        revenue_by_source: revenueBySource
      }

      console.log('[useTreasury] Dashboard data fetched')
      setDashboardData(data)
      return data
    } catch (err) {
      console.error('[useTreasury] Error fetching dashboard data:', err)
      throw err
    }
  }, [userId, account, refreshAccount, fetchTransactions])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Auto-fetch account on mount or userId change
   */
  useEffect(() => {
    if (userId && autoFetch) {
      fetchAccount(userId)

      if (shouldFetchTransactions) {
        fetchTransactions(50)
      }
    }
  }, [userId, autoFetch, shouldFetchTransactions, fetchAccount, fetchTransactions])

  /**
   * Subscribe to real-time transaction updates
   */
  useEffect(() => {
    if (!userId || !realtime) return

    console.log(`[useTreasury] Subscribing to real-time updates for user ${userId}`)

    // Subscribe to treasury_accounts changes
    const accountSubscription = supabase
      .channel(`treasury_accounts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treasury_accounts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useTreasury] Real-time account update received')

          if (payload.eventType === 'UPDATE') {
            setAccount(payload.new as TreasuryAccount)
          }
        }
      )
      .subscribe()

    // Subscribe to treasury_transactions changes
    const transactionSubscription = supabase
      .channel(`treasury_transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'treasury_transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useTreasury] New transaction received')

          // Prepend new transaction
          setTransactions(prev => [payload.new as TreasuryTransaction, ...prev])

          // Refresh account for updated balance
          refreshAccount()
        }
      )
      .subscribe()

    return () => {
      console.log('[useTreasury] Unsubscribing from real-time updates')
      accountSubscription.unsubscribe()
      transactionSubscription.unsubscribe()
    }
  }, [userId, realtime, refreshAccount])

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    account,
    transactions,
    dashboardData,
    loading,
    error,
    refreshAccount,
    fetchTransactions,
    requestPayout,
    fetchDashboardData
  }
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook to get just the account balance
 */
export function useBalance(userId?: string): {
  balance: number
  loading: boolean
} {
  const { account, loading } = useTreasury(userId)

  return {
    balance: account?.balance_cents || 0,
    loading
  }
}

/**
 * Hook to check if user can request payout
 */
export function useCanPayout(userId?: string, minAmount: number = 1000): {
  canPayout: boolean
  balance: number
  loading: boolean
} {
  const { account, loading } = useTreasury(userId)

  return {
    canPayout: (account?.balance_cents || 0) >= minAmount,
    balance: account?.balance_cents || 0,
    loading
  }
}

