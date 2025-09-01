import React, { useState } from 'react'

interface NotificationSettingsProps {
  user: any
  profile: any
  hostPrivileges?: any
  hasHostPrivileges?: boolean
  onProfileUpdate: () => void
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user, profile, onProfileUpdate }) => {
  const [settings, setSettings] = useState({
    event_invitations: true,
    voting_reminders: true,
    event_results: true,
    new_features: false,
    weekly_digest: true,
    marketing_updates: false,
    security_alerts: true
  })

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement notification settings save
    setTimeout(() => {
      setSaving(false)
    }, 1000)
  }

  const notificationTypes = [
    {
      key: 'event_invitations' as const,
      title: 'Event Invitations',
      description: 'Get notified when you\'re invited to participate in events',
      category: 'Events'
    },
    {
      key: 'voting_reminders' as const,
      title: 'Voting Reminders',
      description: 'Reminders when voting periods are about to end',
      category: 'Events'
    },
    {
      key: 'event_results' as const,
      title: 'Event Results',
      description: 'Notifications when event results are published',
      category: 'Events'
    },
    {
      key: 'new_features' as const,
      title: 'New Features',
      description: 'Updates about new platform features and improvements',
      category: 'Platform'
    },
    {
      key: 'weekly_digest' as const,
      title: 'Weekly Digest',
      description: 'Weekly summary of your activity and recommendations',
      category: 'Platform'
    },
    {
      key: 'marketing_updates' as const,
      title: 'Marketing Updates',
      description: 'Promotional content and special offers',
      category: 'Marketing'
    },
    {
      key: 'security_alerts' as const,
      title: 'Security Alerts',
      description: 'Important security and account-related notifications',
      category: 'Security'
    }
  ]

  const categories = ['Events', 'Platform', 'Marketing', 'Security']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Notification Preferences</h2>
        <p className="text-gray-400">Choose how and when you want to be notified</p>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{category}</h3>
            <div className="space-y-3">
              {notificationTypes
                .filter(type => type.category === category)
                .map((notificationType) => (
                  <div key={notificationType.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{notificationType.title}</h4>
                      <p className="text-sm text-gray-400">{notificationType.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[notificationType.key]}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          [notificationType.key]: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-yellow"></div>
                    </label>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-400">Email Delivery</h4>
            <p className="text-xs text-gray-400 mt-1">
              Notifications will be sent to {user?.email}. You can update your email address in Profile Settings.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent-yellow text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

export default NotificationSettings
