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
  avgEngagementTime: "2m 34s",
  aiCampaignInsights: {
    recommendedArtists: [
      { 
        name: "Echo Synthesis", 
        genre: "Tech House", 
        brandMatch: 94.2, 
        projectedReach: 125000, 
        estimatedROI: 420,
        projectedEarnings: 85000,
        themes: ["Innovation", "Future Tech", "Digital Life"],
        fanDemographic: "Tech Enthusiasts 78%",
        avatar: "🎛️"
      },
      { 
        name: "Binary Dreams", 
        genre: "Electronic Pop", 
        brandMatch: 89.7, 
        projectedReach: 98000, 
        estimatedROI: 340,
        projectedEarnings: 67000,
        themes: ["AI & Automation", "Tech Lifestyle", "Digital Culture"],
        fanDemographic: "Gen Z Tech 85%",
        avatar: "🤖"
      },
      { 
        name: "Pixel Harmony", 
        genre: "Ambient Tech", 
        brandMatch: 86.4, 
        projectedReach: 76000, 
        estimatedROI: 280,
        projectedEarnings: 52000,
        themes: ["Minimalism", "Clean Tech", "Sustainability"],
        fanDemographic: "Eco-Tech 72%",
        avatar: "🔷"
      }
    ],
    campaignOptimizations: [
      { insight: "Peak engagement 2-4 PM PST", impact: "+23% reach", confidence: 92 },
      { insight: "Tech event tie-ins boost conversion", impact: "+31% CVR", confidence: 88 },
      { insight: "Weekend drops perform 18% better", impact: "+18% engagement", confidence: 85 }
    ]
  },
  artistThemeVector: {
    centralThemes: [
      { theme: "Innovation", x: 0, y: 0, strength: 1.0, connections: ["Future Tech", "AI & Automation", "Digital Life"], color: "#00d4ff", artists: ["Echo Synthesis", "Binary Dreams"] },
      { theme: "Future Tech", x: 150, y: -100, strength: 0.9, connections: ["Innovation", "AI & Automation"], color: "#ff6b35", artists: ["Echo Synthesis", "Luna Starlight"] },
      { theme: "Digital Life", x: -120, y: 80, strength: 0.85, connections: ["Innovation", "Tech Lifestyle"], color: "#00ff88", artists: ["Binary Dreams", "Pixel Harmony"] },
      { theme: "AI & Automation", x: 200, y: 120, strength: 0.8, connections: ["Future Tech", "Digital Culture"], color: "#ffd23f", artists: ["Binary Dreams", "Echo Synthesis"] },
      { theme: "Tech Lifestyle", x: -80, y: -150, strength: 0.75, connections: ["Digital Life", "Clean Tech"], color: "#ff3366", artists: ["Binary Dreams", "Cosmic Beats"] },
      { theme: "Clean Tech", x: -200, y: 0, strength: 0.7, connections: ["Tech Lifestyle", "Sustainability"], color: "#8b5cf6", artists: ["Pixel Harmony"] },
      { theme: "Sustainability", x: -150, y: 150, strength: 0.65, connections: ["Clean Tech", "Minimalism"], color: "#10b981", artists: ["Pixel Harmony", "Neon Dreams"] },
      { theme: "Minimalism", x: 50, y: 200, strength: 0.6, connections: ["Sustainability", "Digital Culture"], color: "#f59e0b", artists: ["Pixel Harmony"] },
      { theme: "Digital Culture", x: 250, y: 50, strength: 0.8, connections: ["AI & Automation", "Minimalism"], color: "#ef4444", artists: ["Binary Dreams", "Luna Starlight"] }
    ]
  }
}

interface BrandDashboardProps {
  brandData?: any
}

