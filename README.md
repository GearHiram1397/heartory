# 💖 Heartory

**Heartory** is a private, emotionally driven memory-preservation app for
mobile and web — a safe, comforting space to store, revisit, and share memories
of loved ones.

Built with Expo (React Native) + expo-router, Zustand, and a Supabase backend
(Postgres + Auth + Storage + Edge Functions), with Stripe for payments.

---

## Status

Heartory has been taken from a UI prototype to a real, secured application. See
the phase docs in [`docs/`](./docs):

- **[GO-LIVE-ANALYSIS](docs/GO-LIVE-ANALYSIS.md)** — business + technical readiness assessment
- **Phase 0** — real backend, schema, RLS, auth, storage ([status](docs/PHASE-0-STATUS.md))
- **Phase 1** — Stripe monetization (Checkout + Billing Portal) ([docs](docs/PHASE-1-STRIPE.md))
- **Phase 2** — GDPR export/delete, 2FA, audit, policies ([docs](docs/PHASE-2-COMPLIANCE.md))
- **Phase 3** — push notifications ([docs](docs/PHASE-3-NOTIFICATIONS.md))
- **Phase 4** — CI, error tracking, performance ([docs](docs/PHASE-4-OPS.md))
- **Phase 5** — launch prep ([checklist](docs/LAUNCH-CHECKLIST.md))

---

## Architecture

```
app/            expo-router screens (auth-gated)
components/      UI components
store/           Zustand stores (auth, memory, subscription, theme, billing)
services/        data + integration layer (Supabase, Stripe, notifications, compliance)
lib/             supabase client, monitoring, analytics
supabase/
  migrations/    version-controlled schema (source of truth)
  functions/     Deno Edge Functions (Stripe, GDPR, notifications)
types/           app + generated database types
```

- **Auth**: Supabase Auth (email + password, email confirmation, optional TOTP 2FA).
- **Authorization**: Postgres Row-Level Security on every table.
- **Media**: private `memories` storage bucket, served via signed URLs.
- **Payments**: Stripe Checkout + Billing Portal; webhooks are the source of truth.
- **Data rights**: self-serve export and account deletion.

---

## Getting started

```bash
npm install
cp .env.example .env   # a committed .env already has this project's public keys
npm start
```

Public config (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) is
safe in the client — Row-Level Security protects the data. Server secrets
(`service_role`, Stripe secret/webhook keys) live only in Supabase Edge Function
secrets, never in the app.

Optional client env: `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_ANALYTICS_KEY`,
`EXPO_PUBLIC_PASSWORD_RESET_URL`.

---

## Deploying the backend

Schema lives in `supabase/migrations/`. Edge Functions in `supabase/functions/`:

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy account-export
supabase functions deploy account-delete
supabase functions deploy notify-vault-activity
```

Then set secrets and Stripe prices as described in the phase docs.

---

## License

MIT.
