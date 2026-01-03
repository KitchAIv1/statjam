# Stripe Video Credits Setup Guide

This guide walks you through setting up Stripe for one-time video credit purchases.

## Overview

Video credits are **one-time payments** (not subscriptions) that allow coaches to purchase game tracking credits in packages:

| Package | Credits | Price | Per Game |
|---------|---------|-------|----------|
| Single Game | 1 | $25 | $25.00 |
| Starter Pack | 5 | $99 | $19.80 |
| Season Pack | 11 | $199 | $18.09 |
| Pro Season | 23 | $399 | $17.35 |

---

## Step 1: Get Stripe API Keys

### Test Mode (Development)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Live Mode (Production)

1. Complete Stripe account verification
2. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Copy your **Publishable key** (starts with `pk_live_`)
4. Copy your **Secret key** (starts with `sk_live_`)

---

## Step 2: Create Video Credit Products

### In Test Mode

1. Go to [Stripe Test Products](https://dashboard.stripe.com/test/products)
2. Click **+ Add product**

### Create 4 Products:

#### Product 1: Single Game
- **Name**: `Video Credits - Single Game`
- **Description**: `1 game video tracking credit`
- **Price**: `$25.00` (USD)
- **Billing**: `One time` ⚠️ NOT recurring!
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)

#### Product 2: Starter Pack
- **Name**: `Video Credits - Starter Pack`
- **Description**: `5 game video tracking credits`
- **Price**: `$99.00` (USD)
- **Billing**: `One time`
- Copy the **Price ID**

#### Product 3: Season Pack
- **Name**: `Video Credits - Season Pack`
- **Description**: `11 game video tracking credits`
- **Price**: `$199.00` (USD)
- **Billing**: `One time`
- Copy the **Price ID**

#### Product 4: Pro Season
- **Name**: `Video Credits - Pro Season`
- **Description**: `23 game video tracking credits`
- **Price**: `$399.00` (USD)
- **Billing**: `One time`
- Copy the **Price ID**

---

## Step 3: Set Up Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **+ Add endpoint**
3. Enter your endpoint URL:
   - **Local dev**: Use [Stripe CLI](#local-testing-with-stripe-cli)
   - **Production**: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed` ✅ (Required)
   - `customer.subscription.updated` (Optional)
   - `customer.subscription.deleted` (Optional)
   - `invoice.payment_succeeded` (Optional)
   - `invoice.payment_failed` (Optional)
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

---

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Video Credit Price IDs (One-Time Payments)
NEXT_PUBLIC_STRIPE_PRICE_VIDEO_SINGLE=price_your_single_game_price_id
NEXT_PUBLIC_STRIPE_PRICE_VIDEO_STARTER=price_your_starter_pack_price_id
NEXT_PUBLIC_STRIPE_PRICE_VIDEO_SEASON=price_your_season_pack_price_id
NEXT_PUBLIC_STRIPE_PRICE_VIDEO_PRO_SEASON=price_your_pro_season_price_id
```

---

## Step 5: Local Testing with Stripe CLI

For local development, use the Stripe CLI to forward webhooks:

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Login to Stripe

```bash
stripe login
```

### Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output a webhook signing secret like:
```
Ready! Your webhook signing secret is whsec_xxxxxxxxx
```

Copy this secret to your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### Test a Checkout

1. Start your dev server: `npm run dev`
2. In Stripe CLI terminal, keep `stripe listen` running
3. Navigate to Coach dashboard and click "Buy Video Credits"
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Watch the Stripe CLI for webhook events

---

## Step 6: Going Live

### Prerequisites
- Complete Stripe account verification
- Set up business details in Stripe Dashboard

### Create Live Products
1. Switch to Live mode in Stripe Dashboard
2. Recreate all 4 video credit products (same as Step 2)
3. Copy the new live Price IDs

### Update Production Environment
Replace test keys with live keys:
- `pk_test_` → `pk_live_`
- `sk_test_` → `sk_live_`
- Update all `price_` IDs with live versions

### Set Up Live Webhook
1. Go to [Stripe Live Webhooks](https://dashboard.stripe.com/webhooks)
2. Add your production endpoint
3. Copy the live webhook secret

---

## Testing Checklist

### Test Mode
- [ ] Products created with correct prices
- [ ] All 4 price IDs configured in `.env.local`
- [ ] Stripe CLI forwarding webhooks
- [ ] Can complete checkout with test card
- [ ] Webhook fires `checkout.session.completed`
- [ ] Video credits added to user's subscription record

### Live Mode
- [ ] Live products created
- [ ] Live keys configured in production
- [ ] Production webhook endpoint set up
- [ ] Test with real card (can refund immediately)

---

## Troubleshooting

### "Stripe not configured" Error
- Check `STRIPE_SECRET_KEY` is set correctly
- Ensure no spaces or quotes around the value

### "This package is not available yet" Error
- The price ID is missing or undefined
- Check `NEXT_PUBLIC_STRIPE_PRICE_VIDEO_*` env vars

### Webhook Not Firing
- Ensure `stripe listen` is running (local dev)
- Check webhook endpoint URL is correct
- Verify webhook events are selected

### Credits Not Added After Payment
- Check Supabase `subscriptions` table structure
- Look for errors in webhook logs
- Verify `STRIPE_WEBHOOK_SECRET` is correct

---

## File References

| File | Purpose |
|------|---------|
| `/src/config/pricing.ts` | Video credit package definitions |
| `/src/app/api/stripe/webhook/route.ts` | Webhook handler (adds credits) |
| `/src/app/api/stripe/create-checkout-session/route.ts` | Creates checkout session |
| `/src/lib/services/stripeService.ts` | Frontend Stripe integration |
| `/src/components/subscription/VideoCreditsModal.tsx` | Purchase UI modal |
| `/src/lib/services/subscriptionService.ts` | Credit balance queries |

---

## Database Schema

The webhook updates the `subscriptions` table:

```sql
-- User's video credits are stored in subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS video_credits INTEGER DEFAULT 0;

-- After purchase, credits are added:
UPDATE subscriptions 
SET video_credits = video_credits + credits_purchased
WHERE user_id = ? AND role = ?;
```

---

*Last updated: January 2025*

