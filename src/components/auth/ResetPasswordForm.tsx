import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { updatePassword } from '../../lib/auth'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ResetPasswordForm: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Check if user is already authenticated via the reset link
  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken && !user) {
      // If no token in URL and no authenticated user, redirect to login
      setError('Invalid or expired reset link. Please request a new password reset.')
      setTimeout(() => {
        navigate('/welcome')
      }, 3000)
    }
  }, [searchParams, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await updatePassword(password)
      if (error) throw error
      
      setSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/auto-route'
      }, 2000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-12 max-w-md w-full"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Password Updated!</h2>
          <p className="text-gray-400 mb-6">
            Your password has been successfully updated. You're being redirected to your dashboard...
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-accent-yellow rounded-full"></div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-8">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Set New Password</h2>
            <p className="text-gray-400">
              Enter your new password below to complete the reset process
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-medium mb-2">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                placeholder="Enter your new password"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                placeholder="Confirm your new password"
                minLength={6}
              />
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/welcome')}
                className="w-full p-4 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <span className="text-yellow-400 text-xl">🛡️</span>
              <div>
                <p className="text-sm text-gray-300 font-medium">Security Notice</p>
                <p className="text-xs text-gray-400">
                  Choose a strong password with at least 6 characters
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPasswordForm
