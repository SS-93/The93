import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

interface Artist {
  id: string
  name: string
  avatar: string
  banner?: string
  genre: string
  isVerified: boolean
  subscribers: number
  monthlyListeners: number
  subscriptionTiers: {
    id: string
    name: string
    price: number
    benefits: string[]
  }[]
  latestDrop?: {
    title: string
    type: 'audio' | 'video' | 'image'
    thumbnail: string
    timeAgo: string
  }
  tags: string[]
  isNew: boolean
  trustScore: number // Underground credibility score
}

interface UserCatalogProps {
  userRole?: 'fan' | 'artist' | 'brand' | 'developer'
  onRoleSwitch?: (role: 'fan' | 'artist' | 'brand' | 'developer') => void
}

// Mock underground artists data
const mockUndergroundArtists: Artist[] = [
  {
    id: '1',
    name: 'Neon Cipher',
    avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face',
    banner: 'https://images.unsplash.com/photo-1518972734183-9b5d16b5b7bb?w=800&h=300&fit=crop',
    genre: 'Underground Electronic',
    isVerified: false,
    subscribers: 2847,
    monthlyListeners: 15623,
    subscriptionTiers: [
      { id: '1', name: 'Inner Circle', price: 3, benefits: ['Early access', 'Exclusive tracks'] },
      { id: '2', name: 'VIP Vault', price: 8, benefits: ['Everything in Inner Circle', 'Monthly stems', '1-on-1 feedback'] }
    ],
    latestDrop: {
      title: 'Midnight Protocol',
      type: 'audio',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
      timeAgo: '2h ago'
    },
    tags: ['synthwave', 'cyberpunk', 'experimental'],
    isNew: true,
    trustScore: 94
  },
  {
    id: '2',
    name: 'Luna Shadows',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b515?w=150&h=150&fit=crop&crop=face',
    genre: 'Dark Ambient',
    isVerified: true,
    subscribers: 5234,
    monthlyListeners: 28941,
    subscriptionTiers: [
      { id: '1', name: 'Shadow Realm', price: 5, benefits: ['Weekly releases', 'Behind-the-scenes'] }
    ],
    latestDrop: {
      title: 'Echoes in the Void',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1494790108755-2616b612b515?w=100&h=100&fit=crop',
      timeAgo: '1d ago'
    },
    tags: ['dark ambient', 'meditation', 'cinematic'],
    isNew: false,
    trustScore: 98
  },
  // Add more artists...
]

const UserCatalog: React.FC<UserCatalogProps> = ({ userRole = 'fan', onRoleSwitch }) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [artists, setArtists] = useState<Artist[]>(mockUndergroundArtists)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { user } = useAuth()

  const genres = ['all', 'underground electronic', 'dark ambient', 'experimental hip-hop', 'indie synthwave', 'lo-fi garage']

  const filteredArtists = artists.filter(artist => {
    const matchesGenre = selectedGenre === 'all' || artist.genre.toLowerCase().includes(selectedGenre)
    const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         artist.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesGenre && matchesSearch
  })

  const ArtistCard = ({ artist }: { artist: Artist }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative glass rounded-2xl overflow-hidden border border-white/10 hover:border-accent-yellow/50 transition-all duration-300"
    >
      {/* Artist Banner */}
      <div className="relative h-32 bg-gradient-to-r from-gray-800 to-gray-900 overflow-hidden">
        {artist.banner && (
          <img src={artist.banner} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Trust Score & New Badge */}
        <div className="absolute top-3 right-3 flex gap-2">
          {artist.isNew && (
            <span className="px-2 py-1 bg-accent-yellow text-black text-xs font-bold rounded-full">
              NEW
            </span>
          )}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-1 rounded-full">
            <span className="text-green-400 text-xs">⚡</span>
            <span className="text-white text-xs font-bold">{artist.trustScore}</span>
          </div>
        </div>

        {/* Verification */}
        {artist.isVerified && (
          <div className="absolute top-3 left-3">
            <span className="text-accent-yellow text-lg">✓</span>
          </div>
        )}
      </div>

      {/* Artist Info */}
      <div className="p-6">
        {/* Avatar & Name */}
        <div className="flex items-start gap-4 mb-4">
          <img 
            src={artist.avatar} 
            alt={artist.name}
            className="w-16 h-16 rounded-xl border-2 border-white/20 group-hover:border-accent-yellow/50 transition-colors"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{artist.name}</h3>
            <p className="text-gray-400 text-sm mb-2">{artist.genre}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{artist.subscribers.toLocaleString()} followers</span>
              <span>{artist.monthlyListeners.toLocaleString()} monthly</span>
            </div>
          </div>
        </div>

        {/* Latest Drop */}
        {artist.latestDrop && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <img src={artist.latestDrop.thumbnail} alt="" className="w-10 h-10 rounded-lg" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{artist.latestDrop.title}</p>
                <p className="text-gray-400 text-xs">{artist.latestDrop.timeAgo}</p>
              </div>
              <div className="text-accent-yellow text-sm">
                {artist.latestDrop.type === 'audio' ? '🎵' : 
                 artist.latestDrop.type === 'video' ? '🎬' : '🖼️'}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {artist.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        {/* Subscription Tiers */}
        <div className="space-y-2">
          {artist.subscriptionTiers.map(tier => (
            <button
              key={tier.id}
              className="w-full p-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 hover:from-accent-yellow/20 hover:to-accent-yellow/10 rounded-xl border border-gray-600/50 hover:border-accent-yellow/50 transition-all group/tier"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-white font-medium">{tier.name}</p>
                  <p className="text-gray-400 text-sm">${tier.price}/month</p>
                </div>
                <div className="text-accent-yellow opacity-0 group-hover/tier:opacity-100 transition-opacity">
                  Join →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Role Switcher */}
      {onRoleSwitch && (
        <header className="glass border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-accent-yellow">Bucket</h1>
              <div className="h-6 w-px bg-gray-600"></div>
              <span className="text-gray-300">Underground Catalog</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Role Switcher */}
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                {(['fan', 'artist', 'brand', 'developer'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => onRoleSwitch(role)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                      userRole === role 
                        ? 'bg-accent-yellow text-black' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black bg-gradient-to-r from-accent-yellow via-white to-accent-yellow bg-clip-text text-transparent mb-4"
          >
            The Underground
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Discover artists before they break. Support the underground. Own exclusive content.
          </motion.p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search artists, genres, or vibes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-accent-yellow/50 focus:outline-none transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-accent-yellow text-black' : 'bg-gray-700 text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-accent-yellow text-black' : 'bg-gray-700 text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Genre Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full transition-colors capitalize ${
                selectedGenre === genre
                  ? 'bg-accent-yellow text-black'
                  : 'bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Artist Grid */}
        <motion.div 
          layout
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}
        >
          <AnimatePresence>
            {filteredArtists.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* No Results */}
        {filteredArtists.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400 mb-4">No artists found</p>
            <p className="text-gray-500">Try adjusting your search or genre filter</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserCatalog 