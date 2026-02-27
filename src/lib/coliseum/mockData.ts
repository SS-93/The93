/**
 * ============================================================================
 * COLISEUM ANALYTICS - MOCK DATA GENERATOR
 * ============================================================================
 * Purpose: Generate realistic mock data for Coliseum DNA Analytics dashboard
 * Use: Development and demo purposes
 * ============================================================================
 */

import type { DNADomain } from './domainCalculator';

// Artist names pool
const ARTIST_NAMES = [
  'Kendrick Lamar',
  'SZA',
  'Tyler, The Creator',
  'Frank Ocean',
  'Anderson .Paak',
  'Childish Gambino',
  'J. Cole',
  'Rihanna',
  'Travis Scott',
  'The Weeknd',
  'Drake',
  'Billie Eilish',
  'Doja Cat',
  'Lil Nas X',
  'Megan Thee Stallion',
  'Bad Bunny',
  'Rosalía',
  'Burna Boy',
  'Wizkid',
  'Arlo Parks',
  'Yeat',
  'Destroy Lonely',
  'Ken Carson',
  'Playboi Carti',
  'Lil Uzi Vert',
  'Young Thug',
  'Future',
  'Metro Boomin',
  'Kali Uchis',
  'Steve Lacy',
  'Omar Apollo',
  'Brent Faiyaz',
  'Summer Walker',
  'H.E.R.',
  'Lucky Daye',
  'Giveon',
  'Daniel Caesar',
  'Blood Orange',
  'FKA twigs',
  'Kelela'
];

// Genre tags pool
const GENRES = [
  ['Hip-Hop', 'West Coast', 'Conscious Rap'],
  ['R&B', 'Neo-Soul', 'Alternative R&B'],
  ['Hip-Hop', 'Alternative', 'Experimental'],
  ['R&B', 'Neo-Soul', 'Indie'],
  ['R&B', 'Funk', 'Soul'],
  ['Hip-Hop', 'Pop', 'Trap'],
  ['Hip-Hop', 'Conscious Rap', 'Boom Bap'],
  ['Pop', 'R&B', 'Caribbean'],
  ['Hip-Hop', 'Trap', 'Psychedelic'],
  ['R&B', 'Pop', 'Synth-Pop'],
  ['Hip-Hop', 'Pop', 'Toronto Sound'],
  ['Pop', 'Alternative', 'Dark Pop'],
  ['Pop', 'R&B', 'Hip-Hop'],
  ['Hip-Hop', 'Pop', 'Country Trap'],
  ['Hip-Hop', 'Southern Rap', 'Trap'],
  ['Latin', 'Reggaeton', 'Trap Latino'],
  ['Flamenco', 'Pop', 'Experimental'],
  ['Afrobeats', 'Afrofusion', 'Reggae'],
  ['Afrobeats', 'R&B', 'Pop'],
  ['Indie', 'Alternative', 'Singer-Songwriter'],
  ['Rage', 'Plugg', 'Hyperpop'],
  ['Rage', 'Plugg', 'Trap'],
  ['Rage', 'Plugg', 'Experimental'],
  ['Hip-Hop', 'Experimental', 'Punk Rap'],
  ['Hip-Hop', 'Emo Rap', 'Rock'],
  ['Hip-Hop', 'Trap', 'Atlanta'],
  ['Hip-Hop', 'Trap', 'Mumble Rap'],
  ['Hip-Hop', 'Trap', 'Producer'],
  ['R&B', 'Latin', 'Pop'],
  ['R&B', 'Indie', 'Alternative'],
  ['R&B', 'Indie', 'Alternative'],
  ['R&B', 'Soul', 'Alternative'],
  ['R&B', 'Neo-Soul', 'Contemporary'],
  ['R&B', 'Neo-Soul', 'Alternative'],
  ['R&B', 'Neo-Soul', 'Funk'],
  ['R&B', 'Soul', 'Contemporary'],
  ['R&B', 'Soul', 'Alternative'],
  ['R&B', 'Alternative', 'Electronic'],
  ['Alternative', 'Art Pop', 'Experimental'],
  ['R&B', 'Electronic', 'Alternative']
];

