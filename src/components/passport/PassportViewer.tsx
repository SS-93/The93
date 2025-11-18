/**
 * =============================================================================
 * PASSPORT VIEWER
 * =============================================================================
 *
 * Futuristic DNA lab meets Minority Report interface
 * Displays user's complete interaction history across Buckets Nation
 *
 * AESTHETIC:
 * - Dark theme with cyan/blue accents (DNA sequencing vibe)
 * - Framer Motion for smooth animations and depth simulation
 * - Holographic/glass morphism effects
 * - Scanning lines and particle effects
 * - Timeline visualization with DNA helix metaphor
 *
 * FEATURES:
 * - Event timeline (chronological or grouped)
 * - DNA influence visualization per event
 * - System filters (MediaID, Treasury, Coliseum)
 * - Category filters (interaction, transaction, social)
 * - Export functionality
 * - Real-time updates
 *
 * TABS:
 * 1. Timeline - Chronological event feed
 * 2. DNA Log - MediaID interactions & DNA evolution
 * 3. Coliseum - Activity & achievements
 * 4. Treasury - Wallet & transactions (pending)
 *
 * =============================================================================
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { usePassport } from '../../hooks/usePassport'
import { PassportEntry, PassportEventCategory } from '../../types/passport'

interface PassportViewerProps {
  userId?: string  // For admin viewing other users
  onClose?: () => void
}

type TabType = 'timeline' | 'dna' | 'coliseum' | 'treasury'

export function PassportViewer({ userId, onClose }: PassportViewerProps) {
  const navigate = useNavigate()
  const { fetchEntries, loading, error } = usePassport()
  const [entries, setEntries] = useState<PassportEntry[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('timeline')
  const [selectedCategory, setSelectedCategory] = useState<PassportEventCategory | 'all'>('all')
  const [isExporting, setIsExporting] = useState(false)

  // Handler for back button
  const handleBack = () => {
    if (onClose) {
      onClose() // Modal mode (from DIA admin)
    } else {
      navigate(-1) // Route mode (go back to previous page)
    }
  }

  // Fetch entries on mount
  useEffect(() => {
    loadEntries()
  }, [selectedCategory])

  async function loadEntries() {
    try {
      const result = await fetchEntries({
        limit: 100,
        event_categories: selectedCategory !== 'all' ? [selectedCategory] : undefined
      })
      setEntries(result.entries)
    } catch (err) {
      console.error('❌ [PassportViewer] Error loading entries:', err)
    }
  }

  // Export passport data
  async function handleExport() {
    setIsExporting(true)
    try {
      // TODO: Implement CSV/JSON export
      console.log('📥 Exporting passport data...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsExporting(false)
    }
  }

  // Filter entries by active tab
  const filteredEntries = entries.filter(entry => {
    if (activeTab === 'timeline') return true
    if (activeTab === 'dna') return entry.event_category === 'trinity' || entry.event_type.startsWith('mediaid.')
    if (activeTab === 'coliseum') return entry.event_type.startsWith('coliseum.') || entry.event_category === 'interaction'
    if (activeTab === 'treasury') return entry.event_type.startsWith('treasury.') || entry.event_category === 'transaction'
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-6xl h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scanning Line Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(6, 182, 212, 0.1) 50%, transparent 100%)',
            backgroundSize: '100% 200px'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '0% 100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        {/* Header */}
        <div className="relative border-b border-cyan-500/30 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                🧬
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">Passport</h1>
                <p className="text-sm text-cyan-400">Universal Interaction Ledger</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-300 transition-colors disabled:opacity-50"
              >
                <span>📥</span>
                <span className="text-sm font-medium">{isExporting ? 'Exporting...' : 'Export'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300 transition-colors"
              >
                <span className="text-lg">←</span>
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 px-6 pb-4">
            {[
              { id: 'timeline', label: 'Timeline', icon: '📅' },
              { id: 'dna', label: 'DNA Log', icon: '🧬' },
              { id: 'coliseum', label: 'Coliseum', icon: '🏆' },
              { id: 'treasury', label: 'Treasury', icon: '💰' }
            ].map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800/80 hover:text-slate-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-cyan-500/20 rounded-lg -z-10"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-b border-cyan-500/20 bg-slate-900/30 backdrop-blur px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Events" value={entries.length} color="cyan" />
            <StatCard
              label="DNA Processed"
              value={entries.filter(e => e.processed_by_mediaid).length}
              color="blue"
            />
            <StatCard
              label="Activity Score"
              value={entries.filter(e => e.processed_by_coliseum).length}
              color="purple"
            />
            <StatCard
              label="Treasury Events"
              value={entries.filter(e => e.event_category === 'transaction').length}
              color="green"
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative h-[calc(100%-280px)] overflow-y-auto">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} />
          ) : filteredEntries.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <EventTimeline entries={filteredEntries} />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-300',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-300',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-300'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative p-4 rounded-lg border bg-gradient-to-br backdrop-blur ${colorMap[color as keyof typeof colorMap]}`}
    >
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <motion.p
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-2xl font-bold"
      >
        {value.toLocaleString()}
      </motion.p>
    </motion.div>
  )
}

