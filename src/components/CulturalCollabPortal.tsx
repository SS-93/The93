import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Mock data for cultural collaboration opportunities
const mockOffers = {
  brandToArtist: [
    {
      id: 'b2a-1',
      brand: {
        name: 'Asics Trail',
        logo: '🏃',
        industry: 'Athletic Footwear',
        tier: 'Premium'
      },
      campaign: {
        title: 'Trail Runner Community Drop',
        budget: '$15,000',
        timeline: '2 weeks',
        reach: '50K+ active fans',
        culturalContext: 'Seeking artists with movement/outdoor aesthetics'
      },
      offer: {
        type: 'Code Drop',
        value: '20% off trail runners',
        quantity: '200 unique codes',
        payout: '$75 per code claimed',
        exclusivity: '3-day window'
      },
      tags: ['movement', 'outdoor', 'fitness', 'authentic', 'community'],
      matchScore: 94,
      requirements: {
        minFollowers: 1000,
        engagementRate: 8,
        demographics: 'Active lifestyle audience',
        previousBrandWork: false
      },
      culturalFit: {
        vibe: 'Authentic movement culture, not performative fitness',
        examples: 'Trail running vlogs, nature sound mixing, outdoor meditation',
        antiExamples: 'Gym flex posts, product placement shots'
      }
    },
    {
      id: 'b2a-2',
      brand: {
        name: 'Ableton',
        logo: '🎛️',
        industry: 'Music Technology',
        tier: 'Professional'
      },
      campaign: {
        title: 'Producer Preset Collaboration',
        budget: '$8,500',
        timeline: '1 week',
        reach: '25K+ producers',
        culturalContext: 'Behind-the-scenes creation process showcase'
      },
      offer: {
        type: 'Digital Asset',
        value: 'Exclusive preset pack + workflow',
        quantity: 'Unlimited downloads',
        payout: '$2,500 flat + $1 per download',
        exclusivity: '7-day early access'
      },
      tags: ['production', 'workflow', 'creativity', 'technical', 'education'],
      matchScore: 89,
      requirements: {
        minFollowers: 500,
        engagementRate: 12,
        demographics: 'Producer/musician audience',
        previousBrandWork: true
      },
      culturalFit: {
        vibe: 'Real studio insights, creative process transparency',
        examples: 'Beat breakdown videos, sample flipping tutorials, creative challenges',
        antiExamples: 'Generic "use this software" posts'
      }
    },
    {
      id: 'b2a-3',
      brand: {
        name: 'Vans Skate',
        logo: '🛹',
        industry: 'Skateboard Culture',
        tier: 'Lifestyle'
      },
      campaign: {
        title: 'Digital Sticker Hunt',
        budget: '$12,000',
        timeline: '3 weeks',
        reach: '100K+ skate culture',
        culturalContext: 'AR scavenger hunt through city spots'
      },
      offer: {
        type: 'Interactive Experience',
        value: 'Custom digital sticker pack + AR hunt',
        quantity: '500 hunt participants',
        payout: '$5 per completion + $20 per UGC post',
        exclusivity: '2-week exclusive launch'
      },
      tags: ['skateboarding', 'street', 'AR', 'gaming', 'urban'],
      matchScore: 87,
      requirements: {
        minFollowers: 2000,
        engagementRate: 15,
        demographics: 'Skate/street culture audience',
        previousBrandWork: false
      },
      culturalFit: {
        vibe: 'Real skate spots, not staged corporate content',
        examples: 'Spot documentation, trick tutorials, skate crew content',
        antiExamples: 'Model shots, non-skater influencer content'
      }
    }
  ],
  artistToBrand: [
    {
      id: 'a2b-1',
      artist: {
        name: 'Luna Starlight',
        avatar: '🌙',
        genre: 'Electronic Pop',
        followers: 45600,
        engagementRate: 18.5
      },
      pitch: {
        title: 'Sustainable Tech Fashion Collab',
        concept: 'Ambient soundscapes for sustainable fashion brand campaigns',
        culturalAngle: 'Merge electronic aesthetics with eco-consciousness'
      },
      audience: {
        size: '45K+ engaged fans',
        demographics: 'Tech-forward millennials, sustainability conscious',
        interests: ['minimal design', 'future tech', 'environmental awareness'],
        lockerEngagement: '92% daily check-ins'
      },
      proposal: {
        type: 'Audio-Visual Content Series',
        deliverables: 'Custom soundscape + visual campaign + locker integration',
        timeline: '4 weeks',
        budgetRange: '$25,000 - $40,000'
      },
      brandTargets: ['Patagonia', 'Allbirds', 'Tesla', 'Apple'],
      culturalFit: {
        vibe: 'Authentic sustainability story through sound design',
        examples: 'Nature-inspired production, minimalist aesthetics, eco-tech themes',
        value: 'Not just endorsement - co-creation of cultural moment'
      }
    },
    {
      id: 'a2b-2',
      artist: {
        name: 'Binary Dreams',
        avatar: '🤖',
        genre: 'AI-Ambient',
        followers: 23400,
        engagementRate: 24.2
      },
      pitch: {
        title: 'AI Ethics Through Music',
        concept: 'Interactive AI music experiences exploring technology ethics',
        culturalAngle: 'Human-AI collaboration in creative process'
      },
      audience: {
        size: '23K+ tech enthusiasts',
        demographics: 'AI researchers, tech workers, future-focused creators',
        interests: ['AI ethics', 'digital philosophy', 'technological consciousness'],
        lockerEngagement: '87% weekly participation'
      },
      proposal: {
        type: 'Interactive Tech Experience',
        deliverables: 'AI-assisted composition tool + educational content + live demo',
        timeline: '6 weeks',
        budgetRange: '$35,000 - $55,000'
      },
      brandTargets: ['OpenAI', 'Microsoft', 'NVIDIA', 'Anthropic'],
      culturalFit: {
        vibe: 'Thoughtful AI exploration, not tech-bro hype',
        examples: 'AI co-creation process, ethical tech discussions, human-machine harmony',
        value: 'Cultural leadership in AI consciousness, not just promotion'
      }
    }
  ]
}

