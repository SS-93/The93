/**
 * Revenue Split Settings Component
 * 
 * Allows hosts to configure revenue splits and manage profit share partners
 * Non-intrusive addition to EventDashboard
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  QrCodeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabaseClient';

// =============================================================================
// TYPES
// =============================================================================

export interface SplitRule {
  role: 'artist' | 'host' | 'platform' | 'venue' | 'partner';
  percent: number;
  recipient_id?: string; // For partners
}

export interface ProfitSharePartner {
  id: string;
  partner_key: string;
  partner_name: string;
  recipient_type: 'artist' | 'venue' | 'promoter' | 'sponsor' | 'other';
  recipient_email?: string;
  recipient_user_id?: string;
  split_percent: number;
  qr_code_data?: string;
  is_active: boolean;
}

interface RevenueSplitSettingsProps {
  eventId: string;
  eventHostId: string;
}

interface EventTicketData {
  ticket_tiers?: Array<{
    price_cents: number;
    quantity: number;
  }>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RevenueSplitSettings({
  eventId,
  eventHostId
}: RevenueSplitSettingsProps) {
  const [splits, setSplits] = useState<SplitRule[]>([
    { role: 'artist', percent: 70 },
    { role: 'platform', percent: 20 },
    { role: 'host', percent: 10 }
  ]);
  const [venueEnabled, setVenueEnabled] = useState(false);
  const [partners, setPartners] = useState<ProfitSharePartner[]>([]);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventTicketData, setEventTicketData] = useState<EventTicketData | null>(null);
  const [artistCount, setArtistCount] = useState(0);

  useEffect(() => {
    loadSplitSettings();
  }, [eventId]);

  const loadSplitSettings = async () => {
    try {
      // Load event data (for ticket tiers)
      const { data: eventData } = await supabase
        .from('events')
        .select('ticket_tiers')
        .eq('id', eventId)
        .single();

      if (eventData) {
        setEventTicketData(eventData as EventTicketData);
      }

      // Load artist count
      const { count: artistCountData } = await supabase
        .from('event_artist_prospects')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (artistCountData !== null) {
        setArtistCount(artistCountData);
      }

      // Load event-specific split rules
      const { data: splitRules } = await supabase
        .from('split_rules')
        .select('*')
        .eq('entity_type', 'event')
        .eq('entity_id', eventId)
        .eq('is_active', true)
        .maybeSingle();

      if (splitRules) {
        const loadedSplits = splitRules.rules as SplitRule[];
        setSplits(loadedSplits);
        // Check if venue split exists
        const hasVenue = loadedSplits.some(s => s.role === 'venue');
        setVenueEnabled(hasVenue);
      }

      // Load profit share partners
      const { data: partnersData } = await supabase
        .from('event_profit_share_partners')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (partnersData) {
        setPartners(partnersData);
      }
    } catch (error) {
      console.error('[RevenueSplit] Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitChange = (role: SplitRule['role'], percent: number) => {
    // Enforce 8% minimum for platform
    if (role === 'platform' && percent < 8) {
      percent = 8;
    }

    const updated = splits.map(s =>
      s.role === role ? { ...s, percent } : s
    );
    setSplits(updated);
  };

  const handleVenueToggle = (enabled: boolean) => {
    setVenueEnabled(enabled);
    if (enabled) {
      // Add venue split with 0% initially
      if (!splits.some(s => s.role === 'venue')) {
        setSplits([...splits, { role: 'venue', percent: 0 }]);
      }
    } else {
      // Remove venue split
      setSplits(splits.filter(s => s.role !== 'venue'));
    }
  };

  // Calculate total potential revenue from ticket tiers
  const calculateTotalPotentialRevenue = (): number => {
    if (!eventTicketData?.ticket_tiers || eventTicketData.ticket_tiers.length === 0) {
      return 0;
    }
    return eventTicketData.ticket_tiers.reduce((total, tier) => {
      return total + (tier.price_cents * tier.quantity);
    }, 0);
  };

  const totalPotentialRevenue = calculateTotalPotentialRevenue();
  const artistSplit = splits.find(s => s.role === 'artist');
  const artistSplitAmount = artistSplit ? (totalPotentialRevenue * artistSplit.percent / 100) : 0;
  const artistSplitPerArtist = artistCount > 0 ? artistSplitAmount / artistCount : 0;
  const totalPercent = splits.reduce((sum, s) => sum + s.percent, 0);

  const handleSaveSplits = async () => {
    try {
      // Filter out venue if disabled
      const splitsToSave = venueEnabled ? splits : splits.filter(s => s.role !== 'venue');
      
      const totalPercent = splitsToSave.reduce((sum, s) => sum + s.percent, 0);
      if (totalPercent !== 100) {
        alert(`Splits must add up to 100% (currently ${totalPercent}%)`);
        return;
      }

      // Ensure platform is at least 8%
      const platformSplit = splitsToSave.find(s => s.role === 'platform');
      if (platformSplit && platformSplit.percent < 8) {
        alert('Platform split must be at least 8%');
        return;
      }

      // Check if split rule already exists for this event
      const { data: existingRule } = await supabase
        .from('split_rules')
        .select('id')
        .eq('entity_type', 'event')
        .eq('entity_id', eventId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingRule) {
        // Update existing rule
        const { error } = await supabase
          .from('split_rules')
          .update({
            rules: splitsToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRule.id);

        if (error) throw error;
      } else {
        // Insert new rule
        const { error } = await supabase
          .from('split_rules')
          .insert({
            owner_id: eventHostId,
            name: `Event Split - ${eventId}`,
            entity_type: 'event',
            entity_id: eventId,
            rules: splitsToSave,
            is_default: false,
            is_active: true
          });

        if (error) throw error;
      }

      alert('✅ Revenue splits saved successfully!');
    } catch (error: any) {
      console.error('[RevenueSplit] Error saving splits:', error);
      alert('Failed to save revenue splits: ' + error.message);
    }
  };

  const handleAddPartner = async (partnerData: Omit<ProfitSharePartner, 'id' | 'partner_key' | 'qr_code_data'>) => {
    try {
      // Generate partner key via RPC or backend
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_partner_key', { event_id: eventId });

      const partnerKey = keyError ? `BKT-PARTNER-${Date.now()}` : keyData;

      // Generate QR code data
      const qrData = JSON.stringify({
        type: 'profit_share_partner',
        eventId,
        partnerKey,
        timestamp: Date.now()
      });

      const { data: newPartner, error } = await supabase
        .from('event_profit_share_partners')
        .insert({
          event_id: eventId,
          partner_key: partnerKey,
          partner_name: partnerData.partner_name,
          recipient_type: partnerData.recipient_type,
          recipient_email: partnerData.recipient_email,
          recipient_user_id: partnerData.recipient_user_id,
          split_percent: partnerData.split_percent,
          qr_code_data: qrData,
          is_active: true,
          created_by: eventHostId
        })
        .select()
        .single();

      if (error) throw error;

      setPartners([...partners, newPartner]);
      setShowPartnerModal(false);
    } catch (error: any) {
      console.error('[RevenueSplit] Error adding partner:', error);
      alert('Failed to add partner: ' + error.message);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to remove this partner?')) return;

    try {
      const { error } = await supabase
        .from('event_profit_share_partners')
        .update({ is_active: false })
        .eq('id', partnerId);

      if (error) throw error;

      setPartners(partners.filter(p => p.id !== partnerId));
    } catch (error: any) {
      console.error('[RevenueSplit] Error deleting partner:', error);
      alert('Failed to remove partner: ' + error.message);
    }
  };

  const partnerPercent = partners.reduce((sum, p) => sum + parseFloat(p.split_percent.toString()), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
            Revenue Split Settings
          </h3>
          <p className="text-gray-400">
            Configure how ticket revenue is distributed among artists, platform, host, and partners
          </p>
        </div>
      </div>

      {/* Profit Preview */}
      {totalPotentialRevenue > 0 && (
        <div className="p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
            Potential Profit Preview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-black/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Total Potential Revenue</p>
              <p className="text-2xl font-bold text-green-400">
                ${(totalPotentialRevenue / 100).toFixed(2)}
              </p>
            </div>
            {artistSplit && artistCount > 0 && (
              <div className="p-4 bg-black/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Artist Split ({artistSplit.percent}%)</p>
                <p className="text-xl font-bold text-purple-400">
                  ${(artistSplitAmount / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ${(artistSplitPerArtist / 100).toFixed(2)} per artist ({artistCount} artists)
                </p>
              </div>
            )}
            <div className="p-4 bg-black/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Platform Minimum</p>
              <p className="text-lg font-bold text-yellow-400">8%</p>
              <p className="text-xs text-gray-500 mt-1">Required minimum</p>
            </div>
          </div>
        </div>
      )}

      {/* Split Visualization */}
      <div className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold">Revenue Distribution</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-400">Enable Venue Split</span>
            <input
              type="checkbox"
              checked={venueEnabled}
              onChange={(e) => handleVenueToggle(e.target.checked)}
              className="w-5 h-5 bg-black border border-gray-700 rounded focus:border-teal-500"
            />
          </label>
        </div>
        
        <div className="space-y-4">
          {splits.map((split) => (
            <div key={split.role} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize flex items-center gap-2">
                  {split.role}
                  {split.role === 'platform' && (
                    <span className="text-xs text-yellow-400">(min 8%)</span>
                  )}
                </span>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={split.role === 'platform' ? 8 : 0}
                    max="100"
                    value={split.percent}
                    onChange={(e) => handleSplitChange(split.role, parseInt(e.target.value))}
                    className="w-32"
                  />
                  <input
                    type="number"
                    min={split.role === 'platform' ? 8 : 0}
                    max="100"
                    value={split.percent}
                    onChange={(e) => {
                      const val = Math.max(split.role === 'platform' ? 8 : 0, Math.min(100, parseInt(e.target.value) || 0));
                      handleSplitChange(split.role, val);
                    }}
                    className="w-20 px-2 py-1 bg-black border border-gray-700 rounded text-right font-bold focus:border-accent-yellow focus:outline-none"
                  />
                  <span className="w-8 text-right font-bold">%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    split.role === 'artist' ? 'bg-purple-500' :
                    split.role === 'host' ? 'bg-blue-500' :
                    split.role === 'platform' ? 'bg-yellow-500' :
                    split.role === 'venue' ? 'bg-teal-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${split.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Total Validation */}
        <div className={`mt-4 p-3 rounded-lg ${
          totalPercent === 100 ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">Total:</span>
            <span className={`font-bold ${totalPercent === 100 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPercent}%
            </span>
          </div>
          {totalPercent !== 100 && (
            <p className="text-sm text-red-400 mt-1">
              Splits must add up to exactly 100%
            </p>
          )}
        </div>

        <button
          onClick={handleSaveSplits}
          disabled={totalPercent !== 100}
          className={`mt-4 w-full px-4 py-2 rounded-lg font-bold transition-colors ${
            totalPercent === 100
              ? 'bg-accent-yellow text-black hover:bg-accent-yellow/90'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Save Revenue Splits
        </button>
      </div>

      {/* Profit Share Partners */}
      <div className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Profit Share Partners
          </h4>
          <button
            onClick={() => setShowPartnerModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Partner
          </button>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No profit share partners added</p>
            <p className="text-sm mt-1">Add partners to share revenue (venues, promoters, etc.)</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="p-4 bg-black/50 border border-gray-700 rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold">{partner.partner_name}</span>
                    <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-700/50 rounded text-xs capitalize">
                      {partner.recipient_type}
                    </span>
                    <span className="text-accent-yellow font-bold">
                      {partner.split_percent}%
                    </span>
                  </div>
                  {partner.recipient_email && (
                    <p className="text-sm text-gray-400">{partner.recipient_email}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Key: {partner.partner_key.substring(0, 20)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQRModal(partner.id)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="View QR code"
                  >
                    <QrCodeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner.id)}
                    className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                    aria-label="Remove partner"
                  >
                    <TrashIcon className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {partners.length > 0 && (
          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Partner Total:</span>
              <span className="font-bold text-purple-400">{partnerPercent}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Note: Partner splits are in addition to base splits above
            </p>
          </div>
        )}
      </div>

      {/* Partner Modal */}
      <AnimatePresence>
        {showPartnerModal && (
          <PartnerModal
            onSave={handleAddPartner}
            onClose={() => setShowPartnerModal(false)}
          />
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <QRModal
            partner={partners.find(p => p.id === showQRModal)!}
            onClose={() => setShowQRModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// PARTNER MODAL
// =============================================================================

interface PartnerModalProps {
  onSave: (partner: Omit<ProfitSharePartner, 'id' | 'partner_key' | 'qr_code_data'>) => void;
  onClose: () => void;
}

function PartnerModal({ onSave, onClose }: PartnerModalProps) {
  const [formData, setFormData] = useState({
    partner_name: '',
    recipient_type: 'other' as ProfitSharePartner['recipient_type'],
    recipient_email: '',
    split_percent: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partner_name.trim() || formData.split_percent <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold">Add Profit Share Partner</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Partner Name *</label>
            <input
              type="text"
              value={formData.partner_name}
              onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
              placeholder="Venue, Promoter, etc."
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Partner Type *</label>
            <select
              value={formData.recipient_type}
              onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value as ProfitSharePartner['recipient_type'] })}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
            >
              <option value="venue">Venue</option>
              <option value="promoter">Promoter</option>
              <option value="sponsor">Sponsor</option>
              <option value="artist">Artist</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email (Optional)</label>
            <input
              type="email"
              value={formData.recipient_email}
              onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
              placeholder="partner@example.com"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Split Percentage *</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={formData.split_percent}
                onChange={(e) => setFormData({ ...formData, split_percent: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="w-16 text-right font-bold">{formData.split_percent}%</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-accent-yellow text-black rounded-lg font-bold hover:bg-accent-yellow/90"
            >
              Add Partner
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// =============================================================================
// QR CODE MODAL
// =============================================================================

interface QRModalProps {
  partner: ProfitSharePartner;
  onClose: () => void;
}

function QRModal({ partner, onClose }: QRModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Partner QR Code</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg inline-block">
            <QRCodeSVG value={partner.qr_code_data || partner.partner_key} size={200} />
          </div>
          <div>
            <p className="font-bold mb-1">{partner.partner_name}</p>
            <p className="text-sm text-gray-400 font-mono break-all">
              {partner.partner_key}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(partner.partner_key);
              alert('Partner key copied to clipboard!');
            }}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
          >
            Copy Partner Key
          </button>
        </div>
      </motion.div>
    </div>
  );
}

