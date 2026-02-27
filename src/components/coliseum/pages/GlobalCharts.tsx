import React, { useState, useEffect } from 'react';
import { TrophyIcon, ArrowTrendingUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import RankCard from '../cards/RankCard';
import MetricCard from '../cards/MetricCard';
import FilterBar, { TimeRange, Domain } from '../filters/FilterBar';
import { useColiseumLeaderboard } from '../../../hooks/useColiseumLeaderboard';
import { useAuth } from '../../../hooks/useAuth';

// ============================================================================
// TYPES
// ============================================================================

interface GlobalChartsProps {
  defaultTimeRange?: TimeRange;
  defaultDomain?: Domain;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GlobalCharts: React.FC<GlobalChartsProps> = ({
  defaultTimeRange = 'alltime',
  defaultDomain = 'all',
}) => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [domain, setDomain] = useState<Domain>(defaultDomain);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch leaderboard data
  const { data: leaderboardData, loading, error } = useColiseumLeaderboard(
    domain === 'all' ? 'T' : domain, // Default to Behavioral if 'all'
    timeRange
  );

  // Mock aggregate metrics (in production, these would come from an aggregate API)
  const aggregateMetrics = {
    totalArtists: leaderboardData?.length || 0,
    averageScore: leaderboardData?.length
      ? leaderboardData.reduce((acc, item) => acc + (item.strength || 0), 0) / leaderboardData.length
      : 0,
    topMovers: leaderboardData?.filter((item) => item.rank_change && item.rank_change > 5).length || 0,
    totalEngagement: leaderboardData?.reduce((acc, item) => acc + (item.strength || 0), 0) || 0,
  };

  // Filter leaderboard data by search query
  const filteredData = searchQuery
    ? leaderboardData?.filter((item) =>
        item.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboardData;

  // Handle navigation to artist profile
  const handleArtistClick = (artistId: string) => {
    console.log('Navigate to artist:', artistId);
    // In production: navigate(`/coliseum/artist/${artistId}`)
  };

  return (
    <div className="min-h-screen bg-coliseum-bg-primary">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-coliseum-bg-secondary via-coliseum-bg-primary to-coliseum-bg-primary border-b border-coliseum-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-caption-md text-coliseum-text-tertiary mb-4">
            <span>Coliseum</span>
            <span>/</span>
            <span className="text-coliseum-text-primary">Global Charts</span>
          </nav>

          {/* Title */}
          <div className="flex items-center gap-4 mb-2">
            <TrophyIcon className="w-10 h-10 text-coliseum-accent-gold" />
            <h1 className="text-display-lg text-coliseum-text-primary font-bold">
              Global Charts
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-body-lg text-coliseum-text-secondary max-w-3xl">
            Real-time artist rankings across all DNA domains. Track cultural impact, behavioral patterns,
            economic signals, and geographic reach.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Aggregate Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Artists"
            value={aggregateMetrics.totalArtists}
            format="number"
            icon={<TrophyIcon className="w-6 h-6" />}
            color="neon"
            sparklineData={[100, 120, 150, 180, 200, 190, aggregateMetrics.totalArtists]}
          />

          <MetricCard
            title="Average DNA Score"
            value={aggregateMetrics.averageScore}
            format="number"
            delta={{
              value: 12.5,
              timeframe: 'vs last week',
            }}
            icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
            color="purple"
          />

          <MetricCard
            title="Top Movers"
            value={aggregateMetrics.topMovers}
            format="number"
            icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
            color="gold"
            description="Artists with +5 rank changes"
          />

          <MetricCard
            title="Total Engagement"
            value={aggregateMetrics.totalEngagement}
            format="number"
            delta={{
              value: 8.3,
              timeframe: 'vs last month',
            }}
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            color="cyan"
          />
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <FilterBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            domain={domain}
            onDomainChange={setDomain}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showSearch={true}
          />
        </div>

        {/* Leaderboard Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-lg text-coliseum-text-primary font-bold">
              Rankings
            </h2>
            <span className="text-body-md text-coliseum-text-secondary">
              {filteredData?.length || 0} artists
            </span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-coliseum-bg-secondary border border-coliseum-border-default rounded-lg p-6 animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-coliseum-bg-tertiary rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-coliseum-bg-tertiary rounded w-3/4"></div>
                      <div className="h-3 bg-coliseum-bg-tertiary rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-coliseum-data-negative/10 border border-coliseum-data-negative/30 rounded-lg p-6 text-center">
              <p className="text-body-lg text-coliseum-data-negative">
                Failed to load leaderboard data. Please try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (!filteredData || filteredData.length === 0) && (
            <div className="bg-coliseum-bg-secondary border border-coliseum-border-default rounded-lg p-12 text-center">
              <TrophyIcon className="w-16 h-16 text-coliseum-text-tertiary mx-auto mb-4" />
              <h3 className="text-heading-md text-coliseum-text-primary mb-2">
                No Artists Found
              </h3>
              <p className="text-body-md text-coliseum-text-secondary">
                {searchQuery
                  ? `No results for "${searchQuery}". Try adjusting your search or filters.`
                  : 'No artists available for the selected filters.'}
              </p>
            </div>
          )}

          {/* Leaderboard Grid */}
          {!loading && !error && filteredData && filteredData.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredData.map((item, index) => (
                <RankCard
                  key={item.artist_id || index}
                  rank={item.rank || index + 1}
                  movement={
                    item.rank_change
                      ? item.rank_change > 0
                        ? 'up'
                        : item.rank_change < 0
                        ? 'down'
                        : 'same'
                      : 'same'
                  }
                  title={item.artist_name || 'Unknown Artist'}
                  subtitle={item.genre_tags?.join(', ') || 'No genre'}
                  location={item.location}
                  primaryMetric={{
                    label: 'DNA Strength',
                    value: item.strength || 0,
                    format: 'number',
                  }}
                  delta={
                    item.strength_change
                      ? {
                          value: item.strength_change,
                          format: 'percentage',
                        }
                      : undefined
                  }
                  badges={
                    item.rank === 1
                      ? [{ text: 'Champion', color: 'gold' as const }]
                      : item.rank_change && item.rank_change > 5
                      ? [{ text: 'Rising', color: 'neon' as const }]
                      : undefined
                  }
                  onClick={() => handleArtistClick(item.artist_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalCharts;
