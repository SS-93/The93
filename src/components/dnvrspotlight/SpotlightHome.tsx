import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import CountdownStrip from './CountdownStrip';
import DemoBanner from './DemoBanner';
import PixelCard from './PixelCard';
import MetallicPaint from './MetallicPaint';
import { GridScan } from './GridScan';

const STEPS = [
  {
    num: '01',
    icon: '◈',
    title: 'Browse Categories',
    body: "Five award categories covering Denver's full cultural spectrum — artists, DJs, venues, and live performances.",
  },
  {
    num: '02',
    icon: '◉',
    title: 'Cast Your Votes',
    body: 'One vote per category. Your selections are saved locally and reviewed before submission.',
  },
  {
    num: '03',
    icon: '◎',
    title: 'Results Go Live',
    body: 'Organizers monitor votes in real time through the Concierto dashboard. Results revealed at the ceremony.',
  },
];

const INFRA_TAGS: { label: string; description: string; detail: string; source: string }[] = [
  {
    label: 'Vote Routing',
    description: 'Secure, validated vote capture with integrity checks.',
    detail: 'Votes tracked in `event_votes` table. Logs as `concierto.vote_cast` with event_id, artist_id, voter_id, vote_value. Vote limits enforced via `max_votes_per_participant`. Multiple interfaces: card-based, SMS-style, streamlined. Routes to Coliseum for leaderboard metrics.',
    source: 'CONCIERTO_PLANNING_REVIEW',
  },
  {
    label: 'Real-Time Analytics',
    description: 'Live dashboards tracking vote counts and trends.',
    detail: 'Coliseum emits `coliseum.metric_tracked` for event.vote_cast, event.ticket_sold, event.attendance. Leaderboards: event_artists rankings, top_events by revenue/attendance. Event metrics update from Passport events. HostAdminDashboard for host analytics.',
    source: 'CONCIERTO_PLANNING_REVIEW',
  },
  {
    label: 'Organizer Dashboard',
    description: 'Centralized control for event admins and moderators.',
    detail: 'EventDashboard for host management (`/events/manage/:eventId`). HostAdminDashboard for analytics. Status flow: draft → published → live → completed. Shareable codes, artist registration tokens, audience RSVP management.',
    source: 'CONCIERTO_PLANNING_REVIEW',
  },
  {
    label: 'Data Export',
    description: 'Export results to CSV, PDF, or API for integration.',
    detail: 'EventResults display. Transaction history (Treasury). Post-event analytics dashboard. Coliseum leaderboard export. Passport Travel History for audit. Event completion reports with total_attendance, total_revenue, final_results.',
    source: 'CONCIERTO_PLANNING_REVIEW',
  },
];

const TOUR_STEPS = [
  {
    step: '01',
    icon: '◈',
    accent: '#FF5CA8',
    label: 'Begin Voting',
    title: 'Cast Your Vote',
    body: "Browse five award categories covering Denver's cultural spectrum. Each nominee has a profile card — hover to preview, then cast your one vote per category.",
    href: '/DNVRSpotlight/vote',
    cta: 'Start Voting',
  },
  {
    step: '02',
    icon: '◉',
    accent: '#9CA3AF',
    label: 'Hall of Fame',
    title: 'Explore Past Honorees',
    body: "Browse the gallery of Denver Spotlight alumni. Click and drag to scroll through the lineup. Tap ↗ on any card to view the artist's full story.",
    href: '/DNVRSpotlight/HallofFame',
    cta: 'Visit Hall of Fame',
  },
  {
    step: '03',
    icon: '◎',
    accent: '#C2185B',
    label: 'Dashboard',
    title: 'Organizer Controls',
    body: "Real-time vote tracking, analytics, and moderation tools for event hosts. Monitor live results, manage nominees, and export final data.",
    href: '/DNVRSpotlight/dashboard',
    cta: 'Open Dashboard',
  },
];

