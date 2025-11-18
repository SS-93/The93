/**
 * =============================================================================
 * DNA MATCHING ENGINE
 * =============================================================================
 * 
 * Part of: Buckets V2 Trinity → MediaID System
 * V2 Living Index: #1 MediaID (Citizen ID + DNA)
 * Frontend Architecture: lib/dna/matcher.ts
 * 
 * PURPOSE:
 * Calculate similarity between DNA profiles using cosine similarity and
 * context-adaptive weighting. Powers all recommendations, targeting, and
 * resonance calculations across the Buckets ecosystem.
 * 
 * MATCHING ALGORITHM:
 * 1. Calculate domain-specific cosine similarity scores
 * 2. Apply context-adaptive weights based on use case
 * 3. Combine into composite match score
 * 4. Generate human-readable interpretation
 * 5. Provide match reasoning for transparency
 * 
 * CONTEXT-ADAPTIVE WEIGHTING:
 * - Recommendation: Emphasize cultural (music taste) → 50% cultural
 * - Targeting: Emphasize economic (spending) → 40% economic
 * - Collaboration: Balance cultural + behavioral → 40% cultural, 40% behavioral
 * - Event: Balance cultural + spatial → 30% each
 * 
 * USE CASES:
 * - Content recommendations (tracks, artists, events)
 * - Brand targeting (DNA-based audience selection)
 * - Artist collaboration matching
 * - Event attendee matching
 * - CALS share recommendations (who to share with)
 * 
 * INTEGRATION POINTS:
 * - Used by: DNAMatchScore component, Recommendation engine
 * - Powers: Coliseum Analytics audience insights
 * - Feeds: Treasury attribution (DNA-weighted referrals)
 * - Enables: Compañon brand targeting
 * 
 * DEPENDENCIES:
 * - @/types/dna (type definitions)
 * 
 * =============================================================================
 */

import { MediaIDDNA, DNAMatchResult, DNAMatchContext, DNADomain } from '@/types/dna'

// =============================================================================
// CORE MATCHING FUNCTIONS
// =============================================================================

/**
 * Calculate cosine similarity between two vectors
 * 
 * Formula: cos(θ) = (A · B) / (||A|| × ||B||)
 * Where:
 * - A · B = dot product
 * - ||A|| = magnitude of vector A
 * - ||B|| = magnitude of vector B
 * 
 * Result: Value between -1 and 1
 * - 1 = identical vectors
 * - 0 = orthogonal (no similarity)
 * - -1 = opposite vectors
 * 
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity score (0-1, normalized to positive range)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`)
  }
  
  if (a.length === 0) {
    return 0
  }
  
  // Calculate dot product
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }
  
  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)
  
  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }
  
  const similarity = dotProduct / (magnitudeA * magnitudeB)
  
  // Normalize to 0-1 range (cosine similarity can be negative)
  // For DNA matching, we only care about positive similarity
  return Math.max(0, similarity)
}

/**
 * Calculate DNA match with context-adaptive weighting
 * 
 * Main entry point for DNA matching
 * 
 * @param entityA - First entity's DNA profile
 * @param entityB - Second entity's DNA profile
 * @param context - Match context for adaptive weighting
 * @returns Complete match result with scores and interpretation
 */
