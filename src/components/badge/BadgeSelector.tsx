import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBadges } from '../../hooks/useBadges'
import { BadgeType, BADGE_CONFIGS, REQUESTABLE_BADGES, isBadgeVerified } from '../../types/badge'

// ============================================================================
// BADGE PILL — compact badge indicator
// ============================================================================

interface BadgePillProps {
    type: BadgeType
    isActive?: boolean
    isPending?: boolean
    size?: 'sm' | 'md' | 'lg'
    onClick?: () => void
}

export const BadgePill: React.FC<BadgePillProps> = ({
    type, isActive = false, isPending = false, size = 'md', onClick
}) => {
    const config = BADGE_CONFIGS[type]
    const sizeClasses = {
        sm: 'h-7 px-2.5 text-xs gap-1',
        md: 'h-9 px-3.5 text-sm gap-1.5',
        lg: 'h-11 px-5 text-base gap-2',
    }

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
        inline-flex items-center rounded-full font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${isActive
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg shadow-${type === 'fan' ? 'purple' : type === 'artist' ? 'green' : type === 'brand' ? 'blue' : type === 'developer' ? 'amber' : 'red'}-500/25`
                    : isPending
                        ? 'bg-gray-700/50 text-yellow-400 border border-yellow-500/30'
                        : 'bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600'
                }
      `}
            disabled={isPending}
        >
            <span className={size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}>
                {config.icon}
            </span>
            <span>{config.label}</span>
            {isPending && (
                <span className="ml-0.5 text-[10px] uppercase tracking-wider text-yellow-400/80">pending</span>
            )}
        </motion.button>
    )
}

// ============================================================================
// BADGE SELECTOR — pick active badge from sidebar/nav
// ============================================================================

interface BadgeSelectorProps {
    /** Compact mode for navbar, expanded for sidebar */
    variant?: 'compact' | 'expanded' | 'dropdown'
    /** Called after badge switch with new badge type */
    onSwitch?: (badge: BadgeType) => void
    /** Show the "Add Badge" button */
    showAddBadge?: boolean
}

export const BadgeSelector: React.FC<BadgeSelectorProps> = ({
    variant = 'compact',
    onSwitch,
    showAddBadge = true,
}) => {
    const { badges, activeBadge, switchBadge, verifiedBadgeTypes, hasPendingBadge } = useBadges()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)

    const handleSwitch = (type: BadgeType) => {
        switchBadge(type)
        onSwitch?.(type)
        setShowDropdown(false)
    }

    const activeConfig = activeBadge ? BADGE_CONFIGS[activeBadge] : null

    // ── Compact: just the active badge pill ──────────────────────────────────
    if (variant === 'compact') {
        return (
            <div className="relative">
                {activeBadge && activeConfig && (
                    <BadgePill
                        type={activeBadge}
                        isActive
                        size="md"
                        onClick={() => setShowDropdown(prev => !prev)}
                    />
                )}

                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-2 right-0 z-50 min-w-[200px] p-2 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 shadow-2xl shadow-black/50"
                        >
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Switch Badge
                            </div>
                            {verifiedBadgeTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleSwitch(type)}
                                    className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                    ${type === activeBadge
                                            ? `bg-gradient-to-r ${BADGE_CONFIGS[type].gradient} text-white`
                                            : 'text-gray-300 hover:bg-gray-800/80'
                                        }
                  `}
                                >
                                    <span className="text-lg">{BADGE_CONFIGS[type].icon}</span>
                                    <div>
                                        <div className="font-medium text-sm">{BADGE_CONFIGS[type].label}</div>
                                        <div className={`text-xs ${type === activeBadge ? 'text-white/70' : 'text-gray-500'}`}>
                                            {BADGE_CONFIGS[type].description}
                                        </div>
                                    </div>
                                    {type === activeBadge && (
                                        <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>
                                    )}
                                </button>
                            ))}

                            {/* Pending badges */}
                            {REQUESTABLE_BADGES.filter(t => hasPendingBadge(t)).map(type => (
                                <div
                                    key={`pending-${type}`}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 opacity-60"
                                >
                                    <span className="text-lg">{BADGE_CONFIGS[type].icon}</span>
                                    <div>
                                        <div className="font-medium text-sm">{BADGE_CONFIGS[type].label}</div>
                                        <div className="text-xs text-yellow-500/70">Pending approval</div>
                                    </div>
                                </div>
                            ))}

                            {/* Add badge button */}
                            {showAddBadge && (
                                <>
                                    <div className="border-t border-gray-700/50 my-2" />
                                    <button
                                        onClick={() => { setShowDropdown(false); setShowAddModal(true) }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-800/80 hover:text-white transition-all"
                                    >
                                        <span className="text-lg w-7 h-7 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center text-sm">+</span>
                                        <span className="font-medium text-sm">Add Badge</span>
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Click-away backdrop */}
                {showDropdown && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                )}

                {/* Add Badge Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <BadgeRequestModal onClose={() => setShowAddModal(false)} />
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // ── Expanded: sidebar layout with all badges visible ─────────────────────
    if (variant === 'expanded') {
        return (
            <div className="space-y-2">
                <div className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Your Badges
                </div>
                {verifiedBadgeTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => handleSwitch(type)}
                        className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
              ${type === activeBadge
                                ? `bg-gradient-to-r ${BADGE_CONFIGS[type].gradient} text-white shadow-lg`
                                : 'text-gray-300 hover:bg-gray-800/80 border border-transparent hover:border-gray-700/50'
                            }
            `}
                    >
                        <span className="text-lg">{BADGE_CONFIGS[type].icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{BADGE_CONFIGS[type].label}</div>
                        </div>
                        {type === activeBadge && (
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        )}
                    </button>
                ))}

                {/* Pending badges */}
                {REQUESTABLE_BADGES.filter(t => hasPendingBadge(t)).map(type => (
                    <div
                        key={`pending-${type}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 border border-yellow-500/20 bg-yellow-500/5"
                    >
                        <span className="text-lg opacity-50">{BADGE_CONFIGS[type].icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-400">{BADGE_CONFIGS[type].label}</div>
                            <div className="text-xs text-yellow-500/70">Awaiting verification</div>
                        </div>
                    </div>
                ))}

                {/* Add Badge */}
                {showAddBadge && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/50 border border-dashed border-gray-700/50 hover:border-gray-600 transition-all"
                    >
                        <span className="text-lg">➕</span>
                        <span className="font-medium text-sm">Add New Badge</span>
                    </button>
                )}

                <AnimatePresence>
                    {showAddModal && (
                        <BadgeRequestModal onClose={() => setShowAddModal(false)} />
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // ── Dropdown: for mobile ─────────────────────────────────────────────────
    return (
        <div className="flex gap-1.5 flex-wrap">
            {verifiedBadgeTypes.map(type => (
                <BadgePill
                    key={type}
                    type={type}
                    isActive={type === activeBadge}
                    size="sm"
                    onClick={() => handleSwitch(type)}
                />
            ))}
        </div>
    )
}

// ============================================================================
// BADGE REQUEST MODAL — for adding new badges
// ============================================================================

interface BadgeRequestModalProps {
    onClose: () => void
}

const BadgeRequestModal: React.FC<BadgeRequestModalProps> = ({ onClose }) => {
    const { requestBadge, hasBadge, hasPendingBadge } = useBadges()
    const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null)
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

    const availableBadges = REQUESTABLE_BADGES.filter(
        type => !hasBadge(type) && !hasPendingBadge(type)
    )

    const handleSubmit = async () => {
        if (!selectedBadge) return
        setSubmitting(true)
        const res = await requestBadge({ badge_type: selectedBadge, reason })
        setResult(res)
        setSubmitting(false)
        if (res.success) {
            setTimeout(onClose, 1500)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg p-6 rounded-3xl bg-gray-900/95 border border-gray-700/60 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Add a New Badge</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {result?.success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="text-5xl mb-4">🎉</div>
                        <h4 className="text-lg font-bold text-white mb-2">Badge Added!</h4>
                        <p className="text-gray-400">
                            {selectedBadge && BADGE_CONFIGS[selectedBadge].autoVerify
                                ? 'Your badge is now active.'
                                : 'Your request has been submitted for review.'}
                        </p>
                    </motion.div>
                ) : availableBadges.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">✨</div>
                        <p className="text-gray-300 font-medium">You have all available badges!</p>
                        <p className="text-gray-500 text-sm mt-1">No more badges to request.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-400 text-sm mb-4">
                            Choose a badge to unlock new features and dashboards.
                        </p>

                        <div className="space-y-3 mb-6">
                            {availableBadges.map(type => {
                                const config = BADGE_CONFIGS[type]
                                return (
                                    <motion.button
                                        key={type}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedBadge(type)}
                                        className={`
                      w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all
                      ${selectedBadge === type
                                                ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg ring-2 ring-white/20`
                                                : 'bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:border-gray-600'
                                            }
                    `}
                                    >
                                        <span className="text-2xl">{config.icon}</span>
                                        <div className="flex-1">
                                            <div className="font-semibold">{config.label}</div>
                                            <div className={`text-sm ${selectedBadge === type ? 'text-white/70' : 'text-gray-500'}`}>
                                                {config.description}
                                            </div>
                                        </div>
                                        {!config.autoVerify && (
                                            <span className={`text-xs px-2 py-1 rounded-full ${selectedBadge === type ? 'bg-white/20' : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                Needs review
                                            </span>
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>

                        {/* Reason input for badges needing review */}
                        {selectedBadge && !BADGE_CONFIGS[selectedBadge].autoVerify && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-6"
                            >
                                <label className="block text-gray-300 font-medium mb-2 text-sm">
                                    Why do you need this badge?
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={3}
                                    className="w-full p-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none resize-none text-sm"
                                />
                            </motion.div>
                        )}

                        {result?.error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {result.error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl text-gray-400 font-medium hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedBadge || submitting}
                                className={`
                  flex-1 py-3 rounded-xl font-bold transition-all
                  ${selectedBadge
                                        ? `bg-gradient-to-r ${BADGE_CONFIGS[selectedBadge].gradient} text-white hover:shadow-lg`
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }
                  disabled:opacity-50
                `}
                            >
                                {submitting ? 'Submitting...' : 'Request Badge'}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    )
}

export default BadgeSelector