// ─── Sticky Nav ──────────────────────────────────────────────────────────────
const StickyNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '62px',
        background: scrolled
          ? 'rgba(8,12,24,0.92)'
          : 'rgba(8,12,24,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Logo */}
      <a
        href="/DNVRSpotlight"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#C2185B',
            display: 'inline-block',
            boxShadow: '0 0 8px rgba(194,24,91,0.8)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#F8F9FF',
            whiteSpace: 'nowrap',
          }}
        >
          Denver Spotlight
        </span>
      </a>

      {/* Center links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { label: 'Begin Voting', href: '/DNVRSpotlight/vote' },
          { label: 'Hall of Fame', href: '/DNVRSpotlight/HallofFame' },
          { label: 'Dashboard', href: '/DNVRSpotlight/dashboard' },
        ].map((link) => (
          <motion.a
            key={link.label}
            href={link.href}
            whileHover={{ color: '#FFD6E8' }}
            transition={{ duration: 0.15 }}
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              color: 'rgba(201,204,214,0.6)',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              letterSpacing: '0.01em',
              background: 'transparent',
              transition: 'background 0.18s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            }}
          >
            {link.label}
          </motion.a>
        ))}
      </div>

      {/* CTA — Vote Now with pixel effect */}
      <div style={{ display: 'inline-block' }}>
        <PixelCard variant="pink" gap={5} speed={65} colors="#FFD6E8,#FF5CA8,#C2185B" noFocus className="pixel-nominee-btn">
        <motion.a
          href="/DNVRSpotlight/vote"
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            display: 'block',
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #C2185B, #E91E8C)',
            borderRadius: '12px',
            color: '#F8F9FF',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '0.02em',
            boxShadow: '0 0 20px rgba(194,24,91,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          Vote Now
        </motion.a>
        </PixelCard>
      </div>
    </motion.nav>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const SpotlightHome: React.FC = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [infraExpanded, setInfraExpanded] = useState(true);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const tourDir = React.useRef<1 | -1>(1);

  const openTag = (label: string) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setHoveredTag(label);
  };
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setHoveredTag(null), 250);
  };
  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  useEffect(() => {
    if (!hoveredTag) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHoveredTag(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hoveredTag]);

  useEffect(() => {
    if (!showTour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTour(false);
      if (e.key === 'ArrowRight') { tourDir.current = 1; setTourStep(s => Math.min(s + 1, TOUR_STEPS.length - 1)); }
      if (e.key === 'ArrowLeft') { tourDir.current = -1; setTourStep(s => Math.max(s - 1, 0)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showTour]);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: '#080C18',
        color: '#F8F9FF',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      {/* ── HERO SECTION with GridScan background ───────────────── */}
      <section className="relative" style={{ minHeight: '100vh' }}>
        {/* GridScan layer — fills hero section */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <GridScan
            sensitivity={0.55}
            lineThickness={1}
            linesColor="#392e4e"
            gridScale={0.1}
            scanColor="#FF9FFC"
            scanOpacity={0.4}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
          />
        </div>

        {/* Readability overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background:
              'linear-gradient(180deg, rgba(8,12,24,0.72) 0%, rgba(8,12,24,0.35) 45%, rgba(8,12,24,0.88) 100%)',
          }}
        />

        {/* Radial color glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background:
              'radial-gradient(ellipse at 15% 25%, rgba(194,24,91,0.22) 0%, transparent 52%), radial-gradient(ellipse at 80% 18%, rgba(91,45,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 65%, rgba(255,92,168,0.06) 0%, transparent 45%)',
          }}
        />

        {/* Content */}
        <div className="relative" style={{ zIndex: 2 }}>
          <StickyNav />

          <div className="max-w-4xl mx-auto px-8" style={{ paddingTop: '160px', paddingBottom: '100px' }}>
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              style={{
                margin: '0 0 18px',
                fontSize: 'clamp(44px, 6.5vw, 76px)',
                fontWeight: 700,
                letterSpacing: '-2px',
                lineHeight: 1.03,
              }}
            >
              <MetallicPaint style={{ display: 'block' }}>Denver Spotlight</MetallicPaint>
              <MetallicPaint gradient="linear-gradient(180deg, #FFD6E8 0%, #FF5CA8 35%, #C2185B 50%, #FF5CA8 65%, #FFD6E8 100%)" style={{ display: 'block' }}>Awards</MetallicPaint>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.32 }}
              style={{
                margin: '0 0 40px',
                fontSize: '18px',
                color: 'rgba(201,204,214,0.72)',
                maxWidth: '500px',
                lineHeight: 1.65,
                fontWeight: 400,
              }}
            >
              Denver's cultural recognition platform — vote for the artists, DJs, and venues that defined the scene.
            </motion.p>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.42 }}
              style={{ margin: '0 0 40px', display: 'flex', justifyContent: 'center' }}
            >
              <CountdownStrip />
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.58 }}
              style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <PixelCard variant="pink" className="pixel-btn-lg">
                  <a
                    href="/DNVRSpotlight/vote"
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      color: '#F8F9FF', fontSize: '18px', fontWeight: 700,
                      letterSpacing: '0.01em', textDecoration: 'none', zIndex: 1,
                    }}
                  >
                    Begin Voting ↗
                  </a>
                </PixelCard>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <PixelCard variant="blue" className="pixel-btn-md">
                  <a
                    href="/DNVRSpotlight/HallofFame"
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      color: '#e0f2fe', fontSize: '18px', fontWeight: 600,
                      letterSpacing: '0.01em', textDecoration: 'none', zIndex: 1,
                    }}
                  >
                    Hall of Fame
                  </a>
                </PixelCard>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(201,204,214,0.35)', fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          How It Works
        </motion.div>

        {/* Step cards — separate organic cards with hover lift */}
        <div className="grid grid-cols-3 gap-4" style={{ padding: '0 6.25%' }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.08 }}
              whileHover={{ x: 12, y: -8, scale: 1.02 }}
              onHoverStart={() => setHoveredStep(i)}
              onHoverEnd={() => setHoveredStep(null)}
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '28px 24px',
                background:
                  hoveredStep === i
                    ? 'linear-gradient(160deg, rgba(15,20,42,0.98) 0%, rgba(10,14,28,0.99) 100%)'
                    : 'linear-gradient(160deg, rgba(13,18,36,0.95) 0%, rgba(10,14,26,0.98) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderTop: `1px solid ${hoveredStep === i ? 'rgba(194,24,91,0.22)' : 'rgba(255,255,255,0.08)'}`,
                borderBottom: `1px solid ${hoveredStep === i ? 'rgba(194,24,91,0.22)' : 'rgba(255,255,255,0.08)'}`,
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: '24px',
                cursor: 'default',
                boxShadow:
                  hoveredStep === i
                    ? '0 16px 48px rgba(0,0,0,0.55), 0 0 36px rgba(194,24,91,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease',
                maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                maskSize: '100% 100%',
                WebkitMaskSize: '100% 100%',
              }}
            >
              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: hoveredStep === i ? '250%' : '-120%' }}
                transition={{ duration: hoveredStep === i ? 0.55 : 0.01, ease: 'easeOut' }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '45%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                  pointerEvents: 'none', transform: 'skewX(-15deg)',
                }}
              />

              {/* Ghost step number — slides in from right */}
              <motion.div
                animate={hoveredStep === i ? { x: 0, opacity: 0.06 } : { x: 70, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  position: 'absolute', right: 18, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '72px', fontWeight: 900,
                  color: '#C2185B', letterSpacing: '-3px', lineHeight: 1,
                  pointerEvents: 'none', userSelect: 'none',
                }}
              >
                {step.num}
              </motion.div>

              {/* Step number + icon */}
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={hoveredStep === i
                    ? { scale: 1.1, boxShadow: '0 0 20px rgba(194,24,91,0.3)' }
                    : { scale: 1, boxShadow: 'none' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{
                    width: 36, height: 36,
                    borderRadius: '10px',
                    background:
                      hoveredStep === i
                        ? 'linear-gradient(135deg, rgba(194,24,91,0.2), rgba(91,45,255,0.1))'
                        : 'rgba(194,24,91,0.08)',
                    border: `1px solid ${hoveredStep === i ? 'rgba(194,24,91,0.35)' : 'rgba(194,24,91,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'background 0.22s ease, border-color 0.22s ease',
                  }}
                >
                  {step.icon}
                </motion.div>
                <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#C2185B', fontWeight: 700 }}>
                  {step.num}
                </span>
              </div>

              <h3
                style={{
                  margin: '0 0 10px', fontSize: '16px', fontWeight: 600,
                  color: hoveredStep === i ? '#F8F9FF' : '#E8EAF2',
                  letterSpacing: '-0.2px', lineHeight: 1.3,
                  transition: 'color 0.2s ease',
                }}
              >
                {step.title}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(201,204,214,0.58)', lineHeight: 1.65 }}>
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Event Infrastructure accordion */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
          style={{
            marginTop: '20px',
            background: 'linear-gradient(135deg, rgba(194,24,91,0.1) 0%, rgba(91,45,255,0.06) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(194,24,91,0.07), inset 0 1px 0 rgba(255,255,255,0.06)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
          }}
        >
          {/* Accordion header — always visible */}
          <button
            type="button"
            onClick={() => setInfraExpanded((v) => !v)}
            style={{
              width: '100%',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px', color: 'rgba(201,204,214,0.45)',
                  marginBottom: '5px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                }}
              >
                Event Infrastructure
              </div>
              <div style={{ fontSize: '16px', color: '#F8F9FF', fontWeight: 600, letterSpacing: '-0.2px' }}>
                Concierto Event Operating System
              </div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.25s ease',
                transform: infraExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
              }}
            >
              <span style={{ fontSize: '20px', color: '#374151', fontWeight: 300, lineHeight: 1 }}>+</span>
            </div>
          </button>

          {/* Accordion content */}
          <motion.div
            initial={false}
            animate={{ height: infraExpanded ? 'auto' : 0, opacity: infraExpanded ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div className="flex gap-2 flex-wrap">
                {INFRA_TAGS.map((tag) => (
                  <motion.span
                    key={tag.label}
                    onMouseEnter={() => openTag(tag.label)}
                    onMouseLeave={scheduleClose}
                    onClick={() => openTag(tag.label)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setHoveredTag(tag.label)}
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(194,24,91,0.09)',
                      borderTop: '1px solid rgba(194,24,91,0.2)',
                      borderBottom: '1px solid rgba(194,24,91,0.2)',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#FF5CA8',
                      letterSpacing: '0.04em',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-block',
                      maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                      maskSize: '100% 100%',
                      WebkitMaskSize: '100% 100%',
                      pointerEvents: 'auto',
                    }}
                  >
                    {tag.label}
                  </motion.span>
                ))}
              </div>
              <button
                type="button"
                disabled
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 18px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: 'rgba(201,204,214,0.5)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  cursor: 'not-allowed',
                  opacity: 0.8,
                }}
              >
                Learn more
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(201,204,214,0.07)',
          padding: '20px 32px 64px',
          textAlign: 'center',
          color: 'rgba(201,204,214,0.28)',
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Powered by Concierto — Event Infrastructure by Buckets
      </div>

      <DemoBanner />

      {/* Feature tooltip — slides in from right on hover */}
      {typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <AnimatePresence>
          {hoveredTag && (() => {
            const tag = INFRA_TAGS.find((t) => t.label === hoveredTag);
            if (!tag) return null;
            return (
              <motion.div
                key={hoveredTag}
                initial={{ x: '110%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '110%', opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                style={{
                  position: 'fixed',
                  right: 24,
                  bottom: 80,
                  zIndex: 99999,
                  width: 300,
                  padding: '20px 24px',
                  background: 'linear-gradient(160deg, rgba(15,20,42,0.97) 0%, rgba(10,14,28,0.99) 100%)',
                  border: '1px solid rgba(194,24,91,0.3)',
                  borderRadius: '16px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 32px rgba(194,24,91,0.12)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {/* Tooltip notch */}
                <div style={{
                  position: 'absolute',
                  right: -6,
                  top: 24,
                  width: 12,
                  height: 12,
                  background: 'rgba(15,20,42,0.97)',
                  border: '1px solid rgba(194,24,91,0.3)',
                  borderLeft: 'none',
                  borderBottom: 'none',
                  transform: 'rotate(45deg)',
                }} />

                {/* Label */}
                <div style={{
                  fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#FF5CA8', fontWeight: 600, marginBottom: '8px',
                }}>
                  {tag.label}
                </div>

                {/* Description */}
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#F8F9FF', lineHeight: 1.5, letterSpacing: '-0.1px' }}>
                  {tag.description}
                </p>

                {/* Detail */}
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(201,204,214,0.6)', lineHeight: 1.65 }}>
                  {tag.detail}
                </p>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

      {/* Tour — "How to use" guide */}
      {typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
        <>
          {/* Persistent pill button */}
          <motion.button
            onClick={() => { setTourStep(0); setShowTour(v => !v); }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.2 }}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            style={{
              position: 'fixed',
              bottom: 150,
              left: 24,
              zIndex: 9997,
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px',
              background: showTour ? 'rgba(194,24,91,0.15)' : 'rgba(10,13,28,0.75)',
              border: `1px solid ${showTour ? 'rgba(194,24,91,0.35)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '100px',
              color: showTour ? '#FF5CA8' : 'rgba(201,204,214,0.65)',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            }}
          >
            <span style={{ fontSize: '13px', opacity: 0.75 }}>?</span>
            {showTour ? 'Close guide' : 'How to use'}
          </motion.button>

          {/* Tour card overlay */}
          <AnimatePresence>
            {showTour && (
              <>
                {/* Dim backdrop */}
                <motion.div
                  key="tour-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowTour(false)}
                  style={{
                    position: 'fixed', inset: 0,
                    zIndex: 9998,
                    background: 'rgba(8,12,24,0.5)',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                  }}
                />

                {/* Step card */}
                <motion.div
                  key="tour-card"
                  initial={{ y: -18, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -18, opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    position: 'fixed',
                    top: '78px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    width: 360,
                    maxWidth: 'calc(100vw - 48px)',
                    background: 'linear-gradient(160deg, rgba(12,16,34,0.97) 0%, rgba(8,12,24,0.99) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(194,24,91,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Gloss highlight line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                    pointerEvents: 'none', zIndex: 1,
                  }} />

                  {/* Card header — progress dots + skip */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px 0',
                  }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {TOUR_STEPS.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => { tourDir.current = idx > tourStep ? 1 : -1; setTourStep(idx); }}
                          style={{
                            width: idx === tourStep ? 20 : 6,
                            height: 6,
                            borderRadius: '3px',
                            background: idx === tourStep ? TOUR_STEPS[tourStep].accent : 'rgba(255,255,255,0.18)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'width 0.28s ease, background 0.28s ease',
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setShowTour(false)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        color: 'rgba(201,204,214,0.45)',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                        fontWeight: 500,
                      }}
                    >
                      Skip
                    </button>
                  </div>

                  {/* Animated step content */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={tourStep}
                      initial={{ x: tourDir.current * 28, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: tourDir.current * -28, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      style={{ padding: '20px 20px 0' }}
                    >
                      {/* Icon chip + section label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '11px', flexShrink: 0,
                          background: `${TOUR_STEPS[tourStep].accent}18`,
                          border: `1px solid ${TOUR_STEPS[tourStep].accent}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px',
                        }}>
                          {TOUR_STEPS[tourStep].icon}
                        </div>
                        <div>
                          <div style={{
                            fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase',
                            color: 'rgba(201,204,214,0.32)', fontWeight: 600, marginBottom: '2px',
                          }}>
                            Section {TOUR_STEPS[tourStep].step} of 0{TOUR_STEPS.length}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: TOUR_STEPS[tourStep].accent, letterSpacing: '0.01em' }}>
                            {TOUR_STEPS[tourStep].label}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        margin: '0 0 8px',
                        fontSize: '18px', fontWeight: 700,
                        color: '#F8F9FF', letterSpacing: '-0.3px', lineHeight: 1.25,
                      }}>
                        {TOUR_STEPS[tourStep].title}
                      </h3>

                      {/* Body */}
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(201,204,214,0.6)', lineHeight: 1.65 }}>
                        {TOUR_STEPS[tourStep].body}
                      </p>

                      {/* Inline visit link */}
                      <a
                        href={TOUR_STEPS[tourStep].href}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '11px', fontWeight: 500,
                          color: TOUR_STEPS[tourStep].accent,
                          opacity: 0.55,
                          textDecoration: 'none', letterSpacing: '0.03em',
                          marginBottom: '4px',
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
                      >
                        Visit {TOUR_STEPS[tourStep].label} ↗
                      </a>
                    </motion.div>
                  </AnimatePresence>

                  {/* Footer navigation */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px 18px',
                    marginTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <motion.button
                      onClick={() => { tourDir.current = -1; setTourStep(s => Math.max(s - 1, 0)); }}
                      whileHover={tourStep > 0 ? { x: -2 } : {}}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        color: tourStep === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(201,204,214,0.5)',
                        cursor: tourStep === 0 ? 'default' : 'pointer',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        pointerEvents: tourStep === 0 ? 'none' : 'auto',
                      }}
                    >
                      ← Back
                    </motion.button>

                    {tourStep < TOUR_STEPS.length - 1 ? (
                      <motion.button
                        onClick={() => { tourDir.current = 1; setTourStep(s => s + 1); }}
                        whileHover={{ x: 2 }}
                        style={{
                          background: `linear-gradient(135deg, ${TOUR_STEPS[tourStep].accent}28, rgba(30,30,55,0.6))`,
                          border: `1px solid ${TOUR_STEPS[tourStep].accent}55`,
                          borderRadius: '10px',
                          padding: '7px 16px',
                          fontSize: '12px',
                          color: TOUR_STEPS[tourStep].accent,
                          cursor: 'pointer',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                        }}
                      >
                        Next →
                      </motion.button>
                    ) : (
                      <motion.a
                        href={TOUR_STEPS[tourStep].href}
                        whileHover={{ x: 2 }}
                        style={{
                          display: 'inline-block',
                          background: 'linear-gradient(135deg, #C2185B, #E91E8C)',
                          borderRadius: '10px',
                          padding: '7px 16px',
                          fontSize: '12px',
                          color: '#F8F9FF',
                          textDecoration: 'none',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          boxShadow: '0 0 16px rgba(194,24,91,0.3)',
                        }}
                      >
                        {TOUR_STEPS[tourStep].cta} ↗
                      </motion.a>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}

      {/* Pulse keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default SpotlightHome;