// City distribution (for C-domain)
const CITIES = [
  'Los Angeles', 'New York', 'Atlanta', 'Chicago', 'Miami',
  'Houston', 'Toronto', 'London', 'Paris', 'Tokyo',
  'Berlin', 'Amsterdam', 'Barcelona', 'Mexico City', 'São Paulo',
  'Lagos', 'Johannesburg', 'Seoul', 'Sydney', 'Melbourne',
  'Denver', 'Austin', 'Nashville', 'Portland', 'Seattle',
  'San Francisco', 'Oakland', 'Detroit', 'Philadelphia', 'Boston'
];

export interface MockLeaderboardEntry {
  artist_id: string;
  artist_name: string;
  rank: number;
  domain_strength: number;

  // A-domain (Cultural)
  genre_diversity_index?: number;
  cultural_influence_radius?: number;
  crossover_potential?: number;
  niche_depth?: number;
  primary_genres?: string[];

  // T-domain (Behavioral)
  loyalty_index?: number;
  repeat_engagement_rate?: number;
  fan_conversion_rate?: number;
  churn_rate?: number;
  avg_session_duration?: number;

  // G-domain (Economic)
  revenue_per_fan?: number;
  monetization_rate?: number;
  revenue_concentration?: number;
  lifetime_value?: number;
  avg_transaction_value?: number;

  // C-domain (Spatial)
  geographic_reach?: number;
  city_penetration?: number;
  touring_viability?: number;
  market_concentration?: number;
  top_cities?: string[];

  // Meta
  total_fans?: number;
  total_streams?: number;
  last_updated?: string;
}

/**
 * Generate mock leaderboard data for a specific domain
 */
