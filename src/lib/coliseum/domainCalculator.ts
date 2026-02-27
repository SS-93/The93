/**
 * ============================================================================
 * COLISEUM ANALYTICS - DNA DOMAIN STRENGTH CALCULATOR
 * ============================================================================
 * Purpose: Calculate A/T/G/C domain strength scores from Passport events
 * Alignment: Buckets V2 MVP Sprint Protocol
 * ============================================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PassportEvent } from '../passport/events';

// ============================================================================
// TYPES
// ============================================================================

export type DNADomain = 'A' | 'T' | 'G' | 'C';
export type TimeRange = '7d' | '30d' | 'alltime';

export interface DNAMutation {
  domain: DNADomain;
  key: string;
  delta: number;
  weight: number;
  recency_decay: number;
  effective_delta: number; // delta × weight × recency_decay
}

export interface DomainStrength {
  entity_id: string;
  entity_type: 'artist' | 'event' | 'user' | 'brand';
  time_range: TimeRange;
  a_strength: number;
  t_strength: number;
  g_strength: number;
  c_strength: number;
  a_metadata: AdenineMetadata;
  t_metadata: ThymineMetadata;
  g_metadata: GuanineMetadata;
  c_metadata: CytosineMetadata;
}

// A-Domain (Cultural) metadata
export interface AdenineMetadata {
  genre_diversity_index: number; // Shannon entropy (0-1)
  cultural_influence_radius: number; // Degrees of separation
  crossover_potential: number; // Can bridge genres? (0-1)
  niche_depth: number; // Deep specialist vs generalist (0-1)
  primary_genres: string[];
  genre_engagement: Record<string, number>; // Genre → engagement count
}

// T-Domain (Behavioral) metadata
export interface ThymineMetadata {
  loyalty_index: number; // Repeat interactions / total (0-1)
  conversion_rate: number; // RSVP → Attend, View → Purchase (0-1)
  superfan_percentage: number; // % top 10% engaged (0-1)
  engagement_consistency: number; // Std dev of weekly activity (0-1)
  activation_rate: number; // % fans who take action (0-1)
  churn_risk_score: number; // Likelihood of disengagement (0-1)
  avg_interactions_per_fan: number;
}

// G-Domain (Economic) metadata
export interface GuanineMetadata {
  avg_transaction_value: number; // $ per purchase
  willingness_to_pay_index: number; // Premium tier adoption (0-1)
  revenue_concentration: number; // Gini coefficient (0-1)
  lifetime_value_per_fan: number; // Predicted LTV
  monetization_efficiency: number; // Revenue / engagement ratio
  whale_fan_count: number; // Top 1% spenders
  total_revenue_cents: number;
}

// C-Domain (Spatial) metadata
export interface CytosineMetadata {
  primary_cities: string[];
  geographic_reach_index: number; // # cities / possible (0-1)
  touring_viability_score: number; // Can sustain tour? (0-1)
  city_to_city_mobility: number; // Fan overlap between cities (0-1)
  market_penetration_top_city: number; // % of city captured (0-1)
  expansion_velocity: number; // New cities per month
  city_engagement: Record<string, number>; // City → engagement count
}

// ============================================================================
// DECAY CONFIGURATION
// ============================================================================

const DECAY_CONFIGS: Record<string, { halfLifeDays: number; floor: number }> = {
  // Fast decay (buzz fades quickly)
  'player.track_played': { halfLifeDays: 7, floor: 0.1 },
  'player.track_skipped': { halfLifeDays: 7, floor: 0.1 },
  'concierto.event_viewed': { halfLifeDays: 7, floor: 0.1 },
  'core.track_viewed': { halfLifeDays: 7, floor: 0.1 },

  // Medium decay (interest persists)
  'core.artist_followed': { halfLifeDays: 30, floor: 0.3 },
  'concierto.vote_cast': { halfLifeDays: 30, floor: 0.3 },
  'concierto.event_rsvp': { halfLifeDays: 30, floor: 0.3 },
  'player.track_completed': { halfLifeDays: 14, floor: 0.2 },

  // Slow decay (commitment lasts)
  'concierto.ticket_purchased': { halfLifeDays: 90, floor: 0.5 },
  'treasury.subscription_started': { halfLifeDays: 180, floor: 0.7 },
  'locker.item_claimed': { halfLifeDays: 60, floor: 0.4 },

  // Permanent (never decays fully)
  'concierto.event_attended': { halfLifeDays: 365, floor: 0.8 },
  'core.track_uploaded': { halfLifeDays: 365, floor: 0.9 },
  'concierto.event_hosted': { halfLifeDays: 365, floor: 0.9 },
  'treasury.payout_received': { halfLifeDays: 365, floor: 0.8 },
};

/**
 * Calculate recency decay using exponential decay model (carbon dating)
 */
