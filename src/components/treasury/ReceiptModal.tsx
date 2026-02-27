/**
 * ReceiptModal Component
 * 
 * Post-purchase receipt with link to wallet
 * Shows purchase details, payment method, and next steps
 */

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XMarkIcon,
  TicketIcon,
  CreditCardIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

// =============================================================================
// TYPES
// =============================================================================

export interface ReceiptData {
  purchaseId: string;
  sessionId: string;
  
  // Line Items
  items: {
    name: string;
    description?: string;
    quantity: number;
    priceCents: number;
  }[];
  
  // Totals
  subtotalCents: number;
  feeCents?: number;
  totalCents: number;
  currency: string;
  
  // Event Details (for tickets)
  event?: {
    title: string;
    date: string;
    venue: string;
    imageUrl?: string;
  };
  
  // Payment Info
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  
  // Ticket Info
  ticketNumber?: string;
  tier?: string;
  
  // Metadata
  purchasedAt: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const navigate = useNavigate();

  if (!receipt) return null;

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleViewTicket = () => {
    onClose();
    navigate('/wallet');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                
                {/* Header - Success State */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white relative overflow-hidden">
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>

                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="flex justify-center mb-4"
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <CheckCircleIcon className="w-10 h-10" />
                    </div>
                  </motion.div>

                  <h2 className="text-2xl font-bold text-center mb-2">Payment Successful!</h2>
                  <p className="text-white/90 text-center text-sm">
                    Your ticket has been issued
                  </p>

                  {/* Receipt ID */}
                  <p className="text-white/60 text-center text-xs font-mono mt-3">
                    {receipt.purchaseId.slice(0, 16)}...
                  </p>
                </div>

                {/* Body - Receipt Details */}
                <div className="p-6 space-y-6">
                  
                  {/* Event Details (if ticket) */}
                  {receipt.event && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <TicketIcon className="w-5 h-5 text-purple-500" />
                        Event Details
                      </h3>
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">{receipt.event.title}</p>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{formatDate(receipt.event.date)}</span>
                        </div>
                        {receipt.event.venue && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{receipt.event.venue}</span>
                          </div>
                        )}
                        {receipt.ticketNumber && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Ticket Number
                            </p>
                            <p className="font-mono text-sm font-medium text-gray-900">
                              {receipt.ticketNumber}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Line Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                    <div className="space-y-2">
                      {receipt.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <p className="text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-gray-500 text-xs">{item.description}</p>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">
                            ${formatCents(item.priceCents)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">${formatCents(receipt.subtotalCents)}</span>
                    </div>
                    {receipt.feeCents && receipt.feeCents > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="text-gray-900">${formatCents(receipt.feeCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-purple-600">${formatCents(receipt.totalCents)}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {receipt.paymentMethod.brand || 'Card'} ending in {receipt.paymentMethod.last4 || '••••'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(receipt.purchasedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer - Actions */}
                <div className="p-6 pt-0 space-y-3">
                  
                  {/* Primary Action - View Ticket */}
                  <button
                    onClick={handleViewTicket}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 group"
                  >
                    <TicketIcon className="w-5 h-5" />
                    <span>View My Ticket</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="py-2 px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        // TODO: Implement PDF download
                        console.log('Download receipt PDF');
                      }}
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      className="py-2 px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        // TODO: Implement email receipt
                        console.log('Email receipt');
                      }}
                    >
                      <EnvelopeIcon className="w-4 h-4" />
                      Email
                    </button>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default ReceiptModal;

