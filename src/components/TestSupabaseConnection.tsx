import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const TestSupabaseConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' })
      
      if (error) {
        // If the table doesn't exist, that's still a valid connection
        if (error.message.includes('relation "profiles" does not exist')) {
          setConnectionStatus('connected')
          setError('Connected! Database tables need to be created.')
        } else {
          throw error
        }
      } else {
        setConnectionStatus('connected')
        setError('')
      }
    } catch (err: any) {
      setConnectionStatus('error')
      setError(err.message || 'Connection failed')
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'testing': return 'text-yellow-400'
      case 'connected': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing': return '🔄'
      case 'connected': return '✅'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className="p-6 bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 max-w-md">
      <h3 className="text-xl font-bold text-white mb-4">Supabase Connection Test</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {connectionStatus === 'testing' && 'Testing connection...'}
            {connectionStatus === 'connected' && 'Connected successfully!'}
            {connectionStatus === 'error' && 'Connection failed'}
          </span>
        </div>
        
        {error && (
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        )}
        
        <div className="text-sm text-gray-400 space-y-1">
          <p>URL: {process.env.REACT_APP_SUPABASE_URL || 'Not set'}</p>
          <p>Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set ✓' : 'Not set ❌'}</p>
        </div>
        
        <button
          onClick={testConnection}
          className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Test Again
        </button>
      </div>
    </div>
  )
}

export default TestSupabaseConnection 