import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Nominee } from './mockData';

interface TradingCardProps {
  nominee: Nominee | null;
  onClose: () => void;
}

const TAG_COLORS = [
  { bg: 'rgba(194,24,91,0.10)', border: 'rgba(194,24,91,0.30)', color: '#FFD6E8' },
  { bg: 'rgba(91,45,255,0.08)', border: 'rgba(91,45,255,0.25)', color: '#C4B5FD' },
  { bg: 'rgba(201,204,214,0.05)', border: 'rgba(201,204,214,0.12)', color: 'rgba(201,204,214,0.6)' },
];

const TradingCard: React.FC<TradingCardProps> = ({ nominee, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springCfg = { stiffness: 180, damping: 22 };
  const rotateX = useSpring(useTransform(mouseY, [-130, 130], [7, -7]), springCfg);
  const rotateY = useSpring(useTransform(mouseX, [-130, 130], [-7, 7]), springCfg);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined' || !document.body) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {nominee && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 99990,
              background: 'rgba(4,6,16,0.78)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Card wrapper — centred */}
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 99991,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px', pointerEvents: 'none',
            }}
          >
            {/* Perspective shell */}
            <motion.div
              key="tc-card"
              initial={{ scale: 0.86, opacity: 0, y: 28 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.86, opacity: 0, y: 28 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              style={{ perspective: '1000px', pointerEvents: 'auto' }}
            >
              {/* Tilting card */}
              <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  rotateX, rotateY,
                  transformStyle: 'preserve-3d',
                  width: 340,
                  maxHeight: '88vh',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  background: 'linear-gradient(160deg, #0e1221 0%, #080c18 60%, #0a0e1c 100%)',
                  border: '1px solid rgba(194,24,91,0.22)',
                  boxShadow:
                    '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(194,24,91,0.14)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'default',
                }}
              >
                {/* ── Holographic shimmer sweep ── */}
                <motion.div
                  animate={{ x: ['-150%', '350%'] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, zIndex: 10,
                    width: '40%', height: '100%',
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,180,220,0.07), rgba(200,180,255,0.10), rgba(180,220,255,0.07), transparent)',
                    transform: 'skewX(-12deg)',
                    pointerEvents: 'none',
                  }}
                />

                {/* ── Header image ── */}
                <div style={{ position: 'relative', height: 200, flexShrink: 0, overflow: 'hidden' }}>
                  {nominee.image ? (
                    <img
                      src={nominee.image.replace('w=600&h=300', 'w=680&h=400')}
                      alt={nominee.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, rgba(194,24,91,0.3) 0%, rgba(91,45,255,0.2) 100%)',
                      }}
                    />
                  )}

                  {/* gradient overlay */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      background:
                        'linear-gradient(to bottom, rgba(8,12,24,0.10) 0%, rgba(8,12,24,0.35) 55%, rgba(8,12,24,0.94) 100%)',
                    }}
                  />

                  {/* MediaID badge */}
                  <div
                    style={{
                      position: 'absolute', top: 12, left: 14, zIndex: 2,
                      padding: '3px 10px',
                      background: 'rgba(194,24,91,0.18)',
                      border: '1px solid rgba(194,24,91,0.38)',
                      borderRadius: '100px',
                      fontSize: '9px', letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#FFD6E8', fontWeight: 600,
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    MediaID Card
                  </div>

                  {/* Close button */}
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.12, background: 'rgba(194,24,91,0.45)' }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      position: 'absolute', top: 10, right: 12, zIndex: 2,
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.45)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      backdropFilter: 'blur(8px)',
                      color: 'rgba(255,255,255,0.82)',
                      fontSize: '15px', fontWeight: 400,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </motion.button>
                </div>

                {/* ── Scrollable body ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 24px' }}>

                  {/* Name + subtitle */}
                  <div style={{ marginBottom: '16px' }}>
                    <h3
                      style={{
                        margin: '0 0 5px',
                        fontSize: '21px', fontWeight: 700,
                        color: '#F8F9FF', letterSpacing: '-0.4px', lineHeight: 1.15,
                      }}
                    >
                      {nominee.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(201,204,214,0.52)', letterSpacing: '0.01em' }}>
                      {nominee.subtitle}
                    </p>
                  </div>

                  {/* Bio */}
                  {nominee.bio && (
                    <div style={{ marginBottom: '18px' }}>
                      <div
                        style={{
                          fontSize: '9.5px', letterSpacing: '0.14em',
                          textTransform: 'uppercase', color: 'rgba(201,204,214,0.28)',
                          fontWeight: 600, marginBottom: '7px',
                        }}
                      >
                        About
                      </div>
                      <p
                        style={{
                          margin: 0, fontSize: '13px', lineHeight: 1.66,
                          color: 'rgba(229,231,235,0.68)',
                        }}
                      >
                        {nominee.bio}
                      </p>
                    </div>
                  )}

                  {/* MediaID Tags */}
                  {nominee.mediaTags && nominee.mediaTags.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div
                        style={{
                          fontSize: '9.5px', letterSpacing: '0.14em',
                          textTransform: 'uppercase', color: 'rgba(201,204,214,0.28)',
                          fontWeight: 600, marginBottom: '9px',
                          display: 'flex', alignItems: 'center', gap: '5px',
                        }}
                      >
                        <span style={{ color: 'rgba(194,24,91,0.65)' }}>◈</span> MediaID
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {nominee.mediaTags.map((tag, i) => {
                          const c = TAG_COLORS[i % TAG_COLORS.length];
                          return (
                            <span
                              key={i}
                              style={{
                                padding: '4px 10px',
                                background: c.bg,
                                border: `1px solid ${c.border}`,
                                borderRadius: '100px',
                                fontSize: '11px',
                                color: c.color,
                                letterSpacing: '0.02em',
                                fontWeight: 500,
                              }}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inverted Link Tree */}
                  {nominee.links && nominee.links.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '9.5px', letterSpacing: '0.14em',
                          textTransform: 'uppercase', color: 'rgba(201,204,214,0.28)',
                          fontWeight: 600, marginBottom: '9px',
                        }}
                      >
                        Listen &amp; Follow
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {nominee.links.map((link, i) => (
                          <motion.a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{
                              x: 3,
                              borderColor: 'rgba(194,24,91,0.28)',
                              background: 'rgba(194,24,91,0.055)',
                            }}
                            transition={{ duration: 0.14 }}
                            style={{
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 13px',
                              background: 'rgba(255,255,255,0.028)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: '12px',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontSize: '13px', color: 'rgba(201,204,214,0.4)',
                                  width: 16, textAlign: 'center' as const, flexShrink: 0,
                                }}
                              >
                                {link.icon}
                              </span>
                              <span
                                style={{
                                  fontSize: '13px', color: 'rgba(229,231,235,0.72)',
                                  fontWeight: 500,
                                }}
                              >
                                {link.label}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'rgba(201,204,214,0.28)' }}>↗</span>
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default TradingCard;
