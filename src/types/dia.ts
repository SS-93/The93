/**
 * =============================================================================
 * DIA (DEPARTMENT OF INTERNAL AFFAIRS) TYPE DEFINITIONS
 * =============================================================================
 * 
 * Part of: Buckets V2 Government Layer
 * V2 Living Index: #4 DIA (Department of Internal Affairs - Fourth Branch)
 * Frontend Architecture: DIA System
 * 
 * PURPOSE:
 * Type definitions for DIA - the central administrative hub for managing
 * users, events, brands, and data across the Buckets Nation ecosystem.
 * The "Fourth Branch of Government" providing oversight, moderation,
 * and operational control.
 * 
 * CONCEPT:
 * DIA is the admin control center, themed as a government department:
 * - User Management: Citizen registry and access control
 * - Event Oversight: Event approval, flagging, and monitoring
 * - Brand Licensing: Brand onboarding and CRM access grants
 * - Access Control: Keycloak integration and OAuth management
 * - Data Governance: Real-time database viewer and queries
 * - Treasury Oversight: Transaction monitoring and dispute resolution
 * - DNA Analytics: Platform-wide DNA health and insights
 * - System Health: Status monitoring and alerting
 * 
 * INTEGRATION POINTS:
 * - Supabase: Real-time database access and RLS bypass (admin only)
 * - Keycloak: OAuth client management and SSO admin
 * - Treasury: Financial oversight and payout approval
 * - Coliseum: Analytics access and funnel monitoring
 * - All Systems: Unified admin dashboard with drill-down capability
 * 
 * COMPONENTS USING THESE TYPES:
 * - DIADashboard.tsx (main control center)
 * - UserManagement.tsx (citizen registry)
 * - EventOversight.tsx (event approval and flagging)
 * - BrandLicensing.tsx (brand CRM and access)
 * - AccessControl.tsx (Keycloak + OAuth admin)
 * - DataGovernance.tsx (real-time DB viewer)
 * - TreasuryOversight.tsx (financial monitoring)
 * - DNAAnalytics.tsx (platform DNA health)
 * - SystemHealth.tsx (status dashboard)
 * 
 * DATABASE TABLES:
 * - dia_permissions (admin roles and access)
 * - dia_event_oversight (event flags and reviews)
 * - dia_user_actions (audit log of admin actions)
 * - dia_audit_log (immutable audit trail)
 * - Plus: Read/write access to ALL tables (with audit logging)
 * 
 * SECURITY:
 * - Role-based access control (dia_admin, dia_readonly, dia_moderator)
 * - All actions logged to immutable audit trail
 * - Two-factor authentication required for sensitive operations
 * - Real-time alerts for suspicious activity
 * 
 * =============================================================================
 */

// =============================================================================
// CORE DIA TYPES
// =============================================================================

/**
 * DIA Permission
 * Admin user's permissions within DIA system
 * 
 * Used in: All DIA components for authorization
 * Database: dia_permissions table
 */
export interface DIAPermission {
  user_id: string
  
  // Role
  role: DIARole
  
  // Scope
  full_access: boolean         // Access to all DIA modules
  module_access: DIAModule[]   // Specific module access if not full_access
  
  // Restrictions
  read_only: boolean           // Can view but not modify
  require_approval: boolean    // Actions require secondary approval
  
  // Metadata
  granted_by: string
  granted_at: Date
  expires_at?: Date
  last_active_at?: Date
}

/**
 * DIA Role
 * Administrative role types
 */
export type DIARole =
  | 'dia_admin'        // Full access to all DIA functions
  | 'dia_readonly'     // Read-only access to all data
  | 'dia_moderator'    // Content moderation and user management
  | 'dia_financial'    // Treasury oversight and payout approval
  | 'dia_analytics'    // Analytics and reporting access
  | 'dia_support'      // Customer support functions

/**
 * DIA Module
 * Individual modules within DIA system
 */
export type DIAModule =
  | 'user_management'
  | 'event_oversight'
  | 'brand_licensing'
  | 'access_control'
  | 'data_governance'
  | 'treasury_oversight'
  | 'dna_analytics'
  | 'system_health'

// =============================================================================
// USER MANAGEMENT TYPES
// =============================================================================

/**
 * DIA User Record
 * Extended user information for admin view
 * 
 * Used in: UserManagement component
 * Combines: Supabase auth + profiles + MediaID + Treasury
 */
export interface DIAUserRecord {
  // Identity
  user_id: string
  email: string
  role: 'fan' | 'artist' | 'brand' | 'developer' | 'admin'
  
  // Profile
  display_name?: string
  avatar_url?: string
  bio?: string
  
  // Account status
  status: 'active' | 'suspended' | 'banned' | 'deleted'
  is_verified: boolean
  email_verified: boolean
  phone_verified: boolean
  
  // MediaID
  mediaid_status: 'not_setup' | 'partial' | 'complete'
  mediaid_generation: number
  dna_confidence_score: number
  
  // Treasury
  balance_cents: number
  lifetime_earned_cents: number
  payout_count: number
  
