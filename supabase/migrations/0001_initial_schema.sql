-- ============================================================
-- Heartory — consolidated initial schema
-- Applied to project ictlxbtbomiehbenvpfv as migrations 01-05.
-- This file is the version-controlled source of truth; keep it in
-- sync when changing the database.
-- ============================================================

-- ---------- Plans (source of truth for tier limits) ----------
create table if not exists public.plans (
  id                    text primary key,
  name                  text not null,
  description           text,
  price_cents           integer not null default 0,
  storage_limit_mb      integer not null,
  max_vaults            integer,
  max_shares_per_vault  integer,
  allows_media          boolean not null default true,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now()
);

insert into public.plans (id, name, description, price_cents, storage_limit_mb, max_vaults, max_shares_per_vault, allows_media, sort_order)
values
  ('free',    'Free',    'Basic memory storage for personal use',       0,    500,   3,    2,    false, 0),
  ('premium', 'Premium', 'Enhanced storage for your precious memories', 499,  5000,  null, 10,   true,  1),
  ('pro',     'Pro',     'Ultimate memory preservation experience',     999,  20000, null, null, true,  2)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, price_cents = excluded.price_cents,
  storage_limit_mb = excluded.storage_limit_mb, max_vaults = excluded.max_vaults,
  max_shares_per_vault = excluded.max_shares_per_vault, allows_media = excluded.allows_media,
  sort_order = excluded.sort_order;

