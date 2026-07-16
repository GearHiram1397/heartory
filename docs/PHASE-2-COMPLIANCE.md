# Phase 2 — Compliance & Security

Adds the trust layer required to responsibly hold people's memories: data-subject
rights (GDPR/CCPA), two-factor auth, audit logging, and legal policies.

## What shipped (code)
- **Data export (DSAR)** — `supabase/functions/account-export`: returns the
  user's full data as a downloadable JSON bundle. Wired to Settings → Your Data →
  "Export My Data".
- **Account deletion (right to erasure)** — `supabase/functions/account-delete`:
  removes storage objects then deletes the auth user, cascading all rows
  (profiles, vaults, memories, subscriptions, invoices, shares) via
  `ON DELETE CASCADE`. Wired to Settings → "Delete My Account".
- **Two-factor auth (TOTP)** — `app/two-factor.tsx` + `complianceService`
  enroll/verify/disable using Supabase MFA.
- **Audit logging** — `log_audit()` RPC (migration 08); export and deletion are
  logged server-side. Callable by signed-in users for their own actions.
- **Legal** — in-app Privacy Policy (`app/legal/privacy.tsx`) and Terms
  (`app/legal/terms.tsx`), linked from Settings. Template copy reflecting actual
  data practices — **have counsel review before launch.**

## Manual configuration (you do this)
1. **Deploy the functions**:
   ```sh
   supabase functions deploy account-export
   supabase functions deploy account-delete
   ```
   (They use the auto-injected `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.)
2. **Enable MFA** in Supabase → Authentication → settings (TOTP is on by default
   on new projects; confirm it's enabled).
3. **Enforce email confirmation** (already on) and configure a real SMTP provider
   + branded templates so confirmation/reset emails send reliably at volume.
4. **Host the policies** on your marketing site too (app stores require public
   Privacy Policy + Terms URLs) and set real contact addresses
   (privacy@ / support@heartory.app).
5. Consider a signed **Data Processing Agreement** with Supabase and Stripe, and
   maintain a sub-processor list.

## Notes on encryption
- In transit: TLS everywhere (Supabase default).
- At rest: Supabase encrypts Postgres + Storage at rest.
- End-to-end encryption of vault contents (client-side) is a deliberate future
  decision — it strengthens the trust story but complicates sharing, search, and
  recovery. Tracked for a later phase.
