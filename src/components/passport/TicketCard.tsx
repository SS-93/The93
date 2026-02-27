/**
 * TicketCard Component
 * 
 * Beautiful digital ticket inspired by Apple Wallet + Ticketmaster
 * Part of the Passport Wallet system
 */

import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CalendarIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES
// =============================================================================

export interface Ticket {
  id: string;
  ticketNumber: string;
  qrCodeData: string;
  
  // Event details
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
    imageUrl?: string;
  };
  
  // Ticket details
  tier: string;
  tierDisplayName: string;
  priceCents: number;
  perks?: string[];
  
  // Status
  status: 'active' | 'redeemed' | 'expired' | 'transferred' | 'cancelled';
  redeemedAt?: string;
  validUntil?: string;
}

interface TicketCardProps {
  ticket: Ticket;
  variant?: 'compact' | 'full';
  onClick?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TicketCard({ ticket, variant = 'full', onClick }: TicketCardProps) {
  const isActive = ticket.status === 'active';
  const isRedeemed = ticket.status === 'redeemed';
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Tier colors
  const getTierGradient = (tier: string) => {
    const gradients: Record<string, string> = {
      backstage: 'from-amber-500 via-orange-500 to-red-500',
      vip: 'from-purple-500 via-pink-500 to-rose-500',
      general: 'from-indigo-500 via-purple-500 to-pink-500',
    };
    return gradients[tier.toLowerCase()] || gradients.general;
  };

  if (variant === 'compact') {
    return (
      <motion.div
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {ticket.event.imageUrl && (
            <img 
              src={ticket.event.imageUrl} 
              alt={ticket.event.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{ticket.event.title}</h3>
            <p className="text-sm text-gray-400">{ticket.tierDisplayName}</p>
            <p className="text-xs text-gray-500">{formatDate(ticket.event.date)}</p>
          </div>
          {isRedeemed && (
            <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl shadow-2xl cursor-pointer ${
        isActive ? '' : 'opacity-60'
      }`}
      whileHover={isActive ? { scale: 1.02, y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getTierGradient(ticket.tier)}`} />
      
      {/* Event Image Header */}
      <div className="relative h-48 overflow-hidden">
        {ticket.event.imageUrl ? (
          <img 
            src={ticket.event.imageUrl} 
            alt={ticket.event.title}
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-black/20" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Event Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1 line-clamp-2">
                {ticket.event.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white uppercase tracking-wider">
                  {ticket.tierDisplayName}
                </span>
                {ticket.perks && ticket.perks.length > 0 && (
                  <SparklesIcon className="w-4 h-4 text-yellow-300" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isRedeemed && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-sm">
              <CheckCircleIcon className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase">Redeemed</span>
            </div>
          </div>
        )}
      </div>

      {/* Perforated Edge Effect */}
      <div className="relative h-6" style={{ marginTop: -1 }}>
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 6">
          <defs>
            <pattern id={`perforation-${ticket.id}`} x="0" y="0" width="4" height="6" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="3" r="1.5" fill="rgba(0,0,0,0.1)" />
            </pattern>
          </defs>
          <rect width="100" height="6" fill={`url(#perforation-${ticket.id})`} />
        </svg>
      </div>

      {/* Ticket Details */}
      <div className="relative p-6 bg-white/10 backdrop-blur-xl">
        {/* Date & Venue */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-white/70 mb-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Date & Time</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {formatDate(ticket.event.date)}
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-white/70 mb-1">
              <MapPinIcon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Venue</span>
            </div>
            <p className="text-white font-semibold text-sm line-clamp-2">
              {ticket.event.venue || 'TBA'}
            </p>
          </div>
        </div>

        {/* Perks */}
        {ticket.perks && ticket.perks.length > 0 && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide font-medium text-white/70 mb-2">
              Includes
            </p>
            <div className="flex flex-wrap gap-2">
              {ticket.perks.map((perk, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 rounded-md text-xs bg-white/10 text-white/90"
                >
                  {perk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* QR Code */}
        {isActive && (
          <div className="bg-white rounded-xl p-4 flex justify-center mb-4">
            <QRCodeSVG 
              value={ticket.qrCodeData} 
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>
        )}

        {/* Ticket Number */}
        <div className="text-center mb-2">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">
            Ticket Number
          </p>
          <p className="text-white font-mono text-base tracking-wider font-medium">
            {ticket.ticketNumber}
          </p>
        </div>

        {/* Validity */}
        {ticket.validUntil && (
          <div className="flex items-center justify-center gap-2 text-xs text-white/50 mt-4">
            <ClockIcon className="w-4 h-4" />
            <span>Valid until {formatDate(ticket.validUntil)}</span>
          </div>
        )}
      </div>

      {/* Powered by Passport Badge */}
      <div className="absolute bottom-2 right-2 opacity-40">
        <div className="flex items-center gap-1 text-white/50 text-[10px] uppercase tracking-wider font-bold">
          <SparklesIcon className="w-3 h-3" />
          <span>Passport</span>
        </div>
      </div>
    </motion.div>
  );
}

export default TicketCard;

