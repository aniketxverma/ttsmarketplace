# DECISIONS.md — TTAI EMA

> Architectural & business decisions, the reasoning behind them, and the coding conventions every
> change must follow. Read alongside PROJECT_CONTEXT.md. Last updated: **2026-06-30**.

---

## Business decisions

### B1 — Dropshipping storefront + paid B2B matchmaking (the core model)
Consumers buy under TTAI's own brand; the onboarded client ships locally (dropship). B2B clients
are *presented their counterpart* in the chain, gated by a paid tier.
**Why:** TTAI is a brand/storefront + matchmaker, not a logistics owner or open marketplace.

### B2 — Manual tier activation (no billing integration for matchmaking access)
`profiles.tier` (free/standard/pro/full) is set by an admin **after offline payment**; there is no
automated upgrade flow for directory access.
**Why:** early stage, few clients, payment terms negotiated offline. Stripe membership scaffolding
exists but price IDs are pending.

### B3 — One free direct relationship per chain level; everything else is paid
- Free direct pairs: **Factory ↔ Supplier**, **Distributor ↔ Retail**, **End user ↔ Retail**.
- Retail climbs the ladder: Distributors free → Suppliers need `pro` (€158) → Factories need
  `full` (€210, a distinct plan, not a top-up).
**Why:** the matchmaking value is *controlled discovery*; the client (Tai/Zain) confirmed this rule
2026-06-21. Encoded in `directoryAccess()`.

### B4 — Distribution Network mechanics are NEVER explained publicly
The `/factories` teaser only drives a "Request a Private Presentation" contact. The full system is
shown only in a private meeting.
**Why:** protects the uniqueness of the business model (Zain is adamant). Applies to all public copy.

### B5 — Retail online-purchase allowlist
Only `['rozil','yasra','ttaiema']` (`lib/retail.ts`) appear in the Shopping Mall and allow online
checkout; everyone else is B2B-only.
**Why:** only real end-user shops should take consumer money; the rest are wholesale.

### B6 — One Control Center, three departments
All client requests become tickets routed to Marketplace (Ane) / Logistics (Eva) / Consulting (Zain).
Managers are currently text labels, not login accounts.
**Why:** single CRM spine; the separate Marketplace server posts into `/api/ticket`.

---

## Architectural decisions

### A1 — Master/offer model reuses `products` rows (no separate offers table)
Each supplier's `products` row IS their offer; rows sharing `master_product_id` are grouped.
**Why (2026-06-09):** cart/checkout/orders already reference product rows — reusing them avoids
rewriting commerce. Dedupe/ranking live in `lib/offers.ts` (`dedupeByMaster`, `sortOffers`).

### A2 — Three Supabase clients with strict roles
`client.ts` (browser/anon), `server.ts` (SSR/anon, session-bound), `admin.ts` (service-role,
server-only). **Never import `admin.ts` into anything client-reachable.**

### A3 — RLS: cross-owner writes go through server routes with a field whitelist
ACTIVE suppliers cannot self-update `suppliers` from the client (RLS allows only PENDING/UNDER_REVIEW)
→ silently 0 rows. Admin editing another user's `profiles` has the same problem.
**Rule:** any cross-user / cross-owner write to an RLS-restricted table (`suppliers`, `profiles`)
goes through a server route using the admin client + ownership/role check. Examples:
`/api/supplier/brand`, `/api/admin/user-update`, `/api/admin/approve`.

### A4 — Public-facing tables need a public SELECT RLS policy
A new table not readable by anon makes public pages return `null` → `notFound()` → 404. This bit
`master_products` (every product card 404'd once data linked to it).
**Rules:** (a) ship `for select using(true)` in the same migration for any public table; (b) public
master/catalog reads use `createAdminClient()` (safe — read-only, filtered to published/ACTIVE);
(c) **verify with the anon key** after schema changes, the way a visitor sees it.

### A5 — Beware PostgREST limits on embeds and `.in()`
- Multiple FKs to the same table make `suppliers(...)` embeds ambiguous → disambiguate with
  `suppliers!supplier_id(...)`.
- A single `.in('supplier_id', ids).limit(1200)` hits the ~1000-row cap and starves other entities
  → fetch **per entity** in parallel (`Promise.all`, small `.limit()` each), count separately.

### A6 — Migrations are applied manually by the user
I write the `.sql` file and make the code **migration-safe** (`select('*')` not new column names,
defensive update/retry), then tell the user to run it in the Supabase SQL editor. I have
service-role read/write via node to verify columns exist, but I **cannot run `ALTER TABLE`**.

### A7 — Runtime config in `app_settings` (key/value), server-read only
Translation keys, pricing/tax config, and per-supplier distribution-network JSON
(`dist_network:<id>`) live here. Not anon-readable → read via the admin client.

### A8 — Two distinct visibility gates
`canSeeB2B` = the consumer↔business **privacy** line. `tier`/`directoryAccess` = **matchmaking
directory discovery**. Keep them separate — do not gate one with the other.

### A9 — i18n is cache-backed and self-filling, locked to en+es
Server `localizeUI`/`tt()` → `content_translations`; client `useT`/`t()` → top-level keys in `es.ts`.
**Why:** translations fill on demand and cache, no manual translation files to maintain per string.

### A10 — Stripe Connect for seller/broker payouts (planned)
Retail/Business marketplace sellers get paid directly (their money), so they need Connect onboarding.
Trade Hub (house brand) money goes to TTAIEMA. Connect is partially wired for brokers (`brokers/connect`).

---

## Coding standards & conventions

### Language & structure
- **TypeScript everywhere.** Server Components by default; add `'use client'` only when needed
  (state, effects, browser APIs, event handlers).
- **Route handlers** in `app/api/**/route.ts`; shared logic in `lib/`. Config (departments, tiers,
  outlet conditions, broker levels, regions) is **single-sourced** in a `lib/*.ts` file — edit there.
- Path alias `@/` → `ttai/` root.

### Data access
- Browser components → `lib/supabase/client`. Server components / routes → `lib/supabase/server`.
- Cross-owner writes / public reads of restricted tables → `lib/supabase/admin` **inside a route only**.
- Generated `types/database.ts` is **stale**; columns added after ~0040 may need `as any` casts.
  Treat the migrations as schema truth, not the types file.

### Migrations
- Numbered `NNNN_name.sql` in `supabase/migrations/`. Include RLS policies for public tables.
- Make code degrade gracefully until the user applies the migration (defensive `select('*')`).

### i18n
- Server component: run `scripts/i18n-ast.js` then warm with `scripts/warm-list.js`.
- Client component: run `scripts/i18n-ast-client.js` then `scripts/strings-to-es.js`.
- Inject `tt`/`t` only into the main exported component (helpers don't have it in scope).
- A component imported by any `'use client'` file cannot be async-server.

### Verification & workflow
- **Default workflow: write code → commit → push.** The user deploys and tests there.
- **Do NOT run routine local production builds** — slow, unnecessary friction. `tsc --noEmit` is fine.
- **EXCEPTION:** run `npm run build` locally before pushing **i18n / module-boundary changes**
  (server-only import leaks break the client bundle and tsc won't catch it), or to reproduce a
  reported break.
- Reference code as `file_path:line`. Match surrounding code style, comment density, naming.

### Commits
- Branch off `main` only if asked to commit/push. End commit messages with the Co-Authored-By line.

---

## Open questions / things to confirm with the user
- Mini-hub / vending-machine explainer copy (home STEP cards).
- Which channels/groups to feature in the Live Channels banner.
- Stripe Connect onboarding scope + final membership price IDs.
