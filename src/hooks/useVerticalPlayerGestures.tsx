import { useCallback, useRef, useEffect } from 'react'
import { PanInfo } from 'framer-motion'

interface UseVerticalPlayerGesturesProps {
  onSwipeNext: () => void
  onSwipePrevious: () => void
  onTapLeft: () => void
  onTapRight: () => void
  onLongPress: () => void
  onLongPressEnd: () => void
  hasNext: boolean
  hasPrevious: boolean
}

interface GestureState {
  isLongPressing: boolean
  longPressTimer: NodeJS.Timeout | null
  touchStart: { x: number; y: number; time: number } | null
}

export const useVerticalPlayerGestures = ({
  onSwipeNext,
  onSwipePrevious,
  onTapLeft,
  onTapRight,
  onLongPress,
  onLongPressEnd,
  hasNext,
  hasPrevious
}: UseVerticalPlayerGesturesProps) => {
  const gestureState = useRef<GestureState>({
    isLongPressing: false,
    longPressTimer: null,
    touchStart: null
  })

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (gestureState.current.longPressTimer) {
        clearTimeout(gestureState.current.longPressTimer)
      }
    }
  }, [])

  // Handle drag end for vertical swipes
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 50
    const velocity = Math.abs(info.velocity.y)
    const offset = info.offset.y
    
    // Only process if significant movement
    if (velocity > 500 || Math.abs(offset) > threshold) {
      if (offset > 0 && hasPrevious) {
        // Swipe down - previous track
        onSwipePrevious()
      } else if (offset < 0 && hasNext) {
        // Swipe up - next track  
        onSwipeNext()
      }
    }
  }, [onSwipeNext, onSwipePrevious, hasNext, hasPrevious])

  // Touch event handlers for tap regions and long press
  const handleTouchStart = useCallback((event: React.TouchEvent, region: 'left' | 'right') => {
    const touch = event.touches[0]
    gestureState.current.touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    // Start long press timer
    gestureState.current.longPressTimer = setTimeout(() => {
      gestureState.current.isLongPressing = true
      onLongPress()
      
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms for long press
  }, [onLongPress])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!gestureState.current.touchStart) return
    
    const touch = event.touches[0]
    const deltaX = Math.abs(touch.clientX - gestureState.current.touchStart.x)
    const deltaY = Math.abs(touch.clientY - gestureState.current.touchStart.y)
    
    // Cancel long press if finger moves too much (10px threshold)
    if (deltaX > 10 || deltaY > 10) {
      if (gestureState.current.longPressTimer) {
        clearTimeout(gestureState.current.longPressTimer)
        gestureState.current.longPressTimer = null
      }
    }
  }, [])

  const handleTouchEnd = useCallback((event: React.TouchEvent, region: 'left' | 'right') => {
    const isLongPress = gestureState.current.isLongPressing
    
    // Clear long press timer
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer)
      gestureState.current.longPressTimer = null
    }
    
    // Handle long press end
    if (isLongPress) {
      gestureState.current.isLongPressing = false
      onLongPressEnd()
      return
    }
    
    // Handle tap if it was a quick tap
    if (gestureState.current.touchStart) {
      const timeDelta = Date.now() - gestureState.current.touchStart.time
      if (timeDelta < 300) { // Quick tap threshold
        if (region === 'left') {
          onTapLeft()
        } else {
          onTapRight()
        }
      }
    }
    
    gestureState.current.touchStart = null
  }, [onTapLeft, onTapRight, onLongPressEnd])

  // Mouse event handlers for desktop
  const handleMouseDown = useCallback((region: 'left' | 'right') => {
    gestureState.current.touchStart = {
      x: 0,
      y: 0,
      time: Date.now()
    }
    
    // Start long press timer
    gestureState.current.longPressTimer = setTimeout(() => {
      gestureState.current.isLongPressing = true
      onLongPress()
    }, 500)
  }, [onLongPress])

  const handleMouseUp = useCallback((region: 'left' | 'right') => {
    const isLongPress = gestureState.current.isLongPressing
    
    // Clear long press timer
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer)
      gestureState.current.longPressTimer = null
    }
    
    // Handle long press end
    if (isLongPress) {
      gestureState.current.isLongPressing = false
      onLongPressEnd()
      return
    }
    
    // Handle click if it was a quick click
    if (gestureState.current.touchStart) {
      const timeDelta = Date.now() - gestureState.current.touchStart.time
      if (timeDelta < 300) {
        if (region === 'left') {
          onTapLeft()
        } else {
          onTapRight()
        }
      }
    }
    
    gestureState.current.touchStart = null
  }, [onTapLeft, onTapRight, onLongPressEnd])

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (hasNext) onSwipeNext()
        break
      case 'ArrowDown':
        event.preventDefault()
        if (hasPrevious) onSwipePrevious()
        break
      case 'ArrowLeft':
        event.preventDefault()
        onTapLeft()
        break
      case 'ArrowRight':
        event.preventDefault()
        onTapRight()
        break
      case ' ':
      case 'Enter':
        event.preventDefault()
        onLongPress()
        // Auto-release after 100ms for keyboard
        setTimeout(onLongPressEnd, 100)
        break
    }
  }, [onSwipeNext, onSwipePrevious, onTapLeft, onTapRight, onLongPress, onLongPressEnd, hasNext, hasPrevious])

  return {
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
    handleKeyDown,
    isLongPressing: gestureState.current.isLongPressing
  }
}