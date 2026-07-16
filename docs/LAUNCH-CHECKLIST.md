# Launch Checklist

Everything that must be true before taking real, paying clients. Code items are
done; the rest are configuration/business steps (yours).

## Backend & infra
- [ ] Deploy all Edge Functions (`stripe-*`, `account-*`, `notify-vault-activity`).
- [ ] Set Edge Function secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- [ ] Enable Point-in-Time Recovery; run one backup **restore drill**.
- [ ] Turn on Supabase alerts (CPU/disk/error rate).
- [ ] Confirm RLS is on for every table (Supabase advisor is clean).

## Payments
- [ ] Create Stripe products/prices (Premium & Pro, monthly + annual).
- [ ] Set `stripe_price_id_month/_year` on `plans`.
- [ ] Register the webhook endpoint + events; enable the Billing Portal.
- [ ] Test a real end-to-end purchase, upgrade, and cancel in Stripe test mode.
- [ ] Configure tax (Stripe Tax) and business/merchant details.

## Auth & email
- [ ] Configure a production SMTP provider + branded email templates.
- [ ] Verify email confirmation and password reset end-to-end.
- [ ] Confirm TOTP 2FA enrollment works on a real device.

## Notifications
- [ ] `eas init` (project id) + build a dev/production client.
- [ ] Configure APNs (iOS) via EAS credentials; verify a push delivers.

## Compliance & legal
- [ ] Have counsel review the Privacy Policy and Terms; host them publicly.
- [ ] Set real contact addresses (privacy@ / support@heartory.app).
- [ ] Verify data export + account deletion end-to-end.
- [ ] Sign DPAs with Supabase and Stripe; maintain a sub-processor list.
- [ ] Complete the App Store privacy "nutrition label" + Play Data Safety form.

## Observability
- [ ] Set `EXPO_PUBLIC_SENTRY_DSN`; confirm errors report.
- [ ] Set `EXPO_PUBLIC_ANALYTICS_KEY`; confirm funnel events (`sign_up`,
      `vault_created`, `checkout_started`) land.

## App store submission
- [ ] Final branding pass (icon, splash, screenshots).
- [ ] Bump `version` / `buildNumber` / `versionCode`.
- [ ] Register the `heartory://` deep link + universal links for Stripe returns.
- [ ] Submit to App Store Connect and Google Play.

## Business
- [ ] Unit-economics model per tier (storage + egress + Stripe fees).
- [ ] Decide the permanence/pricing story (Lifetime tier, beneficiary flow).
- [ ] Legal entity, bank, insurance.
- [ ] First B2B2C partner pilot (funeral home / hospice / estate planner).

> See `docs/GO-LIVE-ANALYSIS.md` for the reasoning behind the business items.
