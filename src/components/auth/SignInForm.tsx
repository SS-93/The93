import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { signIn, signInWithOAuth, resetPassword } from '../../lib/auth'

interface SignInFormProps {
  onSuccess: (user: any) => void
  onBack: () => void
}

const SignInForm: React.FC<SignInFormProps> = ({ onSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await signIn(formData.email, formData.password)
      if (error) throw error
      
      onSuccess(data.user)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true)
    try {
      const { data, error } = await signInWithOAuth(provider)
      if (error) throw error
      onSuccess(data)
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await resetPassword(email)
      if (error) throw error
      
      setResetEmailSent(true)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50"
      >
        <button
          onClick={() => setShowForgotPassword(false)}
          className="absolute top-6 left-6 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
        >
          ←
        </button>

        <div className="text-center mb-8 pt-4">
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-400">
            {resetEmailSent 
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive reset instructions'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {resetEmailSent ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">✉️</span>
            </div>
            <p className="text-gray-300">
              We've sent password reset instructions to your email. 
              Check your inbox and follow the link to create a new password.
            </p>
            <button
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmailSent(false)
              }}
              className="w-full p-4 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const email = (e.target as any).email.value
              handleForgotPassword(email)
            }}
            className="space-y-6"
          >
            <div>
              <label className="block text-gray-300 font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-8 bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50"
    >
      <button
        onClick={onBack}
        className="absolute top-6 left-6 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
      >
        ←
      </button>

      <div className="text-center mb-8 pt-4">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400">Sign in to your Bucket & MediaID account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Social Login */}
      <div className="space-y-4 mb-8">
        <button
          onClick={() => handleOAuth('google')}
          disabled={loading}
          className="w-full p-4 bg-white text-gray-800 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          <span className="text-xl">🔍</span>
          <span>Continue with Google</span>
        </button>
        
        <button
          onClick={() => handleOAuth('facebook')}
          disabled={loading}
          className="w-full p-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          <span className="text-xl">📘</span>
          <span>Continue with Facebook</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-8">
        <div className="flex-1 h-px bg-gray-600"></div>
        <span className="text-gray-400 text-sm">or sign in with email</span>
        <div className="flex-1 h-px bg-gray-600"></div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2 w-4 h-4 bg-gray-700 border border-gray-600 rounded focus:ring-purple-400"
            />
            <span className="text-gray-300 text-sm">Remember me</span>
          </label>
          
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </motion.div>
  )
}

export default SignInForm 