// Player Queue Component
// Queue management with drag & drop and queue display

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../context/AudioPlayerContext'

const PlayerQueue: React.FC = () => {
  const { state, dispatch, playTrack } = useAudioPlayer()
  const [showQueue, setShowQueue] = useState(false)

  const removeFromQueue = (index: number) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index })
  }

  const playFromQueue = (index: number) => {
    const track = state.queue[index]
    if (track) {
      // Update queue index and play track
      dispatch({ type: 'PLAY_TRACK', payload: track })
      // Set the queue index
      dispatch({ type: 'NEXT_TRACK' }) // This will update the index correctly
    }
  }

  const clearQueue = () => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: [] })
  }

  return (
    <div className="relative">
      {/* Queue button */}
      <motion.button
        onClick={() => setShowQueue(!showQueue)}
        className={`p-2 rounded-lg transition-colors relative ${
          showQueue
            ? 'text-accent-yellow bg-accent-yellow/20'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
        title={`Queue (${state.queue.length} tracks)`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-lg">📜</span>
        
        {/* Queue count badge */}
        {state.queue.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-yellow text-black rounded-full text-xs flex items-center justify-center font-bold">
            {state.queue.length > 99 ? '99+' : state.queue.length}
          </div>
        )}
      </motion.button>

      {/* Queue panel */}
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 w-80 max-h-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          >
            {/* Queue header */}
            <div className="p-4 border-b border-gray-700 bg-gray-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Queue</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">{state.queue.length} tracks</span>
                  {state.queue.length > 0 && (
                    <button
                      onClick={clearQueue}
                      className="text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded text-sm"
                      title="Clear queue"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Queue content */}
            <div className="overflow-y-auto max-h-80">
              {state.queue.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-lg mb-2">No tracks in queue</p>
                  <p className="text-sm">Add tracks to see them here</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {state.queue.map((track, index) => (
                    <motion.div
                      key={`${track.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group p-3 rounded-lg transition-colors cursor-pointer ${
                        index === state.queueIndex && state.currentTrack?.id === track.id
                          ? 'bg-accent-yellow/20 border border-accent-yellow/30'
                          : 'hover:bg-gray-700/50'
                      }`}
                      onClick={() => playFromQueue(index)}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Track index or playing indicator */}
                        <div className="w-6 text-center">
                          {index === state.queueIndex && state.currentTrack?.id === track.id ? (
                            <motion.span
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="text-accent-yellow"
                            >
                              {state.isPlaying ? '🎵' : '⏸️'}
                            </motion.span>
                          ) : (
                            <span className="text-gray-500 text-sm">{index + 1}</span>
                          )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate">
                            {track.title}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">
                            {track.artist}
                          </p>
                          
                          {/* Mood tags */}
                          {track.moodTags && track.moodTags.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-1">
                              {track.moodTags.tags.slice(0, 2).map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-1.5 py-0.5 bg-accent-yellow/20 text-accent-yellow text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Duration */}
                        {track.duration && (
                          <div className="text-gray-400 text-xs">
                            {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromQueue(index)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1 rounded"
                          title="Remove from queue"
                        >
                          <span className="text-sm">✕</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Queue footer with shuffle info */}
            {state.queue.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-900/50">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <span>🔀</span>
                      <span>{state.shuffleMode ? 'On' : 'Off'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>🔁</span>
                      <span className="capitalize">{state.repeatMode}</span>
                    </span>
                  </div>
                  <span>
                    {state.queueIndex + 1} of {state.queue.length}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close queue */}
      {showQueue && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowQueue(false)}
        />
      )}
    </div>
  )
}

export default PlayerQueue