export function calculateDNAMatch(
  entityA: MediaIDDNA,
  entityB: MediaIDDNA,
  context: DNAMatchContext = 'recommendation'
): DNAMatchResult {
  console.log(`[DNA Matcher] Calculating ${context} match between entities`)
  
  // 1. Get context-specific domain weights
  const weights = getContextWeights(context)
  
  // 2. Calculate domain-specific matches
  const culturalMatch = cosineSimilarity(
    entityA.cultural_dna.vector,
    entityB.cultural_dna.vector
  )
  
  const behavioralMatch = cosineSimilarity(
    entityA.behavioral_dna.vector,
    entityB.behavioral_dna.vector
  )
  
  const economicMatch = cosineSimilarity(
    entityA.economic_dna.vector,
    entityB.economic_dna.vector
  )
  
  const spatialMatch = cosineSimilarity(
    entityA.spatial_dna.vector,
    entityB.spatial_dna.vector
  )
  
  // 3. Calculate weighted composite score
  const compositeScore =
    culturalMatch * weights.cultural +
    behavioralMatch * weights.behavioral +
    economicMatch * weights.economic +
    spatialMatch * weights.spatial
  
  // 4. Adjust for confidence
  // Lower confidence scores reduce match reliability
  const confidenceMultiplier = Math.sqrt(
    entityA.confidence_score * entityB.confidence_score
  )
  const adjustedScore = compositeScore * confidenceMultiplier
  
  // 5. Generate interpretation
  const interpretation = interpretScore(adjustedScore)
  
  // 6. Generate match reasons
  const reasons = generateMatchReasons(
    culturalMatch,
    behavioralMatch,
    economicMatch,
    spatialMatch,
    context
  )
  
  const result: DNAMatchResult = {
    composite_score: adjustedScore,
    cultural_match: culturalMatch,
    behavioral_match: behavioralMatch,
    economic_match: economicMatch,
    spatial_match: spatialMatch,
    interpretation,
    reasons,
    context
  }
  
  console.log(`[DNA Matcher] Match result:`, {
    composite: (adjustedScore * 100).toFixed(1) + '%',
    interpretation,
    topDomain: getTopMatchingDomain(result)
  })
  
  return result
}

// =============================================================================
// CONTEXT-ADAPTIVE WEIGHTING
// =============================================================================

/**
 * Get domain weights based on match context
 * 
 * Different use cases emphasize different DNA domains
 * 
 * @param context - Match context
 * @returns Domain weights (sum to 1.0)
 */
function getContextWeights(context: DNAMatchContext): Record<DNADomain, number> {
  switch (context) {
    case 'recommendation':
      // Music recommendations: Emphasize cultural (taste)
      return { cultural: 0.5, behavioral: 0.3, economic: 0.1, spatial: 0.1 }
    
    case 'targeting':
      // Brand targeting: Emphasize economic (spending power)
      return { cultural: 0.3, behavioral: 0.2, economic: 0.4, spatial: 0.1 }
    
    case 'collab':
      // Artist collaboration: Balance cultural and behavioral
      return { cultural: 0.4, behavioral: 0.4, economic: 0.1, spatial: 0.1 }
    
    case 'event':
      // Event matching: Balance cultural (taste) and spatial (location)
      return { cultural: 0.3, behavioral: 0.2, economic: 0.2, spatial: 0.3 }
    
    default:
      // Balanced default
      return { cultural: 0.25, behavioral: 0.25, economic: 0.25, spatial: 0.25 }
  }
}

// =============================================================================
// INTERPRETATION & REASONING
// =============================================================================

/**
 * Interpret composite match score into human-readable text
 * 
 * @param score - Composite match score (0-1)
 * @returns Human-readable interpretation
 */
function interpretScore(score: number): string {
  if (score >= 0.9) return 'Exceptional match - Highly compatible DNA profiles'
  if (score >= 0.8) return 'Excellent match - Strong DNA alignment'
  if (score >= 0.7) return 'Strong match - Good DNA compatibility'
  if (score >= 0.6) return 'Good match - Notable DNA similarities'
  if (score >= 0.5) return 'Moderate match - Some DNA overlap'
  if (score >= 0.4) return 'Fair match - Limited DNA alignment'
  if (score >= 0.3) return 'Weak match - Minimal DNA compatibility'
  return 'Poor match - Significant DNA differences'
}

/**
 * Generate match reasons explaining why entities match
 * 
 * @param cultural - Cultural match score
 * @param behavioral - Behavioral match score
 * @param economic - Economic match score
 * @param spatial - Spatial match score
 * @param context - Match context
 * @returns Array of human-readable reasons
 */
