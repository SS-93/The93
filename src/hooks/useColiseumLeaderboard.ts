import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export type Domain = 'A' | 'T' | 'G' | 'C';
export type TimeRange = '7d' | '30d' | 'alltime';

export interface LeaderboardEntry {
  rank: number;
  artist_id: string;
  artist_name: string;
  strength: number;
  rank_change?: number;
  strength_change?: number;
  genre_tags?: string[];
  location?: string;
}

interface UseColiseumLeaderboardResult {
  data: LeaderboardEntry[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook to fetch Coliseum leaderboard data
 *
 * @param domain - DNA domain to fetch (A, T, G, or C)
 * @param timeRange - Time range for leaderboard (7d, 30d, or alltime)
 * @returns Leaderboard data, loading state, error, and refetch function
 */
export const useColiseumLeaderboard = (
  domain: Domain,
  timeRange: TimeRange
): UseColiseumLeaderboardResult => {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine the view name based on domain and time range
      const viewName = `coliseum_leaderboard_${domain.toLowerCase()}_${timeRange}`;

      console.log(`Fetching leaderboard from view: ${viewName}`);

      // Query the materialized view
      const { data: leaderboardData, error: queryError } = await supabase
        .from(viewName)
        .select('*')
        .order('domain_strength', { ascending: false })
        .limit(100); // Top 100 artists

      if (queryError) {
        throw new Error(`Failed to fetch leaderboard: ${queryError.message}`);
      }

      // Transform the data to match our interface
      const transformedData: LeaderboardEntry[] = (leaderboardData || []).map((item: any, index: number) => ({
        rank: index + 1, // Generate rank from array index
        artist_id: item.artist_id,
        artist_name: item.artist_name || item.entity_id, // Fallback to entity_id if name not available
        strength: item.domain_strength, // Correct column name from materialized views
        rank_change: item.rank_change,
        strength_change: item.strength_change,
        genre_tags: item.genre_tags || item.primary_genres || [],
        location: item.location || item.primary_cities?.[0],
      }));

      setData(transformedData);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err as Error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when domain or timeRange changes
  useEffect(() => {
    fetchLeaderboard();
  }, [domain, timeRange]);

  return {
    data,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
};

export default useColiseumLeaderboard;
