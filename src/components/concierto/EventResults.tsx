import React from 'react'
import { useParams } from 'react-router-dom'

const EventResults: React.FC = () => {
  const { shareableCode } = useParams()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Event Results</h1>
          <p className="text-gray-400">Event: {shareableCode}</p>
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p>🚧 Coming Soon: Live results and analytics dashboard</p>
          <div className="mt-4 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <p className="text-sm mb-4">This will feature:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
              <ul className="space-y-1">
                <li>• Real-time vote leaderboard</li>
                <li>• Artist performance analytics</li>
                <li>• Fan engagement metrics</li>
              </ul>
              <ul className="space-y-1">
                <li>• Social sharing options</li>
                <li>• Follow-up campaign tools</li>
                <li>• Export data for CRM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventResults