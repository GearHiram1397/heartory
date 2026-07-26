-- ============================================================
-- Pricing update: raise the monthly anchors and add the one-time Legacy tier.
-- (Stripe Price IDs are set separately from the Stripe dashboard.)
-- ============================================================

-- New monthly anchors.
update public.plans set price_cents = 699  where id = 'premium';
update public.plans set price_cents = 1299 where id = 'pro';

-- One-time ("lifetime") Stripe Price ID for tiers sold as a single payment.
alter table public.plans add column if not exists stripe_price_id_lifetime text;

-- The Legacy tier: Pro-level limits, sold once.
insert into public.plans
  (id, name, description, price_cents, storage_limit_mb, max_vaults, max_shares_per_vault, allows_media, sort_order)
values
  ('legacy', 'Legacy', 'Keep these memories forever — one payment, no subscription',
   24900, 20000, null, null, true, 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  storage_limit_mb = excluded.storage_limit_mb,
  max_vaults = excluded.max_vaults,
  max_shares_per_vault = excluded.max_shares_per_vault,
  allows_media = excluded.allows_media,
  sort_order = excluded.sort_order;

-- Let the webhook resolve the lifetime price back to a plan too.
create or replace function public.plan_id_for_stripe_price(p_price_id text)
returns text language sql stable security definer set search_path = public as $$
  select id from public.plans
  where stripe_price_id_month = p_price_id
     or stripe_price_id_year = p_price_id
     or stripe_price_id_lifetime = p_price_id
  limit 1;
$$;
revoke execute on function public.plan_id_for_stripe_price(text) from anon, authenticated, public;
