# Buckets.MVP.Monetize - Implementation Plan

## 🎯 Mission
Transform the working Stripe checkout into a complete, user-delightful monetization experience that flows through Passport (event log), Treasury (money ledger), and Coliseum (engagement metrics).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER PURCHASES TICKET                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Stripe Checkout     │
                  │  (Hosted Payment)    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Webhook Handler     │
                  │  (server.js)         │
                  └──────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  PASSPORT   │  │  TREASURY   │  │  COLISEUM   │
    │ Event Log   │  │  Ledger     │  │  Metrics    │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
                            ▼
                  ┌──────────────────────┐
                  │   USER EXPERIENCE    │
                  ├──────────────────────┤
                  │ • Digital Ticket     │
                  │ • Receipt View       │
                  │ • Transaction History│
                  │ • Artist Dashboard   │
                  └──────────────────────┘
```

---

## 📋 Phase 1: Passport Transaction Events (Week 1, Days 1-2)

### Goal
Every financial event becomes an immutable Passport entry that drives all downstream systems.

### Database Schema Addition

```sql
-- Add to passport_events table (enum types)
ALTER TYPE passport_event_type ADD VALUE IF NOT EXISTS 'purchase.initiated';
ALTER TYPE passport_event_type ADD VALUE IF NOT EXISTS 'purchase.completed';
ALTER TYPE passport_event_type ADD VALUE IF NOT EXISTS 'purchase.failed';
ALTER TYPE passport_event_type ADD VALUE IF NOT EXISTS 'ticket.issued';
ALTER TYPE passport_event_type ADD VALUE IF NOT EXISTS 'ticket.validated';
ALTER TYPE passport_event_type ADD VALUE IF NOT EXISTS 'payout.scheduled';
ALTER TYPE passport_event_type ADD VALUE IF NOT EXISTS 'payout.completed';
```

### Backend Implementation

**File: `/lib/passport/moneyEvents.ts`**
```typescript
export async function logPurchaseInitiated(data: {
  userId: string
  sessionId: string
  eventId: string
  tier: string
  amountCents: number
}) {
  return await supabase.from('passport_events').insert({
    user_id: data.userId,
    event_type: 'purchase.initiated',
    event_category: 'financial',
    payload: {
      checkout_session_id: data.sessionId,
      event_id: data.eventId,
      tier: data.tier,
      amount_cents: data.amountCents,
      currency: 'usd'
    },
    timestamp: new Date().toISOString()
  })
}

export async function logPurchaseCompleted(data: {
  userId: string
  purchaseId: string
  sessionId: string
  paymentIntentId: string
  ticketId: string
}) {
  return await supabase.from('passport_events').insert({
    user_id: data.userId,
    event_type: 'purchase.completed',
    event_category: 'financial',
    payload: {
      purchase_id: data.purchaseId,
      checkout_session_id: data.sessionId,
      payment_intent_id: data.paymentIntentId,
      ticket_id: data.ticketId,
      fulfillment_status: 'issued'
    },
    timestamp: new Date().toISOString()
  })
}
```

### Integration Points

1. **Frontend Hook (`useStripeCheckout.ts`)**: Log `purchase.initiated` before redirect
2. **Backend Webhook (`server.js`)**: Log `purchase.completed` on `checkout.session.completed`
3. **Treasury Service**: Read Passport events to create ledger entries

---

## 📋 Phase 2: Digital Ticket System (Week 1, Days 3-5)

### Goal
Beautiful, functional tickets that live in Passport like Apple Wallet.

### Database Schema

```sql
CREATE TABLE event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  purchase_id uuid REFERENCES purchases(id) NOT NULL,
  
  -- Event details
  event_id uuid REFERENCES events(id) NOT NULL,
  tier text NOT NULL, -- 'general', 'vip', 'backstage'
  
  -- Ticket validation
  ticket_number text UNIQUE NOT NULL, -- e.g., "BKT-2024-001234"
  qr_code_data text NOT NULL, -- Signed JWT for validation
  validation_secret text NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'active', -- active, redeemed, transferred, cancelled
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES auth.users(id),
  
  -- Metadata
  issued_at timestamptz DEFAULT now(),
  valid_until timestamptz,
  metadata jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON event_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Event hosts can view tickets for their events"
  ON event_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_tickets.event_id
      AND e.host_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_event_tickets_user_id ON event_tickets(user_id);
