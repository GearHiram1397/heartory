-- ============================================================
-- Beneficiary / inheritance ("forever") — lets a vault owner name who
-- inherits a vault, with per-beneficiary access (view or full ownership) and
-- a release trigger (manual now, or an inactivity dead-man's switch).
-- ============================================================

-- Owner activity heartbeat (drives the inactivity release trigger).
alter table public.profiles
  add column if not exists last_active_at timestamptz not null default now();

create table if not exists public.vault_beneficiaries (
  id                   uuid primary key default gen_random_uuid(),
  vault_id             uuid not null references public.vaults(id) on delete cascade,
  beneficiary_email    text not null,
  beneficiary_user_id  uuid references auth.users(id) on delete set null,
  access_level         text not null default 'view'
                         check (access_level in ('view','owner')),
  status               text not null default 'pending'
                         check (status in ('pending','released','revoked')),
  release_trigger      text not null default 'manual'
                         check (release_trigger in ('manual','inactivity')),
  release_after_days   integer,
  released_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (vault_id, beneficiary_email)
);
create index if not exists vault_beneficiaries_vault_id_idx on public.vault_beneficiaries(vault_id);
create index if not exists vault_beneficiaries_user_id_idx on public.vault_beneficiaries(beneficiary_user_id);

drop trigger if exists touch_vault_beneficiaries on public.vault_beneficiaries;
create trigger touch_vault_beneficiaries before update on public.vault_beneficiaries
  for each row execute function public.touch_updated_at();

alter table public.vault_beneficiaries enable row level security;

-- The vault owner sees/manages all beneficiaries of their vaults; a named
-- beneficiary can see rows that name them.
drop policy if exists vault_beneficiaries_select on public.vault_beneficiaries;
create policy vault_beneficiaries_select on public.vault_beneficiaries
  for select to authenticated
  using (public.is_vault_owner(vault_id) or beneficiary_user_id = auth.uid());

-- Direct writes are owner-only; the release action (which grants access or
-- transfers ownership) goes through the SECURITY DEFINER RPCs below.
drop policy if exists vault_beneficiaries_delete on public.vault_beneficiaries;
create policy vault_beneficiaries_delete on public.vault_beneficiaries
  for delete to authenticated using (public.is_vault_owner(vault_id));

-- ----- Heartbeat: keep the owner's activity fresh -----
create or replace function public.heartbeat()
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_active_at = now() where id = auth.uid();
$$;
revoke execute on function public.heartbeat() from anon, public;
grant  execute on function public.heartbeat() to authenticated;

-- ----- Add a beneficiary (owner only) -----
create or replace function public.add_beneficiary(
  p_vault_id uuid,
  p_email text,
  p_access_level text default 'view',
  p_release_trigger text default 'manual',
  p_release_after_days integer default null
)
returns public.vault_beneficiaries
language plpgsql security definer set search_path = public as $$
declare
  v_target uuid;
  v_row public.vault_beneficiaries;
begin
  if not public.is_vault_owner(p_vault_id) then
    raise exception 'Only the vault owner can add beneficiaries';
  end if;

  select id into v_target from public.profiles where lower(email) = lower(trim(p_email));

  insert into public.vault_beneficiaries
    (vault_id, beneficiary_email, beneficiary_user_id, access_level, release_trigger, release_after_days)
  values (
    p_vault_id, trim(p_email), v_target,
    case when p_access_level = 'owner' then 'owner' else 'view' end,
    case when p_release_trigger = 'inactivity' then 'inactivity' else 'manual' end,
    case when p_release_trigger = 'inactivity' then greatest(coalesce(p_release_after_days, 90), 1) else null end
  )
  on conflict (vault_id, beneficiary_email) do update
    set access_level = excluded.access_level,
        release_trigger = excluded.release_trigger,
        release_after_days = excluded.release_after_days,
        beneficiary_user_id = coalesce(excluded.beneficiary_user_id, public.vault_beneficiaries.beneficiary_user_id)
  returning * into v_row;

  return v_row;
end;
$$;
revoke execute on function public.add_beneficiary(uuid, text, text, text, integer) from anon, public;
grant  execute on function public.add_beneficiary(uuid, text, text, text, integer) to authenticated;

-- ----- Internal: grant a released beneficiary their access -----
create or replace function public._grant_beneficiary(p_row public.vault_beneficiaries)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_target uuid := p_row.beneficiary_user_id;
begin
  -- Resolve the account if it wasn't known at creation time.
  if v_target is null then
    select id into v_target from public.profiles
      where lower(email) = lower(p_row.beneficiary_email);
  end if;
  if v_target is null then
    raise exception 'The beneficiary must have a Heartory account before access can be released';
  end if;

  if p_row.access_level = 'owner' then
    -- Full ownership transfer: the beneficiary becomes the owner; the former
    -- owner is kept as an editor so they don't lose access unexpectedly.
    insert into public.vault_shares (vault_id, user_id, role)
      select p_row.vault_id, v.owner_id, 'editor' from public.vaults v where v.id = p_row.vault_id
      on conflict (vault_id, user_id) do nothing;
    update public.vaults set owner_id = v_target where id = p_row.vault_id;
    delete from public.vault_shares where vault_id = p_row.vault_id and user_id = v_target;
  else
    insert into public.vault_shares (vault_id, user_id, role)
      values (p_row.vault_id, v_target, 'viewer')
      on conflict (vault_id, user_id) do nothing;
  end if;
end;
$$;
revoke execute on function public._grant_beneficiary(public.vault_beneficiaries) from anon, authenticated, public;

-- ----- Release now (owner-triggered) -----
create or replace function public.release_beneficiary(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_row public.vault_beneficiaries;
begin
  select * into v_row from public.vault_beneficiaries where id = p_id;
  if v_row.id is null then raise exception 'Beneficiary not found'; end if;
  if not public.is_vault_owner(v_row.vault_id) then
    raise exception 'Only the vault owner can release a beneficiary';
  end if;
  if v_row.status <> 'pending' then
    raise exception 'This beneficiary has already been %', v_row.status;
  end if;

  perform public._grant_beneficiary(v_row);
  update public.vault_beneficiaries
    set status = 'released', released_at = now(), beneficiary_user_id = coalesce(beneficiary_user_id,
        (select id from public.profiles where lower(email) = lower(v_row.beneficiary_email)))
    where id = p_id;
end;
$$;
revoke execute on function public.release_beneficiary(uuid) from anon, public;
grant  execute on function public.release_beneficiary(uuid) to authenticated;

-- ----- Inactivity sweep (called by the release-beneficiaries Edge Function
-- with the service role) -----
create or replace function public.release_due_beneficiaries()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_row public.vault_beneficiaries;
  v_count integer := 0;
begin
  for v_row in
    select b.* from public.vault_beneficiaries b
    join public.vaults v on v.id = b.vault_id
    join public.profiles p on p.id = v.owner_id
    where b.status = 'pending'
      and b.release_trigger = 'inactivity'
      and b.release_after_days is not null
      and p.last_active_at < now() - (b.release_after_days || ' days')::interval
  loop
    begin
      perform public._grant_beneficiary(v_row);
      update public.vault_beneficiaries set status = 'released', released_at = now() where id = v_row.id;
      v_count := v_count + 1;
    exception when others then
      -- Skip ones that can't be granted yet (e.g. beneficiary has no account).
      null;
    end;
  end loop;
  return v_count;
end;
$$;
revoke execute on function public.release_due_beneficiaries() from anon, authenticated, public;
grant  execute on function public.release_due_beneficiaries() to service_role;
