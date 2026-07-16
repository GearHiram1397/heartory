// Stripe webhook: the source of truth for subscription state. Verifies the
// signature, then reconciles the `subscriptions` and `invoices` tables.
//
// Deploy with verify_jwt = false (Stripe calls it directly, no user JWT).
// Required secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//                   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = await resolveSubscription(event);
        if (sub) await upsertSubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await admin
          .from('subscriptions')
          .update({ plan_id: 'free', status: 'canceled', auto_renew: false })
          .eq('stripe_customer_id', sub.customer as string);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        await recordInvoice(event.data.object as Stripe.Invoice);
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook handler error', e);
    return new Response('Handler error', { status: 500 });
  }
});

async function resolveSubscription(event: Stripe.Event): Promise<Stripe.Subscription | null> {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!session.subscription) return null;
    return await stripe.subscriptions.retrieve(session.subscription as string);
  }
  return event.data.object as Stripe.Subscription;
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const userId = (sub.metadata?.supabase_user_id as string) ?? null;

  // Map the Stripe price back to a plan id.
  let planId = (sub.metadata?.plan_id as string) ?? null;
  if (!planId && priceId) {
    const { data } = await admin.rpc('plan_id_for_stripe_price', { p_price_id: priceId });
    planId = (data as string) ?? null;
  }

  const patch: Record<string, unknown> = {
    status: mapStatus(sub.status),
    auto_renew: !sub.cancel_at_period_end,
    stripe_subscription_id: sub.id,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
  };
  if (planId) patch.plan_id = planId;

  // Prefer matching by user id (from metadata); fall back to customer id.
  if (userId) {
    await admin.from('subscriptions').update(patch).eq('user_id', userId);
  } else {
    await admin
      .from('subscriptions')
      .update(patch)
      .eq('stripe_customer_id', sub.customer as string);
  }
}

async function recordInvoice(invoice: Stripe.Invoice) {
  const { data: sub } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .maybeSingle();
  if (!sub) return;

  await admin.from('invoices').insert({
    user_id: sub.user_id,
    amount_cents: invoice.amount_paid ?? invoice.amount_due ?? 0,
    currency: invoice.currency ?? 'usd',
    description: invoice.lines?.data?.[0]?.description ?? 'Subscription',
    status: invoice.status === 'paid' ? 'paid' : 'open',
    stripe_invoice_id: invoice.id,
  });
}

function mapStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'expired';
  }
}
