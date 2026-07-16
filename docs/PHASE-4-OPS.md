# Phase 4 — Scale & Ops

Operational readiness: CI, error tracking, performance, and the backup/scaling
plan.

## What shipped (code)
- **CI** — `.github/workflows/ci.yml` runs `tsc --noEmit` on every PR and push to
  `master`. (This is why later PRs get a real status check.)
- **Error tracking** — `lib/monitoring.ts` initializes Sentry, guarded by
  `EXPO_PUBLIC_SENTRY_DSN` (no-ops without it). `captureException` is used by the
  error boundary and can be called anywhere.
- **Error boundary** — `components/ErrorBoundary.tsx` wraps the app; render-time
  crashes show a gentle recovery screen and are reported.
- **Performance** — home list uses windowed `FlatList` rendering
  (`initialNumToRender`, `windowSize`, `removeClippedSubviews`). Media already
  uses `expo-image` (disk/memory cache) and private-bucket **signed URLs** served
  from Supabase's CDN.

## Managed infra = load balancing handled
Supabase runs managed Postgres, PgBouncer connection pooling, object storage, and
a global CDN, and Edge Functions autoscale. There is no load balancer to hand-roll
at this stage. As usage grows:
- Add **read replicas** for read-heavy traffic.
- Front media with the CDN (already the case for public buckets; signed URLs are
  cache-friendly).
- Add caching (e.g. Cloudflare) and paginate large memory lists (cap queries,
  add `range()` paging) — the query layer is centralized in `memoryService`.

## Manual configuration (you do this)
1. **Sentry**: create a project, set `EXPO_PUBLIC_SENTRY_DSN`. For native
   symbolication + source maps, add the `@sentry/react-native/expo` config plugin
   to `app.json` with your org/project and wire the EAS build hook.
2. **Backups / DR**: enable Point-in-Time Recovery in Supabase (paid tier) and
   verify daily backups. Periodically run a **restore drill** into a scratch
   project. Storage is replicated by the provider; keep an export path (the
   `account-export` function) for user-level recovery.
3. **Monitoring/alerts**: turn on Supabase project alerts (CPU, disk, error rate)
   and Sentry alerting. Add uptime monitoring (e.g. a health ping) for the app's
   web deployment and Edge Functions.
4. **Load testing**: before a launch push, run a load test (k6/Artillery) against
   the Edge Functions and DB to your target concurrency; add indexes/replicas as
   the results indicate.

## CI note
The workflow installs with `npm ci`, so keep `package-lock.json` committed and in
sync (it is).
