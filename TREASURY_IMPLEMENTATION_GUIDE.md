# 🏦 Treasury Protocol - Implementation Guide

**Status:** ✅ Foundation Complete, Ready for Integration  
**Created:** November 10, 2025  
**Sprint:** Week 1, Days 1-2

---

## 📦 What We Just Built

### ✅ Complete Database Schema
**File:** `/database/migrations/007_treasury_complete.sql`

**10 Core Tables:**
1. `ledger_entries` - Double-entry accounting system
2. `stripe_accounts` - Stripe Connect accounts
3. `split_rules` - Revenue sharing configuration
4. `payouts` - Payout queue and history
5. `purchases` - Stripe checkout records
6. `refunds` - Refund processing
7. `disputes` - Chargeback tracking
8. `event_tickets` - Concierto integration
9. `cals_attribution_ledger` - Referral credits
10. `stripe_webhook_log` - Idempotency tracking
11. `audit_logs` - Admin action trail

**Features:**
- ✅ RLS policies (row-level security)
- ✅ Indexes for performance
- ✅ Helper functions (paired entries, balance queries)
- ✅ Validation functions (ledger balance check)

---

### ✅ Core Service Libraries
**Location:** `/src/lib/treasury/`

**1. `ledgerService.ts`** - Double-Entry Ledger
- `createLedgerEntry()` - Single entry
- `createPairedEntries()` - Debit/credit pairs (THE CORE!)
- `getUserBalance()` - Balance queries
- `validateLedgerBalance()` - Health check

**2. `webhookHandler.ts`** - Stripe Webhook Processing
- `verifyWebhookSignature()` - Security
- `processWebhook()` - Main router
- `handleCheckoutCompleted()` - THE GOLDEN PATH
- Idempotency checking
- Fulfillment logic

**3. `splitEngine.ts`** - Revenue Sharing
- `applySplits()` - Calculate and apply splits
- `getSplitRules()` - Lookup configuration
- Default splits: 70% artist, 20% platform, 10% host

**4. `payoutScheduler.ts`** - Payout Management
- `queuePayout()` - Add to queue
- `processPendingPayouts()` - Batch processor
- Risk scoring
- Stripe Transfer integration

---

### ✅ Admin Dashboard
**File:** `/src/app/admin/treasury/page.tsx`

**Features:**
- Real-time system health
- Webhook queue monitoring
- Pending payouts tracking
- Recent transactions feed
- Ledger balance validation
- Auto-refresh (10 seconds)

---

## 🚀 Next Steps (Complete the Golden Path)

### Step 1: Database Setup (5 minutes)

```bash
# Navigate to your Supabase project
cd /Users/pks.ml/Desktop/93/my-app

# Run the migration
# Option A: Supabase CLI
supabase db push database/migrations/007_treasury_complete.sql

# Option B: Supabase Dashboard
# Go to: SQL Editor → New Query → Paste file contents → Run
```

**Verify:**
- All 10 tables exist
- RLS policies active
- Helper functions created

---

### Step 2: Stripe Setup (10 minutes)

#### 2.1 Create Stripe Test Account
1. Go to https://stripe.com/
2. Sign up for account
3. Switch to **Test Mode** (top right)

#### 2.2 Get API Keys
**Dashboard → Developers → API Keys**

You need:
- ✅ Publishable key (`pk_test_...`)
- ✅ Secret key (`sk_test_...`)

#### 2.3 Create Webhook Endpoint
**Dashboard → Developers → Webhooks**

1. Click "Add endpoint"
2. URL: `https://your-domain.com/api/stripe/webhook`
   - (For local: use Stripe CLI forwarding)
3. Events to send:
   - `checkout.session.completed` ⭐ CRITICAL
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `charge.dispute.created`
4. Copy **Signing Secret** (`whsec_...`)

#### 2.4 Update .env File

```bash
# /Users/pks.ml/Desktop/93/my-app/.env

# Stripe Keys (Test Mode)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Optional: Connect (for artist payouts)
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CLIENT_ID
```

---

### Step 3: Create Platform Reserve Account (2 minutes)

**Update:** `/src/lib/treasury/ledgerService.ts`

```typescript
// Line 40: Replace with your actual platform account UUID
export const PLATFORM_RESERVE_ID = 'YOUR_ACTUAL_PLATFORM_USER_ID'
```

**How to get platform user ID:**

