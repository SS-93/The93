import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import FanDashboard from './FanDashboard'
import ArtistDashboardTemplateUI from './ArtistDashboardTemplateUI'
import BrandDashboardTemplateUI from './BrandDashboardTemplateUI'
import DeveloperDashboard from './DeveloperDashboard'
import OnboardingFlow from './OnboardingFlow'
import UserCatalog from './UserCatalog'
import BucketTemplateUI from './BucketTemplateUI'
import LockerDemo from '../routes/locker-demo'
import BucketDemo from '../routes/bucket-demo'
import AudioProcessingDashboard from './AudioProcessingDashboard'
import GlobalContentTest from './GlobalContentTest'
import ListeningHistoryDebug from './ListeningHistoryDebug'

type ComponentType = 
  | 'landing'
  | 'fan-dashboard' 
  | 'artist-dashboard' 
  | 'brand-dashboard' 
  | 'developer-dashboard'
  | 'onboarding'
  | 'user-catalog'
  | 'bucket-ui'
  | 'locker-demo'
  | 'bucket-demo'
  | 'auth-flows'
  | 'audio-processing'
  | 'global-content-test'
  | 'listening-history-debug'

const TestDashboard: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<ComponentType>('landing')
  const [mockUserRole, setMockUserRole] = useState<'fan' | 'artist' | 'brand' | 'developer'>('fan')

  const mockBTIContent = [
    {
      id: '1',
      name: "LOYALTY - KENDRICK.MP3",
      type: 'audio' as const,
      size: '12MB',
      uploadDate: '2024-08-06T07:04:00Z',
      downloadUrl: '/demo-audio.mp3',
      isLocked: false,
      metadata: { duration: '4:15', artist: 'Kendrick Lamar', album: 'DAMN.' }
    },
    {
      id: '2',
      name: "DNA - KENDRICK.MP3",
      type: 'audio' as const,
      size: '10MB',
      uploadDate: '2024-08-02T06:42:00Z',
      downloadUrl: '/demo-audio-2.mp3',
      isLocked: true,
      metadata: { duration: '3:05', artist: 'Kendrick Lamar', album: 'DAMN.' }
    }
  ]

  const handleRoleSwitch = (role: 'fan' | 'artist' | 'brand' | 'developer') => {
    setMockUserRole(role)
  }

  const ComponentSelector = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">🧪 Test Dashboard - All Components</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[
          { id: 'landing', label: '🏠 Landing', color: 'bg-gray-600' },
          { id: 'fan-dashboard', label: '🎧 Fan Dashboard', color: 'bg-yellow-600' },
          { id: 'artist-dashboard', label: '🎤 Artist Dashboard', color: 'bg-green-600' },
          { id: 'brand-dashboard', label: '🏢 Brand Dashboard', color: 'bg-blue-600' },
          { id: 'developer-dashboard', label: '⚡ Developer Dashboard', color: 'bg-purple-600' },
          { id: 'onboarding', label: '🚀 Onboarding Flow', color: 'bg-orange-600' },
          { id: 'user-catalog', label: '📚 User Catalog', color: 'bg-pink-600' },
          { id: 'bucket-ui', label: '🪣 Bucket UI', color: 'bg-indigo-600' },
          { id: 'locker-demo', label: '🔒 Locker Demo', color: 'bg-red-600' },
          { id: 'bucket-demo', label: '🎵 Bucket Demo', color: 'bg-teal-600' },
          { id: 'auth-flows', label: '🔑 Auth Flows', color: 'bg-cyan-600' },
          { id: 'audio-processing', label: '🎼 Audio Processing', color: 'bg-amber-600' },
          { id: 'global-content-test', label: '🌐 Global Content Test', color: 'bg-emerald-600' },
          { id: 'listening-history-debug', label: '🕐 Listening History Debug', color: 'bg-green-600' }
        ].map((component) => (
          <button
            key={component.id}
            onClick={() => setActiveComponent(component.id as ComponentType)}
            className={`p-4 rounded-xl text-white font-medium transition-all hover:scale-105 ${
              activeComponent === component.id 
                ? `${component.color} ring-2 ring-white` 
                : `${component.color}/70 hover:${component.color}`
            }`}
          >
            {component.label}
          </button>
        ))}
      </div>

      {/* Role Switcher */}
      <div className="flex items-center space-x-4 mb-6">
        <span className="text-gray-300 font-medium">Mock User Role:</span>
        {['fan', 'artist', 'brand', 'developer'].map((role) => (
          <button
            key={role}
            onClick={() => setMockUserRole(role as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mockUserRole === role
                ? 'bg-accent-yellow text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      {/* Quick Links */}
      <div className="border-t border-gray-600 pt-4">
        <p className="text-gray-400 text-sm mb-3">Quick External Links:</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs">
            Home
          </Link>
          <Link to="/welcome" className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs">
            Welcome
          </Link>
          <Link to="/catalog" className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs">
            Catalog
          </Link>
          <Link to="/artist/login" className="px-3 py-1 bg-green-700 text-white rounded-lg hover:bg-green-600 text-xs">
            Artist Login
          </Link>
          <Link to="/brand/login" className="px-3 py-1 bg-blue-700 text-white rounded-lg hover:bg-blue-600 text-xs">
            Brand Login
          </Link>
          <Link to="/developer/login" className="px-3 py-1 bg-purple-700 text-white rounded-lg hover:bg-purple-600 text-xs">
            Developer Login
          </Link>
        </div>
      </div>
    </div>
  )

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'landing':
        return (
          <div className="text-center p-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl">
            <h1 className="text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-accent-yellow via-white to-accent-yellow bg-clip-text text-transparent">
                Bucket & MediaID
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">Test Environment - All Components Available</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-accent-yellow mb-2">🎧 Fan Experience</h3>
                <p className="text-gray-400 text-sm">Discover artists, unlock content, subscribe to favorites</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-green-400 mb-2">🎤 Artist Tools</h3>
                <p className="text-gray-400 text-sm">Upload content, track revenue, engage with fans</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-blue-400 mb-2">🏢 Brand Portal</h3>
                <p className="text-gray-400 text-sm">Create campaigns, target audiences, measure impact</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-purple-400 mb-2">⚡ Developer API</h3>
                <p className="text-gray-400 text-sm">Build integrations, manage OAuth apps, access MediaID</p>
              </div>
            </div>
          </div>
        )

      case 'fan-dashboard':
        return <FanDashboard userRole={mockUserRole} onRoleSwitch={handleRoleSwitch} />

      case 'artist-dashboard':
        return <ArtistDashboardTemplateUI userRole={mockUserRole} onRoleSwitch={handleRoleSwitch} />

      case 'brand-dashboard':
        return <BrandDashboardTemplateUI userRole={mockUserRole} onRoleSwitch={handleRoleSwitch} />

      case 'developer-dashboard':
        return <DeveloperDashboard userRole={mockUserRole} onRoleSwitch={handleRoleSwitch} />

      case 'onboarding':
        return (
          <OnboardingFlow 
            onComplete={() => {
              alert('Onboarding completed! (Test mode)')
              setActiveComponent('fan-dashboard')
            }} 
          />
        )

      case 'user-catalog':
        return <UserCatalog userRole={mockUserRole} onRoleSwitch={handleRoleSwitch} />

      case 'bucket-ui':
        return (
          <BucketTemplateUI 
            userRole="fan" 
            artistName="Test Artist" 
            contentItems={mockBTIContent}
            onDownload={(item) => console.log('Download:', item)}
          />
        )

      case 'locker-demo':
        return <LockerDemo />

      case 'bucket-demo':
        return <BucketDemo />

      case 'auth-flows':
        return (
          <div className="space-y-8">
            <div className="bg-gray-800/50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">🔑 Authentication Flows</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  to="/welcome" 
                  className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <h4 className="font-semibold text-white">General Welcome</h4>
                  <p className="text-gray-400 text-sm">Main welcome page with sign up/in options</p>
                </Link>
                <Link 
                  to="/artist/login" 
                  className="block p-4 bg-green-700 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <h4 className="font-semibold text-white">🎤 Artist Login</h4>
                  <p className="text-gray-400 text-sm">Dedicated artist authentication flow</p>
                </Link>
                <Link 
                  to="/brand/login" 
                  className="block p-4 bg-blue-700 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <h4 className="font-semibold text-white">🏢 Brand Login</h4>
                  <p className="text-gray-400 text-sm">Brand marketer authentication portal</p>
                </Link>
                <Link 
                  to="/developer/login" 
                  className="block p-4 bg-purple-700 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <h4 className="font-semibold text-white">⚡ Developer Login</h4>
                  <p className="text-gray-400 text-sm">MediaID developer portal access</p>
                </Link>
              </div>
            </div>
          </div>
        )

      case 'audio-processing':
        return <AudioProcessingDashboard />

      case 'global-content-test':
        return <GlobalContentTest />

      case 'listening-history-debug':
        return <ListeningHistoryDebug />

      default:
        return <div className="text-white">Component not found</div>
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <ComponentSelector />
      <div className="relative">
        {renderActiveComponent()}
      </div>
    </div>
  )
}

export default TestDashboard 