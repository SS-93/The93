# 🚀 Quick Start - Ticket Checkout with Stripe

## Step 1: Get Your Stripe Test Keys

1. Visit [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Toggle to **Test mode** (top right)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

## Step 2: Configure Environment Variables

### Frontend (.env)
Edit: `/Users/pks.ml/Desktop/93/my-app/.env`

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
REACT_APP_API_URL=http://localhost:8000
```

### Backend (.env)
Create: `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/.env`

```bash
# Copy from env.template and add:
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Also add your Supabase credentials:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Start All Servers

Open **3 terminal windows**:

### Terminal 1: Backend (Deno)
```bash
cd /Users/pks.ml/Desktop/EPK-93/Buckets_SB
deno run --allow-net --allow-env --allow-read api/router.ts
```
✅ Backend runs on **http://localhost:8000**

### Terminal 2: Frontend (React)
```bash
cd /Users/pks.ml/Desktop/93/my-app
npm start
```
✅ Frontend runs on **http://localhost:3000**

### Terminal 3: Stripe Webhooks
```bash
# Run from anywhere - it just forwards webhooks
stripe listen --forward-to localhost:8000/stripe/webhook
```

⚠️ **IMPORTANT**: Copy the webhook signing secret that appears (starts with `whsec_`) and add it to your backend `.env` file as `STRIPE_WEBHOOK_SECRET`

Then restart Terminal 1 (backend server).

## Step 4: Test It Out!

1. Go to http://localhost:3000/test-checkout
2. Click "Purchase Ticket"
3. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. Complete payment
5. Watch Terminal 3 for webhook events! 🎉

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Browser (localhost:3000)                                   │
│  ├─ React App                                               │
│  ├─ useStripeCheckout hook                                  │
│  └─ TicketCheckoutCard component                            │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ POST /stripe/create-checkout-session
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Backend (localhost:8000)                                   │
│  ├─ Deno server at EPK-93/Buckets_SB                       │
│  ├─ Routes/stripe.ts                                        │
│  └─ Creates Stripe session                                  │
│                                                             │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ Returns sessionId          │ POST /stripe/webhook
             ▼                            │ (payment complete)
┌─────────────────────────┐               │
│  Stripe Checkout        │               │
│  (hosted by Stripe)     │               │
│  - User enters card     │               │
│  - Processes payment    │───────────────┘
└─────────────────────────┘
                                          │
                                          ▼
                                    ┌──────────────────┐
                                    │  Stripe CLI      │
                                    │  Forwards events │
                                    │  to backend      │
                                    └──────────────────┘
```

## Troubleshooting

### ❌ "Stripe publishable key not configured"
- Check `/Users/pks.ml/Desktop/93/my-app/.env` exists
- Verify `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- Restart frontend server (`npm start`)

### ❌ "Failed to create checkout session"
- Check backend is running on port 8000
- Verify `STRIPE_SECRET_KEY` in backend `.env`
- Check backend terminal for errors

### ❌ Webhooks not firing
- Stripe CLI must be running: `stripe listen --forward-to localhost:8000/stripe/webhook`
- Copy webhook secret from CLI output to backend `.env`
- Restart backend server

### ❌ CORS errors
- Backend should allow `localhost:3000` in CORS (check `Buckets_SB/middleware/cors.ts`)

## What's Next?

- [ ] Run Treasury database migration (`007_treasury_complete.sql`)
- [ ] Test full flow: Purchase → Webhook → Ledger → Splits
- [ ] Configure Supabase credentials
- [ ] Build out admin dashboard (`/admin/treasury`)
- [ ] Implement CALS attribution tracking
- [ ] Set up nightly payout batch job

## Test Cards

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0025 0000 3155` | 🔐 Requires auth |

## Files Reference

- Frontend hook: `93/my-app/src/hooks/useStripeCheckout.ts`
- Backend routes: `EPK-93/Buckets_SB/Routes/stripe.ts`
- Test page: `93/my-app/src/routes/test-checkout.tsx`
- Full guide: `STRIPE_SETUP_GUIDE.md`

