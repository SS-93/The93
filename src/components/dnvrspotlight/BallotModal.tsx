import React from 'react';
import MetallicPaint from './MetallicPaint';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, NOMINEES, getVotes } from './mockData';

interface BallotModalProps {
  open: boolean;
  onClose: () => void;
}

const BallotModal: React.FC<BallotModalProps> = ({ open, onClose }) => {
  const votes = getVotes();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(5, 7, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2001,
              width: '100%',
              maxWidth: '500px',
              background: 'linear-gradient(160deg, rgba(15,20,42,0.97) 0%, rgba(20,12,30,0.97) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(194,24,91,0.12), 0 0 0 1px rgba(194,24,91,0.15)',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#C2185B', fontWeight: 600, marginBottom: '8px',
              }}>
                Denver Spotlight Awards · 2026
              </div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600', letterSpacing: '-0.3px' }}>
                <MetallicPaint>Your Ballot</MetallicPaint>
              </h2>
              <div style={{
                marginTop: '10px', height: '1px',
                background: 'linear-gradient(90deg, rgba(194,24,91,0.4) 0%, transparent 60%)',
              }} />
            </div>

            {/* Ballot rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {CATEGORIES.map(cat => {
                const selectedId = votes[cat.id];
                const nominees = NOMINEES[cat.id] || [];
                const selectedNominee = nominees.find(n => n.id === selectedId);

                return (
                  <div key={cat.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    background: selectedNominee
                      ? 'linear-gradient(135deg, rgba(194,24,91,0.12), rgba(233,30,140,0.06))'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedNominee ? 'rgba(255,92,168,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '10px',
                    gap: '16px',
                    boxShadow: selectedNominee ? '0 0 16px rgba(194,24,91,0.1)' : 'none',
                  }}>
                    <span style={{ color: 'rgba(201,204,214,0.6)', fontSize: '12px', minWidth: '140px' }}>
                      {cat.name}
                    </span>
                    <span style={{
                      color: selectedNominee ? '#FFD6E8' : 'rgba(201,204,214,0.3)',
                      fontSize: '13px', fontWeight: selectedNominee ? 500 : 400,
                      textAlign: 'right',
                    }}>
                      {selectedNominee ? selectedNominee.name : '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(15,20,42,0.4)',
              border: '1px solid rgba(201,204,214,0.06)',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '12px',
              color: 'rgba(201,204,214,0.45)',
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}>
              Demo Mode — No backend submission. Votes stored locally only.
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '13px',
                background: 'rgba(194,24,91,0.12)',
                border: '1px solid rgba(194,24,91,0.3)',
                borderRadius: '10px',
                color: '#FFD6E8', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C2185B'; (e.currentTarget as HTMLButtonElement).style.color = '#F8F9FF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(194,24,91,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#FFD6E8'; }}
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BallotModal;
