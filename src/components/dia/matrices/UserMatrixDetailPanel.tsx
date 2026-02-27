import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import './UserMatrixDetailPanel.css'

interface UserMatrixDetailPanelProps {
  userId: string
}

interface UserDetail {
  // Auth
  email: string
  created_at: string
  last_sign_in_at: string
  email_confirmed_at: string | null

  // Profile
  display_name: string | null
  role: string

  // MediaID
  mediaid_id: string | null
  interests: string[]
  genre_preferences: string[]
  content_flags: any
  location_code: string
  has_dna: boolean
  mediaid_created_at: string | null
  mediaid_updated_at: string | null

  // Counts
  listening_count: number
  engagement_count: number
  votes_count: number
}

export function UserMatrixDetailPanel({ userId }: UserMatrixDetailPanelProps) {
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'mediaid' | 'interactions'>('overview')

  useEffect(() => {
    fetchDetail()
  }, [userId])

  async function fetchDetail() {
    setLoading(true)

    try {
      // Get user
      const { data: user } = await supabase.auth.admin.getUserById(userId)

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', userId)
        .single()

      // Get MediaID (most recent)
      const { data: mediaids } = await supabase
        .from('media_ids')
        .select('*')
        .eq('user_uuid', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      const mediaid = mediaids?.[0]

      // Get counts
      const [listeningCount, engagementCount, votesCount] = await Promise.all([
        supabase
          .from('listening_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('media_engagement_log')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('event_votes')
          .select('id', { count: 'exact', head: true })
          .eq('user_uuid', userId)
      ])

      setDetail({
        email: user?.user?.email || 'unknown',
        created_at: user?.user?.created_at || '',
        last_sign_in_at: user?.user?.last_sign_in_at || '',
        email_confirmed_at: user?.user?.email_confirmed_at || null,
        display_name: profile?.display_name || null,
        role: profile?.role || 'fan',
        mediaid_id: mediaid?.id || null,
        interests: mediaid?.interests || [],
        genre_preferences: mediaid?.genre_preferences || [],
        content_flags: mediaid?.content_flags || {},
        location_code: mediaid?.location_code || '',
        has_dna: !!mediaid?.profile_embedding,
        mediaid_created_at: mediaid?.created_at || null,
        mediaid_updated_at: mediaid?.updated_at || null,
        listening_count: listeningCount.count || 0,
        engagement_count: engagementCount.count || 0,
        votes_count: votesCount.count || 0
      })
    } catch (err) {
      console.error('Error fetching user detail:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="detail-loading">Loading user details...</div>
  }

  if (!detail) {
    return <div className="detail-error">Failed to load user details</div>
  }

  return (
    <div className="user-matrix-detail">
      <div className="detail-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'mediaid' ? 'active' : ''}
          onClick={() => setActiveTab('mediaid')}
        >
          MediaID (ATGC)
        </button>
        <button
          className={activeTab === 'interactions' ? 'active' : ''}
          onClick={() => setActiveTab('interactions')}
        >
          Interactions
        </button>
      </div>

      <div className="detail-content">
        {activeTab === 'overview' && (
          <div className="detail-section">
            <h3>User Overview</h3>
            <div className="detail-grid">
              <div className="detail-field">
                <label>Email</label>
                <span>{detail.email}</span>
              </div>
              <div className="detail-field">
                <label>Display Name</label>
                <span>{detail.display_name || 'Not set'}</span>
              </div>
              <div className="detail-field">
                <label>Role</label>
                <span className={`badge badge-${detail.role}`}>{detail.role}</span>
              </div>
              <div className="detail-field">
                <label>Created</label>
                <span>{new Date(detail.created_at).toLocaleString()}</span>
              </div>
              <div className="detail-field">
                <label>Last Sign In</label>
                <span>{new Date(detail.last_sign_in_at).toLocaleString()}</span>
              </div>
              <div className="detail-field">
                <label>Email Confirmed</label>
                <span>{detail.email_confirmed_at ? '✅ Yes' : '❌ No'}</span>
              </div>
            </div>

            <h3>Summary Stats</h3>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-value">{detail.listening_count}</div>
                <div className="stat-label">Listens</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{detail.engagement_count}</div>
                <div className="stat-label">Engagements</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{detail.votes_count}</div>
                <div className="stat-label">Event Votes</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mediaid' && (
          <div className="detail-section">
            <h3>MediaID (ATGC Bases)</h3>
            {!detail.mediaid_id ? (
              <div className="empty-state">
                ❌ No MediaID created for this user
              </div>
            ) : (
              <>
                <div className="atgc-bases">
                  <div className="base-card">
                    <h4>A - Interests (Adenine)</h4>
                    <div className="base-status">
                      {detail.interests.length > 0 ? '✅' : '❌'} {detail.interests.length} interests
                    </div>
                    {detail.interests.length > 0 ? (
                      <ul>
                        {detail.interests.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty">No interests selected</p>
                    )}
                  </div>

                  <div className="base-card">
                    <h4>T - Genre Preferences (Thymine)</h4>
                    <div className="base-status">
                      {detail.genre_preferences.length > 0 ? '✅' : '❌'} {detail.genre_preferences.length} genres
                    </div>
                    {detail.genre_preferences.length > 0 ? (
                      <ul>
                        {detail.genre_preferences.map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty">No genres selected</p>
                    )}
                  </div>

                  <div className="base-card">
                    <h4>G - Content Flags (Guanine)</h4>
                    <div className="base-status">
                      {Object.keys(detail.content_flags).length > 0 ? '✅' : '❌'}
                    </div>
                    {Object.keys(detail.content_flags).length > 0 ? (
                      <pre>{JSON.stringify(detail.content_flags, null, 2)}</pre>
                    ) : (
                      <p className="empty">No content flags set</p>
                    )}
                  </div>

                  <div className="base-card">
                    <h4>C - Location (Cytosine)</h4>
                    <div className="base-status">
                      {detail.location_code ? '✅' : '❌'}
                    </div>
                    {detail.location_code ? (
                      <p>{detail.location_code}</p>
                    ) : (
                      <p className="empty">No location set</p>
                    )}
                  </div>
                </div>

                <h3>DNA State</h3>
                <div className="dna-state">
                  <div className="dna-status">
                    {detail.has_dna ? '✅ DNA Initialized' : '❌ DNA Not Initialized'}
                  </div>
                  {!detail.has_dna && (
                    <button className="btn-primary" onClick={() => alert('Initialize DNA flow coming soon!')}>
                      Initialize DNA
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="detail-section">
            <h3>Interaction Timeline</h3>
            <p className="coming-soon">Interaction timeline coming soon...</p>
            <p>This will show all interactions (listens, engagements, votes) chronologically with DNA influence weights.</p>
          </div>
        )}
      </div>
    </div>
  )
}
