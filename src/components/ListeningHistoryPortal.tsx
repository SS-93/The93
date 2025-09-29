// Listening History Portal - Recents Page
// Implementation of the UX spec for chronological listening history

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAudioPlayer } from '../context/AudioPlayerContext'
import { listeningHistoryService, ListeningHistoryEntry, trackPlay, trackAdd } from '../lib/listeningHistory'

interface ListeningHistoryPortalProps {
  onClose?: () => void
  className?: string
}

type FilterType = 'all' | 'music' | 'podcasts' | 'audiobooks'

// Row component for individual history items
const HistoryRow: React.FC<{
  entry: ListeningHistoryEntry
  onPlay: (entry: ListeningHistoryEntry) => void
  onMenu: (entry: ListeningHistoryEntry) => void
  onAdd: (entry: ListeningHistoryEntry) => void
}> = ({ entry, onPlay, onMenu, onAdd }) => {
  const formatSubtitle = () => {
    const parts = []
    
    // Add artist if available
    if (entry.content_artist) {
      parts.push(entry.content_artist)
    }
    
    // Add type and provider
    const typeLabel = entry.content_type === 'music' ? 'Track' : 
                      entry.content_type === 'playlist' ? 'Playlist' :
                      entry.content_type === 'album' ? 'Album' :
                      entry.content_type.charAt(0).toUpperCase() + entry.content_type.slice(1)
    
    if (entry.content_provider) {
      parts.push(`${typeLabel} • ${entry.content_provider}`)
    } else {
      parts.push(typeLabel)
    }
    
    // Add event descriptor
    if (entry.event_type === 'played' && entry.play_count) {
      parts.push(`${entry.play_count} ${entry.play_count === 1 ? 'play' : 'plays'}`)
    } else if (entry.event_type === 'added') {
      parts.push('Added')
    } else if (entry.event_type === 'downloaded') {
      parts.push('Downloaded')
    }
    
    return parts.join(' • ')
  }
  
  const getEventBadge = () => {
    switch (entry.event_type) {
      case 'added':
        return <span className="text-green-400 text-xs">✓ Added</span>
      case 'downloaded':
        return <span className="text-blue-400 text-xs">↓ Downloaded</span>
      case 'resumed':
        return <span className="text-yellow-400 text-xs">▶ Resumed</span>
      default:
        return null
    }
  }
  
  return (
    <motion.div
      className="flex items-center py-3 px-4 hover:bg-white/5 transition-colors cursor-pointer"
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      onClick={() => onPlay(entry)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Artwork */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
        {entry.artwork_url ? (
          <img 
            src={entry.artwork_url} 
            alt={entry.content_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            🎵
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 ml-3 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="text-white font-medium text-sm truncate">
              {entry.content_title}
              {entry.explicit_content && (
                <span className="ml-2 bg-gray-600 text-white text-xs px-1 rounded">E</span>
              )}
            </h3>
            
            {/* Subtitle */}
            <p className="text-gray-400 text-xs truncate mt-1">
              {formatSubtitle()}
            </p>
            
            {/* Event badge */}
            <div className="mt-1">
              {getEventBadge()}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 ml-2">
            {/* Add button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAdd(entry)
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Add to library"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            {/* Menu */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMenu(entry)
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="More options"
            >
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main portal component
const ListeningHistoryPortal: React.FC<ListeningHistoryPortalProps> = ({
  onClose,
  className = ''
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playTrack } = useAudioPlayer()
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [groupedHistory, setGroupedHistory] = useState<Record<string, ListeningHistoryEntry[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load listening history
  const loadHistory = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const contentType = activeFilter === 'all' ? undefined : activeFilter
      const grouped = await listeningHistoryService.getGroupedListeningHistory(
        user.id,
        contentType as any
      )
      
      setGroupedHistory(grouped)
    } catch (error) {
      console.error('Failed to load listening history:', error)
      setError('Failed to load listening history')
    } finally {
      setLoading(false)
    }
  }, [user, activeFilter])
  
  useEffect(() => {
    loadHistory()
  }, [loadHistory])
  
  // Handle play action
  const handlePlay = useCallback(async (entry: ListeningHistoryEntry) => {
    // Convert to Track format and play
    const track = {
      id: entry.content_id,
      title: entry.content_title,
      artist: entry.content_artist || 'Unknown Artist',
      artistId: 'unknown',
      audioUrl: '', // This would need to be resolved from content_id
      albumArt: entry.artwork_url,
      duration: entry.total_duration_seconds
    }
    
    playTrack(track)
    
    // Track the play event
    if (user) {
      await trackPlay({
        userId: user.id,
        contentId: entry.content_id,
        contentTitle: entry.content_title,
        contentArtist: entry.content_artist,
        contentType: entry.content_type,
        context: 'recents_portal'
      })
    }
  }, [playTrack, user])
  
  // Handle add to library
  const handleAdd = useCallback(async (entry: ListeningHistoryEntry) => {
    // Add to library logic would go here
    console.log('Adding to library:', entry.content_title)
    
    if (user) {
      await trackAdd({
        userId: user.id,
        contentId: entry.content_id,
        contentTitle: entry.content_title,
        contentArtist: entry.content_artist,
        contentType: entry.content_type,
        context: 'recents_portal'
      })
    }
    
    // Show toast notification
    // TODO: Implement toast system
  }, [user])
  
  // Handle menu actions
  const handleMenu = useCallback((entry: ListeningHistoryEntry) => {
    // Show context menu
    console.log('Opening menu for:', entry.content_title)
    // TODO: Implement context menu
  }, [])
  
  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Please sign in to view your listening history</p>
      </div>
    )
  }
  
  return (
    <div className={`h-full bg-black text-white ${className}`}>
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onClose ? onClose() : navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-bold">Recents</h1>
              <p className="text-gray-400 text-sm">Your listening history</p>
            </div>
          </div>
          
          {/* System status placeholder */}
          <div className="text-gray-400 text-sm">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {/* Filter chips */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            {(['all', 'music', 'podcasts', 'audiobooks'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">
            <p>{error}</p>
            <button
              onClick={loadHistory}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <div className="mb-4 text-6xl">🎵</div>
            <h3 className="text-lg font-medium mb-2">Nothing here yet</h3>
            <p className="text-sm mb-4">Start listening and we'll keep track</p>
            <button
              onClick={() => onClose ? onClose() : navigate(-1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {Object.entries(groupedHistory).map(([dateKey, entries]) => (
              <div key={dateKey}>
                {/* Sticky date header */}
                <div className="sticky top-20 bg-black/90 backdrop-blur-sm py-2 px-4 z-10">
                  <h2 className="text-gray-300 font-semibold text-sm">{dateKey}</h2>
                </div>
                
                {/* History items */}
                <div className="space-y-0">
                  {entries.map((entry, index) => (
                    <HistoryRow
                      key={`${entry.id}-${index}`}
                      entry={entry}
                      onPlay={handlePlay}
                      onMenu={handleMenu}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListeningHistoryPortal