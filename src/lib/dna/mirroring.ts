/**
 * =============================================================================
 * DNA MIRRORING ENGINE
 * =============================================================================
 *
 * Part of: Buckets V2 Core Infrastructure
 * V2 Living Index: #1 MediaID DNA System
 * Frontend Architecture: lib/dna/mirroring.ts
 *
 * PURPOSE:
 * Implements the DNA mirroring mechanism where user interactions dynamically
 * update their MediaID DNA across 4 domains with weighted influence.
 *
 * THE BIOMIMICRY MODEL:
 * - ATGC bases (MediaID inputs) = Static foundation
 * - Helix (interactions) = Dynamic evolution through mirroring
 * - Each interaction reflects entity DNA onto user DNA
 * - Weighted by interaction type + user preferences + carbon decay
 *
 * HOW MIRRORING WORKS:
 * 1. User interacts with entity (track, artist, event)
 * 2. Get entity's DNA (cultural, behavioral, economic, spatial vectors)
 * 3. Get influence weights for interaction type
 * 4. Apply user's custom multipliers (if set)
 * 5. Calculate decay factor (old DNA signals fade)
 * 6. Update user DNA via exponential moving average
 * 7. Recompute composite DNA from 4 domains
 *
 * INTEGRATION:
 * - Called by: Passport event processor (background worker)
 * - Input: Passport entries (user interactions)
 * - Output: Updated user DNA in media_ids table
 *
 * =============================================================================
 */

import { supabase } from '../supabaseClient'
import {
  getInfluenceWeights,
  applyUserMultipliers,
  getDefaultUserPreferences,
  UserInfluencePreferences,
  DNAMirroringContext
} from './influenceWeights'
import { calculateDecayFactor } from './decay'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * 4-domain DNA structure
 * Each domain is a 384-dimensional vector (1536 total / 4 = 384 per domain)
 */
export interface MediaIDDNA {
  userId: string
  mediaIdId: string

  // 4 separate domain vectors
  culturalDNA: number[]      // 384-d: Genre, mood, artist preferences
  behavioralDNA: number[]    // 384-d: Engagement patterns, frequency
  economicDNA: number[]      // 384-d: Spending behavior, value signals
  spatialDNA: number[]       // 384-d: Location, venue, context preferences

  // Composite DNA (weighted combination of 4 domains)
  compositeDNA: number[]     // 1536-d: Full DNA representation

  // Metadata
  lastUpdated: Date
  generationVersion: number  // Incremented on each update
  confidenceScore: number    // 0-1: Data quality indicator

  // Decay tracking
  halfLifeDays: number       // Default: 90 days
  lastInteraction: Date
}

/**
 * Entity DNA (track, artist, event, brand)
 * Entities also have 4-domain DNA for matching
 */
export interface EntityDNA {
  entityId: string
  entityType: 'track' | 'artist' | 'event' | 'brand' | 'content'

  // 4 domain vectors
  culturalDNA: number[]
  behavioralDNA: number[]
  economicDNA: number[]
  spatialDNA: number[]

  // Composite
  compositeDNA: number[]

  // Metadata
  generatedAt: Date
  confidenceScore: number
}

/**
 * DNA mirroring result
 * Returned after applying interaction influence
 */
export interface MirroringResult {
  success: boolean
  userId: string
  interactionType: string

  // Changes made
  culturalDeltaNorm: number   // How much cultural DNA changed (L2 norm)
  behavioralDeltaNorm: number
  economicDeltaNorm: number
  spatialDeltaNorm: number
  compositeDeltaNorm: number

  // New DNA state
  newDNA: MediaIDDNA

  // Performance
  processingTimeMs: number

  // Errors
  error?: string
}

// =============================================================================
// MAIN MIRRORING FUNCTION
// =============================================================================

/**
 * Mirror an interaction onto user's DNA
 * This is the core function called by the Passport processor
 *
 * @param context - DNA mirroring context with interaction details
 * @returns Mirroring result with updated DNA
 */
