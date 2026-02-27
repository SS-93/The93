/**
 * Compañon DNA Query Builder
 * 
 * Visual interface for building audience segments using MediaID DNA dimensions.
 * Provides real-time aggregated previews with privacy-first consent gating.
 * 
 * Integration Points:
 * - MediaID DNA API: Attribute queries and match scoring
 * - Coliseum: Engagement data enrichment
 * - Vault Map: Geographic heatmap visualization
 * - Passport: Query logging and consent tracking
 * 
 * Data Flow:
 * 1. User adjusts filters (Culture, Behavior, Economics, Spatial)
 * 2. Debounced query (300ms) → POST /api/v1/companon/audiences/preview
 * 3. Passport logs query → MediaID DNA API (aggregated by default)
 * 4. Coliseum enriches with engagement data
 * 5. Preview updates (<2s target)
 * 6. If count < 1000, show consent gate for detailed view
 * 
 * Privacy Controls:
 * - Default: Aggregated data only (≥1000 users)
 * - Detailed view requires explicit opt-in (logged to Passport)
 * - No PII exposed in previews
 * - All queries logged for audit trails
 * 
 * UI Notes:
 * - Split layout: Filters (left) | Preview (right)
 * - Real-time count updates with loading skeleton
 * - Geographic heatmap for spatial distribution
 * - Save segment to CRM workflow
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DNAFilterPanel from './DNAFilterPanel';
import DNAPreviewPanel from './DNAPreviewPanel';
import DNAHeatMap from './DNAHeatMap';
import ConsentGate from './ConsentGate';
import SegmentSaveModal from './SegmentSaveModal';
import type {
  DNAQueryDefinition,
  DNAQueryPreview,
  AudienceSegment,
  CompanonBrand,
} from '@/types/companon';

interface DNAQueryBuilderProps {
  brand: CompanonBrand;
}

export default function DNAQueryBuilder({ brand }: DNAQueryBuilderProps) {
  const navigate = useNavigate();

  // ============================================================================
  // STATE
  // ============================================================================

  const [queryDefinition, setQueryDefinition] = useState<DNAQueryDefinition>({});
  const [preview, setPreview] = useState<DNAQueryPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentGate, setShowConsentGate] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // ============================================================================
  // QUERY PREVIEW (DEBOUNCED)
  // ============================================================================

  // Debounce query preview to avoid excessive API calls
  const debouncedPreview = useCallback(
    debounce(async (query: DNAQueryDefinition) => {
      await fetchPreview(query);
    }, 300),
    []
  );

  useEffect(() => {
    if (Object.keys(queryDefinition).length > 0) {
      setLoading(true);
      debouncedPreview(queryDefinition);
    }
  }, [queryDefinition]);

  const fetchPreview = async (query: DNAQueryDefinition) => {
    try {
      setError(null);

      // Log query to Passport for audit trail
      logEvent('companon.dna_query', {
        brand_id: brand.id,
        query: query,
        is_detailed: consentGranted,
      }, ['mediaid', 'coliseum']);

      // POST to Passport → MediaID DNA API
      const response = await fetch('/api/v1/companon/audiences/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brand.id,
          query_definition: query,
          require_detailed: consentGranted,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch preview');
      }

      const previewData: DNAQueryPreview = await response.json();
      setPreview(previewData);

      // Show consent gate if count < 1000 and consent not yet granted
      if (previewData.requires_opt_in && !consentGranted) {
        setShowConsentGate(true);
      }

    } catch (err) {
      console.error('Preview fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================

  const handleFilterChange = (dimension: keyof DNAQueryDefinition, value: any) => {
    setQueryDefinition((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleClearFilters = () => {
    setQueryDefinition({});
    setPreview(null);
    setConsentGranted(false);
    setShowConsentGate(false);
  };

  // ============================================================================
  // CONSENT HANDLING
  // ============================================================================

  const handleConsentGranted = async () => {
    setConsentGranted(true);
    setShowConsentGate(false);

    // Log consent grant to Passport
    logEvent('companon.dna_query.consent_granted', {
      brand_id: brand.id,
      query: queryDefinition,
    }, ['mediaid']);

    // Re-fetch preview with detailed flag
    await fetchPreview(queryDefinition);
  };

  const handleConsentDenied = () => {
    setShowConsentGate(false);
    // Keep aggregated preview
  };

  // ============================================================================
  // SAVE SEGMENT
  // ============================================================================

  const handleSaveSegment = async (name: string, description?: string) => {
    if (!preview) return;

    try {
      const segment: Omit<AudienceSegment, 'id' | 'created_by' | 'last_updated'> = {
        brand_id: brand.id,
        name,
        description,
        query_definition: queryDefinition,
        estimated_size: preview.estimated_count,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('audience_segments')
        .insert(segment)
        .select()
        .single();

      if (error) throw error;

      // Log segment creation to Passport
      logEvent('companon.audience_segment.created', {
        segment_id: data.id,
        brand_id: brand.id,
        estimated_size: preview.estimated_count,
      }, ['mediaid', 'coliseum']);

      setShowSaveModal(false);

      // Navigate to CRM with new segment highlighted
      navigate(`/companon/crm?highlight=${data.id}`);

    } catch (err) {
      console.error('Save segment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save segment');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#E0E0E0]">DNA Query Builder</h1>
          <p className="text-[#A3A3A3] mt-1">
            Build targeted audience segments using MediaID DNA attributes
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-[#1E1E2A] text-[#A3A3A3] rounded-lg hover:bg-[#2A2A3A] transition-colors"
            disabled={Object.keys(queryDefinition).length === 0}
          >
            Clear Filters
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!preview || preview.estimated_count === 0}
          >
            Save Segment
          </button>
        </div>
      </div>

      {/* Main Content: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Filter Panels (1/3 width) */}
        <div className="lg:col-span-1">
          <DNAFilterPanel
            queryDefinition={queryDefinition}
            onFilterChange={handleFilterChange}
            disabled={loading}
          />
        </div>

        {/* Right Panel: Preview & Heatmap (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview Panel */}
          <DNAPreviewPanel
            preview={preview}
            loading={loading}
            error={error}
            consentGranted={consentGranted}
          />

          {/* Geographic Heatmap (if spatial filters applied) */}
          {preview?.geographic_heatmap && (
            <DNAHeatMap
              dataPoints={preview.geographic_heatmap}
              geofence={queryDefinition.spatial?.geofence}
            />
          )}
        </div>
      </div>

      {/* Consent Gate Modal */}
      {showConsentGate && (
        <ConsentGate
          estimatedCount={preview?.estimated_count || 0}
          onGrant={handleConsentGranted}
          onDeny={handleConsentDenied}
        />
      )}

      {/* Save Segment Modal */}
      {showSaveModal && (
        <SegmentSaveModal
          estimatedSize={preview?.estimated_count || 0}
          onSave={handleSaveSegment}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. API Endpoint Structure:
 *    POST /api/v1/companon/audiences/preview
 *    Body: { brand_id, query_definition, require_detailed }
 *    Response: DNAQueryPreview
 *    
 *    Backend Flow:
 *    - Validate brand_id (RLS)
 *    - Log query to Passport
 *    - Route to MediaID DNA API
 *    - Apply aggregation rules:
 *      - If count ≥ 1000: Return aggregated
 *      - If count < 1000 && !require_detailed: Return count only, set requires_opt_in = true
 *      - If count < 1000 && require_detailed: Return detailed (requires consent log)
 *    - Enrich with Coliseum engagement data
 *    - Return preview
 * 
 * 2. Filter Panel Structure (DNAFilterPanel component):
 *    - Culture Tab: Genre checkboxes, artist search, cultural tags
 *    - Behavior Tab: Engagement sliders, event count range, Locker activity
 *    - Economics Tab: Spending tier radio, Treasury balance range
 *    - Spatial Tab: City multi-select, geofence map picker, radius slider
 *    
 *    Each filter emits onFilterChange(dimension, value)
 * 
 * 3. Preview Panel Structure (DNAPreviewPanel component):
 *    - Top: Estimated count with loading skeleton
 *    - Middle: Demographics distribution (age ranges, no PII)
 *    - Bottom: Engagement score distribution (horizontal bar chart)
 *    - Badge: "Aggregated Data" or "Detailed View"
 * 
 * 4. Heatmap Integration (DNAHeatMap component):
 *    - Uses Leaflet or Mapbox GL JS
 *    - Renders geographic_heatmap points as circles (sized by count)
 *    - Overlays geofence boundary if defined
 *    - Integrates with Vault Map data for city names
 * 
 * 5. Consent Gate Flow (ConsentGate component):
 *    - Modal overlay with privacy explanation
 *    - "I agree to access detailed audience data for targeting purposes"
 *    - Checkbox must be checked to grant
 *    - "Grant" button → logs to Passport → re-fetches with detailed flag
 *    - "Cancel" button → keeps aggregated view
 * 
 * 6. Save Segment Flow (SegmentSaveModal component):
 *    - Input: Segment name (required)
 *    - Textarea: Description (optional)
 *    - Display: Estimated size
 *    - "Save" button → inserts into audience_segments table (RLS enforced)
 *    - Redirects to CRM with new segment highlighted
 * 
 * 7. Performance Optimizations:
 *    - Debounce filter changes (300ms)
 *    - Use React.memo for filter components
 *    - Lazy load heatmap (only if spatial filters applied)
 *    - Cache preview in React Query / SWR (5min TTL)
 * 
 * 8. Privacy Enforcement:
 *    - All queries logged to Passport
 *    - Consent gating for count < 1000
 *    - No user-level data in aggregated previews
 *    - RLS enforces brand_id on audience_segments table
 * 
 * 9. Error Handling:
 *    - Display inline error in preview panel
 *    - Retry button for network failures
 *    - Graceful degradation if MediaID DNA unavailable
 *    - Log errors to Passport for DIA monitoring
 * 
 * 10. Accessibility:
 *     - All filters keyboard navigable
 *     - Screen reader announcements for count updates
 *     - ARIA labels for all form controls
 *     - High contrast mode for heatmap
 */

