# TODO.md — TTAI EMA

> Tracks done / in-progress / roadmap / bugs. Update at the end of every session. Read at the
> start of every session. Last updated: **2026-06-30**.

---

## ✅ Completed (major)

- **Matchmaking & tiers** — `business-chain.ts` chain levels, `directoryAccess`, per-level free
  direct relationship + paid upgrades; `/suppliers` `/distributors` `/factories` gated;
  `/pricing` plans (free/standard €79/pro €158/full €210); admin per-user Plan selector.
- **Master/offer model** — `products` rows grouped by `master_product_id`; `dedupeByMaster` +
  `sortOffers` (price → nearest → delivery → tier → stock); `/p/[id]` aggregated master page;
  dedupe across all storefronts; bulk duplicate linker (`/api/admin/link-duplicates`).
- **Marketplace 9-phase roadmap** — Products/Shops tabs, Europe country banner, retail location
  hierarchy (Spain seeded), business_type badges, region config (`market-regions.ts`),
  retail_available/delivery_scope wired.
- **Brand profiles** — shared `/brand/[slug]` template (hero, tabs, sidebar, documents, videos,
  reviews, POS, channel, Network tab).
- **Distribution Network** — invitation-only `/factories` teaser; recursive per-supplier
  hub-and-spoke circle; supplier editor (`/supplier/distribution-network`); invite-by-email +
  `/api/network/accept` (creates store, promotes role, optional catalogue import); contact topic
  pre-fill. Chtaura CMC seeded as demo (+ Createl recursion demo).
- **Outlet Zone** (`/outlet`) — clearance/returns B2B, full filters, participant onboarding;
  trade board `/outlet/board` (`trade_requests`).
- **Broker Network** (`/broker`) — Broker ID `BRK-XXXXXX`, points, levels, referrals, deals
  (mandatory ≥1 supplier + ≥1 buyer ref rule), Connect payouts scaffolding.
- **Control Center** (`/admin/control-center`) — tickets + notes, 3-department routing, public
  CORS `/api/ticket`, contact form, KPIs, detail view (reassign/status/notes/reply).
- **Storefronts & commerce** — `/store` (retail allowlist), `/b2b` Trade Hub (house brand),
  shopping mall, checkout (Stripe + bank transfer + COD), invoices, orders, Stripe webhook
  flips card orders to `paid`.
- **i18n** — full en/es wiring across all pages + components; AST tooling; verified tsc-clean.
- **Auth gating** — `useAuthGate` (browse free, sign-in to act); approval flow; role self-heal.
- **Registrations** — `registration_requests` table + admin list + email notify.
- **Channels / WhatsApp groups, Industrial Park, AI Assistant, admin suite.**

---

## 🔧 In progress / next up
_(nothing actively in progress this session — analysis + docs scaffolding only)_

---

## 🗺️ Roadmap (prioritised)

### P1 — Home-page channel model (`ttai/docs/homepage-arrangement.md`)
- [ ] **Trade Hub 2-card split** (B2B + Online) with role-based routing + dual-pricing wiring
  (e.g. Bullz €0.75 Online / €0.25 B2B). House-brand pricing already modeled — mostly wiring.
- [ ] **TTAIEMA company profile page** (plans / dropshipping / examples → Hub Logistics).
- [ ] Wire the 3 channel cards + the "Three Sales Channels" rows to real destinations.
- [ ] Rewrite STEP 01–04 cards to explain the system in the client's city (await mini-hub copy).
- [ ] "Live Channels" banner in Business Channels (await which channels to feature).

### P2 — Automated dispatch (deferred follow-up)
- [ ] Replace tap-to-send `wa.me` / `mailto` links in `/supplier/offers`, `/supplier/network`,
  invoices with server-side sending: Resend (email) + WhatsApp Business API / Twilio. Keys in
  `app_settings`.

### P3 — Payments
- [ ] Supplier **"Mark as paid"** button for bank-transfer/COD orders on `/supplier/orders/[id]`
  (card orders already auto-flip via webhook).
- [ ] **Stripe Connect** seller onboarding (Retail/Business shops paid directly).
- [ ] Set membership Stripe price IDs: STANDARD €79 / PRO €158 / FULL €210.

### P4 — Marketplace polish
- [ ] Per-product `delivery_scope` radius in `/store` location filter (currently seller-level).
- [ ] Show business_type badge on the brand-page header (currently only on ShopCards).
- [ ] Wire a 2nd retail market beyond Spain (`retailDefaultIso` per region already in config).

### P5 — Network / broker / outlet
- [ ] Auto-link a distribution-network node to the partner's profile on accept (currently manual paste).
- [ ] TTAIEMA-assigned opportunities feed to brokers.
- [ ] Admin moderation of the trade board + broker deals in the Control Center.
- [ ] Auto-link referred companies to their broker on signup.
- [ ] Supplier Excel-catalogue presentation (company info + featured per category + "View Full
  Catalogue") — partly exists via CatalogViewer/SupplierCatalog.

---

## 🐛 Bugs & improvements (smaller)
- [ ] `scripts/upload-rozil-images.js` has a hard-coded service-role key — read from env instead.
- [ ] Regenerate `types/database.ts` (stale, predates ~migration 0040+) to drop `as any` casts on
  `tier` and other newer columns.
- [ ] A few product-form labels still hardcoded English ("Price per box/pallet/truck").
- [ ] Some `cities` have null `province_id` (fills as suppliers register — not a bug, just incomplete).

---

## 📌 User must apply (manual)
- Confirm all migrations through **0085** are applied in Supabase (user applies manually).
  Historically pending at various points: 0035, 0044–0050, 0056–0058, 0068–0071. Re-confirm.
- Set Vercel env: `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`,
  `SUPABASE_SERVICE_ROLE_KEY`, Stripe keys + membership price IDs.
- Enable Google OAuth in the Supabase dashboard (Auth → Providers → Google).
