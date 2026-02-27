import React, { useState } from 'react';
import { motion } from 'motion/react';
import GlareHover from './GlareHover';
import PixelCard from './PixelCard';
import Shuffle from './Shuffle';
import { Nominee } from './mockData';

const NAME_BASE_COLOR = '#F8F9FF'; // light white (grey-200 equivalent)
const NAME_SELECTED_COLOR = '#FFD6E8';
const NAME_ACCENT_COLOR = '#FF5CA8'; // magenta for last 3 letters

const nameH3Style: React.CSSProperties = {
  display: 'block',
  margin: '0 0 7px',
  fontSize: 'clamp(18px, 1.8vw, 24px)',
  fontWeight: 700,
  letterSpacing: '-0.4px',
  lineHeight: 1.15,
  transition: 'color 0.22s ease',
};

const shuffleCommon = {
  tag: 'span' as const,
  triggerOnHover: true,
  shuffleDirection: 'right' as const,
  animationMode: 'evenodd' as const,
  stagger: 0.03,
  duration: 0.35,
  rootMargin: '0px',
  threshold: 0.01,
  textAlign: 'left' as const,
};

/** Renders name with Shuffle animation; last 3 letters magenta, rest light white/grey */
function NomineeName({ name, isSelected }: { name: string; isSelected: boolean }) {
  const len = name.length;
  const rest = len > 3 ? name.slice(0, -3) : '';
  const last3 = len > 3 ? name.slice(-3) : name;
  const baseColor = isSelected ? NAME_SELECTED_COLOR : NAME_BASE_COLOR;

  return (
    <h3 style={nameH3Style}>
      {rest && (
        <Shuffle
          {...shuffleCommon}
          text={rest}
          style={{ color: baseColor }}
        />
      )}
      <span
        style={{
          color: NAME_ACCENT_COLOR,
          fontStretch: 'semi-expanded',
          letterSpacing: '0.15em',
          marginLeft: rest ? '0.12em' : 0,
        }}
      >
        <Shuffle
          {...shuffleCommon}
          text={last3}
          style={{ color: NAME_ACCENT_COLOR }}
        />
      </span>
    </h3>
  );
}

// Grey-200 → Grey-600 gradient (unvoted)
const BTN_GREY = 'linear-gradient(135deg, rgba(229,231,235,0.18) 0%, rgba(75,85,99,0.42) 100%)';
const BTN_GREY_HOVER = 'linear-gradient(135deg, rgba(229,231,235,0.28) 0%, rgba(75,85,99,0.6) 100%)';
const BTN_BORDER_GREY = 'rgba(229,231,235,0.18)';
const BTN_BORDER_GREY_HOVER = 'rgba(229,231,235,0.32)';

// Magenta → Grey-600 gradient (selected/voted)
const BTN_MAGENTA_GREY = 'linear-gradient(135deg, #C2185B 0%, #374151 100%)';
const BTN_BORDER_MAGENTA = 'rgba(194,24,91,0.5)';

interface NomineeCardProps {
  nominee: Nominee;
  isSelected: boolean;
  onVote: (nomineeId: string) => void;
  onViewCard: (nominee: Nominee) => void;
}

