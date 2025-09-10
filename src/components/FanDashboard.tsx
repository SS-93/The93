import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RoleManager from './RoleManager'

// Mock data interfaces
interface Artist {
  id: string
  name: string
  avatar: string
  isVerified: boolean
  genre: string
  subscribers: number
  monthlyListeners: number
  subscriptionPrice: number
  latestDrop?: {
    title: string
    type: 'audio' | 'video' | 'image'
    timeAgo: string
    thumbnail: string
  }
}

interface Activity {
  id: string
  type: 'new_drop' | 'milestone' | 'live_event' | 'collaboration'
  artist: string
  title: string
  timeAgo: string
  thumbnail: string
  isNew: boolean
}

interface FanDashboardProps {
  userRole?: 'fan' | 'artist' | 'brand' | 'developer'
  userName?: string
  onRoleSwitch?: (role: 'fan' | 'artist' | 'brand' | 'developer') => void
}

// Mock data
const mockSubscribedArtists: Artist[] = [
  {
    id: '1',
    name: 'Zara Midnight',
    avatar: '/api/placeholder/60/60',
    isVerified: true,
    genre: 'Alternative R&B',
    subscribers: 12500,
    monthlyListeners: 85000,
    subscriptionPrice: 3,
    latestDrop: {
      title: 'Neon Dreams (Acoustic)',
      type: 'audio',
      timeAgo: '2 hours ago',
      thumbnail: '/api/placeholder/80/80'
    }
  },
  {
    id: '2',
    name: 'Echo Valley',
    avatar: '/api/placeholder/60/60',
    isVerified: true,
    genre: 'Indie Folk',
    subscribers: 8200,
    monthlyListeners: 45000,
    subscriptionPrice: 2,
    latestDrop: {
      title: 'Behind the Scenes: Studio Session',
      type: 'video',
      timeAgo: '1 day ago',
      thumbnail: '/api/placeholder/80/80'
    }
  },
  {
    id: '3',
    name: 'Bassline Prophet',
    avatar: '/api/placeholder/60/60',
    isVerified: false,
    genre: 'Electronic',
    subscribers: 3400,
    monthlyListeners: 22000,
    subscriptionPrice: 1,
    latestDrop: {
      title: 'Unreleased Track Preview',
      type: 'audio',
      timeAgo: '3 days ago',
      thumbnail: '/api/placeholder/80/80'
    }
  }
]

const mockRecentActivity: Activity[] = [
  {
    id: '1',
    type: 'new_drop',
    artist: 'Zara Midnight',
    title: 'Just dropped a new acoustic version of Neon Dreams',
    timeAgo: '2 hours ago',
    thumbnail: '/api/placeholder/60/60',
    isNew: true
  },
  {
    id: '2',
    type: 'milestone',
    artist: 'Echo Valley',
    title: 'Reached 50K monthly listeners milestone!',
    timeAgo: '1 day ago',
    thumbnail: '/api/placeholder/60/60',
    isNew: true
  },
  {
    id: '3',
    type: 'live_event',
    artist: 'Bassline Prophet',
    title: 'Going live for a production session at 8PM EST',
    timeAgo: '2 days ago',
    thumbnail: '/api/placeholder/60/60',
    isNew: false
  }
]

const mockDiscoverArtists: Artist[] = [
  {
    id: '4',
    name: 'Luna Waves',
    avatar: '/api/placeholder/60/60',
    isVerified: false,
    genre: 'Dream Pop',
    subscribers: 1200,
    monthlyListeners: 8500,
    subscriptionPrice: 1
  },
  {
    id: '5',
    name: 'Neon Syntax',
    avatar: '/api/placeholder/60/60',
    isVerified: true,
    genre: 'Synthwave',
    subscribers: 5600,
    monthlyListeners: 32000,
    subscriptionPrice: 2
  }
]

