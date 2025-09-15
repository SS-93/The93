import React, { useState } from 'react'
import { testGlobalContentAccess, testUserTracks } from '../utils/testGlobalContent'

const GlobalContentTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runGlobalContentTest = async () => {
    setIsLoading(true)
    setTestResults(null)
    
    try {
      console.log('🚀 Starting Global Content Test...')
      const result = await testGlobalContentAccess()
      setTestResults(result)
    } catch (error) {
      setTestResults({ success: false, error: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const runUserTracksTest = async () => {
    setIsLoading(true)
    setTestResults(null)
    
    try {
      console.log('🚀 Starting User Tracks Test...')
      const result = await testUserTracks()
      setTestResults(result)
    } catch (error) {
      setTestResults({ success: false, error: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">🌐 Global Content Service Test</h1>
          <p className="text-gray-400">
            Test the global music content backend service and streaming functionality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">📡 Streaming Tracks Test</h2>
            <p className="text-gray-400 mb-4">
              Test fetching streaming tracks from global-music-content bucket
            </p>
            <button
              onClick={runGlobalContentTest}
              disabled={isLoading}
              className="w-full bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Run Streaming Test'}
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">👤 User Tracks Test</h2>
            <p className="text-gray-400 mb-4">
              Test fetching tracks from specific user (dmstest49@gmail)
            </p>
            <button
              onClick={runUserTracksTest}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Run User Test'}
            </button>
          </div>
        </div>

        {/* Test Results Display */}
        {testResults && (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">📊 Test Results</h3>
            
            {testResults.success ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-400">
                  <span>✅</span>
                  <span className="font-semibold">Test Passed</span>
                </div>
                
                {testResults.tracks && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Found {testResults.tracks.length} tracks:
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {testResults.tracks.slice(0, 5).map((track: any, index: number) => (
                        <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-medium">{track.title || track.name}</p>
                              <p className="text-gray-400 text-sm">
                                {track.artist || track.artist_profiles?.artist_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">ID: {track.id}</p>
                              {track.audioUrl && (
                                <p className="text-xs text-green-400">Stream URL ✅</p>
                              )}
                              {track.file_path && (
                                <p className="text-xs text-blue-400">File: {track.file_path}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {testResults.tracks.length > 5 && (
                        <p className="text-gray-400 text-sm text-center">
                          ... and {testResults.tracks.length - 5} more tracks
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-red-400">
                  <span>❌</span>
                  <span className="font-semibold">Test Failed</span>
                </div>
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                  <p className="text-red-400 text-sm">
                    {testResults.error?.message || testResults.error || 'Unknown error'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                💡 Check browser console for detailed logs
              </p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 bg-gray-800/20 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3">🔗 Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a 
              href="/discover" 
              className="block bg-gray-700/50 p-3 rounded-lg hover:bg-gray-600/50 transition-colors text-center"
            >
              <span className="text-white">🎵 Discovery Page</span>
            </a>
            <a 
              href="/player" 
              className="block bg-gray-700/50 p-3 rounded-lg hover:bg-gray-600/50 transition-colors text-center"
            >
              <span className="text-white">🎧 Player Page</span>
            </a>
            <a 
              href="/test" 
              className="block bg-gray-700/50 p-3 rounded-lg hover:bg-gray-600/50 transition-colors text-center"
            >
              <span className="text-white">🧪 Test Dashboard</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalContentTest