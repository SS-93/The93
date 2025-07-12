import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import stripePromise from './lib/stripeClient'
import { AuthProvider } from './hooks/useAuth'
import BucketDemo from './routes/bucket-demo'
import LockerDemo from './routes/locker-demo'
import BucketTemplateUI from './components/BucketTemplateUI'
import FanDashboard from './components/FanDashboard'
import UserCatalog from './components/UserCatalog'
import ArtistDashboardTemplateUI from './components/ArtistDashboardTemplateUI'
import BrandDashboardTemplateUI from './components/BrandDashboardTemplateUI'
import ErrorBoundary from './components/ErrorBoundary'
import { RouteGuard } from './components/RouteGuard'
import OnboardingFlow from './components/OnboardingFlow'
import WelcomePage from './components/auth/WelcomePage'
import SignInForm from './components/auth/SignInForm'

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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Fans</h3>
          <p className="text-gray-400">Discover underground artists and unlock exclusive content</p>
        </div>
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Artists</h3>
          <p className="text-gray-400">Monetize your work with daily drops and subscriber tiers</p>
        </div>
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-accent-yellow mb-4">For Brands</h3>
          <p className="text-gray-400">Connect with engaged communities through MediaID</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <a href="/catalog" className="bg-accent-yellow text-black px-8 py-4 rounded-xl font-bold hover:bg-accent-yellow/90 transition-colors">
            Explore Artists
          </a>
          <a href="/welcome" className="glass border border-white/20 px-8 py-4 rounded-xl font-bold hover:border-accent-yellow/50 transition-colors">
            Get Started
          </a>
        </div>
        
        <div className="text-sm text-gray-500">
          Demo Links: 
          <a href="/bucket-demo" className="text-accent-yellow hover:underline ml-2">Bucket Demo</a> |
          <a href="/locker-demo" className="text-accent-yellow hover:underline ml-2">Locker Demo</a> |
          <a href="/BTI" className="text-accent-yellow hover:underline ml-2">BTI Artist</a>
        </div>
      </div>
    </div>
  </div>
)

// Dashboard wrapper component for role switching
const DashboardWrapper: React.FC<{ initialRole: 'fan' | 'artist' | 'brand' }> = ({ initialRole }) => {
  const [currentRole, setCurrentRole] = React.useState<'fan' | 'artist' | 'brand'>(initialRole)

  const handleRoleSwitch = (role: 'fan' | 'artist' | 'brand') => {
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
    default:
      return <FanDashboard userRole="fan" onRoleSwitch={handleRoleSwitch} />
  }
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/welcome', // New route for the original auth flow
    element: <WelcomePage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/login',
    element: (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-8">
        <SignInForm 
          onSuccess={(user) => {
            const userRole = user?.user_metadata?.role || 'fan'
            window.location.href = `/dashboard/${userRole}`
          }}
          onBack={() => window.location.href = '/welcome'}
        />
      </div>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/catalog',
    element: <UserCatalog />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/onboarding',
    element: <OnboardingFlow />,
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
      <RouteGuard allowedRoles={['fan', 'admin']} requireAuth={true}>
        <DashboardWrapper initialRole="fan" />
      </RouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/artist',
    element: (
      <RouteGuard allowedRoles={['artist', 'admin']} requireAuth={true}>
        <DashboardWrapper initialRole="artist" />
      </RouteGuard>
    ),
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/brand',
    element: (
      <RouteGuard allowedRoles={['brand', 'admin']} requireAuth={true}>
        <DashboardWrapper initialRole="brand" />
      </RouteGuard>
    ),
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
    ),
    errorElement: <ErrorBoundary />
  }
])

function App() {
  return (
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <div className="min-h-screen bg-black text-white">
          <RouterProvider router={router} />
        </div>
      </AuthProvider>
    </Elements>
  )
}

export default App
