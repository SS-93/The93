import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { signUp, signInWithOAuth } from '../../lib/auth'

interface SignUpFormProps {
  onSuccess: (user: any) => void
  onBack: () => void
  defaultRole?: 'fan' | 'artist' | 'brand'
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onBack, defaultRole = 'fan' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: defaultRole
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.displayName.trim()) {
      setError('Display name is required')
      return
    }

    setLoading(true)
    try {
      // Create user with metadata
      const userMetadata = {
        display_name: formData.displayName,
        role: formData.role
      }
      
      const { data, error } = await signUp(formData.email, formData.password, userMetadata)
      if (error) throw error
      
      // User created successfully, trigger MediaID setup
      onSuccess(data.user)
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
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
      setError(err.message || `Failed to sign up with ${provider}`)
    } finally {
      setLoading(false)
    }
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
        <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
        <p className="text-gray-400">Join thousands of artists and fans on Bucket</p>
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
        <span className="text-gray-400 text-sm">or create with email</span>
        <div className="flex-1 h-px bg-gray-600"></div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">Display Name</label>
          <input
            type="text"
            required
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
            placeholder="Your name or artist name"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">I am a...</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'fan', label: 'Fan', emoji: '🎵' },
              { value: 'artist', label: 'Artist', emoji: '🎤' },
              { value: 'brand', label: 'Brand', emoji: '🏢' }
            ].map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setFormData({ ...formData, role: role.value as any })}
                className={`p-3 rounded-xl border-2 transition-all ${
                  formData.role === role.value
                    ? 'bg-purple-500/20 border-purple-400 text-white'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="text-lg">{role.emoji}</div>
                <div className="text-sm font-medium">{role.label}</div>
              </button>
            ))}
          </div>
        </div>

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
            placeholder="Create a strong password"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </p>
    </motion.div>
  )
}

export default SignUpForm 