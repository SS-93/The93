import React, { useState } from 'react'
import { motion } from 'framer-motion'
import LockerTemplateA from '../components/LockerTemplateA'
import LockerTemplateB from '../components/LockerTemplateB'
// import LockerTemplateC from '../components/LockerTemplateC'
// import LockerTemplateD from '../components/LockerTemplateD'
import ArtistDashboardTemplateUI from '../components/ArtistDashboardTemplateUI'
import BrandDashboardTemplateUI from '../components/BrandDashboardTemplateUI'
import ArtistDashboardSpacious from '../components/ArtistDashboardSpacious'
import BrandDashboardSpacious from '../components/BrandDashboardSpacious'
import MessageCenterTemplateUI from '../components/MessageCenterTemplateUI'
import CulturalCollabPortal from '../components/CulturalCollabPortal'

// Mock data for testing
const mockLockerItemsA = [
  {
    id: '1',
    type: 'music' as const,
    artist: 'Arctic Waves',
    title: 'Midnight Sessions',
    description: 'Exclusive unreleased track from the vault',
    timeLeft: 180,
    rarity: 'rare' as const,
    isNew: true,
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    reactions: { heart: 42, fire: 18, star: 7 },
    userReaction: null,
    isSaved: false,
    shareCount: 12,
    commentCount: 8,
    fanTierRequired: 2
  },
  {
    id: '2',
    type: 'code' as const,
    artist: 'Brand Collab',
    title: '25% Off Nike Exclusive',
    description: 'Limited time discount code for Arctic Waves fans',
    timeLeft: 1440,
    rarity: 'legendary' as const,
    isNew: false,
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    codeValue: 'WAVES25',
    brandName: 'Nike',
    reactions: { heart: 156, fire: 89, star: 23 },
    userReaction: 'heart' as const,
    isSaved: true,
    shareCount: 45,
    commentCount: 32
  }
]

const mockDailyRewardsB = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  isUnlocked: i <= 7,
  isClaimed: i < 5,
  isToday: i === 5,
  type: ['music', 'video', 'image', 'code', 'event', 'bonus'][Math.floor(Math.random() * 6)] as any,
  rarity: ['common', 'rare', 'legendary'][Math.floor(Math.random() * 3)] as any,
  artist: i % 3 === 0 ? 'Arctic Waves' : i % 3 === 1 ? 'Neon Dreams' : 'Echo Valley',
  title: `Day ${i + 1} Reward`,
  description: `Special content for day ${i + 1}`,
  thumbnail: `https://images.unsplash.com/photo-${1493225457124 + i}?w=400`,
  brandName: i % 5 === 0 ? 'Nike' : i % 5 === 1 ? 'Apple' : undefined,
  streakBonus: i % 7 === 0
}))

const mockLootBoxesC = [
  {
    id: 'daily-free',
    type: 'daily' as const,
    rarity: 'common' as const,
    isAvailable: true,
    cost: 0,
    currency: 'free' as const,
    contents: []
  },
  {
    id: 'weekly-rare',
    type: 'weekly' as const,
    rarity: 'rare' as const,
    isAvailable: true,
    cost: 50,
    currency: 'tokens' as const,
    contents: []
  },
  {
    id: 'premium-epic',
    type: 'premium' as const,
    rarity: 'epic' as const,
    isAvailable: false,
    cost: 200,
    currency: 'tokens' as const,
    contents: []
  },
  {
    id: 'streak-legendary',
    type: 'streak' as const,
    rarity: 'legendary' as const,
    isAvailable: true,
    cost: 7,
    currency: 'streak' as const,
    contents: []
  }
]

const mockAchievementsC = [
  {
    id: 'first-login',
    name: 'First Steps',
    description: 'Log in for the first time',
    icon: '🚀',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    tier: 1
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 7-day login streak',
    icon: '🔥',
    progress: 5,
    maxProgress: 7,
    unlocked: false,
    tier: 2
  }
]

const mockInventoryC = [
  {
    id: 'item1',
    type: 'music' as const,
    name: 'Rare Track',
    rarity: 'rare' as const,
    artist: 'Arctic Waves'
  },
  {
    id: 'item2',
    type: 'code' as const,
    name: 'Discount Code',
    rarity: 'legendary' as const,
    brandName: 'Nike'
  }
]