export async function mirrorInteractionToDNA(
  context: DNAMirroringContext
): Promise<MirroringResult> {
  const startTime = Date.now()

  try {
    // 1. Fetch user's current DNA
    const userDNA = await getUserDNA(context.userId)
    if (!userDNA) {
      return {
        success: false,
        userId: context.userId,
        interactionType: context.interactionType,
        culturalDeltaNorm: 0,
        behavioralDeltaNorm: 0,
        economicDeltaNorm: 0,
        spatialDeltaNorm: 0,
        compositeDeltaNorm: 0,
        newDNA: userDNA!,
        processingTimeMs: Date.now() - startTime,
        error: 'User DNA not found'
      }
    }

    // 2. Fetch entity DNA (track, artist, event being interacted with)
    const entityDNA = await getEntityDNA(context.entityId, context.entityType)
    if (!entityDNA) {
      return {
        success: false,
        userId: context.userId,
        interactionType: context.interactionType,
        culturalDeltaNorm: 0,
        behavioralDeltaNorm: 0,
        economicDeltaNorm: 0,
        spatialDeltaNorm: 0,
        compositeDeltaNorm: 0,
        newDNA: userDNA,
        processingTimeMs: Date.now() - startTime,
        error: `Entity DNA not found for ${context.entityType}:${context.entityId}`
      }
    }

    // 3. Get base influence weights for this interaction type
    const baseWeights = getInfluenceWeights(context.interactionType)

    // 4. Apply user's custom multipliers (if they've set advanced preferences)
    const userPreferences = context.userPreferences || await getUserInfluencePreferences(context.userId)
    const finalWeights = applyUserMultipliers(baseWeights, userPreferences, context.context)

    // 5. Calculate decay factor (carbon decay model)
    const decayFactor = calculateDecayFactor(
      userDNA.lastInteraction,
      userDNA.halfLifeDays
    )

    // 6. Calculate learning rate (alpha)
    // Base learning rate * interaction intensity * user's custom learning rate
    const alpha = userPreferences.learningRate * baseWeights.baseIntensity * context.recencyFactor

    // 7. Store old DNA for delta calculation
    const oldCulturalDNA = [...userDNA.culturalDNA]
    const oldBehavioralDNA = [...userDNA.behavioralDNA]
    const oldEconomicDNA = [...userDNA.economicDNA]
    const oldSpatialDNA = [...userDNA.spatialDNA]
    const oldCompositeDNA = [...userDNA.compositeDNA]

    // 8. Apply weighted mirroring to each domain
    // Exponential moving average: new_dna = (1 - alpha * weight) * old_dna * decay + alpha * weight * entity_dna

    // Cultural DNA update
    userDNA.culturalDNA = userDNA.culturalDNA.map((val, idx) =>
      (1 - alpha * finalWeights.cultural) * val * decayFactor +
      alpha * finalWeights.cultural * entityDNA.culturalDNA[idx]
    )

    // Behavioral DNA update
    userDNA.behavioralDNA = userDNA.behavioralDNA.map((val, idx) =>
      (1 - alpha * finalWeights.behavioral) * val * decayFactor +
      alpha * finalWeights.behavioral * entityDNA.behavioralDNA[idx]
    )

    // Economic DNA update
    userDNA.economicDNA = userDNA.economicDNA.map((val, idx) =>
      (1 - alpha * finalWeights.economic) * val * decayFactor +
      alpha * finalWeights.economic * entityDNA.economicDNA[idx]
    )

    // Spatial DNA update
    userDNA.spatialDNA = userDNA.spatialDNA.map((val, idx) =>
      (1 - alpha * finalWeights.spatial) * val * decayFactor +
      alpha * finalWeights.spatial * entityDNA.spatialDNA[idx]
    )

    // 9. Recompute composite DNA (weighted combination of 4 domains)
    userDNA.compositeDNA = computeCompositeDNA(
      userDNA.culturalDNA,
      userDNA.behavioralDNA,
      userDNA.economicDNA,
      userDNA.spatialDNA
    )

    // 10. Update metadata
    userDNA.lastUpdated = new Date()
    userDNA.lastInteraction = context.timestamp
    userDNA.generationVersion += 1

    // 11. Calculate deltas (L2 norm of change)
    const culturalDelta = calculateL2Norm(userDNA.culturalDNA, oldCulturalDNA)
    const behavioralDelta = calculateL2Norm(userDNA.behavioralDNA, oldBehavioralDNA)
    const economicDelta = calculateL2Norm(userDNA.economicDNA, oldEconomicDNA)
    const spatialDelta = calculateL2Norm(userDNA.spatialDNA, oldSpatialDNA)
    const compositeDelta = calculateL2Norm(userDNA.compositeDNA, oldCompositeDNA)

    // 12. Save updated DNA to database
    await saveUserDNA(userDNA)

    // 13. Return result
    return {
      success: true,
      userId: context.userId,
      interactionType: context.interactionType,
      culturalDeltaNorm: culturalDelta,
      behavioralDeltaNorm: behavioralDelta,
      economicDeltaNorm: economicDelta,
      spatialDeltaNorm: spatialDelta,
      compositeDeltaNorm: compositeDelta,
      newDNA: userDNA,
      processingTimeMs: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      success: false,
      userId: context.userId,
      interactionType: context.interactionType,
      culturalDeltaNorm: 0,
      behavioralDeltaNorm: 0,
      economicDeltaNorm: 0,
      spatialDeltaNorm: 0,
      compositeDeltaNorm: 0,
      newDNA: await getUserDNA(context.userId)!,
      processingTimeMs: Date.now() - startTime,
      error: error.message
    }
  }
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Fetch user's current DNA from database
 * Converts from single 1536-d vector to 4-domain structure
 */
export async function getUserDNA(userId: string): Promise<MediaIDDNA | null> {
  try {
    const { data, error } = await supabase
      .from('media_ids')
      .select('*')
      .eq('user_uuid', userId)
      .single()

    if (error || !data) return null

    // If profile_embedding doesn't exist, initialize default DNA
    if (!data.profile_embedding) {
      return initializeDefaultDNA(userId, data.id)
    }

    // Split 1536-d composite vector into 4 domains (384-d each)
    const compositeDNA = data.profile_embedding
    const culturalDNA = compositeDNA.slice(0, 384)
    const behavioralDNA = compositeDNA.slice(384, 768)
    const economicDNA = compositeDNA.slice(768, 1152)
    const spatialDNA = compositeDNA.slice(1152, 1536)

    return {
      userId,
      mediaIdId: data.id,
      culturalDNA,
      behavioralDNA,
      economicDNA,
      spatialDNA,
      compositeDNA,
      lastUpdated: new Date(data.updated_at),
      generationVersion: data.version || 1,
      confidenceScore: 0.5, // TODO: Calculate based on data quality
      halfLifeDays: 90,
      lastInteraction: new Date(data.updated_at)
    }
  } catch (error) {
    console.error('Error fetching user DNA:', error)
    return null
  }
}

/**
 * Save updated user DNA to database
 * Combines 4 domains back into single 1536-d vector
 */
export async function saveUserDNA(dna: MediaIDDNA): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('media_ids')
      .update({
        profile_embedding: dna.compositeDNA,
        updated_at: dna.lastUpdated.toISOString(),
        version: dna.generationVersion
      })
      .eq('user_uuid', dna.userId)

    if (error) {
      console.error('Error saving user DNA:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving user DNA:', error)
    return false
  }
}