const BrandDashboardSpacious: React.FC<BrandDashboardProps> = ({ 
  brandData = mockBrandData 
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header with massive spacing */}
      <div className="p-16">
        <div className="flex items-center justify-between mb-20">
          <div className="flex items-center space-x-8">
            <img 
              src={brandData.brand.logo} 
              alt={brandData.brand.name}
              className="w-32 h-32 rounded-3xl border-4 border-blue-400 shadow-2xl"
            />
            <div>
              <div className="flex items-center space-x-4">
                <h1 className="text-6xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {brandData.brand.name}
                </h1>
                {brandData.brand.verified && (
                  <span className="text-blue-400 text-4xl">✓</span>
                )}
              </div>
              <p className="text-2xl text-gray-400 mt-2">{brandData.brand.industry} • Brand Partner</p>
            </div>
          </div>
          
          {/* Time Filter */}
          <div className="flex space-x-4">
            {['7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period)}
                className={`px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 ${
                  selectedTimeframe === period
                    ? 'bg-blue-500 text-black shadow-xl'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Massive Hero Stats */}
        <div className="grid grid-cols-4 gap-12 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 hover:border-blue-400/50 transition-all duration-500"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-400/20 rounded-3xl flex items-center justify-center">
              <span className="text-4xl">👁</span>
            </div>
            <p className="text-6xl font-black text-blue-400 mb-3">
              {(brandData.totalImpressions / 1000000).toFixed(1)}M
            </p>
            <p className="text-xl text-gray-300 mb-2">Campaign Reach</p>
            <p className="text-gray-500">Total impressions</p>
            <div className="mt-4 px-4 py-2 bg-blue-500/20 rounded-xl">
              <span className="text-blue-400 text-xl font-bold">↗ +22.4%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 hover:border-green-400/50 transition-all duration-500"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-green-400/20 rounded-3xl flex items-center justify-center">
              <span className="text-4xl">❤️</span>
            </div>
            <p className="text-6xl font-black text-green-400 mb-3">
              {(brandData.engagedFans / 1000).toFixed(0)}K
            </p>
            <p className="text-xl text-gray-300 mb-2">Engaged Fans</p>
            <p className="text-gray-500">Active interactions</p>
            <div className="mt-4 px-4 py-2 bg-green-500/20 rounded-xl">
              <span className="text-green-400 text-xl font-bold">↗ +18.7%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 hover:border-yellow-400/50 transition-all duration-500"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-400/20 rounded-3xl flex items-center justify-center">
              <span className="text-4xl">💰</span>
            </div>
            <p className="text-6xl font-black text-yellow-400 mb-3">
              ${brandData.costPerAction}
            </p>
            <p className="text-xl text-gray-300 mb-2">Cost per Action</p>
            <p className="text-gray-500">Average CPA</p>
            <div className="mt-4 px-4 py-2 bg-red-500/20 rounded-xl">
              <span className="text-red-400 text-xl font-bold">↘ -12.3%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 hover:border-orange-400/50 transition-all duration-500"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-400/20 rounded-3xl flex items-center justify-center">
              <span className="text-4xl">🎯</span>
            </div>
            <p className="text-6xl font-black text-orange-400 mb-3">
              {brandData.conversionRate}%
            </p>
            <p className="text-xl text-gray-300 mb-2">Conversion Rate</p>
            <p className="text-gray-500">Fan → Customer</p>
            <div className="mt-4 px-4 py-2 bg-orange-500/20 rounded-xl">
              <span className="text-orange-400 text-xl font-bold">↗ +15.8%</span>
            </div>
          </motion.div>
        </div>

        {/* Massive Campaign Map Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-24 p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
        >
          <h2 className="text-5xl font-black text-white mb-12 text-center">
            Global Campaign Impact
          </h2>
          
          <div className="relative h-[650px] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-[2rem] p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-pink-900/30 rounded-[2rem]" />
            
            {/* Campaign Hotspots */}
            {brandData.campaignRegions.map((region: any, index: number) => (
              <motion.div
                key={region.region}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.4, duration: 1.2 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${12 + index * 22}%`,
                  top: `${20 + (index % 2) * 40}%`
                }}
              >
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-full animate-pulse shadow-2xl"
                    style={{ 
                      backgroundColor: '#00d4ff',
                      boxShadow: `0 0 80px ${region.engagement > 15 ? '#00d4ff' : '#ffd23f'}`,
                      transform: `scale(${Math.min(region.impressions / 2500000, 2.5) + 1})`
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 animate-pulse" />
                </div>
                
                <div className="absolute -top-40 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-8 py-6 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity border border-cyan-400/50">
                  <p className="font-bold text-3xl text-cyan-400">{region.region}</p>
                  <p className="text-blue-400 text-xl">{(region.impressions / 1000000).toFixed(1)}M impressions</p>
                  <p className="text-green-400 text-xl">{region.engagement}% engagement</p>
                  <p className="text-yellow-400 text-xl">{region.conversions.toLocaleString()} conversions</p>
                </div>
              </motion.div>
            ))}
            
            <div className="absolute bottom-12 left-12 right-12">
              <div className="grid grid-cols-4 gap-8">
                {brandData.campaignRegions.map((region: any) => (
                  <div key={region.region} className="text-center p-8 bg-black/60 rounded-2xl backdrop-blur">
                    <p className="text-white font-black text-4xl">
                      {(region.impressions / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-gray-300 text-xl font-bold">{region.region}</p>
                    <p className="text-blue-400 font-bold">{region.engagement}% engaged</p>
                    <p className="text-yellow-400 font-bold">{region.conversions.toLocaleString()} conversions</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insights & Theme Vector Model Row */}
        <div className="grid grid-cols-2 gap-16 mt-24">
          {/* AI Campaign Insights & Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
          >
            <h2 className="text-4xl font-black text-white mb-8">AI Campaign Intelligence</h2>
            <p className="text-gray-400 text-xl mb-12">Smart recommendations powered by MediaID analytics</p>
            
            {/* Recommended Artists */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-green-400 mb-8">🎯 Recommended Artist Partnerships</h3>
              <div className="space-y-6">
                {[
                  { 
                    name: "Zara Midnight", 
                    genre: "Synth Pop", 
                    matchScore: 94, 
                    projectedReach: 127000, 
                    estimatedRevenue: 45600, 
                    fanAlignment: "Tech-forward millennials",
                    avatar: "🌙"
                  },
                  { 
                    name: "Digital Dreams", 
                    genre: "Electronic", 
                    matchScore: 89, 
                    projectedReach: 98500, 
                    estimatedRevenue: 38200, 
                    fanAlignment: "Innovation enthusiasts",
                    avatar: "💫"
                  },
                  { 
                    name: "Neon Pulse", 
                    genre: "Future Bass", 
                    matchScore: 87, 
                    projectedReach: 85300, 
                    estimatedRevenue: 33800, 
                    fanAlignment: "Early adopters",
                    avatar: "⚡"
                  }
                ].map((artist, index) => (
                  <motion.div
                    key={artist.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.2 }}
                    className="p-6 rounded-2xl bg-gradient-to-r from-gray-800/30 to-gray-900/30 border border-gray-700/30 hover:border-green-400/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center text-2xl">
                          {artist.avatar}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white">{artist.name}</p>
                          <p className="text-gray-400">{artist.genre}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-green-400">{artist.matchScore}%</p>
                        <p className="text-gray-400 text-sm">AI Match</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-gray-800/50 rounded-xl">
                        <p className="text-lg font-bold text-blue-400">{(artist.projectedReach / 1000).toFixed(0)}K</p>
                        <p className="text-gray-500 text-sm">Reach</p>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-xl">
                        <p className="text-lg font-bold text-yellow-400">${(artist.estimatedRevenue / 1000).toFixed(0)}K</p>
                        <p className="text-gray-500 text-sm">Est. Revenue</p>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-xl">
                        <p className="text-xs text-gray-300">{artist.fanAlignment}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Campaign Optimization Insights */}
            <div>
              <h3 className="text-2xl font-bold text-purple-400 mb-8">🧠 Campaign Optimization Insights</h3>
              <div className="space-y-4">
                {[
                  { insight: "Increase budget on Gen Z segments for 23% higher conversion", priority: "High", impact: "+$12.4K" },
                  { insight: "Launch companion TikTok campaign for viral amplification", priority: "Medium", impact: "+45% reach" },
                  { insight: "Optimize posting time to 7-9 PM for peak engagement", priority: "Low", impact: "+8% CTR" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + index * 0.1 }}
                    className="p-4 rounded-xl bg-gray-800/30 border-l-4 border-purple-400"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{item.insight}</p>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          item.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-purple-400 font-bold">{item.impact}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Interactive Theme Vector Model */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="p-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
          >
            <h2 className="text-4xl font-black text-white mb-8">Artist Theme Vector Space</h2>
            <p className="text-gray-400 text-xl mb-12">Interactive content theme relationships</p>
            
            {/* Vector Space Visualization */}
            <div className="relative h-96 bg-gradient-to-br from-gray-900/50 to-black/50 rounded-3xl p-8 overflow-hidden mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-green-900/20 rounded-3xl" />
              
              {/* Vector Grid Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#444" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              
              {/* Axis Labels */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-400 font-bold">
                Brand Alignment →
              </div>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90 text-gray-400 font-bold">
                Engagement Potential ↑
              </div>
              
              {/* Theme Nodes */}
              {[
                { theme: "Innovation", x: 75, y: 20, size: 24, color: "#00ff88", connections: ["Tech", "Future"] },
                { theme: "Tech", x: 85, y: 35, size: 20, color: "#00d4ff", connections: ["Innovation", "Digital"] },
                { theme: "Digital", x: 65, y: 45, size: 18, color: "#ff6b35", connections: ["Tech", "Future"] },
                { theme: "Future", x: 55, y: 25, size: 22, color: "#ffd23f", connections: ["Innovation", "Digital"] },
                { theme: "Dreams", x: 25, y: 60, size: 16, color: "#ff3366", connections: ["Love", "Hope"] },
                { theme: "Love", x: 35, y: 75, size: 14, color: "#ff69b4", connections: ["Dreams", "Hope"] },
                { theme: "Hope", x: 15, y: 70, size: 15, color: "#9d4edd", connections: ["Dreams", "Love"] },
                { theme: "Energy", x: 70, y: 65, size: 19, color: "#f72585", connections: ["Music", "Vibe"] },
                { theme: "Music", x: 45, y: 80, size: 17, color: "#4cc9f0", connections: ["Energy", "Vibe"] },
                { theme: "Vibe", x: 60, y: 85, size: 16, color: "#7209b7", connections: ["Energy", "Music"] }
              ].map((node, index) => (
                <motion.div
                  key={node.theme}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.3 + index * 0.1, duration: 0.6 }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ 
                    left: `${node.x}%`, 
                    top: `${node.y}%`,
                  }}
                >
                  {/* Node Circle */}
                  <div 
                    className="rounded-full flex items-center justify-center font-bold text-black hover:scale-110 transition-transform duration-300"
                    style={{ 
                      width: `${node.size}px`, 
                      height: `${node.size}px`,
                      backgroundColor: node.color,
                      boxShadow: `0 0 20px ${node.color}60`
                    }}
                  >
                    <span className="text-xs">{node.theme.slice(0, 3)}</span>
                  </div>
                  
                  {/* Hover Tooltip */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-600">
                    <p className="font-bold text-sm">{node.theme}</p>
                    <p className="text-xs text-gray-400">
                      Connected: {node.connections.join(", ")}
                    </p>
                  </div>
                  
                  {/* Pulsing Animation */}
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: node.color }}
                  />
                </motion.div>
              ))}
              
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Innovation cluster */}
                <line x1="75%" y1="20%" x2="85%" y2="35%" stroke="#00ff8850" strokeWidth="2" />
                <line x1="75%" y1="20%" x2="55%" y2="25%" stroke="#00ff8850" strokeWidth="2" />
                <line x1="85%" y1="35%" x2="65%" y2="45%" stroke="#00d4ff50" strokeWidth="2" />
                <line x1="65%" y1="45%" x2="55%" y2="25%" stroke="#ff6b3550" strokeWidth="2" />
                
                {/* Dreams cluster */}
                <line x1="25%" y1="60%" x2="35%" y2="75%" stroke="#ff336650" strokeWidth="2" />
                <line x1="25%" y1="60%" x2="15%" y2="70%" stroke="#ff336650" strokeWidth="2" />
                <line x1="35%" y1="75%" x2="15%" y2="70%" stroke="#ff69b450" strokeWidth="2" />
                
                {/* Energy cluster */}
                <line x1="70%" y1="65%" x2="45%" y2="80%" stroke="#f7258550" strokeWidth="2" />
                <line x1="70%" y1="65%" x2="60%" y2="85%" stroke="#f7258550" strokeWidth="2" />
                <line x1="45%" y1="80%" x2="60%" y2="85%" stroke="#4cc9f050" strokeWidth="2" />
              </svg>
            </div>
            
            {/* Theme Analysis */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-gray-800/30 rounded-2xl">
                <h4 className="text-lg font-bold text-green-400 mb-4">🎯 High-Value Clusters</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Innovation + Tech</span>
                    <span className="text-green-400 font-bold">94% alignment</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Energy + Music</span>
                    <span className="text-blue-400 font-bold">87% alignment</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Dreams + Hope</span>
                    <span className="text-purple-400 font-bold">82% alignment</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-800/30 rounded-2xl">
                <h4 className="text-lg font-bold text-blue-400 mb-4">📊 Vector Insights</h4>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">
                    <span className="text-yellow-400 font-bold">Innovation</span> themes show highest brand alignment
                  </p>
                  <p className="text-gray-300">
                    <span className="text-green-400 font-bold">Tech cluster</span> drives 3x more engagement
                  </p>
                  <p className="text-gray-300">
                    <span className="text-purple-400 font-bold">Cross-cluster</span> campaigns perform +45% better
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default BrandDashboardSpacious 