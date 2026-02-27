/**
 * ============================================================================
 * COLISEUM ANALYTICS - ENTITLEMENT SYSTEM
 * ============================================================================
 * Purpose: Plan-based access control for DNA analytics data
 * Plans: basic ($29/mo), pro ($99/mo), enterprise ($499+/mo)
 * ============================================================================
 */

import React from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DNADomain } from './domainCalculator';

// ============================================================================
// TYPES
// ============================================================================

export type ColiseumPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export type ColiseumPlanStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface ColiseumEntitlement {
  user_id: string;
  plan: ColiseumPlan;
  status: ColiseumPlanStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  artists_tracked: number;
  api_calls_month: number;
  reports_generated_month: number;
  current_period_start?: Date;
  current_period_end?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PlanFeatures {
  name: string;
  price_monthly: number;
  domains: DNADomain[]; // Which DNA domains accessible
  leaderboard_depth: number; // How many artists visible
  artist_profiles: number; // How many artist deep-dives allowed
  metrics_retention_days: number;
  export_formats: ExportFormat[];
  realtime_updates: boolean;
  api_access: boolean;
  api_rate_limit?: { rps: number; rpm: number };
  visible_metrics: string[];
  features: {
    impact_reports?: { monthly_limit: number; ocr_images: number; reruns?: number; batch?: boolean };
    custom_filters?: boolean;
    cohort_analysis?: boolean;
    white_label_reports?: boolean;
    dedicated_support?: boolean;
    custom_integrations?: boolean;
    data_warehouse_export?: boolean;
  };
}

export type ExportFormat = 'csv' | 'json' | 'parquet';

// ============================================================================
// PLAN DEFINITIONS
// ============================================================================

export const PLAN_FEATURES: Record<ColiseumPlan, PlanFeatures> = {
  free: {
    name: 'Free',
    price_monthly: 0,
    domains: [], // No access
    leaderboard_depth: 10, // Top 10 only
    artist_profiles: 0, // No deep-dives
    metrics_retention_days: 30,
    export_formats: [],
    realtime_updates: false,
    api_access: false,
    visible_metrics: ['domain_strength'], // Just the score
    features: {},
  },

  basic: {
    name: 'Basic',
    price_monthly: 29,
    domains: ['A'], // Cultural only
    leaderboard_depth: 25, // Top 25
    artist_profiles: 1, // 1 artist deep-dive
    metrics_retention_days: 90,
    export_formats: ['csv'],
    realtime_updates: false,
    api_access: false,
    visible_metrics: [
      'domain_strength',
      'primary_genres',
      'genre_diversity_index',
      'crossover_potential',
    ],
    features: {
      impact_reports: { monthly_limit: 2, ocr_images: 2, reruns: 0 },
      custom_filters: false,
    },
  },

  pro: {
    name: 'Pro',
    price_monthly: 99,
    domains: ['A', 'T', 'G', 'C'], // All 4 domains
    leaderboard_depth: 100, // Top 100
    artist_profiles: 5, // 5 artist deep-dives
    metrics_retention_days: 365,
    export_formats: ['csv', 'json'],
    realtime_updates: false,
    api_access: true,
    api_rate_limit: { rps: 1, rpm: 60 },
    visible_metrics: [
      'all_base_metrics',
      'mutation_history_7d',
      'comparative_analysis',
      'city_breakdowns',
    ],
    features: {
      impact_reports: { monthly_limit: 12, ocr_images: 5, reruns: 1 },
      custom_filters: true,
      cohort_analysis: false,
    },
  },

  enterprise: {
    name: 'Enterprise',
    price_monthly: 499,
    domains: ['A', 'T', 'G', 'C'],
    leaderboard_depth: Infinity, // Full dataset
    artist_profiles: Infinity,
    metrics_retention_days: 1095, // 3 years
    export_formats: ['csv', 'json', 'parquet'],
    realtime_updates: true,
    api_access: true,
    api_rate_limit: { rps: 5, rpm: 300 },
    visible_metrics: [
      'all_metrics',
      'mutation_history_alltime',
      'predictive_models',
      'anomaly_detection',
      'network_graphs',
    ],
    features: {
      impact_reports: { monthly_limit: Infinity, ocr_images: 10, batch: true },
      custom_filters: true,
      cohort_analysis: true,
      white_label_reports: true,
      dedicated_support: true,
      custom_integrations: true,
      data_warehouse_export: true,
    },
  },
};

// ============================================================================
// ENTITLEMENT MANAGER
// ============================================================================

export class EntitlementManager {
  private supabase: SupabaseClient;
  private cache: Map<string, { entitlement: ColiseumEntitlement; expiresAt: number }>;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.cache = new Map();
  }

  /**
   * Check if user is admin
   */
  private async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return !error && data?.role === 'admin';
  }

  /**
   * Get user's entitlement (with caching)
   */
  async getUserEntitlement(userId: string): Promise<ColiseumEntitlement> {
    // Check if user is admin - admins get enterprise-level access
    const isAdmin = await this.isAdmin(userId);
    if (isAdmin) {
      const adminEntitlement: ColiseumEntitlement = {
        user_id: userId,
        plan: 'enterprise',
        status: 'active',
        artists_tracked: 0,
        api_calls_month: 0,
        reports_generated_month: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      return adminEntitlement;
    }

    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.entitlement;
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('coliseum_entitlements')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // User not found = free tier
      if (error.code === 'PGRST116') {
        const freeEntitlement: ColiseumEntitlement = {
          user_id: userId,
          plan: 'free',
          status: 'active',
          artists_tracked: 0,
          api_calls_month: 0,
          reports_generated_month: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };
        return freeEntitlement;
      }
      throw error;
    }

    // Cache for 5 minutes
    this.cache.set(userId, {
      entitlement: data,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return data;
  }

  /**
   * Get user's plan
   */
  async getUserPlan(userId: string): Promise<ColiseumPlan> {
    const entitlement = await this.getUserEntitlement(userId);
    return entitlement.plan;
  }

  /**
   * Check if user has access to a specific domain
   */
  async canAccessDomain(userId: string, domain: DNADomain): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];
    return features.domains.includes(domain);
  }

  /**
   * Check if user can view a specific metric
   */
  async canAccessMetric(userId: string, metricName: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];

    // Check if metric is in visible_metrics
    if (features.visible_metrics.includes('all_metrics')) return true;
    if (features.visible_metrics.includes('all_base_metrics')) {
      // Allow all domain_* and basic metrics
      return metricName.startsWith('domain_') || metricName.includes('_index') || metricName.includes('_score');
    }

    return features.visible_metrics.includes(metricName);
  }

  /**
   * Check if user can export data
   */
  async canExport(userId: string, format: ExportFormat): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];
    return features.export_formats.includes(format);
  }

  /**
   * Check if user can access API
   */
  async canUseAPI(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];
    return features.api_access;
  }

  /**
   * Check rate limit for API access
   */
  async checkRateLimit(
    userId: string
  ): Promise<{ allowed: boolean; limit: { rps: number; rpm: number } | null }> {
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];

    if (!features.api_access) {
      return { allowed: false, limit: null };
    }

    // TODO: Implement actual rate limiting with Redis
    // For now, just return the limit
    return { allowed: true, limit: features.api_rate_limit || null };
  }

  /**
   * Get leaderboard depth limit for user
   */
  async getLeaderboardDepth(userId: string): Promise<number> {
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];
    return features.leaderboard_depth;
  }

  /**
   * Check if user can view full leaderboard
   */
  async canViewFullLeaderboard(userId: string, requestedDepth: number): Promise<boolean> {
    const maxDepth = await this.getLeaderboardDepth(userId);
    return requestedDepth <= maxDepth;
  }

  /**
   * Increment usage counter (artists tracked, API calls, reports)
   */
  async incrementUsage(userId: string, metric: 'artists_tracked' | 'api_calls_month' | 'reports_generated_month'): Promise<void> {
    const { error } = await this.supabase.rpc('increment_coliseum_usage', {
      p_user_id: userId,
      p_metric: metric,
    });

    if (error) throw error;

    // Bust cache
    this.cache.delete(userId);
  }

  /**
   * Check if user has reached usage limit
   */
  async checkUsageLimit(
    userId: string,
    metric: 'artists_tracked' | 'api_calls_month' | 'reports_generated_month'
  ): Promise<{ withinLimit: boolean; current: number; limit: number }> {
    const entitlement = await this.getUserEntitlement(userId);
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];

    let limit: number;
    let current: number;

    switch (metric) {
      case 'artists_tracked':
        limit = features.artist_profiles;
        current = entitlement.artists_tracked;
        break;
      case 'api_calls_month':
        limit = features.api_rate_limit?.rpm || 0;
        current = entitlement.api_calls_month;
        break;
      case 'reports_generated_month':
        limit = features.features.impact_reports?.monthly_limit || 0;
        current = entitlement.reports_generated_month;
        break;
    }

    return {
      withinLimit: current < limit,
      current,
      limit,
    };
  }

  /**
   * Filter leaderboard data by plan entitlements
   */
  async filterLeaderboardData<T extends { artist_id: string }>(
    userId: string,
    data: T[]
  ): Promise<T[]> {
    const maxDepth = await this.getLeaderboardDepth(userId);
    return data.slice(0, maxDepth);
  }

  /**
   * Filter artist profile data by plan entitlements
   */
  async filterArtistMetrics(
    userId: string,
    metrics: Record<string, any>
  ): Promise<Record<string, any>> {
    const plan = await this.getUserPlan(userId);
    const features = PLAN_FEATURES[plan];
    const filtered: Record<string, any> = {};

    for (const [key, value] of Object.entries(metrics)) {
      if (await this.canAccessMetric(userId, key)) {
        filtered[key] = value;
      } else {
        // Show upgrade message
        filtered[key] = { locked: true, upgrade_to: this.getNextPlan(plan) };
      }
    }

    return filtered;
  }

  /**
   * Get next plan for upgrade CTA
   */
  private getNextPlan(currentPlan: ColiseumPlan): ColiseumPlan {
    const planOrder: ColiseumPlan[] = ['free', 'basic', 'pro', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);
    return planOrder[currentIndex + 1] || 'enterprise';
  }

  /**
   * Bust cache for user (call after plan change)
   */
  bustCache(userId: string): void {
    this.cache.delete(userId);
  }
}

