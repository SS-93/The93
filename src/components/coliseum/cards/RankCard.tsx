import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/outline';

// ============================================================================
// TYPES
// ============================================================================

export interface RankCardProps {
  rank: number;
  movement: 'up' | 'down' | 'new' | 'same' | number;
  thumbnail?: string;
  title: string;
  subtitle: string;
  location?: string;
  primaryMetric: {
    label: string;
    value: number;
    format?: 'number' | 'currency' | 'percentage';
  };
  delta?: {
    value: number;
    format?: 'number' | 'percentage';
  };
  badges?: Array<{
    text: string;
    color: 'neon' | 'gold' | 'purple';
  }>;
  onClick?: () => void;
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

const getRankDisplay = (rank: number): string => {
  if (rank === 1) return '🏆';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const getMovementIcon = (movement: 'up' | 'down' | 'new' | 'same' | number) => {
  if (movement === 'new') {
    return <SparklesIcon className="w-4 h-4 text-coliseum-accent-neon" />;
  }
  if (movement === 'same' || movement === 0) {
    return <MinusIcon className="w-4 h-4 text-coliseum-data-neutral" />;
  }
  const isUp = movement === 'up' || (typeof movement === 'number' && movement > 0);
  return isUp ? (
    <ArrowTrendingUpIcon className="w-4 h-4 text-coliseum-data-positive" />
  ) : (
    <ArrowTrendingDownIcon className="w-4 h-4 text-coliseum-data-negative" />
  );
};

const getMovementText = (movement: 'up' | 'down' | 'new' | 'same' | number): string => {
  if (movement === 'new') return 'NEW';
  if (movement === 'same') return '—';
  if (typeof movement === 'number') {
    return movement > 0 ? `+${movement}` : `${movement}`;
  }
  return movement === 'up' ? '↑' : '↓';
};

const getBadgeColors = (color: 'neon' | 'gold' | 'purple') => {
  switch (color) {
    case 'neon':
      return 'bg-coliseum-accent-neon/10 text-coliseum-accent-neon border-coliseum-accent-neon/30';
    case 'gold':
      return 'bg-coliseum-accent-gold/10 text-coliseum-accent-gold border-coliseum-accent-gold/30';
    case 'purple':
      return 'bg-coliseum-accent-purple/10 text-coliseum-accent-purple border-coliseum-accent-purple/30';
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export const RankCard: React.FC<RankCardProps> = ({
  rank,
  movement,
  thumbnail,
  title,
  subtitle,
  location,
  primaryMetric,
  delta,
  badges,
  onClick,
}) => {
  const isTopThree = rank <= 3;
  const hasMovement = movement !== 'same' && movement !== 0;

  return (
    <div
      onClick={onClick}
      className={`
        group relative
        bg-coliseum-bg-secondary
        border border-coliseum-border-default
        rounded-lg
        p-4
        transition-all duration-coliseum-base
        ${onClick ? 'cursor-pointer hover:bg-coliseum-bg-tertiary hover:border-coliseum-border-hover' : ''}
        ${isTopThree ? 'shadow-coliseum-gold' : 'shadow-coliseum-sm'}
        hover:shadow-coliseum-md
      `}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${title} ranked ${rank}, ${subtitle}`}
    >
      {/* Top Row: Rank + Movement + Badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div
            className={`
              flex items-center justify-center
              w-12 h-12
              rounded-lg
              font-bold text-lg
              ${isTopThree ? 'bg-coliseum-accent-gold/20 text-coliseum-accent-gold' : 'bg-coliseum-bg-tertiary text-coliseum-text-secondary'}
            `}
          >
            {getRankDisplay(rank)}
          </div>

          {/* Movement Indicator */}
          {hasMovement && (
            <div className="flex items-center gap-1">
              {getMovementIcon(movement)}
              <span className="text-caption-md text-coliseum-text-tertiary">
                {getMovementText(movement)}
              </span>
            </div>
          )}
        </div>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="flex gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`
                  px-2 py-1
                  text-ui-sm
                  rounded-full
                  border
                  ${getBadgeColors(badge.color)}
                `}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Row: Thumbnail + Info */}
      <div className="flex items-center gap-4 mb-3">
        {/* Thumbnail */}
        {thumbnail && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-coliseum-bg-tertiary">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-heading-sm text-coliseum-text-primary font-semibold truncate mb-1">
            {title}
          </h3>
          <p className="text-body-md text-coliseum-text-secondary truncate">
            {subtitle}
          </p>
          {location && (
            <p className="text-caption-md text-coliseum-text-tertiary mt-1">
              📍 {location}
            </p>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between pt-3 border-t border-coliseum-border-default">
        {/* Primary Metric */}
        <div>
          <p className="text-caption-md text-coliseum-text-tertiary mb-1">
            {primaryMetric.label}
          </p>
          <p className="text-heading-md text-coliseum-text-primary font-bold">
            {formatMetric(primaryMetric.value, primaryMetric.format)}
          </p>
        </div>

        {/* Delta (Change) */}
        {delta && (
          <div className="text-right">
            <p className="text-caption-md text-coliseum-text-tertiary mb-1">Change</p>
            <p
              className={`
                text-body-lg font-semibold
                ${delta.value > 0 ? 'text-coliseum-data-positive' : delta.value < 0 ? 'text-coliseum-data-negative' : 'text-coliseum-data-neutral'}
              `}
            >
              {delta.value > 0 && '+'}
              {formatMetric(delta.value, delta.format)}
            </p>
          </div>
        )}
      </div>

      {/* Hover Indicator */}
      {onClick && (
        <div className="absolute inset-0 border-2 border-coliseum-accent-neon rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-coliseum-fast pointer-events-none" />
      )}
    </div>
  );
};

export default RankCard;
