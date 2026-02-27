import React, { useState } from 'react';
import { MagnifyingGlassIcon, CalendarIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ============================================================================
// TYPES
// ============================================================================

export type TimeRange = '7d' | '30d' | 'alltime';
export type Domain = 'A' | 'T' | 'G' | 'C' | 'all';

export interface FilterBarProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  domain: Domain;
  onDomainChange: (domain: Domain) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  additionalFilters?: React.ReactNode;
  showSearch?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'alltime', label: 'All Time' },
];

const DOMAINS: { value: Domain; label: string; color: string; description: string }[] = [
  { value: 'all', label: 'All Domains', color: 'text-coliseum-text-primary', description: 'View all domains' },
  { value: 'A', label: 'Cultural', color: 'text-coliseum-domain-a', description: 'Cultural Identity (A)' },
  { value: 'T', label: 'Behavioral', color: 'text-coliseum-domain-t', description: 'Behavioral Patterns (T)' },
  { value: 'G', label: 'Economic', color: 'text-coliseum-domain-g', description: 'Economic Signals (G)' },
  { value: 'C', label: 'Geographic', color: 'text-coliseum-domain-c', description: 'Spatial Geography (C)' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const FilterBar: React.FC<FilterBarProps> = ({
  timeRange,
  onTimeRangeChange,
  domain,
  onDomainChange,
  searchQuery = '',
  onSearchChange,
  additionalFilters,
  showSearch = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const clearSearch = () => {
    setLocalSearchQuery('');
    onSearchChange?.('');
  };

  const activeFiltersCount = [
    timeRange !== 'alltime' ? 1 : 0,
    domain !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-coliseum-bg-secondary border border-coliseum-border-default rounded-lg p-4 space-y-4">
      {/* Main Controls Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Time Range Selector */}
        <div className="flex-1">
          <label className="block text-caption-md text-coliseum-text-tertiary mb-2 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Time Range
          </label>
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`
                  flex-1 px-4 py-2
                  text-ui-md font-medium
                  rounded-lg
                  border
                  transition-all duration-coliseum-base
                  ${
                    timeRange === range.value
                      ? 'bg-coliseum-accent-neon/20 text-coliseum-accent-neon border-coliseum-accent-neon shadow-coliseum-neon'
                      : 'bg-coliseum-bg-tertiary text-coliseum-text-secondary border-coliseum-border-default hover:bg-coliseum-bg-elevated hover:border-coliseum-border-hover'
                  }
                `}
                aria-pressed={timeRange === range.value}
                aria-label={`Filter by ${range.label}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Domain Selector */}
        <div className="flex-1">
          <label className="block text-caption-md text-coliseum-text-tertiary mb-2 flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" />
            DNA Domain
          </label>
          <div className="flex gap-2 flex-wrap">
            {DOMAINS.map((d) => (
              <button
                key={d.value}
                onClick={() => onDomainChange(d.value)}
                className={`
                  px-4 py-2
                  text-ui-md font-medium
                  rounded-lg
                  border
                  transition-all duration-coliseum-base
                  ${
                    domain === d.value
                      ? `bg-opacity-20 border-current shadow-coliseum-sm ${d.color}`
                      : 'bg-coliseum-bg-tertiary text-coliseum-text-secondary border-coliseum-border-default hover:bg-coliseum-bg-elevated hover:border-coliseum-border-hover'
                  }
                `}
                aria-pressed={domain === d.value}
                aria-label={d.description}
                title={d.description}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Additional Filters Row */}
      {(showSearch || additionalFilters) && (
        <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t border-coliseum-border-default">
          {/* Search Bar */}
          {showSearch && onSearchChange && (
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coliseum-text-tertiary" />
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search artists, events, locations..."
                  className={`
                    w-full
                    pl-10 pr-10 py-2
                    bg-coliseum-bg-tertiary
                    border border-coliseum-border-default
                    rounded-lg
                    text-body-md text-coliseum-text-primary
                    placeholder-coliseum-text-tertiary
                    focus:outline-none
                    focus:border-coliseum-accent-neon
                    focus:ring-2 focus:ring-coliseum-accent-neon/20
                    transition-all duration-coliseum-base
                  `}
                  aria-label="Search"
                />
                {localSearchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-coliseum-text-tertiary hover:text-coliseum-text-primary transition-colors"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Additional Filters Slot */}
          {additionalFilters && (
            <div className="flex items-end">
              {additionalFilters}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-caption-md text-coliseum-text-tertiary">
            Active filters:
          </span>
          <div className="flex gap-2">
            {timeRange !== 'alltime' && (
              <span className="px-2 py-1 bg-coliseum-accent-neon/10 text-coliseum-accent-neon text-ui-sm rounded border border-coliseum-accent-neon/30">
                {TIME_RANGES.find((r) => r.value === timeRange)?.label}
              </span>
            )}
            {domain !== 'all' && (
              <span className={`px-2 py-1 bg-opacity-10 text-ui-sm rounded border border-current ${DOMAINS.find((d) => d.value === domain)?.color}`}>
                {DOMAINS.find((d) => d.value === domain)?.label}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              onTimeRangeChange('alltime');
              onDomainChange('all');
              clearSearch();
            }}
            className="ml-auto text-caption-md text-coliseum-text-tertiary hover:text-coliseum-text-primary transition-colors underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
