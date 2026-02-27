import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VoteToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const VoteToast: React.FC<VoteToastProps> = ({ message, visible, onDismiss }) => {
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(onDismiss, 2500);
    return () => clearTimeout(id);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -12, x: '-50%' }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#0F1426',
            border: '1px solid rgba(255, 92, 168, 0.3)',
            borderLeft: '3px solid #C2185B',
            borderRadius: '10px',
            padding: '12px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(194,24,91,0.15)',
            minWidth: '280px',
            maxWidth: '380px',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#C2185B',
            boxShadow: '0 0 8px rgba(194,24,91,0.8)',
            flexShrink: 0,
          }} />
          <span style={{ color: '#F8F9FF', fontSize: '13px', fontWeight: 500 }}>{message}</span>
          <span style={{ color: 'rgba(201,204,214,0.4)', fontSize: '11px', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            Demo Mode
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoteToast;
