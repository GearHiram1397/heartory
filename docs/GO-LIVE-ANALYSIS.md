# Heartory — Prototype → Production Readiness & Business Analysis

_Last updated: 2026-07-15_

This document is an honest assessment of where Heartory is today, what it must have
before it can responsibly take a single paying client, and the business model work
needed to make it a company rather than a demo. Read the **Reality Check** first.

---

## 1. Reality Check (read this first)

Heartory today is a **high-fidelity UI prototype**, not a product. The app looks
complete — sign-up, memory vaults, photos/video/audio, subscriptions, billing,
referrals, sharing — but **none of it is real**:

- Every service layer hard-codes `USE_MOCK = true`
  (`authService`, `memoryService`, `uploadService`, `subscriptionService`, `billingService`).
- There is **no backend, no database, no server**. All data lives in memory inside
  the app and disappears on reload. `services/api.ts` points at
  `https://api.memora.app` — a URL that does not belong to this project and does not exist.
- **Login does not check passwords.** `mockService.auth.login` looks a user up by
  email and returns it. Anyone can "log in" as anyone.
- **Uploads don't upload.** `uploadImage/Video/Audio` return the local device URI
  unchanged. Nothing is stored anywhere.
- **The billing form collects raw credit-card numbers in-app.** This is a serious
  PCI-DSS problem (see §4). It is not a real payment system — no money moves.
- **"Encrypted cloud storage," "GDPR compliance," and "2FA"** are claims in the
  README with **zero implementing code**.

### Can we take clients today?
**No — and we should not try.** Heartory's entire value proposition is *trust*: people
storing irreplaceable memories of loved ones, often deceased. Onboarding real users
onto the current build would mean:
- Silently losing 100% of their data (nothing persists).
- Collecting card numbers into an insecure form (PCI liability + fraud exposure).
- Making explicit GDPR/encryption promises we don't keep (regulatory + legal liability).

The good news: the hard *product* thinking is done. The UI, data model, tiers, and
flows are coherent. What's missing is the entire backend and trust layer. That is a
**~8–12 week build** to a responsible paid launch, phased below — not a "today" launch,
but a credible near-term one.

---

## 2. What Exists vs. What's Missing

| Area | Exists (prototype) | Missing (for production) |
|---|---|---|
| **UI / UX** | ✅ Full screen set, theming, components | Accessibility pass, error/empty/loading states audit, real media rendering |
| **Data model** | ✅ Types for vaults, memories, users, subs, billing | Persistent DB schema, migrations, relationships, indexes |
| **Auth** | ✅ Login/register/forgot screens | Real identity provider, password hashing, sessions/JWT, email verify, 2FA, password checks |
| **Storage** | ✅ Image picker, upload UI | Object storage (S3/Supabase), CDN, thumbnails, transcoding, virus scan, quota enforcement server-side |
| **Payments** | ✅ Plans, checkout UI, invoices UI | PCI-compliant processor (Stripe), webhooks, tax, dunning, real invoices |
| **Sharing/collab** | ✅ Share modals, shared-user lists | Server-side permissions, invitations, access revocation, audit |
| **Notifications** | ❌ | Push (Expo), email (transactional), in-app, preferences |
| **Compliance** | ❌ (README claims only) | Privacy policy, ToS, GDPR/CCPA DSAR (export/delete), DPA, cookie/consent, data-retention & legacy policy |
| **Security** | ❌ | Encryption at rest/in transit, RLS/authorization, secrets mgmt, rate limiting, audit logs, pen test |
| **Ops / Scale** | ❌ | Hosting, CI/CD, monitoring, error tracking, backups/DR, autoscaling, CDN, on-call |
| **Analytics** | ❌ | Product analytics, funnel/conversion tracking, revenue metrics |
| **Legal/Corp** | ❌ | Entity, bank, merchant account, insurance, EULA, DMCA, support policy |

---

## 3. Business Model Analysis

### Current model (from `constants/subscriptions.ts`)
Freemium SaaS, storage-tiered:

| Plan | Price | Storage | Notes |
|---|---|---|---|
| Free | $0 | 500 MB | 3 vaults, share w/ 2, no video/audio |
| Premium | $4.99/mo | 5 GB | Unlimited vaults, all media, share w/ 10 — *marked most popular* |
| Pro | $9.99/mo | 20 GB | Unlimited sharing, backup, early access |
| Annual | −20% | — | Derived from monthly |

### Strengths
- Clear, familiar freemium ladder with a real reason to upgrade (storage + media types).
- Emotional, high-retention category — memory/legacy products have low churn once trusted.
- Referral loop already designed into the UX.

### Critical gaps & risks in the model

1. **Unit economics are unproven and probably thin.** Video/audio is the upgrade
   hook, but it's also the expensive part: object storage + egress/CDN for 20 GB of
   video per user can approach or exceed $9.99/mo once people actually *view* memories
   repeatedly (grief-tech has high re-visit rates). **Model gross margin per tier with
   real storage + egress + payment-processing (~2.9%+$0.30) costs before committing to
   these prices.** At $4.99, one Stripe fee + a few GB of egress can erase the margin.

2. **Price may be too *low* for the emotional value and too low to fund trust.**
   This is not a photo-dump app; it's grief/legacy. Willingness-to-pay for "my
   mother's voice, kept safe forever" is high. Underpricing signals impermanence —
   the opposite of the promise. Consider testing higher anchors.

3. **The "forever" problem is unaddressed.** Users implicitly expect memorial data to
   outlive *them* and the subscription. A pure monthly SaaS is philosophically at odds
   with "preserve forever." Options to design in:
   - A **Legacy / Lifetime tier** (one-time or low-annuity) funded into a reserve for
     long-term storage — a genuine differentiator in this category.
   - **Beneficiary / inheritance** flow (assign who inherits a vault) — both a feature
     and a retention/virality mechanism.

4. **No B2B2C channel.** The cheapest high-trust acquisition in this space is
   **partners at the moment of need**: funeral homes, hospices, estate/end-of-life
   planners, senior-living communities. They have the audience and the trust; we'd
   provide a white-labelable memorial vault. This can outperform paid consumer CAC.

5. **CAC/positioning undefined.** Competitors/alternatives include Google Photos/iCloud
   (free, generic), dedicated memorial sites (Ever, Keeper, ForeverMissed), and journaling
   apps. Heartory's only durable moat is **trust + permanence + emotional design**. That
   must be provable (encryption, export, compliance, a real company) — which loops back
   to why the security/compliance work below is *also a business requirement*, not just
   engineering hygiene.

6. **Free tier cost.** 500 MB free + shareable is a real COGS liability at scale with no
   conversion mechanic beyond storage. Define a target free→paid conversion (industry
   ~2–5%) and instrument it before scaling spend.

### Recommended business workstream (parallel to engineering)
- Build a **unit-economics model** (per-tier gross margin at 1k / 10k / 100k users).
- Decide the **permanence story** (Lifetime/Legacy tier + beneficiary) — likely the
  single biggest differentiator.
- Draft **one B2B2C partner pilot** (a single funeral home / hospice) as design partner.
- Define **activation & conversion metrics** and instrument them from day one.
- Stand up the **legal entity, merchant account, and policies** — required before charging.

---

## 4. Security & Compliance — Blocking Issues

These are not "nice to have." Several are **launch-blocking and/or legal liabilities.**

- **P0 — Raw card data in-app (`components/AddPaymentMethodModal.tsx` + `billingService`).**
  Collecting PAN/expiry directly puts us in PCI-DSS scope we cannot meet. **Never touch
  raw card numbers.** Must be replaced with Stripe (Payment Element / tokenization) so
  card data never hits our servers or app state.
- **P0 — No authentication.** Passwords aren't verified; no sessions. Anyone is everyone.
- **P0 — No authorization.** With a real DB, every row needs owner-scoped access control
  (e.g. Postgres Row-Level Security). Sharing must be enforced server-side, not in the client.
- **P0 — No encryption.** README promises encryption; there is none. Need TLS everywhere
  (in transit) + encryption at rest, and a decision on **client-side E2E encryption** for
  vault contents (strong trust signal, but complicates sharing/recovery — decide deliberately).
