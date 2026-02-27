import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const TARGET = new Date('2027-02-22T20:00:00');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = Math.max(0, TARGET.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

// Animated digit that flips when value changes
const FlipDigit: React.FC<{ value: string }> = ({ value }) => (
  <AnimatePresence mode="popLayout">
    <motion.span
      key={value}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 16, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'inline-block',
        color: '#F8F9FF',
        fontSize: '42px',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        minWidth: '56px',
        textAlign: 'right',
        textShadow: '0 0 24px rgba(255,255,255,0.3)',
        lineHeight: 1,
        letterSpacing: '-1px',
      }}
    >
      {value}
    </motion.span>
  </AnimatePresence>
);

const CountdownStrip: React.FC = () => {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { val: time.days, label: 'd' },
    { val: time.hours, label: 'h' },
    { val: time.minutes, label: 'm' },
    { val: time.seconds, label: 's' },
  ];

  const labelStyle: React.CSSProperties = {
    color: '#f9a8d4',
    fontSize: '13px',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    fontWeight: 400,
    whiteSpace: 'nowrap',
    textShadow: '0 0 18px rgba(249,168,212,0.7), 0 0 40px rgba(249,168,212,0.35)',
  };

  const ContentBlock = () => (
    <div className="flex items-baseline" style={{ gap: '16px', flexShrink: 0 }}>
      <span style={labelStyle}>Ceremony · Feb 22, 2027</span>
      <span style={{ color: 'rgba(194,24,91,0.4)', fontSize: '13px' }}>·</span>
      <div className="flex items-baseline" style={{ gap: '4px' }}>
        {units.map(({ val, label }, i) => {
          const digitStyle = {
            display: 'inline-block' as const,
            color: '#F8F9FF',
            fontSize: '42px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums' as const,
            minWidth: '56px',
            textAlign: 'right' as const,
            textShadow: '0 0 24px rgba(255,255,255,0.3)',
            lineHeight: 1,
            letterSpacing: '-1px',
          };
          const useFlip = label === 'm' || label === 's';
          return (
            <React.Fragment key={label}>
              {i > 0 && (
                <span style={{ color: 'rgba(194,24,91,0.5)', fontSize: '36px', margin: '0 4px', lineHeight: 1, fontWeight: 300 }}>
                  :
                </span>
              )}
              <span className="flex items-baseline" style={{ gap: '4px', overflow: 'hidden' }}>
                {useFlip ? (
                  <FlipDigit value={pad(val)} />
                ) : (
                  <span style={digitStyle}>{pad(val)}</span>
                )}
                <span style={{
                  color: 'rgba(201,204,214,0.45)',
                  fontSize: '14px',
                  letterSpacing: label === 's' ? '0.2em' : '0.08em',
                  fontWeight: 500,
                  marginBottom: '4px',
                }}>
                  {label}
                </span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      style={{
        overflow: 'hidden',
        padding: '20px 48px 12px 48px',
        maxWidth: 'min(90vw, 580px)',
        background: 'linear-gradient(135deg, rgba(194,24,91,0.13) 0%, rgba(91,45,255,0.07) 100%)',
        borderTop: '1px solid rgba(194,24,91,0.28)',
        borderBottom: '1px solid rgba(194,24,91,0.28)',
        borderRadius: '24px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(194,24,91,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
      }}
    >
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          width: 'max-content',
        }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <ContentBlock />
        <ContentBlock />
      </motion.div>
    </div>
  );
};

export default CountdownStrip;
