// Creates a Stripe Billing Portal session so users can manage or cancel their
// subscription and update payment methods — all hosted by Stripe (PCI-safe).
//
// Required secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData.user) return json({ error: 'Unauthorized' }, 401);

    const { returnUrl } = await req.json().catch(() => ({}));

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (!sub?.stripe_customer_id) {
      return json({ error: 'No billing account yet. Subscribe to a plan first.' }, 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl ?? 'heartory://subscription',
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('stripe-portal error', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