```sql
-- Run in Supabase SQL Editor
SELECT id FROM auth.users WHERE email = 'admin@buckets.media';
-- Or create a dedicated platform account:
INSERT INTO auth.users (email, encrypted_password)
VALUES ('platform@buckets.media', crypt('secure_password', gen_salt('bf')))
RETURNING id;
```

---

### Step 4: Implement Passport Integration (15 minutes)

**Create:** `/src/lib/passport/passportClient.ts`

```typescript
import { supabase } from '../supabaseClient'

/**
 * Log event to Passport (#0)
 * 
 * All Treasury events must log here for audit trail
 */
export async function logEvent(
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  try {
    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('passport_entries').insert({
      user_id: user?.id,
      event_type: eventType,
      event_data: data,
      system_routing: getSystemRouting(eventType),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log to Passport:', error)
    // Don't throw - logging failure shouldn't break main flow
  }
}

/**
 * Route events to Trinity systems
 */
function getSystemRouting(eventType: string): string[] {
  const routes: string[] = []
  
  if (eventType.startsWith('treasury.')) {
    routes.push('treasury', 'coliseum') // Always route Treasury → Coliseum
  }
  
  if (eventType.includes('attribution')) {
    routes.push('cals')
  }
  
  return routes
}

export default { logEvent }
```

---

### Step 5: Create Webhook API Route (20 minutes)

**Create:** `/src/app/api/stripe/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, processWebhook } from '@/lib/treasury/webhookHandler'

export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const body = await request.text()
    
    // Get Stripe signature
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log('[Webhook] Received:', event.type)

    // Process webhook
    await processWebhook(event)

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

---

### Step 6: Create Checkout API Route (20 minutes)

**Create:** `/src/app/api/stripe/create-checkout-session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      mode = 'payment',
      intent,
      productType,
      productId,
      eventId,
      userId,
      tier,
      amountCents,
      successUrl,
      cancelUrl
    } = body

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: mode,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${productType} - ${tier || 'General'}`,
              description: `Purchase from Buckets`
            },
            unit_amount: amountCents
          },
          quantity: 1
        }
      ],
      metadata: {
        intent,
        productType,
        productId,
        eventId,
        userId,
        tier
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error: any) {
    console.error('[Checkout] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

### Step 7: Build useStripeCheckout Hook (15 minutes)

**Create:** `/src/hooks/useStripeCheckout.ts`

```typescript
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiateCheckout = async (params: {
    productType: string
    productId: string
    eventId?: string
    tier?: string
    amountCents: number
    userId: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          intent: 'purchase',
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
      
      if (stripeError) {
        throw new Error(stripeError.message)
      }

    } catch (err: any) {
      setError(err.message)
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { initiateCheckout, loading, error }
}
```

---

### Step 8: Create Ticket Checkout Component (30 minutes)

**Create:** `/src/components/concierto/TicketCheckoutCard.tsx`

```typescript
'use client'

import { useStripeCheckout } from '@/hooks/useStripeCheckout'
import { formatCentsToDollars } from '@/lib/treasury/ledgerService'

interface TicketTier {
  name: string
  price: number // cents
  quantity: number
  perks: string[]
}

interface TicketCheckoutCardProps {
  eventId: string
  tiers: TicketTier[]
  userId: string
}

export default function TicketCheckoutCard({
  eventId,
  tiers,
  userId
}: TicketCheckoutCardProps) {
  const { initiateCheckout, loading, error } = useStripeCheckout()

  const handlePurchase = async (tier: TicketTier) => {
    await initiateCheckout({
      productType: 'ticket',
      productId: eventId,
      eventId: eventId,
      tier: tier.name,
      amountCents: tier.price,
      userId
    })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Get Your Ticket</h3>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div 
            key={tier.name}
            className="border border-gray-700 rounded-lg p-4 hover:border-primary-500 transition"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">{tier.name}</h4>
              <span className="text-xl font-bold text-primary-500">
                {formatCentsToDollars(tier.price)}
              </span>
            </div>

            <ul className="space-y-1 mb-4 text-sm text-gray-400">
              {tier.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {perk}
                </li>
              ))}
            </ul>

            <div className="text-sm text-gray-500 mb-4">
              {tier.quantity} tickets available
            </div>

            <button
              onClick={() => handlePurchase(tier)}
              disabled={loading || tier.quantity === 0}
              className="w-full py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Buy Ticket'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 🧪 Testing the Golden Path

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# This will give you a webhook signing secret starting with whsec_
# Update your .env with this secret
```

### Test Flow

1. **Start your dev server**
   ```bash
   npm run dev
   ```

2. **Create a test event with tickets**
   - Go to Concierto
   - Create event
   - Add ticket tiers

3. **Attempt ticket purchase**
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

4. **Watch the magic happen**
   ```bash
   # Terminal 1: Your app logs
   # Terminal 2: Stripe CLI logs
   
   # You should see:
   ✓ Checkout session created
   ✓ Redirect to Stripe Checkout
   ✓ Payment successful
   ✓ Webhook received: checkout.session.completed
   ✓ Purchase record created
   ✓ Ledger entries created (debit fan, credit platform)
   ✓ Splits applied (70% artist, 20% platform, 10% host)
   ✓ Payouts queued
   ✓ Ticket issued
   ✓ All events logged to Passport
   ```

5. **Verify in database**
   ```sql
   -- Check purchase
   SELECT * FROM purchases ORDER BY created_at DESC LIMIT 1;
   
   -- Check ledger entries (should be 5: purchase + 2 splits)
   SELECT * FROM ledger_entries ORDER BY created_at DESC LIMIT 10;
   
   -- Check ticket
   SELECT * FROM event_tickets ORDER BY created_at DESC LIMIT 1;
   
   -- Check payouts
   SELECT * FROM payouts WHERE status = 'pending';
   
   -- Validate ledger balance
   SELECT * FROM validate_ledger_balance();
   -- Should return: is_balanced = true, total_imbalance = 0
   ```

6. **Check Admin Dashboard**
   - Go to `/admin/treasury`
   - Should show:
     - Recent transaction
     - Pending payouts
     - Ledger balanced ✓

---

## 📊 Success Criteria

**Before moving to Week 1 Day 3-5:**

- [ ] All database tables exist and queryable
- [ ] Stripe test mode configured
- [ ] Webhook receiving events
- [ ] Can complete test ticket purchase
- [ ] Ledger entries created correctly (paired)
- [ ] Splits calculated correctly (70/20/10)
- [ ] Payouts queued
- [ ] Ticket issued
- [ ] Admin dashboard shows data
- [ ] Ledger validates as balanced
- [ ] No console errors

---

## 🚨 Common Issues & Fixes

### Issue: "Webhook signature verification failed"
**Fix:** Check that `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output

### Issue: "Missing userId in checkout session metadata"
**Fix:** Ensure `userId` is passed in checkout params

### Issue: "Ledger imbalance detected"
**Fix:** Check that every `createPairedEntries()` call completes both entries

### Issue: "Platform reserve not found"
**Fix:** Update `PLATFORM_RESERVE_ID` in ledgerService.ts

### Issue: "Passport logging fails"
**Fix:** Verify `passport_entries` table exists from Passport migration

---

## 📚 Next Phase (Week 1 Days 3-5)

Once golden path works:

1. **CALS Attribution Integration**
   - Track link opens
   - Generate attribution credits
   - Flow into ledger

2. **Nightly Payout Batch**
   - Supabase Edge Function
   - Cron trigger (2am UTC)
   - Process pending payouts

3. **Refund Flow**
   - User requests refund
   - Create reversals
   - Update balances

4. **User Dashboards**
   - Artist: Balance, earnings, payout history
   - Host: Event revenue, splits
   - Fan: Purchase history, tickets

---

## 🎯 You Are Here

```
✅ Week 1 Days 1-2: Foundation COMPLETE
   ├── ✅ Database schema
   ├── ✅ Core services
   ├── ✅ Webhook handler
   └── ✅ Admin dashboard

⏳ Week 1 Days 3-5: Golden Path Integration
   ├── [ ] Stripe setup
   ├── [ ] API routes
   ├── [ ] UI components
   └── [ ] End-to-end test

→ Week 2: Splits, Payouts, CALS
→ Week 3: Refunds, Admin Tools
→ Week 4: Polish, Production
```

---

## 💪 You've Got This!

The hardest part (architecture) is DONE. Now it's execution:

1. Run migration ✓
2. Get Stripe keys ✓
3. Connect the dots ✓
4. Test the flow ✓
5. Ship it! 🚀

**Next command to run:**
```bash
# Apply the database migration
supabase db push database/migrations/007_treasury_complete.sql
```

---

**Questions? Check:**
- `Documents/TREASURY_MVP_EXECUTIVE_SYNTHESIS.md` - Full architecture
- `Documents/Treasury_MVP_Integration_Plan.md` - Code examples
- `Documents/Treasury_Alignment_Summary.md` - Visual diagrams

**Let's ship this MVP! 🎉**

