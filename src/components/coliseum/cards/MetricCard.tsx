import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

// ============================================================================
// TYPES
// ============================================================================

export interface MetricCardProps {
  title: string;
  value: number;
  format?: 'number' | 'currency' | 'percentage';
  delta?: {
    value: number;
    timeframe: string; // e.g., "vs last week", "vs last month"
  };
  sparklineData?: number[]; // Simple array of values for mini chart
  description?: string;
  icon?: React.ReactNode;
  color?: 'neon' | 'gold' | 'purple' | 'cyan';
  loading?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatMetric = (value: number, format?: 'number' | 'currency' | 'percentage'): string => {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return value.toLocaleString();
  }
};

const getColorClasses = (color?: 'neon' | 'gold' | 'purple' | 'cyan') => {
  switch (color) {
    case 'neon':
      return {
        border: 'border-coliseum-accent-neon/30',
        gradient: 'from-coliseum-accent-neon/10 to-transparent',
        icon: 'text-coliseum-accent-neon',
      };
    case 'gold':
      return {
        border: 'border-coliseum-accent-gold/30',
        gradient: 'from-coliseum-accent-gold/10 to-transparent',
        icon: 'text-coliseum-accent-gold',
      };
    case 'purple':
      return {
        border: 'border-coliseum-accent-purple/30',
        gradient: 'from-coliseum-accent-purple/10 to-transparent',
        icon: 'text-coliseum-accent-purple',
      };
    case 'cyan':
      return {
        border: 'border-coliseum-accent-cyan/30',
        gradient: 'from-coliseum-accent-cyan/10 to-transparent',
        icon: 'text-coliseum-accent-cyan',
      };
    default:
      return {
        border: 'border-coliseum-border-default',
        gradient: 'from-white/5 to-transparent',
        icon: 'text-coliseum-text-secondary',
      };
  }
};

// ============================================================================
// SPARKLINE COMPONENT
// ============================================================================

const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#00FFB3' }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  format = 'number',
  delta,
  sparklineData,
  description,
  icon,
  color,
  loading = false,
}) => {
  const colorClasses = getColorClasses(color);
  const hasDelta = delta !== undefined;
  const deltaValue = delta?.value || 0;
  const isPositive = deltaValue > 0;
  const isNegative = deltaValue < 0;

  if (loading) {
    return (
      <div className="bg-coliseum-bg-secondary border border-coliseum-border-default rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-coliseum-bg-tertiary rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-coliseum-bg-tertiary rounded w-3/4 mb-4"></div>
        <div className="h-12 bg-coliseum-bg-tertiary rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative overflow-hidden
        bg-coliseum-bg-secondary
        border ${colorClasses.border}
        rounded-lg
        p-6
        shadow-coliseum-sm
        hover:shadow-coliseum-md
        transition-all duration-coliseum-base
        group
      `}
      role="article"
      aria-label={`${title}: ${formatMetric(value, format)}`}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} opacity-50`}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header: Title + Icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-body-md text-coliseum-text-secondary font-medium">
                {title}
              </h3>
              {description && (
                <button
                  className="group/tooltip relative"
                  aria-label={description}
                  title={description}
                >
                  <QuestionMarkCircleIcon className="w-4 h-4 text-coliseum-text-tertiary hover:text-coliseum-text-secondary transition-colors" />
                </button>
              )}
            </div>
          </div>

          {icon && (
            <div className={`${colorClasses.icon}`}>
              {icon}
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <p className="text-display-lg text-coliseum-text-primary font-bold leading-none">
            {formatMetric(value, format)}
          </p>
        </div>

        {/* Delta + Sparkline */}
        <div className="space-y-3">
          {/* Delta */}
          {hasDelta && (
            <div className="flex items-center gap-2">
              {isPositive && <ArrowTrendingUpIcon className="w-4 h-4 text-coliseum-data-positive" />}
              {isNegative && <ArrowTrendingDownIcon className="w-4 h-4 text-coliseum-data-negative" />}
              {!isPositive && !isNegative && <MinusIcon className="w-4 h-4 text-coliseum-data-neutral" />}

              <span
                className={`
                  text-body-md font-semibold
                  ${isPositive ? 'text-coliseum-data-positive' : isNegative ? 'text-coliseum-data-negative' : 'text-coliseum-data-neutral'}
                `}
              >
                {isPositive && '+'}
                {deltaValue.toFixed(1)}%
              </span>

              <span className="text-caption-md text-coliseum-text-tertiary">
                {delta.timeframe}
              </span>
            </div>
          )}

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="w-full">
              <Sparkline
                data={sparklineData}
                color={color === 'neon' ? '#00FFB3' : color === 'gold' ? '#FFD700' : color === 'purple' ? '#B794F4' : '#4FD1C5'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Border */}
      <div
        className={`
          absolute inset-0
          border-2 ${colorClasses.border}
          rounded-lg
          opacity-0 group-hover:opacity-100
          transition-opacity duration-coliseum-fast
          pointer-events-none
        `}
      />
    </div>
  );
};

export default MetricCard;
