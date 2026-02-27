/**
 * Compañon Routes
 * 
 * Routing structure for the Compañon Brand Activation Dashboard.
 * Follows the hybrid approach: landing page (public) + authenticated dashboard (with sidebar).
 * 
 * Route Structure:
 * /companon                     → Landing page (public, Concierto-style)
 * /companon/dashboard           → Dashboard home (auth required, BrandDashboardTemplateUI)
 * /companon/dna-builder         → DNA Query Builder
 * /companon/campaigns           → Campaign list
 * /companon/campaigns/new       → Campaign wizard
 * /companon/campaigns/:id       → Campaign detail
 * /companon/analytics           → Analytics dashboard
 * /companon/crm                 → CRM & contacts
 * /companon/qr                  → QR campaigns
 * /companon/settings            → Settings & billing
 * 
 * Integration Points:
 * - Supabase Auth: Protected routes check authentication
 * - Passport: Logs all navigation events
 * - CompanonShell: Wraps authenticated routes with sidebar
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CompanonLanding from './CompanonLanding';
import CompanonShell from './layout/CompanonShell';
import DashboardOverview from './dashboard/DashboardOverview';
import DNAQueryBuilder from './dna/DNAQueryBuilder';
import type { CompanonBrand } from '../../types/companon';

// Default brand for demo/testing purposes
const DEFAULT_BRAND: CompanonBrand = {
  id: '',
  name: 'Default Brand',
  settings: {
    primary_color: '#7C3AED',
    language: 'en' as const,
    timezone: 'America/New_York',
    notification_preferences: {
      campaign_launched: true,
      fraud_alerts: true,
      weekly_reports: true,
      budget_warnings: true
    }
  },
  subscription_tier: 'starter' as const,
  created_at: new Date(),
  updated_at: new Date()
};
// Import other components as they're built
// import CampaignList from './campaigns/CampaignList';
// import CampaignWizard from './campaigns/CampaignWizard';
// import CampaignDetailView from './campaigns/CampaignDetailView';
// import AnalyticsDashboard from './analytics/AnalyticsDashboard';
// import CRMDashboard from './crm/CRMDashboard';
// import QRCampaignDashboard from './qr/QRCampaignDashboard';
// import Settings from './settings/Settings';

const CompanonRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<CompanonLanding />} />

      {/* Authenticated Dashboard Routes (wrapped in CompanonShell) */}
      <Route
        path="/dashboard/*"
        element={
          <CompanonShell>
            <Routes>
              {/* Dashboard Home */}
              <Route path="/" element={<DashboardOverview brand={DEFAULT_BRAND} />} />

              {/* DNA Query Builder */}
              <Route path="/dna-builder" element={<DNAQueryBuilder brand={DEFAULT_BRAND} />} />
              
              {/* Campaigns */}
              <Route path="/campaigns" element={<ComingSoon feature="Campaign List" />} />
              <Route path="/campaigns/new" element={<ComingSoon feature="Campaign Wizard" />} />
              <Route path="/campaigns/:id" element={<ComingSoon feature="Campaign Detail" />} />
              
              {/* Analytics */}
              <Route path="/analytics" element={<ComingSoon feature="Analytics Dashboard" />} />
              
              {/* CRM */}
              <Route path="/crm" element={<ComingSoon feature="CRM Dashboard" />} />
              
              {/* QR Campaigns */}
              <Route path="/qr" element={<ComingSoon feature="QR Campaigns" />} />
              
              {/* Settings */}
              <Route path="/settings" element={<ComingSoon feature="Settings" />} />
              
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/companon/dashboard" replace />} />
            </Routes>
          </CompanonShell>
        }
      />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/companon" replace />} />
    </Routes>
  );
};

export default CompanonRoutes;

// ============================================================================
// TEMPORARY PLACEHOLDER COMPONENT
// ============================================================================

interface ComingSoonProps {
  feature: string;
}

function ComingSoon({ feature }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-6xl">🚧</div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#E0E0E0] mb-2">{feature}</h2>
        <p className="text-[#A3A3A3] text-lg">Coming soon...</p>
        <p className="text-[#A3A3A3] text-sm mt-4">
          This feature is part of the Compañon roadmap and will be available in the next sprint.
        </p>
      </div>
      <div className="flex space-x-4 mt-8">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-[#1E1E2A] text-[#E0E0E0] rounded-lg hover:bg-[#2A2A3A] transition-colors"
        >
          ← Go Back
        </button>
        <a
          href="/companon/dashboard"
          className="px-6 py-3 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
        >
          Dashboard Home
        </a>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Routing Architecture:
 *    - Landing page is PUBLIC (no auth required)
 *    - All /dashboard/* routes are PROTECTED (wrapped in CompanonShell)
 *    - CompanonShell handles auth check, sidebar, header
 * 
 * 2. Route Protection Strategy:
 *    - CompanonShell checks auth state on mount
 *    - Redirects to /auth/login?redirect=/companon/dashboard if not authenticated
 *    - RLS policies on Supabase enforce data access control
 * 
 * 3. Nested Routes Pattern:
 *    - /companon/dashboard/* uses nested <Routes> inside CompanonShell
 *    - Allows sidebar to persist across dashboard pages
 *    - Follows Next.js-style layout pattern (but in React Router)
 * 
 * 4. Coming Soon Placeholders:
 *    - Temporary component for unbuilt features
 *    - Shows feature name and "Coming soon" message
 *    - Provides navigation back to dashboard
 * 
 * 5. Progressive Enhancement:
 *    - As we build components, replace <ComingSoon /> with real components
 *    - Import statements are commented out until components exist
 *    - Route structure is complete, just swap implementations
 * 
 * 6. Integration with Existing Routing:
 *    - This should be mounted at /companon in main App.tsx or router config
 *    - Example: <Route path="/companon/*" element={<CompanonRoutes />} />
 * 
 * 7. Passport Logging:
 *    - All navigation events logged by CompanonShell's useEffect
 *    - DashboardOverview and DNAQueryBuilder already log page views
 * 
 * 8. Next Steps:
 *    - Update main router to include /companon/* route
 *    - Build remaining components (CampaignList, AnalyticsDashboard, etc.)
 *    - Replace <ComingSoon /> with real implementations
 *    - Add route guards for role-based access (Brand Admin vs Campaign Manager)
 */

