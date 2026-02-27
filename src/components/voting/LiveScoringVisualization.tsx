import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ArtistScore {
  id: string
  name: string
  averageScore: number
  totalVotes: number
  categoryScores: Record<string, number>
  trend: 'up' | 'down' | 'stable'
  position: number
}

interface LiveScoringVisualizationProps {
  artists: ArtistScore[]
  categories: Array<{
    key: string
    label: string
    icon: string
    weight: number
  }>
  isLive: boolean
}

const LiveScoringVisualization: React.FC<LiveScoringVisualizationProps> = ({
  artists,
  categories,
  isLive
}) => {
  const [viewMode, setViewMode] = useState<'leaderboard' | 'radar' | 'heatmap'>('leaderboard')
  const [sortedArtists, setSortedArtists] = useState<ArtistScore[]>([])

  useEffect(() => {
    const sorted = [...artists].sort((a, b) => b.averageScore - a.averageScore)
    setSortedArtists(sorted)
  }, [artists])

  const maxScore = Math.max(...artists.map(a => a.averageScore))

  // Leaderboard View
  const LeaderboardView = () => (
    <div className="space-y-3">
      {sortedArtists.map((artist, index) => (
        <motion.div
          key={artist.id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 overflow-hidden"
        >
          {/* Position Indicator */}
          <div className={`absolute top-0 left-0 w-1 h-full ${
            index === 0 ? 'bg-gradient-to-b from-yellow-400 to-orange-500' :
            index === 1 ? 'bg-gradient-to-b from-gray-300 to-gray-400' :
            index === 2 ? 'bg-gradient-to-b from-orange-400 to-yellow-600' :
            'bg-gradient-to-b from-blue-400 to-purple-500'
          }`} />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Position Badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-500 text-black' :
                index === 1 ? 'bg-gray-400 text-black' :
                index === 2 ? 'bg-orange-500 text-black' :
                'bg-blue-500 text-white'
              }`}>
                {index + 1}
              </div>

              <div>
                <h3 className="text-white font-semibold">{artist.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">{artist.totalVotes} votes</span>
                  {isLive && (
                    <motion.div
                      className={`flex items-center space-x-1 text-xs ${
                        artist.trend === 'up' ? 'text-green-400' :
                        artist.trend === 'down' ? 'text-red-400' :
                        'text-gray-400'
                      }`}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {artist.trend === 'up' ? '↗' : artist.trend === 'down' ? '↘' : '→'}
                      <span>LIVE</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Score Display */}
            <div className="text-right">
              <motion.div
                key={artist.averageScore}
                initial={{ scale: 1.2, color: '#10B981' }}
                animate={{ scale: 1, color: '#FFFFFF' }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold text-white"
              >
                {artist.averageScore.toFixed(1)}
              </motion.div>
              <div className="text-gray-400 text-sm">/ 5.0</div>
            </div>
          </div>

          {/* Score Bar */}
          <div className="mt-3 relative">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  'bg-gradient-to-r from-blue-400 to-purple-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${(artist.averageScore / 5) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="mt-3 grid grid-cols-5 gap-2">
            {categories.map((category) => (
              <div key={category.key} className="text-center">
                <div className="text-xs text-gray-400">{category.icon}</div>
                <div className="text-sm font-medium text-white">
                  {(artist.categoryScores[category.key] || 0).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )

  // Radar Chart View (simplified version)
  const RadarView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sortedArtists.slice(0, 4).map((artist, index) => (
        <motion.div
          key={artist.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <div className="text-center mb-4">
            <h3 className="text-white font-semibold">{artist.name}</h3>
            <div className="text-2xl font-bold text-white">{artist.averageScore.toFixed(1)}</div>
          </div>

          {/* Simple Category Bars */}
          <div className="space-y-3">
            {categories.map((category) => {
              const score = artist.categoryScores[category.key] || 0
              return (
                <div key={category.key} className="flex items-center space-x-3">
                  <span className="text-lg">{category.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{category.label}</span>
                      <span className="text-white font-medium">{score.toFixed(1)}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(score / 5) * 100}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-white">Live Scoring</h2>
          {isLive && (
            <motion.div
              className="w-2 h-2 bg-red-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        <div className="flex backdrop-blur-xl bg-white/5 rounded-xl p-1 border border-white/10">
          {[
            { key: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
            { key: 'radar', icon: '📊', label: 'Categories' }
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === key
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'leaderboard' ? <LeaderboardView /> : <RadarView />}
        </motion.div>
      </AnimatePresence>

      {/* Real-time Update Indicator */}
      {isLive && (
        <motion.div
          className="text-center text-gray-400 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔄 Updates every 5 seconds
        </motion.div>
      )}
    </div>
  )
}

export default LiveScoringVisualization