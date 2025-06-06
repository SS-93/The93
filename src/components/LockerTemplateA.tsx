import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LockerItem {
  id: string
  type: 'music' | 'video' | 'image' | 'code' | 'event'
  artist: string
  title: string
  description: string
  timeLeft: number // minutes until expires
  rarity: 'common' | 'rare' | 'legendary'
  isNew: boolean
  thumbnail: string
  codeValue?: string
  brandName?: string
  reactions: {
    heart: number
    fire: number
    star: number
  }
  userReaction?: 'heart' | 'fire' | 'star' | null
  isSaved: boolean
  shareCount: number
  commentCount: number
  fanTierRequired?: number // tier needed to comment
}

interface LockerTemplateAProps {
  userTier: number
  lockerItems: LockerItem[]
  onReact: (itemId: string, reaction: 'heart' | 'fire' | 'star') => void
  onSave: (itemId: string) => void
  onShare: (itemId: string) => void
  onComment: (itemId: string) => void
  onClaimCode: (itemId: string) => void
}

const LockerTemplateA: React.FC<LockerTemplateAProps> = ({
  userTier,
  lockerItems,
  onReact,
  onSave,
  onShare,
  onComment,
  onClaimCode
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLefts, setTimeLefts] = useState<{[key: string]: number}>({})

  // Initialize time left for all items
  useEffect(() => {
    const times: {[key: string]: number} = {}
    lockerItems.forEach(item => {
      times[item.id] = item.timeLeft
    })
    setTimeLefts(times)
  }, [lockerItems])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLefts(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(id => {
          if (updated[id] > 0) {
            updated[id] -= 1
          }
        })
        return updated
      })
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const formatTimeLeft = (minutes: number) => {
    if (minutes <= 0) return 'EXPIRED'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500'
      case 'rare': return 'border-blue-400'
      case 'legendary': return 'border-yellow-400'
      default: return 'border-gray-500'
    }
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-500/20'
      case 'rare': return 'shadow-blue-400/30'
      case 'legendary': return 'shadow-yellow-400/40'
      default: return 'shadow-gray-500/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'music':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-yellow">
            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'video':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-yellow">
            <polygon points="23,12 8,22 8,2" fill="currentColor"/>
          </svg>
        )
      case 'code':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-400">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="15" x2="12" y2="15" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'event':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
    }
  }

  if (lockerItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold mb-2">Your Locker is Empty</h2>
          <p className="text-gray-400">Check back tomorrow for new drops!</p>
        </div>
      </div>
    )
  }

  const currentItem = lockerItems[currentIndex]
  const timeLeft = timeLefts[currentItem?.id] || 0

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-accent-yellow to-yellow-600 rounded-full flex items-center justify-center">
              🔒
            </div>
            <div>
              <h1 className="font-bold text-lg">Daily Locker</h1>
              <p className="text-sm text-gray-400">{lockerItems.length} drops available</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">Tier {userTier}</div>
            <div className="w-8 h-8 bg-accent-yellow text-black rounded-full flex items-center justify-center font-bold">
              {userTier}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-6"
          >
            {/* Card */}
            <div className={`bg-gray-900/50 backdrop-blur-md rounded-3xl p-6 mx-auto max-w-md border-2 ${getRarityColor(currentItem.rarity)} shadow-2xl ${getRarityGlow(currentItem.rarity)}`}>
              
              {/* New Badge */}
              {currentItem.isNew && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  NEW
                </div>
              )}

              {/* Time Left */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(currentItem.type)}
                  <span className="text-sm font-medium text-gray-300">{currentItem.type.toUpperCase()}</span>
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                  timeLeft <= 60 ? 'bg-red-500/20 text-red-400' :
                  timeLeft <= 180 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {formatTimeLeft(timeLeft)}
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="w-full h-48 bg-gray-800 rounded-2xl mb-4 flex items-center justify-center">
                  <img src={currentItem.thumbnail} alt={currentItem.title} className="w-full h-full object-cover rounded-2xl" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{currentItem.title}</h3>
                <p className="text-gray-400 text-sm mb-2">by {currentItem.artist}</p>
                <p className="text-gray-300">{currentItem.description}</p>

                {/* Brand Code */}
                {currentItem.type === 'code' && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 font-bold">{currentItem.brandName} Code</p>
                        <p className="text-sm text-gray-400">Tap to reveal</p>
                      </div>
                      <button
                        onClick={() => onClaimCode(currentItem.id)}
                        className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-green-400 transition-colors"
                      >
                        CLAIM
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reactions */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onReact(currentItem.id, 'heart')}
                    className={`flex items-center space-x-1 ${currentItem.userReaction === 'heart' ? 'text-red-400' : 'text-gray-400'} hover:text-red-400 transition-colors`}
                  >
                    <span className="text-lg">❤️</span>
                    <span className="text-sm">{currentItem.reactions.heart}</span>
                  </button>
                  <button
                    onClick={() => onReact(currentItem.id, 'fire')}
                    className={`flex items-center space-x-1 ${currentItem.userReaction === 'fire' ? 'text-orange-400' : 'text-gray-400'} hover:text-orange-400 transition-colors`}
                  >
                    <span className="text-lg">🔥</span>
                    <span className="text-sm">{currentItem.reactions.fire}</span>
                  </button>
                  <button
                    onClick={() => onReact(currentItem.id, 'star')}
                    className={`flex items-center space-x-1 ${currentItem.userReaction === 'star' ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-400 transition-colors`}
                  >
                    <span className="text-lg">⭐</span>
                    <span className="text-sm">{currentItem.reactions.star}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onSave(currentItem.id)}
                    className={`${currentItem.isSaved ? 'text-accent-yellow' : 'text-gray-400'} hover:text-accent-yellow transition-colors`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke="currentColor" strokeWidth="2" fill={currentItem.isSaved ? 'currentColor' : 'none'}/>
                    </svg>
                  </button>
                  <button
                    onClick={() => onShare(currentItem.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="16,6 12,2 8,6" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Comments Button */}
              <button
                onClick={() => onComment(currentItem.id)}
                disabled={currentItem.fanTierRequired ? userTier < currentItem.fanTierRequired : false}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  currentItem.fanTierRequired && userTier < currentItem.fanTierRequired
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {currentItem.fanTierRequired && userTier < currentItem.fanTierRequired
                  ? `Tier ${currentItem.fanTierRequired}+ Required to Comment`
                  : `View Comments (${currentItem.commentCount})`
                }
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center space-x-2">
        {lockerItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-accent-yellow' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-gray-800 p-4">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button
            onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : lockerItems.length - 1)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Previous</span>
          </button>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">
              {currentIndex + 1} of {lockerItems.length}
            </div>
          </div>
          
          <button
            onClick={() => setCurrentIndex(prev => prev < lockerItems.length - 1 ? prev + 1 : 0)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span>Next</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LockerTemplateA 