# Phase 0 — Backend Foundation: Status

_Last updated: 2026-07-15_

Phase 0 replaces the prototype's fully-mocked service layer with a real,
secured backend on **Supabase** (Postgres + Auth + Storage + RLS). The app now
persists data, verifies passwords, enforces authorization, and stores media in
real object storage.

## What shipped

### Backend (Supabase project `heartory`, ref `ictlxbtbomiehbenvpfv`, us-east-1)
- **Schema** (`supabase/migrations/0001_initial_schema.sql`): `profiles`,
  `vaults`, `memories`, `vault_shares`, `subscriptions`, `invoices`,
  `audit_log`, and a `plans` reference table (single source of truth for tier
  limits).
- **Row-Level Security on every table.** Owner-scoped access plus shared-vault
  access via `SECURITY DEFINER` predicate helpers (no recursive policies).
- **Triggers**: auto-provision profile + free subscription on signup;
  `updated_at` maintenance; **server-side enforcement** of storage quota, media
  gating, and per-plan vault limits; running storage accounting.
- **Storage buckets**: private `memories` (path-scoped per vault) and public
  `avatars`, with matching object policies.
- **Hardened** per Supabase's security advisor (pinned `search_path`, revoked
  RPC `execute` on trigger-only functions). Remaining advisor warnings are the
  RLS predicate helpers, which must stay executable by `authenticated`.

### App
- **Real auth** (`services/authService.ts`, `store/authStore.ts`): Supabase
  password auth, sessions, email confirmation, password reset. Root layout now
  **gates routes** by auth state (`app/_layout.tsx`).
- **Real data** (`services/memoryService.ts`, `uploadService.ts`): vault/memory
  CRUD and sharing against Postgres; media uploaded to private storage and
  resolved to **signed URLs** on read (so the UI renders unchanged). Quota is
  enforced in the database, not the client.
- **Real subscription reads** (`services/subscriptionService.ts`): current plan
  + true storage usage. Subscribe/cancel/referrals remain mocked until Phase 1.
- **Fixed** four Rork-misfiled components and a cross-platform `constants/colors`
  casing bug. Project typechecks with **0 errors**.

## Configuration / running

1. `npm install`
2. Copy `.env.example` → `.env` (the committed `.env` already has this project's
   public URL + publishable key; these are safe in the client because RLS
   protects the data).
3. `npm start` (Rork/Expo).

**Never** put the Supabase `service_role` key or any Stripe secret in an
`EXPO_PUBLIC_` var — those belong only in server-side Edge Function secrets.

### Auth note
Email confirmation is **enabled** (correct for a trust-critical app). New
sign-ups must confirm via email before signing in; the register screen surfaces
this. Supabase's built-in email sender is rate-limited — configure a real SMTP
provider (and branded templates) in Phase 2/3.

## Known cleanups (carried into next steps)

- **`app/(tabs)/` route collision (needs approval to delete).** The Expo starter
  scaffolding — `app/(tabs)/` ("Tab One/Two"), plus `components/Themed.tsx`,
  `EditScreenInfo.tsx`, `ExternalLink.tsx`, and the `StyledText` test — is unused
  by the real app, and `app/(tabs)/index.tsx` collides with the real home route
  (`/`). It's currently made to compile via a compatibility color export, but it
  should be **removed** (an automated-safety guard blocked the deletion mid-session).
- **Sharing UI** is now backed by real services, but end-to-end sharing depends
  on both users having confirmed accounts.
- **Branding**: user-facing screens still say "Memora" in places; the iOS/Android
  bundle IDs are `app.rork.memora`. Rename to Heartory before store submission.

## Next: Phase 1 (Monetization)
Stripe integration — Products/Prices for the tiers, Checkout/Payment Element,
customer portal, and **webhooks as the source of truth** for subscription state
(the `subscriptions`/`invoices` tables already carry `stripe_*` columns). Remove
the raw-card `AddPaymentMethodModal` form (PCI). See `docs/GO-LIVE-ANALYSIS.md`.
