// Debug component for listening history system
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { listeningHistoryService, trackPlay } from '../lib/listeningHistory'

const ListeningHistoryDebug: React.FC = () => {
  const { user } = useAuth()
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [historyCount, setHistoryCount] = useState<number>(0)
  const [sessionCount, setSessionCount] = useState<number>(0)
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkTables()
  }, [user])

  const checkTables = async () => {
    if (!user) return

    try {
      // Check if listening_history table exists
      const { data, error } = await supabase
        .from('listening_history')
        .select('count', { count: 'exact' })
        .limit(0)

      if (error) {
        console.error('Table check error:', error)
        setTableExists(false)
      } else {
        setTableExists(true)
        setHistoryCount(data?.length || 0)
      }

      // Check sessions table
      const { data: sessionData, error: sessionError } = await supabase
        .from('listening_sessions')
        .select('count', { count: 'exact' })
        .limit(0)

      if (!sessionError) {
        setSessionCount(sessionData?.length || 0)
      }

    } catch (error) {
      console.error('Database check failed:', error)
      setTableExists(false)
    }
  }

  const testTracking = async () => {
    if (!user) return

    setLoading(true)
    setTestResult('')

    try {
      // Test tracking a play event
      await trackPlay({
        userId: user.id,
        contentId: '550e8400-e29b-41d4-a716-446655440000', // Use proper UUID format
        contentTitle: 'Test Track',
        contentArtist: 'Test Artist',
        contentType: 'music',
        durationSeconds: 30,
        totalDuration: 180,
        context: 'debug_test'
      })

      setTestResult('✅ Successfully tracked test play event')
      await checkTables() // Refresh counts
    } catch (error: any) {
      console.error('Test tracking failed:', error)
      setTestResult(`❌ Failed to track: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getHistoryData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const history = await listeningHistoryService.getListeningHistory(user.id)
      console.log('📊 Listening History Data:', history)
      setTestResult(`📊 Found ${history.length} history entries (check console for details)`)
    } catch (error: any) {
      console.error('Failed to get history:', error)
      setTestResult(`❌ Failed to get history: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-4">🐛 Listening History Debug</h3>
        <p className="text-gray-400">Please sign in to test listening history</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-4">🐛 Listening History Debug</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded">
            <h4 className="font-semibold text-white">Database Status</h4>
            <p className={`text-sm mt-2 ${tableExists === true ? 'text-green-400' : tableExists === false ? 'text-red-400' : 'text-yellow-400'}`}>
              {tableExists === true ? '✅ Tables exist' : tableExists === false ? '❌ Tables missing' : '⏳ Checking...'}
            </p>
          </div>
          
          <div className="p-4 bg-gray-800 rounded">
            <h4 className="font-semibold text-white">Data Counts</h4>
            <p className="text-sm text-gray-300 mt-2">
              History: {historyCount} | Sessions: {sessionCount}
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={testTracking}
            disabled={loading || !tableExists}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Track Play'}
          </button>
          
          <button
            onClick={getHistoryData}
            disabled={loading || !tableExists}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get History Data'}
          </button>
          
          <button
            onClick={checkTables}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Refresh Status
          </button>
        </div>

        {testResult && (
          <div className="p-3 bg-gray-800 rounded text-sm">
            <pre className="text-gray-300 whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}

        {!tableExists && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded">
            <h4 className="font-semibold text-red-400 mb-2">Missing Database Tables</h4>
            <p className="text-sm text-red-300 mb-3">
              The listening history tables don't exist. Run these SQL commands in your Supabase SQL editor:
            </p>
            <pre className="text-xs bg-gray-900 p-3 rounded overflow-x-auto text-green-400">
{`-- Create listening_sessions table
CREATE TABLE listening_sessions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  device_type text NOT NULL,
  device_name text,
  total_tracks_played integer DEFAULT 0,
  total_duration_seconds integer DEFAULT 0,
  primary_content_type text DEFAULT 'music',
  context text DEFAULT 'general'
);

-- Create listening_history table  
CREATE TABLE listening_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  media_id_profile_id text,
  content_id text NOT NULL,
  content_type text NOT NULL,
  content_title text NOT NULL,
  content_artist text,
  content_provider text,
  event_type text NOT NULL,
  event_context text,
  play_duration_seconds integer,
  total_duration_seconds integer,
  progress_percentage numeric,
  play_count integer DEFAULT 1,
  session_id text,
  device_type text,
  device_name text,
  explicit_content boolean DEFAULT false,
  artwork_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_listening_history_user_created ON listening_history(user_id, created_at DESC);
CREATE INDEX idx_listening_history_content ON listening_history(content_id);
CREATE INDEX idx_listening_sessions_user ON listening_sessions(user_id, session_start DESC);`}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default ListeningHistoryDebug