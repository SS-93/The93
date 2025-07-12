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

    setLoading(true)
    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        role: formData.role
      })
      
      if (error) throw error
      
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'artist': return 'text-green-400'
      case 'brand': return 'text-blue-400'
      default: return 'text-accent-yellow'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'artist': return '🎤'
      case 'brand': return '🏢'
      default: return '🎧'
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
        <h2 className="text-3xl font-bold text-white mb-2">
          Create {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Account
        </h2>
        <p className="text-gray-400">
          Join Bucket & MediaID as a {formData.role} {getRoleIcon(formData.role)}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Role Selection */}
      <div className="mb-6">
        <label className="block text-gray-300 font-medium mb-3">Account Type</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'fan', label: 'Fan', icon: '🎧' },
            { value: 'artist', label: 'Artist', icon: '🎤' },
            { value: 'brand', label: 'Brand', icon: '🏢' }
          ].map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => setFormData({ ...formData, role: role.value as any })}
              className={`p-3 rounded-xl border transition-all ${
                formData.role === role.value
                  ? 'border-accent-yellow bg-accent-yellow/10 text-accent-yellow'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{role.icon}</div>
              <div className="text-sm font-medium">{role.label}</div>
            </button>
          ))}
        </div>
      </div>

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
          <label className="block text-gray-300 font-medium mb-2">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-yellow focus:outline-none transition-colors"
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
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-yellow focus:outline-none transition-colors"
            placeholder="Enter your password"
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-accent-yellow focus:outline-none transition-colors"
            placeholder="Confirm your password"
            minLength={6}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="terms"
            required
            className="mr-3 w-4 h-4 bg-gray-700 border border-gray-600 rounded focus:ring-accent-yellow"
          />
          <label htmlFor="terms" className="text-gray-300 text-sm">
            I agree to the{' '}
            <a href="#" className="text-accent-yellow hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-accent-yellow hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            formData.role === 'artist' 
              ? 'bg-green-500 hover:bg-green-600 text-black'
              : formData.role === 'brand'
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-accent-yellow hover:bg-accent-yellow/90 text-black'
          }`}
        >
          {loading ? 'Creating Account...' : `Create ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Account`}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <button
            onClick={onBack}
            className={`hover:underline font-medium ${getRoleColor(formData.role)}`}
          >
            Sign in here
          </button>
        </p>
      </div>
    </motion.div>
  )
}

export default SignUpForm 