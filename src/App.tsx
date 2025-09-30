import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import stripePromise from './lib/stripeClient'
import { AuthProvider } from './hooks/useAuth'
import { AudioPlayerProvider } from './context/AudioPlayerContext'
import AppLayout from './components/AppLayout'
import PlayerPage from './components/player/PlayerPage'
import BucketDemo from './routes/bucket-demo'
import LockerDemo from './routes/locker-demo'
import BucketTemplateUI from './components/BucketTemplateUI'
import FanDashboard from './components/FanDashboard'
import UserCatalog from './components/UserCatalog'
import ArtistDashboardTemplateUI from './components/ArtistDashboardTemplateUI'
import BrandDashboardTemplateUI from './components/BrandDashboardTemplateUI'
import ErrorBoundary from './components/ErrorBoundary'
import { SmartRouteGuard } from './components/SmartRouteGuard'
import { AutoRouter } from './components/AutoRouter'
import OnboardingFlow from './components/OnboardingFlow'
import WelcomePage from './components/auth/WelcomePage'
import SignInForm from './components/auth/SignInForm'
import ResetPasswordForm from './components/auth/ResetPasswordForm'
import ArtistLogin from './components/auth/ArtistLogin'
import BrandLogin from './components/auth/BrandLogin'
import DeveloperLogin from './components/auth/DeveloperLogin'
import DeveloperDashboard from './components/DeveloperDashboard'
import TestDashboard from './components/TestDashboard'
import UniversalSettingsPanel from './components/settings/UniversalSettingsPanel'
import DedicatedUploadPage from './components/DedicatedUploadPage'
import ContentLibraryManager from './components/ContentLibraryManager'
import DiscoveryPage from './components/DiscoveryPage'
import ListeningHistoryPortal from './components/ListeningHistoryPortal'
import ConciertoRoutes from './components/concierto/ConciertoRoutes'
import HostAdminDashboard from './components/concierto/HostAdminDashboard'

// Mock data for the BTI route
const mockBTIContent = [
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: "LOYALTY - KENDRICK.MP3",
    type: 'audio' as const,
    size: '12MB',
    uploadDate: '2024-08-06T07:04:00Z',
    downloadUrl: '/demo-audio.mp3',
    isLocked: false,
    metadata: { duration: '4:15', artist: 'Kendrick Lamar', album: 'DAMN.' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: "DNA - KENDRICK.MP3",
    type: 'audio' as const,
    size: '10MB',
    uploadDate: '2024-08-02T06:42:00Z',
    downloadUrl: '/demo-audio-2.mp3',
    isLocked: true,
    metadata: { duration: '3:05', artist: 'Kendrick Lamar', album: 'DAMN.' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: "HUMBLE - KENDRICK.MP3",
    type: 'audio' as const,
    size: '9MB',
    uploadDate: '2024-08-06T07:04:00Z',
    downloadUrl: '/demo-audio-3.mp3',
    isLocked: false,
    metadata: { duration: '2:57', artist: 'Kendrick Lamar', album: 'DAMN.' }
  }
]

// Landing page component
const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center max-w-4xl mx-auto p-8">
      <h1 className="text-6xl font-black bg-gradient-to-r from-accent-yellow via-white to-accent-yellow bg-clip-text text-transparent mb-6">
        Bucket & MediaID
      </h1>
      <p className="text-2xl text-gray-400 mb-12">
        The underground's home for exclusive content and privacy-first brand collaboration
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Fans</h3>
          <p className="text-gray-400 mb-6">Discover underground artists and unlock exclusive content</p>
          <a href="/welcome" className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors inline-block">
            Fan Login
          </a>
        </div>
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Artists</h3>
          <p className="text-gray-400 mb-6">Monetize your work with daily drops and subscriber tiers</p>
          <a href="/artist/login" className="bg-green-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-colors inline-block">
            Artist Portal
          </a>
        </div>
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Brands</h3>
          <p className="text-gray-400 mb-6">Connect with engaged communities through MediaID</p>
          <a href="/brand/login" className="bg-blue-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors inline-block">
            Brand Portal
          </a>
        </div>
        <div className="glass p-8 rounded-2xl border border-purple-200/20">
          <h3 className="text-2xl font-bold text-purple-400 mb-4">For Developers</h3>
          <p className="text-gray-400 mb-6">Build privacy-first experiences with MediaID APIs</p>
          <a href="/developer/login" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-colors inline-block">
            Developer Portal
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <a href="/discover" className="glass border border-accent-yellow/30 px-8 py-4 rounded-xl font-bold hover:border-accent-yellow/70 transition-colors bg-accent-yellow/10">
            🎵 Discover Music
          </a>
          <a href="/recents" className="glass border border-green-500/30 px-8 py-4 rounded-xl font-bold hover:border-green-500/70 transition-colors bg-green-500/10">
            🕐 Listening History
          </a>
          <a href="/catalog" className="glass border border-white/20 px-8 py-4 rounded-xl font-bold hover:border-accent-yellow/50 transition-colors">
            Explore Artists
          </a>
          <a href="/welcome" className="glass border border-white/20 px-8 py-4 rounded-xl font-bold hover:border-accent-yellow/50 transition-colors">
            General Login
          </a>
        </div>
        
        <div className="text-sm text-gray-500">
          Demo Links: 
          <a href="/bucket-demo" className="text-accent-yellow hover:underline ml-2">Bucket Demo</a> |
          <a href="/locker-demo" className="text-accent-yellow hover:underline ml-2">Locker Demo</a> |
          <a href="/BTI" className="text-accent-yellow hover:underline ml-2">BTI Artist</a> |
          <a href="/test" className="text-accent-yellow hover:underline ml-2">🧪 Test Dashboard</a>
        </div>
      </div>
    </div>
  </div>
)

