import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useBadges } from '../../hooks/useBadges'
import { supabase } from '../../lib/supabaseClient'
import { BadgeType, BADGE_CONFIGS, REQUESTABLE_BADGES } from '../../types/badge'

// ============================================================================
// BADGE MANAGEMENT SETTINGS
// Toggle badges on/off, set primary, save & sync to DB
// ============================================================================

interface BadgeToggleState {
    type: BadgeType
    enabled: boolean
    isPrimary: boolean
    status: 'verified' | 'pending' | 'none'
}

interface BadgeManagementSettingsProps {
    user?: any
    profile?: any
    onProfileUpdate?: () => void
}

const BadgeManagementSettings: React.FC<BadgeManagementSettingsProps> = ({
    user,
    profile,
    onProfileUpdate,
}) => {
    const { badges, activeBadge, refreshBadges } = useBadges()
    const [toggleStates, setToggleStates] = useState<BadgeToggleState[]>([])
    const [saving, setSaving] = useState(false)
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [hasChanges, setHasChanges] = useState(false)

    // ── Build toggle states from current badges ────────────────────────────────
    const buildToggleStates = useCallback(() => {
        const states: BadgeToggleState[] = REQUESTABLE_BADGES.map(type => {
            const existing = badges.find(b => b.badge_type === type)
            const profileRole = profile?.role as BadgeType | undefined
            const profileBadges = profile?.all_badges as BadgeType[] | undefined

            // Determine if this badge is effectively "on"
            const isEnabled = existing
                ? existing.is_active && existing.verification_status === 'verified'
                : (profileRole === type) || (profileBadges?.includes(type) ?? false)

            const status: 'verified' | 'pending' | 'none' = existing
                ? (existing.verification_status as 'verified' | 'pending')
                : isEnabled ? 'verified' : 'none'

            return {
                type,
                enabled: isEnabled,
                isPrimary: existing
                    ? existing.is_primary
                    : profileRole === type,
                status,
            }
        })

        // Ensure at least one badge is enabled and primary
        const anyEnabled = states.some(s => s.enabled)
        if (!anyEnabled) {
            const fanState = states.find(s => s.type === 'fan')
            if (fanState) {
                fanState.enabled = true
                fanState.isPrimary = true
                fanState.status = 'verified'
            }
        }

        setToggleStates(states)
        setHasChanges(false)
    }, [badges, profile])

    useEffect(() => {
        buildToggleStates()
    }, [buildToggleStates])

    // ── Toggle a badge on/off ──────────────────────────────────────────────────
    const handleToggle = (type: BadgeType) => {
        setToggleStates(prev => {
            const updated = prev.map(s => {
                if (s.type !== type) return s
                const newEnabled = !s.enabled
                return { ...s, enabled: newEnabled }
            })

            // If we disabled the primary badge, promote the next enabled one
            const disabledPrimary = updated.find(s => s.type === type && !s.enabled && s.isPrimary)
            if (disabledPrimary) {
                disabledPrimary.isPrimary = false
                const nextEnabled = updated.find(s => s.enabled)
                if (nextEnabled) nextEnabled.isPrimary = true
            }

            // Must have at least one badge enabled
            const enabledCount = updated.filter(s => s.enabled).length
            if (enabledCount === 0) {
                return prev // Block — can't disable ALL badges
            }

            return updated
        })
        setHasChanges(true)
        setSaveResult(null)
    }

    // ── Set primary badge ──────────────────────────────────────────────────────
    const handleSetPrimary = (type: BadgeType) => {
        setToggleStates(prev =>
            prev.map(s => ({
                ...s,
                isPrimary: s.type === type,
                // Auto-enable if setting as primary
                enabled: s.type === type ? true : s.enabled,
            }))
        )
        setHasChanges(true)
        setSaveResult(null)
    }

    // ── Save & sync ────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setSaveResult(null)

        try {
            const enabledBadges = toggleStates.filter(s => s.enabled)
            const primaryBadge = toggleStates.find(s => s.isPrimary)

            // 1. Upsert each badge into user_badges
            for (const state of toggleStates) {
                if (state.enabled) {
                    // Ensure badge exists and is active + verified
                    const { error } = await supabase
                        .from('user_badges')
                        .upsert({
                            user_id: user.id,
                            badge_type: state.type,
                            is_active: true,
                            is_primary: state.isPrimary,
                            verification_status: 'verified',
                            onboarding_completed: true,
                        }, { onConflict: 'user_id,badge_type' })

                    if (error) {
                        console.error(`[BadgeSettings] Error upserting ${state.type}:`, error)
                        // If table doesn't exist yet, we'll create records via profiles
                        if (error.code !== 'PGRST106' && error.code !== '42P01') {
                            throw error
                        }
                    }
                } else {
                    // Deactivate badge
                    await supabase
                        .from('user_badges')
                        .update({ is_active: false, is_primary: false })
                        .eq('user_id', user.id)
                        .eq('badge_type', state.type)
                }
            }

            // 2. Sync profiles table
            const allBadgeTypes = enabledBadges.map(s => s.type)
            const primaryType = primaryBadge?.type || allBadgeTypes[0] || 'fan'

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: primaryType,
                    primary_badge: primaryType,
                    all_badges: allBadgeTypes,
                })
                .eq('id', user.id)

            if (profileError) {
                console.error('[BadgeSettings] Error updating profile:', profileError)
                throw profileError
            }

            // 3. Refresh badge context + profile
            await refreshBadges()
            onProfileUpdate?.()

            // 4. Update localStorage with new active badge
            localStorage.setItem('activeBadge', primaryType)

            setSaveResult({ type: 'success', message: 'Badges updated! Dashboard access synced.' })
            setHasChanges(false)

            console.log(`[BadgeSettings] ✅ Saved — primary: ${primaryType}, all: [${allBadgeTypes.join(', ')}]`)
        } catch (err: any) {
            console.error('[BadgeSettings] Save failed:', err)
            setSaveResult({ type: 'error', message: err.message || 'Failed to save badge settings' })
        } finally {
            setSaving(false)
        }
    }

    // ── Discard changes ────────────────────────────────────────────────────────
    const handleDiscard = () => {
        buildToggleStates()
        setSaveResult(null)
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    const enabledCount = toggleStates.filter(s => s.enabled).length

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🛡️ Badge Management
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    Toggle badges to control which dashboards you can access. Each enabled badge grants access to its dashboard.
                </p>
            </div>

            {/* Active badge indicator */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                <span className="text-sm text-gray-400">Active badge:</span>
                {activeBadge && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${BADGE_CONFIGS[activeBadge].gradient} text-white`}>
                        <span>{BADGE_CONFIGS[activeBadge].icon}</span>
                        {BADGE_CONFIGS[activeBadge].label}
                    </span>
                )}
                <span className="text-xs text-gray-500 ml-auto">{enabledCount} badge{enabledCount !== 1 ? 's' : ''} enabled</span>
            </div>

            {/* Badge toggles */}
            <div className="space-y-3">
                {toggleStates.map(state => {
                    const config = BADGE_CONFIGS[state.type]
                    return (
                        <motion.div
                            key={state.type}
                            layout
                            className={`
                relative rounded-2xl border transition-all duration-200 overflow-hidden
                ${state.enabled
                                    ? 'bg-gray-800/40 border-gray-600/50'
                                    : 'bg-gray-900/30 border-gray-800/40 opacity-60'
                                }
              `}
                        >
                            <div className="flex items-center gap-4 p-4">
                                {/* Badge icon & info */}
                                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                  ${state.enabled
                                        ? `bg-gradient-to-br ${config.gradient} shadow-lg`
                                        : 'bg-gray-800'
                                    }
                `}>
                                    {config.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">{config.label}</span>
                                        {state.isPrimary && state.enabled && (
                                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-yellow/20 text-accent-yellow font-bold">
                                                Primary
                                            </span>
                                        )}
                                        {state.status === 'pending' && (
                                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm mt-0.5">{config.description}</p>
                                    {state.enabled && (
                                        <p className="text-gray-600 text-xs mt-1">
                                            Grants access to <span className="text-gray-400">/dashboard/{state.type}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Set as primary button */}
                                {state.enabled && !state.isPrimary && (
                                    <button
                                        onClick={() => handleSetPrimary(state.type)}
                                        className="text-xs text-gray-500 hover:text-accent-yellow px-3 py-1.5 rounded-lg hover:bg-gray-700/50 transition-all whitespace-nowrap"
                                    >
                                        Set Primary
                                    </button>
                                )}

                                {/* Toggle switch */}
                                <button
                                    onClick={() => handleToggle(state.type)}
                                    className={`
                    relative w-12 h-7 rounded-full transition-all duration-200 shrink-0
                    ${state.enabled
                                            ? 'bg-green-500'
                                            : 'bg-gray-700'
                                        }
                  `}
                                    aria-label={`Toggle ${config.label} badge`}
                                >
                                    <motion.div
                                        layout
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className={`
                      absolute top-1 w-5 h-5 rounded-full bg-white shadow-md
                      ${state.enabled ? 'left-6' : 'left-1'}
                    `}
                                    />
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Warning if only one badge */}
            {enabledCount === 1 && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                    <span className="text-lg mt-0.5">⚠️</span>
                    <span>At least one badge must remain enabled. Add more badges to unlock additional dashboards.</span>
                </div>
            )}

            {/* Save result banner */}
            <AnimatePresence>
                {saveResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${saveResult.type === 'success'
                                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                            }`}
                    >
                        <span>{saveResult.type === 'success' ? '✅' : '❌'}</span>
                        <span>{saveResult.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save / Discard buttons */}
            <div className="flex items-center gap-3 pt-2">
                <motion.button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    whileHover={{ scale: hasChanges && !saving ? 1.02 : 1 }}
                    whileTap={{ scale: hasChanges && !saving ? 0.98 : 1 }}
                    className={`
            flex-1 py-3.5 rounded-xl font-bold text-sm transition-all
            ${hasChanges && !saving
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }
          `}
                >
                    {saving ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </span>
                    ) : (
                        'Save & Sync'
                    )}
                </motion.button>

                {hasChanges && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleDiscard}
                        className="px-6 py-3.5 rounded-xl text-gray-400 font-medium text-sm hover:bg-gray-800 hover:text-white transition-all"
                    >
                        Discard
                    </motion.button>
                )}
            </div>

            {/* How badges work */}
            <div className="mt-4 px-4 py-4 rounded-xl bg-gray-800/30 border border-gray-800/50">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">How Badges Work</h4>
                <ul className="text-xs text-gray-500 space-y-1.5">
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>Each <strong className="text-gray-400">enabled badge</strong> grants access to its corresponding dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-accent-yellow mt-0.5">★</span>
                        <span>Your <strong className="text-gray-400">primary badge</strong> determines your default dashboard on login</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">↔</span>
                        <span>You can <strong className="text-gray-400">switch badges</strong> anytime using the badge selector in the navigation</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">🔒</span>
                        <span>Changes are <strong className="text-gray-400">synced</strong> to your profile and badge records on save</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default BadgeManagementSettings
