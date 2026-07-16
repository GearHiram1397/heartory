# Phase 1 — Stripe Monetization

Replaces the in-app card capture (a PCI-DSS liability) with **Stripe Checkout**
and the **Stripe Billing Portal**. Card data never touches the app or our
servers. Stripe **webhooks** are the source of truth for subscription state.

## What shipped (code)
- **Edge Functions** (`supabase/functions/`):
  - `stripe-checkout` — creates a Checkout Session for a plan/interval, returns
    its URL. Reuses/creates the Stripe customer, stored on `subscriptions`.
  - `stripe-webhook` — verifies the signature and reconciles `subscriptions`
    (plan, status, period, `stripe_subscription_id`) and `invoices`.
  - `stripe-portal` — creates a Billing Portal session to manage/cancel.
- **DB**: `plans.stripe_price_id_month` / `stripe_price_id_year` columns and a
  `plan_id_for_stripe_price()` lookup used by the webhook (migration `07`).
- **App**: the subscription screen now opens Stripe Checkout; billing/cancel go
  through the Stripe portal. The raw-card `AddPaymentMethodModal` and
  `CheckoutModal` were **deleted**. `subscriptionService.startCheckout()` /
  `openBillingPortalUrl()` call the edge functions.

## Manual configuration (you do this once)
1. **Create products/prices in Stripe** for Premium and Pro, each with a monthly
   and an annual price. Copy the Price IDs.
2. **Store the Price IDs** on the plans:
   ```sql
   update public.plans set stripe_price_id_month='price_...', stripe_price_id_year='price_...' where id='premium';
   update public.plans set stripe_price_id_month='price_...', stripe_price_id_year='price_...' where id='pro';
   ```
3. **Deploy the functions**:
   ```sh
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-portal
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. **Set secrets** (never commit these):
   ```sh
   supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)
5. **Add the webhook endpoint** in Stripe → Developers → Webhooks, pointing at
   `https://ictlxbtbomiehbenvpfv.supabase.co/functions/v1/stripe-webhook`, and
   subscribe to: `checkout.session.completed`,
   `customer.subscription.created|updated|deleted`,
   `invoice.paid`, `invoice.payment_failed`. Copy the signing secret into
   `STRIPE_WEBHOOK_SECRET` above.
6. **Enable the Billing Portal** in Stripe → Settings → Billing → Customer portal.
7. Register the `heartory://` deep-link scheme (see `app.json`) so Checkout/portal
   redirects return to the app (or swap the `success_url`/`cancel_url` for your
   web domain).

## Security note
- The webhook function is deployed with `--no-verify-jwt` because Stripe (not a
  logged-in user) calls it; it authenticates via the Stripe signature instead.
- `checkout` and `portal` require the user's JWT and verify the caller.
