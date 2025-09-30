// Player Keyboard Shortcuts - Phase 1
// Global keyboard shortcuts for player control

import { useEffect } from 'react'
import { useAudioPlayer } from '../../../context/AudioPlayerContext'

const PlayerKeyboardShortcuts: React.FC = () => {
  const { state, togglePlay, nextTrack, previousTrack, setVolume, dispatch } = useAudioPlayer()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Prevent default for handled shortcuts
      const handled = true

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (state.currentTrack) {
            togglePlay()
          }
          break

        case 'ArrowRight':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            nextTrack()
          } else if (event.shiftKey) {
            // Seek forward 10 seconds
            event.preventDefault()
            const newTime = Math.min(state.currentTime + 10, state.duration)
            dispatch({ type: 'SEEK_TO', payload: newTime })
          }
          break

        case 'ArrowLeft':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            previousTrack()
          } else if (event.shiftKey) {
            // Seek backward 10 seconds
            event.preventDefault()
            const newTime = Math.max(state.currentTime - 10, 0)
            dispatch({ type: 'SEEK_TO', payload: newTime })
          }
          break

        case 'ArrowUp':
          if (event.shiftKey) {
            // Volume up
            event.preventDefault()
            const newVolume = Math.min(state.volume + 0.1, 1)
            setVolume(newVolume)
          }
          break

        case 'ArrowDown':
          if (event.shiftKey) {
            // Volume down
            event.preventDefault()
            const newVolume = Math.max(state.volume - 0.1, 0)
            setVolume(newVolume)
          }
          break

        case 'KeyM':
          // Mute toggle
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            dispatch({ type: 'TOGGLE_MUTE' })
          }
          break

        case 'KeyL':
          // Like toggle
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            dispatch({ type: 'TOGGLE_LIKE' })
          }
          break

        case 'KeyS':
          // Shuffle toggle
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            dispatch({ type: 'TOGGLE_SHUFFLE' })
          }
          break

        case 'KeyR':
          // Repeat toggle
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            const modes: ('none' | 'track' | 'queue')[] = ['none', 'track', 'queue']
            const currentIndex = modes.indexOf(state.repeatMode)
            const nextMode = modes[(currentIndex + 1) % modes.length]
            dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode })
          }
          break

        case 'KeyF':
          // Toggle expanded view
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            dispatch({ type: 'TOGGLE_EXPANDED' })
          }
          break

        case 'Digit0':
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          // Seek to percentage of track
          if (event.shiftKey && state.duration > 0) {
            event.preventDefault()
            const digit = parseInt(event.code.slice(-1))
            const percentage = digit * 10 // 0-90%
            const newTime = (percentage / 100) * state.duration
            dispatch({ type: 'SEEK_TO', payload: newTime })
          }
          break

        default:
          // Key not handled
          return
      }
    }

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state, togglePlay, nextTrack, previousTrack, setVolume, dispatch])

  // This component doesn't render anything
  return null
}

export default PlayerKeyboardShortcuts