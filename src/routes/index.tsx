import React from 'react'

const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center max-w-4xl mx-auto p-8">
      <h1 className="text-6xl font-black bg-gradient-to-r from-accent-yellow via-white to-accent-yellow bg-clip-text text-transparent mb-6">
        Bucket & MediaID
      </h1>
      <p className="text-2xl text-gray-400 mb-12">
        The underground's home for exclusive content and privacy-first brand collaboration
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Fans</h3>
          <p className="text-gray-400 mb-6">Discover underground artists and unlock exclusive content</p>
          <a href="/welcome" className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors inline-block">
            Fan Login
          </a>
        </div>
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Artists</h3>
          <p className="text-gray-400 mb-6">Monetize your work with daily drops and subscriber tiers</p>
          <a href="/artist/login" className="bg-green-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-colors inline-block">
            Artist Portal
          </a>
        </div>
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Brands</h3>
          <p className="text-gray-400 mb-6">Connect with engaged communities through MediaID</p>
          <a href="/brand/login" className="bg-blue-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors inline-block">
            Brand Portal
          </a>
        </div>
        <div className="glass p-8 rounded-2xl border border-purple-200/20">
          <h3 className="text-2xl font-bold text-purple-400 mb-4">For Developers</h3>
          <p className="text-gray-400 mb-6">Build privacy-first experiences with MediaID APIs</p>
          <a href="/developer/login" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-colors inline-block">
            Developer Portal
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <a href="/catalog" className="glass border border-white/20 px-8 py-4 rounded-xl font-bold hover:border-accent-yellow/50 transition-colors">
            Explore Artists
          </a>
          <a href="/welcome" className="glass border border-white/20 px-8 py-4 rounded-xl font-bold hover:border-accent-yellow/50 transition-colors">
            General Login
          </a>
        </div>
        
        <div className="text-sm text-gray-500">
          Demo Links: 
          <a href="/bucket-demo" className="text-accent-yellow hover:underline ml-2">Bucket Demo</a> |
          <a href="/locker-demo" className="text-accent-yellow hover:underline ml-2">Locker Demo</a> |
          <a href="/BTI" className="text-accent-yellow hover:underline ml-2">BTI Artist</a> |
          <a href="/test" className="text-accent-yellow hover:underline ml-2">🧪 Test Dashboard</a>
        </div>
      </div>
    </div>
  </div>
)

export default LandingPage 