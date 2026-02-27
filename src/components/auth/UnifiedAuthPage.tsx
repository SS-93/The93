import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signUp, signInWithOAuth, resetPassword } from '../../lib/auth'
import { BadgeType, BADGE_CONFIGS, REQUESTABLE_BADGES } from '../../types/badge'

// ============================================================================
// UNIFIED AUTH PAGE — Single login/signup replacing 4 separate flows
// ============================================================================

interface UnifiedAuthPageProps {
    /** Initial mode */
    defaultMode?: 'signin' | 'signup'
    /** Called on successful auth */
    onSuccess?: (user: any) => void
    /** Called when user taps "Go Back" */
    onBack?: () => void
}

const UnifiedAuthPage: React.FC<UnifiedAuthPageProps> = ({
    defaultMode = 'signin',
    onSuccess,
    onBack,
}) => {
    const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(defaultMode)
    const [formData, setFormData] = useState({ email: '', password: '', displayName: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resetEmailSent, setResetEmailSent] = useState(false)

    // For signup — default badge (fan), but user can see what badges exist
    const [selectedStartBadge, setSelectedStartBadge] = useState<BadgeType>('fan')

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data, error } = await signIn(formData.email, formData.password)
            if (error) throw error
            onSuccess?.(data.user)
        } catch (err: any) {
            setError(err.message || 'Failed to sign in')
        } finally {
            setLoading(false)
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data, error } = await signUp(formData.email, formData.password, {
                role: selectedStartBadge,
                display_name: formData.displayName,
            })
            if (error) throw error
            onSuccess?.(data?.user)
        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    const handleOAuth = async (provider: 'google' | 'facebook') => {
        setLoading(true)
        try {
            const { error } = await signInWithOAuth(provider)
            if (error) throw error
        } catch (err: any) {
            setError(err.message || `Failed to sign in with ${provider}`)
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { error } = await resetPassword(formData.email)
            if (error) throw error
            setResetEmailSent(true)
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    // ── LAYOUT ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white relative overflow-hidden flex items-center justify-center p-6">
            {/* Background orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[15%] w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-[60%] left-[50%] w-64 h-64 bg-green-600/8 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-black mb-1">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                            Bucket
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">
                        Universal Login
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* ── SIGN IN ───────────────────────────────────────────── */}
                    {mode === 'signin' && (
                        <motion.div
                            key="signin"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="p-8 rounded-3xl bg-gray-900/60 backdrop-blur-2xl border border-gray-800/60 shadow-2xl"
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                                <p className="text-gray-400 text-sm mt-1">Sign in to access your badges and dashboards</p>
                            </div>

                            {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                            {/* OAuth */}
                            <div className="space-y-3 mb-6">
                                <OAuthButton provider="google" onClick={() => handleOAuth('google')} disabled={loading} />
                                <OAuthButton provider="facebook" onClick={() => handleOAuth('facebook')} disabled={loading} />
                            </div>

                            <Divider />

                            {/* Email form */}
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <InputField
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={v => setFormData(f => ({ ...f, email: v }))}
                                    placeholder="you@example.com"
                                />
                                <InputField
                                    label="Password"
                                    type="password"
                                    value={formData.password}
                                    onChange={v => setFormData(f => ({ ...f, password: v }))}
                                    placeholder="Enter your password"
                                />

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('reset'); setError('') }}
                                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <SubmitButton loading={loading} label="Sign In" />
                            </form>

                            <div className="mt-6 text-center">
                                <span className="text-gray-500 text-sm">Don't have an account? </span>
                                <button
                                    onClick={() => { setMode('signup'); setError('') }}
                                    className="text-purple-400 text-sm font-semibold hover:text-purple-300 transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── SIGN UP ───────────────────────────────────────────── */}
                    {mode === 'signup' && (
                        <motion.div
                            key="signup"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="p-8 rounded-3xl bg-gray-900/60 backdrop-blur-2xl border border-gray-800/60 shadow-2xl"
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white">Create account</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Sign up once, collect badges to unlock features
                                </p>
                            </div>

                            {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                            {/* OAuth */}
                            <div className="space-y-3 mb-6">
                                <OAuthButton provider="google" onClick={() => handleOAuth('google')} disabled={loading} />
                                <OAuthButton provider="facebook" onClick={() => handleOAuth('facebook')} disabled={loading} />
                            </div>

                            <Divider />

                            <form onSubmit={handleSignUp} className="space-y-4">
                                <InputField
                                    label="Display Name"
                                    type="text"
                                    value={formData.displayName}
                                    onChange={v => setFormData(f => ({ ...f, displayName: v }))}
                                    placeholder="Your name"
                                />
                                <InputField
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={v => setFormData(f => ({ ...f, email: v }))}
                                    placeholder="you@example.com"
                                />
                                <InputField
                                    label="Password"
                                    type="password"
                                    value={formData.password}
                                    onChange={v => setFormData(f => ({ ...f, password: v }))}
                                    placeholder="Min 6 characters"
                                />

                                {/* Starting badge selector */}
                                <div>
                                    <label className="block text-gray-300 font-medium text-sm mb-2">
                                        Which experience are you looking for?
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {REQUESTABLE_BADGES.map(type => {
                                            const config = BADGE_CONFIGS[type]
                                            return (
                                                <motion.button
                                                    key={type}
                                                    type="button"
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setSelectedStartBadge(type)}
                                                    className={`
                            flex items-center gap-2 p-3 rounded-xl text-left text-sm transition-all
                            ${selectedStartBadge === type
                                                            ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg ring-1 ring-white/20`
                                                            : 'bg-gray-800/60 border border-gray-700/40 text-gray-300 hover:border-gray-600'
                                                        }
                          `}
                                                >
                                                    <span className="text-lg">{config.icon}</span>
                                                    <span className="font-medium">{config.label}</span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        You'll start with your <strong>{BADGE_CONFIGS[selectedStartBadge].label}</strong> badge — add more anytime.
                                    </p>
                                </div>

                                <SubmitButton loading={loading} label="Create Account" />
                            </form>

                            <div className="mt-6 text-center">
                                <span className="text-gray-500 text-sm">Already have an account? </span>
                                <button
                                    onClick={() => { setMode('signin'); setError('') }}
                                    className="text-purple-400 text-sm font-semibold hover:text-purple-300 transition-colors"
                                >
                                    Sign In
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── RESET PASSWORD ────────────────────────────────────── */}
                    {mode === 'reset' && (
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="p-8 rounded-3xl bg-gray-900/60 backdrop-blur-2xl border border-gray-800/60 shadow-2xl"
                        >
                            <button
                                onClick={() => { setMode('signin'); setError(''); setResetEmailSent(false) }}
                                className="mb-4 w-9 h-9 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-colors"
                            >
                                ←
                            </button>

                            {resetEmailSent ? (
                                <div className="text-center py-4">
                                    <div className="w-14 h-14 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-3xl">✉️</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
                                    <p className="text-gray-400 text-sm">
                                        We've sent password reset instructions to your email.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-white">Reset password</h2>
                                        <p className="text-gray-400 text-sm mt-1">Enter your email to receive reset instructions</p>
                                    </div>

                                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <InputField
                                            label="Email Address"
                                            type="email"
                                            value={formData.email}
                                            onChange={v => setFormData(f => ({ ...f, email: v }))}
                                            placeholder="you@example.com"
                                        />
                                        <SubmitButton loading={loading} label="Send Reset Email" />
                                    </form>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back button */}
                {onBack && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 text-center"
                    >
                        <button
                            onClick={onBack}
                            className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
                        >
                            ← Back to Home
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const InputField: React.FC<{
    label: string
    type: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    required?: boolean
}> = ({ label, type, value, onChange, placeholder, required = true }) => (
    <div>
        <label className="block text-gray-300 font-medium text-sm mb-1.5">{label}</label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30 focus:outline-none transition-all text-sm"
            placeholder={placeholder}
        />
    </div>
)

const SubmitButton: React.FC<{ loading: boolean; label: string }> = ({ loading, label }) => (
    <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 text-sm"
    >
        {loading ? (
            <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
            </span>
        ) : (
            label
        )}
    </motion.button>
)

const OAuthButton: React.FC<{
    provider: 'google' | 'facebook'
    onClick: () => void
    disabled?: boolean
}> = ({ provider, onClick, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
      w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50 text-sm
      ${provider === 'google'
                ? 'bg-white text-gray-800 hover:bg-gray-100 shadow-md'
                : 'bg-[#1877F2] text-white hover:bg-[#166FE5] shadow-md'
            }
    `}
    >
        <span className="text-lg">{provider === 'google' ? '🔍' : '📘'}</span>
        <span>Continue with {provider === 'google' ? 'Google' : 'Facebook'}</span>
    </button>
)

const Divider: React.FC = () => (
    <div className="flex items-center gap-4 my-5">
        <div className="flex-1 h-px bg-gray-700/50" />
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-gray-700/50" />
    </div>
)

const ErrorBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
    <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2"
    >
        <span className="text-base mt-0.5">⚠️</span>
        <span className="flex-1">{message}</span>
        <button onClick={onDismiss} className="text-red-400/60 hover:text-red-300">✕</button>
    </motion.div>
)

export default UnifiedAuthPage
