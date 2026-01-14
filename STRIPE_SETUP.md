# 💳 Stripe Payment Setup

## Environment Variables Required

Add these to your `.env` file:

```env
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_test_..." # Secret key from Stripe dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Publishable key from Stripe dashboard

# Stripe Webhook Secret (after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET="whsec_..." # Webhook signing secret
```

## Setup Steps

### 1. Get Stripe API Keys

1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key**
5. Add them to `.env` file

### 2. Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/payments/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** and add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 3. Test Mode

- Use test keys (`sk_test_...` and `pk_test_...`) for development
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### 4. Production

- Replace test keys with live keys (`sk_live_...` and `pk_live_...`)
- Update webhook URL to production domain
- Get new webhook signing secret

## Payment Flow

1. Employer creates job posting → Job status: `DRAFT`
2. Redirects to payment page
3. Employer pays via Stripe
4. Webhook receives payment confirmation
5. Job status changes to `PENDING_ADMIN_REVIEW`
6. Admin approves → Job status: `LIVE`

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