  // Activity
  last_login_at?: Date
  last_active_at?: Date
  session_count: number
  
  // Flags
  flags: UserFlag[]
  
  // Metadata
  created_at: Date
  updated_at: Date
}

/**
 * User Flag
 * Moderation flag on a user account
 */
export interface UserFlag {
  id: string
  flag_type: 'spam' | 'abuse' | 'fraud' | 'copyright' | 'other'
  reason: string
  flagged_by: string
  flagged_at: Date
  resolved: boolean
  resolved_by?: string
  resolved_at?: Date
  resolution_note?: string
}

/**
 * DIA User Action
 * Admin action performed on a user
 * 
 * Used in: Audit logging
 * Database: dia_user_actions table
 */
export interface DIAUserAction {
  id: string
  target_user_id: string
  
  // Action
  action_type: UserActionType
  reason: string
  notes?: string
  
  // Duration (for temporary actions)
  duration_days?: number
  expires_at?: Date
  
  // Metadata
  performed_by: string
  performed_at: Date
  
  // Reversal
  reversed: boolean
  reversed_by?: string
  reversed_at?: Date
}

export type UserActionType =
  | 'suspend'          // Temporary suspension
  | 'unsuspend'        // Lift suspension
  | 'ban'              // Permanent ban
  | 'unban'            // Lift ban
  | 'verify'           // Manual verification
  | 'grant_access'     // Grant special access (e.g., host privileges)
  | 'revoke_access'    // Revoke special access
  | 'reset_password'   // Force password reset
  | 'merge_accounts'   // Merge duplicate accounts
  | 'delete_account'   // Soft delete account
  | 'adjust_balance'   // Manual Treasury adjustment

// =============================================================================
// EVENT OVERSIGHT TYPES
// =============================================================================

/**
 * DIA Event Oversight
 * Admin review and moderation of events
 * 
 * Used in: EventOversight component
 * Database: dia_event_oversight table
 * V2 Integration: #7 Concierto events
 */
export interface DIAEventOversight {
  event_id: string
  
  // Review status
  status: EventOversightStatus
  
  // Flags
  flags: EventFlag[]
  
  // Review
  reviewed_by?: string
  reviewed_at?: Date
  review_notes?: string
  
  // Actions taken
  actions_taken: EventAction[]
  
  // Metadata
  created_at: Date
  updated_at: Date
}

export type EventOversightStatus =
  | 'pending_review'   // Awaiting first review
  | 'approved'         // Approved for public visibility
  | 'flagged'          // Flagged for review but still live
  | 'suspended'        // Suspended pending investigation
  | 'rejected'         // Rejected, not allowed to publish
  | 'archived'         // Event completed and archived

/**
 * Event Flag
 * Moderation flag on an event
 */
export interface EventFlag {
  id: string
  flag_type: 'inappropriate_content' | 'spam' | 'fraud' | 'safety_concern' | 'copyright' | 'other'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  flagged_by: string   // User ID or "system" for auto-flags
  flagged_at: Date
  
  resolved: boolean
  resolution?: string
  resolved_by?: string
  resolved_at?: Date
}

/**
 * Event Action
 * Admin action taken on an event
 */
export interface EventAction {
  id: string
  action_type: 'approve' | 'suspend' | 'reject' | 'delete' | 'feature' | 'unfeature'
  reason: string
  performed_by: string
  performed_at: Date
}

// =============================================================================
// BRAND LICENSING TYPES
// =============================================================================

/**
 * Brand License Application
 * Brand's application for platform access
 * 
 * Used in: BrandLicensing component
 * V2 Integration: #10 Compañon (Brand Activation Layer)
 */
export interface BrandLicenseApplication {
  id: string
  
  // Brand details
  brand_name: string
  brand_website: string
  brand_description: string
  industry: string
  
  // Contact
  contact_name: string
  contact_email: string
  contact_phone?: string
  
  // Requested access
  requested_modules: Array<'events' | 'campaigns' | 'analytics' | 'crm'>
  use_case_description: string
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'more_info_needed'
  
  // Review
  reviewed_by?: string
  reviewed_at?: Date
  review_notes?: string
  
  // Approval
  approved_access?: string[]   // Granted modules
  contract_id?: string         // Legal contract reference
  
  // Metadata
  submitted_at: Date
}

/**
 * Brand CRM Access Grant
 * Grant access to event attendee CRM data
 * 
 * Used in: BrandLicensing component
 * Privacy: Requires attendee consent + event host approval
 */
export interface BrandCRMAccessGrant {
  id: string
  
  // Parties
  brand_id: string
  event_id: string
  event_host_id: string
  
  // Access scope
  access_type: 'full' | 'limited' | 'anonymized'
  allowed_fields: string[]     // Which fields brand can access
  
  // Constraints
  max_contacts?: number
  access_duration_days: number
  expires_at: Date
  
  // Consent
  requires_attendee_consent: boolean
  consent_count?: number       // How many attendees consented
  
  // Status
  status: 'pending_host_approval' | 'active' | 'expired' | 'revoked'
  
