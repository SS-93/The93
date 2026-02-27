/**
 * =============================================================================
 * DNA INFLUENCE WEIGHTS CONFIGURATION
 * =============================================================================
 *
 * Part of: Buckets V2 Core Infrastructure
 * V2 Living Index: #1 MediaID DNA System
 * Frontend Architecture: lib/dna/influenceWeights.ts
 *
 * PURPOSE:
 * Defines how each user interaction influences the 4 domains of DNA:
 * - Cultural DNA: Genre preferences, mood, artist taste
 * - Behavioral DNA: Engagement patterns, activity frequency
 * - Economic DNA: Spending behavior, value signals
 * - Spatial DNA: Location preferences, venue context
 *
 * THE BIOMIMICRY MODEL:
 * - MediaID inputs (ATGC) = Static identity foundation
 * - User interactions = Dynamic helix structure
 * - Each interaction has weighted influence across 4 domains
 * - Weights determine how strongly an interaction updates each domain
 *
 * USER CONTROL:
 * Users can adjust their own influence weights in MediaID Advanced Settings
 * to control how different types of interactions affect their recommendations.
 *
 * Example: A user who values spatial context more than behavioral patterns
 * can increase spatial_weight and decrease behavioral_weight.
 *
 * =============================================================================
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Influence weights for a single interaction type
 * Each weight ranges from 0.0 (no influence) to 1.0 (maximum influence)
 */
export interface InteractionInfluence {
  // Domain weights (how much this interaction affects each DNA domain)
  cultural: number       // Genre, mood, artist preferences
  behavioral: number     // Engagement patterns, frequency
  economic: number       // Spending, value signals
  spatial: number        // Location, venue, context

  // Base intensity (overall importance of this interaction type)
  baseIntensity: number  // 0.0-1.0: How significant this action is

  // Metadata
  category: 'player' | 'concierto' | 'social' | 'economic' | 'discovery'
  description: string
}

/**
 * User-defined influence multipliers
 * Stored in media_ids.content_flags.dna_preferences
 * Allows users to customize how interactions affect their DNA
 */
export interface UserInfluencePreferences {
  userId: string

  // Domain multipliers (0.5 = half influence, 1.0 = normal, 2.0 = double influence)
  culturalMultiplier: number      // Default: 1.0
  behavioralMultiplier: number    // Default: 1.0
  economicMultiplier: number      // Default: 1.0
  spatialMultiplier: number       // Default: 1.0

  // Overall DNA evolution rate
  learningRate: number            // Default: 0.1 (10% influence per interaction)

  // Context-specific overrides
  contextMultipliers?: {
    discovery?: number            // Interactions during discovery mode
    playlist?: number             // Interactions in playlists
    event?: number                // Interactions at events
    vertical_player?: number      // Interactions in vertical player
  }

  updatedAt: Date
}

/**
 * Context for DNA mirroring calculation
 * Passed when applying interaction influence to user DNA
 */
export interface DNAMirroringContext {
  userId: string
  interactionType: string
  entityId: string
  entityType: 'track' | 'artist' | 'event' | 'brand'

  // Context metadata
  context: 'discovery' | 'playlist' | 'event' | 'vertical_player' | 'general'
  deviceType?: string
  location?: { lat: number; lng: number }

  // Temporal factors
  timestamp: Date
  recencyFactor: number          // 0.0-1.0: How recent is this (for decay)

  // User preferences
  userPreferences?: UserInfluencePreferences
}

// =============================================================================
// BASE INFLUENCE WEIGHTS CONFIGURATION
// =============================================================================

/**
 * Default influence weights for each interaction type
 * These are the baseline weights before user multipliers are applied
 *
 * Weight values:
 * - 0.0-0.3: Low influence
 * - 0.4-0.6: Medium influence
 * - 0.7-0.9: High influence
 * - 0.9-1.0: Very high influence
 */