// Dashboard wrapper component for role switching
const DashboardWrapper: React.FC<{ initialRole: 'fan' | 'artist' | 'brand' | 'developer' }> = ({ initialRole }) => {
  const [currentRole, setCurrentRole] = React.useState<'fan' | 'artist' | 'brand' | 'developer'>(initialRole)

  const handleRoleSwitch = (role: 'fan' | 'artist' | 'brand' | 'developer') => {
    setCurrentRole(role)
  }

  // Render appropriate dashboard based on current role
  switch (currentRole) {
    case 'fan':
      return <FanDashboard userRole={currentRole} onRoleSwitch={handleRoleSwitch} />
    case 'artist':
      return <ArtistDashboardTemplateUI userRole={currentRole} onRoleSwitch={handleRoleSwitch} />
    case 'brand':
      return <BrandDashboardTemplateUI userRole={currentRole} onRoleSwitch={handleRoleSwitch} />
    case 'developer':
      return <DeveloperDashboard userRole={currentRole} onRoleSwitch={handleRoleSwitch} />
    default:
      return <FanDashboard userRole="fan" onRoleSwitch={handleRoleSwitch} />
  }
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '/',
        element: <LandingPage />
      },
      // Test route for development - bypasses all auth guards
      {
        path: '/test',
        element: <TestDashboard />
      },
  {
    path: '/auto-route',
    element: <AutoRouter />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/welcome',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <WelcomePage />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/login',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-8">
          <SignInForm 
            onSuccess={(user) => {
              // Use auto-router to handle smart routing
              window.location.href = '/auto-route'
            }}
            onBack={() => window.location.href = '/welcome'}
          />
        </div>
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/reset-password',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <ResetPasswordForm />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Separate login flows
  {
    path: '/artist/login',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <ArtistLogin />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/brand/login',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <BrandLogin />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/developer/login',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <DeveloperLogin />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/catalog',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <UserCatalog />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/onboarding',
    element: (
      <SmartRouteGuard requireAuth={true} requireOnboarding={false}>
        <OnboardingFlow onComplete={() => {
          // After onboarding completion, use auto-router
          window.location.href = '/auto-route'
        }} />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Demo Routes (Public Access)
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
  // Protected Dashboard Routes
  {
    path: '/dashboard/fan',
    element: (
      <SmartRouteGuard allowedRoles={['fan', 'admin']} requireAuth={true} requireOnboarding={true}>
        <DashboardWrapper initialRole="fan" />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/artist',
    element: (
      <SmartRouteGuard allowedRoles={['artist', 'admin']} requireAuth={true} requireOnboarding={true}>
        <DashboardWrapper initialRole="artist" />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/brand',
    element: (
      <SmartRouteGuard allowedRoles={['brand', 'admin']} requireAuth={true} requireOnboarding={true}>
        <DashboardWrapper initialRole="brand" />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/developer',
    element: (
      <SmartRouteGuard allowedRoles={['developer', 'admin']} requireAuth={true} requireOnboarding={true}>
        <DashboardWrapper initialRole="developer" />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Settings Route
  {
    path: '/settings',
    element: (
      <SmartRouteGuard requireAuth={true} requireOnboarding={true}>
        <UniversalSettingsPanel />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Player Route
  {
    path: '/player',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <PlayerPage />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Discovery Route
  {
    path: '/discover',
    element: (
      <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
        <DiscoveryPage />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Recents/Listening History Route
  {
    path: '/recents',
    element: (
      <SmartRouteGuard requireAuth={true} requireOnboarding={true}>
        <ListeningHistoryPortal />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Upload System Routes
  {
    path: '/upload',
    element: (
      <SmartRouteGuard allowedRoles={['artist', 'admin']} requireAuth={true} requireOnboarding={true}>
        <DedicatedUploadPage />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/upload/library',
    element: (
      <SmartRouteGuard allowedRoles={['artist', 'admin']} requireAuth={true} requireOnboarding={true}>
        <ContentLibraryManager />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Host Admin Dashboard - /host/dashboard
  {
    path: '/host/dashboard',
    element: (
      <SmartRouteGuard requireAuth={true} requireOnboarding={true}>
        <HostAdminDashboard />
      </SmartRouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  // Concierto Event Management & Voting System - buckets.media/events/*
  {
    path: '/events/*',
    element: <ConciertoRoutes />,
    errorElement: <ErrorBoundary />
  },
      // Unauthorized access
      {
        path: '/unauthorized',
        element: (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
              <p className="text-gray-400 mb-8">You don't have permission to access this page.</p>
              <a href="/" className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold">
                Go Home
              </a>
            </div>
          </div>
        )
      }
    ]
  }
])

function App() {
  // ✅ Debug logging for Vercel
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Supabase URL exists:', !!process.env.REACT_APP_SUPABASE_URL)
  console.log('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY)

  return (
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <AudioPlayerProvider>
          <div className="min-h-screen bg-black text-white">
            <RouterProvider router={router} />
          </div>
        </AudioPlayerProvider>
      </AuthProvider>
    </Elements>
  )
}

export default App
