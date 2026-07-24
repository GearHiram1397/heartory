-- ============================================================
-- Referral program: each user gets a stable referral code; when a new user
-- redeems a code, the referral is recorded (once per referred user). Reward
-- fulfilment (e.g. a free month) is applied via Stripe coupons out-of-band;
-- this schema tracks the codes and redemptions that drive it.
-- ============================================================

alter table public.profiles
  add column if not exists referral_code text unique;

create table if not exists public.referrals (
  id                 uuid primary key default gen_random_uuid(),
  referrer_id        uuid not null references auth.users(id) on delete cascade,
  referred_user_id   uuid not null references auth.users(id) on delete cascade,
  reward_granted     boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (referred_user_id)
);
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

alter table public.referrals enable row level security;

-- A user can see referrals they made or the one that referred them.
drop policy if exists referrals_select on public.referrals;
create policy referrals_select on public.referrals
  for select to authenticated
  using (referrer_id = auth.uid() or referred_user_id = auth.uid());

-- ----- Ensure the caller has a referral code, returning it -----
create or replace function public.ensure_referral_code()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_try  text;
begin
  select referral_code into v_code from public.profiles where id = auth.uid();
  if v_code is not null then
    return v_code;
  end if;

  -- Generate a unique 8-char code (retry on the rare collision).
  loop
    v_try := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      update public.profiles set referral_code = v_try where id = auth.uid();
      return v_try;
    exception when unique_violation then
      -- try again
    end;
  end loop;
end;
$$;
revoke execute on function public.ensure_referral_code() from anon, public;
grant  execute on function public.ensure_referral_code() to authenticated;

-- ----- Referral stats for the caller -----
create or replace function public.referral_stats()
returns table (referrals_count integer, has_claimed boolean)
language sql security definer stable set search_path = public as $$
  select
    (select count(*)::integer from public.referrals where referrer_id = auth.uid()),
    exists (select 1 from public.referrals where referred_user_id = auth.uid());
$$;
revoke execute on function public.referral_stats() from anon, public;
grant  execute on function public.referral_stats() to authenticated;

-- ----- Redeem someone else's code (once per referred user) -----
create or replace function public.redeem_referral(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_referrer uuid;
begin
  select id into v_referrer from public.profiles
    where referral_code = upper(trim(p_code));
  if v_referrer is null then
    raise exception 'That referral code is not valid';
  end if;
  if v_referrer = auth.uid() then
    raise exception 'You can''t redeem your own referral code';
  end if;
  if exists (select 1 from public.referrals where referred_user_id = auth.uid()) then
    raise exception 'You have already used a referral code';
  end if;

  insert into public.referrals (referrer_id, referred_user_id)
  values (v_referrer, auth.uid());
end;
$$;
revoke execute on function public.redeem_referral(text) from anon, public;
grant  execute on function public.redeem_referral(text) to authenticated;
