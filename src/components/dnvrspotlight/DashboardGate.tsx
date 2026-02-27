import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MetallicPaint from './MetallicPaint';
import { unlockDashboard } from './mockData';

interface DashboardGateProps {
  onUnlock: () => void;
}

const DashboardGate: React.FC<DashboardGateProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toLowerCase() === 'spotlight') {
      setIsSubmitting(true);
      setTimeout(() => {
        unlockDashboard();
        onUnlock();
      }, 300);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setError(false);
      }, 700);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #080C18 0%, #0B0F1C 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(194,24,91,0.16) 0%, transparent 58%), radial-gradient(ellipse at 72% 68%, rgba(91,45,255,0.09) 0%, transparent 45%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full"
        style={{ maxWidth: '420px', zIndex: 1 }}
      >
        {/* Card */}
        <motion.div
          animate={shaking ? { x: [-10, 10, -7, 7, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.52 }}
          style={{
            background: 'linear-gradient(160deg, rgba(15,20,42,0.96) 0%, rgba(10,14,28,0.98) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: `1px solid ${error ? 'rgba(194,24,91,0.35)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '28px',
            padding: '44px 40px',
            boxShadow: error
              ? '0 32px 80px rgba(0,0,0,0.65), 0 0 60px rgba(194,24,91,0.2), 0 0 0 1px rgba(194,24,91,0.2)'
              : '0 32px 80px rgba(0,0,0,0.65), 0 0 60px rgba(194,24,91,0.08), 0 0 0 1px rgba(194,24,91,0.1)',
            transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
          }}
        >
          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center"
            style={{
              width: 52, height: 52,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(194,24,91,0.16), rgba(91,45,255,0.08))',
              border: '1px solid rgba(194,24,91,0.28)',
              marginBottom: '28px',
              fontSize: '22px',
              boxShadow: '0 0 20px rgba(194,24,91,0.12)',
            }}
          >
            ◈
          </motion.div>

          {/* Label */}
          <div
            style={{
              fontSize: '10px', letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#C2185B',
              fontWeight: 700, marginBottom: '8px',
            }}
          >
            Organizer Access
          </div>

          <h2 style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.4px' }}>
            <MetallicPaint>Dashboard Access</MetallicPaint>
          </h2>

          <p style={{ margin: '0 0 36px', fontSize: '14px', color: 'rgba(201,204,214,0.52)', lineHeight: 1.65 }}>
            Enter the event passcode to access the organizer control surface.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter passcode"
                autoFocus
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 18px',
                  background: 'rgba(8,12,24,0.65)',
                  border: `1px solid ${
                    error
                      ? 'rgba(194,24,91,0.7)'
                      : focused
                      ? 'rgba(255,92,168,0.45)'
                      : 'rgba(201,204,214,0.14)'
                  }`,
                  borderRadius: '14px',
                  color: '#F8F9FF',
                  fontSize: '15px',
                  outline: 'none',
                  letterSpacing: '0.12em',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: focused
                    ? '0 0 0 3px rgba(255,92,168,0.1), inset 0 1px 0 rgba(255,255,255,0.04)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              />
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2"
                  style={{ fontSize: '12px', color: '#FF5CA8', letterSpacing: '0.02em' }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF5CA8', display: 'inline-block' }} />
                  Incorrect passcode. Try again.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              animate={isSubmitting ? { opacity: 0.7 } : { opacity: 1 }}
              style={{
                padding: '14px',
                background: 'linear-gradient(135deg, #C2185B, #E91E8C)',
                border: 'none',
                borderRadius: '14px',
                color: '#F8F9FF',
                fontSize: '14px', fontWeight: 600,
                cursor: isSubmitting ? 'default' : 'pointer',
                letterSpacing: '0.03em',
                boxShadow: '0 0 28px rgba(194,24,91,0.4), 0 6px 20px rgba(194,24,91,0.28)',
                marginTop: '4px',
              }}
            >
              {isSubmitting ? 'Unlocking…' : 'Unlock Dashboard'}
            </motion.button>
          </form>

          {/* Footer links */}
          <div className="flex flex-col items-center gap-2" style={{ marginTop: '24px' }}>
            <div
              style={{
                fontSize: '11px', color: 'rgba(201,204,214,0.28)',
                letterSpacing: '0.04em', textAlign: 'center',
              }}
            >
              Demo Mode — Passcode gate simulated locally
            </div>
            <motion.a
              href="/DNVRSpotlight"
              whileHover={{ color: '#C9CCD6' }}
              transition={{ duration: 0.18 }}
              style={{
                color: 'rgba(201,204,214,0.38)', fontSize: '12px',
                textDecoration: 'none', letterSpacing: '0.02em',
              }}
            >
              ← Back to Home
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DashboardGate;
