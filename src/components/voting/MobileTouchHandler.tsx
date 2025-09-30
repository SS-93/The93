import React, { useState, useRef, useEffect } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'

interface TouchGestureProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPullRefresh?: () => void
  enablePullRefresh?: boolean
  className?: string
}

interface VotingCardSwipeProps {
  children: React.ReactNode
  onVote?: () => void
  onScore?: () => void
  onSkip?: () => void
  className?: string
}

// Touch gesture threshold constants
const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY_THRESHOLD = 500
const PULL_REFRESH_THRESHOLD = 60

export const TouchGestureHandler: React.FC<TouchGestureProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullRefresh,
  enablePullRefresh = false,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const pullProgress = useTransform(y, [0, PULL_REFRESH_THRESHOLD], [0, 1])

  const handlePanEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info

    // Check for pull refresh (downward motion at the top)
    if (enablePullRefresh && offset.y > PULL_REFRESH_THRESHOLD && containerRef.current?.scrollTop === 0) {
      if (onPullRefresh) {
        setIsRefreshing(true)
        onPullRefresh()
        setTimeout(() => setIsRefreshing(false), 1000) // Reset after animation
      }
      return
    }

    // Check for swipes based on distance or velocity
    const isHorizontalSwipe = Math.abs(offset.x) > Math.abs(offset.y)
    const isVerticalSwipe = Math.abs(offset.y) > Math.abs(offset.x)

    if (isHorizontalSwipe) {
      if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD) {
        onSwipeRight?.()
      } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
        onSwipeLeft?.()
      }
    } else if (isVerticalSwipe) {
      if (offset.y > SWIPE_THRESHOLD || velocity.y > SWIPE_VELOCITY_THRESHOLD) {
        onSwipeDown?.()
      } else if (offset.y < -SWIPE_THRESHOLD || velocity.y < -SWIPE_VELOCITY_THRESHOLD) {
        onSwipeUp?.()
      }
    }
  }

  return (
    <motion.div
      ref={containerRef}
      className={`touch-handler ${className}`}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onPanEnd={handlePanEnd}
      style={{ y }}
    >
      {/* Pull to refresh indicator */}
      {enablePullRefresh && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4"
          style={{
            opacity: pullProgress,
            transform: useTransform(pullProgress, [0, 1], ['translateY(-100%)', 'translateY(0%)'])
          }}
        >
          <motion.div
            className="flex items-center space-x-2 text-white"
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
          >
            <div className="text-2xl">🔄</div>
            <span>{isRefreshing ? 'Refreshing...' : 'Pull to refresh'}</span>
          </motion.div>
        </motion.div>
      )}

      {children}
    </motion.div>
  )
}

export const VotingCardSwipe: React.FC<VotingCardSwipeProps> = ({
  children,
  onVote,
  onScore,
  onSkip,
  className = ''
}) => {
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | 'up' | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  const handleDrag = (event: any, info: PanInfo) => {
    const { offset } = info

    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      if (offset.x > 50) {
        setDragDirection('right')
      } else if (offset.x < -50) {
        setDragDirection('left')
      } else {
        setDragDirection(null)
      }
    } else if (offset.y < -50) {
      // Upward swipe
      setDragDirection('up')
    } else {
      setDragDirection(null)
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info

    // Swipe right - Vote
    if (offset.x > 100 || velocity.x > 500) {
      onVote?.()
      return
    }

    // Swipe left - Skip
    if (offset.x < -100 || velocity.x < -500) {
      onSkip?.()
      return
    }

    // Swipe up - Score
    if (offset.y < -100 || velocity.y < -500) {
      onScore?.()
      return
    }

    // Reset position if no action triggered
    setDragDirection(null)
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      className={`relative ${className}`}
      drag
      dragConstraints={{ left: -300, right: 300, top: -200, bottom: 50 }}
      dragElastic={0.1}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, opacity }}
      whileDrag={{ scale: 1.05, zIndex: 10 }}
    >
      {/* Swipe Indicators */}
      <AnimatePresence>
        {dragDirection && (
          <>
            {/* Vote indicator (right swipe) */}
            {dragDirection === 'right' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center pointer-events-none"
              >
                <div className="text-4xl">👍</div>
                <div className="ml-2 text-green-300 font-bold">VOTE</div>
              </motion.div>
            )}

            {/* Skip indicator (left swipe) */}
            {dragDirection === 'left' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-red-500/20 rounded-2xl flex items-center justify-center pointer-events-none"
              >
                <div className="text-4xl">👎</div>
                <div className="ml-2 text-red-300 font-bold">SKIP</div>
              </motion.div>
            )}

            {/* Score indicator (up swipe) */}
            {dragDirection === 'up' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-yellow-500/20 rounded-2xl flex items-center justify-center pointer-events-none"
              >
                <div className="text-4xl">⭐</div>
                <div className="ml-2 text-yellow-300 font-bold">SCORE</div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {children}

      {/* Swipe hints */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-gray-500 pointer-events-none">
        <span>← Skip</span>
        <span>↑ Score</span>
        <span>Vote →</span>
      </div>
    </motion.div>
  )
}

// Hook for detecting mobile device and touch capabilities
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [touchCapable, setTouchCapable] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setIsMobile(mobile)
      setTouchCapable(touch)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return { isMobile, touchCapable }
}

// Touch-optimized button component
export const TouchButton: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
}> = ({ children, onClick, className = '', variant = 'primary' }) => {
  const baseStyles = "relative min-h-[44px] min-w-[44px] rounded-2xl font-semibold transition-all duration-200 active:scale-95"

  const variantStyles = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg active:shadow-xl",
    secondary: "backdrop-blur-xl bg-white/10 text-white border border-white/20 active:bg-white/20",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg active:shadow-xl"
  }

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.button>
  )
}

export default TouchGestureHandler