import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import * as XLSX from 'xlsx';
import DemoBanner from './DemoBanner';
import Counter from './Counter';
import MetallicPaint from './MetallicPaint';
import { DASHBOARD_STATS, MOCK_CONTACTS, SPONSOR_TIERS, SPONSOR_GOAL, getSponsorTier } from './mockData';

// Approximate tile background color for Counter gradient masking
const TILE_BG = '#0e1126';

// ─── Dashboard Tile ──────────────────────────────────────────────────────────
interface TileProps {
  children: React.ReactNode;
  span?: 1 | 2;
  rowSpan?: 1 | 2;
  style?: React.CSSProperties;
  delay?: number;
}

const DashboardTile: React.FC<TileProps> = ({ children, span = 1, rowSpan = 1, style, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enter = () =>
      gsap.to(el, {
        boxShadow: '0 8px 40px rgba(8,12,24,0.7), 0 0 32px rgba(194,24,91,0.14)',
        duration: 0.22,
        ease: 'power2.out',
      });
    const leave = () =>
      gsap.to(el, {
        boxShadow: '0 2px 20px rgba(0,0,0,0.25)',
        duration: 0.22,
        ease: 'power2.out',
      });
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      className="dash-tile"
      whileHover={{ x: 8, y: -10, scale: 1.012 }}
      style={{
        gridColumn: span > 1 ? `span ${span}` : undefined,
        gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
        background: 'linear-gradient(160deg, rgba(15,20,42,0.95) 0%, rgba(10,14,28,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.25)',
        cursor: 'default',
        ...style,
      }}
    >
      {/* Star border — top */}
      <div
        className="animate-star-movement-top"
        style={{
          position: 'absolute', width: '300%', height: '50%',
          top: '-10px', left: '-250%',
          borderRadius: '50%', opacity: 0.6,
          background: 'radial-gradient(circle, #FF5CA8, transparent 10%)',
          animationDuration: '6s',
          pointerEvents: 'none', zIndex: 1,
        }}
      />
      {/* Star border — bottom */}
      <div
        className="animate-star-movement-bottom"
        style={{
          position: 'absolute', width: '300%', height: '50%',
          bottom: '-11px', right: '-250%',
          borderRadius: '50%', opacity: 0.6,
          background: 'radial-gradient(circle, #C2185B, transparent 10%)',
          animationDuration: '6s',
          pointerEvents: 'none', zIndex: 1,
        }}
      />
      {/* Ring trace — light comet CCW, magenta-silver */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2, overflow: 'visible' }}
      >
        {/* Silver tail — longer segment, dimmer */}
        <rect
          x="1" y="1" rx="19"
          style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1"
          strokeOpacity="0.45"
          pathLength="1"
          className="ring-trace-tail"
        />
        {/* Magenta head — shorter, bright with glow */}
        <rect
          x="1" y="1" rx="19"
          style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)', filter: 'drop-shadow(0 0 3px #C2185B) drop-shadow(0 0 6px rgba(194,24,91,0.4))' }}
          fill="none"
          stroke="#C2185B"
          strokeWidth="1.5"
          pathLength="1"
          className="ring-trace-head"
        />
      </svg>
      {/* Content — above all border effects */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        {/* Subtle inner glow accent */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {children}
      </div>
    </motion.div>
  );
};

const TileLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: '10px', letterSpacing: '0.13em',
      textTransform: 'uppercase', color: 'rgba(201,204,214,0.38)',
      fontWeight: 600, marginBottom: '14px',
    }}
  >
    {children}
  </div>
);

// Shared Counter props for large tile numbers
const tileCounterProps = (color: string, accent = false) => ({
  fontSize: 80,
  padding: 8,
  gap: 3,
  horizontalPadding: 12,
  borderRadius: 0,
  fontWeight: 700 as const,
  textColor: color,
  gradientFrom: TILE_BG,
  gradientHeight: 18,
  containerStyle: {
    background: accent
      ? 'linear-gradient(135deg, rgba(194,24,91,0.18) 0%, rgba(55,65,81,0.35) 100%)'
      : 'linear-gradient(135deg, rgba(229,231,235,0.08) 0%, rgba(75,85,99,0.22) 100%)',
    border: `1px solid ${accent ? 'rgba(194,24,91,0.3)' : 'rgba(229,231,235,0.12)'}`,
    borderRadius: '16px',
    padding: '6px 4px',
  } as React.CSSProperties,
});

