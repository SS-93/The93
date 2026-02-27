import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Artist {
  id: string
  artist_name: string
  email?: string
  phone?: string
  instagram_handle?: string
  spotify_url?: string
  apple_music_url?: string
  bio?: string
  stage_name?: string
  performance_notes?: string
  contact_status?: string
  registration_token?: string
  vote_count: number
  final_placement?: number
  host_notes?: string
  tags?: string[]
  priority?: number
  created_at?: string
  updated_at?: string
  profile_image_url?: string
  average_score?: number
  total_ratings?: number
}

interface ArtistTradingCardProps {
  artist: Artist | null
  isOpen: boolean
  onClose: () => void
  eventTitle?: string
}

const ArtistTradingCard: React.FC<ArtistTradingCardProps> = ({
  artist,
  isOpen,
  onClose,
  eventTitle
}) => {
  if (!artist) return null

  // Calculate card rarity based on stats
  const getCardRarity = () => {
    const score = (artist.average_score || 0) + (artist.vote_count / 10)
    if (score >= 4.5) return { rarity: 'LEGENDARY', color: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/50' }
    if (score >= 3.5) return { rarity: 'RARE', color: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/50' }
    if (score >= 2.5) return { rarity: 'UNCOMMON', color: 'from-green-500 to-emerald-500', glow: 'shadow-green-500/50' }
    return { rarity: 'COMMON', color: 'from-gray-500 to-slate-500', glow: 'shadow-gray-500/50' }
  }

  const cardRarity = getCardRarity()

  // Social links with icons
  const socialLinks = [
    {
      name: 'Instagram',
      url: artist.instagram_handle ? `https://instagram.com/${artist.instagram_handle.replace('@', '')}` : null,
      icon: '📸',
      color: 'bg-pink-600 hover:bg-pink-700'
    },
    {
      name: 'Spotify',
      url: artist.spotify_url,
      icon: '🎵',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Apple Music',
      url: artist.apple_music_url,
      icon: '🍎',
      color: 'bg-gray-800 hover:bg-gray-900'
    }
  ].filter(link => link.url)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className={`
              relative bg-gradient-to-br ${cardRarity.color} p-1 rounded-2xl
              shadow-2xl ${cardRarity.glow} max-w-md w-full mx-4
            `}
          >
            {/* Card Border Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-50" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white font-bold z-10 transition-colors"
            >
              ✕
            </button>

            {/* Card Content */}
            <div className="bg-gray-900 rounded-xl p-6 text-white">
              {/* Card Header */}
              <div className="text-center mb-6">
                <div className="relative mb-4">
                  {/* Artist Photo - Now using new photo system */}
                  <div className="relative">
                    {artist.profile_image_url ? (
                      <img
                        src={artist.profile_image_url}
                        alt={artist.artist_name}
                        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-accent-yellow shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-yellow to-orange-500 text-black flex items-center justify-center font-bold text-2xl mx-auto border-4 border-accent-yellow shadow-xl">
                        {artist.artist_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gradient-to-r ${cardRarity.color} rounded-full text-xs font-bold text-white shadow-lg`}>
                      {cardRarity.rarity}
                    </div>
                  </div>
                </div>

                {/* Artist Name */}
                <h1 className="text-2xl font-bold text-accent-yellow mb-1">{artist.artist_name}</h1>
                {artist.stage_name && artist.stage_name !== artist.artist_name && (
                  <p className="text-gray-400 text-sm">"{artist.stage_name}"</p>
                )}

                {/* Event Badge */}
                {eventTitle && (
                  <div className="inline-block px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300 mt-2">
                    {eventTitle}
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-800/50 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-yellow">{artist.vote_count}</div>
                  <div className="text-xs text-gray-400">VOTES</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-yellow">
                    {artist.average_score ? artist.average_score.toFixed(1) : '---'}
                  </div>
                  <div className="text-xs text-gray-400">RATING</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-yellow">{artist.total_ratings || 0}</div>
                  <div className="text-xs text-gray-400">REVIEWS</div>
                </div>
              </div>

              {/* Bio Section */}
              {artist.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">About</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{artist.bio}</p>
                </div>
              )}

              {/* Performance Notes */}
              {artist.performance_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Performance Notes</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{artist.performance_notes}</p>
                </div>
              )}

              {/* Social Links - Glass Style Link Tree */}
              {socialLinks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Connect</h3>
                  <div className="space-y-3">
                    {socialLinks.map((link, index) => (
                      <motion.a
                        key={index}
                        href={link.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 0 30px rgba(255, 255, 255, 0.1)"
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="
                          group relative block w-full backdrop-blur-xl bg-white/5 rounded-2xl p-4
                          text-center text-white font-medium transition-all duration-300 ease-out
                          flex items-center justify-center space-x-3 border border-white/10
                          hover:bg-white/10 hover:border-white/20 overflow-hidden
                          before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/5
                          before:via-transparent before:to-white/5 before:opacity-0 before:transition-opacity
                          before:duration-300 hover:before:opacity-100
                        "
                      >
                        {/* Animated background gradient */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                          animate={{
                            background: [
                              "linear-gradient(45deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.1))",
                              "linear-gradient(135deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.1))",
                              "linear-gradient(225deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.1))",
                              "linear-gradient(315deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.1))"
                            ]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />

                        <motion.span
                          className="relative text-xl z-10"
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          {link.icon}
                        </motion.span>

                        <span className="relative z-10">{link.name}</span>

                        <motion.span
                          className="relative text-sm opacity-50 z-10"
                          whileHover={{ x: 2, opacity: 80 }}
                          transition={{ duration: 0.2 }}
                        >
                          ↗
                        </motion.span>

                        {/* Glass shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status & Tags */}
              <div className="flex flex-wrap gap-2 justify-center">
                {artist.contact_status && (
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    artist.contact_status === 'confirmed' ? 'bg-green-600/20 text-green-300' :
                    artist.contact_status === 'pending' ? 'bg-yellow-600/20 text-yellow-300' :
                    'bg-gray-600/20 text-gray-300'
                  }`}>
                    {artist.contact_status.toUpperCase()}
                  </span>
                )}

                {artist.tags?.map(tag => (
                  <span key={tag} className="px-3 py-1 text-xs bg-accent-yellow/20 text-accent-yellow rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Buckets Branding */}
              <div className="text-center mt-6 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-500">
                  Powered by <span className="text-accent-yellow font-bold">Buckets</span>
                </div>
              </div>
            </div>

            {/* Holographic Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ArtistTradingCard