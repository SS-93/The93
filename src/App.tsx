import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import stripePromise from './lib/stripeClient'
import { AuthProvider } from './hooks/useAuth'
import { router } from './routes/router'

function App() {
  // ✅ Debug logging for Vercel
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Supabase URL exists:', !!process.env.REACT_APP_SUPABASE_URL)
  console.log('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY)
  
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