const FanDashboard: React.FC<FanDashboardProps> = ({ 
  userRole = 'fan', 
  userName = 'Alex Chen',
  onRoleSwitch 
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'library'>('feed')
  const [showMockData, setShowMockData] = useState(true)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_drop': return '🎵'
      case 'milestone': return '🎉'
      case 'live_event': return '🔴'
      case 'collaboration': return '🤝'
      default: return '📢'
    }
  }

  const ArtistCard = ({ artist, showSubscribeButton = false }: { artist: Artist, showSubscribeButton?: boolean }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass rounded-xl p-4 border border-white/10 hover:border-accent-yellow/30 transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <img 
            src={artist.avatar} 
            alt={artist.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {artist.isVerified && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-green rounded-full flex items-center justify-center">
              <span className="text-xs">✓</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">{artist.name}</h3>
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
              {artist.genre}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
            <span>{formatNumber(artist.subscribers)} subscribers</span>
            <span>{formatNumber(artist.monthlyListeners)} monthly</span>
          </div>

          {artist.latestDrop && (
            <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg">
              <img 
                src={artist.latestDrop.thumbnail} 
                alt={artist.latestDrop.title}
                className="w-8 h-8 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{artist.latestDrop.title}</p>
                <p className="text-xs text-gray-400">{artist.latestDrop.timeAgo}</p>
              </div>
              <span className="text-lg">
                {artist.latestDrop.type === 'audio' ? '🎵' : 
                 artist.latestDrop.type === 'video' ? '🎬' : '🖼️'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-accent-yellow font-medium">${artist.subscriptionPrice}/month</span>
            {showSubscribeButton && (
              <button className="px-3 py-1 bg-accent-yellow text-black text-xs font-medium rounded-full hover:bg-accent-yellow/90 transition-colors">
                Subscribe
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const ActivityItem = ({ activity }: { activity: Activity }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
    >
      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white">{activity.artist}</span>
          {activity.isNew && (
            <span className="px-2 py-1 bg-accent-green text-black text-xs font-medium rounded-full">
              NEW
            </span>
          )}
        </div>
        <p className="text-sm text-gray-300 mb-1">{activity.title}</p>
        <p className="text-xs text-gray-500">{activity.timeAgo}</p>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Role Switcher */}
      <header className="glass border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-accent-yellow">Bucket</h1>
            <div className="h-6 w-px bg-gray-600"></div>
            <span className="text-gray-300">Welcome back, {userName}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Mock Data Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Mock Data</span>
              <button
                onClick={() => setShowMockData(!showMockData)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  showMockData ? 'bg-accent-green' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  showMockData ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Role Switcher */}
            <RoleManager 
              currentRole={userRole} 
              compact={true}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <nav className="glass rounded-xl p-4 mb-6">
              <div className="space-y-2">
                {[
                  { id: 'feed', label: 'Your Feed', icon: '🏠' },
                  { id: 'discover', label: 'Discover', icon: '🔍' },
                  { id: 'library', label: 'Your Library', icon: '📚' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-accent-yellow text-black font-medium' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Quick Stats */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium text-white mb-3">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Subscriptions</span>
                  <span className="text-accent-yellow font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">This Month</span>
                  <span className="text-white">$6.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Content Unlocked</span>
                  <span className="text-accent-green">47</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-6">
            <AnimatePresence mode="wait">
              {activeTab === 'feed' && (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                    <div className="space-y-2">
                      {showMockData ? mockRecentActivity.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      )) : (
                        <p className="text-gray-400 text-center py-8">No recent activity</p>
                      )}
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Your Subscriptions</h2>
                    <div className="space-y-4">
                      {showMockData ? mockSubscribedArtists.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} />
                      )) : (
                        <p className="text-gray-400 text-center py-8">No subscriptions yet</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'discover' && (
                <motion.div
                  key="discover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Discover New Artists</h2>
                    <div className="space-y-4">
                      {showMockData ? mockDiscoverArtists.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} showSubscribeButton />
                      )) : (
                        <p className="text-gray-400 text-center py-8">No recommendations available</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'library' && (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Your Library</h2>
                    <div className="text-center py-12">
                      <span className="text-6xl mb-4 block">📚</span>
                      <h3 className="text-lg font-medium text-white mb-2">Your Collection</h3>
                      <p className="text-gray-400">
                        {showMockData 
                          ? "All your saved content and playlists will appear here" 
                          : "No saved content yet"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Trending */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium text-white mb-3">🔥 Trending Now</h3>
              <div className="space-y-3">
                {showMockData && [
                  { artist: 'Zara Midnight', track: 'Neon Dreams', plays: '12.5K' },
                  { artist: 'Echo Valley', track: 'Mountain High', plays: '8.2K' },
                  { artist: 'Luna Waves', track: 'Cosmic Drift', plays: '5.1K' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-accent-yellow font-bold text-sm">#{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.track}</p>
                      <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                    </div>
                    <span className="text-xs text-gray-400">{item.plays}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium text-white mb-3">📅 Upcoming</h3>
              <div className="space-y-3">
                {showMockData && [
                  { artist: 'Bassline Prophet', event: 'Live Production', time: 'Today 8PM' },
                  { artist: 'Echo Valley', event: 'New Album Drop', time: 'Tomorrow' }
                ].map((item, index) => (
                  <div key={index} className="p-2 bg-black/30 rounded-lg">
                    <p className="text-sm text-white">{item.event}</p>
                    <p className="text-xs text-gray-400">{item.artist} • {item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FanDashboard 