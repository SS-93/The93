/**
 * Badge System Types
 * 
 * Universal login with badge-based role access.
 * Users sign up once and collect badges to unlock different dashboards.
 */

// ============================================================================
// BADGE TYPES
// ============================================================================

export type BadgeType = 'fan' | 'artist' | 'brand' | 'developer' | 'admin'

export type BadgeVerificationStatus = 'pending' | 'verified' | 'rejected'

export interface UserBadge {
    id: string
    user_id: string
    badge_type: BadgeType
    is_active: boolean
    is_primary: boolean
    badge_metadata: Record<string, any>
    verification_status: BadgeVerificationStatus
    verified_by: string | null
    verified_at: string | null
    permissions: string[]
    onboarding_completed: boolean
    onboarding_completed_at: string | null
    created_at: string
    updated_at: string
}

export interface BadgeRequest {
    badge_type: BadgeType
    reason?: string
    verification_data?: Record<string, any>
}

// ============================================================================
// BADGE CONFIG
// ============================================================================

export interface BadgeConfig {
    type: BadgeType
    label: string
    icon: string
    color: string
    gradient: string
    description: string
    dashboardPath: string
    /** Badges that are auto-verified on request */
    autoVerify: boolean
}

export const BADGE_CONFIGS: Record<BadgeType, BadgeConfig> = {
    fan: {
        type: 'fan',
        label: 'Fan',
        icon: '🎵',
        color: '#a855f7',
        gradient: 'from-purple-500 to-pink-500',
        description: 'Discover artists, stream music, attend events',
        dashboardPath: '/dashboard/fan',
        autoVerify: true,
    },
    artist: {
        type: 'artist',
        label: 'Artist',
        icon: '🎤',
        color: '#22c55e',
        gradient: 'from-green-500 to-emerald-500',
        description: 'Upload music, manage events, grow your audience',
        dashboardPath: '/dashboard/artist',
        autoVerify: false, // Requires admin approval
    },
    brand: {
        type: 'brand',
        label: 'Brand',
        icon: '🏢',
        color: '#3b82f6',
        gradient: 'from-blue-500 to-cyan-500',
        description: 'Create campaigns, partner with artists',
        dashboardPath: '/dashboard/brand',
        autoVerify: true,
    },
    developer: {
        type: 'developer',
        label: 'Developer',
        icon: '👨‍💻',
        color: '#f59e0b',
        gradient: 'from-amber-500 to-orange-500',
        description: 'Build integrations, access APIs',
        dashboardPath: '/dashboard/developer',
        autoVerify: true,
    },
    admin: {
        type: 'admin',
        label: 'Admin',
        icon: '⚙️',
        color: '#ef4444',
        gradient: 'from-red-500 to-rose-500',
        description: 'System management and oversight',
        dashboardPath: '/dia',
        autoVerify: false, // Requires manual grant
    },
}

// ============================================================================
// BADGE UTILITIES
// ============================================================================

export const ALL_BADGE_TYPES: BadgeType[] = ['fan', 'artist', 'brand', 'developer', 'admin']

/** Badges that users can request (excludes admin) */
export const REQUESTABLE_BADGES: BadgeType[] = ['fan', 'artist', 'brand', 'developer']

export function getBadgeConfig(type: BadgeType): BadgeConfig {
    return BADGE_CONFIGS[type]
}

export function isBadgeVerified(badge: UserBadge): boolean {
    return badge.is_active && badge.verification_status === 'verified'
}
