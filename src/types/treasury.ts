/**
 * =============================================================================
 * TREASURY PROTOCOL TYPE DEFINITIONS
 * =============================================================================
 * 
 * Part of: Buckets V2 Trinity Architecture
 * V2 Living Index: #2 Treasury Protocol (Central Bank)
 * Frontend Architecture: Trinity → Treasury System
 * 
 * PURPOSE:
 * Type definitions for the Treasury Protocol - the financial infrastructure
 * managing all monetary flows across the Buckets Nation ecosystem.
 * 
 * CONCEPT:
 * The Treasury is the "Central Bank" of Buckets Nation, handling:
 * - User account balances and payouts
 * - Smart contract-style split agreements
 * - Attribution tracking from CALS (link sharing)
 * - Subscription and ticket revenue
 * - Licensing and sync payments
 * - Programmable payout rules and hold windows
 * 
 * INTEGRATION POINTS:
 * - Connected to: All revenue-generating systems
 * - Feeds: Coliseum Analytics (for revenue metrics)
 * - Powers: Artist payouts, Event settlements, CALS attribution
 * - Integrated with: Stripe (fiat), eventual crypto layer (NFTs)
 * 
 * COMPONENTS USING THESE TYPES:
 * - TreasuryDashboard.tsx (main financial hub)
 * - SubscriptionManager.tsx (tier management)
 * - PayoutQueue.tsx (admin payout control)
 * - AttributionLedger.tsx (CALS revenue tracking)
 * - ContractBuilder.tsx (split agreement creation)
 * 
 * DATABASE TABLES:
 * - treasury_accounts (user balances)
 * - treasury_transactions (all financial movements)
 * - treasury_contracts (split agreements)
 * - cals_attribution_ledger (link-based attribution)
 * - treasury_ledger (immutable audit log)
 * 
 * =============================================================================
 */

// =============================================================================
// CORE TREASURY TYPES
// =============================================================================

/**
 * Treasury Account
 * User's financial account within Buckets Nation
 * 
 * Used in: TreasuryDashboard, PayoutQueue
 * Database: treasury_accounts table
 * Integration: Stripe Connect for withdrawals
 */
export interface TreasuryAccount {
  user_id: string
  
  // Balances (all in cents for precision)
  balance_cents: number        // Available balance
  pending_cents: number        // Pending (hold window) balance
  lifetime_earned_cents: number
  lifetime_withdrawn_cents: number
  
  // Stripe integration
  stripe_account_id?: string   // Stripe Connect account
  stripe_status?: 'pending' | 'verified' | 'suspended'
  
  // Payout preferences
  auto_payout_enabled: boolean
  auto_payout_threshold_cents: number
  payout_schedule?: 'daily' | 'weekly' | 'monthly'
  
  // Metadata
  created_at: Date
  updated_at: Date
}

/**
 * Treasury Transaction
 * Individual financial transaction (credit or debit)
 * 
 * Used in: TreasuryDashboard (transaction history)
 * Database: treasury_transactions table
 * Immutable: Logged to treasury_ledger for audit trail
 */
export interface TreasuryTransaction {
  id: string
  user_id: string
  
  // Transaction details
  transaction_type: TransactionType
  amount_cents: number         // Positive = credit, Negative = debit
  status: TransactionStatus
  
  // Attribution & context
  source_entity_type?: 'event' | 'subscription' | 'track' | 'link' | 'license'
  source_entity_id?: string
  contract_id?: string         // If part of split contract
  attribution_id?: string      // If from CALS attribution
  
  // Payout details
  hold_until?: Date            // Hold window for disputes
  released_at?: Date
  stripe_transfer_id?: string
  
  // Metadata
  description: string
  metadata?: Record<string, any>
  created_at: Date
}

/**
 * Transaction Type
 * Categories of transactions in Treasury system
 * 
 * Maps to revenue sources across V2 Living Index:
 * - subscription: #6 Buckets Core Platform
 * - ticket: #7 Concierto (Event Management)
 * - attribution: #5 CALS (Link Sync)
 * - licensing: #9 Sync Library
 * - payout: User withdrawal
 */
export type TransactionType =
  | 'subscription'      // Subscription revenue (artist tiers)
  | 'ticket'            // Event ticket sales (Concierto)
  | 'attribution'       // CALS referral/share revenue
  | 'licensing'         // Sync/licensing fees (Sync Library)
  | 'brand_campaign'    // Brand sponsorship (Compañon)
  | 'tip'               // Direct tips from fans
  | 'payout'            // Withdrawal to bank
  | 'refund'            // Refunds (negative amount)
  | 'fee'               // Platform fees
  | 'adjustment'        // Manual adjustment (DIA)