function calculateRecencyDecay(
  eventTimestamp: Date,
  eventType: string,
  currentTime: Date = new Date()
): number {
  const config = DECAY_CONFIGS[eventType] || { halfLifeDays: 30, floor: 0.2 };

  const daysSince =
    (currentTime.getTime() - eventTimestamp.getTime()) / (1000 * 60 * 60 * 24);

  const halfLives = daysSince / config.halfLifeDays;
  const rawDecay = Math.pow(0.5, halfLives);

  // Apply floor (never decays below this)
  return Math.max(rawDecay, config.floor);
}

// ============================================================================
// EVENT WEIGHT TIERS
// ============================================================================

const EVENT_WEIGHTS: Record<string, number> = {
  // TIER 5: Transformative (1000 base)
  'treasury.subscription_started': 1000,
  'concierto.event_hosted': 1000,
  'treasury.payout_received': 1000,
  'companon.campaign_launched': 1000,

  // TIER 4: High Intent (100 base)
  'concierto.ticket_purchased': 100,
  'concierto.event_attended': 100,
  'concierto.vote_cast': 100,
  'locker.item_claimed': 100,
  'core.track_uploaded': 100,
  'companon.offer_redeemed': 100,

  // TIER 3: Moderate (10 base)
  'concierto.event_rsvp': 10,
  'core.artist_followed': 10,
  'player.track_completed': 10,
  'locker.opened': 10,
  'companon.offer_viewed': 10,

  // TIER 2: Passive (1 base)
  'player.track_played': 1,
  'core.track_viewed': 1,
  'concierto.event_viewed': 1,
  'companon.campaign_impression': 1,

  // TIER 1: Ambient (0.1 base)
  'player.track_skipped': 0.1,
  'core.search_performed': 0.1,
  'navigation.page_viewed': 0.1,
};

function getEventWeight(eventType: string): number {
  return EVENT_WEIGHTS[eventType] || 1;
}

// ============================================================================
// DOMAIN CALCULATOR CLASS
// ============================================================================

export class DomainStrengthCalculator {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Calculate all 4 DNA domain strengths for an artist
   */
  async calculateArtistDomainStrength(
    artistId: string,
    timeRange: TimeRange
  ): Promise<DomainStrength> {
    // 1. Fetch all relevant Passport events
    const events = await this.fetchArtistEvents(artistId, timeRange);

    // 2. Generate DNA mutations from events
    const mutations = events.flatMap((event) => this.generateMutations(event));

    // 3. Aggregate by domain
    const a_strength = this.aggregateDomainStrength(mutations, 'A');
    const t_strength = this.aggregateDomainStrength(mutations, 'T');
    const g_strength = this.aggregateDomainStrength(mutations, 'G');
    const c_strength = this.aggregateDomainStrength(mutations, 'C');

    // 4. Calculate domain-specific metadata
    const a_metadata = await this.calculateAdenineMetadata(artistId, events, mutations);
    const t_metadata = await this.calculateThymineMetadata(artistId, events, mutations);
    const g_metadata = await this.calculateGuanineMetadata(artistId, events, mutations);
    const c_metadata = await this.calculateCytosineMetadata(artistId, events, mutations);

    return {
      entity_id: artistId,
      entity_type: 'artist',
      time_range: timeRange,
      a_strength,
      t_strength,
      g_strength,
      c_strength,
      a_metadata,
      t_metadata,
      g_metadata,
      c_metadata,
    };
  }

  /**
   * Fetch all Passport events related to an artist within time range
   */
  private async fetchArtistEvents(
    artistId: string,
    timeRange: TimeRange
  ): Promise<PassportEvent[]> {
    const now = new Date();
    let sinceDate: Date;

    switch (timeRange) {
      case '7d':
        sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'alltime':
        sinceDate = new Date(0); // Unix epoch
        break;
    }

    const { data, error } = await this.supabase
      .from('passport_entries')
      .select('*')
      .or(`artist_id.eq.${artistId},metadata->>artist_id.eq.${artistId}`)
      .gte('timestamp', sinceDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data as unknown as PassportEvent[];
  }

  /**
   * Generate DNA mutations from a Passport event
   */
  private generateMutations(event: PassportEvent): DNAMutation[] {
    const mutations: DNAMutation[] = [];
    const baseWeight = getEventWeight(event.event_type);
    const recencyDecay = calculateRecencyDecay(new Date(event.timestamp), event.event_type);
    const metadata = event.metadata as any || {};

    // A-Domain: Cultural mutations (genre, interests)
    if (metadata.artist_genres && Array.isArray(metadata.artist_genres)) {
      for (const genre of metadata.artist_genres) {
        mutations.push({
          domain: 'A',
          key: genre,
          delta: this.getAdenineMultiplier(event.event_type),
          weight: baseWeight,
          recency_decay: recencyDecay,
          effective_delta: 0, // Will be calculated
        });
      }
    }

    // T-Domain: Behavioral mutations (engagement, loyalty)
    mutations.push({
      domain: 'T',
      key: 'engagement',
      delta: this.getThymineMultiplier(event.event_type, metadata),
      weight: baseWeight,
      recency_decay: recencyDecay,
      effective_delta: 0,
    });

    // G-Domain: Economic mutations (revenue, transactions)
    if (metadata.amount_cents || event.event_type.includes('purchase') || event.event_type.includes('payout')) {
      mutations.push({
        domain: 'G',
        key: 'revenue',
        delta: (metadata.amount_cents || 0) / 100, // Cents to dollars
        weight: baseWeight,
        recency_decay: recencyDecay,
        effective_delta: 0,
      });
    }

    // C-Domain: Spatial mutations (city, location)
    if (metadata.city) {
      mutations.push({
        domain: 'C',
        key: `city:${metadata.city}`,
        delta: this.getCytosineMultiplier(event.event_type),
        weight: baseWeight,
        recency_decay: recencyDecay,
        effective_delta: 0,
      });
    }

    // Calculate effective_delta for all mutations
    for (const mutation of mutations) {
      mutation.effective_delta = mutation.delta * mutation.weight * mutation.recency_decay;
    }

    return mutations;
  }

  /**
   * A-Domain multipliers (how much each event affects cultural DNA)
   */
  private getAdenineMultiplier(eventType: string): number {
    const multipliers: Record<string, number> = {
      'concierto.event_attended': 1.0, // Strong cultural signal
      'concierto.ticket_purchased': 0.8,
      'concierto.vote_cast': 0.5,
      'core.artist_followed': 0.4,
      'player.track_completed': 0.3,
      'player.track_played': 0.1,
      'player.track_skipped': -0.05, // Negative!
    };
    return multipliers[eventType] || 0.1;
  }

  /**
   * T-Domain multipliers (behavioral engagement depth)
   */
  private getThymineMultiplier(eventType: string, metadata: any): number {
    let baseMultiplier = 1.0;

    // Completion boost
    if (metadata.completion_pct) {
      baseMultiplier *= 1 + (metadata.completion_pct ** 2) * 2; // 100% = 3x
    }

    // Conversion boost
    if (metadata.is_conversion) {
      baseMultiplier *= 3.0;
    }

    // Event type modifiers
    const typeMultipliers: Record<string, number> = {
      'concierto.event_attended': 1.0,
      'concierto.vote_cast': 0.8,
      'player.track_completed': 0.6,
      'concierto.ticket_purchased': 0.9,
      'player.track_played': 0.3,
    };

    return baseMultiplier * (typeMultipliers[eventType] || 0.5);
  }

  /**
   * C-Domain multipliers (spatial engagement)
   */
  private getCytosineMultiplier(eventType: string): number {
    const multipliers: Record<string, number> = {
      'concierto.event_attended': 2.0, // In-person = strong signal
      'concierto.ticket_purchased': 1.5,
      'concierto.event_rsvp': 0.8,
      'concierto.event_viewed': 0.3,
    };
    return multipliers[eventType] || 0.1;
  }

  /**
   * Aggregate mutations by domain to get total strength
   */
  private aggregateDomainStrength(mutations: DNAMutation[], domain: DNADomain): number {
    return mutations
      .filter((m) => m.domain === domain)
      .reduce((sum, m) => sum + m.effective_delta, 0);
  }

  /**
   * Calculate A-Domain (Cultural) metadata
   */
  private async calculateAdenineMetadata(
    artistId: string,
    events: PassportEvent[],
    mutations: DNAMutation[]
  ): Promise<AdenineMetadata> {
    // Extract genres from mutations
    const genreMutations = mutations.filter((m) => m.domain === 'A' && !m.key.startsWith('city:'));
    const genreEngagement: Record<string, number> = {};

    for (const mutation of genreMutations) {
      genreEngagement[mutation.key] = (genreEngagement[mutation.key] || 0) + mutation.effective_delta;
    }

    // Primary genres (top 3)
    const primary_genres = Object.entries(genreEngagement)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    // Genre diversity (Shannon entropy)
    const totalEngagement = Object.values(genreEngagement).reduce((a, b) => a + b, 0);
    const probabilities = Object.values(genreEngagement).map((val) => val / totalEngagement);
    let entropy = 0;
    for (const p of probabilities) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    const maxEntropy = Math.log2(Object.keys(genreEngagement).length || 1);
    const genre_diversity_index = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Crossover potential (inverse of niche depth)
    const niche_depth = 1 - genre_diversity_index;
    const crossover_potential = genre_diversity_index;

    // Cultural influence (placeholder - would need social graph)
    const cultural_influence_radius = Math.min(events.length / 100, 10);

    return {
      genre_diversity_index,
      cultural_influence_radius,
      crossover_potential,
      niche_depth,
      primary_genres,
      genre_engagement: genreEngagement,
    };
  }

  /**
   * Calculate T-Domain (Behavioral) metadata
   */
  private async calculateThymineMetadata(
    artistId: string,
    events: PassportEvent[],
    mutations: DNAMutation[]
  ): Promise<ThymineMetadata> {
    // Fetch unique fans
    const fanIds = [...new Set(events.map((e) => e.user_id))];
    const totalFans = fanIds.length;

    // Calculate repeat interactions
    const fanInteractionCounts: Record<string, number> = {};
    for (const event of events) {
      fanInteractionCounts[event.user_id] = (fanInteractionCounts[event.user_id] || 0) + 1;
    }

    const repeatInteractions = Object.values(fanInteractionCounts).filter((count) => count > 1).length;
    const loyalty_index = totalFans > 0 ? repeatInteractions / totalFans : 0;

    // Conversion rate (RSVP → Attend)
    const rsvpEvents = events.filter((e) => e.event_type === 'concierto.event_rsvp');
    const attendEvents = events.filter((e) => e.event_type === 'concierto.event_attended');
    const conversion_rate = rsvpEvents.length > 0 ? attendEvents.length / rsvpEvents.length : 0;

    // Superfan percentage (top 10% engaged)
    const sortedCounts = Object.values(fanInteractionCounts).sort((a, b) => b - a);
    const top10Index = Math.floor(sortedCounts.length * 0.1);
    const superfan_percentage = top10Index > 0 ? top10Index / sortedCounts.length : 0;

    // Engagement consistency (placeholder - would need time-series analysis)
    const engagement_consistency = 0.7; // Default

    // Activation rate (% fans with >1 action)
    const activation_rate = loyalty_index;

    // Churn risk (placeholder - would need ML model)
    const churn_risk_score = Math.max(0, 1 - loyalty_index);

    // Avg interactions per fan
    const avg_interactions_per_fan = totalFans > 0 ? events.length / totalFans : 0;

    return {
      loyalty_index,
      conversion_rate,
      superfan_percentage,
      engagement_consistency,
      activation_rate,
      churn_risk_score,
      avg_interactions_per_fan,
    };
  }

  /**
   * Calculate G-Domain (Economic) metadata
   */
  private async calculateGuanineMetadata(
    artistId: string,
    events: PassportEvent[],
    mutations: DNAMutation[]
  ): Promise<GuanineMetadata> {
    // Extract revenue events
    const revenueEvents = events.filter(
      (e) =>
        e.event_type.includes('purchase') ||
        e.event_type.includes('payout') ||
        e.event_type.includes('subscription')
    );

    const total_revenue_cents = revenueEvents.reduce(
      (sum, e) => sum + ((e.metadata as any)?.amount_cents || 0),
      0
    );

    const totalTransactions = revenueEvents.length;
    const avg_transaction_value = totalTransactions > 0 ? total_revenue_cents / totalTransactions / 100 : 0;

    // Willingness to pay (% premium tier purchases)
    const premiumPurchases = revenueEvents.filter(
      (e) => (e.metadata as any)?.tier === 'vip' || (e.metadata as any)?.tier === 'premium'
    );
    const willingness_to_pay_index = totalTransactions > 0 ? premiumPurchases.length / totalTransactions : 0;

    // Revenue concentration (Gini coefficient - placeholder)
    const revenue_concentration = 0.5; // Would need per-fan revenue distribution

    // LTV per fan (placeholder - would need predictive model)
    const uniqueFans = [...new Set(events.map((e) => e.user_id))].length;
    const lifetime_value_per_fan = uniqueFans > 0 ? total_revenue_cents / uniqueFans / 100 : 0;

    // Monetization efficiency (revenue / engagement)
    const totalEngagement = events.length;
    const monetization_efficiency = totalEngagement > 0 ? total_revenue_cents / totalEngagement / 100 : 0;

    // Whale count (top 1% spenders - placeholder)
    const whale_fan_count = Math.floor(uniqueFans * 0.01);

    return {
      avg_transaction_value,
      willingness_to_pay_index,
      revenue_concentration,
      lifetime_value_per_fan,
      monetization_efficiency,
      whale_fan_count,
      total_revenue_cents,
    };
  }

  /**
   * Calculate C-Domain (Spatial) metadata
   */
  private async calculateCytosineMetadata(
    artistId: string,
    events: PassportEvent[],
    mutations: DNAMutation[]
  ): Promise<CytosineMetadata> {
    // Extract city mutations
    const cityMutations = mutations.filter((m) => m.domain === 'C' && m.key.startsWith('city:'));
    const city_engagement: Record<string, number> = {};

    for (const mutation of cityMutations) {
      const city = mutation.key.replace('city:', '');
      city_engagement[city] = (city_engagement[city] || 0) + mutation.effective_delta;
    }

    // Primary cities (top 5)
    const primary_cities = Object.entries(city_engagement)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([city]) => city);

    // Geographic reach (# cities / top 100 US metros)
    const uniqueCities = Object.keys(city_engagement).length;
    const geographic_reach_index = Math.min(uniqueCities / 100, 1);

    // Touring viability (need 5+ cities with 50+ engaged fans each)
    const viableCities = Object.values(city_engagement).filter((count) => count >= 50).length;
    const touring_viability_score = Math.min(viableCities / 5, 1);

    // City-to-city mobility (placeholder - would need fan overlap analysis)
    const city_to_city_mobility = uniqueCities > 1 ? 0.5 : 0;

    // Market penetration in top city (placeholder)
    const topCityEngagement = Math.max(...Object.values(city_engagement), 0);
    const market_penetration_top_city = Math.min(topCityEngagement / 10000, 1); // Assume 10k = 100% penetration

    // Expansion velocity (new cities per month - placeholder)
    const expansion_velocity = uniqueCities / 6; // Assume 6-month window

    return {
      primary_cities,
      geographic_reach_index,
      touring_viability_score,
      city_to_city_mobility,
      market_penetration_top_city,
      expansion_velocity,
      city_engagement,
    };
  }

