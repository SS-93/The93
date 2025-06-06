import React, { useState } from 'react'
import { motion } from 'framer-motion'

// Mock data for the message center
const mockOffers = [
  {
    id: 1,
    type: 'brand_to_artist',
    from: { name: 'Moncler', type: 'brand', avatar: '🧥', verified: true },
    to: { name: 'Zara Midnight', type: 'artist', avatar: '🌙' },
    campaign: {
      title: 'Winter Vibes Collection Drop',
      description: 'Limited-time virtual try-on lookbook inside your locker, connected to our new urban exploration line',
      budget: '$15,000',
      timeline: '2 weeks',
      deliverables: ['3 locker drops', 'Behind-scenes content', 'Fan exclusive codes'],
      audienceMatch: 94,
      culturalFit: 'Urban exploration + minimalist aesthetic'
    },
    status: 'pending',
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    type: 'artist_to_brand',
    from: { name: 'Digital Dreams', type: 'artist', avatar: '💫' },
    to: { name: 'Ableton', type: 'brand', avatar: '🎛️', verified: true },
    campaign: {
      title: 'Producer Pack Collaboration',
      description: 'Exclusive preset rack + behind-the-scenes voice memos on my creative process for your community',
      proposedValue: 'Reach 85K engaged electronic music fans',
      timeline: '1 month',
      deliverables: ['Custom preset pack', 'Studio process videos', 'Live Q&A session'],
      audienceMatch: 89,
      culturalFit: 'Electronic music production education'
    },
    status: 'in_progress',
    timestamp: '1 day ago'
  },
  {
    id: 3,
    type: 'brand_to_artist',
    from: { name: 'Vans', type: 'brand', avatar: '👟', verified: true },
    to: { name: 'Neon Pulse', type: 'artist', avatar: '⚡' },
    campaign: {
      title: 'Skate Culture Digital Experience',
      description: 'Digital sticker pack + virtual skate scavenger hunt via AR phone camera for your fans',
      budget: '$8,500',
      timeline: '3 weeks',
      deliverables: ['AR sticker pack', 'Scavenger hunt setup', 'Daily locker codes'],
      audienceMatch: 92,
      culturalFit: 'Street culture + digital art fusion'
    },
    status: 'accepted',
    timestamp: '3 days ago'
  }
]

const mockOpportunities = [
  {
    id: 1,
    brand: { name: 'Nike', avatar: '✔️', verified: true },
    title: 'Movement & Music Campaign',
    description: 'Looking for artists who blend fitness culture with their music for our new training app integration',
    budget: '$20,000 - $50,000',
    tags: ['fitness', 'motivation', 'lifestyle'],
    targetAudience: 'Active millennials & Gen Z',
    deadline: '7 days left',
    matchScore: 87
  },
  {
    id: 2,
    brand: { name: 'Apple', avatar: '🍎', verified: true },
    title: 'Spatial Audio Experience',
    description: 'Create immersive locker content showcasing spatial audio technology for music discovery',
    budget: '$35,000 - $75,000',
    tags: ['tech', 'innovation', 'audio'],
    targetAudience: 'Tech-savvy music lovers',
    deadline: '12 days left',
    matchScore: 91
  },
  {
    id: 3,
    brand: { name: 'Spotify', avatar: '🎵', verified: true },
    title: 'Artist Discovery Series',
    description: 'Partner with emerging artists for exclusive locker content that drives playlist discovery',
    budget: '$10,000 - $25,000',
    tags: ['discovery', 'playlists', 'emerging'],
    targetAudience: 'Music discovery enthusiasts',
    deadline: '5 days left',
    matchScore: 96
  }
]

interface MessageCenterProps {
  userType?: 'artist' | 'brand'
  userName?: string
}