/**
 * Fetch entity DNA (track, artist, event)
 * For MVP, we'll generate entity DNA on-demand from metadata
 * In production, this should be pre-computed and cached
 */
export async function getEntityDNA(
  entityId: string,
  entityType: 'track' | 'artist' | 'event' | 'brand' | 'content'
): Promise<EntityDNA | null> {
  try {
    // TODO: Implement entity DNA generation
    // For now, return mock DNA based on entity metadata
    // In production, this should fetch pre-computed DNA from a separate table

    // Fetch entity metadata based on type
    let entityData: any = null

    switch (entityType) {
      case 'track':
      case 'content':
        const { data: trackData } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', entityId)
          .single()
        entityData = trackData
        break

      case 'artist':
        const { data: artistData } = await supabase
          .from('artist_profiles')
          .select('*')
          .eq('id', entityId)
          .single()
        entityData = artistData
        break

      case 'event':
        const { data: eventData } = await supabase
          .from('events')
          .select('*')
          .eq('id', entityId)
          .single()
        entityData = eventData
        break

      default:
        return null
    }

    if (!entityData) return null

    // Generate entity DNA from metadata (simplified for MVP)
    // In production, this should use proper embeddings from OpenAI or similar
    const culturalDNA = generateMockVector(384, entityType, 'cultural')
    const behavioralDNA = generateMockVector(384, entityType, 'behavioral')
    const economicDNA = generateMockVector(384, entityType, 'economic')
    const spatialDNA = generateMockVector(384, entityType, 'spatial')
    const compositeDNA = [...culturalDNA, ...behavioralDNA, ...economicDNA, ...spatialDNA]

    return {
      entityId,
      entityType,
      culturalDNA,
      behavioralDNA,
      economicDNA,
      spatialDNA,
      compositeDNA,
      generatedAt: new Date(),
      confidenceScore: 0.5
    }
  } catch (error) {
    console.error('Error fetching entity DNA:', error)
    return null
  }
}

/**
 * Get user's influence preferences from MediaID settings
 * Stored in media_ids.content_flags.dna_preferences
 */
export async function getUserInfluencePreferences(
  userId: string
): Promise<UserInfluencePreferences> {
  try {
    const { data, error } = await supabase
      .from('media_ids')
      .select('content_flags')
      .eq('user_uuid', userId)
      .single()

    if (error || !data) {
      return getDefaultUserPreferences(userId)
    }

    const dnaPrefs = data.content_flags?.dna_preferences

    if (!dnaPrefs) {
      return getDefaultUserPreferences(userId)
    }

    return {
      userId,
      culturalMultiplier: dnaPrefs.culturalMultiplier ?? 1.0,
      behavioralMultiplier: dnaPrefs.behavioralMultiplier ?? 1.0,
      economicMultiplier: dnaPrefs.economicMultiplier ?? 1.0,
      spatialMultiplier: dnaPrefs.spatialMultiplier ?? 1.0,
      learningRate: dnaPrefs.learningRate ?? 0.1,
      contextMultipliers: dnaPrefs.contextMultipliers,
      updatedAt: new Date(dnaPrefs.updatedAt || Date.now())
    }
  } catch (error) {
    console.error('Error fetching user influence preferences:', error)
    return getDefaultUserPreferences(userId)
  }
}

/**
 * Save user's influence preferences to MediaID settings
 */