-- ---------- Core tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '', email text not null, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null default 'free' references public.plans(id),
  status text not null default 'active' check (status in ('active','canceled','expired','trial','past_due')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  auto_renew boolean not null default true,
  storage_used_bytes bigint not null default 0,
  stripe_customer_id text, stripe_subscription_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.vaults (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, description text, cover_image text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists vaults_owner_id_idx on public.vaults(owner_id);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.vaults(id) on delete cascade,
  type text not null check (type in ('photo','video','audio','text','quote')),
  content text not null, caption text, memory_date date,
  tags text[] not null default '{}', storage_bytes bigint not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists memories_vault_id_idx on public.memories(vault_id);
create index if not exists memories_created_at_idx on public.memories(created_at desc);

create table if not exists public.vault_shares (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer','editor')),
  created_at timestamptz not null default now(),
  unique (vault_id, user_id)
);
create index if not exists vault_shares_user_id_idx on public.vault_shares(user_id);
create index if not exists vault_shares_vault_id_idx on public.vault_shares(vault_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null, currency text not null default 'usd',
  description text, status text not null default 'paid' check (status in ('paid','open','void','uncollectible')),
  plan_id text references public.plans(id), stripe_invoice_id text,
  created_at timestamptz not null default now()
);
create index if not exists invoices_user_id_idx on public.invoices(user_id);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, entity text, entity_id text,
  metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create index if not exists audit_log_user_id_idx on public.audit_log(user_id, created_at desc);

-- ---------- Access-control helpers (SECURITY DEFINER) ----------
create or replace function public.is_vault_owner(v_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.vaults where id = v_id and owner_id = auth.uid());
$$;

create or replace function public.can_access_vault(v_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.vaults where id = v_id and owner_id = auth.uid())
      or exists (select 1 from public.vault_shares where vault_id = v_id and user_id = auth.uid());
$$;

create or replace function public.can_edit_vault(v_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.vaults where id = v_id and owner_id = auth.uid())
      or exists (select 1 from public.vault_shares where vault_id = v_id and user_id = auth.uid() and role = 'editor');
$$;

create or replace function public.shares_vault_with(target uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.vaults v join public.vault_shares s on s.vault_id = v.id
                 where v.owner_id = auth.uid() and s.user_id = target)
      or exists (select 1 from public.vaults v join public.vault_shares s on s.vault_id = v.id
                 where v.owner_id = target and s.user_id = auth.uid());
$$;

-- ---------- Triggers: new user, updated_at, storage/quota ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, plan_id, current_period_end)
  values (new.id, 'free', now() + interval '100 years')
  on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists touch_vaults on public.vaults;
create trigger touch_vaults before update on public.vaults for each row execute function public.touch_updated_at();
drop trigger if exists touch_memories on public.memories;
create trigger touch_memories before update on public.memories for each row execute function public.touch_updated_at();
drop trigger if exists touch_subscriptions on public.subscriptions;
create trigger touch_subscriptions before update on public.subscriptions for each row execute function public.touch_updated_at();

create or replace function public.enforce_memory_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_plan public.plans%rowtype; v_used bigint; v_limit_bytes bigint;
begin
  select owner_id into v_owner from public.vaults where id = new.vault_id;
  if v_owner is null then raise exception 'Vault not found'; end if;
  select p.* into v_plan from public.subscriptions s join public.plans p on p.id = s.plan_id where s.user_id = v_owner;
  if v_plan.id is null then select * into v_plan from public.plans where id = 'free'; end if;
  if new.type in ('video','audio') and not v_plan.allows_media then
    raise exception 'Your plan does not support % memories. Please upgrade.', new.type using errcode = 'check_violation';
  end if;
  select storage_used_bytes into v_used from public.subscriptions where user_id = v_owner;
  v_used := coalesce(v_used, 0);
  v_limit_bytes := v_plan.storage_limit_mb::bigint * 1048576;
  if v_used + coalesce(new.storage_bytes,0) > v_limit_bytes then
    raise exception 'Storage limit reached. Please upgrade your plan or free up space.' using errcode = 'check_violation';
  end if;
  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end; $$;
drop trigger if exists enforce_memory_limits_trg on public.memories;
create trigger enforce_memory_limits_trg before insert on public.memories
  for each row execute function public.enforce_memory_limits();

create or replace function public.sync_storage_usage()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_delta bigint;
begin
  if tg_op = 'INSERT' then v_delta := coalesce(new.storage_bytes,0);
    select owner_id into v_owner from public.vaults where id = new.vault_id;
  elsif tg_op = 'DELETE' then v_delta := -coalesce(old.storage_bytes,0);
    select owner_id into v_owner from public.vaults where id = old.vault_id;
  else v_delta := coalesce(new.storage_bytes,0) - coalesce(old.storage_bytes,0);
    select owner_id into v_owner from public.vaults where id = new.vault_id;
  end if;
  if v_owner is not null and v_delta <> 0 then
    update public.subscriptions set storage_used_bytes = greatest(0, storage_used_bytes + v_delta) where user_id = v_owner;
  end if;
  return coalesce(new, old);
end; $$;
drop trigger if exists sync_storage_usage_trg on public.memories;
create trigger sync_storage_usage_trg after insert or update or delete on public.memories
  for each row execute function public.sync_storage_usage();

create or replace function public.enforce_vault_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_max integer; v_count integer;
begin
  select p.max_vaults into v_max from public.subscriptions s join public.plans p on p.id = s.plan_id where s.user_id = new.owner_id;
  if v_max is not null then
    select count(*) into v_count from public.vaults where owner_id = new.owner_id;
    if v_count >= v_max then
      raise exception 'Your plan is limited to % memory vaults. Please upgrade to create more.', v_max using errcode = 'check_violation';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists enforce_vault_limits_trg on public.vaults;
create trigger enforce_vault_limits_trg before insert on public.vaults
  for each row execute function public.enforce_vault_limits();

-- ---------- Row-Level Security ----------
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.vaults enable row level security;
alter table public.memories enable row level security;
alter table public.vault_shares enable row level security;
alter table public.invoices enable row level security;
alter table public.audit_log enable row level security;

create policy plans_read on public.plans for select to authenticated using (true);

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_vault_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy subscriptions_select on public.subscriptions for select to authenticated using (user_id = auth.uid());

create policy vaults_select on public.vaults for select to authenticated using (public.can_access_vault(id));
create policy vaults_insert on public.vaults for insert to authenticated with check (owner_id = auth.uid());
create policy vaults_update on public.vaults for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy vaults_delete on public.vaults for delete to authenticated using (owner_id = auth.uid());

create policy memories_select on public.memories for select to authenticated using (public.can_access_vault(vault_id));
create policy memories_insert on public.memories for insert to authenticated with check (public.can_edit_vault(vault_id));
create policy memories_update on public.memories for update to authenticated using (public.can_edit_vault(vault_id)) with check (public.can_edit_vault(vault_id));
create policy memories_delete on public.memories for delete to authenticated using (public.can_edit_vault(vault_id));

create policy vault_shares_select on public.vault_shares for select to authenticated using (user_id = auth.uid() or public.is_vault_owner(vault_id));
create policy vault_shares_insert on public.vault_shares for insert to authenticated with check (public.is_vault_owner(vault_id));
create policy vault_shares_delete on public.vault_shares for delete to authenticated using (public.is_vault_owner(vault_id) or user_id = auth.uid());

create policy invoices_select on public.invoices for select to authenticated using (user_id = auth.uid());
create policy audit_log_select on public.audit_log for select to authenticated using (user_id = auth.uid());

-- ---------- Storage buckets + policies ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories','memories',false,524288000,
  array['image/jpeg','image/png','image/webp','image/heic','image/gif',
        'video/mp4','video/quicktime','video/webm',
        'audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/webm','audio/x-m4a'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars','avatars',true,10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy memories_obj_select on storage.objects for select to authenticated
  using (bucket_id = 'memories' and public.can_access_vault(((storage.foldername(name))[1])::uuid));
create policy memories_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'memories' and public.can_edit_vault(((storage.foldername(name))[1])::uuid));
create policy memories_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'memories' and public.can_edit_vault(((storage.foldername(name))[1])::uuid));

create policy avatars_obj_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_obj_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Hardening: revoke RPC access to trigger-only functions ----------
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.enforce_memory_limits() from anon, authenticated, public;
revoke execute on function public.enforce_vault_limits() from anon, authenticated, public;
revoke execute on function public.sync_storage_usage() from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;
revoke execute on function public.is_vault_owner(uuid) from anon, public;
revoke execute on function public.can_access_vault(uuid) from anon, public;
revoke execute on function public.can_edit_vault(uuid) from anon, public;
revoke execute on function public.shares_vault_with(uuid) from anon, public;
