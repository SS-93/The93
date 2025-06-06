import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LockerDrop {
  id: string
  title: string
  artist: string
  description: string
  emoji: string
  type: 'music' | 'video' | 'image' | 'code' | 'event' | 'exclusive'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  claimedDate: string
  isNew: boolean
  brandName?: string
  value?: string
  timeLeft?: number // minutes until expires
  priority: number // 1-5 star priority system
  reactions: {
    heart: number
    fire: number
    star: number
  }
  userReaction?: 'heart' | 'fire' | 'star' | null
  isSaved: boolean
  isUsed: boolean
}

interface Collection {
  id: string
  name: string
  emoji: string
  description: string
  drops: LockerDrop[]
  totalValue: string
}

interface LockerTemplateDProps {
  userTier: number
  collections: Collection[]
  activeCollection: Collection
  onSelectCollection: (collection: Collection) => void
  onUseDrop: (dropId: string) => void
  onReact: (dropId: string, reaction: 'heart' | 'fire' | 'star') => void
  onSave: (dropId: string) => void
  onShare: (dropId: string) => void
  onCreatePlaylist: (dropIds: string[]) => void
}

const LockerTemplateD: React.FC<LockerTemplateDProps> = ({
  userTier,
  collections,
  activeCollection,
  onSelectCollection,
  onUseDrop,
  onReact,
  onSave,
  onShare,
  onCreatePlaylist
}) => {
  const [selectedDrops, setSelectedDrops] = useState<string[]>([])
  const [filterType, setFilterType] = useState<'all' | 'music' | 'codes' | 'events'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'rarity'>('recent')

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280'
      case 'rare': return '#3B82F6' 
      case 'epic': return '#8B5CF6'
      case 'legendary': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  const getPriorityStars = (priority: number) => {
    return '★'.repeat(priority) + '☆'.repeat(5 - priority)
  }

  const filteredAndSortedDrops = () => {
    let drops = [...activeCollection.drops]
    
    // Filter by type
    if (filterType !== 'all') {
      drops = drops.filter(drop => {
        if (filterType === 'music') return drop.type === 'music'
        if (filterType === 'codes') return drop.type === 'code'
        if (filterType === 'events') return drop.type === 'event'
        return true
      })
    }
    
    // Sort
    drops.sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.claimedDate).getTime() - new Date(a.claimedDate).getTime()
      if (sortBy === 'priority') return b.priority - a.priority
      if (sortBy === 'rarity') {
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
        return rarityOrder[b.rarity] - rarityOrder[a.rarity]
      }
      return 0
    })
    
    return drops
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-[#222] text-white font-['Poppins']">
      {/* Header with Collection Info */}
      <div className="flex items-center justify-center pt-8 pb-6">
        <div className="flex flex-col items-center">
          <div className="text-7xl mb-2">
            {activeCollection.emoji}
          </div>
          <div className="text-lg text-white capitalize mb-1">
            {activeCollection.name}
          </div>
          <div className="text-sm text-gray-400">
            {activeCollection.drops.length} drops • {activeCollection.totalValue} total value
          </div>
        </div>
      </div>

      {/* Collection Selector */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => onSelectCollection(collection)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all ${
                activeCollection.id === collection.id
                  ? 'bg-[#ffffff1a] text-white'
                  : 'bg-[#0000001a] text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{collection.emoji}</span>
              {collection.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="px-4 mb-6">
        <div className="bg-[#ffffff1a] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-medium">LOCKER.DROPS</h3>
            <div className="text-sm text-gray-400">
              Tier {userTier} • {filteredAndSortedDrops().length} items
            </div>
          </div>
          
          <div className="flex space-x-4 text-sm">
            <div className="flex space-x-2">
              <span className="text-gray-400">Filter:</span>
              {['all', 'music', 'codes', 'events'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter as any)}
                  className={`px-2 py-1 rounded ${
                    filterType === filter ? 'bg-[#00aeff] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <span className="text-gray-400">Sort:</span>
              {[
                { key: 'recent', label: 'Recent' },
                { key: 'priority', label: 'Priority' },
                { key: 'rarity', label: 'Rarity' }
              ].map((sort) => (
                <button
                  key={sort.key}
                  onClick={() => setSortBy(sort.key as any)}
                  className={`px-2 py-1 rounded ${
                    sortBy === sort.key ? 'bg-[#00aeff] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drops List */}
      <div className="px-4 pb-20">
        <div className="max-w-md mx-auto">
          <div className="bg-[#ffffff1a] rounded-xl p-5 min-h-[400px]">
            {filteredAndSortedDrops().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h4 className="font-semibold text-white mb-2">No drops found</h4>
                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedDrops().map((drop, index) => (
                  <motion.div
                    key={drop.id}
                    className="relative overflow-hidden flex justify-between items-center p-2.5 gap-2.5 rounded-xl bg-[#0000001a] cursor-pointer transition-all duration-200 ease-linear hover:bg-white hover:scale-[1.03] hover:translate-x-[6px] hover:translate-y-[-3px] group/drop"
                    onClick={() => onUseDrop(drop.id)}
                    whileHover={{ transition: { duration: 0.2 } }}
                  >
                    {/* Index Number - Slides in on hover */}
                    <h2 className="absolute right-[-75px] top-1/2 transform -translate-y-1/2 text-[#00aeff] duration-200 text-[2em] group-hover/drop:right-6">
                      <small className="font-medium opacity-25">#</small>
                      {index + 1}
                    </h2>

                    {/* Main Content */}
                    <div className="flex grow flex-col relative min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold leading-[1.2em] duration-200 group-hover/drop:text-[#222] capitalize overflow-hidden text-ellipsis whitespace-nowrap pr-8">
                          {drop.title}
                        </h4>
                        <div className="flex-shrink-0 flex items-center space-x-2">
                          {/* Status Indicators */}
                          {drop.isNew && (
                            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                              NEW
                            </div>
                          )}
                          {drop.isUsed && (
                            <svg
                              className="w-4 h-4 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                          <div className="text-lg">
                            {drop.emoji || '🎁'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <p className="text-xs duration-200 group-hover/drop:text-[#222] overflow-hidden text-ellipsis whitespace-nowrap mb-1">
                            {drop.artist && `by ${drop.artist}`}
                            {drop.brandName && ` • ${drop.brandName}`}
                          </p>
                          <p className="text-xs duration-200 group-hover/drop:text-[#222] opacity-75">
                            {formatDate(drop.claimedDate)}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          {/* Priority Stars */}
                          <div 
                            className="text-xs mb-1"
                            style={{ color: getRarityColor(drop.rarity) }}
                          >
                            {getPriorityStars(drop.priority)}
                          </div>
                          
                          {/* Rarity Badge */}
                          <div 
                            className="text-xs px-2 py-1 rounded-full bg-black/20"
                            style={{ color: getRarityColor(drop.rarity) }}
                          >
                            {drop.rarity.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Brand Code Special Display */}
                      {drop.type === 'code' && drop.value && (
                        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-green-400 text-xs font-bold">
                              {drop.brandName} Code: {drop.value}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onUseDrop(drop.id)
                              }}
                              className="text-xs bg-green-500 text-black px-2 py-1 rounded hover:bg-green-400 transition-colors"
                            >
                              USE
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Slide up on hover */}
                    <div className="absolute -bottom-8 right-4 flex space-x-1 duration-200 group-hover/drop:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onReact(drop.id, 'heart')
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                          drop.userReaction === 'heart' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        ❤️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSave(drop.id)
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                          drop.isSaved ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-yellow-500 hover:text-black'
                        }`}
                      >
                        🔖
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onShare(drop.id)
                        }}
                        className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-400 transition-colors"
                      >
                        📤
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collection Actions - Fixed Bottom */}
      {selectedDrops.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#222]/90 backdrop-blur-md border-t border-gray-700 p-4">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {selectedDrops.length} selected
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onCreatePlaylist(selectedDrops)}
                className="bg-[#00aeff] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Create Playlist
              </button>
              <button
                onClick={() => setSelectedDrops([])}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LockerTemplateD 