/**
 * Compañon App Shell
 * 
 * Main layout wrapper for the Compañon Brand Activation Dashboard.
 * Provides header, sidebar navigation, and content area.
 * 
 * Integration Points:
 * - Passport: Logs navigation events and session tracking
 * - DIA: System health monitoring
 * - Supabase Auth: User session management
 * 
 * Data Flow:
 * 1. User authenticates via Supabase
 * 2. RLS enforces brand_id access control
 * 3. Passport logs all navigation events
 * 4. Real-time notifications via Supabase Realtime
 * 
 * UI Notes:
 * - Dark theme with blue accents (#121212 bg, #3B82F6 primary)
 * - Collapsible sidebar for mobile responsiveness
 * - WCAG 2.1 AA compliant keyboard navigation
 * - Bilingual support (EN/ES)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@/lib/supabaseClient';
import { usePassport } from '@/hooks/usePassport';
import CompanonHeader from './CompanonHeader';
import CompanonSidebar from './CompanonSidebar';
import type { CompanonBrand, CompanonUser, SystemHealthIndicator } from '@/types/companon';

interface CompanonShellProps {
  children: React.ReactNode;
}

export default function CompanonShell({ children }: CompanonShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const supabase = useSupabaseClient();
  const { data: authUser } = useUser();
  const { logEvent } = usePassport();

  // ============================================================================
  // STATE
  // ============================================================================

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentBrand, setCurrentBrand] = useState<CompanonBrand | null>(null);
  const [companonUser, setCompanonUser] = useState<CompanonUser | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthIndicator | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // AUTHENTICATION & AUTHORIZATION
  // ============================================================================

  useEffect(() => {
    if (!authUser) {
      // Redirect to login if not authenticated
      navigate('/auth/login?redirect=/companon/dashboard');
      return;
    }

    loadCompanonUser();
  }, [authUser]);

  const loadCompanonUser = async () => {
    if (!authUser) return;

    try {
      // Fetch Compañon user profile with brand association
      // RLS enforces: user can only see their own profile
      const { data: userData, error: userError } = await supabase
        .from('companon_users')
        .select('*, brand:brands(*)')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;

      setCompanonUser(userData);
      setCurrentBrand(userData.brand);

      // Log session start to Passport
      logEvent('companon.session.started' as any, {
        user_id: authUser.id,
        brand_id: userData.brand_id,
        role: userData.role,
        route: pathname,
      }, { affects_systems: ['mediaid'] });

    } catch (error) {
      console.error('Failed to load Compañon user:', error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // SYSTEM HEALTH MONITORING (DIA INTEGRATION)
  // ============================================================================

  useEffect(() => {
    // Poll system health every 30 seconds
    const checkSystemHealth = async () => {
      try {
        const { data, error } = await supabase
          .from('dia_system_health')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        setSystemHealth({
          dia_connected: true,
          mediaid_dna_status: data.mediaid_dna_status,
          coliseum_status: data.coliseum_status,
          treasury_status: data.treasury_status,
          last_checked: new Date(data.checked_at),
        });
      } catch (error) {
        console.error('System health check failed:', error);
        setSystemHealth({
          dia_connected: false,
          mediaid_dna_status: 'down',
          coliseum_status: 'down',
          treasury_status: 'down',
          last_checked: new Date(),
        });
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // NAVIGATION TRACKING (PASSPORT)
  // ============================================================================

  useEffect(() => {
    if (companonUser && pathname) {
      logEvent('companon.navigation' as any, {
        from: document.referrer || 'direct',
        to: pathname,
        brand_id: companonUser.brand_id,
      }, { affects_systems: ['coliseum'] });
    }
  }, [pathname, companonUser]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#E0E0E0] text-lg">Loading Compañon Dashboard...</div>
      </div>
    );
  }

  if (!companonUser || !currentBrand) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#E0E0E0] text-lg">
          Access Denied. Please contact your brand administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex">
      {/* Sidebar */}
      <CompanonSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPath={pathname}
        userRole={companonUser.role}
        brandLogo={currentBrand.logo_url}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <CompanonHeader
          user={companonUser}
          brand={currentBrand}
          systemHealth={systemHealth}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Breadcrumbs or page title could go here */}
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * NOTES FOR IMPLEMENTATION:
 * 
 * 1. Authentication Flow:
 *    - Check Supabase auth session
 *    - Load Compañon user from companon_users table (RLS enforced)
 *    - Verify brand association
 *    - Log session start to Passport
 * 
 * 2. Role-Based Access Control:
 *    - Sidebar items filtered by user role (CompanonSidebar)
 *    - Route guards enforced in individual pages
 *    - RLS policies prevent unauthorized data access
 * 
 * 3. System Health Monitoring:
 *    - Poll dia_system_health table every 30s
 *    - Display status indicators in header
 *    - Alert on degraded/down services
 * 
 * 4. Real-Time Updates:
 *    - Subscribe to Passport events for notifications
 *    - Subscribe to campaigns table for campaign status changes
 *    - Subscribe to fraud_alerts table for security notifications
 * 
 * 5. Accessibility:
 *    - Keyboard shortcuts for sidebar navigation (implement in CompanonSidebar)
 *    - Skip to content link for screen readers
 *    - ARIA labels for all interactive elements
 * 
 * 6. Localization:
 *    - Language preference stored in brand.settings.language
 *    - Pass to all child components via context
 *    - Use i18n library (next-i18next recommended)
 * 
 * 7. Mobile Responsiveness:
 *    - Sidebar collapses to icons-only on mobile (<768px)
 *    - Header adapts to stacked layout
 *    - Touch-friendly tap targets (min 44x44px)
 */