const NomineeCard: React.FC<NomineeCardProps> = ({ nominee, isSelected, onVote, onViewCard }) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [isHoveringBtn, setIsHoveringBtn] = useState(false);
  const [isHoveringView, setIsHoveringView] = useState(false);

  const handleVote = () => {
    if (isSelected) return;
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 600);
    onVote(nominee.id);
  };

  const btnBackground = isSelected ? BTN_MAGENTA_GREY : isHoveringBtn ? BTN_GREY_HOVER : BTN_GREY;
  const btnBorder = isSelected ? BTN_BORDER_MAGENTA : isHoveringBtn ? BTN_BORDER_GREY_HOVER : BTN_BORDER_GREY;
  const btnColor = isSelected ? '#F8F9FF' : isHoveringBtn ? '#F8F9FF' : 'rgba(229,231,235,0.85)';
  const btnShadow = isSelected
    ? '0 0 28px rgba(194,24,91,0.3), 0 6px 20px rgba(55,65,81,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
    : isHoveringBtn
    ? '0 8px 32px rgba(75,85,99,0.55), 0 0 0 1px rgba(229,231,235,0.14)'
    : 'inset 0 1px 0 rgba(255,255,255,0.06)';

  const isActive = isHoveringBtn && !isSelected;

  return (
    <GlareHover
      width="100%"
      height="100%"
      background="transparent"
      borderColor="transparent"
      borderRadius="20px"
      glareColor="#ffffff"
      glareOpacity={0.10}
      glareAngle={-28}
      glareSize={300}
      transitionDuration={820}
      style={{ width: '100%', height: '100%' }}
    >
    <div
      className="flex flex-col h-full"
      style={{ width: '100%', height: '100%' }}
    >

        {/* ── Image header — blurred / locked teaser ── */}
        <div
          style={{
            height: '100px',
            borderRadius: '12px',
            overflow: 'hidden',
            margin: '0 12px 14px',   /* pull in left + right edges */
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {nominee.image ? (
            <img
              src={nominee.image}
              alt={nominee.name}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                filter: 'blur(10px)',
                transform: 'scale(1.12)',  /* prevent blurred edge fringe */
              }}
            />
          ) : (
            <div
              style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, rgba(194,24,91,0.25) 0%, rgba(91,45,255,0.18) 100%)',
              }}
            />
          )}

          {/* frosted dark overlay */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(8,12,24,0.30)',
            }}
          />

          {/* bottom gradient (for selected badge legibility) */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background:
                'linear-gradient(to bottom, transparent 30%, rgba(14,18,33,0.80) 100%)',
            }}
          />

          {/* lock indicator — centred */}
          <div
            style={{
              position: 'absolute', top: '38%', left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '13px', color: 'rgba(201,204,214,0.32)' }}>◈</span>
            <span
              style={{
                fontSize: '8.5px', letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(201,204,214,0.25)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              View Card to Reveal
            </span>
          </div>

          {/* Selected badge on image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.85 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ position: 'absolute', bottom: 8, left: 10, zIndex: 2 }}
          >
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'linear-gradient(135deg, rgba(194,24,91,0.22), rgba(55,65,81,0.4))',
                border: '1px solid rgba(194,24,91,0.45)',
                borderRadius: '100px',
                padding: '3px 10px',
                fontSize: '9.5px', letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#FFD6E8', fontWeight: 600,
                backdropFilter: 'blur(6px)',
              }}
            >
              <span
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#FF5CA8', display: 'inline-block',
                }}
              />
              Selected
            </span>
          </motion.div>
        </div>

        {/* ── Nominee info ── */}
        <div style={{ flex: 1, minHeight: 0, margin: '0 12px' }}>
          <NomineeName name={nominee.name} isSelected={isSelected} />
          <p
            style={{
              margin: 0, fontSize: '13px',
              color: 'rgba(201,204,214,0.6)',
              letterSpacing: '0.01em', lineHeight: 1.5,
            }}
          >
            {nominee.subtitle}
          </p>
        </div>

        {/* ── Buttons ── */}
        <div style={{ marginTop: '14px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Cast Vote — pixel effect on this button only */}
          <PixelCard
            variant="pink"
            gap={5}
            speed={65}
            colors="#FFD6E8,#FF5CA8,#C2185B"
            noFocus
            className="pixel-nominee-btn"
          >
          {/* Vote button — diagonal lift + shimmer + arrow reveal */}
          <motion.button
            onClick={handleVote}
            onHoverStart={() => { if (!isSelected) setIsHoveringBtn(true); }}
            onHoverEnd={() => setIsHoveringBtn(false)}
            animate={
              isPulsing
                ? { scale: [1, 1.07, 0.98, 1], x: 0, y: 0 }
                : isActive
                ? { scale: 1.03, y: -5, x: 8, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } }
                : { scale: 1, y: 0, x: 0, transition: { duration: 0.22, ease: 'easeOut' as const } }
            }
            whileTap={!isSelected ? { scale: 0.96 } : {}}
            style={{
              width: '100%',
              padding: '11px 20px',
              borderRadius: '14px',
              border: `1px solid ${btnBorder}`,
              background: btnBackground,
              color: btnColor,
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: isSelected ? 'default' : 'pointer',
              boxShadow: btnShadow,
              transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              animate={{ x: isActive ? '220%' : '-120%' }}
              transition={{ duration: isActive ? 0.5 : 0.01, ease: 'easeOut' }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '50%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)',
                pointerEvents: 'none',
                transform: 'skewX(-15deg)',
              }}
            />

            {/* Button label */}
            <motion.span
              animate={isActive ? { x: -10 } : { x: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{ position: 'relative', zIndex: 1, display: 'inline-block' }}
            >
              {isSelected ? '✓ Vote Recorded' : 'Cast Vote'}
            </motion.span>

            {/* Arrow */}
            {!isSelected && (
              <motion.span
                animate={isActive ? { x: 0, opacity: 1 } : { x: 30, opacity: 0 }}
                transition={{ duration: 0.28, ease: isActive ? 'easeOut' : 'easeIn' }}
                style={{
                  position: 'absolute', right: 20, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px', fontWeight: 300,
                  pointerEvents: 'none', zIndex: 1,
                }}
              >
                →
              </motion.span>
            )}
          </motion.button>
          </PixelCard>

          {/* View Card — pixel effect on this button only */}
          <PixelCard
            variant="pink"
            gap={5}
            speed={65}
            colors="#FFD6E8,#FF5CA8,#C2185B"
            noFocus
            className="pixel-nominee-btn"
          >
          {/* View Card button */}
          <motion.button
            onClick={() => onViewCard(nominee)}
            onHoverStart={() => setIsHoveringView(true)}
            onHoverEnd={() => setIsHoveringView(false)}
            animate={
              isHoveringView
                ? { x: 4, transition: { duration: 0.18, ease: 'easeOut' as const } }
                : { x: 0, transition: { duration: 0.15, ease: 'easeIn' as const } }
            }
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%',
              padding: '7px 16px',
              background: 'transparent',
              border: `1px solid ${isHoveringView ? 'rgba(194,24,91,0.22)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '12px',
              color: isHoveringView ? '#FF5CA8' : 'rgba(201,204,214,0.4)',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'color 0.18s ease, border-color 0.18s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            View Card
            <span style={{ fontSize: '11px', opacity: 0.7 }}>→</span>
          </motion.button>
          </PixelCard>
        </div>
      </div>
    </GlareHover>
  );
};

export default NomineeCard;
