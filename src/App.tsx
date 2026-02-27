import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import stripePromise from './lib/stripeClient'
import { AuthProvider } from './hooks/useAuth'
import { BadgeProvider } from './hooks/useBadges'
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
import UnifiedAuthPage from './components/auth/UnifiedAuthPage'
import ResetPasswordForm from './components/auth/ResetPasswordForm'
import DeveloperDashboard from './components/DeveloperDashboard'
import TestDashboard from './components/TestDashboard'
import UniversalSettingsPanel from './components/settings/UniversalSettingsPanel'
import DedicatedUploadPage from './components/DedicatedUploadPage'
import ContentLibraryManager from './components/ContentLibraryManager'
import DiscoveryPage from './components/DiscoveryPage'
import ListeningHistoryPortal from './components/ListeningHistoryPortal'
import ConciertoRoutes from './components/concierto/ConciertoRoutes'
import HostAdminDashboard from './components/concierto/HostAdminDashboard'
import { DIADashboard } from './components/dia/DIADashboard'
// Denver Spotlight (standalone — no AppLayout)
import SpotlightHome from './components/dnvrspotlight/SpotlightHome'
import VotingPage from './components/dnvrspotlight/VotingPage'
import HallOfFame from './components/dnvrspotlight/HallOfFame'
import DNVRSpotlightDashboard from './routes/dnvr-spotlight-dashboard'
import { AdminLogin } from './components/auth/AdminLogin'
import { PassportViewer } from './components/passport/PassportViewer'
import TestCheckoutPage from './routes/test-checkout'
import TestTreasuryPage from './routes/test-treasury'
import TreasuryAdminDashboard from './routes/admin-treasury'
import CheckoutSuccessPage from './routes/checkout-success'
import CheckoutCancelPage from './routes/checkout-cancel'
import WalletPage from './routes/wallet'
import ColiseumDashboard from './routes/coliseum-dashboard'
import DNASimulatorRoute from './routes/dna-simulator'
import GlobalCharts from './components/coliseum/pages/GlobalCharts'

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass p-6 rounded-2xl border border-purple-500/20">
          <div className="text-3xl mb-3">🎵</div>
          <h3 className="text-lg font-bold text-purple-400 mb-2">Fan Badge</h3>
          <p className="text-gray-400 text-sm">Discover artists, stream music, attend events</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-green-500/20">
          <div className="text-3xl mb-3">🎤</div>
          <h3 className="text-lg font-bold text-green-400 mb-2">Artist Badge</h3>
          <p className="text-gray-400 text-sm">Upload music, manage events, grow your audience</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-blue-500/20">
          <div className="text-3xl mb-3">🏢</div>
          <h3 className="text-lg font-bold text-blue-400 mb-2">Brand Badge</h3>
          <p className="text-gray-400 text-sm">Create campaigns and partner with artists</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-amber-500/20">
          <div className="text-3xl mb-3">👨‍💻</div>
          <h3 className="text-lg font-bold text-amber-400 mb-2">Developer Badge</h3>
          <p className="text-gray-400 text-sm">Build integrations with MediaID APIs</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md mx-auto mb-8">
        <a href="/signup" className="block w-full bg-accent-yellow text-black px-8 py-4 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors text-center">
          Create Your Account
        </a>
        <a href="/login" className="block w-full glass border border-white/20 px-8 py-4 rounded-xl font-bold hover:border-accent-yellow/50 transition-colors text-center">
          Sign In to Dashboard
        </a>
      </div>

      <p className="text-gray-600 text-xs mb-6">One account · Multiple badges · Unlimited possibilities</p>

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
      // Treasury Test Routes
      {
        path: '/test-checkout',
        element: <TestCheckoutPage />
      },
      {
        path: '/test-treasury',
        element: <TestTreasuryPage />
      },
      {
        path: '/admin/treasury',
        element: (
          <SmartRouteGuard allowedRoles={['admin']} requireAuth={true}>
            <TreasuryAdminDashboard />
          </SmartRouteGuard>
        )
      },
      {
        path: '/checkout/success',
        element: <CheckoutSuccessPage />
      },
      {
        path: '/checkout/cancel',
        element: <CheckoutCancelPage />
      },
      {
        path: '/wallet',
        element: (
          <SmartRouteGuard requireAuth={true}>
            <WalletPage />
          </SmartRouteGuard>
        )
      },
      // Secret admin login - not linked anywhere
      {
        path: '/admin/login',
        element: <AdminLogin />
      },
      // DIA Dashboard - Admin only
      {
        path: '/dia/*',
        element: (
          <SmartRouteGuard allowedRoles={['admin']}>
            <DIADashboard />
          </SmartRouteGuard>
        )
      },
      // Passport Viewer - Authenticated users
      {
        path: '/passport',
        element: (
          <SmartRouteGuard requireAuth={true}>
            <PassportViewer />
          </SmartRouteGuard>
        )
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
            <UnifiedAuthPage
              defaultMode="signin"
              onSuccess={() => { window.location.href = '/auto-route' }}
              onBack={() => { window.location.href = '/welcome' }}
            />
          </SmartRouteGuard>
        ),
        errorElement: <ErrorBoundary />
      },
      {
        path: '/signup',
        element: (
          <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
            <UnifiedAuthPage
              defaultMode="signup"
              onSuccess={() => { window.location.href = '/auto-route' }}
              onBack={() => { window.location.href = '/welcome' }}
            />
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
      // Legacy role-specific login routes → redirect to unified login
      {
        path: '/artist/login',
        element: <UnifiedAuthPage defaultMode="signin" onSuccess={() => { window.location.href = '/auto-route' }} onBack={() => { window.location.href = '/welcome' }} />,
        errorElement: <ErrorBoundary />
      },
      {
        path: '/brand/login',
        element: <UnifiedAuthPage defaultMode="signin" onSuccess={() => { window.location.href = '/auto-route' }} onBack={() => { window.location.href = '/welcome' }} />,
        errorElement: <ErrorBoundary />
      },
      {
        path: '/developer/login',
        element: <UnifiedAuthPage defaultMode="signin" onSuccess={() => { window.location.href = '/auto-route' }} onBack={() => { window.location.href = '/welcome' }} />,
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
          <SmartRouteGuard requiredBadge={['fan', 'admin']} requireAuth={true} requireOnboarding={true}>
            <DashboardWrapper initialRole="fan" />
          </SmartRouteGuard>
        ),
        errorElement: <ErrorBoundary />
      },
      {
        path: '/dashboard/artist',
        element: (
          <SmartRouteGuard requiredBadge={['artist', 'admin']} requireAuth={true} requireOnboarding={true}>
            <DashboardWrapper initialRole="artist" />
          </SmartRouteGuard>
        ),
        errorElement: <ErrorBoundary />
      },
      {
        path: '/dashboard/brand',
        element: (
          <SmartRouteGuard requiredBadge={['brand', 'admin']} requireAuth={true} requireOnboarding={true}>
            <DashboardWrapper initialRole="brand" />
          </SmartRouteGuard>
        ),
        errorElement: <ErrorBoundary />
      },
      {
        path: '/dashboard/developer',
        element: (
          <SmartRouteGuard requiredBadge={['developer', 'admin']} requireAuth={true} requireOnboarding={true}>
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
      // Coliseum Analytics Routes
      {
        path: '/coliseum',
        element: (
          <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
            <ColiseumDashboard />
          </SmartRouteGuard>
        ),
        errorElement: <ErrorBoundary />
      },
      {
        path: '/coliseum/global',
        element: (
          <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
            <GlobalCharts />
          </SmartRouteGuard>
        ),
        errorElement: <ErrorBoundary />
      },
      // DNA Simulator Route (Dev Tool)
      {
        path: '/dna/simulator',
        element: (
          <SmartRouteGuard requireAuth={false} requireOnboarding={false}>
            <DNASimulatorRoute />
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
  },
  // Denver Spotlight Routes — standalone, no AppLayout wrapper
  {
    path: '/DNVRSpotlight',
    element: <SpotlightHome />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/DNVRSpotlight/vote',
    element: <VotingPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/DNVRSpotlight/dashboard',
    element: <DNVRSpotlightDashboard />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/DNVRSpotlight/HallofFame',
    element: <HallOfFame />,
    errorElement: <ErrorBoundary />
  },
])

function App() {
  // ✅ Debug logging for Vercel
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Supabase URL exists:', !!process.env.REACT_APP_SUPABASE_URL)
  console.log('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY)

  return (
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <BadgeProvider>
          <AudioPlayerProvider>
            <div className="min-h-screen bg-black text-white">
              <RouterProvider router={router} />
            </div>
          </AudioPlayerProvider>
        </BadgeProvider>
      </AuthProvider>
    </Elements>
  )
}

export default App
