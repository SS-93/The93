import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface ProfileSettingsProps {
  user: any
  profile: any
  hostPrivileges?: any
  hasHostPrivileges?: boolean
  onProfileUpdate: () => void
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, profile, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    email: user?.email || ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name.trim()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      onProfileUpdate()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Profile & Account</h2>
        <p className="text-gray-400">Manage your personal information and account settings</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-yellow"
              placeholder="Enter your display name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-yellow"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white mb-2">Account Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Role:</span>
              <span className="text-white ml-2 capitalize">{profile?.role}</span>
            </div>
            <div>
              <span className="text-gray-400">Joined:</span>
              <span className="text-white ml-2">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent-yellow text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileSettings
