import React, { useState } from 'react'
import { enableVotingOnAllEvents, getVotingEnabledEvents } from '../../lib/enable-voting'

interface Event {
  id: string
  title: string
  status: string
  shareable_code: string
  score_template_id?: string
  created_at: string
}

const EnableVotingTool: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleEnableVoting = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const result = await enableVotingOnAllEvents()

    if (result.success) {
      setEvents(result.events || [])
      setMessage(result.message || 'Voting enabled successfully!')
    } else {
      setError(result.error?.toString() || 'Failed to enable voting')
    }

    setLoading(false)
  }

  const handleRefreshEvents = async () => {
    setLoading(true)
    const result = await getVotingEnabledEvents()

    if (result.success) {
      setEvents(result.events || [])
      setMessage(result.message || 'Events refreshed')
    } else {
      setError(result.error?.toString() || 'Failed to fetch events')
    }

    setLoading(false)
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-accent-yellow mb-6">
          🗳️ Enable Voting on Events
        </h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleEnableVoting}
            disabled={loading}
            className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 disabled:opacity-50"
          >
            {loading ? '⏳ Processing...' : '🚀 Enable Voting on All Events'}
          </button>

          <button
            onClick={handleRefreshEvents}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 ml-4"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh Events'}
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 mb-6">
            <p className="text-green-400">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Events List */}
        {events.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              📋 Voting-Enabled Events ({events.length})
            </h2>

            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-gray-400 text-sm">
                        Code: <span className="font-mono text-accent-yellow">{event.shareable_code}</span>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Status: <span className="text-green-400">{event.status}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full mb-2">
                        🎯 Ready for Voting
                      </div>
                    </div>
                  </div>

                  {/* Voting URLs */}
                  <div className="mt-4 p-3 bg-gray-600 rounded">
                    <p className="text-xs text-gray-300 mb-2">📱 Voting URLs:</p>
                    <div className="space-y-1 text-xs font-mono">
                      <div>
                        <span className="text-accent-yellow">SMS Style:</span>{' '}
                        <span className="text-blue-300">/events/sms/{event.shareable_code}</span>
                      </div>
                      <div>
                        <span className="text-accent-yellow">Streamlined:</span>{' '}
                        <span className="text-blue-300">/events/vote/{event.shareable_code}</span>
                      </div>
                      <div>
                        <span className="text-accent-yellow">Legacy Cards:</span>{' '}
                        <span className="text-blue-300">/events/vote-cards/{event.shareable_code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">📝 Instructions</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Click "Enable Voting" to update all draft events to published status</p>
            <p>• Events will be linked to the default "Music Performance" scoring template</p>
            <p>• Shareable codes allow direct access to voting interfaces</p>
            <p>• Multiple voting interfaces are available for different user preferences</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnableVotingTool