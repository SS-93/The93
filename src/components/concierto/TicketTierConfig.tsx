/**
 * Ticket Tier Configuration Component
 * 
 * Allows hosts to configure ticket tiers with pricing, perks, and availability
 * Non-intrusive addition to EventCreator (Step 4)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES
// =============================================================================

export interface TicketTier {
  id: string;
  name: string;
  price_cents: number;
  quantity: number;
  available: number;
  perks: string[];
  description?: string;
  sales_start?: string;
  sales_end?: string;
}

interface TicketTierConfigProps {
  ticketingEnabled: boolean;
  onTicketingToggle: (enabled: boolean) => void;
  tiers: TicketTier[];
  onTiersChange: (tiers: TicketTier[]) => void;
  hideToggle?: boolean; // Hide the enable/disable toggle if already handled externally
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TicketTierConfig({
  ticketingEnabled,
  onTicketingToggle,
  tiers,
  onTiersChange,
  hideToggle = false
}: TicketTierConfigProps) {
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<TicketTier | null>(null);

  const handleAddTier = () => {
    setEditingTier(null);
    setShowTierModal(true);
  };

  const handleEditTier = (tier: TicketTier) => {
    setEditingTier(tier);
    setShowTierModal(true);
  };

  const handleDeleteTier = (tierId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this ticket tier?')) {
      onTiersChange(tiers.filter(t => t.id !== tierId));
    }
  };

  const handleSaveTier = (tierData: Omit<TicketTier, 'id' | 'available'>) => {
    if (editingTier) {
      // Update existing tier
      const updated = tiers.map(t =>
        t.id === editingTier.id
          ? { ...tierData, id: t.id, available: t.available }
          : t
      );
      onTiersChange(updated);
    } else {
      // Add new tier
      const newTier: TicketTier = {
        ...tierData,
        id: `tier_${Date.now()}`,
        available: tierData.quantity
      };
      onTiersChange([...tiers, newTier]);
    }
    setShowTierModal(false);
    setEditingTier(null);
  };

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Enable Ticketing Toggle - Only show if not hidden */}
      {!hideToggle && (
        <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-accent-yellow" />
              Ticket Sales
            </h3>
            <p className="text-sm text-gray-400">
              Enable ticket sales for this event and configure pricing tiers
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm text-gray-400">Enable Ticketing</span>
            <input
              type="checkbox"
              checked={ticketingEnabled}
              onChange={(e) => onTicketingToggle(e.target.checked)}
              className="w-5 h-5 bg-black border border-gray-700 rounded focus:border-accent-yellow"
            />
          </label>
        </div>
      )}

      {ticketingEnabled && (
        <div className="space-y-4">
          {/* Add Tier Button */}
          <button
            onClick={handleAddTier}
            className="w-full px-4 py-3 bg-accent-yellow text-black rounded-lg font-bold hover:bg-accent-yellow/90 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Ticket Tier
          </button>

          {/* Tier List */}
          {tiers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TicketIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No ticket tiers configured</p>
              <p className="text-sm mt-1">Click "Add Ticket Tier" to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiers.map((tier) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{tier.name}</h4>
                      <p className="text-2xl font-bold text-accent-yellow">
                        ${formatCents(tier.price_cents)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTier(tier)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Edit tier"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTier(tier.id)}
                        className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                        aria-label="Delete tier"
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {tier.description && (
                    <p className="text-sm text-gray-400 mb-3">{tier.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Available:</span>
                      <span className="font-medium">{tier.available} / {tier.quantity}</span>
                    </div>
                    {tier.perks.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-400">Perks:</span>
                        <ul className="list-disc list-inside text-sm text-gray-300 mt-1">
                          {tier.perks.map((perk, idx) => (
                            <li key={idx}>{perk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Revenue Preview */}
          {tiers.length > 0 && (
            <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <h4 className="font-bold mb-2">💰 Revenue Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Capacity:</span>
                  <p className="text-lg font-bold">
                    {tiers.reduce((sum, t) => sum + t.quantity, 0)} tickets
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Potential Revenue:</span>
                  <p className="text-lg font-bold text-green-400">
                    ${formatCents(
                      tiers.reduce((sum, t) => sum + (t.quantity * t.price_cents), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tier Modal */}
      <AnimatePresence>
        {showTierModal && (
          <TierModal
            tier={editingTier}
            onSave={handleSaveTier}
            onClose={() => {
              setShowTierModal(false);
              setEditingTier(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TIER MODAL COMPONENT
// =============================================================================

interface TierModalProps {
  tier: TicketTier | null;
  onSave: (tier: Omit<TicketTier, 'id' | 'available'>) => void;
  onClose: () => void;
}

function TierModal({ tier, onSave, onClose }: TierModalProps) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    price_cents: tier?.price_cents || 0,
    quantity: tier?.quantity || 0,
    description: tier?.description || '',
    perks: tier?.perks || [],
    sales_start: tier?.sales_start || '',
    sales_end: tier?.sales_end || ''
  });
  const [newPerk, setNewPerk] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price_cents <= 0 || formData.quantity <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      setFormData({
        ...formData,
        perks: [...formData.perks, newPerk.trim()]
      });
      setNewPerk('');
    }
  };

  const handleRemovePerk = (index: number) => {
    setFormData({
      ...formData,
      perks: formData.perks.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold">
            {tier ? 'Edit Ticket Tier' : 'Add Ticket Tier'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tier Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="General Admission, VIP, Backstage..."
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
              required
            />
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={(formData.price_cents / 100).toFixed(2)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_cents: Math.round(parseFloat(e.target.value) * 100)
                  })
                }
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's included in this tier..."
              rows={3}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
            />
          </div>

          {/* Perks */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Perks / Benefits
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPerk}
                onChange={(e) => setNewPerk(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPerk();
                  }
                }}
                placeholder="Add a perk (e.g., VIP lounge access)"
                className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPerk}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {formData.perks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.perks.map((perk, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-900/30 border border-purple-700/50 rounded-lg text-sm flex items-center gap-2"
                  >
                    {perk}
                    <button
                      type="button"
                      onClick={() => handleRemovePerk(idx)}
                      className="hover:text-red-400"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sales Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sales Start (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.sales_start}
                onChange={(e) => setFormData({ ...formData, sales_start: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Sales End (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.sales_end}
                onChange={(e) => setFormData({ ...formData, sales_end: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-accent-yellow text-black rounded-lg font-bold hover:bg-accent-yellow/90 transition-colors"
            >
              {tier ? 'Update Tier' : 'Create Tier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

