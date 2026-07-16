// Sends an Expo push notification to the members of a shared vault (everyone
// except the actor). Called after a memory is added to a shared vault.
//
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) return json({ error: 'Unauthorized' }, 401);
  const actorId = userData.user.id;

  const { vaultId, title, body } = await req.json();
  if (!vaultId) return json({ error: 'vaultId required' }, 400);

  // Recipients = vault owner + shared members, minus the actor.
  const { data: vault } = await admin
    .from('vaults')
    .select('owner_id')
    .eq('id', vaultId)
    .maybeSingle();
  if (!vault) return json({ error: 'Vault not found' }, 404);

  // Only the owner or a member may trigger notifications for this vault.
  const { data: membership } = await admin
    .from('vault_shares')
    .select('user_id')
    .eq('vault_id', vaultId);
  const memberIds = (membership ?? []).map((m) => m.user_id);
  const authorized = vault.owner_id === actorId || memberIds.includes(actorId);
  if (!authorized) return json({ error: 'Forbidden' }, 403);

  const recipientIds = [vault.owner_id, ...memberIds].filter(
    (id, i, arr) => id !== actorId && arr.indexOf(id) === i
  );
  if (recipientIds.length === 0) return json({ sent: 0 });

  // Respect the per-user push preference.
  const { data: prefs } = await admin
    .from('profiles')
    .select('id, push_enabled')
    .in('id', recipientIds);
  const optedIn = new Set(
    (prefs ?? []).filter((p) => p.push_enabled !== false).map((p) => p.id)
  );

  const { data: tokens } = await admin
    .from('push_tokens')
    .select('token, user_id')
    .in('user_id', [...optedIn]);

  const messages = (tokens ?? []).map((t) => ({
    to: t.token,
    sound: 'default',
    title: title ?? 'New memory',
    body: body ?? 'A memory was added to a shared vault.',
    data: { vaultId },
  }));

  if (messages.length === 0) return json({ sent: 0 });

  const resp = await fetch(EXPO_PUSH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  const result = await resp.json();

  return json({ sent: messages.length, result });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