export function generateMockLeaderboard(
  domain: DNADomain,
  timeRange: '7d' | '30d' | 'alltime',
  count: number = 40
): MockLeaderboardEntry[] {
  const entries: MockLeaderboardEntry[] = [];

  // Base strength calculation (varies by time range)
  const timeMultiplier = timeRange === '7d' ? 0.3 : timeRange === '30d' ? 0.7 : 1.0;

  for (let i = 0; i < Math.min(count, ARTIST_NAMES.length); i++) {
    const baseStrength = Math.pow(0.85, i) * 1000 * timeMultiplier;
    const artistName = ARTIST_NAMES[i];
    const genres = GENRES[i] || GENRES[0];

    const entry: MockLeaderboardEntry = {
      artist_id: `artist-${i + 1}`,
      artist_name: artistName,
      rank: i + 1,
      domain_strength: parseFloat((baseStrength + Math.random() * 50).toFixed(2)),
      total_fans: Math.floor(10000 + Math.random() * 990000),
      total_streams: Math.floor(100000 + Math.random() * 9900000),
      last_updated: new Date().toISOString()
    };

    // Add domain-specific metrics
    switch (domain) {
      case 'A': // Cultural Identity
        entry.genre_diversity_index = parseFloat((0.5 + Math.random() * 0.5).toFixed(3));
        entry.cultural_influence_radius = parseFloat((50 + Math.random() * 200).toFixed(1));
        entry.crossover_potential = parseFloat((0.3 + Math.random() * 0.7).toFixed(3));
        entry.niche_depth = parseFloat((0.2 + Math.random() * 0.8).toFixed(3));
        entry.primary_genres = genres;
        break;

      case 'T': // Behavioral Patterns
        entry.loyalty_index = parseFloat((0.4 + Math.random() * 0.6).toFixed(3));
        entry.repeat_engagement_rate = parseFloat((0.3 + Math.random() * 0.5).toFixed(3));
        entry.fan_conversion_rate = parseFloat((0.05 + Math.random() * 0.15).toFixed(3));
        entry.churn_rate = parseFloat((0.1 + Math.random() * 0.3).toFixed(3));
        entry.avg_session_duration = parseFloat((180 + Math.random() * 420).toFixed(0));
        break;

      case 'G': // Economic Signals
        entry.revenue_per_fan = parseFloat((5 + Math.random() * 45).toFixed(2));
        entry.monetization_rate = parseFloat((0.1 + Math.random() * 0.4).toFixed(3));
        entry.revenue_concentration = parseFloat((0.2 + Math.random() * 0.6).toFixed(3));
        entry.lifetime_value = parseFloat((50 + Math.random() * 450).toFixed(2));
        entry.avg_transaction_value = parseFloat((10 + Math.random() * 90).toFixed(2));
        break;

      case 'C': // Spatial Geography
        entry.geographic_reach = parseFloat((0.2 + Math.random() * 0.8).toFixed(3));
        entry.city_penetration = parseFloat((0.1 + Math.random() * 0.7).toFixed(3));
        entry.touring_viability = parseFloat((0.3 + Math.random() * 0.7).toFixed(3));
        entry.market_concentration = parseFloat((0.2 + Math.random() * 0.6).toFixed(3));
        entry.top_cities = CITIES.slice(0, 5 + Math.floor(Math.random() * 5))
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);
        break;
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Generate mock artist profile with full DNA breakdown
 */
export function generateMockArtistProfile(artistId: string) {
  const artistIndex = parseInt(artistId.split('-')[1]) - 1;
  const artistName = ARTIST_NAMES[artistIndex] || 'Unknown Artist';
  const genres = GENRES[artistIndex] || GENRES[0];

  return {
    artist_id: artistId,
    artist_name: artistName,

    // DNA Strength by domain
    a_strength_7d: parseFloat((Math.random() * 500).toFixed(2)),
    a_strength_30d: parseFloat((Math.random() * 800).toFixed(2)),
    a_strength_alltime: parseFloat((Math.random() * 1000).toFixed(2)),

    t_strength_7d: parseFloat((Math.random() * 500).toFixed(2)),
    t_strength_30d: parseFloat((Math.random() * 800).toFixed(2)),
    t_strength_alltime: parseFloat((Math.random() * 1000).toFixed(2)),

    g_strength_7d: parseFloat((Math.random() * 500).toFixed(2)),
    g_strength_30d: parseFloat((Math.random() * 800).toFixed(2)),
    g_strength_alltime: parseFloat((Math.random() * 1000).toFixed(2)),

    c_strength_7d: parseFloat((Math.random() * 500).toFixed(2)),
    c_strength_30d: parseFloat((Math.random() * 800).toFixed(2)),
    c_strength_alltime: parseFloat((Math.random() * 1000).toFixed(2)),

    // Metadata
    primary_genres: genres,
    total_fans: Math.floor(10000 + Math.random() * 990000),
    total_streams: Math.floor(100000 + Math.random() * 9900000),
    total_revenue: parseFloat((1000 + Math.random() * 99000).toFixed(2)),

    // Top cities
    top_cities: CITIES.slice(0, 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10),

    // Recent activity
    events_7d: Math.floor(10 + Math.random() * 990),
    events_30d: Math.floor(100 + Math.random() * 4900),
    events_alltime: Math.floor(1000 + Math.random() * 99000),

    last_updated: new Date().toISOString()
  };
}

/**
 * Get domain info for UI display
 */
export function getDomainInfo(domain: DNADomain) {
  const info = {
    A: {
      name: 'A-Domain: Cultural Identity',
      icon: '🧬',
      color: 'from-cyan-500 to-blue-600',
      description: 'Genre diversity, crossover potential, cultural influence',
      targetCustomer: 'Labels & A&R',
      keyMetrics: ['Genre Diversity Index', 'Crossover Potential', 'Cultural Influence Radius', 'Niche Depth']
    },
    T: {
      name: 'T-Domain: Behavioral Patterns',
      icon: '💙',
      color: 'from-green-500 to-teal-600',
      description: 'Fan loyalty, repeat engagement, conversion rates',
      targetCustomer: 'Booking Agents & Managers',
      keyMetrics: ['Loyalty Index', 'Repeat Engagement', 'Fan Conversion', 'Churn Rate']
    },
    G: {
      name: 'G-Domain: Economic Signals',
      icon: '💰',
      color: 'from-yellow-500 to-orange-600',
      description: 'Revenue per fan, monetization, lifetime value',
      targetCustomer: 'Investors & Business Affairs',
      keyMetrics: ['Revenue per Fan', 'Monetization Rate', 'Lifetime Value', 'Avg Transaction']
    },
    C: {
      name: 'C-Domain: Spatial Geography',
      icon: '🌍',
      color: 'from-purple-500 to-pink-600',
      description: 'Geographic reach, touring viability, market penetration',
      targetCustomer: 'Promoters & Tour Managers',
      keyMetrics: ['Geographic Reach', 'City Penetration', 'Touring Viability', 'Market Concentration']
    }
  };

  return (info as any)[domain];
}
