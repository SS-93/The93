import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileRouting } from '../hooks/useProfileRouting'
import { useNavigate } from 'react-router-dom'

interface RoleManagerProps {
  currentRole: 'fan' | 'artist' | 'brand' | 'developer'
  compact?: boolean
  className?: string
}

const RoleManager: React.FC<RoleManagerProps> = ({ 
  currentRole, 
  compact = false, 
  className = '' 
}) => {
  const { profileState, switchToRole, getRoleInfo } = useProfileRouting()
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const allRoles: ('fan' | 'artist' | 'brand' | 'developer')[] = 
    ['fan', 'artist', 'brand', 'developer']

  const handleRoleSwitch = async (newRole: 'fan' | 'artist' | 'brand' | 'developer') => {
    if (newRole === currentRole) return
    
    setIsSwitching(true)
    try {
      const roleInfo = getRoleInfo(newRole)
      
      if (roleInfo.needsSetup) {
        // Redirect to onboarding for this role
        navigate('/onboarding', { 
          state: { targetRole: newRole } 
        })
      } else if (roleInfo.isAvailable) {
        // Switch to existing role
        await switchToRole(newRole)
      } else {
        // Role not available - this shouldn't happen with proper UI
        console.warn(`Role ${newRole} not available for switching`)
      }
    } catch (error) {
      console.error('Role switch error:', error)
      // You might want to show a toast notification here
      alert(`Failed to switch to ${newRole} role: ${error}`)
    } finally {
      setIsSwitching(false)
      setIsExpanded(false)
    }
  }

  const getCurrentRoleInfo = () => getRoleInfo(currentRole)

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isSwitching}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-600/50"
        >
          <span className="text-lg">{getCurrentRoleInfo().icon}</span>
          <span className="text-sm font-medium text-white capitalize">
            {getCurrentRoleInfo().name}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-2 right-0 z-50 min-w-48 bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden"
            >
              {allRoles.map((role) => {
                const roleInfo = getRoleInfo(role)
                const isCurrent = role === currentRole
                
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    disabled={isCurrent || isSwitching}
                    className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                      isCurrent 
                        ? 'bg-accent-yellow/20 text-accent-yellow cursor-default' 
                        : 'hover:bg-gray-800/50 text-gray-300'
                    } ${!roleInfo.isAvailable && !roleInfo.needsSetup ? 'opacity-50' : ''}`}
                  >
                    <span className="text-lg">{roleInfo.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{roleInfo.name}</span>
                        {isCurrent && (
                          <span className="text-xs bg-accent-yellow/20 text-accent-yellow px-2 py-1 rounded-full">
                            Current
                          </span>
                        )}
                        {roleInfo.needsSetup && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                            Setup Required
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              
              <div className="border-t border-gray-700/50 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Switch between your configured roles
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Full role manager UI for settings pages
  return (
    <div className={`bg-gray-800/30 rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-4">Your Roles</h3>
      <p className="text-gray-400 mb-6">
        Manage your different roles on the platform. Each role has its own MediaID profile and preferences.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allRoles.map((role) => {
          const roleInfo = getRoleInfo(role)
          const isCurrent = role === currentRole

          return (
            <motion.div
              key={role}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border transition-all ${
                isCurrent 
                  ? 'border-accent-yellow bg-accent-yellow/10' 
                  : roleInfo.isAvailable 
                    ? 'border-gray-600/50 bg-gray-800/30 hover:border-gray-500' 
                    : 'border-gray-700/30 bg-gray-900/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{roleInfo.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white">{roleInfo.name}</h4>
                    <p className="text-sm text-gray-400">
                      {role === 'fan' && 'Discover and support artists'}
                      {role === 'artist' && 'Create and monetize content'}
                      {role === 'brand' && 'Run targeted campaigns'}
                      {role === 'developer' && 'Build MediaID integrations'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isCurrent && (
                    <span className="text-xs bg-accent-yellow/20 text-accent-yellow px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                  {roleInfo.needsSetup && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                      Setup Required
                    </span>
                  )}
                  {roleInfo.isAvailable && !isCurrent && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      Available
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isCurrent ? (
                  <button
                    disabled
                    className="flex-1 px-4 py-2 bg-accent-yellow/20 text-accent-yellow rounded-lg font-medium cursor-default"
                  >
                    Current Role
                  </button>
                ) : roleInfo.isAvailable ? (
                  <button
                    onClick={() => handleRoleSwitch(role)}
                    disabled={isSwitching}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isSwitching ? 'Switching...' : 'Switch to Role'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRoleSwitch(role)}
                    disabled={isSwitching}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isSwitching ? 'Setting up...' : 'Set Up Role'}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
        <h4 className="font-medium text-white mb-2">💡 Role Benefits</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Each role has its own personalized MediaID profile</li>
          <li>• Switch between roles without losing your preferences</li>
          <li>• Access role-specific features and content</li>
          <li>• Maintain separate privacy settings per role</li>
        </ul>
      </div>
    </div>
  )
}

export default RoleManager 