const mockUserProfiles = {
  artist: {
    name: 'Zara Midnight',
    avatar: '🌟',
    type: 'artist' as const,
    stats: {
      followers: 12400,
      lockerEngagement: 89,
      brandCollabScore: 7.8,
      culturalAlignment: 92
    },
    preferences: {
      brandTypes: ['sustainable fashion', 'music tech', 'indie beauty'],
      collaborationStyle: 'co-creation',
      budgetRange: '$5k-$25k'
    }
  },
  brand: {
    name: 'Echo Innovations',
    logo: '🎧',
    type: 'brand' as const,
    stats: {
      campaignSuccess: 94,
      artistSatisfaction: 8.9,
      culturalRelevance: 87,
      budgetRange: '$50k-$200k'
    },
    preferences: {
      artistGenres: ['electronic', 'indie', 'experimental'],
      collaborationStyle: 'cultural narrative',
      audienceTarget: 'tech-forward creatives'
    }
  }
}

interface CulturalCollabPortalProps {
  userType?: 'artist' | 'brand'
  userName?: string
}

const CulturalCollabPortal: React.FC<CulturalCollabPortalProps> = ({ 
  userType = 'artist',
  userName = 'Zara Midnight'
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-offers' | 'create' | 'insights'>('browse')
  const [filterBy, setFilterBy] = useState<'all' | 'high-match' | 'budget' | 'timeline'>('high-match')
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const currentUser = userType === 'artist' ? mockUserProfiles.artist : mockUserProfiles.brand
  const offers: any[] = userType === 'artist' ? mockOffers.brandToArtist : mockOffers.artistToBrand

  const filteredOffers = offers.filter((offer: any) => {
    if (filterBy === 'high-match') return offer.matchScore >= 85 || offer.artist?.engagementRate >= 18
    if (filterBy === 'budget') return true // Could add budget filtering
    if (filterBy === 'timeline') return true // Could add timeline filtering
    return true
  })

  const OfferCard = ({ offer, type }: { offer: any, type: 'brand-to-artist' | 'artist-to-brand' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 hover:border-purple-400/50 transition-all cursor-pointer"
      onClick={() => setSelectedOffer(offer)}
    >
      {type === 'brand-to-artist' ? (
        <>
          {/* Brand to Artist Offer */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-3xl">
                {offer.brand.logo}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{offer.brand.name}</h3>
                <p className="text-gray-400">{offer.brand.industry} • {offer.brand.tier}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-4 py-2 bg-green-500/20 rounded-xl">
                <span className="text-green-400 font-bold text-xl">{offer.matchScore}% match</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xl font-bold text-white mb-2">{offer.campaign.title}</h4>
            <p className="text-gray-300 mb-4">{offer.campaign.culturalContext}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                <p className="text-lg font-bold text-blue-400">{offer.campaign.budget}</p>
                <p className="text-gray-500 text-sm">Budget</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                <p className="text-lg font-bold text-yellow-400">{offer.campaign.timeline}</p>
                <p className="text-gray-500 text-sm">Timeline</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                <p className="text-lg font-bold text-green-400">{offer.campaign.reach}</p>
                <p className="text-gray-500 text-sm">Reach</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="p-4 bg-purple-500/10 border border-purple-400/30 rounded-xl">
              <h5 className="text-lg font-bold text-purple-400 mb-2">Cultural Fit</h5>
              <p className="text-gray-300 text-sm mb-2">{offer.culturalFit.vibe}</p>
              <p className="text-green-400 text-sm">✓ {offer.culturalFit.examples}</p>
              <p className="text-red-400 text-sm">✗ {offer.culturalFit.antiExamples}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {offer.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-gray-800/50 text-gray-300 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {offer.offer.type} • {offer.offer.payout}
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform">
              Express Interest
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Artist to Brand Pitch */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center text-3xl">
                {offer.artist.avatar}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{offer.artist.name}</h3>
                <p className="text-gray-400">{offer.artist.genre} • {offer.artist.followers.toLocaleString()} followers</p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-4 py-2 bg-green-500/20 rounded-xl">
                <span className="text-green-400 font-bold text-xl">{offer.artist.engagementRate}% engaged</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xl font-bold text-white mb-2">{offer.pitch.title}</h4>
            <p className="text-gray-300 mb-2">{offer.pitch.concept}</p>
            <p className="text-purple-400 text-sm italic">{offer.pitch.culturalAngle}</p>
          </div>

          <div className="mb-6">
            <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <h5 className="text-lg font-bold text-blue-400 mb-2">Cultural Value</h5>
              <p className="text-gray-300 text-sm mb-2">{offer.culturalFit.vibe}</p>
              <p className="text-green-400 text-sm">💡 {offer.culturalFit.value}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-800/50 rounded-xl">
              <p className="text-lg font-bold text-yellow-400">{offer.proposal.budgetRange}</p>
              <p className="text-gray-500 text-sm">Budget Range</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-xl">
              <p className="text-lg font-bold text-blue-400">{offer.proposal.timeline}</p>
              <p className="text-gray-500 text-sm">Timeline</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Targeting: {offer.brandTargets.slice(0, 2).join(', ')}...
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform">
              Start Conversation
            </button>
          </div>
        </>
      )}
    </motion.div>
  )

  const CreateOfferModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
      onClick={() => setShowCreateModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">
            {userType === 'artist' ? 'Pitch to Brands' : 'Create Campaign'}
          </h2>
          <button
            onClick={() => setShowCreateModal(false)}
            className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {userType === 'artist' ? (
            <>
              <div>
                <label className="block text-white font-bold mb-2">Collaboration Title</label>
                <input
                  type="text"
                  placeholder="e.g., Sustainable Tech Fashion Collab"
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-bold mb-2">Cultural Concept</label>
                <textarea
                  placeholder="What cultural moment are you creating? How does this go beyond traditional advertising?"
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 h-24"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Target Brands</label>
                <input
                  type="text"
                  placeholder="e.g., Patagonia, Tesla, Allbirds"
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Budget Range</label>
                  <select className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white">
                    <option>$5K - $15K</option>
                    <option>$15K - $30K</option>
                    <option>$30K - $50K</option>
                    <option>$50K+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Timeline</label>
                  <select className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white">
                    <option>1-2 weeks</option>
                    <option>3-4 weeks</option>
                    <option>1-2 months</option>
                    <option>3+ months</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-white font-bold mb-2">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g., Trail Runner Community Drop"
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-bold mb-2">Cultural Context</label>
                <textarea
                  placeholder="What cultural space are you entering? How does this align with artist authenticity?"
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 h-24"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Artist Criteria</label>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white">
                    <option>Genre: All</option>
                    <option>Electronic</option>
                    <option>Hip-Hop</option>
                    <option>Indie</option>
                    <option>Alternative</option>
                  </select>
                  <select className="p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white">
                    <option>Followers: Any</option>
                    <option>1K - 10K</option>
                    <option>10K - 50K</option>
                    <option>50K+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Campaign Budget</label>
                  <input
                    type="text"
                    placeholder="e.g., $15,000"
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Payout Model</label>
                  <select className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white">
                    <option>Per code claimed</option>
                    <option>Flat rate</option>
                    <option>Revenue share</option>
                    <option>Hybrid model</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="flex space-x-4 pt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform">
              {userType === 'artist' ? 'Send Pitch' : 'Launch Campaign'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-500 rounded-3xl flex items-center justify-center text-4xl">
              {userType === 'artist' ? '🎵' : '🏢'}
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Cultural Collaboration Portal
              </h1>
              <p className="text-xl text-gray-400 mt-2">
                {userType === 'artist' 
                  ? 'Discover brand partnerships that align with your artistic vision'
                  : 'Connect with artists for authentic cultural collaborations'
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="px-6 py-3 bg-gray-800/50 rounded-2xl border border-gray-700">
              <p className="text-white font-bold text-xl">{currentUser.name}</p>
              <p className="text-gray-400">
                {userType === 'artist' 
                  ? `${(currentUser.stats as any).followers.toLocaleString()} followers • ${(currentUser.stats as any).culturalAlignment}% cultural fit`
                  : `${(currentUser.stats as any).campaignSuccess}% success • ${(currentUser.stats as any).culturalRelevance}% relevance`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-12">
          {[
            { id: 'browse', label: userType === 'artist' ? 'Browse Campaigns' : 'Browse Pitches', icon: '🔍' },
            { id: 'my-offers', label: 'My Collaborations', icon: '💼' },
            { id: 'create', label: userType === 'artist' ? 'Create Pitch' : 'Create Campaign', icon: '✨' },
            { id: 'insights', label: 'Cultural Insights', icon: '🧠' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.id === 'create' ? setShowCreateModal(true) : setActiveTab(tab.id as any)}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-xl'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'browse' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Filter Bar */}
              <div className="flex items-center justify-between mb-8 p-6 bg-gray-800/30 rounded-2xl">
                <div className="flex space-x-4">
                  {['all', 'high-match', 'budget', 'timeline'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterBy(filter as any)}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        filterBy === filter
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
                
                <div className="text-gray-400">
                  {filteredOffers.length} {userType === 'artist' ? 'campaigns' : 'pitches'} available
                </div>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredOffers.map((offer: any) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={offer} 
                    type={userType === 'artist' ? 'brand-to-artist' : 'artist-to-brand'} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'my-offers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-6">💼</div>
              <h2 className="text-3xl font-bold text-white mb-4">Active Collaborations</h2>
              <p className="text-gray-400 text-xl mb-8">Your ongoing partnerships and conversations will appear here</p>
              <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform">
                Browse New Opportunities
              </button>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50">
                  <h3 className="text-2xl font-bold text-white mb-6">Cultural Alignment Score</h3>
                  <div className="text-center mb-6">
                    <div className="text-6xl font-black text-purple-400 mb-2">
                      {userType === 'artist' ? (currentUser.stats as any).culturalAlignment : (currentUser.stats as any).culturalRelevance}%
                    </div>
                    <p className="text-gray-400">
                      {userType === 'artist' 
                        ? 'Brand collaboration readiness'
                        : 'Artist culture alignment'
                      }
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Authenticity</span>
                      <span className="text-green-400 font-bold">92%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Audience Engagement</span>
                      <span className="text-blue-400 font-bold">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Cultural Relevance</span>
                      <span className="text-purple-400 font-bold">94%</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50">
                  <h3 className="text-2xl font-bold text-white mb-6">Trending Collaborations</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/30 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Sustainable Tech</span>
                        <span className="text-green-400">+23%</span>
                      </div>
                      <p className="text-gray-400 text-sm">Eco-conscious tech brands seeking authentic partnerships</p>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">AI Ethics</span>
                        <span className="text-blue-400">+18%</span>
                      </div>
                      <p className="text-gray-400 text-sm">Thoughtful AI exploration through creative lens</p>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Street Culture</span>
                        <span className="text-purple-400">+15%</span>
                      </div>
                      <p className="text-gray-400 text-sm">Authentic urban brand activations</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Offer Modal */}
        <AnimatePresence>
          {showCreateModal && <CreateOfferModal />}
        </AnimatePresence>

        {/* Selected Offer Detail Modal */}
        <AnimatePresence>
          {selectedOffer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
              onClick={() => setSelectedOffer(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">
                    {userType === 'artist' ? selectedOffer.campaign?.title : selectedOffer.pitch?.title}
                  </h2>
                  <button
                    onClick={() => setSelectedOffer(null)}
                    className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Detailed Collaboration View</h3>
                  <p className="text-gray-400 mb-8">
                    Full collaboration details, terms, and conversation tools would be implemented here
                  </p>
                  <div className="flex space-x-4 justify-center">
                    <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform">
                      Start Collaboration
                    </button>
                    <button className="px-8 py-4 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors">
                      Save for Later
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CulturalCollabPortal