  // Approvals
  host_approved: boolean
  host_approved_at?: Date
  dia_approved_by?: string
  dia_approved_at?: Date
  
  // Metadata
  created_at: Date
}

// =============================================================================
// ACCESS CONTROL TYPES (KEYCLOAK INTEGRATION)
// =============================================================================

/**
 * OAuth Client Registration
 * OAuth2 client for third-party integrations
 * 
 * Used in: AccessControl component
 * V2 Integration: #17 Developer Portal, Keycloak admin
 */
export interface OAuthClientRegistration {
  id: string
  
  // Client details
  client_id: string
  client_secret_hash: string   // Never store plain secret
  client_name: string
  client_description: string
  
  // Developer
  developer_user_id: string
  organization_name?: string
  
  // OAuth configuration
  grant_types: Array<'authorization_code' | 'client_credentials' | 'refresh_token'>
  redirect_uris: string[]
  scopes: string[]             // Requested scopes
  approved_scopes: string[]    // Actually granted scopes
  
  // Status
  status: 'pending' | 'approved' | 'suspended' | 'revoked'
  
  // Usage
  total_tokens_issued: number
  last_token_issued_at?: Date
  
  // Security
  require_pkce: boolean
  token_lifetime_seconds: number
  refresh_token_lifetime_seconds: number
  
  // Metadata
  created_at: Date
  approved_by?: string
  approved_at?: Date
}

// =============================================================================
// DATA GOVERNANCE TYPES
// =============================================================================

/**
 * Real-Time Database Query
 * Query executed in DataGovernance real-time viewer
 * 
 * Used in: DataGovernance component
 * Security: Bypasses RLS with audit logging
 */
export interface DIADatabaseQuery {
  id: string
  
  // Query
  table_name: string
  query_type: 'select' | 'insert' | 'update' | 'delete'
  sql_query: string
  filters?: Record<string, any>
  
  // Execution
  executed_by: string
  executed_at: Date
  execution_time_ms: number
  rows_affected: number
  
  // Results (not stored, returned in real-time)
  // results: any[]
  
  // Audit
  reason?: string              // Why this query was run
  approved_by?: string         // If required approval
}

/**
 * Data Export Request
 * Request to export large datasets
 * 
 * Used in: DataGovernance component
 * Security: Requires approval for sensitive data
 */
export interface DataExportRequest {
  id: string
  
  // Request details
  table_names: string[]
  export_format: 'csv' | 'json' | 'sql'
  filters?: Record<string, any>
  
  // Status
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected'
  
  // Approval (if required)
  requires_approval: boolean
  approved_by?: string
  approved_at?: Date
  
  // Execution
  requested_by: string
  requested_at: Date
  completed_at?: Date
  download_url?: string
  expires_at?: Date
  
  // Size
  estimated_rows: number
  actual_rows?: number
  file_size_bytes?: number
}

// =============================================================================
// SYSTEM HEALTH TYPES
// =============================================================================

/**
 * DIA System Health
 * Real-time system health monitoring
 * 
 * Used in: SystemHealth component
 */
export interface DIASystemHealth {
  service: string
  
  // Status
  status: 'healthy' | 'degraded' | 'down' | 'maintenance'
  
  // Metrics
  uptime_percent_24h: number
  response_time_ms_p95: number
  error_count_24h: number
  error_rate_percent: number
  
  // Last check
  last_check: Date
  last_error?: string
  last_error_at?: Date
  
  // Dependencies
  dependencies?: Array<{
    service: string
    status: 'up' | 'down'
  }>
}

/**
 * System Alert
 * Alert for system issues or anomalies
 * 
 * Used in: SystemHealth component, DIA notifications
 */
export interface SystemAlert {
  id: string
  
  // Alert details
  alert_type: 'error' | 'warning' | 'info'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  
  // Source
  service: string
  error_message?: string
  stack_trace?: string
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved'
  
  // Response
  acknowledged_by?: string
  acknowledged_at?: Date
  resolved_by?: string
  resolved_at?: Date
  resolution_notes?: string
  
  // Metadata
  created_at: Date
}

// =============================================================================
// AUDIT LOG TYPES
// =============================================================================

/**
 * DIA Audit Log Entry
 * Immutable audit trail of all DIA actions
 * 
 * Database: dia_audit_log table (append-only)
 */
export interface DIAAuditLogEntry {
  id: string
  
  // Action
  action_type: string
  action_description: string
  
  // Actor
  performed_by: string
  performed_as_role: DIARole
  
  // Target
  target_type: 'user' | 'event' | 'brand' | 'system' | 'data'
  target_id?: string
  
  // Changes (for update actions)
  before_state?: Record<string, any>
  after_state?: Record<string, any>
  
  // Context
  ip_address?: string
  user_agent?: string
  session_id?: string
  
  // Result
  success: boolean
  error_message?: string
  
  // Timestamp (immutable)
  timestamp: Date
}

// =============================================================================
// EXPORTS
// =============================================================================

// All types exported for use across the application
// Import as: import { DIAPermission, DIAUserRecord } from '@/types/dia'

