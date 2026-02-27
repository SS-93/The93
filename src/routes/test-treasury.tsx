/**
 * Treasury Test Page (Enhanced)
 * 
 * Manual testing interface for Treasury Protocol functions:
 * 1. Add Funds to user accounts
 * 2. Connect to test events for split application
 * 3. Test user host/artist status
 * 4. View Passport & Wallet Logs
 * 
 * Access at: http://localhost:3000/test-treasury
 */

import React, { useState, useEffect, useCallback } from 'react'

// =============================================================================
// CONSTANTS
// =============================================================================

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// Pre-configured test accounts
const TEST_ACCOUNTS = {
  host: { id: '63dd0fbb-172c-47c2-b0c7-4a1582a93d7e', label: '🏠 Host' },
  artistI: { id: '23e4399e-b504-42ca-a9f6-71ac4ca1300c', label: '🎤 Artist I' },
  artistII: { id: 'cae86905-fbcf-44fe-ac6f-7b1aae30e5f1', label: '🎤 Artist II' },
}

const TEST_EVENT_ID = '488a252a-1ed1-4369-b79b-ec55f1a51566'

// =============================================================================
// TYPES
// =============================================================================

interface SplitResult {
  userId: string
  role: string
  amountCents: number
  percent: number
  description: string
  correlationId: string
}

interface UserStatus {
  profile: any
  badges: any[]
  primaryBadge: string | null
  isHost: boolean
  isArtist: boolean
  hostedEvents: any[]
  artistEvents: any[]
  balance: number
  balanceFormatted: string
  passportEntryCount: number
}

interface EventData {
  event: any
  host: any
  artists: any[]
  splitRules: any[]
  partners: any[]
  hasCustomRules: boolean
}

