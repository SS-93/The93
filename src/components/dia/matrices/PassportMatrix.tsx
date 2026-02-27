/**
 * =============================================================================
 * PASSPORT MATRIX (Admin View)
 * =============================================================================
 *
 * Displays all Passport entries across all users
 * Admin-only view for monitoring universal event log
 *
 * FEATURES:
 * - View all passport entries system-wide
 * - Filter by user, event type, category, date range
 * - Export segmented data
 * - Share query results
 * - View user's full passport (opens PassportViewer for specific user)
 *
 * =============================================================================
 */

import React, { useState } from 'react'
import { DIAMatrix } from '../shared/DIAMatrix'
import { ColumnDef, FilterDef } from '../shared/types'
import { supabase } from '../../../lib/supabaseClient'
import { PassportViewer } from '../../passport/PassportViewer'

interface PassportEntry {
  id: string
  user_id: string
  session_id: string | null
  event_type: string
  event_category: string
  entity_type: string | null
  entity_id: string | null
  metadata: any
  processed_by_mediaid: boolean
  processed_by_treasury: boolean
  processed_by_coliseum: boolean
  dna_influence: any | null
  created_at: string
  // Joined user data
  user_email?: string
  user_display_name?: string
}

export function PassportMatrix() {
  const [data, setData] = useState<PassportEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showUserPassport, setShowUserPassport] = useState(false)

  // Fetch passport entries
  async function fetchPassportEntries() {
    setLoading(true)
    setError(null)

    try {
      console.log('📋 [PassportMatrix] Fetching passport entries...')

      // Fetch entries with user profiles joined
      const { data: entries, error: entriesError } = await supabase
        .from('passport_entries')
        .select(`
          *,
          profiles!passport_entries_user_id_fkey (
            email,
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (entriesError) {
        console.error('❌ [PassportMatrix] Error fetching entries:', entriesError)
        throw entriesError
      }

      console.log('✅ [PassportMatrix] Fetched', entries?.length, 'entries')

      // Map to flat structure
      const enriched = entries.map((entry: any) => ({
        ...entry,
        user_email: entry.profiles?.email || 'unknown',
        user_display_name: entry.profiles?.display_name || null
      }))

      setData(enriched)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  React.useEffect(() => {
    fetchPassportEntries()
  }, [])

  // Column definitions
  const columns: ColumnDef<PassportEntry>[] = [
    {
      id: 'user_email',
      label: 'User',
      sortable: true,
      width: '200px',
      render: (entry) => (
        <div>
          <div className="text-sm font-medium text-white">{entry.user_email}</div>
          {entry.user_display_name && (
            <div className="text-xs text-slate-400">{entry.user_display_name}</div>
          )}
        </div>
      )
    },
    {
      id: 'event_type',
      label: 'Event Type',
      sortable: true,
      width: '220px',
      render: (entry) => (
        <div>
          <div className="text-sm text-cyan-300 font-mono">{entry.event_type}</div>
          <div className="text-xs text-slate-500">{entry.event_category}</div>
        </div>
      )
    },
    {
      id: 'entity_type',
      label: 'Entity',
      sortable: true,
      width: '150px',
      render: (entry) => (
        <div className="text-sm text-slate-300">
          {entry.entity_type ? (
            <>
              <div className="font-medium">{entry.entity_type}</div>
              {entry.entity_id && (
                <div className="text-xs text-slate-500 font-mono truncate">
                  {entry.entity_id.slice(0, 8)}...
                </div>
              )}
            </>
          ) : (
            <span className="text-slate-600">N/A</span>
          )}
        </div>
      )
    },
    {
      id: 'processed',
      label: 'Processed',
      sortable: false,
      width: '180px',
      render: (entry) => (
        <div className="flex items-center space-x-1 text-xs">
          <ProcessBadge label="M" processed={entry.processed_by_mediaid} />
          <ProcessBadge label="T" processed={entry.processed_by_treasury} />
          <ProcessBadge label="C" processed={entry.processed_by_coliseum} />
        </div>
      )
    },
    {
      id: 'dna_influence',
      label: 'DNA',
      sortable: false,
      width: '80px',
      render: (entry) => (
        entry.dna_influence ? (
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            ✓
          </span>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )
      )
    },
    {
      id: 'created_at',
      label: 'Timestamp',
      sortable: true,
      width: '180px',
      render: (entry) => (
        <div className="text-xs text-slate-400">
          {new Date(entry.created_at).toLocaleString()}
        </div>
      )
    }
  ]

  // Filter definitions
  const filters: FilterDef[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search user email, event type...'
    },
    {
      id: 'event_category',
      label: 'Category',
      type: 'select',
      options: [
        { value: '', label: 'All Categories' },
        { value: 'trinity', label: 'Trinity' },
        { value: 'interaction', label: 'Interaction' },
        { value: 'transaction', label: 'Transaction' },
        { value: 'social', label: 'Social' },
        { value: 'access', label: 'Access' },
        { value: 'system', label: 'System' }
      ]
    },
    {
      id: 'processed',
      label: 'Processing Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'processed', label: 'Processed' },
        { value: 'unprocessed', label: 'Unprocessed' }
      ]
    }
  ]

  // Expandable detail panel
  function renderDetail(entry: PassportEntry) {
    return (
      <div className="p-4 space-y-4 bg-slate-900/50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Entry ID" value={entry.id} />
          <DetailRow label="User ID" value={entry.user_id} />
          <DetailRow label="Session ID" value={entry.session_id || 'N/A'} />
          <DetailRow label="Entity ID" value={entry.entity_id || 'N/A'} />
        </div>

        {/* Metadata */}
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Metadata:</p>
            <pre className="text-xs bg-slate-950 p-3 rounded border border-slate-700 text-cyan-300 overflow-x-auto max-h-40">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* DNA Influence */}
        {entry.dna_influence && (
          <div>
            <p className="text-xs text-slate-400 mb-2">DNA Influence:</p>
            <pre className="text-xs bg-slate-950 p-3 rounded border border-cyan-700/50 text-cyan-300 overflow-x-auto">
              {JSON.stringify(entry.dna_influence, null, 2)}
            </pre>
          </div>
        )}

        {/* View User's Full Passport */}
        <button
          onClick={() => {
            setSelectedUserId(entry.user_id)
            setShowUserPassport(true)
          }}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-300 text-sm font-medium transition-colors"
        >
          📋 View User's Full Passport
        </button>
      </div>
    )
  }

  // Export passport data
  function handleExport() {
    // TODO: Implement CSV export
    console.log('📥 Exporting passport data...')
    const csv = convertToCSV(data)
    downloadCSV(csv, 'passport_entries.csv')
  }

  return (
    <>
      <DIAMatrix<PassportEntry>
        title="Passport Entries"
        data={data}
        columns={columns}
        filters={filters}
        loading={loading}
        error={error}
        expandableDetail={renderDetail}
        onRefresh={fetchPassportEntries}
        onExport={handleExport}
        stats={[
          {
            label: 'Total Events',
            value: data.length,
            color: 'cyan'
          },
          {
            label: 'Unique Users',
            value: new Set(data.map(e => e.user_id)).size,
            color: 'blue'
          },
          {
            label: 'Processed',
            value: data.filter(e => e.processed_by_mediaid && e.processed_by_treasury && e.processed_by_coliseum).length,
            color: 'green'
          },
          {
            label: 'With DNA',
            value: data.filter(e => e.dna_influence).length,
            color: 'purple'
          }
        ]}
      />

      {/* User Passport Viewer Modal */}
      {showUserPassport && selectedUserId && (
        <PassportViewer
          userId={selectedUserId}
          onClose={() => {
            setShowUserPassport(false)
            setSelectedUserId(null)
          }}
        />
      )}
    </>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function ProcessBadge({ label, processed }: { label: string; processed: boolean }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
        processed
          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
          : 'bg-slate-700/50 text-slate-500 border border-slate-700'
      }`}
    >
      {label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm text-slate-300 font-mono break-all">{value}</p>
    </div>
  )
}

// =============================================================================
// CSV EXPORT UTILITIES
// =============================================================================

function convertToCSV(data: PassportEntry[]): string {
  const headers = [
    'Entry ID',
    'User Email',
    'Event Type',
    'Event Category',
    'Entity Type',
    'Entity ID',
    'Processed MediaID',
    'Processed Treasury',
    'Processed Coliseum',
    'Has DNA Influence',
    'Timestamp'
  ]

  const rows = data.map(entry => [
    entry.id,
    entry.user_email,
    entry.event_type,
    entry.event_category,
    entry.entity_type || '',
    entry.entity_id || '',
    entry.processed_by_mediaid ? 'Yes' : 'No',
    entry.processed_by_treasury ? 'Yes' : 'No',
    entry.processed_by_coliseum ? 'Yes' : 'No',
    entry.dna_influence ? 'Yes' : 'No',
    new Date(entry.created_at).toISOString()
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