- **P1 — GDPR/CCPA.** We market to (and the README claims compliance for) data-subject
  rights. Need: lawful basis, privacy policy + ToS, consent, **data export & delete
  (DSAR)**, data-retention policy, sub-processor list/DPA, breach process.
- **P1 — Secrets management.** No `.env`, no secret handling. All keys must live in
  server-side secret storage, never in the client bundle.
- **P1 — Abuse/safety.** Rate limiting, upload validation (type/size/malware), and
  content moderation for shared/abusive uploads.
- **P2 — 2FA, audit logging, session revocation, account recovery.**

A third-party **penetration test + security review** should gate the paid launch.

---

## 5. Non-Functional Requirements Called Out by the Request

- **Load balancing / scale:** Best served by a managed platform (managed Postgres +
  object storage + CDN + serverless functions) so autoscaling and LB are handled for us
  rather than hand-rolled. Add read replicas + CDN for media as usage grows.
- **Notifications:** Expo Push for mobile + a transactional email provider (verify,
  reset, invites, receipts, "someone added a memory to a shared vault"), with per-user
  preferences and quiet defaults given the sensitive context.
- **Performance:** Media is the bottleneck. Need server-side thumbnails/transcoding,
  lazy loading + pagination, image caching (already using `expo-image`), CDN delivery,
  and list virtualization. Target: cold start < 2s, memory grid scroll at 60fps,
  media TTFB < 300ms via CDN.
- **Observability:** Error tracking (Sentry), structured logs, uptime + performance
  monitoring, and revenue/health dashboards before onboarding real clients.

---

## 6. Phased Roadmap to Paid Launch

Each phase is shippable and testable. Phases 0–2 are the **minimum to charge money
responsibly**; 3–5 harden and grow.

### Phase 0 — Foundations (the backend that doesn't exist yet)
- Choose managed platform (recommendation: **Supabase** — Postgres + Auth + Storage +
  RLS + Edge Functions + Realtime fits this app and is already connected to this workspace).
- Design DB schema + migrations (users, vaults, memories, shares, subscriptions, invoices, audit).
- Real auth (email/OTP/password with hashing, sessions, email verification).
- Object storage for media with server-side quota enforcement.
- Replace all `USE_MOCK` service calls with a typed API client; add env/secrets config.
- Fix branding leftovers (`api.memora.app`, `app.rork.memora` bundle IDs).

### Phase 1 — Monetization (do it right)
- Stripe: Products/Prices matching the tiers, Checkout/Payment Element, customer portal.
- **Remove the raw-card form**; webhooks drive subscription state (source of truth).
- Server-enforced plan limits (storage, vaults, sharing). Tax, receipts, dunning.

### Phase 2 — Trust & Compliance
- Encryption in transit + at rest; decide on E2E for vault contents.
- Row-Level Security + server-side sharing permissions.
- Privacy Policy, ToS, GDPR/CCPA DSAR (self-serve export + delete), data-retention/legacy policy.
- Audit logging; 2FA; rate limiting; upload validation.

### Phase 3 — Engagement (notifications)
- Expo Push + transactional email + preferences.
- Make referrals real (server-tracked codes, rewards, anti-abuse).
- Shared-vault activity notifications ("a memory was added").

### Phase 4 — Scale & Ops
- CI/CD, staging env, automated tests. Sentry + monitoring + alerting.
- Backups + disaster recovery + restore drills. CDN + media pipeline (thumbnails/transcode).
- Load test to target concurrency; add read replicas/caching as needed.

### Phase 5 — Launch
- App Store / Play submission (privacy nutrition labels, data-safety form).
- Analytics + conversion funnels. Support (help center, contact, SLAs).
- Legal entity, merchant account, insurance. B2B2C partner pilot.

---

## 7. Immediate Next Steps (this sprint)
1. **Decide the backend platform** (recommend Supabase) and stand up a project.
2. **Design & migrate the database schema.**
3. **Wire real auth** and flip the first service off mocks end-to-end.
4. In parallel (business): unit-economics model + permanence/pricing decision + entity/policies.

> Principle: in grief-tech, **trust is the product**. Every "boring" item above —
> encryption, backups, compliance, real payments — is also a *marketing* asset and a
> precondition to charge. We build the trust layer first, then grow.