export async function saveUserInfluencePreferences(
  preferences: UserInfluencePreferences
): Promise<boolean> {
  try {
    // Fetch current content_flags
    const { data: currentData } = await supabase
      .from('media_ids')
      .select('content_flags')
      .eq('user_uuid', preferences.userId)
      .single()

    const currentFlags = currentData?.content_flags || {}

    // Update dna_preferences within content_flags
    const updatedFlags = {
      ...currentFlags,
      dna_preferences: {
        culturalMultiplier: preferences.culturalMultiplier,
        behavioralMultiplier: preferences.behavioralMultiplier,
        economicMultiplier: preferences.economicMultiplier,
        spatialMultiplier: preferences.spatialMultiplier,
        learningRate: preferences.learningRate,
        contextMultipliers: preferences.contextMultipliers,
        updatedAt: new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('media_ids')
      .update({ content_flags: updatedFlags })
      .eq('user_uuid', preferences.userId)

    if (error) {
      console.error('Error saving user influence preferences:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving user influence preferences:', error)
    return false
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Compute composite DNA from 4 domains
 * Default weights: Cultural 40%, Behavioral 30%, Economic 15%, Spatial 15%
 * Can be customized based on user preferences
 */
function computeCompositeDNA(
  culturalDNA: number[],
  behavioralDNA: number[],
  economicDNA: number[],
  spatialDNA: number[],
  weights: { cultural: number; behavioral: number; economic: number; spatial: number } = {
    cultural: 0.4,
    behavioral: 0.3,
    economic: 0.15,
    spatial: 0.15
  }
): number[] {
  // Normalize weights
  const totalWeight = weights.cultural + weights.behavioral + weights.economic + weights.spatial
  const normCultural = weights.cultural / totalWeight
  const normBehavioral = weights.behavioral / totalWeight
  const normEconomic = weights.economic / totalWeight
  const normSpatial = weights.spatial / totalWeight

  // Weighted combination
  const compositeDNA: number[] = []

  for (let i = 0; i < 384; i++) {
    compositeDNA.push(
      normCultural * culturalDNA[i] +
      normBehavioral * behavioralDNA[i] +
      normEconomic * economicDNA[i] +
      normSpatial * spatialDNA[i]
    )
  }

  // Repeat for full 1536-d vector (or just concat the 4 domains)
  // For now, we'll concat the 4 domains
  return [...culturalDNA, ...behavioralDNA, ...economicDNA, ...spatialDNA]
}

/**
 * Calculate L2 norm (Euclidean distance) between two vectors
 * Measures how much the DNA changed
 */
function calculateL2Norm(vector1: number[], vector2: number[]): number {
  let sum = 0
  for (let i = 0; i < vector1.length; i++) {
    const diff = vector1[i] - vector2[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Initialize default DNA for new users
 * Creates neutral 4-domain DNA based on MediaID inputs (ATGC bases)
 */
async function initializeDefaultDNA(userId: string, mediaIdId: string): Promise<MediaIDDNA> {
  // Generate default vectors (normalized random or zeros)
  const culturalDNA = generateDefaultVector(384)
  const behavioralDNA = generateDefaultVector(384)
  const economicDNA = generateDefaultVector(384)
  const spatialDNA = generateDefaultVector(384)
  const compositeDNA = [...culturalDNA, ...behavioralDNA, ...economicDNA, ...spatialDNA]

  const defaultDNA: MediaIDDNA = {
    userId,
    mediaIdId,
    culturalDNA,
    behavioralDNA,
    economicDNA,
    spatialDNA,
    compositeDNA,
    lastUpdated: new Date(),
    generationVersion: 1,
    confidenceScore: 0.1, // Low confidence for default DNA
    halfLifeDays: 90,
    lastInteraction: new Date()
  }

  // Save to database
  await saveUserDNA(defaultDNA)

  return defaultDNA
}

/**
 * Generate default vector (zeros or small random values)
 */
function generateDefaultVector(dimension: number): number[] {
  return Array(dimension).fill(0).map(() => (Math.random() - 0.5) * 0.01)
}

/**
 * Generate mock vector for entity DNA (temporary for MVP)
 * In production, use proper embeddings from audio analysis or ML models
 */
function generateMockVector(dimension: number, entityType: string, domain: string): number[] {
  // Seed based on entity type and domain for consistency
  const seed = (entityType.length + domain.length) / 10
  return Array(dimension).fill(0).map((_, i) => Math.sin(seed + i * 0.1) * 0.5)
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  mirrorInteractionToDNA as default,
  getUserDNA,
  saveUserDNA,
  getEntityDNA,
  getUserInfluencePreferences,
  saveUserInfluencePreferences,
  computeCompositeDNA
}