// Mock data for Option D
const mockCollectionsD = [
  {
    id: 'recent',
    name: 'Recent Drops',
    emoji: '🔥',
    description: 'Your latest claimed rewards',
    totalValue: '$127',
    drops: [
      {
        id: 'd1',
        title: 'Midnight Sessions',
        artist: 'Arctic Waves',
        description: 'Exclusive unreleased track',
        emoji: '🎵',
        type: 'music' as const,
        rarity: 'rare' as const,
        claimedDate: '2024-01-15T10:30:00Z',
        isNew: true,
        priority: 5,
        reactions: { heart: 42, fire: 18, star: 7 },
        userReaction: null,
        isSaved: false,
        isUsed: false
      },
      {
        id: 'd2',
        title: '25% Off Nike Code',
        artist: 'Brand Partnership',
        description: 'Limited time discount',
        emoji: '🎟️',
        type: 'code' as const,
        rarity: 'legendary' as const,
        claimedDate: '2024-01-14T14:20:00Z',
        isNew: false,
        brandName: 'Nike',
        value: 'WAVES25',
        priority: 4,
        reactions: { heart: 156, fire: 89, star: 23 },
        userReaction: 'heart' as const,
        isSaved: true,
        isUsed: false
      },
      {
        id: 'd3',
        title: 'VIP Concert Access',
        artist: 'Echo Valley',
        description: 'Backstage pass to next show',
        emoji: '🎫',
        type: 'event' as const,
        rarity: 'epic' as const,
        claimedDate: '2024-01-13T16:45:00Z',
        isNew: false,
        priority: 5,
        reactions: { heart: 89, fire: 45, star: 12 },
        userReaction: 'fire' as const,
        isSaved: true,
        isUsed: true
      }
    ]
  },
  {
    id: 'music',
    name: 'Music Vault',
    emoji: '🎵',
    description: 'All your exclusive tracks',
    totalValue: '$89',
    drops: [
      {
        id: 'd4',
        title: 'DNA (Remix)',
        artist: 'Neon Dreams',
        description: 'Fan-exclusive remix',
        emoji: '🎶',
        type: 'music' as const,
        rarity: 'rare' as const,
        claimedDate: '2024-01-12T09:15:00Z',
        isNew: false,
        priority: 4,
        reactions: { heart: 67, fire: 34, star: 9 },
        userReaction: null,
        isSaved: true,
        isUsed: false
      }
    ]
  },
  {
    id: 'codes',
    name: 'Brand Codes',
    emoji: '🎟️',
    description: 'Discount codes and offers',
    totalValue: '$245',
    drops: [
      {
        id: 'd5',
        title: 'Apple Music 3 Months',
        artist: 'Brand Partnership',
        description: 'Free premium subscription',
        emoji: '🍎',
        type: 'code' as const,
        rarity: 'epic' as const,
        claimedDate: '2024-01-11T11:30:00Z',
        isNew: false,
        brandName: 'Apple',
        value: 'MUSIC3FREE',
        priority: 3,
        reactions: { heart: 234, fire: 123, star: 45 },
        userReaction: 'star' as const,
        isSaved: false,
        isUsed: true
      }
    ]
  }
]

const LockerDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'A' | 'B' | 'C' | 'D' | 'message-center' | 'collab-portal' | 'artist-dashboard' | 'brand-dashboard' | 'artist-spacious' | 'brand-spacious'>('A')
  const [selectedCollection, setSelectedCollection] = useState(mockCollectionsD[0])

  const handleMockAction = (action: string, ...args: any[]) => {
    console.log(`Mock action: ${action}`, args)
  }

  const handleSelectCollection = (collection: any) => {
    console.log('Selecting collection:', collection)
    setSelectedCollection(collection)
  }

  const handleCreatePlaylist = (dropIds: string[]) => {
    console.log('Creating playlist with drops:', dropIds)
  }

  const handleOpenLootBox = async (boxId: string) => {
    console.log('Opening loot box:', boxId)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return [
      {
        id: 'reward1',
        type: 'music' as const,
        name: 'Mystery Track',
        rarity: 'rare' as const,
        artist: 'Secret Artist'
      }
    ]
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Demo Selector */}
      <div className="fixed top-4 left-4 right-4 z-50 bg-gray-900/90 backdrop-blur-md rounded-xl p-4 border border-gray-700">
        <h1 className="text-white text-lg font-bold mb-3 text-center">Bucket Platform Demo</h1>
        <div className="grid grid-cols-8 gap-2">
          {['A', 'B', /* 'C', 'D' */].map((option) => (
            <button
              key={option}
              onClick={() => setActiveDemo(option as any)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeDemo === option
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <div className="text-center">
                <div className="font-bold">Locker {option}</div>
                <div className="text-xs">
                  {option === 'A' && '3D Carousel'}
                  {option === 'B' && 'Daily Calendar'}
                  {/* {option === 'C' && 'Gaming Loot'}
                  {option === 'D' && 'Wishlist Style'} */}
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => setActiveDemo('message-center')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeDemo === 'message-center'
                ? 'bg-purple-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-center">
              <div className="font-bold">Messages</div>
              <div className="text-xs">Center</div>
            </div>
          </button>
          <button
            onClick={() => setActiveDemo('collab-portal')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeDemo === 'collab-portal'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-center">
              <div className="font-bold">Cultural</div>
              <div className="text-xs">Collab</div>
            </div>
          </button>
          <button
            onClick={() => setActiveDemo('artist-dashboard')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeDemo === 'artist-dashboard'
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-center">
              <div className="font-bold">Artist</div>
              <div className="text-xs">Dashboard</div>
            </div>
          </button>
          <button
            onClick={() => setActiveDemo('brand-dashboard')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeDemo === 'brand-dashboard'
                ? 'bg-blue-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-center">
              <div className="font-bold">Brand</div>
              <div className="text-xs">Dashboard</div>
            </div>
          </button>
          <button
            onClick={() => setActiveDemo('artist-spacious')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeDemo === 'artist-spacious'
                ? 'bg-green-400 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-center">
              <div className="font-bold">Artist+</div>
              <div className="text-xs">Spacious</div>
            </div>
          </button>
          <button
            onClick={() => setActiveDemo('brand-spacious')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeDemo === 'brand-spacious'
                ? 'bg-blue-400 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-center">
              <div className="font-bold">Brand+</div>
              <div className="text-xs">Spacious</div>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-28">
        <motion.div
          key={activeDemo}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeDemo === 'A' && (
            <LockerTemplateA
              userTier={3}
              lockerItems={mockLockerItemsA}
              onReact={handleMockAction}
              onSave={handleMockAction}
              onShare={handleMockAction}
              onComment={handleMockAction}
              onClaimCode={handleMockAction}
            />
          )}
          
          {activeDemo === 'B' && (
            <LockerTemplateB
              userTier={3}
              currentStreak={5}
              totalDays={12}
              dailyRewards={mockDailyRewardsB}
              onClaimReward={(day) => handleMockAction('claim', day)}
              onReact={(day, reaction) => handleMockAction('react', day, reaction)} 
              onShare={(day) => handleMockAction('share', day)}
              onSave={(day) => handleMockAction('save', day)}
            />
          )}
          
          {/* Commented out for now - C and D templates
          {activeDemo === 'C' && (
            <LockerTemplateC
              userLevel={8}
              userXP={2350}
              userTokens={150}
              currentStreak={5}
              lootBoxes={mockLootBoxesC}
              achievements={mockAchievementsC}
              inventory={mockInventoryC}
              onOpenLootBox={handleOpenLootBox}
              onClaimAchievement={handleMockAction}
              onUseItem={handleMockAction}
            />
          )}
          
          {activeDemo === 'D' && (
            <LockerTemplateD
              userTier={3}
              collections={mockCollectionsD}
              activeCollection={selectedCollection}
              onSelectCollection={handleSelectCollection}
              onUseDrop={(dropId) => handleMockAction('useDrop', dropId)}
              onReact={(dropId, reaction) => handleMockAction('react', dropId, reaction)}
              onSave={(dropId) => handleMockAction('save', dropId)}
              onShare={(dropId) => handleMockAction('share', dropId)}
              onCreatePlaylist={handleCreatePlaylist}
            />
          )}
          */}

          {activeDemo === 'message-center' && <MessageCenterTemplateUI />}

          {activeDemo === 'collab-portal' && <CulturalCollabPortal />}

          {activeDemo === 'artist-dashboard' && <ArtistDashboardTemplateUI />}
          
          {activeDemo === 'brand-dashboard' && <BrandDashboardTemplateUI />}

          {activeDemo === 'artist-spacious' && <ArtistDashboardSpacious />}
          
          {activeDemo === 'brand-spacious' && <BrandDashboardSpacious />}
        </motion.div>
      </div>
    </div>
  )
}

export default LockerDemo 