/**
 * Transaction Status
 * Lifecycle status of a transaction
 */
export type TransactionStatus =
  | 'pending'           // Awaiting processing
  | 'held'              // In hold window (dispute period)
  | 'completed'         // Finalized and credited
  | 'failed'            // Processing failed
  | 'disputed'          // Under dispute (DIA review)
  | 'reversed'          // Reversed due to dispute

// =============================================================================
// PAYOUT CONTRACTS & SPLITS
// =============================================================================

/**
 * Payout Contract
 * Smart contract-style agreement for revenue splitting
 * 
 * Used in: ContractBuilder component, Event settlements
 * Use Cases:
 * - Event ticket revenue splits (host, artists, venue)
 * - Subscription revenue splits (artist, platform)
 * - Licensing revenue splits (artist, label, publisher)
 * 
 * V2 Integration: Powers #7 Concierto event payouts
 */
export interface PayoutContract {
  id: string
  
  // Contract context
  contract_type: 'event' | 'subscription' | 'licensing' | 'campaign'
  event_id?: string
  metadata?: Record<string, any>
  
  // Parties & splits
  parties: ContractParty[]
  
  // Rules & constraints
  rules: ContractRule[]
  
  // Status
  status: 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled'
  
  // Financial summary
  total_amount_cents: number
  distributed_cents: number
  pending_cents: number
  
  // Metadata
  created_by: string
  created_at: Date
  activated_at?: Date
  completed_at?: Date
}

/**
 * Contract Party
 * Individual party in a payout contract
 */
export interface ContractParty {
  user_id: string
  role: 'host' | 'artist' | 'venue' | 'platform' | 'label' | 'publisher' | 'brand'
  split_percentage: number     // 0-100
  minimum_amount_cents?: number
  metadata?: {
    artist_name?: string
    performance_order?: number
  }
}

/**
 * Contract Rule
 * Business rules applied to contract execution
 */
export interface ContractRule {
  rule_type: ContractRuleType
  value: any
  description?: string
}

export type ContractRuleType =
  | 'hold_window'              // Days to hold funds for disputes
  | 'minimum_threshold'        // Minimum payout amount
  | 'attribution_weight'       // CALS attribution multiplier
  | 'platform_fee'             // Platform fee percentage
  | 'conditional_bonus'        // Bonus if conditions met (e.g., attendance threshold)
  | 'tiered_split'             // Different splits based on amount tiers

// =============================================================================
// CALS ATTRIBUTION (LINK-BASED REVENUE)
// =============================================================================

/**
 * CALS Attribution Ledger Entry
 * Attribution revenue from link sharing/opening
 * 
 * V2 Integration: #5 CALS (Cross-App Link Sync)
 * Used in: AttributionWidget, AttributionLedger component
 * 
 * Flow:
 * 1. User shares Buckets link (track, event, artist)
 * 2. Friend opens link → tracked via deep link
 * 3. Friend takes action (subscribe, purchase ticket)
 * 4. Revenue attributed to original sharer
 * 5. Credited to Treasury account
 */
export interface CALSAttributionLedger {
  id: string
  
  // Attribution parties
  link_id: string              // Original shared link
  referrer_id: string          // User who shared the link
  beneficiary_id: string       // User who benefits (usually same as referrer)
  converter_id: string         // User who converted (friend)
  
  // Attribution event
  action_type: 'subscription' | 'ticket_purchase' | 'track_purchase' | 'event_rsvp'
  entity_id: string            // What was purchased/subscribed
  entity_type: 'artist' | 'event' | 'track'
  
  // Financial details
  total_transaction_cents: number
  attribution_percentage: number  // % of transaction attributed
  amount_cents: number            // Actual attribution amount
  
  // Status & settlement
  status: 'pending' | 'settled' | 'disputed' | 'expired'
  settled_at?: Date
  expires_at?: Date            // Attribution expires after X days
  
  // Context
  source_app?: 'ios' | 'android' | 'web'  // Where link was opened
  utm_campaign?: string
  dna_match_score?: number     // DNA match between referrer and converter
  
  // Metadata
  created_at: Date
}

// =============================================================================
// SUBSCRIPTION TIERS
// =============================================================================

