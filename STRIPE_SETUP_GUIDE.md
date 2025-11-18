# Stripe Setup Guide

## Quick Start

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test mode** (toggle in top right)
3. Copy your keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### 2. Configure Environment Variables

#### Frontend (.env file)

Create a `.env` file in `/Users/pks.ml/Desktop/93/my-app/`:

```bash
# Copy from .env.example
cp .env.example .env
```

Then add your Stripe publishable key:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
REACT_APP_API_URL=http://localhost:8000
```

#### Backend (.env file)

Create/update `.env` file in `/Users/pks.ml/Desktop/EPK-93/Buckets_SB/`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Other required vars (see env.template)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Start the Servers

#### Terminal 1: Backend (Deno Server)

```bash
cd /Users/pks.ml/Desktop/EPK-93/Buckets_SB
deno run --allow-net --allow-env --allow-read api/router.ts
```

Backend will run on **http://localhost:8000**

#### Terminal 2: Frontend (React App)

```bash
cd /Users/pks.ml/Desktop/93/my-app
npm start
```

Frontend will run on **http://localhost:3000**

#### Terminal 3: Stripe CLI (Webhook Forwarding)

```bash
# Login to Stripe CLI (one-time)
stripe login

# Forward webhooks to local backend (run from ANY directory)
stripe listen --forward-to localhost:8000/stripe/webhook
```

**Note**: The Stripe CLI can be run from any directory. It forwards webhook events from Stripe to your local backend server at port 8000.

⚠️ **Important**: Copy the webhook signing secret that appears (starts with `whsec_`) and add it to your backend `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Test the Checkout Flow

1. Navigate to http://localhost:3000/test-checkout
2. Click "Purchase Ticket"
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. Complete checkout
5. Check Terminal 3 for webhook events
6. Verify purchase in database

## Architecture

### Frontend (React - Port 3000)
- `useStripeCheckout` hook for initiating checkout
- `TicketCheckoutCard` component
- Redirects to Stripe Hosted Checkout

### Backend (Deno - Port 8000)
- `POST /stripe/create-checkout-session` - Create session
- `POST /stripe/webhook` - Process webhook events
- `POST /stripe/create-payment-intent` - For custom amounts
- `POST /stripe/create-portal-session` - Customer portal

### Stripe CLI (Port Forwarding)
- Forwards webhook events from Stripe to localhost:8000
- Required for local testing of purchase fulfillment

## API Routes

### Create Checkout Session
```
POST http://localhost:8000/stripe/create-checkout-session

Body:
{
  "mode": "payment",
  "intent": "ticket",
  "lineItems": [
    {
      "price": "price_xxx",
      "quantity": 1
    }
  ],
  "metadata": {
    "eventId": "uuid",
    "tier": "VIP",
    "userId": "uuid"
  },
  "successUrl": "http://localhost:3000/checkout/success",
  "cancelUrl": "http://localhost:3000/checkout/cancel"
}

Response:
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/xxx"
}
```

### Webhook Endpoint
```
POST http://localhost:8000/stripe/webhook

Headers:
- stripe-signature: xxx

Body: Stripe webhook event JSON
```

## Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Insufficient funds |

## Webhook Events Handled

- `checkout.session.completed` - Purchase fulfillment
- `payment_intent.succeeded` - Pledge confirmations
- `customer.subscription.updated` - Membership changes
- `customer.subscription.deleted` - Membership cancellations

## Troubleshooting

### Error: "Stripe publishable key not configured"

**Solution**: Add `REACT_APP_STRIPE_PUBLISHABLE_KEY` to frontend `.env` and restart React dev server

### Error: "Failed to create checkout session"

**Solutions**:
1. Check backend is running on port 8000
2. Verify `STRIPE_SECRET_KEY` is set in backend `.env`
3. Check browser console for detailed error

### Webhooks not working

**Solutions**:
1. Make sure Stripe CLI is running: `stripe listen --forward-to localhost:8000/stripe/webhook`
2. Copy webhook secret from CLI output to backend `.env` as `STRIPE_WEBHOOK_SECRET`
3. Restart backend server after updating env

### CORS errors

**Solution**: Backend should allow `localhost:3000` in CORS config (check `Buckets_SB/middleware/cors.ts`)

## Next Steps

1. ✅ Configure Stripe API keys
2. ✅ Create backend API routes
3. ✅ Build checkout UI
4. 🔲 Run database migration (007_treasury_complete.sql)
5. 🔲 Test full flow: Checkout → Webhook → Ledger
6. 🔲 Implement revenue splits
7. 🔲 Build admin dashboard

## Resources

- [Stripe Test Mode](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Checkout Sessions](https://stripe.com/docs/api/checkout/sessions)
- [Webhooks](https://stripe.com/docs/webhooks)

