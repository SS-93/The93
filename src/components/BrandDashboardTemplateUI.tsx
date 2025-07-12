import React, { useState } from 'react'
import { motion } from 'framer-motion'

// Mock data for brand analytics
const mockBrandData = {
  brand: {
    name: "Aurora Tech",
    logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop",
    industry: "Technology",
    verified: true
  },
  totalImpressions: 8945672,
  engagedFans: 156834,
  costPerAction: 2.45,
  conversionRate: 8.7,
  campaignRegions: [
    { region: "North America", impressions: 3200000, engagement: 14.2, conversions: 8900, lat: 39.8283, lng: -98.5795 },
    { region: "Europe", impressions: 2800000, engagement: 16.8, conversions: 7600, lat: 54.5260, lng: 15.2551 },
    { region: "Asia Pacific", impressions: 2100000, engagement: 12.9, conversions: 5800, lat: -8.7832, lng: 124.5085 },
    { region: "Latin America", impressions: 845672, engagement: 19.3, conversions: 2200, lat: -14.2350, lng: -51.9253 }
  ],
  topArtistPartnerships: [
    { name: "Luna Starlight", genre: "Electronic Pop", roi: 340, fanReach: 89500, totalSpend: 12500, avatar: "🌟" },
    { name: "Cosmic Beats", genre: "Synthwave", roi: 285, fanReach: 67200, totalSpend: 9800, avatar: "🚀" },
    { name: "Neon Dreams", genre: "Future Bass", roi: 198, fanReach: 45600, totalSpend: 8200, avatar: "💫" }
  ],
  audienceInsights: [
    { demographic: "Gen Z (18-24)", size: 45600, engagement: 22.8, conversion: 12.4, color: "#00ff88" },
    { demographic: "Millennials (25-34)", size: 38200, engagement: 18.3, conversion: 15.7, color: "#ff6b35" },
    { demographic: "Gen X (35-44)", size: 29800, engagement: 15.9, conversion: 18.2, color: "#ffd23f" },
    { demographic: "Tech Enthusiasts", size: 52400, engagement: 28.1, conversion: 21.5, color: "#ff3366" }
  ],
  campaignMomentum: [
    { period: "Week 1", impressions: 1200000, engagement: 12.5, conversions: 1800 },
    { period: "Week 2", impressions: 1850000, engagement: 15.2, conversions: 2400 },
    { period: "Week 3", impressions: 2100000, engagement: 18.7, conversions: 3200 },
    { period: "Week 4", impressions: 2450000, engagement: 22.1, conversions: 4100 }
  ],
  brandAffinityScore: 87.3,
  ugcVolume: 2847,
  avgEngagementTime: "2m 34s"
}

interface BrandDashboardProps {
  brandData?: any
  userRole?: 'fan' | 'artist' | 'brand'
  onRoleSwitch?: (role: 'fan' | 'artist' | 'brand') => void
}

const BrandDashboardTemplateUI: React.FC<BrandDashboardProps> = ({ 
  brandData = mockBrandData,
  userRole = 'brand',
  onRoleSwitch
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  const ImpactMetric = ({ title, value, subtitle, color, icon, trend, large = false }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-500 ${
        large ? 'p-12' : 'p-8'
      }`}
    >
      <div className="flex items-center space-x-4 mb-6">
        <div 
          className={`${large ? 'w-16 h-16' : 'w-12 h-12'} rounded-2xl flex items-center justify-center`}
          style={{ backgroundColor: `${color}15`, border: `2px solid ${color}30` }}
        >
          <span className={`${large ? 'text-2xl' : 'text-xl'}`} style={{ color }}>{icon}</span>
        </div>
        <div>
          <h3 className={`font-medium text-gray-400 ${large ? 'text-lg' : 'text-base'}`}>{title}</h3>
          <p className={`font-bold text-white ${large ? 'text-5xl' : 'text-3xl'}`}>{value}</p>
        </div>
        {trend && (
          <div className={`ml-auto px-4 py-2 rounded-xl ${
            trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <span className="text-2xl">{trend > 0 ? '↗' : '↘'}</span>
            <span className="ml-2 font-bold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      {subtitle && <p className={`text-gray-500 ${large ? 'text-lg' : 'text-base'}`}>{subtitle}</p>}
    </motion.div>
  )

  const CampaignMap = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Campaign Reach</h2>
      
      {/* World Map Visualization */}
      <div className="relative h-96 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-2xl" />
        
        {/* Campaign Hotspots */}
        {brandData.campaignRegions.map((region: any, index: number) => (
          <motion.div
            key={region.region}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.3, duration: 0.8 }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${15 + index * 20}%`,
              top: `${25 + (index % 2) * 30}%`
            }}
          >
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full animate-pulse"
                style={{ 
                  backgroundColor: '#00d4ff',
                  boxShadow: `0 0 30px ${region.engagement > 15 ? '#00d4ff' : '#ffd23f'}`,
                  transform: `scale(${Math.min(region.impressions / 3000000, 2) + 0.8})`
                }}
              />
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
            </div>
            
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <p className="font-bold text-lg">{region.region}</p>
              <p className="text-blue-400">{(region.impressions / 1000000).toFixed(1)}M impressions</p>
              <p className="text-green-400">{region.engagement}% engagement</p>
              <p className="text-yellow-400">{region.conversions.toLocaleString()} conversions</p>
            </div>
          </motion.div>
        ))}
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="grid grid-cols-4 gap-6">
            {brandData.campaignRegions.map((region: any) => (
              <div key={region.region} className="text-center p-4 bg-black/50 rounded-xl">
                <p className="text-white font-bold text-xl">{(region.impressions / 1000000).toFixed(1)}M</p>
                <p className="text-gray-400">{region.region}</p>
                <p className="text-blue-400 text-sm">{region.engagement}% engaged</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const CampaignMomentum = () => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Campaign Momentum</h2>
        <div className="text-right">
          <p className="text-4xl font-bold text-blue-400">+68%</p>
          <p className="text-gray-400">Growth trajectory</p>
        </div>
      </div>
      
      <div className="h-72 flex items-end space-x-6">
        {brandData.campaignMomentum.map((week: any, index: number) => (
          <div key={week.period} className="flex-1">
            <div className="space-y-2 mb-4">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(week.impressions / 3000000) * 120}px` }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                className="w-full rounded-t-xl bg-gradient-to-t from-blue-600/60 to-blue-400"
                style={{ minHeight: '20px' }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(week.engagement / 25) * 80}px` }}
                transition={{ delay: index * 0.2 + 0.1, duration: 0.8 }}
                className="w-full rounded-t-xl bg-gradient-to-t from-green-600/60 to-green-400"
                style={{ minHeight: '15px' }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(week.conversions / 5000) * 60}px` }}
                transition={{ delay: index * 0.2 + 0.2, duration: 0.8 }}
                className="w-full rounded-t-xl bg-gradient-to-t from-yellow-600/60 to-yellow-400"
                style={{ minHeight: '10px' }}
              />
            </div>
            <p className="text-gray-400 text-center">{week.period}</p>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center space-x-8 mt-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
          <span className="text-gray-300">Impressions</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full" />
          <span className="text-gray-300">Engagement</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <span className="text-gray-300">Conversions</span>
        </div>
      </div>
    </motion.div>
  )

  const AudienceSegments = () => (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Audience Intelligence</h2>
      
      <div className="space-y-8">
        {brandData.audienceInsights.map((segment: any, index: number) => (
          <div key={segment.demographic} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xl font-medium text-white">{segment.demographic}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{segment.size.toLocaleString()}</p>
                <p className="text-gray-400">audience</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pl-10">
              <div>
                <p className="text-gray-400 mb-2">Engagement Rate</p>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-4 bg-gray-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(segment.engagement / 30) * 100}%` }}
                      transition={{ delay: index * 0.2, duration: 1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                  </div>
                  <span className="text-lg font-bold" style={{ color: segment.color }}>
                    {segment.engagement}%
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 mb-2">Conversion Rate</p>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-4 bg-gray-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(segment.conversion / 25) * 100}%` }}
                      transition={{ delay: index * 0.2 + 0.1, duration: 1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                  </div>
                  <span className="text-lg font-bold" style={{ color: segment.color }}>
                    {segment.conversion}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )

  const TopArtistPartnerships = () => (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Artist Partnerships</h2>
      
      <div className="space-y-8">
        {brandData.topArtistPartnerships.map((artist: any, index: number) => (
          <motion.div
            key={artist.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className="flex items-center justify-between p-8 rounded-2xl bg-gray-800/30 hover:bg-gray-800/50 transition-all"
          >
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-3xl">
                {artist.avatar}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{artist.name}</p>
                <p className="text-gray-400 text-lg">{artist.genre}</p>
                <p className="text-blue-400">{artist.fanReach.toLocaleString()} fan reach</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">{artist.roi}%</p>
              <p className="text-gray-400">ROI</p>
              <p className="text-gray-500 text-sm">${artist.totalSpend.toLocaleString()} invested</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header with Role Switcher */}
      {onRoleSwitch && (
        <header className="glass border-b border-white/10 p-4 mb-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-accent-yellow">Bucket</h1>
              <div className="h-6 w-px bg-gray-600"></div>
              <span className="text-gray-300">Brand Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Role Switcher */}
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                {(['fan', 'artist', 'brand'] as const).map((role) => (
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

      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <img 
            src={brandData.brand.logo} 
            alt={brandData.brand.name}
            className="w-20 h-20 rounded-2xl border-2 border-blue-400"
          />
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-bold">{brandData.brand.name}</h1>
              {brandData.brand.verified && <span className="text-blue-400 text-2xl">✓</span>}
            </div>
            <p className="text-xl text-gray-400">{brandData.brand.industry} • Brand Partner</p>
          </div>
        </div>
        
        {/* Time Filter */}
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedTimeframe(period)}
              className={`px-6 py-3 rounded-xl text-lg font-medium transition-colors ${
                selectedTimeframe === period
                  ? 'bg-blue-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <ImpactMetric
          title="Campaign Reach"
          value={`${(brandData.totalImpressions / 1000000).toFixed(1)}M`}
          subtitle="Total impressions"
          color="#00d4ff"
          icon="👁"
          trend={22.4}
          large={true}
        />
        <ImpactMetric
          title="Engaged Fans"
          value={`${(brandData.engagedFans / 1000).toFixed(0)}K`}
          subtitle="Active interactions"
          color="#00ff88"
          icon="❤️"
          trend={18.7}
        />
        <ImpactMetric
          title="Cost per Action"
          value={`$${brandData.costPerAction}`}
          subtitle="Average CPA"
          color="#ffd23f"
          icon="💰"
          trend={-12.3}
        />
        <ImpactMetric
          title="Conversion Rate"
          value={`${brandData.conversionRate}%`}
          subtitle="Fan → Customer"
          color="#ff6b35"
          icon="🎯"
          trend={15.8}
        />
      </div>

      {/* Campaign Map - Full Width */}
      <div className="mb-12">
        <CampaignMap />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <CampaignMomentum />
        <AudienceSegments />
      </div>

      {/* Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopArtistPartnerships />
        
        {/* Brand Impact Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50"
        >
          <h2 className="text-2xl font-bold text-white mb-8">Brand Impact</h2>
          
          <div className="space-y-8">
            <div className="text-center p-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl">
              <p className="text-5xl font-bold text-blue-400 mb-2">{brandData.brandAffinityScore}%</p>
              <p className="text-xl text-gray-300">Brand Affinity Score</p>
              <p className="text-gray-400 mt-2">AI-computed audience alignment</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gray-800/30 rounded-2xl">
                <p className="text-3xl font-bold text-green-400">{brandData.ugcVolume.toLocaleString()}</p>
                <p className="text-gray-300">UGC Posts</p>
                <p className="text-gray-400 text-sm">User-generated content</p>
              </div>
              
              <div className="text-center p-6 bg-gray-800/30 rounded-2xl">
                <p className="text-3xl font-bold text-yellow-400">{brandData.avgEngagementTime}</p>
                <p className="text-gray-300">Avg. Time</p>
                <p className="text-gray-400 text-sm">Per content view</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default BrandDashboardTemplateUI 