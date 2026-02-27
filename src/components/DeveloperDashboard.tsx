import React, { useState } from 'react'
import RoleManager from './RoleManager'

interface DeveloperApp {
  id: string
  name: string
  description: string
  clientId: string
  clientSecret: string
  redirectUris: string[]
  scopes: string[]
  status: 'active' | 'disabled' | 'pending'
  created: string
  lastUsed: string
  apiCalls: number
  users: number
}

interface APICall {
  timestamp: string
  endpoint: string
  method: string
  status: number
  responseTime: number
  userId?: string
}

interface DeveloperDashboardProps {
  userRole?: 'fan' | 'artist' | 'brand' | 'developer'
  onRoleSwitch?: (role: 'fan' | 'artist' | 'brand' | 'developer') => void
}

const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ 
  userRole = 'developer', 
  onRoleSwitch 
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateApp, setShowCreateApp] = useState(false)
  const [selectedApp, setSelectedApp] = useState<DeveloperApp | null>(null)

  // Mock data
  const mockApps: DeveloperApp[] = [
    {
      id: '1',
      name: 'Music Discovery App',
      description: 'Personalized music recommendations using MediaID preferences',
      clientId: 'mediaid_client_7f8e9d2c1b3a4f5e',
      clientSecret: 'mediaid_secret_***************',
      redirectUris: ['https://musicapp.com/callback', 'http://localhost:3000/callback'],
      scopes: ['media:read', 'preferences:read', 'events:write'],
      status: 'active',
      created: '2024-11-20',
      lastUsed: '2024-12-08',
      apiCalls: 15420,
      users: 342
    },
    {
      id: '2',
      name: 'Brand Analytics Platform',
      description: 'Audience insights and campaign optimization',
      clientId: 'mediaid_client_9a8b7c6d5e4f3g2h',
      clientSecret: 'mediaid_secret_***************',
      redirectUris: ['https://brandanalytics.io/auth'],
      scopes: ['analytics:read', 'campaigns:read'],
      status: 'active',
      created: '2024-10-15',
      lastUsed: '2024-12-07',
      apiCalls: 8934,
      users: 28
    }
  ]

  const mockApiCalls: APICall[] = [
    { timestamp: '2024-12-08 14:30:22', endpoint: '/api/v1/preferences', method: 'GET', status: 200, responseTime: 145 },
    { timestamp: '2024-12-08 14:29:18', endpoint: '/api/v1/oauth/token', method: 'POST', status: 200, responseTime: 89 },
    { timestamp: '2024-12-08 14:28:45', endpoint: '/api/v1/users/me', method: 'GET', status: 200, responseTime: 67 },
    { timestamp: '2024-12-08 14:27:12', endpoint: '/api/v1/events', method: 'POST', status: 201, responseTime: 234 },
    { timestamp: '2024-12-08 14:26:33', endpoint: '/api/v1/preferences', method: 'GET', status: 429, responseTime: 12 }
  ]

  const MetricCard = ({ title, value, subtitle, icon, color = 'purple' }: any) => (
    <div className="glass border border-gray-600/50 p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
  )

  const AppCard = ({ app }: { app: DeveloperApp }) => (
    <div className="glass border border-gray-600/50 p-6 rounded-xl hover:border-purple-400/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{app.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">{app.name}</h4>
            <p className="text-sm text-gray-400">{app.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          app.status === 'active' ? 'bg-green-500/20 text-green-400' :
          app.status === 'disabled' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {app.status}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{app.apiCalls.toLocaleString()}</p>
          <p className="text-xs text-gray-400">API Calls</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{app.users}</p>
          <p className="text-xs text-gray-400">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{app.scopes.length}</p>
          <p className="text-xs text-gray-400">Scopes</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-600">
        <div>
          <p className="text-xs text-gray-400">Client ID</p>
          <p className="text-sm font-mono text-gray-300">{app.clientId.substring(0, 20)}...</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedApp(app)}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
          >
            Manage
          </button>
          <button className="px-4 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm">
            Analytics
          </button>
        </div>
      </div>
    </div>
  )

  const CreateAppModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="glass border border-purple-200/20 p-8 rounded-2xl max-w-lg w-full">
        <h3 className="text-2xl font-bold text-white mb-6">Create New Application</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Application Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
              placeholder="My Awesome App"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none resize-none"
              placeholder="Brief description of your application..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Redirect URIs</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
              placeholder="https://yourapp.com/callback"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Required Scopes</label>
            <div className="grid grid-cols-2 gap-2">
              {['media:read', 'media:write', 'preferences:read', 'preferences:write', 'events:read', 'events:write', 'analytics:read'].map(scope => (
                <label key={scope} className="flex items-center space-x-2">
                  <input type="checkbox" className="text-purple-500 focus:ring-purple-400" />
                  <span className="text-sm text-gray-300">{scope}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={() => setShowCreateApp(false)}
            className="flex-1 px-6 py-3 bg-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-600/70 transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors">
            Create Application
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MediaID Developer Portal</h1>
                <p className="text-gray-400">Build privacy-first experiences</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <RoleManager currentRole={userRole} compact={true} />
              <button 
                onClick={() => setShowCreateApp(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors"
              >
                Create App
              </button>
              <a href="/" className="text-gray-400 hover:text-white transition-colors">
                ← Back to Bucket
              </a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 mt-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'applications', label: 'Applications' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'documentation', label: 'API Docs' },
              { id: 'webhooks', label: 'Webhooks' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-purple-400 text-purple-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="Active Applications"
                value="2"
                subtitle="All time"
                icon={<svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zM11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1z" /></svg>}
              />
              <MetricCard 
                title="API Calls (30d)"
                value="24.3K"
                subtitle="+12% vs last month"
                icon={<svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.5 4.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2v-2a.5.5 0 01.5-.5z" clipRule="evenodd" /></svg>}
                color="blue"
              />
              <MetricCard 
                title="Connected Users"
                value="370"
                subtitle="Active integrations"
                icon={<svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
                color="green"
              />
              <MetricCard 
                title="Revenue Share"
                value="$1,247"
                subtitle="This month"
                icon={<svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" /></svg>}
                color="yellow"
              />
            </div>

            {/* Recent Activity */}
            <div className="glass border border-gray-600/50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-6">Recent API Activity</h3>
              <div className="space-y-4">
                {mockApiCalls.map((call, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                    <div className="flex items-center space-x-4">
                      <span className={`w-3 h-3 rounded-full ${
                        call.status === 200 || call.status === 201 ? 'bg-green-400' :
                        call.status === 429 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{call.method} {call.endpoint}</p>
                        <p className="text-sm text-gray-400">{call.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{call.status}</p>
                      <p className="text-sm text-gray-400">{call.responseTime}ms</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Applications</h2>
              <button 
                onClick={() => setShowCreateApp(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors"
              >
                Create New App
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockApps.map(app => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documentation' && (
          <div className="glass border border-gray-600/50 p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-6">MediaID API Documentation</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-6">
                Build privacy-first applications with MediaID's powerful APIs. Access user preferences, 
                engagement data, and analytics while respecting user privacy controls.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-600/50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-3">Authentication</h4>
                  <p className="text-gray-300 text-sm mb-4">OAuth2 with PKCE for secure user authorization</p>
                  <code className="text-xs text-green-400 bg-gray-800/50 p-2 rounded block">
                    POST /oauth/authorize<br/>
                    POST /oauth/token
                  </code>
                </div>
                
                <div className="border border-gray-600/50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-3">User Preferences</h4>
                  <p className="text-gray-300 text-sm mb-4">Access user interests and privacy settings</p>
                  <code className="text-xs text-green-400 bg-gray-800/50 p-2 rounded block">
                    GET /api/v1/preferences<br/>
                    PUT /api/v1/preferences
                  </code>
                </div>
                
                <div className="border border-gray-600/50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-3">Events & Analytics</h4>
                  <p className="text-gray-300 text-sm mb-4">Track user interactions and engagement</p>
                  <code className="text-xs text-green-400 bg-gray-800/50 p-2 rounded block">
                    POST /api/v1/events<br/>
                    GET /api/v1/analytics
                  </code>
                </div>
                
                <div className="border border-gray-600/50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-3">Webhooks</h4>
                  <p className="text-gray-300 text-sm mb-4">Real-time notifications for permission changes</p>
                  <code className="text-xs text-green-400 bg-gray-800/50 p-2 rounded block">
                    preference.updated<br/>
                    permission.revoked
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateApp && <CreateAppModal />}
    </div>
  )
}

export default DeveloperDashboard 