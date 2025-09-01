import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CountdownTimer from './CountdownTimer'

interface HostAccessRequestProps {
  user: any
  profile: any
  hostPrivileges: any
  hasHostPrivileges: boolean
  onProfileUpdate: () => void
}

interface AccessRequest {
  id: string
  requested_tier: string
  justification: string
  status: string
  requested_at: string
  expires_at: string
  processed_at?: string
  admin_notes?: string
}

const HostAccessRequest: React.FC<HostAccessRequestProps> = ({
  user,
  profile,
  hostPrivileges,
  hasHostPrivileges,
  onProfileUpdate
}) => {
  const [activeRequest, setActiveRequest] = useState<AccessRequest | null>(null)
  const [requestHistory, setRequestHistory] = useState<AccessRequest[]>([])
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [formData, setFormData] = useState({
    tier: 'basic',
    justification: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchAccessRequests = useCallback(async () => {
    try {
      const { data: requests, error } = await supabase
        .from('host_access_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const pending = requests?.find(r => r.status === 'pending' && new Date(r.expires_at) > new Date())
      setActiveRequest(pending || null)
      setRequestHistory(requests || [])
    } catch (error) {
      console.error('Error fetching access requests:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchAccessRequests()
    }
  }, [user, fetchAccessRequests])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('host_access_requests')
        .insert({
          user_id: user.id,
          requested_tier: formData.tier,
          justification: formData.justification.trim()
        })
        .select()
        .single()

      if (error) throw error

      setActiveRequest(data)
      setShowRequestForm(false)
      setFormData({ tier: 'basic', justification: '' })
      await fetchAccessRequests()
    } catch (error) {
      console.error('Error submitting request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const tierFeatures: Record<string, {
    name: string
    maxEvents: number
    features: string[]
    color: string
  }> = {
    basic: {
      name: 'Basic Host',
      maxEvents: 3,
      features: [
        'Create up to 3 concurrent events',
        'SMS & QR code voting',
        'Basic analytics dashboard',
        'Standard event templates',
        'Community support'
      ],
      color: 'blue'
    },
    premium: {
      name: 'Premium Host',
      maxEvents: 25,
      features: [
        'Create up to 25 concurrent events',
        'Advanced voting configurations',
        'Premium analytics & insights',
        'Custom branding & themes',
        'Priority support',
        'API access & webhooks',
        'Advanced audience targeting'
      ],
      color: 'purple'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Host Privileges</h2>
        <p className="text-gray-400">
          Request access to create and manage events on the Buckets.Events platform
        </p>
      </div>

      {/* Current Status */}
      {hasHostPrivileges ? (
        <div className="glass border border-green-500/30 bg-green-500/5 p-6 rounded-xl">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-400 mb-1">
                Host Access Approved
              </h3>
              <p className="text-gray-300 mb-3">
                You have {tierFeatures[hostPrivileges?.tier]?.name || 'Host'} privileges
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">Max Concurrent Events</p>
                  <p className="text-white font-semibold">{hostPrivileges?.max_concurrent_events || 0}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">Tier</p>
                  <p className="text-white font-semibold capitalize">{hostPrivileges?.tier}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeRequest ? (
        <div className="glass border border-yellow-500/30 bg-yellow-500/5 p-6 rounded-xl">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-400 mb-1">
                Request Under Review
              </h3>
              <p className="text-gray-300 mb-3">
                Your {tierFeatures[activeRequest.requested_tier]?.name} request is being processed
              </p>
              
              <CountdownTimer 
                targetDate={activeRequest.expires_at}
                onExpire={() => fetchAccessRequests()}
              />
              
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Your justification:</p>
                <p className="text-gray-300 text-sm">{activeRequest.justification || 'No justification provided'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass border border-gray-600 p-6 rounded-xl">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Host Access</h3>
            <p className="text-gray-400 mb-4">
              Request host privileges to create and manage events
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="bg-accent-yellow text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Request Host Access
            </button>
          </div>
        </div>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <div className="glass border border-gray-600 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Request Host Access</h3>
          
          <form onSubmit={handleSubmitRequest} className="space-y-6">
            {/* Tier Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Select Host Tier
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(tierFeatures).map(([key, tier]) => (
                  <div
                    key={key}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      formData.tier === key
                        ? 'border-accent-yellow bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, tier: key }))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{tier.name}</h4>
                      <input
                        type="radio"
                        name="tier"
                        value={key}
                        checked={formData.tier === key}
                        onChange={() => setFormData(prev => ({ ...prev, tier: key }))}
                        className="w-4 h-4 text-accent-yellow bg-gray-700 border-gray-600 focus:ring-accent-yellow focus:ring-2"
                      />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      Up to {tier.maxEvents} concurrent events
                    </p>
                    <ul className="space-y-1">
                      {tier.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-xs text-gray-500 flex items-center">
                          <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Why do you need host access? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                placeholder="Describe your event plans, audience size, and why you need hosting privileges..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-yellow"
                required
                minLength={50}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.justification.length}/500 characters (minimum 50)
              </p>
            </div>

            {/* 24-hour Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-blue-400">24-Hour Review Process</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Your request will be reviewed within 24 hours. You'll receive an email notification when approved or if additional information is needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting || formData.justification.length < 50}
                className="flex-1 bg-accent-yellow text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request History */}
      {requestHistory.length > 0 && (
        <div className="glass border border-gray-600 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Request History</h3>
          <div className="space-y-3">
            {requestHistory.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">
                    {tierFeatures[request.requested_tier]?.name} Access
                  </p>
                  <p className="text-xs text-gray-400">
                    Requested {new Date(request.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    request.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HostAccessRequest
