// GDPR/CCPA data export (DSAR): returns everything we hold about the caller as
// a single JSON document. Auth via the user's JWT.
//
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) return json({ error: 'Unauthorized' }, 401);
  const userId = userData.user.id;

  const [profile, subscription, vaults, invoices, shares] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('vaults').select('*, memories(*)').eq('owner_id', userId),
    admin.from('invoices').select('*').eq('user_id', userId),
    admin.from('vault_shares').select('*').eq('user_id', userId),
  ]);

  await admin.rpc('log_audit', {
    p_action: 'data_export',
    p_entity: 'account',
    p_entity_id: userId,
    p_metadata: {},
  }).catch(() => {});

  const bundle = {
    exported_at: new Date().toISOString(),
    account: { id: userId, email: userData.user.email },
    profile: profile.data,
    subscription: subscription.data,
    vaults: vaults.data,
    invoices: invoices.data,
    shared_with_me: shares.data,
  };

  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="heartory-data-export.json"',
    },
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