// ─── Contacts Export Tile ─────────────────────────────────────────────────────
const ContactsExportTile: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const [status, setStatus] = useState<'idle' | 'preparing' | 'done'>('idle');

  const handleExport = () => {
    if (status !== 'idle') return;
    setStatus('preparing');
    setTimeout(() => {
      const ws = XLSX.utils.json_to_sheet(MOCK_CONTACTS);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
      XLSX.writeFile(wb, 'Denver_Spotlight_Awards_Contacts_Demo.xlsx');
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    }, 600);
  };

  return (
    <DashboardTile delay={delay}>
      <TileLabel>Contacts</TileLabel>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#F8F9FF', marginBottom: '6px', letterSpacing: '-0.2px' }}>
        Contact & Voter Export
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(201,204,214,0.48)', marginBottom: '20px', lineHeight: 1.6 }}>
        Download structured contact data for CRM integration, sponsor reporting, or follow-up campaigns.
      </div>

      <motion.button
        onClick={handleExport}
        disabled={status === 'preparing'}
        whileHover={status === 'idle' ? { scale: 1.02, y: -1 } : {}}
        whileTap={status === 'idle' ? { scale: 0.97 } : {}}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        style={{
          width: '100%', padding: '12px',
          background:
            status === 'done'
              ? 'rgba(194,24,91,0.12)'
              : status === 'preparing'
              ? 'rgba(194,24,91,0.5)'
              : 'linear-gradient(135deg, #C2185B, #E91E8C)',
          border: status === 'done' ? '1px solid rgba(194,24,91,0.3)' : 'none',
          borderRadius: '12px',
          color: '#F8F9FF', fontSize: '13px', fontWeight: 600,
          cursor: status === 'idle' ? 'pointer' : 'default',
          letterSpacing: '0.03em',
          boxShadow: status === 'idle' ? '0 0 20px rgba(194,24,91,0.3)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {status === 'idle' && 'Download Excel (.xlsx)'}
        {status === 'preparing' && 'Preparing export…'}
        {status === 'done' && '✓ Exported successfully'}
      </motion.button>

      <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(201,204,214,0.28)', textAlign: 'center' }}>
        Demo Mode — Contains mock data only.
      </div>

      <div
        style={{
          marginTop: '14px', padding: '12px 14px',
          background: 'rgba(8,12,24,0.55)',
          border: '1px solid rgba(201,204,214,0.06)',
          borderRadius: '10px',
          fontSize: '11px', color: 'rgba(201,204,214,0.32)', lineHeight: 1.65,
        }}
      >
        Future: Real-time export · SMS capture · QR attribution · MediaID linking
      </div>
    </DashboardTile>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const OrganizerDashboard: React.FC = () => {
  const [liveVotes, setLiveVotes] = useState(DASHBOARD_STATS.totalVotes);
  const [hoveredCap, setHoveredCap] = useState<string | null>(null);
  const capCloseTimer = useRef<number | null>(null);

  const openCap = (label: string) => {
    if (capCloseTimer.current) { clearTimeout(capCloseTimer.current); capCloseTimer.current = null; }
    setHoveredCap(label);
  };
  const scheduleCap = () => {
    capCloseTimer.current = window.setTimeout(() => setHoveredCap(null), 200);
  };
  const cancelCap = () => {
    if (capCloseTimer.current) { clearTimeout(capCloseTimer.current); capCloseTimer.current = null; }
  };

  useEffect(() => {
    const id = setInterval(() => {
      setLiveVotes((v) => v + Math.floor(Math.random() * 4) + 1);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#080C18',
        color: '#F8F9FF',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      {/* Subtle background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 15% 15%, rgba(194,24,91,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(91,45,255,0.05) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sticky top-0 flex items-center justify-between"
        style={{
          padding: '18px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(8,12,24,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 10,
          boxShadow: '0 1px 0 rgba(194,24,91,0.07)',
        }}
      >
        <div className="flex items-center gap-5">
          <motion.a
            href="/DNVRSpotlight"
            whileHover={{ color: '#C9CCD6', x: -2 }}
            transition={{ duration: 0.18 }}
            style={{ color: 'rgba(201,204,214,0.4)', fontSize: '13px', textDecoration: 'none' }}
          >
            ← Home
          </motion.a>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <MetallicPaint style={{ fontSize: '15px', fontWeight: 600 }}>Organizer Dashboard</MetallicPaint>
            <span style={{ color: 'rgba(201,204,214,0.32)', fontSize: '12px', marginLeft: '10px' }}>
              Denver Spotlight Awards 2026
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#C2185B', display: 'inline-block',
              boxShadow: '0 0 10px rgba(194,24,91,0.9)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: '12px', color: '#FF5CA8', fontWeight: 500 }}>Live Demo</span>
        </div>
      </motion.div>

      {/* Tile grid */}
      <div
        className="relative mx-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          padding: '28px 32px 100px',
          maxWidth: '1400px',
          zIndex: 1,
        }}
      >
        {/* 1. Overview span-2 */}
        <DashboardTile span={2} delay={0.05}>
          <TileLabel>Overview</TileLabel>
          <div className="flex items-baseline gap-2">
            <Counter value={liveVotes} places={[1000, 100, 10, 1]} {...tileCounterProps('#F8F9FF')} />
            <span style={{ fontSize: '13px', color: 'rgba(201,204,214,0.42)', fontWeight: 400 }}>total votes</span>
          </div>
          <div className="flex gap-6 mt-4">
            {[
              { label: 'Event', val: 'Feb 22, 2027' },
              { label: 'Categories', val: `${DASHBOARD_STATS.categoriesActive} Active` },
              { label: 'Top Category', val: DASHBOARD_STATS.topCategory, accent: true },
            ].map(({ label, val, accent }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: 'rgba(201,204,214,0.38)', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: accent ? '#FF5CA8' : '#F8F9FF', fontWeight: accent ? 500 : 400 }}>{val}</div>
              </div>
            ))}
          </div>
        </DashboardTile>

        {/* 2. Live Votes */}
        <DashboardTile delay={0.08}>
          <TileLabel>Live Votes</TileLabel>
          <Counter value={liveVotes} places={[1000, 100, 10, 1]} {...tileCounterProps('#FF5CA8', true)} />
          <div className="flex items-center gap-1.5 mt-2">
            <span style={{ color: '#C2185B', fontSize: '13px' }}>↑</span>
            <span style={{ fontSize: '12px', color: 'rgba(201,204,214,0.45)' }}>
              {DASHBOARD_STATS.votesLastHour} in last hour
            </span>
          </div>
        </DashboardTile>

        {/* 3. Vote Velocity */}
        <DashboardTile delay={0.11}>
          <TileLabel>Vote Velocity</TileLabel>
          <div className="flex gap-0.5 items-end" style={{ height: '52px', marginBottom: '10px' }}>
            {[40, 65, 45, 80, 55, 90, 70, 85, 95, 75].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 + i * 0.03 }}
                style={{
                  flex: 1,
                  background:
                    i === 9
                      ? '#C2185B'
                      : `rgba(194,24,91,${0.18 + i * 0.07})`,
                  borderRadius: '3px',
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(201,204,214,0.36)' }}>Votes / hour (simulated)</div>
        </DashboardTile>

        {/* 4. Category Completion span-2 rowspan-2 */}
        <DashboardTile span={2} rowSpan={2} delay={0.14}>
          <TileLabel>Category Completion</TileLabel>
          <div className="flex flex-col gap-4 mt-1">
            {DASHBOARD_STATS.categoryCompletion.map((cat, i) => (
              <div key={cat.name}>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: '12px', color: '#C9CCD6' }}>{cat.name}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(201,204,214,0.45)' }}>{cat.pct}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(201,204,214,0.07)', borderRadius: 6 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 + i * 0.07 }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #C2185B, #E91E8C)',
                      borderRadius: 6,
                      boxShadow: '0 0 8px rgba(194,24,91,0.4)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '22px', padding: '14px 16px',
              background: 'rgba(194,24,91,0.07)',
              border: '1px solid rgba(194,24,91,0.14)',
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'rgba(201,204,214,0.38)', marginBottom: '5px' }}>Overall Completion</div>
            <div className="flex items-baseline gap-1">
              <Counter
                value={DASHBOARD_STATS.avgCompletionRate}
                places={[10, 1]}
                {...tileCounterProps('#FF5CA8', true)}
                fontSize={56}
                padding={6}
                gradientHeight={14}
              />
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#FF5CA8', lineHeight: 1 }}>%</span>
            </div>
          </div>
        </DashboardTile>

        {/* 5. Leaderboard */}
        <DashboardTile delay={0.17}>
          <TileLabel>Leaderboard</TileLabel>
          <div className="flex flex-col gap-3 mt-1">
            {[
              { name: 'Marcus Delray', pct: 42 },
              { name: 'Sofia Vega', pct: 31 },
              { name: 'Amara Jones', pct: 27 },
            ].map((a, i) => (
              <motion.div
                key={a.name}
                initial="rest"
                whileHover="hover"
                variants={{
                  rest: { x: 0, y: 0, scale: 1, transition: { duration: 0.22, ease: 'easeOut' as const } },
                  hover: { x: 16, y: -3, scale: 1.03, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
                }}
                className="flex items-center gap-2"
                style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', padding: '2px 0' }}
              >
                {/* Shimmer sweep */}
                <motion.div
                  variants={{
                    rest: { x: '-120%', transition: { duration: 0.01 } },
                    hover: { x: '280%', transition: { duration: 0.45, ease: 'easeOut' as const } },
                  }}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '45%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,92,168,0.07), transparent)',
                    pointerEvents: 'none', transform: 'skewX(-15deg)',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'rgba(201,204,214,0.28)', width: 14, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <motion.span
                  variants={{
                    rest: { color: '#C9CCD6' },
                    hover: { color: '#F8F9FF', transition: { duration: 0.2 } },
                  }}
                  style={{ fontSize: '12px', flex: 1 }}
                >
                  {a.name}
                </motion.span>
                <span className="flex items-baseline" style={{ gap: '1px' }}>
                  <Counter
                    value={a.pct}
                    places={[10, 1]}
                    fontSize={13}
                    padding={2}
                    gap={0}
                    horizontalPadding={0}
                    borderRadius={0}
                    fontWeight={600}
                    textColor="#FF5CA8"
                    gradientFrom={TILE_BG}
                    gradientHeight={6}
                  />
                  <span style={{ fontSize: '11px', color: '#FF5CA8', fontWeight: 600 }}>%</span>
                </span>
              </motion.div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(201,204,214,0.22)', marginTop: '12px' }}>
            Artist of the Year · Mock data
          </div>
        </DashboardTile>

        {/* 6. Sponsors */}
        <DashboardTile delay={0.2}>
          <TileLabel>Sponsors</TileLabel>
          <div className="flex flex-col gap-2 mt-1">
            {DASHBOARD_STATS.sponsors.slice(0, 5).map((s) => {
              const tier = getSponsorTier(s.amount);
              const tierCfg = SPONSOR_TIERS[tier];
              return (
                <motion.div
                  key={s.name}
                  whileHover={{ x: 14, y: -3, borderColor: 'rgba(194,24,91,0.25)' }}
                  transition={{ duration: 0.15 }}
                  style={{
                    padding: '9px 12px',
                    background: 'rgba(8,12,24,0.55)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    fontSize: '12px', color: 'rgba(201,204,214,0.55)',
                    cursor: 'default',
                    transition: 'border-color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    title={tierCfg.label}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: tierCfg.color,
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${tierCfg.color}88`,
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>{s.name}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(201,204,214,0.4)', flexShrink: 0 }}>${s.amount.toLocaleString()}</span>
                </motion.div>
              );
            })}
          </div>
          {(() => {
            const totalEarned = DASHBOARD_STATS.sponsors.reduce((sum, s) => sum + s.amount, 0);
            const pct = Math.min(100, Math.round((totalEarned / SPONSOR_GOAL) * 100));
            return (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 12px',
                  background: 'rgba(8,12,24,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: 'rgba(201,204,214,0.5)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span>Total earned vs goal</span>
                  <span style={{ fontWeight: 600, color: '#F8F9FF' }}>
                    ${totalEarned.toLocaleString()} / ${SPONSOR_GOAL.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(201,204,214,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #C2185B, #FF5CA8)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            );
          })()}
        </DashboardTile>

        {/* 7. Contacts Export */}
        <ContactsExportTile delay={0.23} />

        {/* 8. Team Access */}
        <DashboardTile delay={0.26}>
          <TileLabel>Team Access</TileLabel>
          <div className="flex flex-col gap-3 mt-1">
            {DASHBOARD_STATS.teamMembers.map((m) => (
              <motion.div
                key={m.name}
                whileHover={{ x: 16, y: -3, scale: 1.02 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center gap-3"
              >
                <div
                  style={{
                    width: 30, height: 30, borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(194,24,91,0.16), rgba(91,45,255,0.08))',
                    border: '1px solid rgba(194,24,91,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: '#FF5CA8', fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {m.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#F8F9FF', lineHeight: 1.2 }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(201,204,214,0.38)' }}>{m.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </DashboardTile>

        {/* 9. Settings & Future Capabilities span-2 */}
        <DashboardTile span={2} delay={0.29}>
          <TileLabel>Settings &amp; Future Capabilities</TileLabel>
          <div className="flex flex-wrap gap-2">
            {[
              'Real-Time Vote Export', 'SMS Capture', 'QR Check-In Attribution',
              'Sponsor Segmentation', 'MediaID Identity Linking', 'CAE Analytics Feed',
              'Ticketing Integration', 'Multi-Event Support',
            ].map((cap, i) => (
              <motion.span
                key={cap}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.3 + i * 0.04 }}
                whileHover={{ scale: 1.05, x: 5, y: -3 }}
                style={{
                  padding: '5px 13px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '100px',
                  fontSize: '11px', color: 'rgba(201,204,214,0.42)',
                  letterSpacing: '0.03em', cursor: 'pointer',
                  transition: 'border-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(194,24,91,0.35)';
                  (e.currentTarget as HTMLSpanElement).style.color = 'rgba(255,92,168,0.85)';
                  openCap(cap);
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLSpanElement).style.color = 'rgba(201,204,214,0.42)';
                  scheduleCap();
                }}
              >
                {cap}
              </motion.span>
            ))}
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(201,204,214,0.28)' }}>
            Concierto Event Operating System — Powered by Buckets
          </div>
        </DashboardTile>
      </div>

      <DemoBanner />

      {/* Capability tooltip — slides in from right */}
      {typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <AnimatePresence>
          {hoveredCap && (
            <motion.div
              key={hoveredCap}
              initial={{ x: '110%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '110%', opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={cancelCap}
              onMouseLeave={scheduleCap}
              style={{
                position: 'fixed', right: 24, bottom: 90, zIndex: 99999,
                width: 272, padding: '20px 22px',
                background: 'rgba(12,15,30,0.72)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.11)',
                borderRadius: '18px',
                boxShadow: '0 20px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Gloss highlight */}
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                borderRadius: '1px',
              }} />
              {/* Notch */}
              <div style={{
                position: 'absolute', right: -5, top: 22,
                width: 10, height: 10,
                background: 'rgba(12,15,30,0.85)',
                border: '1px solid rgba(255,255,255,0.11)',
                borderLeft: 'none', borderBottom: 'none',
                transform: 'rotate(45deg)',
              }} />
              <div style={{ fontSize: '18px', marginBottom: '10px', opacity: 0.7 }}>◈</div>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5CA8', fontWeight: 600, marginBottom: '6px' }}>
                {hoveredCap}
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#F8F9FF', lineHeight: 1.5 }}>
                Unlock to Learn More
              </p>
              <p style={{ margin: '0 0 14px', fontSize: '11px', color: 'rgba(201,204,214,0.55)', lineHeight: 1.65 }}>
                This capability is available on the full Concierto Event Operating System.
              </p>
              <div style={{
                padding: '8px 12px',
                background: 'rgba(194,24,91,0.08)',
                border: '1px solid rgba(194,24,91,0.18)',
                borderRadius: '10px',
                fontSize: '11px', color: 'rgba(255,92,168,0.75)',
                letterSpacing: '0.02em',
              }}>
                Available with Concierto Pro ↗
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .ring-trace-tail,
        .ring-trace-head {
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .ring-trace-tail {
          stroke-dasharray: 0.18 0.82;
          stroke-dashoffset: 0;
          animation: trace-ccw 24s linear infinite;
        }
        .ring-trace-head {
          stroke-dasharray: 0.06 0.94;
          stroke-dashoffset: 0;
          animation: trace-ccw 24s linear infinite;
        }
        .dash-tile:hover .ring-trace-tail,
        .dash-tile:hover .ring-trace-head {
          opacity: 1;
        }
        @keyframes trace-ccw {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -1; }
        }
      `}</style>
    </div>
  );
};

export default OrganizerDashboard;
