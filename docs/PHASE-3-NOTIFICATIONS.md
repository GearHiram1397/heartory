# Phase 3 — Notifications

Adds push notifications and a preference toggle so shared vaults feel alive
("a memory was added to a vault you share"). Transactional email (sign-up
confirmation, password reset) is already handled by Supabase Auth.

## What shipped (code)
- **Push tokens** — `push_tokens` table with RLS + `profiles.push_enabled`
  preference (migration 09).
- **notificationService** — requests permission, registers the Expo push token
  on sign-in, stores/removes it, reads/writes the preference, and triggers
  activity notifications.
- **notify-vault-activity** edge function — sends an Expo push to a shared
  vault's other members (respecting each recipient's `push_enabled`).
- **Wiring** — the root layout registers for push after sign-in; adding a memory
  to a shared vault fires a notification; the Settings → Notifications toggle
  controls the preference.

## Manual configuration (you do this)
1. **Deploy the function**: `supabase functions deploy notify-vault-activity`.
2. **EAS project id**: push tokens need a project id. Run `eas init` (or set
   `expo.extra.eas.projectId` in `app.json`); `getExpoPushTokenAsync` reads it.
3. **Dev/production build required**: remote push does **not** work in Expo Go on
   SDK 53 — build a development client or a store build
   (`eas build`) to test and ship push.
4. **iOS**: configure APNs (an Apple Developer account + push key) via EAS
   credentials. **Android**: FCM is handled by Expo's push service.

## Notes / future
- Delivery is best-effort (fire-and-forget) from the client after a write. For
  guaranteed delivery at scale, move the trigger server-side (a Postgres trigger
  via `pg_net`, or a Supabase Database Webhook, calling
  `notify-vault-activity`).
- Consider adding email for share invites and receipts via a provider (e.g.
  Resend) as a follow-up; the edge-function pattern is already established.