// ============================================================================
// GUARD MIDDLEWARE (Express)
// ============================================================================

/**
 * Express middleware to check plan entitlements
 */
export function requirePlan(minPlan: ColiseumPlan) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = req.supabase; // Assume supabase client attached to req
    const entitlementManager = new EntitlementManager(supabase);

    const userPlan = await entitlementManager.getUserPlan(userId);
    const planOrder: ColiseumPlan[] = ['free', 'basic', 'pro', 'enterprise'];
    const userPlanIndex = planOrder.indexOf(userPlan);
    const requiredPlanIndex = planOrder.indexOf(minPlan);

    if (userPlanIndex < requiredPlanIndex) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        current_plan: userPlan,
        required_plan: minPlan,
        upgrade_url: '/pricing',
      });
    }

    next();
  };
}

/**
 * Express middleware to check domain access
 */
export function requireDomain(domain: DNADomain) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = req.supabase;
    const entitlementManager = new EntitlementManager(supabase);

    const hasAccess = await entitlementManager.canAccessDomain(userId, domain);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Domain access restricted',
        domain,
        required_plan: 'pro', // Assuming Pro+ gets all domains
      });
    }

    next();
  };
}

/**
 * Express middleware to check API rate limit
 */
export function checkAPIRateLimit() {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = req.supabase;
    const entitlementManager = new EntitlementManager(supabase);

    const { allowed, limit } = await entitlementManager.checkRateLimit(userId);
    if (!allowed) {
      return res.status(403).json({
        error: 'API access requires Pro or Enterprise plan',
        upgrade_url: '/pricing',
      });
    }

    // TODO: Implement actual rate limiting with Redis
    // For now, just allow
    next();
  };
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * React hook for checking entitlements (client-side)
 */
