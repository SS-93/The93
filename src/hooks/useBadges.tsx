import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabaseClient'
import { UserBadge, BadgeType, BadgeRequest, BADGE_CONFIGS, isBadgeVerified } from '../types/badge'

// ============================================================================
// CONTEXT
// ============================================================================

interface BadgeContextType {
    /** All badges belonging to the user (active and inactive) */
    badges: UserBadge[]
    /** Currently active badge type (determines dashboard view) */
    activeBadge: BadgeType | null
    /** Whether badge data is loading */
    loading: boolean
    /** Switch the active badge (in-memory only, no DB update) */
    switchBadge: (badgeType: BadgeType) => void
    /** Set the primary badge (persists to DB) */
    setPrimaryBadge: (badgeType: BadgeType) => Promise<void>
    /** Request a new badge */
    requestBadge: (request: BadgeRequest) => Promise<{ success: boolean; error?: string }>
    /** Check if user has a specific verified badge */
    hasBadge: (type: BadgeType) => boolean
    /** Check if user has a pending badge request */
    hasPendingBadge: (type: BadgeType) => boolean
    /** Get a specific badge */
    getBadge: (type: BadgeType) => UserBadge | undefined
    /** Refresh badges from DB */
    refreshBadges: () => Promise<void>
    /** List of verified badge types the user holds */
    verifiedBadgeTypes: BadgeType[]
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth()
    const [badges, setBadges] = useState<UserBadge[]>([])
    const [activeBadge, setActiveBadge] = useState<BadgeType | null>(null)
    const [loading, setLoading] = useState(true)

    // ── Load badges ──────────────────────────────────────────────────────────
    const loadBadges = useCallback(async () => {
        if (!user) {
            setBadges([])
            setActiveBadge(null)
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', user.id)
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: true })

            if (error) {
                // Table might not exist yet — fall back to profiles.role
                if (error.code === 'PGRST106' || error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('[Badges] user_badges table not found. Falling back to profiles.role')
                    await fallbackToProfileRole()
                    return
                }
                console.error('[Badges] Error loading badges:', error)
                // On any error, try the fallback rather than leaving activeBadge null
                await fallbackToProfileRole()
                return
            }

            const userBadges = (data || []) as UserBadge[]

            // If table exists but user has NO badges, fall back to profiles.role
            if (userBadges.length === 0) {
                console.warn('[Badges] No badges found in user_badges table. Falling back to profiles.role')
                await fallbackToProfileRole()
                return
            }

            setBadges(userBadges)

            // Restore active badge from localStorage or use primary
            const stored = localStorage.getItem('activeBadge')
            const verifiedBadges = userBadges.filter(isBadgeVerified)

            if (stored && verifiedBadges.some(b => b.badge_type === stored)) {
                setActiveBadge(stored as BadgeType)
            } else {
                const primary = verifiedBadges.find(b => b.is_primary)
                setActiveBadge(primary?.badge_type || verifiedBadges[0]?.badge_type || null)
            }
        } catch (err) {
            console.error('[Badges] Failed to load badges:', err)
            await fallbackToProfileRole()
        } finally {
            setLoading(false)
        }
    }, [user])

    /** Fall back to legacy profiles.role if user_badges table doesn't exist */
    const fallbackToProfileRole = async () => {
        if (!user) return
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            const role = (profile?.role as BadgeType) || 'fan'
            const syntheticBadge: UserBadge = {
                id: 'legacy-' + user.id,
                user_id: user.id,
                badge_type: role,
                is_active: true,
                is_primary: true,
                badge_metadata: {},
                verification_status: 'verified',
                verified_by: null,
                verified_at: null,
                permissions: [],
                onboarding_completed: true,
                onboarding_completed_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            setBadges([syntheticBadge])
            setActiveBadge(role)
        } catch {
            setActiveBadge('fan')
        }
        setLoading(false)
    }

    useEffect(() => {
        if (!authLoading) {
            loadBadges()
        }
    }, [user, authLoading, loadBadges])

    // ── Switch badge (in-memory) ─────────────────────────────────────────────
    const switchBadge = useCallback((badgeType: BadgeType) => {
        const badge = badges.find(b => b.badge_type === badgeType)
        if (!badge || !isBadgeVerified(badge)) {
            console.warn(`[Badges] Cannot switch to ${badgeType}: badge not found or not verified`)
            return
        }
        setActiveBadge(badgeType)
        localStorage.setItem('activeBadge', badgeType)
    }, [badges])

    // ── Set primary badge (persists) ─────────────────────────────────────────
    const setPrimaryBadge = useCallback(async (badgeType: BadgeType) => {
        if (!user) return

        // Optimistic update
        setBadges(prev => prev.map(b => ({
            ...b,
            is_primary: b.badge_type === badgeType,
        })))

        try {
            // Remove primary from all
            await supabase
                .from('user_badges')
                .update({ is_primary: false })
                .eq('user_id', user.id)

            // Set new primary
            await supabase
                .from('user_badges')
                .update({ is_primary: true })
                .eq('user_id', user.id)
                .eq('badge_type', badgeType)

            // Update profiles cache
            await supabase
                .from('profiles')
                .update({ primary_badge: badgeType })
                .eq('id', user.id)

            setActiveBadge(badgeType)
            localStorage.setItem('activeBadge', badgeType)
        } catch (err) {
            console.error('[Badges] Error setting primary badge:', err)
            await loadBadges() // Rollback
        }
    }, [user, loadBadges])

    // ── Request new badge ────────────────────────────────────────────────────
    const requestBadge = useCallback(async (request: BadgeRequest): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Not authenticated' }

        // Check if already has badge
        const existing = badges.find(b => b.badge_type === request.badge_type)
        if (existing) {
            if (isBadgeVerified(existing)) return { success: false, error: 'You already have this badge' }
            if (existing.verification_status === 'pending') return { success: false, error: 'Badge request is pending approval' }
        }

        const config = BADGE_CONFIGS[request.badge_type]
        const shouldAutoVerify = config.autoVerify

        try {
            const { data, error } = await supabase
                .from('user_badges')
                .insert({
                    user_id: user.id,
                    badge_type: request.badge_type,
                    is_active: shouldAutoVerify,
                    is_primary: badges.length === 0, // Primary if first badge
                    verification_status: shouldAutoVerify ? 'verified' : 'pending',
                    badge_metadata: {
                        request_reason: request.reason || '',
                        verification_data: request.verification_data || {},
                    },
                    onboarding_completed: false,
                })
                .select()
                .single()

            if (error) {
                console.error('[Badges] Error requesting badge:', error)
                return { success: false, error: error.message }
            }

            // Update profiles.all_badges cache
            const currentBadgeTypes = badges
                .filter(isBadgeVerified)
                .map(b => b.badge_type)

            if (shouldAutoVerify) {
                await supabase
                    .from('profiles')
                    .update({
                        all_badges: [...currentBadgeTypes, request.badge_type],
                    })
                    .eq('id', user.id)
            }

            await loadBadges()
            return { success: true }
        } catch (err: any) {
            return { success: false, error: err.message || 'Failed to request badge' }
        }
    }, [user, badges, loadBadges])

    // ── Helpers ──────────────────────────────────────────────────────────────
    const hasBadge = useCallback((type: BadgeType) => {
        return badges.some(b => b.badge_type === type && isBadgeVerified(b))
    }, [badges])

    const hasPendingBadge = useCallback((type: BadgeType) => {
        return badges.some(b => b.badge_type === type && b.verification_status === 'pending')
    }, [badges])

    const getBadge = useCallback((type: BadgeType) => {
        return badges.find(b => b.badge_type === type)
    }, [badges])

    const verifiedBadgeTypes = badges.filter(isBadgeVerified).map(b => b.badge_type)

    const value: BadgeContextType = {
        badges,
        activeBadge,
        loading,
        switchBadge,
        setPrimaryBadge,
        requestBadge,
        hasBadge,
        hasPendingBadge,
        getBadge,
        refreshBadges: loadBadges,
        verifiedBadgeTypes,
    }

    return <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

export const useBadges = (): BadgeContextType => {
    const context = useContext(BadgeContext)
    if (context === undefined) {
        throw new Error('useBadges must be used within a BadgeProvider')
    }
    return context
}