function generateMatchReasons(
  cultural: number,
  behavioral: number,
  economic: number,
  spatial: number,
  context: DNAMatchContext
): string[] {
  const reasons: string[] = []
  
  // Thresholds for "notable" matches
  const strongThreshold = 0.7
  const goodThreshold = 0.6
  
  // Cultural reasons
  if (cultural >= strongThreshold) {
    reasons.push('🎵 Exceptional music taste alignment')
  } else if (cultural >= goodThreshold) {
    reasons.push('🎵 Similar music preferences and genres')
  }
  
  // Behavioral reasons
  if (behavioral >= strongThreshold) {
    reasons.push('⚡ Highly aligned engagement patterns')
  } else if (behavioral >= goodThreshold) {
    reasons.push('⚡ Similar interaction and discovery habits')
  }
  
  // Economic reasons
  if (economic >= strongThreshold) {
    reasons.push('💰 Strong value and spending alignment')
  } else if (economic >= goodThreshold) {
    reasons.push('💰 Compatible economic preferences')
  }
  
  // Spatial reasons
  if (spatial >= strongThreshold) {
    reasons.push('📍 Same geographic area and local scene')
  } else if (spatial >= goodThreshold) {
    reasons.push('📍 Geographic proximity and location overlap')
  }
  
  // Context-specific reasons
  if (context === 'event' && spatial >= goodThreshold) {
    reasons.push('🎪 Great event match based on location')
  }
  
  if (context === 'targeting' && economic >= goodThreshold) {
    reasons.push('🎯 Strong fit for brand targeting')
  }
  
  // Fallback if no strong matches
  if (reasons.length === 0) {
    reasons.push('Some potential alignment detected')
  }
  
  return reasons
}

/**
 * Get the top matching domain
 * 
 * @param matchResult - Match result
 * @returns Top matching domain name
 */
function getTopMatchingDomain(matchResult: DNAMatchResult): DNADomain {
  const scores = {
    cultural: matchResult.cultural_match,
    behavioral: matchResult.behavioral_match,
    economic: matchResult.economic_match,
    spatial: matchResult.spatial_match
  }
  
  return Object.entries(scores).reduce((top, [domain, score]) =>
    score > scores[top as DNADomain] ? domain as DNADomain : top,
    'cultural' as DNADomain
  )
}

// =============================================================================
// BATCH MATCHING
// =============================================================================

/**
 * Calculate matches for multiple entities
 * Useful for recommendation lists
 * 
 * @param userDNA - User's DNA profile
 * @param candidateDNAs - Array of candidate DNA profiles
 * @param context - Match context
 * @param limit - Maximum number of results
 * @returns Sorted array of match results
 */
export function batchCalculateDNAMatch(
  userDNA: MediaIDDNA,
  candidateDNAs: MediaIDDNA[],
  context: DNAMatchContext = 'recommendation',
  limit?: number
): DNAMatchResult[] {
  console.log(`[DNA Matcher] Batch matching ${candidateDNAs.length} candidates`)
  
  // Calculate matches for all candidates
  const matches = candidateDNAs.map(candidateDNA =>
    calculateDNAMatch(userDNA, candidateDNA, context)
  )
  
  // Sort by composite score (descending)
  matches.sort((a, b) => b.composite_score - a.composite_score)
  
  // Apply limit if specified
  if (limit && limit > 0) {
    return matches.slice(0, limit)
  }
  
  return matches
}

// =============================================================================
// MATCH FILTERING
// =============================================================================

/**
 * Filter matches by minimum score threshold
 * 
 * @param matches - Array of match results
 * @param minScore - Minimum composite score
 * @returns Filtered matches
 */
export function filterMatchesByScore(
  matches: DNAMatchResult[],
  minScore: number
): DNAMatchResult[] {
  return matches.filter(match => match.composite_score >= minScore)
}

/**
 * Filter matches by domain-specific criteria
 * 
 * @param matches - Array of match results
 * @param domainCriteria - Minimum scores per domain
 * @returns Filtered matches
 */