export function useColiseumEntitlement() {
  const [entitlement, setEntitlement] = React.useState<ColiseumEntitlement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Fetch entitlement on mount
  React.useEffect(() => {
    async function fetchEntitlement() {
      try {
        const supabase = createClient(
          process.env.REACT_APP_SUPABASE_URL!,
          process.env.REACT_APP_SUPABASE_ANON_KEY!
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Not authenticated - return null entitlement but not an error
          setIsAuthenticated(false);
          setEntitlement(null);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        const manager = new EntitlementManager(supabase);
        const ent = await manager.getUserEntitlement(user.id);
        setEntitlement(ent);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchEntitlement();
  }, []);

  return { entitlement, loading, error, isAuthenticated };
}

/**
 * Check if user has specific feature access
 */
export function useFeatureAccess(feature: keyof PlanFeatures['features']) {
  const { entitlement } = useColiseumEntitlement();

  if (!entitlement) return false;

  const features = PLAN_FEATURES[entitlement.plan];
  return !!features.features[feature];
}

/**
 * Get upgrade CTA for locked features
 */
export function useUpgradeCTA() {
  const { entitlement } = useColiseumEntitlement();

  if (!entitlement || entitlement.plan === 'enterprise') return null;

  const planOrder: ColiseumPlan[] = ['free', 'basic', 'pro', 'enterprise'];
  const currentIndex = planOrder.indexOf(entitlement.plan);
  const nextPlan = planOrder[currentIndex + 1];

  return {
    message: `Upgrade to ${PLAN_FEATURES[nextPlan].name} to unlock this feature`,
    next_plan: nextPlan,
    price: PLAN_FEATURES[nextPlan].price_monthly,
    features: PLAN_FEATURES[nextPlan].features,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create SQL function to increment usage counters
 */
export const CREATE_INCREMENT_USAGE_FUNCTION = `
create or replace function increment_coliseum_usage(
  p_user_id uuid,
  p_metric text
) returns void as $$
begin
  update coliseum_entitlements
  set
    artists_tracked = case when p_metric = 'artists_tracked' then artists_tracked + 1 else artists_tracked end,
    api_calls_month = case when p_metric = 'api_calls_month' then api_calls_month + 1 else api_calls_month end,
    reports_generated_month = case when p_metric = 'reports_generated_month' then reports_generated_month + 1 else reports_generated_month end,
    updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql;
`;

/**
 * Create SQL function to reset monthly counters (run via CRON on 1st of month)
 */
export const CREATE_RESET_MONTHLY_USAGE_FUNCTION = `
create or replace function reset_monthly_coliseum_usage() returns void as $$
begin
  update coliseum_entitlements
  set
    api_calls_month = 0,
    reports_generated_month = 0,
    updated_at = now();

  raise notice 'Reset monthly usage counters for all users';
end;
$$ language plpgsql;
`;

// ============================================================================
// EXPORT
// ============================================================================

export default EntitlementManager;
