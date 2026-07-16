// Creates a Stripe Checkout Session for a subscription plan and returns its URL.
// The app opens that URL in a browser; card data never touches our servers.
//
// Required secrets (set via Supabase dashboard / CLI, not committed):
//   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Identify the caller from their JWT.
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const user = userData.user;

    const { planId, interval, successUrl, cancelUrl } = await req.json();
    if (!planId || !interval) return json({ error: 'planId and interval are required' }, 400);

    // Resolve the Stripe price for the requested plan/interval.
    const { data: plan } = await supabase
      .from('plans')
      .select('stripe_price_id_month, stripe_price_id_year')
      .eq('id', planId)
      .single();
    const priceId =
      interval === 'year' ? plan?.stripe_price_id_year : plan?.stripe_price_id_month;
    if (!priceId) {
      return json({ error: 'This plan is not available for purchase yet.' }, 400);
    }

    // Reuse or create the Stripe customer for this user.
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? 'heartory://subscription?checkout=success',
      cancel_url: cancelUrl ?? 'heartory://subscription?checkout=cancel',
      metadata: { supabase_user_id: user.id, plan_id: planId },
      subscription_data: { metadata: { supabase_user_id: user.id, plan_id: planId } },
      allow_promotion_codes: true,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('stripe-checkout error', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