export function filterMatchesByDomain(
  matches: DNAMatchResult[],
  domainCriteria: Partial<Record<DNADomain, number>>
): DNAMatchResult[] {
  return matches.filter(match => {
    if (domainCriteria.cultural && match.cultural_match < domainCriteria.cultural) return false
    if (domainCriteria.behavioral && match.behavioral_match < domainCriteria.behavioral) return false
    if (domainCriteria.economic && match.economic_match < domainCriteria.economic) return false
    if (domainCriteria.spatial && match.spatial_match < domainCriteria.spatial) return false
    return true
  })
}

// =============================================================================
// MATCH DIVERSITY
// =============================================================================

/**
 * Diversify match results to avoid filter bubbles
 * 
 * Returns a diverse set of matches rather than just top scores
 * Useful for serendipitous discovery
 * 
 * @param matches - Array of match results
 * @param targetSize - Desired result set size
 * @param diversityRatio - Ratio of diverse picks (0-1, default 0.3)
 * @returns Diversified match results
 */
export function diversifyMatches(
  matches: DNAMatchResult[],
  targetSize: number,
  diversityRatio: number = 0.3
): DNAMatchResult[] {
  if (matches.length <= targetSize) {
    return matches
  }
  
  const topPickCount = Math.ceil(targetSize * (1 - diversityRatio))
  const diversePickCount = targetSize - topPickCount
  
  // Take top matches
  const topMatches = matches.slice(0, topPickCount)
  
  // Sample diverse matches from remaining
  const remainingMatches = matches.slice(topPickCount)
  const diverseMatches = sampleRandom(remainingMatches, diversePickCount)
  
  return [...topMatches, ...diverseMatches]
}

/**
 * Sample random elements from array
 */
function sampleRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// =============================================================================
// MATCH EXPLANATION
// =============================================================================

/**
 * Generate detailed match explanation
 * For user transparency and debugging
 * 
 * @param matchResult - Match result to explain
 * @returns Detailed explanation object
 */
export function explainMatch(matchResult: DNAMatchResult): {
  summary: string
  domainBreakdown: Array<{ domain: DNADomain; score: number; weight: number; contribution: number }>
  strongestDomain: DNADomain
  weakestDomain: DNADomain
  recommendations: string[]
} {
  const weights = getContextWeights(matchResult.context)
  
  const domainBreakdown = [
    {
      domain: 'cultural' as DNADomain,
      score: matchResult.cultural_match,
      weight: weights.cultural,
      contribution: matchResult.cultural_match * weights.cultural
    },
    {
      domain: 'behavioral' as DNADomain,
      score: matchResult.behavioral_match,
      weight: weights.behavioral,
      contribution: matchResult.behavioral_match * weights.behavioral
    },
    {
      domain: 'economic' as DNADomain,
      score: matchResult.economic_match,
      weight: weights.economic,
      contribution: matchResult.economic_match * weights.economic
    },
    {
      domain: 'spatial' as DNADomain,
      score: matchResult.spatial_match,
      weight: weights.spatial,
      contribution: matchResult.spatial_match * weights.spatial
    }
  ]
  
  // Sort by contribution
  domainBreakdown.sort((a, b) => b.contribution - a.contribution)
  
  const strongestDomain = domainBreakdown[0].domain
  const weakestDomain = domainBreakdown[domainBreakdown.length - 1].domain
  
  const recommendations: string[] = []
  
  if (matchResult.composite_score >= 0.7) {
    recommendations.push('This is a strong match - highly recommend exploring')
  } else if (matchResult.composite_score >= 0.5) {
    recommendations.push('This is a decent match - worth checking out')
  } else {
    recommendations.push('This match is exploratory - may lead to discovery')
  }
  
  return {
    summary: matchResult.interpretation,
    domainBreakdown,
    strongestDomain,
    weakestDomain,
    recommendations
  }
}

