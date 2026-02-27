import { createBrowserRouter } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'

// Route imports
import LandingPage from './index'
import LoginPage from './login'
import Welcome from './welcome'
import OnboardingRoute from './onboarding'
import CatalogRoute from './catalog'
import TestRoute from './test'
import AutoRouteRoute from './auto-route'
import BTIRoute from './BTI'

// Auth routes
import ArtistLoginRoute from './auth/artist-login'
import BrandLoginRoute from './auth/brand-login'
import DeveloperLoginRoute from './auth/developer-login'
import ResetPasswordRoute from './auth/reset-password'

// Dashboard routes
import FanDashboardRoute from './dashboard/fan'
import ArtistDashboardRoute from './dashboard/artist'
import BrandDashboardRoute from './dashboard/brand'
import DeveloperDashboardRoute from './dashboard/developer'

// Demo routes
import BucketDemo from './bucket-demo'
import LockerDemo from './locker-demo'

// Companon routes
import CompanonRoute from './companon'

// Coliseum route
import ColiseumDashboard from './coliseum-dashboard'

// Denver Spotlight routes
import SpotlightHome from '../components/dnvrspotlight/SpotlightHome'
import VotingPage from '../components/dnvrspotlight/VotingPage'
import HallOfFame from '../components/dnvrspotlight/HallOfFame'
import DNVRSpotlightDashboard from './dnvr-spotlight-dashboard'

// Test components
import PassportTest from '../components/PassportTest'

// Unauthorized route component
const UnauthorizedRoute = () => (
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/test',
    element: <TestRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/test-passport',
    element: <PassportTest />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/auto-route',
    element: <AutoRouteRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/welcome',
    element: <Welcome />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/artist/login',
    element: <ArtistLoginRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/brand/login',
    element: <BrandLoginRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/developer/login',
    element: <DeveloperLoginRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/catalog',
    element: <CatalogRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/onboarding',
    element: <OnboardingRoute />,
    errorElement: <ErrorBoundary />
  },
  // Demo Routes
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
    element: <BTIRoute />,
    errorElement: <ErrorBoundary />
  },
  // Companon Routes (Brand Activation Dashboard)
  {
    path: '/companon/*',
    element: <CompanonRoute />,
    errorElement: <ErrorBoundary />
  },
  // Coliseum Analytics Route
  {
    path: '/coliseum',
    element: <ColiseumDashboard />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/coliseum-dashboard',
    element: <ColiseumDashboard />,
    errorElement: <ErrorBoundary />
  },
  // Protected Dashboard Routes
  {
    path: '/dashboard/fan',
    element: <FanDashboardRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/artist',
    element: <ArtistDashboardRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/brand',
    element: <BrandDashboardRoute />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/developer',
    element: <DeveloperDashboardRoute />,
    errorElement: <ErrorBoundary />
  },
  // Unauthorized access
  {
    path: '/unauthorized',
    element: <UnauthorizedRoute />,
    errorElement: <ErrorBoundary />
  },
  // Denver Spotlight Routes
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