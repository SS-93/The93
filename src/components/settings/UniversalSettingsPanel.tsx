import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHostPrivileges } from '../../hooks/useHostPrivileges'
import HostAccessRequest from './HostAccessRequest'
import MediaIDSettings from './MediaIDSettings'
import ProfileSettings from './ProfileSettings'
import NotificationSettings from './NotificationSettings'
import { supabase } from '../../lib/supabaseClient'

interface SettingsTab {
  id: string
  name: string
  icon: React.ReactNode
  component: React.ComponentType<any>
  roles?: string[]
}

const UniversalSettingsPanel: React.FC = () => {
  const { user } = useAuth()
  const { hostPrivileges, hasHostPrivileges, loading: hostLoading } = useHostPrivileges()
  const [activeTab, setActiveTab] = useState('profile')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const settingsTabs: SettingsTab[] = [
    {
      id: 'profile',
      name: 'Profile & Account',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      component: ProfileSettings
    },
    {
      id: 'host-access',
      name: 'Host Privileges',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
        </svg>
      ),
      component: HostAccessRequest
    },
    {
      id: 'mediaid',
      name: 'MediaID & Privacy',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ),
      component: MediaIDSettings
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      ),
      component: NotificationSettings
    }
  ]

  // Filter tabs based on user role and access
  const availableTabs = settingsTabs.filter(tab => {
    if (tab.roles && userProfile?.role) {
      return tab.roles.includes(userProfile.role)
    }
    return true
  })

  if (loading || hostLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  const ActiveComponent = availableTabs.find(tab => tab.id === activeTab)?.component || ProfileSettings

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 mt-1">Manage your account, privacy, and preferences</p>
            </div>
            <a 
              href="/dashboard" 
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-accent-yellow text-black font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                  {tab.id === 'host-access' && hasHostPrivileges && (
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-auto"></div>
                  )}
                </button>
              ))}
            </nav>

            {/* User Info Card */}
            <div className="mt-8 glass border border-gray-700 p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-yellow rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {userProfile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userProfile?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {userProfile?.role || 'fan'}
                  </p>
                </div>
              </div>
              
              {hasHostPrivileges && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-medium">Event Host</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 capitalize">{hostPrivileges?.tier}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="glass border border-gray-700 rounded-xl p-6">
              <ActiveComponent 
                user={user}
                profile={userProfile}
                hostPrivileges={hostPrivileges}
                hasHostPrivileges={hasHostPrivileges}
                onProfileUpdate={fetchUserProfile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UniversalSettingsPanel
