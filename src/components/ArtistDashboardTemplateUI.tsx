import React, { useState } from 'react'
import { motion } from 'framer-motion'
import ArtistUploadManager from './ArtistUploadManager'
import RoleManager from './RoleManager'

// Mock data for artist analytics
const mockArtistData = {
  artist: {
    name: "Luna Starlight",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b515?w=150&h=150&fit=crop&crop=face",
    tier: "Gold",
    verified: true
  },
  totalStreams: 2485691,
  lockerLogins: 1247,
  fanConversionRate: 12.8,
  contentAlignmentScore: 94.5,
  revenueByChannel: [
    { channel: "Buckets", revenue: 15420, percentage: 45.2, color: "#00ff88" },
    { channel: "Spotify", revenue: 8950, percentage: 26.3, color: "#ff6b35" },
    { channel: "YouTube", revenue: 6180, percentage: 18.1, color: "#ffd23f" },
    { channel: "Apple Music", revenue: 3520, percentage: 10.4, color: "#ff3366" }
  ],
  fanGeoData: [
    { country: "United States", fans: 45600, growth: 18.2, lat: 39.8283, lng: -98.5795 },
    { country: "United Kingdom", fans: 23400, growth: 22.1, lat: 55.3781, lng: -3.4360 },
    { country: "Canada", fans: 18900, growth: 15.7, lat: 56.1304, lng: -106.3468 },
    { country: "Australia", fans: 12800, growth: 28.9, lat: -25.2744, lng: 133.7751 },
    { country: "Germany", fans: 9600, growth: 12.4, lat: 51.1657, lng: 10.4515 }
  ],
  dropEngagement: [
    { date: "Jan 1", score: 85, plays: 12500 },
    { date: "Jan 2", score: 92, plays: 18900 },
    { date: "Jan 3", score: 78, plays: 9800 },
    { date: "Jan 4", score: 95, plays: 23400 },
    { date: "Jan 5", score: 88, plays: 16700 },
    { date: "Jan 6", score: 91, plays: 21200 },
    { date: "Jan 7", score: 89, plays: 19600 }
  ],
  topPromoters: [
    { name: "StarGazer_92", referrals: 156, earnings: 890, avatar: "🌟" },
    { name: "MusicLover_X", referrals: 134, earnings: 765, avatar: "🎵" },
    { name: "LunaFanClub", referrals: 98, earnings: 560, avatar: "🌙" }
  ],
  contentThemes: [
    { theme: "Dreams", count: 23, color: "#00ff88" },
    { theme: "Love", count: 18, color: "#ff6b35" },
    { theme: "Journey", count: 15, color: "#ffd23f" },
    { theme: "Hope", count: 12, color: "#ff3366" }
  ]
}

interface ArtistDashboardProps {
  artistData?: any
  userRole?: 'fan' | 'artist' | 'brand' | 'developer'
  onRoleSwitch?: (role: 'fan' | 'artist' | 'brand' | 'developer') => void
}

