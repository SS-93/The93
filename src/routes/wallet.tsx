/**
 * Wallet Page
 * 
 * Passport Wallet - Central hub for:
 * - Event Tickets (live)
 * - Wallet Balance (pending - add funds)
 * - Creative NFTs (pending - mint, hold, sell)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WalletIcon,
  TicketIcon,
  CreditCardIcon,
  SparklesIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { TicketCard, Ticket } from '../components/passport/TicketCard';
import { supabase } from '../lib/supabaseClient';

// =============================================================================
// TYPES
// =============================================================================

interface WalletBalance {
  availableBalanceCents: number;
  pendingBalanceCents: number;
  totalBalanceCents: number;
}

interface WalletStats {
  totalTickets: number;
  activeTickets: number;
  redeemedTickets: number;
  totalNFTs: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function WalletPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Fetch wallet data
  useEffect(() => {
    fetchWalletData();
  }, [filter]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch tickets
      let query = supabase
        .from('event_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      // Apply filter
      const now = new Date().toISOString();
      if (filter === 'upcoming') {
        query = query.gte('event_date', now).eq('status', 'active');
      } else if (filter === 'past') {
        query = query.lt('event_date', now);
      }

      const { data: ticketsData, error: ticketsError } = await query;

      if (ticketsError) throw ticketsError;

      // Transform to Ticket type
      const transformedTickets: Ticket[] = (ticketsData || []).map(t => ({
        id: t.id,
        ticketNumber: t.ticket_number,
        qrCodeData: t.qr_code_data,
        event: {
          id: t.event_id,
          title: t.event_title,
          date: t.event_date,
          venue: t.event_venue || 'TBA',
          imageUrl: t.event_image_url
        },
        tier: t.tier,
        tierDisplayName: t.tier_display_name,
        priceCents: t.price_cents,
        perks: t.perks || [],
        status: t.status,
        redeemedAt: t.redeemed_at,
        validUntil: t.valid_until
      }));

      setTickets(transformedTickets);

      // Fetch wallet balance
      const { data: balanceData } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (balanceData) {
        setBalance({
          availableBalanceCents: balanceData.available_balance_cents,
          pendingBalanceCents: balanceData.pending_balance_cents,
          totalBalanceCents: balanceData.total_balance_cents
        });
      }

      // Calculate stats
      const allTickets = transformedTickets;
      setStats({
        totalTickets: allTickets.length,
        activeTickets: allTickets.filter(t => t.status === 'active').length,
        redeemedTickets: allTickets.filter(t => t.status === 'redeemed').length,
        totalNFTs: 0 // Pending feature
      });

    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <WalletIcon className="w-10 h-10" />
              Passport Wallet
            </h1>
            <p className="text-gray-400">Your digital assets & experiences</p>
          </div>
        </div>

        {/* Wallet Balance Card - PENDING FEATURE */}
        <motion.div
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Coming Soon Badge */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              <ClockIcon className="w-3 h-3" />
              Coming Soon
            </span>
          </div>

          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Wallet Balance</p>
              <p className="text-5xl font-bold text-white">
                ${balance ? formatCents(balance.availableBalanceCents) : '0.00'}
              </p>
              {balance && balance.pendingBalanceCents > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  + ${formatCents(balance.pendingBalanceCents)} pending
                </p>
              )}
            </div>
            <CreditCardIcon className="w-12 h-12 text-purple-400" />
          </div>

          {/* Pending Features */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-white/40 cursor-not-allowed"
              disabled
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium">Add Funds</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-white/40 cursor-not-allowed"
              disabled
            >
              <SparklesIcon className="w-5 h-5" />
              <span className="font-medium">Mint NFT</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            💡 Add funds to your wallet and start collecting exclusive creative NFTs
          </p>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <TicketIcon className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-bold text-white">{stats.totalTickets}</span>
              </div>
              <p className="text-sm text-gray-400">Total Tickets</p>
            </motion.div>

            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats.activeTickets}</span>
              </div>
              <p className="text-sm text-gray-400">Active</p>
            </motion.div>

            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <CheckCircleIcon className="w-6 h-6 text-gray-400" />
                <span className="text-2xl font-bold text-white">{stats.redeemedTickets}</span>
              </div>
              <p className="text-sm text-gray-400">Redeemed</p>
            </motion.div>

            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 opacity-50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <SparklesIcon className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-bold text-white">{stats.totalNFTs}</span>
              </div>
              <p className="text-sm text-gray-400">NFTs (Soon)</p>
            </motion.div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'past', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                filter === tab
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {tickets.map((ticket, idx) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <TicketCard 
                    ticket={ticket} 
                    onClick={() => setSelectedTicket(ticket)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TicketIcon className="w-20 h-20 mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No tickets yet</h3>
            <p className="text-gray-400 text-lg mb-6">
              {filter === 'upcoming' 
                ? 'Purchase tickets to upcoming events to see them here' 
                : filter === 'past'
                ? 'No past events found'
                : 'Your ticket wallet is empty'}
            </p>
            <button
              onClick={() => window.location.href = '/events'}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Browse Events
            </button>
          </motion.div>
        )}

        {/* NFT Section - Coming Soon */}
        <motion.div
          className="mt-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <SparklesIcon className="w-16 h-16 mx-auto text-purple-400 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Creative NFTs</h3>
          <p className="text-gray-400 mb-4 max-w-2xl mx-auto">
            Soon you'll be able to mint, collect, and trade exclusive digital collectibles 
            from your favorite artists. Music stems, behind-the-scenes footage, limited edition 
            artwork, and more - all hosted in your Passport Wallet.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm">
            <ClockIcon className="w-4 h-4" />
            <span className="font-medium">Coming Soon</span>
          </div>
        </motion.div>
      </div>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              className="max-w-md w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <TicketCard ticket={selectedTicket} variant="full" />
              <button
                onClick={() => setSelectedTicket(null)}
                className="mt-4 w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

