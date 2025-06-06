import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DailyReward {
  day: number
  isUnlocked: boolean
  isClaimed: boolean
  isToday: boolean
  type: 'music' | 'video' | 'image' | 'code' | 'event' | 'bonus'
  rarity: 'common' | 'rare' | 'legendary'
  artist?: string
  title?: string
  description?: string
  thumbnail?: string
  brandName?: string
  codeValue?: string
  streakBonus?: boolean
}

interface LockerTemplateB_Props {
  userTier: number
  currentStreak: number
  totalDays: number
  dailyRewards: DailyReward[]
  onClaimReward: (day: number) => void
  onReact: (day: number, reaction: 'heart' | 'fire' | 'star') => void
  onShare: (day: number) => void
  onSave: (day: number) => void
}

const LockerTemplateB: React.FC<LockerTemplateB_Props> = ({
  userTier,
  currentStreak,
  totalDays,
  dailyRewards,
  onClaimReward,
  onReact,
  onShare,
  onSave
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [claimingReward, setClaimingReward] = useState<number | null>(null)

  const getCurrentDayReward = () => {
    return dailyRewards.find(reward => reward.isToday)
  }

  const getRewardTypeIcon = (type: string, rarity: string) => {
    const rarityClasses = {
      common: 'text-gray-400',
      rare: 'text-blue-400',
      legendary: 'text-yellow-400'
    }
    
    const baseClass = rarityClasses[rarity as keyof typeof rarityClasses] || 'text-gray-400'
    
    switch (type) {
      case 'music':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={baseClass}>
            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'video':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={baseClass}>
            <polygon points="23,12 8,22 8,2" fill="currentColor"/>
          </svg>
        )
      case 'code':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-400">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'bonus':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-400">
            <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26 12,2" fill="currentColor"/>
          </svg>
        )
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={baseClass}>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
    }
  }

  const handleClaimReward = async (day: number) => {
    setClaimingReward(day)
    await new Promise(resolve => setTimeout(resolve, 1500)) // Animation delay
    onClaimReward(day)
    setClaimingReward(null)
    setShowRewardModal(true)
    setTimeout(() => setShowRewardModal(false), 3000)
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    if (streak >= 3) return '⚡'
    return '💫'
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-500/30'
      case 'rare': return 'shadow-blue-400/50'
      case 'legendary': return 'shadow-yellow-400/70'
      default: return 'shadow-gray-500/30'
    }
  }

  const selectedReward = selectedDay ? dailyRewards.find(r => r.day === selectedDay) : null

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header Stats */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 mb-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Daily Rewards</h1>
            <p className="text-gray-400">Claim your daily drops</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Tier {userTier}</div>
            <div className="w-12 h-12 bg-accent-yellow text-black rounded-full flex items-center justify-center font-bold text-xl">
              {userTier}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-yellow">{currentStreak}</div>
            <div className="text-sm text-gray-400">Day Streak</div>
            <div className="text-lg">{getStreakEmoji(currentStreak)}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{totalDays}</div>
            <div className="text-sm text-gray-400">Total Days</div>
            <div className="text-lg">📅</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {dailyRewards.filter(r => r.isClaimed).length}
            </div>
            <div className="text-sm text-gray-400">Rewards</div>
            <div className="text-lg">🎁</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 mb-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">This Month's Calendar</h2>
        <div className="grid grid-cols-7 gap-2">
          {dailyRewards.map((reward) => (
            <motion.button
              key={reward.day}
              onClick={() => reward.isUnlocked && !reward.isClaimed ? handleClaimReward(reward.day) : setSelectedDay(reward.day)}
              disabled={!reward.isUnlocked || claimingReward === reward.day}
              className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all relative ${
                reward.isClaimed
                  ? 'border-green-500 bg-green-500/20'
                  : reward.isToday && reward.isUnlocked
                  ? 'border-accent-yellow bg-accent-yellow/20 animate-pulse'
                  : reward.isUnlocked
                  ? 'border-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                  : 'border-gray-600 bg-gray-800/50'
              } ${getRarityGlow(reward.rarity)}`}
              whileHover={reward.isUnlocked ? { scale: 1.05 } : {}}
              whileTap={reward.isUnlocked ? { scale: 0.95 } : {}}
            >
              {/* Day Number */}
              <div className="text-xs font-bold mb-1">{reward.day}</div>
              
              {/* Reward Icon */}
              <div className="scale-75">
                {claimingReward === reward.day ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-yellow">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="16" strokeDashoffset="12"/>
                    </svg>
                  </motion.div>
                ) : reward.isClaimed ? (
                  <div className="text-green-400 text-xl">✓</div>
                ) : reward.isUnlocked ? (
                  getRewardTypeIcon(reward.type, reward.rarity)
                ) : (
                  <div className="text-gray-600 text-xl">🔒</div>
                )}
              </div>
              
              {/* Streak Bonus Indicator */}
              {reward.streakBonus && (
                <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  ⭐
                </div>
              )}
              
              {/* New Indicator */}
              {reward.isToday && reward.isUnlocked && !reward.isClaimed && (
                <div className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                  !
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Actions for Today */}
      {getCurrentDayReward() && !getCurrentDayReward()?.isClaimed && (
        <div className="bg-gradient-to-r from-accent-yellow/20 to-yellow-600/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-accent-yellow/30">
          <h2 className="text-xl font-bold mb-2 text-accent-yellow">Today's Reward Ready!</h2>
          <p className="text-gray-300 mb-4">Don't miss out on your daily drop</p>
          <button
            onClick={() => handleClaimReward(getCurrentDayReward()!.day)}
            className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors w-full"
          >
            🎁 Claim Today's Reward
          </button>
        </div>
      )}

      {/* Selected Reward Detail Modal */}
      <AnimatePresence>
        {selectedDay && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2 ${
                selectedReward.rarity === 'legendary' ? 'border-yellow-400' :
                selectedReward.rarity === 'rare' ? 'border-blue-400' :
                'border-gray-600'
              } ${getRarityGlow(selectedReward.rarity)}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">
                  {selectedReward.isClaimed ? '✅' : selectedReward.isUnlocked ? '🎁' : '🔒'}
                </div>
                <h3 className="text-xl font-bold">Day {selectedReward.day} Reward</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  selectedReward.rarity === 'legendary' ? 'bg-yellow-400/20 text-yellow-400' :
                  selectedReward.rarity === 'rare' ? 'bg-blue-400/20 text-blue-400' :
                  'bg-gray-600/20 text-gray-400'
                }`}>
                  {selectedReward.rarity.toUpperCase()}
                </div>
              </div>

              {selectedReward.title && (
                <div className="mb-4">
                  <h4 className="font-bold mb-1">{selectedReward.title}</h4>
                  {selectedReward.artist && (
                    <p className="text-gray-400 text-sm">by {selectedReward.artist}</p>
                  )}
                  {selectedReward.description && (
                    <p className="text-gray-300 text-sm mt-2">{selectedReward.description}</p>
                  )}
                </div>
              )}

              {selectedReward.type === 'code' && selectedReward.brandName && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-green-400 font-bold">{selectedReward.brandName} Discount</p>
                  <p className="text-sm text-gray-400">Special brand collaboration code</p>
                </div>
              )}

              <div className="flex space-x-2">
                {selectedReward.isClaimed ? (
                  <>
                    <button
                      onClick={() => onReact(selectedReward.day, 'heart')}
                      className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                    >
                      ❤️ React
                    </button>
                    <button
                      onClick={() => onShare(selectedReward.day)}
                      className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
                    >
                      📤 Share
                    </button>
                    <button
                      onClick={() => onSave(selectedReward.day)}
                      className="flex-1 bg-yellow-500/20 text-yellow-400 py-2 rounded-lg font-medium hover:bg-yellow-500/30 transition-colors"
                    >
                      🔖 Save
                    </button>
                  </>
                ) : selectedReward.isUnlocked ? (
                  <button
                    onClick={() => {
                      handleClaimReward(selectedReward.day)
                      setSelectedDay(null)
                    }}
                    className="w-full bg-accent-yellow text-black py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors"
                  >
                    🎁 Claim Reward
                  </button>
                ) : (
                  <div className="w-full text-center py-3 text-gray-500">
                    🔒 Locked - Come back later
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Animation Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-accent-yellow mb-2">Reward Claimed!</h2>
              <p className="text-gray-300">Added to your collection</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LockerTemplateB 