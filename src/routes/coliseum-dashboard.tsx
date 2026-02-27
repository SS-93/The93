/**
 * ============================================================================
 * COLISEUM ANALYTICS - ENTERPRISE DASHBOARD
 * ============================================================================
 * Purpose: 4-Domain DNA Leaderboard System for Music Enterprise
 * Target: Labels, supervisors, brands, booking agents
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useColiseumEntitlement, PLAN_FEATURES, type DNADomain, type ColiseumPlan } from '../lib/coliseum/entitlements';
import type { DomainStrength } from '../lib/coliseum/domainCalculator';

// ============================================================================
// TYPES
// ============================================================================

type TimeRange = '7d' | '30d' | 'alltime';

interface LeaderboardEntry {
  artist_id: string;
  artist_name: string;
  domain_strength: number;
  rank: number;
  // Domain-specific fields added dynamically
  [key: string]: any;
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function ColiseumDashboard() {
  const navigate = useNavigate();
  const [activeDomain, setActiveDomain] = useState<DNADomain>('A');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { entitlement, loading: entitlementLoading, isAuthenticated } = useColiseumEntitlement();
  const userPlan = entitlement?.plan || 'free';

  // Fetch leaderboard data (public access: top 50)
  useEffect(() => {
    fetchLeaderboard();
  }, [activeDomain, timeRange, isAuthenticated]);

  async function fetchLeaderboard() {
    setLoading(true);

    // Debug logging
    console.group(`🏛️ Coliseum: Fetching Leaderboard`);
    console.log('Domain:', activeDomain);
    console.log('Time Range:', timeRange);
    console.log('Authenticated:', isAuthenticated);
    console.log('User Plan:', userPlan);

    try {
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL!,
        process.env.REACT_APP_SUPABASE_ANON_KEY!
      );

      // Fetch from appropriate materialized view
      const viewName = `coliseum_leaderboard_${activeDomain.toLowerCase()}_${timeRange}`;
      console.log('View Name:', viewName);

      // Public access: Top 50 for everyone (good for testing)
      // Authenticated users with plans get more via upgrade path
      const maxDepth = isAuthenticated
        ? PLAN_FEATURES[userPlan].leaderboard_depth
        : 50; // Public: top 50

      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(Math.min(maxDepth, 100))
        .order('domain_strength', { ascending: false });

      if (error) {
        console.error('Leaderboard fetch error:', error);

        // Check if view doesn't exist
        if (error.code === '42P01') {
          console.error(`❌ View ${viewName} not found. Database migrations may not be applied.`);
          setLeaderboardData([]);
          return;
        }

        // Other errors - log but don't crash
        console.warn(`⚠️ Failed to fetch ${viewName}:`, error.message);
        setLeaderboardData([]);
        return;
      }

      // Success case - check for empty data
      if (!data || data.length === 0) {
        console.log(`📊 Leaderboard ${viewName} exists but has no data yet`);
        setLeaderboardData([]);
        return;
      }

      // Log success
      console.log(`✅ Loaded ${data.length} artists from ${viewName}`);

      // Add ranks (important: rank column may not exist in view)
      const withRanks = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboardData(withRanks);
    } catch (err) {
      console.error('Unexpected error:', err);
      setLeaderboardData([]);
    } finally {
      console.groupEnd();
      setLoading(false);
    }
  }

  if (entitlementLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="coliseum-dashboard min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <Header userPlan={userPlan} />

      {/* Public Access Banner (for unauthenticated users) */}
      {!isAuthenticated && <PublicAccessBanner onLogin={() => navigate('/login')} />}

      {/* Domain Navigation */}
      <DomainNav
        activeDomain={activeDomain}
        onDomainChange={setActiveDomain}
        userPlan={userPlan}
      />

      {/* Time Range Selector */}
      <TimeRangeSelector timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard Panel (Left) */}
          <div className="lg:col-span-2">
            <LeaderboardPanel
              domain={activeDomain}
              timeRange={timeRange}
              data={leaderboardData}
              loading={loading}
              onArtistSelect={setSelectedArtist}
              userPlan={userPlan}
              isPreviewMode={!isAuthenticated}
            />
          </div>

          {/* Artist Profile Panel (Right) */}
          <div className="lg:col-span-1">
            {selectedArtist ? (
              <ArtistProfilePanel artistId={selectedArtist} userPlan={userPlan} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Banner (if not enterprise) */}
      {userPlan !== 'enterprise' && <UpgradeBanner currentPlan={userPlan} />}
    </div>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

function Header({ userPlan }: { userPlan: ColiseumPlan }) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🏛️ Coliseum Analytics</h1>
          <p className="text-gray-400 text-sm">DNA-Native Music Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Plan</div>
            <div className="text-lg font-semibold">{PLAN_FEATURES[userPlan].name}</div>
          </div>
          {userPlan !== 'enterprise' && (
            <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium">
              Upgrade
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// DOMAIN NAVIGATION
// ============================================================================

function DomainNav({
  activeDomain,
  onDomainChange,
  userPlan,
}: {
  activeDomain: DNADomain;
  onDomainChange: (domain: DNADomain) => void;
  userPlan: ColiseumPlan;
}) {
  const domains: Array<{ key: DNADomain; name: string; description: string; icon: string }> = [
    {
      key: 'A',
      name: 'Cultural (A)',
      description: 'Genre diversity, crossover potential',
      icon: '🧬',
    },
    {
      key: 'T',
      name: 'Behavioral (T)',
      description: 'Fan loyalty, conversion rates',
      icon: '🧬',
    },
    {
      key: 'G',
      name: 'Economic (G)',
      description: 'Revenue per fan, monetization',
      icon: '🧬',
    },
    {
      key: 'C',
      name: 'Spatial (C)',
      description: 'Geographic reach, touring viability',
      icon: '🧬',
    },
  ];

  const allowedDomains = PLAN_FEATURES[userPlan].domains;

  return (
    <nav className="bg-gray-800 border-b border-gray-700 overflow-x-auto">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 py-4">
          {domains.map((domain) => {
            const isLocked = !allowedDomains.includes(domain.key);
            const isActive = activeDomain === domain.key;

            return (
              <button
                key={domain.key}
                onClick={() => !isLocked && onDomainChange(domain.key)}
                disabled={isLocked}
                className={`
                  px-6 py-3 rounded-lg transition-all whitespace-nowrap
                  ${isActive ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>{domain.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold flex items-center gap-2">
                      {domain.name}
                      {isLocked && <span className="text-yellow-400">🔒</span>}
                    </div>
                    <div className="text-xs opacity-75">{domain.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// TIME RANGE SELECTOR
// ============================================================================

function TimeRangeSelector({
  timeRange,
  onTimeRangeChange,
}: {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}) {
  const ranges: Array<{ key: TimeRange; label: string }> = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: 'alltime', label: 'All Time' },
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700 py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Time Range:</span>
          <div className="flex gap-2">
            {ranges.map((range) => (
              <button
                key={range.key}
                onClick={() => onTimeRangeChange(range.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${timeRange === range.key ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                `}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEADERBOARD PANEL
// ============================================================================

function LeaderboardPanel({
  domain,
  timeRange,
  data,
  loading,
  onArtistSelect,
  userPlan,
  isPreviewMode = false,
}: {
  domain: DNADomain;
  timeRange: TimeRange;
  data: LeaderboardEntry[];
  loading: boolean;
  onArtistSelect: (artistId: string) => void;
  userPlan: ColiseumPlan;
  isPreviewMode?: boolean;
}) {
  const domainInfo = getDomainInfo(domain);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state check
  if (!loading && data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2 text-white">No Rankings Yet</h3>
          <p className="text-gray-400 mb-4">
            {isPreviewMode
              ? "Artists will appear here once audio plays are tracked."
              : "Play some music to generate rankings!"}
          </p>
          <div className="text-sm text-gray-500">
            Domain: {domain.toUpperCase()} | Range: {timeRange}
          </div>
        </div>
      </div>
    );
  }

  const maxDepth = isPreviewMode ? 5 : PLAN_FEATURES[userPlan].leaderboard_depth;
  const showingCount = Math.min(data.length, maxDepth);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6">
        <h2 className="text-2xl font-bold mb-2">{domainInfo.name} Leaderboard</h2>
        <p className="text-gray-300 text-sm">{domainInfo.description}</p>
        <p className="text-gray-400 text-xs mt-2">
          {isPreviewMode ? (
            <span className="text-blue-300">🌍 Public Access: Showing top 50. Login for expanded rankings and detailed analytics.</span>
          ) : (
            <span>Showing top {showingCount} artists</span>
          )}
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900 text-gray-400 text-sm">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Artist</th>
              <th className="px-4 py-3 text-right">DNA Strength</th>
              <th className="px-4 py-3 text-right">{getDomainMetricLabel(domain)}</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.slice(0, showingCount).map((entry) => (
              <tr
                key={entry.artist_id}
                className="hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => onArtistSelect(entry.artist_id)}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <RankBadge rank={entry.rank} />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium">{entry.artist_name}</div>
                  {entry.genre_tags && (
                    <div className="text-xs text-gray-400 mt-1">
                      {entry.genre_tags.slice(0, 3).join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="font-mono text-purple-400 font-semibold">
                    {formatScore(entry.domain_strength)}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="text-sm text-gray-300">
                    {formatDomainMetric(entry, domain)}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArtistSelect(entry.artist_id);
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    View Profile →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upgrade CTA (if limited) */}
      {data.length > maxDepth && (
        <div className="bg-gray-900 p-4 text-center border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">
            {data.length - maxDepth} more artists available
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-sm font-medium">
            Upgrade to see full leaderboard
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ARTIST PROFILE PANEL
// ============================================================================

function ArtistProfilePanel({ artistId, userPlan }: { artistId: string; userPlan: ColiseumPlan }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistProfile();
  }, [artistId]);

  async function fetchArtistProfile() {
    setLoading(true);
    try {
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL!,
        process.env.REACT_APP_SUPABASE_ANON_KEY!
      );

      // Fetch domain strength for all time ranges
      const { data, error } = await supabase
        .from('coliseum_domain_strength')
        .select('*')
        .eq('entity_id', artistId)
        .eq('entity_type', 'artist');

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch artist profile:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile || profile.length === 0) {
    return <EmptyState />;
  }

  const strength7d = profile.find((p: any) => p.time_range === '7d');
  const strength30d = profile.find((p: any) => p.time_range === '30d');
  const strengthAllTime = profile.find((p: any) => p.time_range === 'alltime');

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Artist Header */}
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-6">
        <h3 className="text-xl font-bold mb-2">Artist DNA Profile</h3>
        <p className="text-sm text-gray-300">Artist ID: {artistId}</p>
      </div>

      {/* DNA Strength Overview */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-lg font-semibold mb-4">DNA Strength by Domain</h4>
          {strength7d && (
            <div className="space-y-3">
              <DNAStrengthBar label="A: Cultural" value={strength7d.a_strength} max={1000} color="blue" />
              <DNAStrengthBar label="T: Behavioral" value={strength7d.t_strength} max={1000} color="green" />
              <DNAStrengthBar label="G: Economic" value={strength7d.g_strength} max={1000} color="yellow" />
              <DNAStrengthBar label="C: Spatial" value={strength7d.c_strength} max={1000} color="purple" />
            </div>
          )}
        </div>

        {/* Time Range Comparison */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Growth Trajectory</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">7-day total:</span>
              <span className="font-mono">{formatScore(strength7d?.composite_strength || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">30-day total:</span>
              <span className="font-mono">{formatScore(strength30d?.composite_strength || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">All-time total:</span>
              <span className="font-mono">{formatScore(strengthAllTime?.composite_strength || 0)}</span>
            </div>
          </div>
        </div>

        {/* Domain Metadata (Plan-gated) */}
        {userPlan !== 'free' && strength7d && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Detailed Metrics</h4>
            <div className="space-y-4 text-sm">
              {/* A-Domain Metrics */}
              <MetricCard
                title="Cultural Identity"
                metrics={{
                  'Genre Diversity': formatPercent(strength7d.a_metadata?.genre_diversity_index),
                  'Crossover Potential': formatPercent(strength7d.a_metadata?.crossover_potential),
                  'Primary Genres': strength7d.a_metadata?.primary_genres?.join(', ') || 'N/A',
                }}
                locked={!PLAN_FEATURES[userPlan].domains.includes('A')}
              />

              {/* T-Domain Metrics */}
              <MetricCard
                title="Fan Loyalty"
                metrics={{
                  'Loyalty Index': formatPercent(strength7d.t_metadata?.loyalty_index),
                  'Conversion Rate': formatPercent(strength7d.t_metadata?.conversion_rate),
                  'Superfans': formatPercent(strength7d.t_metadata?.superfan_percentage),
                }}
                locked={!PLAN_FEATURES[userPlan].domains.includes('T')}
              />

              {/* G-Domain Metrics */}
              <MetricCard
                title="Monetization"
                metrics={{
                  'Avg Transaction': `$${(strength7d.g_metadata?.avg_transaction_value || 0).toFixed(2)}`,
                  'WTP Index': formatPercent(strength7d.g_metadata?.willingness_to_pay_index),
                  'Total Revenue': `$${((strength7d.g_metadata?.total_revenue_cents || 0) / 100).toFixed(2)}`,
                }}
                locked={!PLAN_FEATURES[userPlan].domains.includes('G')}
              />

              {/* C-Domain Metrics */}
              <MetricCard
                title="Geographic Reach"
                metrics={{
                  'Reach Index': formatPercent(strength7d.c_metadata?.geographic_reach_index),
                  'Touring Viability': formatPercent(strength7d.c_metadata?.touring_viability_score),
                  'Primary Cities': strength7d.c_metadata?.primary_cities?.join(', ') || 'N/A',
                }}
                locked={!PLAN_FEATURES[userPlan].domains.includes('C')}
              />
            </div>
          </div>
        )}

        {/* Export / Actions */}
        <div className="pt-4 border-t border-gray-700">
          <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-medium">
            Generate Impact Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🧬</div>
        <div className="text-white text-xl">Loading Coliseum Analytics...</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <div className="text-6xl mb-4">📊</div>
      <p className="text-gray-400">Select an artist to view their DNA profile</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  let bgColor = 'bg-gray-700';
  let textColor = 'text-gray-300';
  let icon = null;

  if (rank === 1) {
    bgColor = 'bg-yellow-500';
    textColor = 'text-yellow-900';
    icon = '🥇';
  } else if (rank === 2) {
    bgColor = 'bg-gray-400';
    textColor = 'text-gray-900';
    icon = '🥈';
  } else if (rank === 3) {
    bgColor = 'bg-orange-600';
    textColor = 'text-orange-100';
    icon = '🥉';
  }

  return (
    <div className={`${bgColor} ${textColor} px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1`}>
      {icon && <span>{icon}</span>}
      <span>#{rank}</span>
    </div>
  );
}

function DNAStrengthBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono">{formatScore(value)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  metrics,
  locked,
}: {
  title: string;
  metrics: Record<string, string>;
  locked: boolean;
}) {
  if (locked) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center justify-between mb-2">
          <h5 className="font-semibold">{title}</h5>
          <span className="text-yellow-400">🔒</span>
        </div>
        <p className="text-xs text-gray-400">Upgrade to Pro to unlock</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="font-semibold mb-3">{title}</h5>
      <div className="space-y-2">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-400">{key}:</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicAccessBanner({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 border-b border-blue-700">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">🏛️ Public Coliseum - Top 50 Artists</div>
          <div className="text-sm text-blue-100">
            Free access to top 50 rankings. Login for full access, detailed metrics, and premium features.
          </div>
        </div>
        <button
          onClick={onLogin}
          className="bg-white text-purple-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          Login for Full Access →
        </button>
      </div>
    </div>
  );
}

function UpgradeBanner({ currentPlan }: { currentPlan: ColiseumPlan }) {
  const nextPlan = currentPlan === 'free' ? 'basic' : currentPlan === 'basic' ? 'pro' : 'enterprise';
  const nextFeatures = PLAN_FEATURES[nextPlan];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-indigo-900 p-4 border-t border-purple-700">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <div className="font-bold">Unlock more insights with {nextFeatures.name}</div>
          <div className="text-sm text-gray-300">
            ${nextFeatures.price_monthly}/mo • {nextFeatures.domains.length} domains • Top{' '}
            {nextFeatures.leaderboard_depth} leaderboard
          </div>
        </div>
        <button className="bg-white text-purple-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100">
          Upgrade Now →
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDomainInfo(domain: DNADomain) {
  const info = {
    A: {
      name: 'Cultural Identity',
      description: 'Genre diversity, crossover potential, cultural influence',
    },
    T: {
      name: 'Fan Loyalty',
      description: 'Engagement consistency, conversion rates, superfan percentage',
    },
    G: {
      name: 'Monetization',
      description: 'Revenue per fan, willingness to pay, monetization efficiency',
    },
    C: {
      name: 'Geographic Reach',
      description: 'Touring viability, market penetration, city-to-city mobility',
    },
  };
  return info[domain];
}

function getDomainMetricLabel(domain: DNADomain): string {
  const labels = {
    A: 'Diversity Index',
    T: 'Loyalty Index',
    G: 'Avg Transaction',
    C: 'Geographic Reach',
  };
  return labels[domain];
}

function formatDomainMetric(entry: any, domain: DNADomain): string {
  switch (domain) {
    case 'A':
      return formatPercent(entry.genre_diversity_index);
    case 'T':
      return formatPercent(entry.loyalty_index);
    case 'G':
      return `$${(entry.avg_transaction_value || 0).toFixed(2)}`;
    case 'C':
      return formatPercent(entry.geographic_reach_index);
    default:
      return 'N/A';
  }
}

function formatScore(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}
