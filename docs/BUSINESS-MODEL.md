# Heartory — Business Model & Pricing Strategy

Companion to `GO-LIVE-ANALYSIS.md`. This turns "will it make money?" into concrete
decisions. An interactive version of the unit-economics model accompanies this doc
(contribution-margin calculator — drag the assumptions).

---

## 1. The unit-economics reality

Per **paying** user, per month, contribution margin =
`subscription revenue − Stripe fees − storage − egress`.

Two costs dominate and both are fixable by design, not discounting:

1. **Stripe's fixed $0.30 per charge.** On $4.99 monthly, fees are
   `2.9% × 4.99 + 0.30 = $0.445` — **~9% of revenue gone to the fixed fee alone**,
   billed *every month*. On **annual** billing the $0.30 is paid once, so the
   effective fee drops to ~3%. Annual billing is the single biggest margin lever.
2. **Egress.** Grief-tech has an unusually high re-visit rate — people come back to
   watch a parent's video, hear a voice. At ~$0.09/GB, a Pro user who re-views a few
   GB of video a month can erase a large slice of the $9.99. Storage ($0.021/GB·mo)
   is comparatively cheap; **egress is the variable that can go negative.**

**Implications**
- Sticker margins look fine at rest and get thin under real viewing. Model at
  ≥0.5× monthly-views-to-stored ratio, not zero.
- The free tier is pure COGS with no revenue. 500 MB + shareable is generous; every
  free user is a small monthly loss that paid conversion must cover.

---

## 2. Pricing recommendations

1. **Make annual the default, not an afterthought.** Present annual first, framed as
   the plan for something meant to last "forever." It fixes the Stripe-fee problem and
   improves cash flow and retention. Target ≥50% of paid users on annual.
2. **Test a higher anchor.** $4.99 underprices the emotional value ("my mother's
   voice, kept safe") and signals impermanence — the opposite of the promise. Test
   Premium at $6.99–$8.99 and Pro at $12.99–$14.99; in this category, willingness to
   pay is driven by trust and permanence, not by matching a photo-app price.
3. **Cap or meter true video/egress abuse** on the top tier (fair-use policy or a
   soft cap) so a handful of heavy re-viewers don't invert the tier's economics.
4. **Set a conversion target and instrument it.** Industry freemium converts ~2–5%;
   the app now emits `sign_up`, `vault_created`, `checkout_started`. Instrument
   activation ("first memory added") and free→paid, and don't scale paid acquisition
   until conversion clears your blended-margin break-even (see the calculator's
   "blended contribution per signup").

---

## 3. The "forever" problem — and the differentiator

People implicitly expect memorial data to **outlive them and their subscription.** A
pure monthly SaaS is philosophically at odds with "preserve forever," and that gap is
also the opportunity — no mainstream competitor solves it well.

### 3a. A Lifetime / Legacy tier
Sell a **one-time (or low-annuity) Lifetime plan** whose price funds a long-term
storage reserve.

- **The math to run:** if perpetual storage of an average vault costs `C`/year in
  storage + expected egress, a Lifetime price of `~20–30 × C` invested conservatively
  funds it indefinitely (a 3–4% real return covers `C`). Keep the reserve as a tracked
  liability, not general revenue.
- **Why it wins:** it's a genuine, hard-to-copy promise, a large up-front cash inflow,
  and it removes churn entirely for those users. Price it as a premium "forever"
  commitment (e.g. $199–$399 one-time), not a discount.

### 3b. Beneficiary / inheritance
Let a vault owner name a **beneficiary** who inherits access (view, then optionally
ownership) under defined conditions. This is:
- a **feature** (completes the "forever" story),
- a **virality loop** (the beneficiary becomes a user), and
- a **retention/moral lock-in** (families consolidate memories here).

Implementation is tractable on the current schema: a `vault_beneficiaries` table +
an inheritance/hand-off flow reusing the existing sharing + edge-function patterns.
This is the recommended **next code build** once pricing is set.

---

## 4. Go-to-market: lead with B2B2C

The cheapest high-trust acquisition in this category is **partners at the moment of
need**, not consumer paid ads (where CAC is high and targeting grief is fraught):

- **Funeral homes, hospices, estate/end-of-life planners, senior-living communities.**
  They already hold the audience and the trust; Heartory provides a white-labelable
  memorial vault they offer families.
- Start with **one design-partner pilot** (a single funeral home or hospice), measure
  activation and conversion, then templatize.
- Consumer/organic (referral loop already built) runs in parallel but shouldn't be the
  primary paid channel until LTV\:CAC is proven.

---

## 5. LTV : CAC framework

- **LTV** = contribution-margin/mo × expected lifetime (months). Annual + Lifetime tiers
  extend lifetime dramatically; grief/legacy retention is high once trust is earned.
- **CAC**: keep B2B2C partner CAC and consumer CAC separate. Gate paid spend on
  **LTV ≥ 3 × CAC** with payback < 12 months.
- **Reserve accounting**: track the Lifetime storage reserve as a liability; report
  contribution margin **after** reserve contributions so "forever" is actually funded.

---

## 6. Decisions to make (owner: founder)

1. Annual-first + higher price anchors — run an A/B or launch test.
2. Lifetime tier price (after the reserve math) and whether to ship at launch.
3. Beneficiary/inheritance — approve for the next build.
4. First B2B2C pilot partner.
5. Fair-use/egress policy on the top tier.

> Trust is the product. Every "boring" trust item already shipped (encryption, RLS,
> real payments, GDPR export/delete) is also a **sales asset** for the B2B2C motion and
> a precondition for charging.