CREATE INDEX idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX idx_event_tickets_status ON event_tickets(status);
CREATE INDEX idx_event_tickets_qr_code ON event_tickets(qr_code_data);
```

### UI Component: Ticket Card

**File: `/components/passport/TicketCard.tsx`**

Design inspired by Apple Wallet + Ticketmaster:

```typescript
interface TicketCardProps {
  ticket: {
    id: string
    ticketNumber: string
    event: {
      title: string
      date: string
      venue: string
      imageUrl: string
    }
    tier: string
    status: 'active' | 'redeemed' | 'expired'
    qrCodeData: string
  }
  variant?: 'compact' | 'full'
}

export function TicketCard({ ticket, variant = 'full' }: TicketCardProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Header with Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img src={ticket.event.imageUrl} className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold">{ticket.event.title}</h3>
          <p className="text-sm opacity-90">{ticket.tier.toUpperCase()} ACCESS</p>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="p-6 bg-white/10 backdrop-blur-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">Date & Time</p>
            <p className="text-white font-semibold">{formatDate(ticket.event.date)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70 uppercase tracking-wide">Venue</p>
            <p className="text-white font-semibold">{ticket.event.venue}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-xl p-4 flex justify-center mb-4">
          <QRCodeSVG value={ticket.qrCodeData} size={120} />
        </div>

        {/* Ticket Number */}
        <div className="text-center">
          <p className="text-xs text-white/70 uppercase tracking-widest mb-1">Ticket Number</p>
          <p className="text-white font-mono text-lg tracking-wider">{ticket.ticketNumber}</p>
        </div>

        {/* Status Badge */}
        {ticket.status === 'redeemed' && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
              ✓ REDEEMED
            </span>
          </div>
        )}
      </div>

      {/* Perforated Edge Effect */}
      <div className="absolute left-0 right-0 h-6" style={{ top: '192px' }}>
        <svg className="w-full h-full" preserveAspectRatio="none">
          <pattern id="perforation" x="0" y="0" width="20" height="6" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="3" r="3" fill="rgba(255,255,255,0.3)" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#perforation)" />
        </svg>
      </div>
    </motion.div>
  )
}
```

### Ticket Wallet Page

**File: `/routes/wallet.tsx`**

```typescript
export default function WalletPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Tickets</h1>
            <p className="text-gray-400">Your digital ticket wallet</p>
          </div>
          <WalletIcon className="w-12 h-12 text-purple-400" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['upcoming', 'past', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === tab
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>

        {tickets.length === 0 && (
          <div className="text-center py-16">
            <TicketIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No tickets yet</p>
            <p className="text-gray-500 text-sm">Purchase tickets to see them here</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 📋 Phase 3: Receipt & Transaction History (Week 2, Days 1-2)

### Receipt Modal Component

**File: `/components/treasury/ReceiptModal.tsx`**

```typescript
export function ReceiptModal({ purchaseId, isOpen, onClose }) {
  const [receipt, setReceipt] = useState(null)

  // Fetch purchase + ledger entries + splits
  useEffect(() => {
    if (purchaseId) {
      fetchReceiptData(purchaseId)
    }
  }, [purchaseId])

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="w-12 h-12" />
              <span className="text-sm font-mono">{receipt?.purchaseId}</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Payment Successful</h2>
            <p className="text-white/80 text-sm">Thank you for your purchase!</p>
          </div>

          {/* Receipt Body */}
          <div className="p-6 space-y-4">
            {/* Line Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{receipt?.tier} Ticket</span>
                <span className="font-medium">${formatCents(receipt?.amountCents)}</span>
              </div>
            </div>

            <Divider />

            {/* Event Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Event</h3>
              <p className="text-sm text-gray-600">{receipt?.eventTitle}</p>
              <p className="text-xs text-gray-500">{receipt?.eventDate}</p>
            </div>

            <Divider />

            {/* Payment Method */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">•••• {receipt?.last4}</span>
              </div>
            </div>

            <Divider />

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-purple-600">${formatCents(receipt?.amountCents)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 space-y-2">
            <button className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
              Download Receipt
            </button>
            <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              Email Receipt
            </button>
            <button
              onClick={() => router.push('/wallet')}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90"
            >
              View My Ticket →
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
```

### Transaction History Page

**File: `/routes/transactions.tsx`**

```typescript
export default function TransactionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Transaction History</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select className="px-4 py-2 border rounded-lg">
          <option>All Types</option>
          <option>Tickets</option>
          <option>Memberships</option>
          <option>Drops</option>
        </select>
        <input type="date" className="px-4 py-2 border rounded-lg" />
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TicketIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{tx.description}</h3>
                  <p className="text-sm text-gray-500">{formatDate(tx.date)}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{tx.id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">${formatCents(tx.amount)}</p>
                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 📋 Phase 4: Financial Dashboards (Week 2, Days 3-5)

### Fan Dashboard - "My Money"

- Total spent
- Upcoming events
- Active memberships
- Transaction history
- Referral earnings (CALS)

### Artist Dashboard - "My Revenue"

- Total revenue (this month)
- Pending payouts
- Revenue by source (tickets, drops, memberships)
- Top fans
- Payout history

### Brand Dashboard - "Campaign Performance"

- Sponsorship spend
- Reach & engagement (Coliseum)
- ROI tracking
- Invoice history

---

## 🎨 Design System

### Color Palette
- **Primary**: Purple (`#8B5CF6`)
- **Secondary**: Pink (`#EC4899`)
- **Success**: Green (`#10B981`)
- **Warning**: Amber (`#F59E0B`)
- **Error**: Red (`#EF4444`)

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Mono**: JetBrains Mono (for ticket numbers, IDs)

### Components to Build
1. `TicketCard` - Digital ticket display
2. `ReceiptModal` - Post-purchase receipt
3. `TransactionRow` - History list item
4. `RevenueChart` - Artist earnings viz
5. `PayoutCard` - Payout summary
6. `WalletHeader` - Wallet page hero

---

## 🔌 Integration Checklist

### Passport
- [ ] Log `purchase.initiated` on checkout start
- [ ] Log `purchase.completed` on webhook
- [ ] Log `ticket.issued` when ticket generated
- [ ] Log `ticket.validated` on scan/redemption

### Treasury
- [ ] Create ledger entries from Passport events
- [ ] Apply revenue splits
- [ ] Track balances
- [ ] Schedule payouts

### Coliseum
- [ ] Track ticket purchases as engagement
- [ ] Count redemptions
- [ ] Leaderboard for top ticket buyers
- [ ] Event attendance metrics

---

## 📦 Deliverables

### Week 1
- [x] Working Stripe checkout
- [ ] Passport money events
- [ ] Digital ticket system
- [ ] Ticket wallet page

### Week 2
- [ ] Receipt modal
- [ ] Transaction history
- [ ] Fan dashboard
- [ ] Artist revenue dashboard

### Week 3
- [ ] QR code validation system
- [ ] Ticket transfer functionality
- [ ] Email receipt via Resend
- [ ] Revenue analytics

---

## 🚀 Next Immediate Steps

1. **Create Passport money events** (`/lib/passport/moneyEvents.ts`)
2. **Build TicketCard component** (Apple Wallet style)
3. **Create event_tickets table** (migration)
4. **Build /wallet route** (user's tickets)
5. **Integrate receipt modal** (post-checkout)

This gives users the full "I just bought something awesome" experience! 🎉