const ArtistDashboardTemplateUI: React.FC<ArtistDashboardProps> = ({ 
  artistData = mockArtistData,
  userRole = 'artist',
  onRoleSwitch
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [showUploadManager, setShowUploadManager] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header with Role Switcher */}
      {onRoleSwitch && (
        <header className="glass border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-accent-yellow">Bucket</h1>
              <div className="h-6 w-px bg-gray-600"></div>
              <span className="text-gray-300">Artist Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Role Manager */}
              <RoleManager currentRole={userRole} compact={true} />
            </div>
          </div>
        </header>
      )}

      {/* Header with massive spacing */}
      <div className="p-16">
        <div className="flex items-center justify-between mb-20">
          <div className="flex items-center space-x-8">
            <img 
              src={artistData.artist.avatar} 
              alt={artistData.artist.name}
              className="w-32 h-32 rounded-3xl border-4 border-green-400 shadow-2xl"
            />
            <div>
              <div className="flex items-center space-x-4">
                <h1 className="text-6xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  {artistData.artist.name}
                </h1>
                {artistData.artist.verified && (
                  <span className="text-green-400 text-4xl">✓</span>
                )}
              </div>
              <p className="text-2xl text-gray-400 mt-2">{artistData.artist.tier} Tier Artist</p>
            </div>
          </div>
          
          {/* Actions & Time Filter */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowUploadManager(true)}
              className="bg-accent-yellow text-black font-bold px-6 py-4 rounded-2xl text-lg transition-all transform hover:scale-105 shadow-xl flex items-center space-x-2"
            >
              <span>📁</span>
              <span>Upload Content</span>
            </button>
            
            <div className="flex space-x-4">
              {['7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedTimeframe(period)}
                  className={`px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 ${
                    selectedTimeframe === period
                      ? 'bg-green-500 text-black shadow-xl'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Massive Hero Stats */}
        <div className="grid grid-cols-3 gap-16 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 hover:border-green-400/50 transition-all duration-500"
          >
            <div className="w-24 h-24 mx-auto mb-8 bg-green-400/20 rounded-3xl flex items-center justify-center">
              <span className="text-5xl">🎵</span>
            </div>
            <p className="text-8xl font-black text-green-400 mb-4">
              {(artistData.totalStreams / 1000000).toFixed(1)}M
            </p>
            <p className="text-2xl text-gray-300 mb-2">Total Streams</p>
            <p className="text-gray-500 text-lg">Across all platforms</p>
            <div className="mt-6 px-6 py-3 bg-green-500/20 rounded-xl">
              <span className="text-green-400 text-2xl font-bold">↗ +15.2%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 hover:border-orange-400/50 transition-all duration-500"
          >
            <div className="w-24 h-24 mx-auto mb-8 bg-orange-400/20 rounded-3xl flex items-center justify-center">
              <span className="text-5xl">🔒</span>
            </div>
            <p className="text-8xl font-black text-orange-400 mb-4">
              {artistData.lockerLogins.toLocaleString()}
            </p>
            <p className="text-2xl text-gray-300 mb-2">Daily Locker Access</p>
            <p className="text-gray-500 text-lg">Active fan engagement</p>
            <div className="mt-6 px-6 py-3 bg-orange-500/20 rounded-xl">
              <span className="text-orange-400 text-2xl font-bold">↗ +8.7%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 hover:border-yellow-400/50 transition-all duration-500"
          >
            <div className="w-24 h-24 mx-auto mb-8 bg-yellow-400/20 rounded-3xl flex items-center justify-center">
              <span className="text-5xl">⚡</span>
            </div>
            <p className="text-8xl font-black text-yellow-400 mb-4">
              {artistData.fanConversionRate}%
            </p>
            <p className="text-2xl text-gray-300 mb-2">Fan Conversion</p>
            <p className="text-gray-500 text-lg">Listeners → Subscribers</p>
            <div className="mt-6 px-6 py-3 bg-red-500/20 rounded-xl">
              <span className="text-red-400 text-2xl font-bold">↘ -2.1%</span>
            </div>
          </motion.div>
        </div>

        {/* Massive World Map Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-24 p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
        >
          <h2 className="text-5xl font-black text-white mb-12 text-center">
            Global Fan Empire
          </h2>
          
          <div className="relative h-[600px] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-[2rem] p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-green-900/30 rounded-[2rem]" />
            
            {/* Fan Hotspots */}
            {artistData.fanGeoData.map((location: any, index: number) => (
              <motion.div
                key={location.country}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.3, duration: 1 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${15 + index * 18}%`,
                  top: `${25 + (index % 2) * 35}%`
                }}
              >
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-full animate-pulse shadow-2xl"
                    style={{ 
                      backgroundColor: '#00ff88',
                      boxShadow: `0 0 60px ${location.growth > 20 ? '#00ff88' : '#ffd23f'}`,
                      transform: `scale(${Math.min(location.fans / 30000, 2) + 1})`
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                </div>
                
                <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-6 py-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity border border-green-400/50">
                  <p className="font-bold text-2xl text-green-400">{location.country}</p>
                  <p className="text-xl">{location.fans.toLocaleString()} fans</p>
                  <p className="text-green-400 text-lg">+{location.growth}% growth</p>
                </div>
              </motion.div>
            ))}
            
            <div className="absolute bottom-12 left-12 right-12">
              <div className="grid grid-cols-5 gap-8">
                {artistData.fanGeoData.map((location: any) => (
                  <div key={location.country} className="text-center p-6 bg-black/60 rounded-2xl backdrop-blur">
                    <p className="text-white font-black text-3xl">
                      {(location.fans / 1000).toFixed(0)}K
                    </p>
                    <p className="text-gray-300 text-lg font-bold">{location.country}</p>
                    <p className="text-green-400 font-bold">+{location.growth}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue & Engagement Row */}
        <div className="grid grid-cols-2 gap-16 mb-24">
          {/* Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
          >
            <h2 className="text-4xl font-black text-white mb-12">Revenue Streams</h2>
            
            <div className="space-y-12">
              {artistData.revenueByChannel.map((channel: any, index: number) => (
                <div key={channel.channel} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div 
                        className="w-8 h-8 rounded-xl" 
                        style={{ backgroundColor: channel.color }}
                      />
                      <span className="text-2xl font-bold text-gray-300">{channel.channel}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-white">${channel.revenue.toLocaleString()}</p>
                      <p className="text-gray-400 text-lg">{channel.percentage}%</p>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${channel.percentage}%` }}
                      transition={{ delay: 0.6 + index * 0.2, duration: 1.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: channel.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Engagement Journey */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black text-white">Weekly Momentum</h2>
              <div className="text-right">
                <p className="text-5xl font-black text-green-400">+24%</p>
                <p className="text-gray-400 text-xl">Growth rate</p>
              </div>
            </div>
            
            <div className="h-80 flex items-end space-x-6">
              {artistData.dropEngagement.map((day: any, index: number) => (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.score / 100) * 280}px` }}
                    transition={{ delay: 0.8 + index * 0.15, duration: 1, ease: "easeOut" }}
                    className="w-full rounded-t-3xl relative group cursor-pointer"
                    style={{ 
                      background: `linear-gradient(to top, #374151, #00ff88)`,
                      minHeight: '40px'
                    }}
                  >
                    <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-green-400/50">
                      <p className="font-bold text-lg">{day.score}% engagement</p>
                      <p className="text-green-400">{day.plays.toLocaleString()} plays</p>
                    </div>
                  </motion.div>
                  <p className="text-gray-400 text-lg mt-4 font-bold">{day.date}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Fan Community & Content DNA */}
        <div className="grid grid-cols-2 gap-16">
          {/* Top Fan Promoters */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
          >
            <h2 className="text-4xl font-black text-white mb-12">Top Fan Promoters</h2>
            
            <div className="space-y-8">
              {artistData.topPromoters.map((promoter: any, index: number) => (
                <motion.div
                  key={promoter.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.2 }}
                  className="flex items-center justify-between p-8 rounded-3xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-gray-700/50 hover:to-gray-800/50 transition-all border border-gray-700/30"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center text-4xl shadow-xl">
                      {promoter.avatar}
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{promoter.name}</p>
                      <p className="text-gray-400 text-lg">{promoter.referrals} referrals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-green-400">${promoter.earnings}</p>
                    <p className="text-gray-400 text-lg">earned</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Content DNA */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
          >
            <h2 className="text-4xl font-black text-white mb-12">Content DNA</h2>
            <p className="text-gray-400 text-xl mb-12">AI-analyzed themes across your catalog</p>
            
            <div className="grid grid-cols-2 gap-8">
              {artistData.contentThemes.map((theme: any, index: number) => (
                <motion.div
                  key={theme.theme}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.2 }}
                  className="p-8 rounded-3xl border-4 hover:scale-110 transition-all cursor-pointer duration-500"
                  style={{ 
                    borderColor: theme.color,
                    backgroundColor: `${theme.color}15`
                  }}
                >
                  <p className="text-2xl font-black text-white mb-4">{theme.theme}</p>
                  <p className="text-5xl font-black mb-2" style={{ color: theme.color }}>
                    {theme.count}
                  </p>
                  <p className="text-gray-400 text-lg font-bold">tracks</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Upload Manager Modal */}
      {showUploadManager && (
        <ArtistUploadManager
          onUploadComplete={(files) => {
            console.log('Upload completed:', files)
            setShowUploadManager(false)
            // Refresh dashboard data here
          }}
          onClose={() => setShowUploadManager(false)}
        />
      )}
    </div>
  )
}

export default ArtistDashboardTemplateUI