export const INTERACTION_INFLUENCE_WEIGHTS: Record<string, InteractionInfluence> = {
  // ============================================================================
  // PLAYER INTERACTIONS (Listening behavior)
  // ============================================================================

  'player.track_played': {
    cultural: 0.8,      // HIGH: Plays strongly indicate genre/mood preferences
    behavioral: 0.6,    // MEDIUM: Shows listening patterns
    economic: 0.2,      // LOW: No direct economic signal (unless premium track)
    spatial: 0.3,       // LOW-MED: Context matters slightly (home vs event)
    baseIntensity: 0.5,
    category: 'player',
    description: 'User played a track'
  },

  'player.track_completed': {
    cultural: 0.9,      // VERY HIGH: Completion shows strong preference
    behavioral: 0.8,    // HIGH: Deliberate listening to the end
    economic: 0.3,      // LOW-MED: Potential conversion signal
    spatial: 0.3,       // LOW-MED: Context matters
    baseIntensity: 0.7,
    category: 'player',
    description: 'User listened to full track'
  },

  'player.track_skipped': {
    cultural: 0.5,      // MEDIUM: Skip indicates dislike (negative signal)
    behavioral: 0.7,    // HIGH: Shows engagement pattern (what NOT to serve)
    economic: 0.1,      // VERY LOW: No economic value
    spatial: 0.2,       // LOW: Context less relevant for skips
    baseIntensity: 0.3,
    category: 'player',
    description: 'User skipped track before completion'
  },

  'player.track_favorited': {
    cultural: 0.95,     // MAXIMUM: Strong deliberate preference signal
    behavioral: 0.9,    // VERY HIGH: Active curation behavior
    economic: 0.4,      // MEDIUM: Likely to purchase/subscribe
    spatial: 0.3,       // LOW-MED: Context less important for favorites
    baseIntensity: 0.9,
    category: 'player',
    description: 'User added track to favorites'
  },

  'player.track_paused': {
    cultural: 0.3,      // LOW: Pause doesn't indicate preference
    behavioral: 0.5,    // MEDIUM: Shows engagement pattern
    economic: 0.1,      // VERY LOW: No economic signal
    spatial: 0.2,       // LOW: Context might matter (interruption)
    baseIntensity: 0.2,
    category: 'player',
    description: 'User paused playback'
  },

  'player.playlist_created': {
    cultural: 0.85,     // VERY HIGH: Curation shows taste
    behavioral: 0.9,    // VERY HIGH: Active organization behavior
    economic: 0.3,      // LOW-MED: Potential subscriber signal
    spatial: 0.2,       // LOW: Playlists are context-independent
    baseIntensity: 0.8,
    category: 'player',
    description: 'User created a playlist'
  },

  'player.queue_updated': {
    cultural: 0.6,      // MEDIUM: Queue shows immediate preferences
    behavioral: 0.7,    // HIGH: Shows listening intent
    economic: 0.2,      // LOW: No economic signal
    spatial: 0.3,       // LOW-MED: Context might matter
    baseIntensity: 0.4,
    category: 'player',
    description: 'User modified playback queue'
  },

  // ============================================================================
  // CONCIERTO INTERACTIONS (Events & Voting)
  // ============================================================================

  'concierto.vote_cast': {
    cultural: 0.9,      // VERY HIGH: Strong signal of artist/genre preference
    behavioral: 0.7,    // HIGH: Active engagement (not passive)
    economic: 0.4,      // MEDIUM: May lead to ticket purchase
    spatial: 0.8,       // HIGH: Event location + venue context important
    baseIntensity: 0.9,
    category: 'concierto',
    description: 'User voted for artist at event'
  },

  'concierto.event_rsvp': {
    cultural: 0.7,      // HIGH: Intent to attend shows preference
    behavioral: 0.8,    // HIGH: Planning behavior
    economic: 0.5,      // MEDIUM: Intent to potentially purchase
    spatial: 0.9,       // VERY HIGH: Location is critical for RSVPs
    baseIntensity: 0.7,
    category: 'concierto',
    description: 'User RSVPed to event'
  },

  'concierto.event_attended': {
    cultural: 0.85,     // VERY HIGH: Physical attendance = strong preference
    behavioral: 0.75,   // HIGH: Committed action
    economic: 0.6,      // MEDIUM-HIGH: Spent time/money to attend
    spatial: 1.0,       // MAXIMUM: Location is primary factor
    baseIntensity: 0.9,
    category: 'concierto',
    description: 'User physically attended event'
  },

  'concierto.ticket_purchased': {
    cultural: 0.7,      // HIGH: Strong commitment to artist/genre
    behavioral: 0.6,    // MEDIUM-HIGH: Willing to take action
    economic: 1.0,      // MAXIMUM: Direct economic transaction
    spatial: 0.9,       // VERY HIGH: Physical attendance planned
    baseIntensity: 1.0,
    category: 'concierto',
    description: 'User purchased event ticket'
  },

  'concierto.event_viewed': {
    cultural: 0.5,      // MEDIUM: Browsing shows interest
    behavioral: 0.6,    // MEDIUM: Discovery behavior
    economic: 0.2,      // LOW: No commitment yet
    spatial: 0.6,       // MEDIUM: Location filtering active
    baseIntensity: 0.3,
    category: 'concierto',
    description: 'User viewed event details'
  },

  'concierto.event_created': {
    cultural: 0.8,      // HIGH: Host preferences (as curator)
    behavioral: 1.0,    // MAXIMUM: Proactive creation behavior
    economic: 0.7,      // HIGH: Investment of time/effort
    spatial: 0.95,      // VERY HIGH: Choosing venue/location
    baseIntensity: 0.95,
    category: 'concierto',
    description: 'User created an event (host)'
  },

  'concierto.artist_scored': {
    cultural: 0.85,     // VERY HIGH: Detailed scoring = strong opinion
    behavioral: 0.8,    // HIGH: Engaged evaluation
    economic: 0.3,      // LOW-MED: Potential future purchase
    spatial: 0.7,       // HIGH: Event context important
    baseIntensity: 0.8,
    category: 'concierto',
    description: 'User scored artist performance'
  },

  // ============================================================================
  // SOCIAL INTERACTIONS (Follows, Shares, Comments)
  // ============================================================================

  'social.user_followed': {
    cultural: 0.85,     // VERY HIGH: Follow = strong preference for artist
    behavioral: 0.7,    // HIGH: Social engagement pattern
    economic: 0.3,      // LOW-MED: May lead to purchases
    spatial: 0.2,       // LOW: Follows are location-independent
    baseIntensity: 0.7,
    category: 'social',
    description: 'User followed artist/user'
  },

  'social.content_shared': {
    cultural: 0.7,      // HIGH: Sharing = endorsement of content
    behavioral: 0.9,    // VERY HIGH: Proactive social behavior
    economic: 0.3,      // LOW-MED: Amplification value
    spatial: 0.4,       // MEDIUM: Sharing context might matter
    baseIntensity: 0.8,
    category: 'social',
    description: 'User shared content'
  },

  'social.content_liked': {
    cultural: 0.75,     // HIGH: Like = preference signal
    behavioral: 0.65,   // MEDIUM-HIGH: Engagement indicator
    economic: 0.25,     // LOW: No direct economic value
    spatial: 0.25,      // LOW: Context less important
    baseIntensity: 0.6,
    category: 'social',
    description: 'User liked content'
  },

  'social.content_commented': {
    cultural: 0.8,      // HIGH: Comment = deep engagement
    behavioral: 0.85,   // VERY HIGH: Active participation
    economic: 0.3,      // LOW-MED: Community value
    spatial: 0.3,       // LOW-MED: Context might matter
    baseIntensity: 0.75,
    category: 'social',
    description: 'User commented on content'
  },

  // ============================================================================
  // ECONOMIC INTERACTIONS (Purchases, Subscriptions)
  // ============================================================================

  'treasury.subscription_started': {
    cultural: 0.6,      // MEDIUM: Subscription less about taste, more about access
    behavioral: 0.7,    // HIGH: Commitment to platform
    economic: 1.0,      // MAXIMUM: Direct recurring revenue
    spatial: 0.1,       // VERY LOW: Location irrelevant
    baseIntensity: 1.0,
    category: 'economic',
    description: 'User started subscription'
  },

  'treasury.transaction_created': {
    cultural: 0.5,      // MEDIUM: Purchase shows preference
    behavioral: 0.6,    // MEDIUM: Buying behavior
    economic: 1.0,      // MAXIMUM: Direct economic signal
    spatial: 0.2,       // LOW: Location less relevant (unless merch at event)
    baseIntensity: 0.95,
    category: 'economic',
    description: 'User made a purchase'
  },

  'treasury.payout_requested': {
    cultural: 0.1,      // VERY LOW: No cultural signal
    behavioral: 0.3,    // LOW: Administrative action
    economic: 0.5,      // MEDIUM: Economic activity (as creator)
    spatial: 0.05,      // NEGLIGIBLE: Location irrelevant
    baseIntensity: 0.2,
    category: 'economic',
    description: 'User requested payout (artist)'
  },

  // ============================================================================
  // DISCOVERY INTERACTIONS (Search, Recommendations)
  // ============================================================================

  'discovery.search_performed': {
    cultural: 0.6,      // MEDIUM: Search query shows intent
    behavioral: 0.8,    // HIGH: Active discovery behavior
    economic: 0.1,      // VERY LOW: No economic commitment
    spatial: 0.3,       // LOW-MED: Context might matter (event search)
    baseIntensity: 0.4,
    category: 'discovery',
    description: 'User performed search'
  },

  'discovery.recommendation_clicked': {
    cultural: 0.7,      // HIGH: Clicking = validation of recommendation
    behavioral: 0.6,    // MEDIUM: Passive discovery behavior
    economic: 0.2,      // LOW: No economic signal yet
    spatial: 0.3,       // LOW-MED: Context might matter
    baseIntensity: 0.5,
    category: 'discovery',
    description: 'User clicked recommendation'
  },

  'discovery.artist_discovered': {
    cultural: 0.8,      // HIGH: Discovery = new preference
    behavioral: 0.7,    // HIGH: Exploration behavior
    economic: 0.25,     // LOW: Potential future value
    spatial: 0.3,       // LOW-MED: Discovery context
    baseIntensity: 0.6,
    category: 'discovery',
    description: 'User discovered new artist'
  },

  'discovery.filter_applied': {
    cultural: 0.65,     // MEDIUM-HIGH: Filtering shows preferences
    behavioral: 0.75,   // HIGH: Active refinement behavior
    economic: 0.15,     // LOW: No economic signal
    spatial: 0.4,       // MEDIUM: Filters might include location
    baseIntensity: 0.45,
    category: 'discovery',
    description: 'User applied discovery filters'
  },

  // ============================================================================
  // LOCKER INTERACTIONS (Content Access)
  // ============================================================================

  'locker.item_unlocked': {
    cultural: 0.7,      // HIGH: Unlocking = desire for content
    behavioral: 0.75,   // HIGH: Engaged with reward system
    economic: 0.4,      // MEDIUM: Value perception
    spatial: 0.2,       // LOW: Digital content
    baseIntensity: 0.7,
    category: 'player',
    description: 'User unlocked Locker content'
  },

  'locker.content_viewed': {
    cultural: 0.65,     // MEDIUM-HIGH: Viewing = interest
    behavioral: 0.6,    // MEDIUM: Content consumption
    economic: 0.3,      // LOW-MED: Potential conversion
    spatial: 0.15,      // LOW: Digital content
    baseIntensity: 0.5,
    category: 'player',
    description: 'User viewed Locker content'
  },

  'locker.reward_claimed': {
    cultural: 0.5,      // MEDIUM: Claim shows engagement with system
    behavioral: 0.8,    // HIGH: Active participation
    economic: 0.6,      // MEDIUM-HIGH: Value recognition
    spatial: 0.1,       // VERY LOW: Digital rewards
    baseIntensity: 0.6,
    category: 'player',
    description: 'User claimed Locker reward'
  },

  // ============================================================================
  // CALS INTERACTIONS (Sharing & Attribution)
  // ============================================================================

  'cals.link_shared': {
    cultural: 0.65,     // MEDIUM-HIGH: Sharing = endorsement
    behavioral: 0.85,   // VERY HIGH: Proactive amplification
    economic: 0.4,      // MEDIUM: Attribution potential
    spatial: 0.35,      // LOW-MED: Sharing context
    baseIntensity: 0.75,
    category: 'social',
    description: 'User shared CALS link'
  },

  'cals.link_opened': {
    cultural: 0.55,     // MEDIUM: Opening = curiosity
    behavioral: 0.5,    // MEDIUM: Passive discovery
    economic: 0.2,      // LOW: No commitment yet
    spatial: 0.3,       // LOW-MED: Context of open
    baseIntensity: 0.4,
    category: 'social',
    description: 'User opened CALS link'
  },

  // ============================================================================
  // MEDIAID INTERACTIONS (Identity Management)
  // ============================================================================

  'mediaid.setup_completed': {
    cultural: 0.9,      // VERY HIGH: Initial preferences set ATGC bases
    behavioral: 0.5,    // MEDIUM: Onboarding behavior
    economic: 0.2,      // LOW: No economic signal yet
    spatial: 0.6,       // MEDIUM: Location set
    baseIntensity: 1.0,
    category: 'player',
    description: 'User completed MediaID setup'
  },

  'mediaid.dna_evolved': {
    cultural: 0.0,      // ZERO: System event, not user action
    behavioral: 0.0,    // ZERO: Automated
    economic: 0.0,      // ZERO: No economic signal
    spatial: 0.0,       // ZERO: No spatial signal
    baseIntensity: 0.0,
    category: 'player',
    description: 'System evolved user DNA (automated)'
  },

  'mediaid.simulator_used': {
    cultural: 0.1,      // VERY LOW: Exploration, not commitment
    behavioral: 0.4,    // MEDIUM: Curious about DNA
    economic: 0.05,     // NEGLIGIBLE: No economic signal
    spatial: 0.05,      // NEGLIGIBLE: No spatial signal
    baseIntensity: 0.15,
    category: 'player',
    description: 'User used DNA simulator'
  },

  'mediaid.consent_updated': {
    cultural: 0.0,      // ZERO: Privacy action, not preference
    behavioral: 0.2,    // LOW: Privacy-conscious behavior
    economic: 0.0,      // ZERO: No economic signal
    spatial: 0.0,       // ZERO: No spatial signal
    baseIntensity: 0.1,
    category: 'player',
    description: 'User updated consent settings'
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get influence weights for an interaction type
 * Falls back to default medium weights if type not found
 */
export function getInfluenceWeights(interactionType: string): InteractionInfluence {
  return INTERACTION_INFLUENCE_WEIGHTS[interactionType] || {
    cultural: 0.5,
    behavioral: 0.5,
    economic: 0.5,
    spatial: 0.5,
    baseIntensity: 0.5,
    category: 'player',
    description: 'Unknown interaction type'
  }
}

/**
 * Apply user-defined multipliers to base influence weights
 * Allows users to customize how interactions affect their DNA
 */
export function applyUserMultipliers(
  baseWeights: InteractionInfluence,
  userPreferences: UserInfluencePreferences,
  context?: string
): InteractionInfluence {
  // Apply domain multipliers
  let cultural = baseWeights.cultural * userPreferences.culturalMultiplier
  let behavioral = baseWeights.behavioral * userPreferences.behavioralMultiplier
  let economic = baseWeights.economic * userPreferences.economicMultiplier
  let spatial = baseWeights.spatial * userPreferences.spatialMultiplier

  // Apply context-specific multiplier if available
  if (context && userPreferences.contextMultipliers?.[context as keyof typeof userPreferences.contextMultipliers]) {
    const contextMultiplier = userPreferences.contextMultipliers[context as keyof typeof userPreferences.contextMultipliers]!
    cultural *= contextMultiplier
    behavioral *= contextMultiplier
    economic *= contextMultiplier
    spatial *= contextMultiplier
  }

  // Clamp values to 0-1 range
  cultural = Math.max(0, Math.min(1, cultural))
  behavioral = Math.max(0, Math.min(1, behavioral))
  economic = Math.max(0, Math.min(1, economic))
  spatial = Math.max(0, Math.min(1, spatial))

  return {
    ...baseWeights,
    cultural,
    behavioral,
    economic,
    spatial
  }
}

/**
 * Get default user influence preferences
 * Used when user hasn't customized their settings
 */
export function getDefaultUserPreferences(userId: string): UserInfluencePreferences {
  return {
    userId,
    culturalMultiplier: 1.0,
    behavioralMultiplier: 1.0,
    economicMultiplier: 1.0,
    spatialMultiplier: 1.0,
    learningRate: 0.1,
    updatedAt: new Date()
  }
}

/**
 * Validate user influence preferences
 * Ensures multipliers are within reasonable bounds
 */
export function validateUserPreferences(
  preferences: Partial<UserInfluencePreferences>
): UserInfluencePreferences | null {
  // Multipliers should be between 0.0 and 3.0
  const clampMultiplier = (val: number = 1.0) => Math.max(0, Math.min(3, val))

  // Learning rate should be between 0.01 and 0.5
  const clampLearningRate = (val: number = 0.1) => Math.max(0.01, Math.min(0.5, val))

  if (!preferences.userId) return null

  return {
    userId: preferences.userId,
    culturalMultiplier: clampMultiplier(preferences.culturalMultiplier),
    behavioralMultiplier: clampMultiplier(preferences.behavioralMultiplier),
    economicMultiplier: clampMultiplier(preferences.economicMultiplier),
    spatialMultiplier: clampMultiplier(preferences.spatialMultiplier),
    learningRate: clampLearningRate(preferences.learningRate),
    contextMultipliers: preferences.contextMultipliers,
    updatedAt: new Date()
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  INTERACTION_INFLUENCE_WEIGHTS as default
}
