import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LootBox {
  id: string
  type: 'daily' | 'weekly' | 'premium' | 'streak' | 'achievement'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isAvailable: boolean
  cost: number // 0 for free boxes
  currency: 'tokens' | 'streak' | 'free'
  contents: LootItem[]
  cooldownMinutes?: number
}

interface LootItem {
  id: string
  type: 'music' | 'video' | 'image' | 'code' | 'badge' | 'token' | 'experience'
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  artist?: string
  brandName?: string
  value?: string
  thumbnail?: string
  animated?: boolean
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  tier: number
}

interface LockerTemplateCProps {
  userLevel: number
  userXP: number
  userTokens: number
  currentStreak: number
  lootBoxes: LootBox[]
  achievements: Achievement[]
  inventory: LootItem[]
  onOpenLootBox: (boxId: string) => Promise<LootItem[]>
  onClaimAchievement: (achievementId: string) => void
  onUseItem: (itemId: string) => void
}

const LockerTemplateC: React.FC<LockerTemplateCProps> = ({
  userLevel,
  userXP,
  userTokens,
  currentStreak,
  lootBoxes,
  achievements,
  inventory,
  onOpenLootBox,
  onClaimAchievement,
  onUseItem
}) => {
  const [activeTab, setActiveTab] = useState<'loot' | 'achievements' | 'inventory'>('loot')
  const [openingBox, setOpeningBox] = useState<string | null>(null)
  const [revealedItems, setRevealedItems] = useState<LootItem[]>([])
  const [showRewards, setShowRewards] = useState(false)
  const [spinningWheel, setSpinningWheel] = useState(false)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600'
      case 'rare': return 'from-blue-500 to-blue-600'
      case 'epic': return 'from-purple-500 to-purple-600'
      case 'legendary': return 'from-yellow-500 to-yellow-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-500/50'
      case 'rare': return 'shadow-blue-500/50'
      case 'epic': return 'shadow-purple-500/50'
      case 'legendary': return 'shadow-yellow-500/70'
      default: return 'shadow-gray-500/50'
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'music':
        return '🎵'
      case 'video':
        return '🎬'
      case 'image':
        return '🖼️'
      case 'code':
        return '🎟️'
      case 'badge':
        return '🏆'
      case 'token':
        return '🪙'
      case 'experience':
        return '⭐'
      default:
        return '📦'
    }
  }

  const handleOpenLootBox = async (boxId: string) => {
    setOpeningBox(boxId)
    setSpinningWheel(true)
    
    // Spinning animation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const items = await onOpenLootBox(boxId)
      setRevealedItems(items)
      setSpinningWheel(false)
      setShowRewards(true)
      
      setTimeout(() => {
        setShowRewards(false)
        setOpeningBox(null)
        setRevealedItems([])
      }, 4000)
    } catch (error) {
      setSpinningWheel(false)
      setOpeningBox(null)
    }
  }

  const getLevelProgress = () => {
    const currentLevelXP = userLevel * 1000
    const nextLevelXP = (userLevel + 1) * 1000
    return ((userXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header with Stats */}
      <div className="p-4 bg-gray-900/50 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-accent-yellow to-yellow-600 rounded-full flex items-center justify-center font-bold text-xl text-black">
                {userLevel}
              </div>
              <div className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                !
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">Loot Vault</h1>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-yellow-400">🪙 {userTokens}</span>
                <span className="text-red-400">🔥 {currentStreak}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Level {userLevel}</div>
            <div className="w-32 bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="bg-gradient-to-r from-accent-yellow to-yellow-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getLevelProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {['loot', 'achievements', 'inventory'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-accent-yellow text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'loot' && '🎁 Loot'}
              {tab === 'achievements' && '🏆 Achievements'}
              {tab === 'inventory' && '📦 Inventory'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* Loot Boxes Tab */}
        {activeTab === 'loot' && (
          <div className="space-y-6">
            {/* Daily Spin Wheel */}
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4 text-center">Daily Spin Wheel</h2>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <motion.div
                    animate={spinningWheel ? { rotate: 1080 } : {}}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="w-48 h-48 rounded-full border-8 border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                  >
                    <div className="grid grid-cols-2 gap-1 w-32 h-32">
                      <div className="bg-gray-600 rounded-tl-full flex items-center justify-center text-2xl">🎵</div>
                      <div className="bg-blue-600 rounded-tr-full flex items-center justify-center text-2xl">🎬</div>
                      <div className="bg-purple-600 rounded-bl-full flex items-center justify-center text-2xl">🎟️</div>
                      <div className="bg-yellow-600 rounded-br-full flex items-center justify-center text-2xl">🏆</div>
                    </div>
                  </motion.div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-accent-yellow" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleOpenLootBox('daily-spin')}
                disabled={openingBox !== null}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
                  openingBox
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-accent-yellow to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500'
                }`}
              >
                {openingBox ? 'SPINNING...' : 'SPIN NOW (FREE)'}
              </button>
            </div>

            {/* Loot Boxes Grid */}
            <div className="grid grid-cols-2 gap-4">
              {lootBoxes.map((box) => (
                <motion.div
                  key={box.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-gradient-to-br ${getRarityColor(box.rarity)} rounded-2xl p-4 border-2 border-gray-700 ${getRarityGlow(box.rarity)}`}
                >
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">
                      {box.type === 'daily' && '📦'}
                      {box.type === 'weekly' && '🎁'}
                      {box.type === 'premium' && '💎'}
                      {box.type === 'streak' && '🔥'}
                      {box.type === 'achievement' && '🏆'}
                    </div>
                    <h3 className="font-bold text-sm">{box.type.toUpperCase()}</h3>
                    <div className={`text-xs px-2 py-1 rounded-full bg-black/30 ${
                      box.rarity === 'legendary' ? 'text-yellow-400' :
                      box.rarity === 'epic' ? 'text-purple-400' :
                      box.rarity === 'rare' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {box.rarity.toUpperCase()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleOpenLootBox(box.id)}
                    disabled={!box.isAvailable || openingBox !== null}
                    className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                      !box.isAvailable
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : openingBox === box.id
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-black/30 text-white hover:bg-black/50'
                    }`}
                  >
                    {!box.isAvailable
                      ? 'LOCKED'
                      : openingBox === box.id
                      ? 'OPENING...'
                      : box.cost === 0
                      ? 'OPEN FREE'
                      : `${box.cost} ${box.currency.toUpperCase()}`
                    }
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-gray-900/50 backdrop-blur-md rounded-xl p-4 border ${
                  achievement.unlocked ? 'border-green-500' : 'border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                        <span>Tier {achievement.tier}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <button
                      onClick={() => onClaimAchievement(achievement.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-400 transition-colors"
                    >
                      CLAIM
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-3 gap-4">
            {inventory.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                className={`bg-gradient-to-br ${getRarityColor(item.rarity)} rounded-xl p-3 border border-gray-700 ${getRarityGlow(item.rarity)}`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getItemIcon(item.type)}</div>
                  <h4 className="font-bold text-xs mb-1">{item.name}</h4>
                  {item.artist && (
                    <p className="text-xs text-gray-300">by {item.artist}</p>
                  )}
                  {item.brandName && (
                    <p className="text-xs text-green-400">{item.brandName}</p>
                  )}
                  <div className={`text-xs mt-2 ${
                    item.rarity === 'legendary' ? 'text-yellow-400' :
                    item.rarity === 'epic' ? 'text-purple-400' :
                    item.rarity === 'rare' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {item.rarity.toUpperCase()}
                  </div>
                  <button
                    onClick={() => onUseItem(item.id)}
                    className="w-full mt-2 py-1 bg-black/30 text-white rounded-md text-xs font-medium hover:bg-black/50 transition-colors"
                  >
                    USE
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Loot Box Opening Animation */}
      <AnimatePresence>
        {showRewards && revealedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="text-8xl mb-6"
              >
                🎉
              </motion.div>
              
              <h2 className="text-3xl font-bold text-accent-yellow mb-6">REWARDS UNLOCKED!</h2>
              
              <div className="flex justify-center space-x-4">
                {revealedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className={`bg-gradient-to-br ${getRarityColor(item.rarity)} rounded-xl p-4 border-2 border-gray-700 ${getRarityGlow(item.rarity)}`}
                  >
                    <div className="text-4xl mb-2">{getItemIcon(item.type)}</div>
                    <h3 className="font-bold text-sm">{item.name}</h3>
                    <div className={`text-xs ${
                      item.rarity === 'legendary' ? 'text-yellow-400' :
                      item.rarity === 'epic' ? 'text-purple-400' :
                      item.rarity === 'rare' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {item.rarity.toUpperCase()}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <p className="text-gray-400 mt-6">Added to your inventory</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LockerTemplateC 