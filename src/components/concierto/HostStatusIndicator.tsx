import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface HostStatusIndicatorProps {
  className?: string
}

interface HostStats {
  totalEvents: number
  activeEvents: number
  totalAudience: number
  thisWeekVotes: number
}

const HostStatusIndicator: React.FC<HostStatusIndicatorProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isHost, setIsHost] = useState(false)
  const [hostStats, setHostStats] = useState<HostStats | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      checkHostStatus()
    }
  }, [user])

  const checkHostStatus = async () => {
    if (!user) return

    try {
      // Check if user has hosted any events
      const { data: events, error } = await supabase
        .from('events')
        .select('id, status, created_at')
        .eq('host_user_id', user.id)

      if (error) {
        console.error('Error checking host status:', error)
        return
      }

      const hasEvents = events && events.length > 0
      setIsHost(hasEvents)

      if (hasEvents) {
        // Get basic host stats
        const totalEvents = events.length
        const activeEvents = events.filter(e => e.status === 'live' || e.status === 'published').length

        // Get audience count (simplified for now)
        const { count: audienceCount } = await supabase
          .from('event_participants')
          .select('id', { count: 'exact' })
          .in('event_id', events.map(e => e.id))

        // Get this week's votes (simplified)
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 7)

        const { count: votesCount } = await supabase
          .from('event_votes')
          .select('id', { count: 'exact' })
          .in('event_id', events.map(e => e.id))
          .gte('created_at', weekStart.toISOString())

        setHostStats({
          totalEvents,
          activeEvents,
          totalAudience: audienceCount || 0,
          thisWeekVotes: votesCount || 0
        })
      }
    } catch (error) {
      console.error('Error loading host stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHostClick = () => {
    navigate('/host/dashboard')
  }

  if (!user || !isHost || loading) return null

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="relative cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleHostClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glowing Host Indicator */}
        <motion.div
          className="w-3 h-3 bg-blue-500 rounded-full relative"
          animate={{
            boxShadow: [
              '0 0 5px rgb(59, 130, 246)',
              '0 0 15px rgb(59, 130, 246)',
              '0 0 5px rgb(59, 130, 246)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse opacity-75" />

          {/* Host icon */}
          <div className="absolute -inset-1 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">H</span>
          </div>
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && hostStats && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute top-6 right-0 z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 min-w-[200px] shadow-2xl"
            >
              <div className="text-xs text-gray-300 mb-2 font-medium">🎤 Event Host Dashboard</div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Events:</span>
                  <span className="text-white font-medium">{hostStats.totalEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Events:</span>
                  <span className="text-blue-400 font-medium">{hostStats.activeEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Audience:</span>
                  <span className="text-accent-yellow font-medium">{hostStats.totalAudience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">This Week Votes:</span>
                  <span className="text-green-400 font-medium">{hostStats.thisWeekVotes}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-400">Click to view analytics</div>
              </div>

              {/* Arrow pointer */}
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default HostStatusIndicator