  /**
   * Save domain strength to database (upsert)
   */
  async saveDomainStrength(strength: DomainStrength): Promise<void> {
    const { error } = await this.supabase.from('coliseum_domain_strength').upsert(
      {
        entity_id: strength.entity_id,
        entity_type: strength.entity_type,
        time_range: strength.time_range,
        a_strength: strength.a_strength,
        t_strength: strength.t_strength,
        g_strength: strength.g_strength,
        c_strength: strength.c_strength,
        a_metadata: strength.a_metadata,
        t_metadata: strength.t_metadata,
        g_metadata: strength.g_metadata,
        c_metadata: strength.c_metadata,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: 'entity_id,entity_type,time_range' }
    );

    if (error) throw error;
  }

  /**
   * Calculate and save domain strength for all artists
   */
  async calculateAllArtists(timeRange: TimeRange): Promise<void> {
    // Fetch all artists
    const { data: artists, error } = await this.supabase
      .from('artist_profiles')
      .select('id');

    if (error) throw error;

    console.log(`Calculating ${timeRange} domain strength for ${artists.length} artists...`);

    for (const artist of artists) {
      try {
        const strength = await this.calculateArtistDomainStrength(artist.id, timeRange);
        await this.saveDomainStrength(strength);
        console.log(`✓ ${artist.id} (${timeRange})`);
      } catch (err) {
        console.error(`✗ ${artist.id} (${timeRange}):`, err);
      }
    }

    console.log(`✓ Completed ${timeRange} calculations`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate Shannon entropy for diversity metrics
 */
export function calculateShannonEntropy(probabilities: number[]): number {
  let entropy = 0;
  for (const p of probabilities) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Calculate Gini coefficient for concentration metrics
 */
export function calculateGiniCoefficient(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 0) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (2 * (i + 1) - n - 1) * sorted[i];
  }

  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  return sum / (n * n * mean);
}

// ============================================================================
// EXPORT
// ============================================================================

export default DomainStrengthCalculator;
