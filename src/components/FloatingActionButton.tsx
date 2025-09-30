// Floating Action Button (FAB) - Glassmorphism Apple-style
// Persistent across all pages with music indicator and menu trigger

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../context/AudioPlayerContext'

interface FloatingActionButtonProps {
  onClick: () => void
  isMenuOpen: boolean
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, isMenuOpen }) => {
  const { state } = useAudioPlayer()

  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-[80] w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center hover:bg-white/20 transition-all group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
    >
      {/* Background Glow Effect when music is playing */}
      {state.currentTrack && state.isPlaying && (
        <motion.div
          className="absolute inset-0 rounded-full bg-accent-yellow/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Album Art or Icon */}
      <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          {state.currentTrack?.albumArt && !isMenuOpen ? (
            <motion.img
              key="album-art"
              src={state.currentTrack.albumArt}
              alt="Now playing"
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            <motion.div
              key="menu-icon"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Hamburger Icon with Animation */}
              <div className="w-6 h-6 flex flex-col items-center justify-center space-y-1.5">
                <motion.span
                  className="w-6 h-0.5 bg-white rounded-full"
                  animate={isMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="w-6 h-0.5 bg-white rounded-full"
                  animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="w-6 h-0.5 bg-white rounded-full"
                  animate={isMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playing Indicator - Animated Waveform */}
      {state.currentTrack && state.isPlaying && !isMenuOpen && (
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-yellow border-2 border-gray-900 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <div className="flex items-center justify-center space-x-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-black rounded-full"
                animate={{
                  height: ['2px', '8px', '2px']
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Notification Badge (for future use) */}
      {/* <motion.div
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-gray-900 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <span className="text-xs text-white font-bold">3</span>
      </motion.div> */}
    </motion.button>
  )
}

export default FloatingActionButton