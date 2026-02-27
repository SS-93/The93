import React from 'react';

/**
 * Metallic Paint — React Bits–style text gradient for a chrome/brushed metal look.
 * Wraps text; preserves font size, positioning, and spacing.
 */
export interface MetallicPaintProps {
  children: React.ReactNode;
  /** Optional gradient override for custom metallic colors */
  gradient?: string;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

const DEFAULT_GRADIENT =
  'linear-gradient(180deg, #FFF 0%, #E8EAEF 22%, #C9CCD6 50%, #E8EAEF 78%, #F8F9FF 100%)';

export default function MetallicPaint({
  children,
  gradient = DEFAULT_GRADIENT,
  className = '',
  style = {},
  as: Component = 'span',
}: MetallicPaintProps) {
  return (
    <Component
      className={className}
      style={{
        background: gradient,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
