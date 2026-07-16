// GDPR/CCPA right to erasure: permanently deletes the caller's account and all
// associated data. Deleting the auth user cascades to profiles, vaults,
// memories, subscriptions, invoices, and shares (ON DELETE CASCADE). Stored
// media objects are removed first.
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

  try {
    // Remove stored media objects for every vault the user owns.
    const { data: vaults } = await admin.from('vaults').select('id').eq('owner_id', userId);
    for (const v of vaults ?? []) {
      const { data: files } = await admin.storage.from('memories').list(v.id);
      if (files && files.length > 0) {
        await admin.storage.from('memories').remove(files.map((f) => `${v.id}/${f.name}`));
      }
    }
    // Remove the user's avatar folder.
    const { data: avatarFiles } = await admin.storage.from('avatars').list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      await admin.storage.from('avatars').remove(avatarFiles.map((f) => `${userId}/${f.name}`));
    }

    await admin.rpc('log_audit', {
      p_action: 'account_deletion',
      p_entity: 'account',
      p_entity_id: userId,
      p_metadata: {},
    }).catch(() => {});

    // Deleting the auth user cascades all app rows via FK ON DELETE CASCADE.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return json({ deleted: true });
  } catch (e) {
    console.error('account-delete error', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