interface LogData {
  passportEntries: any[]
  ledgerEntries: any[]
  summary: {
    passportCount: number
    ledgerCount: number
    totalCredits: number
    totalDebits: number
    netBalance: number
    categoryCounts: Record<string, number>
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TestTreasuryPage() {
  // Core state
  const [activeUserId, setActiveUserId] = useState(TEST_ACCOUNTS.host.id)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Add Funds state
  const [fundAmount, setFundAmount] = useState('100.00')
  const [fundDescription, setFundDescription] = useState('')

  // Event state
  const [eventId, setEventId] = useState(TEST_EVENT_ID)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [splitAmount, setSplitAmount] = useState('50.00')
  const [splitResults, setSplitResults] = useState<SplitResult[]>([])

  // User status state
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [statusUserId, setStatusUserId] = useState(TEST_ACCOUNTS.host.id)

  // Logs state
  const [logData, setLogData] = useState<LogData | null>(null)
  const [activeLogTab, setActiveLogTab] = useState<'passport' | 'ledger'>('passport')

  // Active section for mobile
  const [activeSection, setActiveSection] = useState<string>('funds')

  // ─────────────────────────────────────────────────────────────────────────────
  // API HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const apiCall = useCallback(async (method: string, path: string, body?: any) => {
    const opts: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(`${API_URL}${path}`, opts)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
    return data
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // ADD FUNDS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddFunds = async () => {
    if (!activeUserId) { setMessage('❌ Select a user first'); return }
    const cents = Math.round(parseFloat(fundAmount) * 100)
    if (isNaN(cents) || cents <= 0) { setMessage('❌ Enter a valid amount'); return }

    setLoading(true)
    setMessage(`💰 Adding $${fundAmount} to account...`)

    try {
      const result = await apiCall('POST', '/api/treasury/add-funds', {
        userId: activeUserId,
        amountCents: cents,
        description: fundDescription || undefined,
      })
      setMessage(`✅ Funds added! Balance: $${(result.newBalance / 100).toFixed(2)} | Correlation: ${result.correlationId}`)
      // Auto-refresh status and logs
      loadUserStatus(activeUserId)
      loadLogs(activeUserId)
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONNECT EVENT
  // ─────────────────────────────────────────────────────────────────────────────

  const handleConnectEvent = async () => {
    if (!eventId) { setMessage('❌ Enter an event ID'); return }
    setLoading(true)
    setMessage('🔗 Loading event details...')

    try {
      const result = await apiCall('POST', '/api/treasury/connect-event', { eventId })
      setEventData(result)
      setMessage(`✅ Connected to: ${result.event.title} (${result.artists.length} artists)`)
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleApplySplits = async () => {
    if (!eventId || !activeUserId) { setMessage('❌ Connect event and select user first'); return }
    const cents = Math.round(parseFloat(splitAmount) * 100)
    if (isNaN(cents) || cents <= 0) { setMessage('❌ Enter a valid split amount'); return }

    setLoading(true)
    setMessage(`⚡ Applying splits for $${splitAmount}...`)

    try {
      const result = await apiCall('POST', '/api/treasury/apply-splits', {
        eventId,
        amountCents: cents,
        buyerUserId: activeUserId,
      })
      setSplitResults(result.splits)
      setMessage(`✅ ${result.splitsCreated} splits applied! Purchase: ${result.purchaseId}`)
      // Auto-refresh logs
      loadLogs(activeUserId)
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // USER STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  const loadUserStatus = useCallback(async (userId: string) => {
    try {
      const result = await apiCall('GET', `/api/treasury/user-status/${userId}`)
      setUserStatus(result)
    } catch (err: any) {
      console.error('Failed to load user status:', err)
    }
  }, [apiCall])

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGS
  // ─────────────────────────────────────────────────────────────────────────────

  const loadLogs = useCallback(async (userId: string) => {
    try {
      const result = await apiCall('GET', `/api/treasury/logs/${userId}`)
      setLogData(result)
    } catch (err: any) {
      console.error('Failed to load logs:', err)
    }
  }, [apiCall])

  // ─────────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeUserId) {
      loadUserStatus(activeUserId)
      loadLogs(activeUserId)
    }
  }, [activeUserId, loadUserStatus, loadLogs])

  useEffect(() => {
    if (statusUserId) {
      loadUserStatus(statusUserId)
    }
  }, [statusUserId, loadUserStatus])

  // ─────────────────────────────────────────────────────────────────────────────
  // FORMAT HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`
  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'financial': return 'text-green-400'
      case 'system': return 'text-blue-400'
      case 'interaction': return 'text-purple-400'
      case 'content': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* ─── HEADER ─── */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">🏦 Treasury Test Console</h1>
          <p className="text-gray-400 text-sm">
            Add funds, apply splits, check user status, and view logs
          </p>
        </div>

        {/* ─── ACTIVE USER SELECT ─── */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-400 font-semibold">ACTIVE USER:</span>
            {Object.entries(TEST_ACCOUNTS).map(([key, acct]) => (
              <button
                key={key}
                onClick={() => setActiveUserId(acct.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${activeUserId === acct.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                {acct.label}
              </button>
            ))}
            <input
              type="text"
              value={activeUserId}
              onChange={(e) => setActiveUserId(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm font-mono text-white"
              placeholder="Custom user ID..."
            />
          </div>
          {userStatus && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-gray-300">
                <strong>{userStatus.profile?.display_name || 'Unknown'}</strong>
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${userStatus.isHost ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-gray-700 text-gray-500'
                }`}>
                {userStatus.isHost ? '🏠 HOST' : 'Not Host'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${userStatus.isArtist ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-gray-700 text-gray-500'
                }`}>
                {userStatus.isArtist ? '🎤 ARTIST' : 'Not Artist'}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/50">
                💰 {userStatus.balanceFormatted}
              </span>
              <span className="text-gray-500">
                {userStatus.passportEntryCount} passport entries
              </span>
            </div>
          )}
        </div>

        {/* ─── MESSAGE BAR ─── */}
        {message && (
          <div className={`p-3 rounded-lg mb-6 text-sm font-medium ${message.startsWith('✅') ? 'bg-green-500/20 border border-green-500/50 text-green-300' :
            message.startsWith('❌') ? 'bg-red-500/20 border border-red-500/50 text-red-300' :
              'bg-blue-500/20 border border-blue-500/50 text-blue-300'
            }`}>
            {message}
          </div>
        )}

        {/* ─── SECTION TABS ─── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { key: 'funds', label: '💰 Add Funds' },
            { key: 'event', label: '🎪 Event & Splits' },
            { key: 'status', label: '👤 User Status' },
            { key: 'logs', label: '📋 Logs' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeSection === tab.key
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 1: ADD FUNDS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'funds' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">💰 Add Funds to Account</h2>
              <p className="text-gray-400 text-sm mb-4">
                Creates double-entry ledger entries (debit platform reserve, credit user).
                Balance will reflect in the <a href="/wallet" className="text-blue-400 underline hover:text-blue-300">Wallet page</a>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-lg font-mono"
                    placeholder="100.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={fundDescription}
                    onChange={(e) => setFundDescription(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="Test funds for split testing..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddFunds}
                  disabled={loading}
                  className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-all shadow-lg shadow-green-500/25"
                >
                  {loading ? 'Adding...' : `Add ${fundAmount ? `$${fundAmount}` : 'Funds'}`}
                </button>
                <a
                  href="/wallet"
                  className="px-6 py-2.5 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all inline-flex items-center gap-2"
                >
                  👛 View Wallet
                </a>
              </div>
            </div>

            {/* Quick add presets */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">QUICK ADD</h3>
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100, 250, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => { setFundAmount(amt.toFixed(2)); }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-mono transition-all"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 2: EVENT & SPLITS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'event' && (
          <div className="space-y-6">
            {/* Connect Event */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">🎪 Connect to Test Event</h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
                  placeholder="Event ID..."
                />
                <button
                  onClick={handleConnectEvent}
                  disabled={loading}
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Loading...' : '🔗 Connect'}
                </button>
              </div>

              {/* Event Details */}
              {eventData && (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{eventData.event.title}</h3>
                        <div className="text-sm text-gray-400 space-y-1 mt-1">
                          <div>📍 {eventData.event.location || 'No location'}</div>
                          <div>🏷️ Code: <span className="font-mono text-yellow-400">{eventData.event.code}</span></div>
                          <div>📊 Status: <span className="text-blue-400">{eventData.event.status}</span></div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${eventData.hasCustomRules ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                        {eventData.hasCustomRules ? 'Custom Rules' : 'Default Rules'}
                      </span>
                    </div>

                    {/* Host */}
                    {eventData.host && (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <span className="text-gray-400">Host:</span>
                        <span className="text-orange-400 font-medium">🏠 {eventData.host.display_name}</span>
                        <span className="text-gray-600 font-mono text-xs">{eventData.host.id?.slice(0, 8)}...</span>
                      </div>
                    )}

                    {/* Artists */}
                    <div className="mb-3">
                      <span className="text-sm text-gray-400">Artists ({eventData.artists.length}):</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {eventData.artists.map((a: any, i: number) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium border border-purple-500/30">
                            🎤 {a.name} <span className="text-gray-500 font-mono">{a.userId?.slice(0, 8)}</span>
                          </span>
                        ))}
                        {eventData.artists.length === 0 && (
                          <span className="text-gray-500 text-xs italic">No confirmed artists</span>
                        )}
                      </div>

                      {/* Connect Artist */}
                      <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-dashed border-gray-600">
                        <div className="text-xs text-gray-400 mb-2 font-medium">➕ Connect Artist to Event:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(TEST_ACCOUNTS).filter((a: any) => a.label.startsWith('Artist')).map((artist: any) => {
                            const isConnected = eventData.artists.some((a: any) => a.userId === artist.id);
                            return (
                              <button
                                key={artist.id}
                                disabled={loading || isConnected}
                                onClick={async () => {
                                  setLoading(true);
                                  try {
                                    const res = await fetch(`${API_URL}/api/treasury/connect-artist`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        eventId: eventId,
                                        artistUserId: artist.id,
                                        artistName: artist.label
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setResult({ success: true, data, message: data.alreadyConnected ? `${artist.label} already connected` : `✅ Connected ${artist.label} to event` });
                                      // Refresh event to show updated artists
                                      handleConnectEvent();
                                    } else {
                                      setResult({ success: false, data, message: data.error || 'Failed to connect artist' });
                                    }
                                  } catch (err: any) {
                                    setResult({ success: false, data: null, message: err.message });
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${isConnected
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                                  }`}
                              >
                                {isConnected ? `✅ ${artist.label}` : `🎤 Connect ${artist.label}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Split Rules */}
                    <div>
                      <span className="text-sm text-gray-400">Split Rules:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {eventData.splitRules.map((r: any, i: number) => (
                          <span key={i} className="px-3 py-1 bg-gray-700 rounded text-sm font-medium">
                            {r.role === 'artist' ? '🎤' : r.role === 'host' ? '🏠' : r.role === 'platform' ? '🏗️' : '🤝'}
                            {' '}{r.role}: <span className="text-yellow-400">{r.percent}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply Splits */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-md font-semibold mb-3">⚡ Apply Revenue Splits</h3>
                    <div className="flex gap-3 items-end">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Purchase Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={splitAmount}
                          onChange={(e) => setSplitAmount(e.target.value)}
                          className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono"
                        />
                      </div>
                      <button
                        onClick={handleApplySplits}
                        disabled={loading}
                        className="px-5 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
                      >
                        {loading ? 'Applying...' : '⚡ Apply Splits'}
                      </button>
                    </div>

                    {/* Preview: what the split would look like */}
                    {eventData.splitRules.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        Preview: {eventData.splitRules.map((r: any) =>
                          `${r.role} → $${((parseFloat(splitAmount || '0') * r.percent / 100)).toFixed(2)} (${r.percent}%)`
                        ).join(' • ')}
                      </div>
                    )}
                  </div>

                  {/* Split Results */}
                  {splitResults.length > 0 && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-green-500/30">
                      <h3 className="text-md font-semibold mb-3 text-green-400">✅ Split Results</h3>
                      <div className="space-y-2">
                        {splitResults.map((s, i) => (
                          <div key={i} className="flex justify-between items-center bg-gray-800 rounded p-3 text-sm">
                            <div>
                              <span className={`font-medium ${s.role === 'artist' ? 'text-purple-400' :
                                s.role === 'host' ? 'text-orange-400' :
                                  s.role === 'partner' ? 'text-cyan-400' : 'text-gray-400'
                                }`}>
                                {s.role === 'artist' ? '🎤' : s.role === 'host' ? '🏠' : '🤝'} {s.role}
                              </span>
                              <span className="text-gray-500 ml-2 font-mono text-xs">{s.userId?.slice(0, 12)}...</span>
                            </div>
                            <div className="text-right">
                              <span className="text-green-400 font-mono font-semibold">{formatCents(s.amountCents)}</span>
                              <span className="text-gray-500 ml-2 text-xs">({s.percent?.toFixed(1)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 3: USER STATUS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'status' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">👤 User Status Inspector</h2>

              {/* Quick switch */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(TEST_ACCOUNTS).map(([key, acct]) => (
                  <button
                    key={key}
                    onClick={() => setStatusUserId(acct.id)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${statusUserId === acct.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {acct.label}
                  </button>
                ))}
                <input
                  type="text"
                  value={statusUserId}
                  onChange={(e) => setStatusUserId(e.target.value)}
                  className="flex-1 min-w-[200px] bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm font-mono text-white"
                />
              </div>

              {userStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profile Card */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">PROFILE</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name</span>
                        <span className="text-white font-medium">{userStatus.profile?.display_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Primary Badge</span>
                        <span className="text-yellow-400 font-medium">{userStatus.primaryBadge || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Role</span>
                        <span className="text-white">{userStatus.profile?.role || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wallet Balance</span>
                        <span className="text-green-400 font-mono font-semibold">{userStatus.balanceFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Passport Entries</span>
                        <span className="text-blue-400">{userStatus.passportEntryCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">BADGES</h3>
                    {userStatus.badges.length > 0 ? (
                      <div className="space-y-2">
                        {userStatus.badges.map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${b.is_active ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                              <span className="text-white font-medium capitalize">{b.badge_type}</span>
                              {b.is_primary && <span className="text-xs text-yellow-400">⭐ Primary</span>}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${b.verification_status === 'verified' ? 'bg-green-500/20 text-green-400' :
                              b.verification_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                              {b.verification_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">No badges</div>
                    )}
                  </div>

                  {/* Hosted Events */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">
                      🏠 HOSTED EVENTS ({userStatus.hostedEvents.length})
                    </h3>
                    {userStatus.hostedEvents.length > 0 ? (
                      <div className="space-y-2">
                        {userStatus.hostedEvents.map((e: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-white truncate mr-2">{e.title}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-gray-500 font-mono text-xs">{e.code}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${e.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                                }`}>{e.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">No hosted events</div>
                    )}
                  </div>

                  {/* Artist Events */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">
                      🎤 ARTIST EVENTS ({userStatus.artistEvents.length})
                    </h3>
                    {userStatus.artistEvents.length > 0 ? (
                      <div className="space-y-2">
                        {userStatus.artistEvents.map((e: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-white truncate mr-2">{e.events?.title || e.artist_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${e.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>{e.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">No artist events</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 4: PASSPORT & WALLET LOGS
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'logs' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <h2 className="text-xl font-semibold">📋 Passport & Wallet Logs</h2>
                <div className="flex gap-2">
                  <a
                    href="/wallet"
                    className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded text-sm font-medium hover:bg-green-500/30 transition-all border border-green-500/30"
                  >
                    👛 Open Wallet
                  </a>
                  <button
                    onClick={() => loadLogs(activeUserId)}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-sm font-medium hover:bg-blue-500/30 transition-all border border-blue-500/30"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* Summary Bar */}
              {logData && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="bg-gray-900 rounded p-3 text-center border border-gray-700">
                    <div className="text-lg font-bold text-blue-400">{logData.summary.passportCount}</div>
                    <div className="text-xs text-gray-500">Passport</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center border border-gray-700">
                    <div className="text-lg font-bold text-purple-400">{logData.summary.ledgerCount}</div>
                    <div className="text-xs text-gray-500">Ledger</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center border border-gray-700">
                    <div className="text-lg font-bold text-green-400">{formatCents(logData.summary.totalCredits)}</div>
                    <div className="text-xs text-gray-500">Credits</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center border border-gray-700">
                    <div className="text-lg font-bold text-red-400">{formatCents(logData.summary.totalDebits)}</div>
                    <div className="text-xs text-gray-500">Debits</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center border border-gray-700">
                    <div className={`text-lg font-bold ${logData.summary.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCents(logData.summary.netBalance)}
                    </div>
                    <div className="text-xs text-gray-500">Net Balance</div>
                  </div>
                </div>
              )}

              {/* Log Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-700 pb-2">
                <button
                  onClick={() => setActiveLogTab('passport')}
                  className={`px-4 py-1.5 rounded-t text-sm font-medium transition-all ${activeLogTab === 'passport'
                    ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  🛂 Passport Entries ({logData?.summary.passportCount || 0})
                </button>
                <button
                  onClick={() => setActiveLogTab('ledger')}
                  className={`px-4 py-1.5 rounded-t text-sm font-medium transition-all ${activeLogTab === 'ledger'
                    ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  📒 Ledger Entries ({logData?.summary.ledgerCount || 0})
                </button>
              </div>

              {/* Passport Entries */}
              {activeLogTab === 'passport' && logData && (
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {logData.passportEntries.length === 0 ? (
                    <div className="text-gray-500 text-sm italic p-4 text-center">No passport entries found</div>
                  ) : (
                    logData.passportEntries.map((entry: any, i: number) => (
                      <div key={i} className="bg-gray-900 rounded p-3 border border-gray-700 hover:border-gray-600 transition-all text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className={`font-medium ${getCategoryColor(entry.event_category)}`}>
                              {entry.event_type}
                            </span>
                            {entry.entity_type && (
                              <span className="ml-2 text-gray-500 text-xs">
                                [{entry.entity_type}: {entry.entity_id?.slice(0, 8)}]
                              </span>
                            )}
                          </div>
                          <span className="text-gray-600 text-xs flex-shrink-0 ml-2">
                            {formatTime(entry.created_at)}
                          </span>
                        </div>
                        {entry.metadata && (
                          <div className="mt-1 text-xs text-gray-500 font-mono truncate">
                            {typeof entry.metadata === 'object'
                              ? Object.entries(entry.metadata)
                                .filter(([k]) => !['source', 'version'].includes(k))
                                .slice(0, 4)
                                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 30) : String(v).slice(0, 30)}`)
                                .join(' | ')
                              : String(entry.metadata).slice(0, 100)
                            }
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Ledger Entries */}
              {activeLogTab === 'ledger' && logData && (
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {logData.ledgerEntries.length === 0 ? (
                    <div className="text-gray-500 text-sm italic p-4 text-center">No ledger entries found</div>
                  ) : (
                    logData.ledgerEntries.map((entry: any, i: number) => (
                      <div key={i} className="bg-gray-900 rounded p-3 border border-gray-700 hover:border-gray-600 transition-all text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className={`font-mono font-semibold ${entry.type === 'credit' ? 'text-green-400' : 'text-red-400'
                              }`}>
                              {entry.type === 'credit' ? '+' : '-'}{formatCents(entry.amount_cents)}
                            </span>
                            <span className="ml-2 text-gray-400">{entry.event_source}</span>
                            {entry.description && (
                              <span className="ml-2 text-gray-500 text-xs">{entry.description}</span>
                            )}
                          </div>
                          <span className="text-gray-600 text-xs flex-shrink-0 ml-2">
                            {formatTime(entry.created_at)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 font-mono">
                          corr: {entry.correlation_id?.slice(0, 30)} | ref: {entry.reference_id?.slice(0, 20)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Category Breakdown */}
              {logData && Object.keys(logData.summary.categoryCounts).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">PASSPORT CATEGORIES</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(logData.summary.categoryCounts).map(([cat, count]) => (
                      <span key={cat} className={`px-2 py-1 rounded text-xs font-medium bg-gray-900 border border-gray-700 ${getCategoryColor(cat)}`}>
                        {cat}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── FOOTER NAV ─── */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <a href="/wallet" className="px-5 py-2.5 bg-green-600/20 text-green-400 rounded-lg font-semibold hover:bg-green-600/30 transition-all border border-green-600/30">
            👛 Wallet
          </a>
          <a href="/test-checkout" className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all">
            🎫 Test Checkout
          </a>
          <a href="/admin/treasury" className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all">
            📊 Admin Dashboard
          </a>
          <a href={`/events/manage/${TEST_EVENT_ID}`} className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all">
            🎪 Manage Event
          </a>
        </div>

        {/* ─── SQL REFERENCE ─── */}
        <details className="mt-6">
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-400">
            📝 Verification SQL Queries
          </summary>
          <div className="bg-gray-800 rounded-lg p-4 mt-2 border border-gray-700 space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1">Ledger Entries:</div>
              <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto text-gray-300">
                {`SELECT id, user_id, amount_cents, type, event_source, correlation_id, created_at
FROM ledger_entries ORDER BY created_at DESC LIMIT 10;`}
              </pre>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1">Passport Entries:</div>
              <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto text-gray-300">
                {`SELECT id, user_id, event_type, event_category, metadata, created_at
FROM passport_entries ORDER BY created_at DESC LIMIT 10;`}
              </pre>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1">User Balance:</div>
              <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto text-gray-300">
                {`SELECT user_id,
  SUM(CASE WHEN type='credit' THEN amount_cents ELSE 0 END) as credits,
  SUM(CASE WHEN type='debit' THEN amount_cents ELSE 0 END) as debits,
  SUM(CASE WHEN type='credit' THEN amount_cents ELSE -amount_cents END) as balance
FROM ledger_entries
WHERE user_id = '63dd0fbb-172c-47c2-b0c7-4a1582a93d7e'
GROUP BY user_id;`}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
