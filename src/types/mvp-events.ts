/**
 * MVP Event System Types
 * Clean interface mappings for database tables to application components
 */

// ======================
// DATABASE TABLE MAPPINGS
// ======================

/**
 * Events table - Main event data
 * Maps to: public.events
 */
export interface DatabaseEvent {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  shareable_code: string
  host_user_id: string
  status: 'draft' | 'published' | 'live' | 'completed'
  max_votes_per_participant: number
  allow_multiple_votes: boolean
  location?: string
  mediaid_integration_enabled: boolean
  privacy_mode: 'minimal' | 'balanced' | 'enhanced'
  created_at: string
  updated_at: string
}

/**
 * Event Artist Prospects table - Artist CRM data
 * Maps to: public.event_artist_prospects
 */
export interface DatabaseArtistProspect {
  id: string
  event_id: string
  artist_name: string
  email?: string
  phone?: string
  instagram_handle?: string
  bio?: string
  contact_status: 'invited' | 'pending' | 'confirmed' | 'declined' | 'no-response'
  registration_token: string
  vote_count: number
  host_notes?: string
  tags?: string[]
  priority?: number
  created_at: string
  updated_at: string
}

/**
 * Event Audience Members table - Registered audience
 * Maps to: public.event_audience_members
 */
export interface DatabaseAudienceMember {
  id: string
  event_id: string
  name: string
  email: string
  phone?: string
  registration_token: string
  registered_at: string
  updated_at: string
  created_at: string
}

/**
 * Event Votes table - Individual votes
 * Maps to: public.event_votes
 */
export interface DatabaseEventVote {
  id: string
  event_id: string
  participant_id: string
  artist_id: string
  vote_type: 'vote' | 'score' | 'feedback'
  vote_data: Record<string, any>
  memorable_code?: string
  session_id?: string
  created_at: string
}

/**
 * Event Scores table - Detailed scoring
 * Maps to: public.event_scores
 */
export interface DatabaseEventScore {
  id: string
  event_id: string
  participant_id: string
  artist_id: string
  scores: Record<string, number> // { energy: 4, vocals: 5, etc. }
  average_score: number
  memorable_code?: string
  created_at: string
}

// ======================
// APPLICATION INTERFACES
// ======================

/**
 * Event interface for components
 * Clean interface used across EventCreator, EventDashboard, VotingInterface
 */
export interface AppEvent {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  shareableCode: string
  hostUserId: string
  status: 'draft' | 'published' | 'live' | 'completed'
  maxVotesPerParticipant: number
  allowMultipleVotes: boolean
  location?: string
  createdAt: string
  updatedAt: string
}

/**
 * Artist interface for components
 * Consistent across Dashboard and Voting interfaces
 */
export interface AppArtist {
  id: string
  name: string
  email?: string
  instagram?: string
  bio?: string
  contactStatus: 'invited' | 'pending' | 'confirmed' | 'declined' | 'no-response'
  voteCount: number
  averageScore?: number
  totalRatings?: number
  registrationToken: string
  notes?: string
  tags?: string[]
  createdAt: string
}

/**
 * Audience member interface for components
 */
export interface AppAudienceMember {
  id: string
  name: string
  email: string
  phone?: string
  registrationToken: string
  registeredAt: string
  canEdit: boolean // Computed: within 24 hours
}

/**
 * MVP Hardcoded Scorecard
 * No database templates needed
 */
export interface MVPScorecard {
  id: 'mvp-music-scorecard'
  name: 'Music Performance'
  maxScore: 5
  categories: Array<{
    id: string
    key: string
    label: string
    icon: string
    weight: number
  }>
}

/**
 * Voting session state
 */
export interface VotingSession {
  eventId: string
  participantId: string
  memorableCode: string
  votesRemaining: number
  maxVotes: number
  votedArtists: string[]
  scoredArtists: string[]
  sessionStart: number
}

// ======================
// MAPPING FUNCTIONS
// ======================

/**
 * Convert database event to application event
 */
export const mapDatabaseEventToApp = (dbEvent: DatabaseEvent): AppEvent => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description,
  startDate: dbEvent.start_date,
  endDate: dbEvent.end_date,
  shareableCode: dbEvent.shareable_code,
  hostUserId: dbEvent.host_user_id,
  status: dbEvent.status,
  maxVotesPerParticipant: dbEvent.max_votes_per_participant,
  allowMultipleVotes: dbEvent.allow_multiple_votes,
  location: dbEvent.location,
  createdAt: dbEvent.created_at,
  updatedAt: dbEvent.updated_at
})

/**
 * Convert database artist prospect to application artist
 */
export const mapDatabaseArtistToApp = (dbArtist: DatabaseArtistProspect, averageScore?: number, totalRatings?: number): AppArtist => ({
  id: dbArtist.id,
  name: dbArtist.artist_name,
  email: dbArtist.email,
  instagram: dbArtist.instagram_handle,
  bio: dbArtist.bio,
  contactStatus: dbArtist.contact_status,
  voteCount: dbArtist.vote_count,
  averageScore: averageScore,
  totalRatings: totalRatings || 0,
  registrationToken: dbArtist.registration_token,
  notes: dbArtist.host_notes,
  tags: dbArtist.tags,
  createdAt: dbArtist.created_at
})

/**
 * Convert database audience member to application interface
 */
export const mapDatabaseAudienceToApp = (dbAudience: DatabaseAudienceMember): AppAudienceMember => {
  const registeredAt = new Date(dbAudience.registered_at)
  const now = new Date()
  const hoursSinceRegistration = (now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60)

  return {
    id: dbAudience.id,
    name: dbAudience.name,
    email: dbAudience.email,
    phone: dbAudience.phone,
    registrationToken: dbAudience.registration_token,
    registeredAt: dbAudience.registered_at,
    canEdit: hoursSinceRegistration < 24
  }
}

/**
 * MVP Hardcoded scorecard - no database needed
 */
export const getMVPScorecard = (): MVPScorecard => ({
  id: 'mvp-music-scorecard',
  name: 'Music Performance',
  maxScore: 5,
  categories: [
    { id: 'energy', key: 'energy', label: 'Energy', icon: '⚡', weight: 1 },
    { id: 'vocals', key: 'vocals', label: 'Vocals', icon: '🎵', weight: 1 },
    { id: 'stage_presence', key: 'stage_presence', label: 'Stage Presence', icon: '🎭', weight: 1 },
    { id: 'originality', key: 'originality', label: 'Originality', icon: '✨', weight: 1 },
    { id: 'overall', key: 'overall', label: 'Overall', icon: '🏆', weight: 1 }
  ]
})