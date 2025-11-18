/**
 * Compañon Type Definitions
 * 
 * Brand Activation Dashboard types for audience targeting, campaign management,
 * and privacy-first CRM within the Buckets V2 ecosystem.
 * 
 * Integration Points:
 * - MediaID DNA: Audience attributes and match scores
 * - Treasury: Budget tracking and attribution payouts
 * - Coliseum: Real-time metrics and fraud detection
 * - Passport: Audit logging for all brand actions
 * - Concierto: Event partnership integration
 * - Locker (CALS): Reward delivery
 */

import type { MediaIDDNA } from './dna';
import type { PassportEventType } from './passport';

// ============================================================================
// BRAND & USER ROLES
// ============================================================================

export interface CompanonBrand {
  id: string;
  name: string;
  logo_url?: string;
  settings: BrandSettings;
  subscription_tier: 'starter' | 'growth' | 'enterprise';
  stripe_customer_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BrandSettings {
  primary_color: string;
  custom_domain?: string;
  language: 'en' | 'es';
  timezone: string;
  notification_preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  campaign_launched: boolean;
  fraud_alerts: boolean;
  weekly_reports: boolean;
  budget_warnings: boolean;
}

export type CompanonRole = 'brand_admin' | 'campaign_manager' | 'creator' | 'fan' | 'system_admin';

export interface CompanonUser {
  id: string;
  brand_id: string;
  role: CompanonRole;
  email: string;
  full_name: string;
  permissions: CompanonPermission[];
  created_at: Date;
}

export type CompanonPermission =
  | 'view_campaigns'
  | 'create_campaigns'
  | 'manage_campaigns'
  | 'view_analytics'
  | 'export_data'
  | 'manage_billing'
  | 'manage_team'
  | 'access_crm'
  | 'approve_fraud';

// ============================================================================
// DNA QUERY BUILDER & AUDIENCE SEGMENTATION
// ============================================================================

export interface AudienceSegment {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  query_definition: DNAQueryDefinition;
  estimated_size: number;
  last_updated: Date;
  created_by: string;
  is_active: boolean;
}

export interface DNAQueryDefinition {
  culture?: CultureFilters;
  behavior?: BehaviorFilters;
  economics?: EconomicsFilters;
  spatial?: SpatialFilters;
  consent_tier_required?: ConsentTier;
}

export interface CultureFilters {
  genres?: string[];
  artist_affinities?: string[];
  cultural_tags?: string[];
  language_preferences?: string[];
}

export interface BehaviorFilters {
  engagement_frequency?: 'low' | 'medium' | 'high' | 'very_high';
  event_attendance_count?: { min?: number; max?: number };
  locker_activity_score?: { min?: number; max?: number };
  voting_participation?: boolean;
}

export interface EconomicsFilters {
  spending_tier?: 'free' | 'tier_1' | 'tier_2' | 'tier_3';
  treasury_balance_cents?: { min?: number; max?: number };
  purchase_history_months?: number;
}

export interface SpatialFilters {
  cities?: string[];
  countries?: string[];
  geofence?: Geofence;
  venue_radius_km?: number;
}

export interface Geofence {
  center: { lat: number; lng: number };
  radius_meters: number;
  name?: string;
}

export interface DNAQueryPreview {
  estimated_count: number;
  is_aggregated: boolean; // true if count ≥ 1000
  demographic_distribution?: DemographicDistribution;
  geographic_heatmap?: GeographicDataPoint[];
  engagement_score_distribution?: EngagementDistribution;
  requires_opt_in: boolean; // true if count < 1000
}

export interface DemographicDistribution {
  age_ranges: { range: string; percentage: number }[];
  gender_distribution?: { label: string; percentage: number }[];
}

export interface GeographicDataPoint {
  city: string;
  country: string;
  count: number;
  lat: number;
  lng: number;
}

export interface EngagementDistribution {
  low: number;
  medium: number;
  high: number;
  very_high: number;
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

export type CampaignType = 'locker_drop' | 'event_partnership' | 'qr_activation';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface Campaign {
  id: string;
  brand_id: string;
  type: CampaignType;
  name: string;
  description?: string;
  status: CampaignStatus;
  audience_segment_id?: string;
  estimated_reach: number;
  config: CampaignConfig;
  budget_cents: number;
  spent_cents: number;
  metrics: CampaignMetrics;
  fraud_alerts: FraudAlert[];
  created_at: Date;
  updated_at: Date;
  launched_at?: Date;
  completed_at?: Date;
}

export type CampaignConfig =
  | LockerDropConfig
  | EventPartnershipConfig
  | QRActivationConfig;

export interface LockerDropConfig {
  type: 'locker_drop';
  assets: CampaignAsset[];
  expiration_date?: Date;
  claim_limit?: number;
  unlock_triggers?: DNAQueryDefinition;
  auto_deliver: boolean;
}

export interface EventPartnershipConfig {
  type: 'event_partnership';
  concierto_event_id: string;
  sponsorship_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  booth_geofence?: Geofence;
  brand_visibility: 'logo_only' | 'featured' | 'exclusive';
  pre_event_messaging?: CampaignAsset[];
  post_event_survey?: SurveyQuestion[];
}

export interface QRActivationConfig {
  type: 'qr_activation';
  qr_code_url: string;
  short_link: string; // bkt.to/...
  geofence: Geofence;
  scan_limits: ScanLimits;
  device_fingerprinting_enabled: boolean;
  age_gate_required: boolean;
  age_gate_minimum: number;
  survey: SurveyQuestion[];
  reward: LockerReward;
  creative_assets: CampaignAsset[];
}

export interface CampaignAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: Date;
}

export interface ScanLimits {
  per_device: number;
  per_user: number;
  per_campaign: number;
  time_window_hours?: number;
}

export interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
  order: number;
}