/**
 * Subscription Tier
 * Artist subscription tier configuration
 * 
 * Used in: SubscriptionManager component
 * V2 Integration: #6 Buckets Core Platform, #20 Creator Economy
 */
export interface SubscriptionTier {
  id: string
  artist_id: string
  
  // Tier details
  name: string                 // "Basic", "Premium", "VIP"
  description: string
  price_cents: number
  billing_period: 'monthly' | 'yearly'
  
  // Benefits
  benefits: string[]           // ["Early access", "Exclusive content", etc.]
  max_downloads_per_month?: number
  locker_access_level: 'basic' | 'premium' | 'vip'
  
  // Treasury split (if artist shares revenue with platform)
  platform_fee_percentage: number
  
  // Status
  is_active: boolean
  subscriber_count: number
  
  // Metadata
  created_at: Date
  updated_at: Date
}

/**
 * User Subscription
 * Individual user's subscription to an artist
 * 
 * Used in: TreasuryDashboard, SubscriptionManager
 */
export interface UserSubscription {
  id: string
  user_id: string
  artist_id: string
  tier_id: string
  
  // Subscription status
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
  
  // Billing
  current_period_start: Date
  current_period_end: Date
  cancel_at_period_end: boolean
  
  // Stripe integration
  stripe_subscription_id: string
  stripe_customer_id: string
  
  // Metadata
  subscribed_at: Date
  cancelled_at?: Date
}

// =============================================================================
// TREASURY DASHBOARD DATA
// =============================================================================

/**
 * Treasury Dashboard Data
 * Aggregated data for TreasuryDashboard component
 * 
 * Used in: TreasuryDashboard.tsx
 * Generated by: useTreasury hook
 */
export interface TreasuryDashboardData {
  // Account summary
  balance_cents: number
  pending_cents: number
  lifetime_earned_cents: number
  
  // MRR (Monthly Recurring Revenue)
  mrr_cents: number
  mrr_change_percent: number
  
  // Recent activity
  payouts: PayoutContract[]
  attributions: CALSAttributionLedger[]
  transactions: TreasuryTransaction[]
  
  // Revenue breakdown
  revenue_by_source: Record<TransactionType, number>
  
  // Time series data (for charts)
  earnings_timeline?: Array<{
    date: Date
    amount_cents: number
  }>
  
  // Projections
  projected_30d_cents?: number
  projected_90d_cents?: number
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Time Range
 * Used across Treasury and Coliseum for date filtering
 */
export type TimeRange = '7d' | '30d' | '90d' | 'all'

/**
 * Payout Method
 * Supported payout methods for withdrawals
 */
export interface PayoutMethod {
  id: string
  user_id: string
  method_type: 'stripe_connect' | 'bank_transfer' | 'paypal' | 'crypto'
  
  // Method details (encrypted)
  details_encrypted: string
  last_four?: string           // Last 4 digits of account
  
  // Status
  is_default: boolean
  is_verified: boolean
  
  // Metadata
  created_at: Date
  verified_at?: Date
}

/**
 * Payout Request
 * User-initiated withdrawal request
 * 
 * Used in: PayoutQueue (admin), TreasuryDashboard (user)
 * V2 Integration: #4 DIA (oversight & approval)
 */
export interface PayoutRequest {
  id: string
  user_id: string
  
  // Request details
  amount_cents: number
  payout_method_id: string
  
  // Status
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected'
  
  // Processing
  approved_by?: string         // DIA admin who approved
  approved_at?: Date
  stripe_transfer_id?: string
  completed_at?: Date
  
  // Rejection
  rejection_reason?: string
  
  // Metadata
  requested_at: Date
}

/**
 * Revenue Attribution Rule
 * Rules for CALS attribution calculation
 * 
 * Used in: lib/treasury/attribution.ts
 */
export interface RevenueAttributionRule {
  id: string
  
  // Rule parameters
  action_type: 'subscription' | 'ticket_purchase' | 'track_purchase'
  attribution_percentage: number  // % of revenue attributed to referrer
  
  // Time constraints
  attribution_window_days: number  // Days after link open to attribute
  
  // Conditions
  min_dna_match_score?: number     // Minimum DNA match for attribution
  first_purchase_only?: boolean    // Only attribute first purchase
  
  // Status
  is_active: boolean
  priority: number                 // Rule priority (higher = applied first)
  
  // Metadata
  created_at: Date
}

// =============================================================================
// EXPORTS
// =============================================================================

// All types exported for use across the application
// Import as: import { TreasuryAccount, PayoutContract } from '@/types/treasury'

