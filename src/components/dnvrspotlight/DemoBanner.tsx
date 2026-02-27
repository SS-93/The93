import React from 'react';

interface DemoBannerProps {
  message?: string;
}

const DemoBanner: React.FC<DemoBannerProps> = ({
  message = 'Demo Mode — Votes stored locally. No backend integration.'
}) => (
  <>
    {/* Bottom demo bar */}
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(8, 12, 24, 0.92)',
      borderTop: '1px solid rgba(201, 204, 214, 0.1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
    }}>
      <span style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#C2185B',
        boxShadow: '0 0 8px rgba(194, 24, 91, 0.7)',
        flexShrink: 0,
        marginRight: '10px',
      }} />
      <span style={{ color: '#C9CCD6', fontSize: '12px', letterSpacing: '0.04em' }}>
        {message}
      </span>
    </div>

    {/* Floating "Powered by Concierto" badge — bottom-right */}
    <div style={{
      position: 'fixed',
      bottom: '54px',
      right: '24px',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(8, 12, 24, 0.88)',
      border: '1px solid rgba(194, 24, 91, 0.22)',
      borderRadius: '100px',
      padding: '7px 14px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 0 14px rgba(194,24,91,0.09)',
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#C2185B',
        boxShadow: '0 0 6px rgba(194, 24, 91, 0.8)',
        display: 'inline-block',
        flexShrink: 0,
      }} />
      <span style={{
        color: 'rgba(201, 204, 214, 0.55)',
        fontSize: '11px',
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}>
        Powered by Concierto
      </span>
    </div>
  </>
);

export default DemoBanner;
