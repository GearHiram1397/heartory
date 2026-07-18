// Inactivity "dead-man's switch": releases beneficiaries whose owner has been
// inactive past their threshold. Intended to run on a schedule (Supabase Cron /
// pg_cron calling this function, e.g. daily). Idempotent — only pending
// inactivity beneficiaries past due are released.
//
// Deploy with verify_jwt = false and protect with a shared secret header, since
// a scheduler (not a user) invokes it.
//
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RELEASE_CRON_SECRET
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Simple shared-secret guard so only the scheduler can trigger releases.
  const secret = Deno.env.get('RELEASE_CRON_SECRET');
  if (secret && req.headers.get('x-cron-secret') !== secret) {
    return new Response('Forbidden', { status: 403 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await admin.rpc('release_due_beneficiaries');
  if (error) {
    console.error('release_due_beneficiaries failed', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ released: data ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