function EventTimeline({ entries }: { entries: PassportEntry[] }) {
  return (
    <div className="p-6 space-y-4">
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => (
          <EventCard key={entry.id} entry={entry} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function EventCard({ entry, index }: { entry: PassportEntry; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Get color based on event category
  const categoryColors = {
    trinity: 'border-cyan-500/30 bg-cyan-500/5',
    interaction: 'border-blue-500/30 bg-blue-500/5',
    transaction: 'border-green-500/30 bg-green-500/5',
    social: 'border-purple-500/30 bg-purple-500/5',
    access: 'border-yellow-500/30 bg-yellow-500/5',
    system: 'border-slate-500/30 bg-slate-500/5'
  }

  const categoryColor = categoryColors[entry.event_category as keyof typeof categoryColors] || categoryColors.system

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.02 }}
      layout
      className={`relative p-4 rounded-lg border backdrop-blur ${categoryColor} hover:bg-opacity-20 transition-all cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <EventIcon eventType={entry.event_type} category={entry.event_category} />
            <div>
              <h4 className="text-sm font-semibold text-white">{formatEventType(entry.event_type)}</h4>
              <p className="text-xs text-slate-400">{formatEventCategory(entry.event_category)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <span>{new Date(entry.created_at).toLocaleString()}</span>
            {entry.session_id && <span>Session: {entry.session_id.slice(0, 8)}</span>}
          </div>
        </div>

        {/* DNA Influence Badge */}
        {entry.dna_influence && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-xs text-cyan-300 font-medium"
          >
            DNA+
          </motion.div>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <div className="space-y-2">
              <DetailRow label="Event ID" value={entry.id} />
              <DetailRow label="Entity Type" value={entry.entity_type || 'N/A'} />
              <DetailRow label="Entity ID" value={entry.entity_id || 'N/A'} />

              {/* Processing Status */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Processed:</span>
                <ProcessBadge label="MediaID" processed={entry.processed_by_mediaid} />
                <ProcessBadge label="Treasury" processed={entry.processed_by_treasury} />
                <ProcessBadge label="Coliseum" processed={entry.processed_by_coliseum} />
              </div>

              {/* Metadata */}
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-2">Metadata:</p>
                  <pre className="text-xs bg-slate-950/50 p-3 rounded border border-slate-700/50 text-cyan-300 overflow-x-auto">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EventIcon({ eventType, category }: { eventType: string; category: string }) {
  const icons: Record<string, string> = {
    player: '🎵',
    mediaid: '🧬',
    treasury: '💰',
    coliseum: '🏆',
    concierto: '🎤',
    social: '💬',
    access: '🔐',
    system: '⚙️'
  }

  const system = eventType.split('.')[0]
  const icon = icons[system] || icons[category] || '📋'

  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-lg">
      {icon}
    </div>
  )
}

function ProcessBadge({ label, processed }: { label: string; processed: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      processed
        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
        : 'bg-slate-700/50 text-slate-500 border border-slate-700'
    }`}>
      {label} {processed ? '✓' : '○'}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start text-xs">
      <span className="text-slate-400 w-24">{label}:</span>
      <span className="text-slate-300 flex-1 font-mono break-all">{value}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
      />
    </div>
  )
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-red-400 font-semibold mb-2">Error Loading Passport</p>
        <p className="text-sm text-slate-400">{error.message}</p>
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: TabType }) {
  const messages = {
    timeline: 'No events recorded yet',
    dna: 'No DNA evolution events',
    coliseum: 'No activity tracked',
    treasury: 'No transactions yet'
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          📭
        </motion.div>
        <p className="text-slate-400 text-lg">{messages[tab]}</p>
        <p className="text-slate-500 text-sm mt-2">Start interacting to build your Passport</p>
      </div>
    </div>
  )
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatEventType(eventType: string): string {
  return eventType
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' → ')
}

function formatEventCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}