export interface LockerReward {
  type: 'content' | 'discount' | 'access' | 'treasury_credit';
  value?: number; // cents for treasury_credit, percentage for discount
  content_id?: string;
  expires_at?: Date;
}

// ============================================================================
// CAMPAIGN METRICS & ANALYTICS
// ============================================================================

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  engagement_rate: number; // clicks / impressions
  conversion_rate: number; // conversions / clicks
  roi: number; // (revenue - cost) / cost
  qr_scans?: QRMetrics;
  locker_claims?: LockerMetrics;
  event_rsvps?: number;
  fraud_rejection_rate?: number;
}

export interface QRMetrics {
  total_scans: number;
  unique_users: number;
  scans_by_location: GeographicDataPoint[];
  scans_by_hour: { hour: number; count: number }[];
  device_breakdown: { device: 'ios' | 'android' | 'web'; count: number }[];
  fraud_rejected: number;
}

export interface LockerMetrics {
  total_claims: number;
  unique_users: number;
  claim_rate: number; // claims / impressions
  time_to_claim_avg_hours: number;
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

export interface FraudAlert {
  id: string;
  campaign_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alert_type: FraudAlertType;
  description: string;
  metadata: Record<string, any>;
  detected_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
  resolution: FraudResolution;
}

export type FraudAlertType =
  | 'duplicate_device_fingerprint'
  | 'geofence_violation'
  | 'scan_velocity_anomaly'
  | 'suspicious_user_pattern'
  | 'bot_detection';

export type FraudResolution = 'pending' | 'approved' | 'rejected' | 'false_positive';

// ============================================================================
// ANALYTICS & AI INSIGHTS
// ============================================================================

export interface AnalyticsOverview {
  time_range: { start: Date; end: Date };
  total_campaigns: number;
  total_reach: number;
  total_engagement: number;
  total_conversions: number;
  total_spent_cents: number;
  total_revenue_cents: number;
  avg_roi: number;
  top_campaigns: CampaignSummary[];
  time_series: TimeSeriesDataPoint[];
}

export interface CampaignSummary {
  id: string;
  name: string;
  type: CampaignType;
  reach: number;
  engagement_rate: number;
  roi: number;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  reach: number;
  engagement: number;
  conversions: number;
  spend_cents: number;
}

export interface AIInsights {
  campaign_id?: string; // undefined for brand-level insights
  sentiment_analysis?: SentimentAnalysis;
  trend_predictions?: TrendPrediction[];
  optimization_recommendations?: Recommendation[];
  generated_at: Date;
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // -1 to 1
  themes: SentimentTheme[];
  sample_quotes: string[];
}

export interface SentimentTheme {
  theme: string;
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface TrendPrediction {
  prediction: string;
  confidence: number; // 0 to 1
  category: 'demographic' | 'geographic' | 'behavioral' | 'cultural';
  supporting_data?: Record<string, any>;
}

export interface Recommendation {
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: 'targeting' | 'creative' | 'timing' | 'budget' | 'channels';
}

// ============================================================================
// PRIVACY-FIRST CRM
// ============================================================================

export type ConsentTier = 'tier_1' | 'tier_2' | 'tier_3';

export interface CRMContact {
  id: string;
  brand_id: string;
  mediaid_hash: string; // Pseudonymous identifier
  consent_tier: ConsentTier;
  consent_granted_at: Date;
  consent_revoked_at?: Date;
  last_engagement: Date;
  dna_match_score: number; // 0 to 1, compatibility with brand DNA
  engagement_history: EngagementEvent[];
  sentiment_themes: string[];
  created_at: Date;
}

export interface EngagementEvent {
  id: string;
  event_type: PassportEventType;
  campaign_id?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ConsentTierDefinition {
  tier: ConsentTier;
  name: string;
  description: string;
  includes: string[];
}

export const CONSENT_TIER_DEFINITIONS: ConsentTierDefinition[] = [
  {
    tier: 'tier_1',
    name: 'Basic Engagement',
    description: 'Track campaign impressions and clicks',
    includes: ['campaign_views', 'link_clicks', 'basic_demographics'],
  },
  {
    tier: 'tier_2',
    name: 'Detailed Analytics',
    description: 'Detailed engagement metrics and CRM',
    includes: ['tier_1', 'survey_responses', 'dna_match_scores', 'crm_profile'],
  },
  {
    tier: 'tier_3',
    name: 'Brand Partnerships',
    description: 'Share data with partner brands',
    includes: ['tier_1', 'tier_2', 'third_party_sharing', 'personalized_offers'],
  },
];

// ============================================================================
// BILLING & SUBSCRIPTIONS
// ============================================================================

export interface CompanonSubscription {
  id: string;
  brand_id: string;
  stripe_subscription_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  campaigns_included: number;
  campaigns_used: number;
  overage_rate_cents?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  billing_interval: 'monthly' | 'annual';
  campaigns_per_month: number;
  features: string[];
  stripe_price_id: string;
}

export interface PayPerCampaignCharge {
  id: string;
  brand_id: string;
  campaign_id: string;
  amount_cents: number;
  stripe_payment_intent_id: string;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: Date;
}

// ============================================================================
// DASHBOARD STATE & UI
// ============================================================================

export interface DashboardOverviewData {
  active_campaigns_count: number;
  total_reach_7d: number;
  total_reach_30d: number;
  avg_engagement_rate: number;
  total_roi: number;
  qr_scans_24h: number;
  locker_drops_delivered: number;
  event_rsvps: number;
  recent_activity: PassportActivityItem[];
  system_health: SystemHealthIndicator;
}

export interface PassportActivityItem {
  id: string;
  event_type: PassportEventType;
  description: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'error';
}

export interface SystemHealthIndicator {
  dia_connected: boolean;
  mediaid_dna_status: 'healthy' | 'degraded' | 'down';
  coliseum_status: 'healthy' | 'degraded' | 'down';
  treasury_status: 'healthy' | 'degraded' | 'down';
  last_checked: Date;
}

// ============================================================================
// QR CODE MANAGEMENT
// ============================================================================

export interface QRCode {
  id: string;
  campaign_id: string;
  variant_name: string;
  qr_code_svg: string;
  qr_code_png_url: string;
  short_link: string; // bkt.to/...
  full_url: string;
  scan_count: number;
  is_active: boolean;
  created_at: Date;
  rotated_at?: Date;
}

export interface QRScanEvent {
  id: string;
  qr_code_id: string;
  campaign_id: string;
  user_id?: string;
  device_fingerprint_hash: string;
  location?: { lat: number; lng: number };
  within_geofence: boolean;
  timestamp: Date;
  fraud_flags: FraudAlertType[];
  resolution: FraudResolution;
}

// ============================================================================
// EXPORT & REPORTING
// ============================================================================

export interface ReportExport {
  id: string;
  brand_id: string;
  report_type: 'campaign_summary' | 'analytics_overview' | 'crm_contacts' | 'qr_scans';
  format: 'csv' | 'xlsx' | 'pdf';
  filters: Record<string, any>;
  file_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
}

export interface ScheduledReport {
  id: string;
  brand_id: string;
  report_type: ReportExport['report_type'];
  format: ReportExport['format'];
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[]; // email addresses
  is_active: boolean;
  next_run: Date;
}