const MessageCenterTemplateUI: React.FC<MessageCenterProps> = ({ 
  userType = 'artist',
  userName = 'Zara Midnight'
}) => {
  const [activeTab, setActiveTab] = useState('inbox')
  const [selectedOffer, setSelectedOffer] = useState<any>(null)

  const filteredOffers = mockOffers.filter(offer => 
    userType === 'artist' 
      ? offer.to.type === 'artist' 
      : offer.from.type === 'brand'
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="p-16">
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
              Collaboration Hub
            </h1>
            <p className="text-2xl text-gray-400">Where culture meets commerce through authentic partnerships</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="p-6 bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50">
              <p className="text-gray-400 text-sm">Active as</p>
              <p className="text-white font-bold text-xl">{userName}</p>
              <p className="text-purple-400 capitalize">{userType}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-16">
          {[
            { id: 'inbox', label: 'Active Offers', icon: '📥' },
            { id: 'opportunities', label: 'Discover Opportunities', icon: '🔍' },
            { id: 'create', label: 'Create Proposal', icon: '✨' },
            { id: 'analytics', label: 'Collaboration Analytics', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 flex items-center space-x-3 ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-black shadow-xl'
                  : 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/40'
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Offers Tab */}
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-12 gap-8">
            {/* Offers List */}
            <div className="col-span-5 space-y-6">
              <h2 className="text-3xl font-black text-white mb-8">
                {userType === 'artist' ? 'Brand Collaboration Requests' : 'Your Campaign Proposals'}
              </h2>
              
              {filteredOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedOffer(offer)}
                  className={`p-8 rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedOffer?.id === offer.id
                      ? 'bg-purple-500/20 border-purple-400'
                      : 'bg-gray-800/40 border-gray-700/50 hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-3xl">
                        {offer.from.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xl font-bold text-white">{offer.from.name}</p>
                          {offer.from.verified && <span className="text-purple-400">✓</span>}
                        </div>
                        <p className="text-gray-400">
                          {offer.type === 'brand_to_artist' ? 'Campaign Proposal' : 'Partnership Pitch'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                        offer.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        offer.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {offer.status === 'pending' ? 'Awaiting Response' :
                         offer.status === 'accepted' ? 'Accepted' : 'In Progress'}
                      </div>
                      <p className="text-gray-500 text-sm mt-2">{offer.timestamp}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3">{offer.campaign.title}</h3>
                  <p className="text-gray-300 mb-4 line-clamp-2">{offer.campaign.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Cultural Fit</p>
                        <p className="text-lg font-bold text-green-400">{offer.campaign.audienceMatch}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Timeline</p>
                        <p className="text-lg font-bold text-blue-400">{offer.campaign.timeline}</p>
                      </div>
                    </div>
                    
                    {offer.campaign.budget && (
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Budget</p>
                        <p className="text-2xl font-black text-yellow-400">{offer.campaign.budget}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Offer Details */}
            <div className="col-span-7">
              {selectedOffer ? (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center text-4xl">
                        {selectedOffer.from.avatar}
                      </div>
                      <div>
                        <h2 className="text-4xl font-black text-white">{selectedOffer.campaign.title}</h2>
                        <p className="text-xl text-gray-400">
                          Proposed by {selectedOffer.from.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button className="px-8 py-4 bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition-all">
                        Accept Offer
                      </button>
                      <button className="px-8 py-4 bg-gray-700 text-white font-bold rounded-2xl hover:bg-gray-600 transition-all">
                        Counter Proposal
                      </button>
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div className="p-8 bg-gray-800/30 rounded-2xl">
                      <h3 className="text-2xl font-bold text-purple-400 mb-6">📋 Campaign Overview</h3>
                      <p className="text-gray-300 text-lg leading-relaxed mb-6">
                        {selectedOffer.campaign.description}
                      </p>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cultural Fit:</span>
                          <span className="text-green-400 font-bold">{selectedOffer.campaign.culturalFit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Timeline:</span>
                          <span className="text-blue-400 font-bold">{selectedOffer.campaign.timeline}</span>
                        </div>
                        {selectedOffer.campaign.budget && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Budget:</span>
                            <span className="text-yellow-400 font-bold">{selectedOffer.campaign.budget}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8 bg-gray-800/30 rounded-2xl">
                      <h3 className="text-2xl font-bold text-blue-400 mb-6">🎯 Deliverables</h3>
                      <div className="space-y-4">
                        {selectedOffer.campaign.deliverables.map((item: string, index: number) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                              <span className="text-black text-sm font-bold">{index + 1}</span>
                            </div>
                            <span className="text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 p-6 bg-green-500/10 rounded-xl border border-green-400/30">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-green-400 text-2xl">🎯</span>
                          <span className="text-green-400 font-bold text-lg">Audience Match</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${selectedOffer.campaign.audienceMatch}%` }}
                          />
                        </div>
                        <p className="text-green-400 font-bold text-2xl">{selectedOffer.campaign.audienceMatch}% Match</p>
                      </div>
                    </div>
                  </div>

                  {/* Anti-Advertisement Philosophy */}
                  <div className="p-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-400/30">
                    <h3 className="text-2xl font-bold text-purple-400 mb-4">✨ Cultural Collaboration Approach</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      This isn't traditional advertising—it's cultural collaboration. Instead of placing generic ads, 
                      we're crafting authentic moments that enhance your artistic narrative while creating genuine 
                      value for your community. Your creative vision leads, brand support follows.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-16">
                    <div className="text-8xl mb-8">💌</div>
                    <h3 className="text-3xl font-bold text-gray-400 mb-4">Select an offer to view details</h3>
                    <p className="text-xl text-gray-500">Explore collaboration opportunities that align with your creative vision</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div>
            <h2 className="text-4xl font-black text-white mb-12">Discover Partnership Opportunities</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {mockOpportunities.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 hover:border-purple-400/50 transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-3xl">
                        {opportunity.brand.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xl font-bold text-white">{opportunity.brand.name}</p>
                          {opportunity.brand.verified && <span className="text-blue-400">✓</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Match Score</p>
                      <p className="text-2xl font-black text-green-400">{opportunity.matchScore}%</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">{opportunity.title}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">{opportunity.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {opportunity.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Budget Range:</span>
                      <span className="text-yellow-400 font-bold">{opportunity.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target:</span>
                      <span className="text-blue-400 font-bold">{opportunity.targetAudience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deadline:</span>
                      <span className="text-red-400 font-bold">{opportunity.deadline}</span>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-black font-bold rounded-2xl hover:from-purple-400 hover:to-pink-400 transition-all">
                    Submit Proposal
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Create Proposal Tab */}
        {activeTab === 'create' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-black text-white mb-12 text-center">Create Cultural Collaboration Proposal</h2>
            <div className="p-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50">
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-purple-400 mb-6">Collaboration Details</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-400 mb-2">Campaign Title</label>
                      <input 
                        type="text" 
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-400 focus:outline-none"
                        placeholder="e.g., Virtual Studio Experience"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Cultural Narrative</label>
                      <textarea 
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-400 focus:outline-none h-32"
                        placeholder="Describe how this collaboration enhances your artistic vision and creates authentic value for your community..."
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Proposed Timeline</label>
                      <select className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-400 focus:outline-none">
                        <option>1-2 weeks</option>
                        <option>3-4 weeks</option>
                        <option>1-2 months</option>
                        <option>3+ months</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-blue-400 mb-6">Deliverables & Value</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-400 mb-2">Community Reach</label>
                      <input 
                        type="text" 
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-400 focus:outline-none"
                        placeholder="e.g., 85K engaged electronic music fans"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Proposed Deliverables</label>
                      <textarea 
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-400 focus:outline-none h-24"
                        placeholder="• Exclusive locker content&#10;• Behind-the-scenes access&#10;• Community interaction moments"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Budget Request</label>
                      <input 
                        type="text" 
                        className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-400 focus:outline-none"
                        placeholder="$15,000 - $25,000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <button className="px-16 py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-black font-bold text-xl rounded-3xl hover:from-purple-400 hover:to-pink-400 transition-all transform hover:scale-105">
                  Submit Collaboration Proposal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-4xl font-black text-white mb-12">Collaboration Performance Analytics</h2>
            <div className="grid grid-cols-3 gap-8 mb-12">
              <div className="p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 text-center">
                <div className="text-6xl mb-4">🤝</div>
                <p className="text-4xl font-black text-green-400 mb-2">12</p>
                <p className="text-gray-300 text-lg">Active Collaborations</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 text-center">
                <div className="text-6xl mb-4">💰</div>
                <p className="text-4xl font-black text-yellow-400 mb-2">$127K</p>
                <p className="text-gray-300 text-lg">Total Earned</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 text-center">
                <div className="text-6xl mb-4">📈</div>
                <p className="text-4xl font-black text-blue-400 mb-2">94%</p>
                <p className="text-gray-300 text-lg">Avg Cultural Fit</p>
              </div>
            </div>

            <div className="p-12 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50">
              <h3 className="text-3xl font-bold text-white mb-8 text-center">Cultural Impact Over Time</h3>
              <div className="h-64 bg-gray-800/30 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400 text-xl">Analytics visualization would go here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageCenterTemplateUI 