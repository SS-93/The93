/**
 * =============================================================================
 * DNA CARBON DECAY MODEL
 * =============================================================================
 * 
 * Part of: Buckets V2 Trinity → MediaID System
 * V2 Living Index: #1 MediaID (Citizen ID + DNA)
 * Frontend Architecture: lib/dna/decay.ts
 * 
 * PURPOSE:
 * Implement temporal decay and reinforcement (mirroring) for MediaID DNA.
 * Models natural biological processes where recent signals are stronger
 * and old signals fade over time - like carbon dating.
 * 
 * DNA EVOLUTION MECHANISMS:
 * 1. **Decay**: Old signals fade over time (exponential decay model)
 * 2. **Mirroring**: DNA shifts toward engaged content (reinforcement learning)
 * 3. **Amplification**: Resonance with matching entities strengthens signals
 * 
 * CARBON DECAY ANALOGY:
 * Just like carbon-14 decays with a half-life, DNA signals have a half-life
 * (default 30 days). A user who listened to jazz 6 months ago but switched
 * to electronic music should have their cultural DNA reflect the recent change.
 * 
 * MIRRORING (REINFORCEMENT):
 * When a user engages with content (plays a track, votes for an artist,
 * attends an event), their DNA shifts slightly toward that content's DNA.
 * This is like muscle memory - repeated actions strengthen neural pathways.
 * 
 * INTEGRATION POINTS:
 * - Triggered by: All user engagement events
 * - Consumes from: Coliseum metrics (engagement logs)
 * - Updates: mediaid_dna table
 * - Logs to: mediaid_dna_evolution table
 * 
 * DEPENDENCIES:
 * - @/types/dna (type definitions)
 * 
 * =============================================================================
 */

import { DNADecayConfig, DNADomain } from '@/types/dna'

// =============================================================================
// DECAY FUNCTIONS
// =============================================================================

/**
 * Apply carbon decay to DNA vector
 * 
 * Implements exponential decay:
 * decay_factor = 0.5^(age / half_life)
 * 
 * Example with 30-day half-life:
 * - 0 days old: 100% strength
 * - 30 days old: 50% strength
 * - 60 days old: 25% strength
 * - 90 days old: 12.5% strength
 * 
 * @param vector - DNA vector to decay
 * @param ageDays - Days since vector was last updated
 * @param config - Decay configuration
 * @returns Decayed vector
 */
export function applyDecay(
  vector: number[],
  ageDays: number,
  config: DNADecayConfig = { half_life_days: 30, min_retention: 0.1 }
): number[] {
  console.log(`[DNA Decay] Applying decay for ${ageDays} days (half-life: ${config.half_life_days})`)
  
  // Calculate decay factor
  const decayFactor = calculateDecayFactor(ageDays, config)
  
  // Apply decay with minimum retention floor
  const decayed = vector.map(val => {
    const decayedVal = val * decayFactor
    const minVal = val * config.min_retention
    return Math.max(decayedVal, minVal)
  })
  
  console.log(`[DNA Decay] Decay factor: ${(decayFactor * 100).toFixed(1)}%`)
  
  return decayed
}

/**
 * Calculate decay factor based on age
 * 
 * Uses exponential decay formula:
 * factor = 0.5^(age / half_life)
 * 
 * @param ageDays - Age in days
 * @param config - Decay configuration
 * @returns Decay factor (0-1)
 */
function calculateDecayFactor(
  ageDays: number,
  config: DNADecayConfig
): number {
  if (ageDays <= 0) return 1.0
  
  // Exponential decay: factor = 0.5^(age / half_life)
  const factor = Math.pow(0.5, ageDays / config.half_life_days)
  
  // Ensure minimum retention
  return Math.max(factor, config.min_retention)
}

/**
 * Apply domain-specific decay
 * 
 * Different DNA domains may decay at different rates:
 * - Cultural: Medium decay (30 days) - tastes evolve gradually
 * - Behavioral: Fast decay (15 days) - habits change quickly
 * - Economic: Slow decay (60 days) - spending patterns stable
 * - Spatial: Very slow decay (90 days) - location changes rarely
 * 
 * @param vector - DNA vector to decay
 * @param ageDays - Days since last update
 * @param domain - DNA domain
 * @param config - Decay configuration
 * @returns Decayed vector
 */
export function applyDomainSpecificDecay(
  vector: number[],
  ageDays: number,
  domain: DNADomain,
  config?: DNADecayConfig
): number[] {
  // Domain-specific half-lives
  const domainHalfLives: Record<DNADomain, number> = {
    cultural: 30,      // Medium decay
    behavioral: 15,    // Fast decay
    economic: 60,      // Slow decay
    spatial: 90        // Very slow decay
  }
  
  // Use domain-specific or config half-life
  const halfLife = config?.domain_specific?.[domain] ||
                   domainHalfLives[domain] ||
                   30
  
  const domainConfig: DNADecayConfig = {
    half_life_days: halfLife,
    min_retention: config?.min_retention || 0.1
  }
  
  return applyDecay(vector, ageDays, domainConfig)
}

// =============================================================================
// MIRRORING (REINFORCEMENT) FUNCTIONS
// =============================================================================

/**
 * Apply DNA mirroring (reinforcement learning)
 * 
 * When user engages with content, their DNA shifts toward it.
 * This is a linear interpolation: newDNA = oldDNA + strength * (contentDNA - oldDNA)
 * 
 * Strength typically 0.05-0.2 depending on engagement depth:
 * - 0.05: Light engagement (skip, brief view)
 * - 0.1: Medium engagement (play, vote)
 * - 0.15: Strong engagement (favorite, subscribe)
 * - 0.2: Very strong engagement (purchase, repeat engagement)
 * 
 * @param userDNA - User's current DNA vector
 * @param contentDNA - Content's DNA vector to mirror toward
 * @param strength - Mirroring strength (0-1, typically 0.05-0.2)
 * @returns Mirrored DNA vector
 */
export function applyMirroring(
  userDNA: number[],
  contentDNA: number[],
  strength: number = 0.1
): number[] {
  if (userDNA.length !== contentDNA.length) {
    throw new Error('DNA vector length mismatch')
  }
  
  // Clamp strength to valid range
  const clampedStrength = Math.max(0, Math.min(1, strength))
  
  console.log(`[DNA Mirroring] Applying mirroring with strength ${(clampedStrength * 100).toFixed(1)}%`)
  
  // Linear interpolation toward content DNA
  const mirrored = userDNA.map((val, i) =>
    val + clampedStrength * (contentDNA[i] - val)
  )
  
  return mirrored
}

/**
 * Calculate mirroring strength based on engagement type
 * 
 * @param engagementType - Type of engagement
 * @returns Mirroring strength (0-1)
 */
export function getMirroringStrength(engagementType: string): number {
  const strengthMap: Record<string, number> = {
    // Light engagement
    'view': 0.02,
    'skip': 0.01,
    'impression': 0.01,
    
    // Medium engagement
    'play': 0.1,
    'vote': 0.1,
    'like': 0.08,
    'share': 0.12,
    'comment': 0.1,
    
    // Strong engagement
    'favorite': 0.15,
    'subscribe': 0.18,
    'follow': 0.15,
    'rsvp': 0.15,
    'attend': 0.2,
    
    // Very strong engagement
    'purchase': 0.25,
    'repeat_engagement': 0.2,
    'binge': 0.22
  }
  
  return strengthMap[engagementType] || 0.1 // Default medium strength
}

// =============================================================================
// AMPLIFICATION FUNCTIONS
// =============================================================================

/**
 * Apply resonance amplification
 * 
 * When user engages with DNA-matched content (high match score),
 * the mirroring effect is amplified. This creates reinforcement loops
 * where good matches strengthen DNA alignment.
 * 
 * @param baseStrength - Base mirroring strength
 * @param matchScore - DNA match score (0-1)
 * @param amplificationFactor - Max amplification (default 2.0 = 2x)
 * @returns Amplified strength
 */
export function applyAmplification(
  baseStrength: number,
  matchScore: number,
  amplificationFactor: number = 2.0
): number {
  // Amplification scales with match score
  // High match → strong amplification
  // Low match → minimal amplification
  const amplification = 1 + (amplificationFactor - 1) * matchScore
  
  const amplifiedStrength = baseStrength * amplification
  
  // Clamp to reasonable range
  return Math.min(amplifiedStrength, 0.3)
}

// =============================================================================
// COMPLETE DNA EVOLUTION
// =============================================================================

/**
 * Evolve DNA based on decay + mirroring
 * 
 * Main evolution function combining:
 * 1. Apply decay based on age
 * 2. Apply mirroring from recent engagement
 * 3. Normalize result
 * 
 * @param currentDNA - User's current DNA vector
 * @param ageDays - Days since last DNA update
 * @param engagements - Recent engagements to mirror
 * @param config - Evolution configuration
 * @returns Evolved DNA vector
 */
export async function evolveDNA(
  currentDNA: number[],
  ageDays: number,
  engagements: Array<{
    contentDNA: number[]
    engagementType: string
    matchScore?: number
  }>,
  config?: DNADecayConfig
): Promise<number[]> {
  console.log(`[DNA Evolution] Evolving DNA with ${engagements.length} engagements`)
  
  // 1. Apply decay
  let evolved = applyDecay(currentDNA, ageDays, config)
  
  // 2. Apply mirroring for each engagement
  for (const engagement of engagements) {
    const baseStrength = getMirroringStrength(engagement.engagementType)
    
    // Amplify if match score provided
    const strength = engagement.matchScore
      ? applyAmplification(baseStrength, engagement.matchScore)
      : baseStrength
    
    evolved = applyMirroring(evolved, engagement.contentDNA, strength)
  }
  
  // 3. Normalize to unit vector
  evolved = normalize(evolved)
  
  console.log(`[DNA Evolution] Evolution complete`)
  
  return evolved
}

/**
 * Batch evolve multiple domain DNAs
 * 
 * @param domains - Map of domain DNAs to evolve
 * @param ageDays - Days since last update
 * @param engagements - Recent engagements per domain
 * @param config - Evolution configuration
 * @returns Evolved domain DNAs
 */
export async function evolveAllDomains(
  domains: Record<DNADomain, number[]>,
  ageDays: number,
  engagements: Record<DNADomain, Array<{
    contentDNA: number[]
    engagementType: string
    matchScore?: number
  }>>,
  config?: DNADecayConfig
): Promise<Record<DNADomain, number[]>> {
  const evolved: Record<DNADomain, number[]> = {} as any
  
  for (const domain of Object.keys(domains) as DNADomain[]) {
    const domainEngagements = engagements[domain] || []
    
    evolved[domain] = await evolveDNA(
      domains[domain],
      ageDays,
      domainEngagements,
      config
    )
  }
  
  return evolved
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize vector to unit length
 * 
 * @param vector - Vector to normalize
 * @returns Normalized vector
 */
function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  )
  
  if (magnitude === 0) {
    console.warn('[DNA Decay] Zero magnitude vector, returning as-is')
    return vector
  }
  
  return vector.map(val => val / magnitude)
}

/**
 * Calculate vector distance after decay/mirroring
 * Useful for tracking DNA evolution magnitude
 * 
 * @param before - DNA before evolution
 * @param after - DNA after evolution
 * @returns Euclidean distance
 */
export function calculateEvolutionDistance(
  before: number[],
  after: number[]
): number {
  if (before.length !== after.length) {
    throw new Error('Vector length mismatch')
  }
  
  const squaredDiffs = before.map((val, i) =>
    Math.pow(val - after[i], 2)
  )
  
  return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0))
}

/**
 * Check if DNA has evolved significantly
 * 
 * @param before - DNA before evolution
 * @param after - DNA after evolution
 * @param threshold - Threshold for "significant" (default 0.1)
 * @returns True if evolution is significant
 */
export function hasSignificantEvolution(
  before: number[],
  after: number[],
  threshold: number = 0.1
): boolean {
  const distance = calculateEvolutionDistance(before, after)
  return distance >= threshold
}

// =============================================================================
// DECAY SCHEDULING
// =============================================================================

/**
 * Calculate when DNA should be next refreshed
 * 
 * DNA refresh is recommended when decay has reached a threshold
 * (e.g., 25% decay from original signal strength)
 * 
 * @param lastUpdateDate - Date of last DNA update
 * @param config - Decay configuration
 * @param decayThreshold - Threshold for refresh (default 0.75 = 25% decay)
 * @returns Days until recommended refresh
 */
export function calculateRefreshSchedule(
  lastUpdateDate: Date,
  config: DNADecayConfig = { half_life_days: 30, min_retention: 0.1 },
  decayThreshold: number = 0.75
): number {
  // Calculate days for decay to reach threshold
  // threshold = 0.5^(days / half_life)
  // days = half_life * log(threshold) / log(0.5)
  
  const daysToThreshold = config.half_life_days *
    Math.log(decayThreshold) / Math.log(0.5)
  
  // Calculate days since last update
  const daysSinceUpdate = (Date.now() - lastUpdateDate.getTime()) /
    (1000 * 60 * 60 * 24)
  
  // Days until refresh needed
  const daysUntilRefresh = Math.max(0, daysToThreshold - daysSinceUpdate)
  
  return Math.ceil(daysUntilRefresh)
}

