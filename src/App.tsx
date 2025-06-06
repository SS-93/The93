import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import stripePromise from './lib/stripeClient'
import { AuthProvider } from './hooks/useAuth'
import BucketDemo from './routes/bucket-demo'
import BucketTemplateUI from './components/BucketTemplateUI'
import ErrorBoundary from './components/ErrorBoundary'

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

// Temporary placeholder component
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-gray-400">Coming soon...</p>
      <div className="mt-6 space-y-2">
        <a href="/bucket-demo" className="text-accent-yellow hover:underline block">
          → Check out the Bucket Demo
        </a>
        <a href="/BTI" className="text-accent-yellow hover:underline block">
          → View BTI Artist Page
        </a>
      </div>
    </div>
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <PlaceholderPage title="Bucket & MediaID" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/bucket-demo',
    element: <BucketDemo />,
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
    path: '/login',
    element: <PlaceholderPage title="Login" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/signup',
    element: <PlaceholderPage title="Sign Up" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/onboarding',
    element: <PlaceholderPage title="Onboarding" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/artists/dashboard',
    element: <PlaceholderPage title="Artist Dashboard" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/fans/dashboard',
    element: <PlaceholderPage title="Fan Dashboard" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/brands/dashboard',
    element: <PlaceholderPage title="Brand Dashboard" />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/public',
    element: <PlaceholderPage title="Public Dashboard" />,
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
