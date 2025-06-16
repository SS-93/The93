import React, { useState, useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import stripePromise from './lib/stripeClient'
import { AuthProvider } from './hooks/useAuth'
import WelcomePage from './components/auth/WelcomePage'
import BucketDemo from './routes/bucket-demo'
import LockerDemo from './routes/locker-demo'
import BucketTemplateUI from './components/BucketTemplateUI'
import ArtistDashboardTemplateUI from './components/ArtistDashboardTemplateUI'
import BrandDashboardTemplateUI from './components/BrandDashboardTemplateUI'
import CulturalCollabPortal from './components/CulturalCollabPortal'
import ErrorBoundary from './components/ErrorBoundary'
import { Analytics } from "@vercel/analytics/react"

// Test Component
const TestSupabaseConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const { supabase } = await import('./lib/supabaseClient')
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' })
      
      if (error) {
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
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
    </div>
  )
}

// Mock data for the BTI route
const mockBTIContent = [
  {
    id: '1',
    name: "LOYALTY - KENDRICK.MP3",
    type: 'audio' as const,
    size: '12MB',
    uploadDate: '2024-08-06T07:04:00Z',
    downloadUrl: '/demo-audio.mp3',
    isLocked: false,
    metadata: { duration: '4:15', artist: 'Kendrick Lamar', album: 'DAMN.' }
  },
  {
    id: '2',
    name: "DNA - KENDRICK.MP3",
    type: 'audio' as const,
    size: '10MB',
    uploadDate: '2024-08-02T06:42:00Z',
    downloadUrl: '/demo-audio-2.mp3',
    isLocked: true,
    metadata: { duration: '3:05', artist: 'Kendrick Lamar', album: 'DAMN.' }
  },
  {
    id: '3',
    name: "HUMBLE - KENDRICK.MP3",
    type: 'audio' as const,
    size: '9MB',
    uploadDate: '2024-08-06T07:04:00Z',
    downloadUrl: '/demo-audio-3.mp3',
    isLocked: false,
    metadata: { duration: '2:57', artist: 'Kendrick Lamar', album: 'DAMN.' }
  }
]

// Temporary placeholder component for authenticated routes
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-gray-400 mb-8">Welcome to your {title}!</p>
      
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        <a href="/test-connection" className="p-4 bg-blue-800 rounded-xl hover:bg-blue-700 transition-colors">
          <div className="text-2xl mb-2">🔌</div>
          <div className="text-sm font-medium">Test Supabase</div>
        </a>
        <a href="/bucket-demo" className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-sm font-medium">Bucket Demo</div>
        </a>
        <a href="/locker-demo" className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-sm font-medium">Locker Demo</div>
        </a>
        <a href="/cultural-portal" className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-2xl mb-2">🤝</div>
          <div className="text-sm font-medium">Cultural Portal</div>
        </a>
        <a href="/BTI" className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-2xl mb-2">🎵</div>
          <div className="text-sm font-medium">BTI Artist</div>
        </a>
      </div>
    </div>
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <WelcomePage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/test-connection',
    element: <TestSupabaseConnection />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/bucket-demo',
    element: <BucketDemo />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/locker-demo',
    element: <LockerDemo />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/cultural-portal',
    element: <CulturalCollabPortal userType="artist" userName="Luna Starlight" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/BTI',
    element: (
      <BucketTemplateUI 
        userRole="fan" 
        artistName="Kendrick Lamar" 
        contentItems={mockBTIContent}
        onDownload={(item) => console.log('Download:', item)}
      />
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/fans/dashboard',
    element: <PlaceholderPage title="Fan Dashboard" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/artists/dashboard',
    element: <ArtistDashboardTemplateUI />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/brands/dashboard',
    element: <BrandDashboardTemplateUI />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/public',
    element: <PlaceholderPage title="Public Dashboard" />,
    errorElement: <ErrorBoundary />
  },
  // Legacy routes for demo purposes
  {
    path: '/login',
    element: <WelcomePage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/signup',
    element: <WelcomePage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/onboarding',
    element: <PlaceholderPage title="Onboarding Complete" />,
    errorElement: <ErrorBoundary />
  }
])

function App() {
  return (
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <div className="min-h-screen bg-black text-white">
          <RouterProvider router={router} />
          <Analytics />
        </div>
      </AuthProvider>
    </Elements>
  )
}

export default App
