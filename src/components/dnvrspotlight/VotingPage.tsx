import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedList from './AnimatedList';
import MetallicPaint from './MetallicPaint';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import NomineeCard from './NomineeCard';
import BallotModal from './BallotModal';
import VoteToast from './VoteToast';
import DemoBanner from './DemoBanner';
import TradingCard from './TradingCard';
import ElectricBorder from './ElectricBorder';
import LogoLoop from './LogoLoop';
import Counter from './Counter';
import { CATEGORIES, NOMINEES, DASHBOARD_STATS, getSponsorTier, SPONSOR_TIERS, castVote, getVotes, getVoteProgress } from './mockData';
import type { Nominee } from './mockData';

// ── Sponsor logos (from mockData, with tier indicator) ──────────────────────────
const SPONSOR_ITEM_STYLE: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(201,204,214,0.28)',
  whiteSpace: 'nowrap',
};
const DOT_STYLE: React.CSSProperties = {
  display: 'inline-block',
  width: 3,
  height: 3,
  borderRadius: '50%',
  background: 'rgba(194,24,91,0.35)',
  margin: '0 20px',
  verticalAlign: 'middle',
};

const SPONSOR_LOGOS = DASHBOARD_STATS.sponsors.slice(0, 5).map((s) => {
  const tier = getSponsorTier(s.amount);
  const tierColor = SPONSOR_TIERS[tier].color;
  return {
    node: (
      <span style={SPONSOR_ITEM_STYLE}>
        <span style={{ ...DOT_STYLE, background: tierColor }} />
        {s.name}
      </span>
    ),
    title: `${s.name} (${SPONSOR_TIERS[tier].label})`,
  };
});

// ── Category rail item animation variants (ItemList-inspired) ─────────────────
const CAT_ITEM_VARIANTS = {
  rest: { x: 0, y: 0, scale: 1, transition: { duration: 0.22, ease: 'easeOut' as const } },
  hover: { x: 14, y: -3, scale: 1.04, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};
const CAT_REVEAL_VARIANTS = {
  rest: { x: 44, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
  hover: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' as const } },
};
const CAT_SHIMMER_VARIANTS = {
  rest: { x: '-120%', transition: { duration: 0.01 } },
  hover: { x: '240%', transition: { duration: 0.48, ease: 'easeOut' as const } },
};

const VotingPage: React.FC = () => {
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>(getVotes);
  const [ballotOpen, setBallotOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [tradingCardNominee, setTradingCardNominee] = useState<Nominee | null>(null);

  const activeCategory = CATEGORIES[activeCategoryIdx];
  const nominees = NOMINEES[activeCategory.id] || [];
  const progress = getVoteProgress();
  const votedCount = Object.keys(votes).length;

  const handleVote = useCallback(
    (nomineeId: string) => {
      castVote(activeCategory.id, nomineeId);
      const updated = getVotes();
      setVotes({ ...updated });
      const nominee = nominees.find((n) => n.id === nomineeId);
      setToastMsg(`Vote cast for ${nominee?.name}`);
      setToastVisible(true);
    },
    [activeCategory.id, nominees]
  );

  const dismissToast = useCallback(() => setToastVisible(false), []);
  const handleViewCard = useCallback((nominee: Nominee) => setTradingCardNominee(nominee), []);

  const categoryLabels = CATEGORIES.map((c) => `${votes[c.id] ? '✓ ' : ''}${c.name}`);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        minHeight: '100vh',
        height: '100vh',
        paddingBottom: 56,
        boxSizing: 'border-box',
        background: '#080C18',
        color: '#F8F9FF',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      {/* Header bar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: '16px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(180deg, rgba(10,14,28,0.98) 0%, rgba(8,12,24,0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 10,
          boxShadow: '0 1px 0 rgba(194,24,91,0.07)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-5">
          <motion.a
            href="/DNVRSpotlight"
            whileHover={{ color: '#C9CCD6', x: -2 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5"
            style={{ color: 'rgba(201,204,214,0.45)', fontSize: '13px', textDecoration: 'none' }}
          >
            ← Home
          </motion.a>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <MetallicPaint style={{ fontSize: '15px', fontWeight: 600 }}>
              Denver Spotlight Awards
            </MetallicPaint>
            <span style={{ color: 'rgba(201,204,214,0.38)', fontSize: '13px', marginLeft: '10px' }}>
              2026 Voting
            </span>
          </div>
        </div>

        {/* Right: progress + ballot review */}
        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div
              style={{
                height: 5, width: 80,
                background: 'rgba(201,204,214,0.08)',
                borderRadius: 6, overflow: 'hidden',
              }}
            >
              <motion.div
                animate={{ width: `${(votedCount / CATEGORIES.length) * 100}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #C2185B, #E91E8C)',
                  borderRadius: 6,
                  boxShadow: '0 0 8px rgba(194,24,91,0.5)',
                }}
              />
            </div>
            <span className="flex items-baseline" style={{ gap: '3px' }}>
              <Counter
                value={votedCount}
                places={[1]}
                fontSize={13}
                padding={2}
                gap={0}
                horizontalPadding={0}
                borderRadius={0}
                fontWeight={600}
                textColor="rgba(201,204,214,0.7)"
                gradientFrom="#080C18"
                gradientHeight={5}
              />
              <span style={{ color: 'rgba(201,204,214,0.4)', fontSize: '12px' }}>
                / {CATEGORIES.length}
              </span>
            </span>
          </div>

          <motion.button
            onClick={() => setBallotOpen(true)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, rgba(194,24,91,0.16), rgba(233,30,140,0.08))',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(194,24,91,0.32)',
              borderRadius: '12px',
              color: '#FFD6E8',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.03em',
              boxShadow: '0 0 16px rgba(194,24,91,0.12)',
              transition: 'background 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #C2185B, #E91E8C)';
              (e.currentTarget as HTMLButtonElement).style.color = '#F8F9FF';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(194,24,91,0.45)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(194,24,91,0.16), rgba(233,30,140,0.08))';
              (e.currentTarget as HTMLButtonElement).style.color = '#FFD6E8';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(194,24,91,0.12)';
            }}
          >
            Review Ballot
          </motion.button>
        </div>
      </motion.header>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* Left panel — category rail */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="flex flex-col flex-shrink-0 overflow-hidden"
          style={{
            width: '300px',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(180deg, rgba(10,14,28,0.98) 0%, #080C18 100%)',
            padding: '24px 14px',
          }}
        >
          <div
            style={{
              fontSize: '10px', letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(201,204,214,0.3)',
              fontWeight: 600, marginBottom: '14px', paddingLeft: '8px',
            }}
          >
            Categories
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatedList
              items={categoryLabels}
              initialSelectedIndex={activeCategoryIdx}
              showGradients
              enableArrowNavigation
              displayScrollbar={false}
              onItemSelect={(_, idx) => setActiveCategoryIdx(idx)}
              renderItem={(item, index, isSelected) => {
                const card = (
                  <motion.div
                    initial="rest"
                    whileHover={!isSelected ? 'hover' : undefined}
                    variants={CAT_ITEM_VARIANTS}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      padding: '13px 16px',
                      borderRadius: '14px',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(194,24,91,0.18), rgba(91,45,255,0.07))'
                        : 'rgba(255,255,255,0.025)',
                      border: isSelected ? 'none' : `1px solid rgba(255,255,255,0.06)`,
                      borderLeft: isSelected ? '3px solid #C2185B' : '1px solid rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: isSelected
                        ? '0 0 24px rgba(194,24,91,0.16), inset 0 1px 0 rgba(255,255,255,0.06)'
                        : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Shimmer sweep — crosses on hover */}
                    <motion.div
                      variants={CAT_SHIMMER_VARIANTS}
                      style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '55%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
                        pointerEvents: 'none',
                        transform: 'skewX(-15deg)',
                      }}
                    />

                    {/* Index # — slides in from right edge */}
                    {!isSelected && (
                      <motion.span
                        variants={CAT_REVEAL_VARIANTS}
                        style={{
                          position: 'absolute', right: 12, top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '14px', fontWeight: 700, color: '#C2185B',
                          pointerEvents: 'none', lineHeight: 1,
                        }}
                      >
                        <span style={{ opacity: 0.25, fontWeight: 400 }}>#</span>{index + 1}
                      </motion.span>
                    )}

                    {/* Category label */}
                    <motion.div
                      variants={{
                        rest: { color: isSelected ? '#FFD6E8' : '#C9CCD6' },
                        hover: { color: isSelected ? '#FFD6E8' : '#F8F9FF', transition: { duration: 0.2 } },
                      }}
                      style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, letterSpacing: '0.01em' }}
                    >
                      {item}
                    </motion.div>
                  </motion.div>
                );

                return isSelected ? (
                  <ElectricBorder color="#C2185B" speed={1.2} chaos={0.09} borderRadius={14}>
                    {card}
                  </ElectricBorder>
                ) : card;
              }}
            />
          </div>

          {/* Hall of Fame link */}
          <motion.a
            href="/DNVRSpotlight/HallofFame"
            whileHover={{ x: 3, borderColor: 'rgba(194,24,91,0.28)', color: '#FF5CA8' }}
            transition={{ duration: 0.16 }}
            className="flex items-center gap-2"
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              marginTop: '14px',
              color: 'rgba(201,204,214,0.45)',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '0.02em',
              backdropFilter: 'blur(8px)',
            }}
          >
            ◈ View Hall of Fame →
          </motion.a>
        </motion.div>

        {/* Right panel — nominee stack + sponsors */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex-1 overflow-hidden relative flex flex-col"
            style={{ background: '#080C18', minHeight: 0 }}
          >
            {/* Category header */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                padding: '24px 32px 0',
                zIndex: 2,
                background: 'linear-gradient(to bottom, #080C18 60%, transparent)',
              }}
            >
              <div
                style={{
                  fontSize: '10px', letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: '#C2185B',
                  fontWeight: 700, marginBottom: '6px',
                }}
              >
                {activeCategory.icon} {activeCategory.name}
              </div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                <MetallicPaint>{votes[activeCategory.id] ? '✓ Vote Recorded' : 'Select a Nominee'}</MetallicPaint>
              </h2>
            </div>

            {/* ScrollStack */}
            <div style={{ flex: 1, minHeight: 0, paddingTop: '80px' }}>
              <ScrollStack
                itemDistance={80}
                itemScale={0.04}
                itemStackDistance={28}
                stackPosition="18%"
                scaleEndPosition="8%"
                baseScale={0.88}
              >
                {nominees.map((nominee) => (
                  <ScrollStackItem key={nominee.id}>
                    <NomineeCard
                      nominee={nominee}
                      isSelected={votes[activeCategory.id] === nominee.id}
                      onVote={handleVote}
                      onViewCard={handleViewCard}
                    />
                  </ScrollStackItem>
                ))}
              </ScrollStack>
            </div>

            {/* Sponsors ticker — below nominations in this section */}
            <div
              style={{
                height: 48,
                flexShrink: 0,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(8,12,24,0.98)',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: '8px', letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'rgba(201,204,214,0.16)',
                  fontWeight: 700, whiteSpace: 'nowrap',
                  padding: '0 18px', flexShrink: 0,
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                Sponsors
              </div>
              <LogoLoop
                logos={SPONSOR_LOGOS}
                speed={55}
                direction="left"
                logoHeight={11}
                gap={0}
                hoverSpeed={18}
                fadeOut
                fadeOutColor="#080C18"
                ariaLabel="Denver Spotlight Awards sponsors"
                style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <VoteToast message={toastMsg} visible={toastVisible} onDismiss={dismissToast} />
      <BallotModal open={ballotOpen} onClose={() => setBallotOpen(false)} />
      <TradingCard nominee={tradingCardNominee} onClose={() => setTradingCardNominee(null)} />
      <DemoBanner />
    </div>
  );
};

export default VotingPage;
