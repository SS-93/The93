/**
 * =============================================================================
 * PASSPORT STAMP COMPONENT
 * =============================================================================
 *
 * Purpose: Atomic unit of Passport history - individual event display
 * Responsibility: Rendering rich, event-specific UI for each Passport entry
 *
 * Features:
 * - Switches rendering based on event_type
 * - StampMusic: Rich display for player.track_played
 * - StampGeneric: Fallback for all other events
 * - Shows metadata, timestamps, processing status
 *
 * Visual Design:
 * - Apple Music / Spotify "Recently Played" aesthetic
 * - Album art thumbnails (when available)
 * - Context info ("Played from Discover")
 * - Timestamp relative to now ("2 minutes ago")
 *
 * =============================================================================
 */

import React from 'react'
import { PassportEntry } from '../../types/passport'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'

interface PassportStampProps {
  entry: PassportEntry
  onClick?: () => void
  isGrouped?: boolean
  groupId?: string
}

export const PassportStamp: React.FC<PassportStampProps> = ({
  entry,
  onClick,
  isGrouped = false,
  groupId
}) => {

  // Determine which stamp variant to render
  const stampType = getStampType(entry.event_type)

  switch (stampType) {
    case 'music':
      return <StampMusic entry={entry} onClick={onClick} isGrouped={isGrouped} />
    case 'event':
      return <StampEvent entry={entry} onClick={onClick} isGrouped={isGrouped} />
    case 'treasury':
      return <StampTreasury entry={entry} onClick={onClick} isGrouped={isGrouped} />
    case 'social':
      return <StampSocial entry={entry} onClick={onClick} isGrouped={isGrouped} />
    default:
      return <StampGeneric entry={entry} onClick={onClick} isGrouped={isGrouped} />
  }
}

// =============================================================================
// STAMP VARIANT: MUSIC (player.track_played)
// =============================================================================

