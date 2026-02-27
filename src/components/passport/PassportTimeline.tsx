/**
 * =============================================================================
 * PASSPORT TIMELINE COMPONENT
 * =============================================================================
 *
 * Purpose: Chronological display of user's Passport events
 * Responsibility: Managing the list of events with grouping and organization
 *
 * Features:
 * - Groups events by date ("Today", "Yesterday", specific dates)
 * - Groups events by session (listening sessions)
 * - Renders PassportStamp components for each event
 * - Provides context for temporal navigation
 *
 * Used in: PassportViewer.tsx
 *
 * =============================================================================
 */

import React, { useMemo } from 'react'
import { PassportEntry, PassportStamp as PassportStampType } from '../../types/passport'
import { PassportStamp } from './PassportStamp'
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns'

interface PassportTimelineProps {
  entries: PassportEntry[]
  groupBy?: 'date' | 'session' | 'none'
  onStampClick?: (entry: PassportEntry) => void
}

interface TimelineGroup {
  label: string
  date: Date
  entries: PassportEntry[]
  session_id?: string
}

export const PassportTimeline: React.FC<PassportTimelineProps> = ({
  entries,
  groupBy = 'date',
  onStampClick
}) => {

  // Convert entries to stamp format and group them
  const groupedStamps = useMemo(() => {
    if (!entries || entries.length === 0) return []

    // Sort entries by timestamp (most recent first)
    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = typeof a.created_at === 'string' ? parseISO(a.created_at) : a.created_at
      const dateB = typeof b.created_at === 'string' ? parseISO(b.created_at) : b.created_at
      return dateB.getTime() - dateA.getTime()
    })

    if (groupBy === 'none') {
      return [{
        label: 'All Events',
        date: new Date(),
        entries: sortedEntries
      }]
    }

    if (groupBy === 'session') {
      return groupBySession(sortedEntries)
    }

    // Default: group by date
    return groupByDate(sortedEntries)
  }, [entries, groupBy])

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🧬</div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Passport History Yet</h3>
        <p className="text-sm text-gray-500">
          Your journey through Buckets Nation starts now. Interact with content to see your history appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="passport-timeline space-y-8">
      {groupedStamps.map((group, groupIndex) => (
        <div key={`${group.label}-${groupIndex}`} className="timeline-group">
          {/* Group Header */}
          <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 py-3 px-4 mb-4">
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wide">
              {group.label}
            </h3>
            <p className="text-xs text-gray-500">
              {group.entries.length} {group.entries.length === 1 ? 'event' : 'events'}
            </p>
          </div>

          {/* Stamps in this group */}
          <div className="space-y-3 px-4">
            {group.entries.map((entry, entryIndex) => (
              <PassportStamp
                key={entry.id}
                entry={entry}
                onClick={() => onStampClick?.(entry)}
                isGrouped={group.entries.length > 1}
                groupId={group.session_id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function groupByDate(entries: PassportEntry[]): TimelineGroup[] {
  const groups = new Map<string, PassportEntry[]>()

  entries.forEach(entry => {
    const date = typeof entry.created_at === 'string' ? parseISO(entry.created_at) : entry.created_at
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(entry)
  })

  return Array.from(groups.entries()).map(([dateKey, groupEntries]) => {
    const date = parseISO(dateKey)

    let label: string
    if (isToday(date)) {
      label = 'Today'
    } else if (isYesterday(date)) {
      label = 'Yesterday'
    } else {
      label = format(date, 'EEEE, MMMM d, yyyy')
    }

    return {
      label,
      date,
      entries: groupEntries
    }
  })
}

function groupBySession(entries: PassportEntry[]): TimelineGroup[] {
  const groups = new Map<string, PassportEntry[]>()
  const noSessionEntries: PassportEntry[] = []

  entries.forEach(entry => {
    if (entry.session_id) {
      if (!groups.has(entry.session_id)) {
        groups.set(entry.session_id, [])
      }
      groups.get(entry.session_id)!.push(entry)
    } else {
      noSessionEntries.push(entry)
    }
  })

  const sessionGroups: TimelineGroup[] = Array.from(groups.entries()).map(([sessionId, groupEntries], index) => {
    const firstEntry = groupEntries[0]
    const date = typeof firstEntry.created_at === 'string' ? parseISO(firstEntry.created_at) : firstEntry.created_at

    return {
      label: `Session ${index + 1} · ${formatDistanceToNow(date, { addSuffix: true })}`,
      date,
      entries: groupEntries,
      session_id: sessionId
    }
  })

  // Add ungrouped entries
  if (noSessionEntries.length > 0) {
    sessionGroups.push({
      label: 'Other Events',
      date: new Date(),
      entries: noSessionEntries
    })
  }

  return sessionGroups
}
