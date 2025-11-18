import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './AdminLogin.css'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('🔐 [AdminLogin] Starting login process...')
    console.log('🔐 [AdminLogin] Email:', email)

    try {
      // Sign in
      console.log('🔐 [AdminLogin] Attempting sign in with Supabase...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('❌ [AdminLogin] Auth error:', authError)
        throw authError
      }

      console.log('✅ [AdminLogin] Sign in successful')
      console.log('🔐 [AdminLogin] User ID:', authData.user.id)

      // Check if user has admin role AND ensure onboarding is marked complete
      console.log('🔐 [AdminLogin] Fetching profile data...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, onboarding_completed, display_name')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('❌ [AdminLogin] Profile error:', profileError)
        throw profileError
      }

      console.log('✅ [AdminLogin] Profile fetched:', profile)

      if (profile.role !== 'admin') {
        console.error('❌ [AdminLogin] Access denied - role is:', profile.role)
        // Sign them out immediately
        await supabase.auth.signOut()
        throw new Error('Access denied: Admin role required')
      }

      console.log('✅ [AdminLogin] Admin role confirmed')

      // Auto-fix: If admin doesn't have onboarding_completed flag, set it now
      if (!profile.onboarding_completed) {
        console.log('⚠️ [AdminLogin] Admin missing onboarding flag - auto-fixing...')
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            display_name: profile.display_name || 'Admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('❌ [AdminLogin] Failed to update admin profile:', updateError)
          // Continue anyway - routing logic will handle it
        } else {
          console.log('✅ [AdminLogin] Admin profile auto-fixed')
        }
      } else {
        console.log('✅ [AdminLogin] Onboarding already completed')
      }

      // Success - redirect to DIA (with replace to prevent back button issues)
      console.log('🚀 [AdminLogin] Redirecting to /dia...')
      navigate('/dia', { replace: true })
    } catch (err: any) {
      console.error('❌ [AdminLogin] Login failed:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-container">
        <div className="admin-header">
          <div className="admin-icon">🔐</div>
          <h1>DIA</h1>
          <p className="admin-subtitle">Department of Internal Affairs</p>
        </div>

        <form onSubmit={handleLogin} className="admin-form">
          {error && (
            <div className="admin-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-field">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@buckets.media"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="admin-submit"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Access DIA'}
          </button>
        </form>

        <div className="admin-footer">
          <p className="security-notice">
            🔒 Secure connection established
          </p>
          <p className="authorized-only">
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  )
}