const StampMusic: React.FC<Omit<PassportStampProps, 'groupId'>> = ({ entry, onClick, isGrouped }) => {
  const metadata = entry.metadata || {}
  const trackName = metadata.trackName || metadata.title || 'Unknown Track'
  const artistName = metadata.artistName || metadata.artist || 'Unknown Artist'
  const albumArt = metadata.albumArt || metadata.coverUrl
  const context = metadata.context || metadata.source || 'Player'
  const duration = metadata.duration
  const progress = metadata.progress

  const timestamp = typeof entry.created_at === 'string' ? parseISO(entry.created_at) : entry.created_at
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`passport-stamp stamp-music group cursor-pointer ${isGrouped ? 'ml-4 border-l-2 border-cyan-500/30 pl-4' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all border border-cyan-500/10 hover:border-cyan-500/30">

        {/* Album Art or Icon */}
        <div className="flex-shrink-0">
          {albumArt ? (
            <img
              src={albumArt}
              alt={trackName}
              className="w-14 h-14 rounded-md object-cover shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">🎵</span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
            {trackName}
          </h4>
          <p className="text-xs text-gray-400 truncate">
            {artistName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              Played from <span className="text-cyan-400">{context}</span>
            </span>
            {duration && progress && (
              <span className="text-xs text-gray-600">
                · {Math.round((progress / duration) * 100)}% complete
              </span>
            )}
          </div>
        </div>

        {/* Timestamp & Status */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-500">{timeAgo}</p>
          <ProcessingBadges entry={entry} />
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// STAMP VARIANT: EVENT (concierto.*)
// =============================================================================

const StampEvent: React.FC<Omit<PassportStampProps, 'groupId'>> = ({ entry, onClick, isGrouped }) => {
  const metadata = entry.metadata || {}
  const eventName = metadata.eventName || metadata.event_title || 'Event'
  const eventType = entry.event_type.split('.')[1] // e.g., "vote_cast"
  const icon = getEventIcon(entry.event_type)

  const timestamp = typeof entry.created_at === 'string' ? parseISO(entry.created_at) : entry.created_at
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`passport-stamp stamp-event cursor-pointer ${isGrouped ? 'ml-4 border-l-2 border-purple-500/30 pl-4' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all border border-purple-500/10 hover:border-purple-500/30">

        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">
            {formatEventAction(eventType)}
          </h4>
          <p className="text-xs text-gray-400 truncate">{eventName}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-500">{timeAgo}</p>
          <ProcessingBadges entry={entry} />
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// STAMP VARIANT: TREASURY (treasury.*)
// =============================================================================

const StampTreasury: React.FC<Omit<PassportStampProps, 'groupId'>> = ({ entry, onClick, isGrouped }) => {
  const metadata = entry.metadata || {}
  const amountCents = metadata.amount_cents || metadata.amountCents || 0
  const transactionType = metadata.transaction_type || metadata.type || 'transaction'
  const icon = transactionType.includes('earn') || transactionType.includes('payout') ? '💰' : '💳'

  const timestamp = typeof entry.created_at === 'string' ? parseISO(entry.created_at) : entry.created_at
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`passport-stamp stamp-treasury cursor-pointer ${isGrouped ? 'ml-4 border-l-2 border-green-500/30 pl-4' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all border border-green-500/10 hover:border-green-500/30">

        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">
            {formatTreasuryAction(entry.event_type)}
          </h4>
          <p className="text-xs text-gray-400">
            ${(amountCents / 100).toFixed(2)} · {transactionType}
          </p>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-500">{timeAgo}</p>
          <ProcessingBadges entry={entry} />
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// STAMP VARIANT: SOCIAL (social.*)
// =============================================================================

const StampSocial: React.FC<Omit<PassportStampProps, 'groupId'>> = ({ entry, onClick, isGrouped }) => {
  const metadata = entry.metadata || {}
  const targetName = metadata.targetName || metadata.userName || 'User'
  const icon = getSocialIcon(entry.event_type)

  const timestamp = typeof entry.created_at === 'string' ? parseISO(entry.created_at) : entry.created_at
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`passport-stamp stamp-social cursor-pointer ${isGrouped ? 'ml-4 border-l-2 border-pink-500/30 pl-4' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all border border-pink-500/10 hover:border-pink-500/30">

        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">
            {formatSocialAction(entry.event_type)}
          </h4>
          <p className="text-xs text-gray-400 truncate">{targetName}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-500">{timeAgo}</p>
          <ProcessingBadges entry={entry} />
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// STAMP VARIANT: GENERIC (fallback)
// =============================================================================

const StampGeneric: React.FC<Omit<PassportStampProps, 'groupId'>> = ({ entry, onClick, isGrouped }) => {
  const icon = getGenericIcon(entry.event_type)
  const title = formatEventType(entry.event_type)

  const timestamp = typeof entry.created_at === 'string' ? parseISO(entry.created_at) : entry.created_at
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`passport-stamp stamp-generic cursor-pointer ${isGrouped ? 'ml-4 border-l-2 border-gray-500/30 pl-4' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all border border-gray-500/10 hover:border-gray-500/30">

        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-gray-400">{entry.event_category}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-500">{timeAgo}</p>
          <ProcessingBadges entry={entry} />
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

const ProcessingBadges: React.FC<{ entry: PassportEntry }> = ({ entry }) => {
  return (
    <div className="flex items-center gap-1 mt-1">
      {entry.processed_by_mediaid && (
        <span className="inline-block w-4 h-4 rounded-full bg-cyan-500/30 border border-cyan-500/50" title="MediaID Processed">
          <span className="text-[8px] font-bold text-cyan-300">M</span>
        </span>
      )}
      {entry.processed_by_treasury && (
        <span className="inline-block w-4 h-4 rounded-full bg-green-500/30 border border-green-500/50" title="Treasury Processed">
          <span className="text-[8px] font-bold text-green-300">T</span>
        </span>
      )}
      {entry.processed_by_coliseum && (
        <span className="inline-block w-4 h-4 rounded-full bg-purple-500/30 border border-purple-500/50" title="Coliseum Processed">
          <span className="text-[8px] font-bold text-purple-300">C</span>
        </span>
      )}
    </div>
  )
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getStampType(eventType: string): 'music' | 'event' | 'treasury' | 'social' | 'generic' {
  if (eventType.startsWith('player.')) return 'music'
  if (eventType.startsWith('concierto.')) return 'event'
  if (eventType.startsWith('treasury.')) return 'treasury'
  if (eventType.startsWith('social.')) return 'social'
  return 'generic'
}

function getEventIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    'concierto.vote_cast': '🗳️',
    'concierto.event_attended': '🎉',
    'concierto.event_rsvp': '✅',
    'concierto.ticket_purchased': '🎫',
    'concierto.event_created': '🎪',
    'concierto.event_viewed': '👀',
  }
  return iconMap[eventType] || '🎭'
}

function getSocialIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    'social.user_followed': '👥',
    'social.user_unfollowed': '👋',
    'social.content_liked': '❤️',
    'social.content_commented': '💬',
    'social.content_shared': '🔗',
  }
  return iconMap[eventType] || '🌐'
}

function getGenericIcon(eventType: string): string {
  if (eventType.startsWith('mediaid.')) return '🧬'
  if (eventType.startsWith('access.')) return '🔐'
  if (eventType.startsWith('discovery.')) return '🔍'
  if (eventType.startsWith('system.')) return '⚙️'
  return '📋'
}

function formatEventType(eventType: string): string {
  return eventType
    .split('.')
    .map(part => part.replace(/_/g, ' '))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' · ')
}

function formatEventAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatTreasuryAction(eventType: string): string {
  const actionMap: Record<string, string> = {
    'treasury.transaction_created': 'Transaction Created',
    'treasury.payout_completed': 'Payout Received',
    'treasury.subscription_started': 'Subscription Started',
    'treasury.balance_updated': 'Balance Updated',
  }
  return actionMap[eventType] || formatEventType(eventType)
}

function formatSocialAction(eventType: string): string {
  const actionMap: Record<string, string> = {
    'social.user_followed': 'Followed',
    'social.user_unfollowed': 'Unfollowed',
    'social.content_liked': 'Liked',
    'social.content_commented': 'Commented on',
    'social.content_shared': 'Shared',
  }
  return actionMap[eventType] || formatEventType(eventType)
}
