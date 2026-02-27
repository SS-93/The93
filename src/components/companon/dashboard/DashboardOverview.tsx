/**
 * Compañon Dashboard Overview
 * 
 * Main dashboard home page showing high-level metrics, quick actions,
 * and recent activity feed.
 * 
 * Integration Points:
 * - Coliseum: Real-time metrics (reach, engagement, ROI)
 * - Treasury: Budget tracking and attribution
 * - Passport: Activity feed and audit logs
 * - DIA: System health indicators
 * 
 * Data Flow:
 * 1. Load dashboard data from Coliseum aggregated views
 * 2. Subscribe to real-time updates (Supabase Realtime)
 * 3. Log page view to Passport
 * 4. Poll for new activity every 10s
 * 
 * UI Notes:
 * - Metric cards with sparklines for trend visualization
 * - Quick action CTAs for common workflows
 * - Live activity feed from Passport
 * - System health indicator in header
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@/lib/supabaseClient';
import { usePassport } from '@/hooks/usePassport';
import { useColiseum } from '@/hooks/useColiseum';
import MetricCard from './MetricCard';
import QuickActionButton from './QuickActionButton';
import ActivityFeed from './ActivityFeed';
import type { DashboardOverviewData, CompanonBrand } from '@/types/companon';

interface DashboardOverviewProps {
  brand: CompanonBrand;
}

export default function DashboardOverview({ brand }: DashboardOverviewProps) {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { logEvent } = usePassport();
  useColiseum();

  // ============================================================================
  // STATE
  // ============================================================================

  const [dashboardData, setDashboardData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadDashboardData();

    // Log dashboard view to Passport
    logEvent('companon.dashboard.viewed' as any, {
      brand_id: brand.id,
      time_range: timeRange,
    }, { affects_systems: ['coliseum'] });

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`companon_dashboard_${brand.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaigns',
        filter: `brand_id=eq.${brand.id}`,
      }, () => {
        loadDashboardData(); // Refresh on campaign changes
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [brand.id, timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch aggregated metrics from Coliseum
      // API routes to Passport → Coliseum
      const response = await fetch(`/api/v1/companon/dashboard/overview?brand_id=${brand.id}&range=${timeRange}`);
      
      if (!response.ok) throw new Error('Failed to load dashboard data');

      const data: DashboardOverviewData = await response.json();
      setDashboardData(data);

    } catch (error) {
      console.error('Dashboard data load error:', error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // QUICK ACTIONS
  // ============================================================================

  const handleBuildAudience = () => {
    logEvent('companon.quick_action' as any, {
      action: 'build_audience',
      brand_id: brand.id,
    }, { affects_systems: ['coliseum'] });
    navigate('/companon/dashboard/dna-builder');
  };

  const handleLaunchCampaign = () => {
    logEvent('companon.quick_action' as any, {
      action: 'launch_campaign',
      brand_id: brand.id,
    }, { affects_systems: ['coliseum'] });
    navigate('/companon/dashboard/campaigns/new');
  };

  const handleViewAnalytics = () => {
    logEvent('companon.quick_action' as any, {
      action: 'view_analytics',
      brand_id: brand.id,
    }, { affects_systems: ['coliseum'] });
    navigate('/companon/dashboard/analytics');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[#1E1E2A] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#E0E0E0]">
            Welcome back, {brand.name}
          </h1>
          <p className="text-[#A3A3A3] mt-1">
            Here's what's happening with your brand activations
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#1E1E2A] text-[#A3A3A3] hover:bg-[#2A2A3A]'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Campaigns"
          value={dashboardData.active_campaigns_count}
          icon="📊"
          trend={{ value: 2, isPositive: true }}
        />
        <MetricCard
          title="Total Reach"
          value={timeRange === '7d' ? dashboardData.total_reach_7d : dashboardData.total_reach_30d}
          icon="👥"
          trend={{ value: 15, isPositive: true }}
          format="number"
        />
        <MetricCard
          title="Engagement Rate"
          value={dashboardData.avg_engagement_rate}
          icon="💫"
          trend={{ value: 3, isPositive: true }}
          format="percentage"
        />
        <MetricCard
          title="ROI"
          value={dashboardData.total_roi}
          icon="💰"
          trend={{ value: 8, isPositive: true }}
          format="percentage"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="QR Scans (24h)"
          value={dashboardData.qr_scans_24h}
          icon="📱"
          format="number"
        />
        <MetricCard
          title="Locker Drops Delivered"
          value={dashboardData.locker_drops_delivered}
          icon="🎁"
          format="number"
        />
        <MetricCard
          title="Event RSVPs"
          value={dashboardData.event_rsvps}
          icon="🎟️"
          format="number"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1E1E2A] rounded-lg p-6 border border-[#2A2A3A]">
        <h2 className="text-xl font-semibold text-[#E0E0E0] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton
            label="Build Audience"
            description="Create a targeted segment with DNA Query Builder"
            icon="🧬"
            onClick={handleBuildAudience}
          />
          <QuickActionButton
            label="Launch Campaign"
            description="Start a new Locker Drop, Event, or QR activation"
            icon="🚀"
            onClick={handleLaunchCampaign}
          />
          <QuickActionButton
            label="View Analytics"
            description="Deep dive into campaign performance and AI insights"
            icon="📈"
            onClick={handleViewAnalytics}
          />
        </div>
      </div>

      {/* Activity Feed & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed (2/3 width) */}
        <div className="lg:col-span-2">
          <ActivityFeed
            activities={dashboardData.recent_activity}
            brandId={brand.id}
          />
        </div>

        {/* System Health (1/3 width) */}
        <div className="bg-[#1E1E2A] rounded-lg p-6 border border-[#2A2A3A]">
          <h2 className="text-xl font-semibold text-[#E0E0E0] mb-4">System Health</h2>
          <div className="space-y-4">
            <SystemHealthItem
              label="MediaID DNA"
              status={dashboardData.system_health.mediaid_dna_status}
            />
            <SystemHealthItem
              label="Coliseum Analytics"
              status={dashboardData.system_health.coliseum_status}
            />
            <SystemHealthItem
              label="Treasury"
              status={dashboardData.system_health.treasury_status}
            />
            <SystemHealthItem
              label="DIA Connection"
              status={dashboardData.system_health.dia_connected ? 'healthy' : 'down'}
            />
          </div>
          <p className="text-xs text-[#A3A3A3] mt-4">
            Last checked: {new Date(dashboardData.system_health.last_checked).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENT: System Health Item
// ============================================================================

interface SystemHealthItemProps {
  label: string;
  status: 'healthy' | 'degraded' | 'down';
}

function SystemHealthItem({ label, status }: SystemHealthItemProps) {
  const statusConfig = {
    healthy: { color: 'text-green-400', icon: '●', bg: 'bg-green-400/10' },
    degraded: { color: 'text-yellow-400', icon: '●', bg: 'bg-yellow-400/10' },
    down: { color: 'text-red-400', icon: '●', bg: 'bg-red-400/10' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between">
      <span className="text-[#E0E0E0]">{label}</span>
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bg}`}>
        <span className={`${config.color} text-xs`}>{config.icon}</span>
        <span className={`${config.color} text-sm font-medium capitalize`}>{status}</span>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Data Fetching Strategy:
 *    - Initial load: GET /api/v1/companon/dashboard/overview
 *    - Real-time: Subscribe to campaigns table changes via Supabase Realtime
 *    - Polling: Activity feed polls Passport every 10s for new events
 * 
 * 2. API Endpoint Structure:
 *    GET /api/v1/companon/dashboard/overview
 *    Query params: brand_id, range (7d|30d|90d)
 *    Response: DashboardOverviewData
 *    
 *    Implementation:
 *    - Edge Function on Supabase
 *    - Routes through Passport for logging
 *    - Aggregates from Coliseum metrics tables
 *    - Enforces RLS (brand_id filter)
 * 
 * 3. Metrics Calculation:
 *    - Active Campaigns: COUNT(*) FROM campaigns WHERE status = 'active'
 *    - Total Reach: SUM(metrics.impressions) FROM campaigns
 *    - Engagement Rate: AVG(metrics.engagement_rate) FROM campaigns
 *    - ROI: SUM((revenue - cost) / cost) FROM campaigns with Treasury data
 * 
 * 4. Real-Time Updates:
 *    - Subscribe to campaigns table for status changes
 *    - Subscribe to fraud_alerts for security notifications
 *    - Subscribe to passport_entries for activity feed
 *    - Use Supabase Realtime channel per brand_id
 * 
 * 5. Performance Optimizations:
 *    - Debounce real-time updates (max 1 refresh per 2s)
 *    - Cache dashboard data in React Query / SWR
 *    - Lazy load activity feed (only recent 20 items)
 *    - Use Coliseum materialized views for metrics
 * 
 * 6. Error Handling:
 *    - Graceful degradation if Coliseum unavailable
 *    - Show last known data with timestamp
 *    - Display error toast for API failures
 *    - Log errors to Passport for DIA monitoring
 * 
 * 7. Accessibility:
 *    - Metric cards have aria-labels with full context
 *    - Quick action buttons keyboard navigable
 *    - Screen reader announcements for metric changes
 *    - High contrast mode support
 */

