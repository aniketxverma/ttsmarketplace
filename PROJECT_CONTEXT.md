# PROJECT_CONTEXT.md — TTAI EMA

> Living reference for the project's architecture and state. Read this first at the start of
> every session, then inspect the relevant code before implementing. Update at the end of every
> session. Last updated: **2026-06-30**.

---

## 1. Project Overview

**TTAI EMA** is a private, role-based B2B + B2C trade ecosystem (not an open Amazon/Alibaba).
Two intertwined business models drive everything:

1. **End-user side = dropshipping.** Consumers only ever see "Shop Online" and buy under TTAI's
   own brand. The catalogue comes from already-onboarded clients (suppliers). Fulfilment is
   dropship: goods ship from the client local to the buyer, not Spain→buyer. TTAI is the
   storefront/brand; the client ships.
2. **B2B side = paid matchmaking.** Each client is *presented its counterpart* in the supply
   chain — `Factory → Supplier / Distributor → Retail Shop → End Customer`. How far up/down the
   chain a client can reach is gated by a manually-granted membership tier (no billing
   integration — admin grants the tier after offline payment).

The company runs as one **Control Center** over three departments, each with a manager:
Marketplace (Ane), Logistics Hub (Eva), Business Consulting (Zain).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2 (App Router), React 18, TypeScript 5 |
| Styling | Tailwind CSS 3.4, `tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| UI primitives | Radix UI (dialog, dropdown, select, tabs, toast, label, separator, slot), `lucide-react` icons |
| Forms | `react-hook-form` + `zod` (+ `@hookform/resolvers`) |
| Backend / DB | Supabase (Postgres + Auth + Storage). `@supabase/ssr` + `@supabase/supabase-js` |
| Payments | Stripe (`stripe`, `@stripe/stripe-js`) — checkout + Connect (brokers/sellers) |
| Email | Resend (primary) + Nodemailer fallback |
| AI | OpenAI (`openai`) — content translation (gpt-4o-mini) + assistant |
| Files / data | `exceljs`, `xlsx`, `jszip`, `sharp` (image processing) |
| Monitoring | Sentry (`@sentry/nextjs`) |
| Hosting | Vercel (`vercel.json`) |

Single app lives in [`ttai/`](ttai/). The repo root only holds git config + these docs.

---

## 3. Architecture

### Route groups (`ttai/app/`)
- **`(auth)`** — login, register, reset-password, pending-approval, account-rejected, auth-error.
- **`(dashboard)`** — role workspaces: `admin/`, `supplier/`, `broker/`, `buyer/`. Each role lands
  on its own dashboard (`ROLE_DASH` in middleware).
- **`(public)`** — marketing + storefronts: marketplace, store, brand/[slug], factories,
  distributors, suppliers, logistics, consulting, outlet, brokers, channels, checkout, pricing,
  industrial-park, p/[id] (master product), product, family, b2b, contact, etc.
- **`api/`** — ~110 Route Handlers (see §6).
- **`auth/callback`** — Supabase code/token exchange.

### Middleware ([`ttai/middleware.ts`](ttai/middleware.ts)) — runs on every non-asset request
1. **Locale detection** — cookie `TTAI_LOCALE` → IP country → Accept-Language → default `en`.
2. **Auth-callback recovery** — forwards `/?code=` / `?token_hash=` to `/auth/callback`.
3. **Auth gate** — `PROTECTED = [/supplier, /broker, /buyer, /admin, /account]` → redirect to
   `/login` if anonymous. Segment-aware so `/suppliers` (public dir) ≠ `/supplier` (dashboard).
4. **Business-only gate** — `B2B_ONLY = [/suppliers, /distributors, /factories, /marketplace]` →
   anonymous users redirected to `/store`. Social/search crawlers exempt (for share cards).
5. **Approval gate** — pending users get dashboard access but not commerce (`COMMERCE` list);
   rejected → `/account-rejected`; admins never gated. Self-heals a mis-defaulted `buyer` role
   from signup metadata via the admin client.

### Three Supabase clients (`ttai/lib/supabase/`)
- `client.ts` — browser (anon key), for client components.
- `server.ts` — SSR server components / route handlers (anon key, cookie-bound session).
- `admin.ts` — `createAdminClient()` service-role key. **Server-only.** Used for cross-user/cross-
  owner writes and public reads of RLS-restricted tables. See DECISIONS.md for the RLS rules.

### Visibility model ([`ttai/lib/business-chain.ts`](ttai/lib/business-chain.ts)) — the spine
- `chainLevel(role, businessType)` → `consumer | retail | distributor | supplier | factory | admin`.
- `canSeeB2B()` — the consumer↔business **privacy** line (everyone except pure consumers).
- `entityKind(role, businessType)` → `factory | distributor | supplier` (classifies a listing).
- `directoryAccess(level, tier)` / `accessFor()` — the **matchmaking** gate: which counterpart
  directories a viewer may browse, by chain level + paid tier.
- `unitsForRole(level)` — purchase units allowed (piece/box/pallet/truck).

**Two separate gates:** `canSeeB2B` = privacy; `tier` = directory discovery. Don't conflate them.

---

## 4. Folder Structure (`ttai/`)

```
app/
  (auth)/ (dashboard)/ (public)/   route groups
  api/                             ~110 route handlers
  layout.tsx error.tsx not-found.tsx globals.css
components/
  admin/ ai/ brand/ broker/ cart/ channels/ dashboard/ factory/ home/
  industrial/ legal/ marketplace/ messages/ opportunities/ outlet/
  pricing/ product/ purchase/ shared/ store/ supplier/ ui/
lib/
  business-chain.ts   visibility + tier matchmaking matrix (core)
  offers.ts/offers-server.ts  master/offer dedupe + ranking
  master.ts           duplicate-product linker
  pricing.ts/pricing-config.ts/pricing-rules.ts  plans + retail price protection
  tax.ts vat/         VAT engine + validation
  control-center.ts   departments/managers/statuses config
  broker.ts           broker levels + points
  outlet.ts conditions.ts  outlet zone config
  distribution-network.ts  per-supplier network (app_settings JSON)
  i18n/               localizeUI/tt (server), useT/t (client), locales, es.ts
  supabase/           client.ts server.ts admin.ts
  email/ stripe/ cart/ fees/ invoices/ validation/ whatsapp/
  retail.ts market-regions.ts regions-* industrial-parks.ts house-brand.ts
  app-url.ts impersonation.ts supplier-status.ts utils.ts ...
supabase/migrations/  0001 … 0085 (.sql) — applied MANUALLY by the user
types/database.ts     generated Supabase types (STALE — predates ~migration 0040+)
scripts/              i18n AST tooling, image upload, warm-cache
docs/                 homepage-arrangement.md, homepage-assets-guide.md
```

---

## 5. Database Schema (Postgres / Supabase)

Migrations `0001`–`0085` are the **source of truth** (the generated `types/database.ts` is stale).
Migrations are applied **manually by the user** in the Supabase SQL editor.

### Core identity & geo
- `profiles` — 1:1 with `auth.users`. `role` (buyer/business_client/supplier/broker/admin),
  `tier` (free/standard/pro/full, migration 0022), `approval_status`, `business_type`,
  `country_name`/`tax_country`, `vat_number` (0035).
- `countries`, `cities`, `provinces`, `towns`, `neighborhoods` — retail location hierarchy
  (0054 schema, 0055 Spain seed). Continent layer is config (`lib/market-regions.ts`).

### Suppliers & brand profiles
- `suppliers` — the company row (status PENDING/UNDER_REVIEW/ACTIVE/…, business_type,
  marketplace_context, brand_slug, brand_color, outlet_role, premium_partner, protected, etc.).
- `supplier_documents` (0052 meta: title/public/sort), `supplier_state_audit`, `supplier_regions`,
  `supplier_channels`, `supplier_share_grants` (0039), `supplier_offers` (0049), `sales_network` (0048).
- `brand_gallery` (incl. type='video'), `brand_certifications`, `brand_reviews` (0009).
- POS: `supplier_pos`, `pos_locations`, `pos_details`, `pos_private_details`.
- `supplier_promotions`, `sponsored_placements` + `catalogues` (0040).

### Catalogue
- `products` — each supplier's row IS their offer; grouped by `master_product_id`. condition,
  selling_unit, warranty, warehouse_location, delivery_days, retail_available, delivery_scope,
  is_outlet/outlet_source/lot_type, retail_price_cents + wholesale tiers.
- `master_products` (0043) — one logical product, many offers. `brands` (0038). `product_images`.
- `categories` — with priority (0067).

### Commerce
- `orders`, `order_items`, `invoices`, `transaction_ledger`, `payouts`. payment_method (0050),
  dropship (0051).

### Brokers (0071)
- `brokers` (broker_code `BRK-XXXXXX`, connection_points), `broker_referrals`, `broker_deals`,
  `broker_supplier_assignments`, `broker_promotions`.

### Engagement / CRM
- `tickets` + `ticket_notes` (0068, Control Center). `trade_requests` (0070, outlet board).
- `business_opportunities` (0072). `purchase_requests` (0077). `whatsapp_groups` (0062).
- `channel_members`, `channel_posts` (0013). `ai_chats` (0008). `registration_requests` (0058).
- `email_log` (0083, +html 0085).

### Infra config
- `content_translations` (0031) — i18n cache. `app_settings` (0032) — key/value runtime config
  (translation keys, pricing/tax config, per-supplier distribution-network JSON). Server-read only.
- `admin_audit_log`.

> **RLS rule of thumb:** any new public-facing table needs a `for select using(true)` policy in the
> same migration, or public pages 404. Any cross-owner write must go through a server route + admin
> client. See DECISIONS.md.

---

## 6. APIs & Integrations

### Internal Route Handlers (`app/api/`, ~110)
Grouped by area:
- **admin/** — approve, suppliers/[id]/(transition|house|protected|premium-partner|managed-deals|
  catalogue-service|notes), user-update, pricing, translation, marketplace-phase, link-duplicates,
  category(+priority/template), sponsorships, transactions, invoices, impersonate, return, audit, ticket.
- **supplier/** — brand, products/bulk-line, offers, master, family, import/(parse|commit|upload-url|
  cleanup), distribution-network, network, modules, pos, promote, share, sync-regions, category-request.
- **broker/** — deal, refer. **brokers/** — connect (+callback), me.
- **Commerce** — checkout, orders/(simple|supplier|[id]/fulfill), membership/(checkout|portal),
  invoices, vat/validate, purchase-request, trade-request, network/accept.
- **Engagement** — ticket (public CORS, any external form posts here), channels(+posts/join/upload),
  groups, conversations/messages, chat (AI), opportunity, register-notify, search/suggest, categories.
- **Webhooks/cron** — webhooks/stripe, whatsapp/webhook, cron/(auto-deliver|expiring-promotions|
  onboarding-review), health, ready.
- **Utility** — upload (→ brand-assets bucket), account/avatar, profile/update, auth/(callback|signout|forgot-password).

### External integrations
- **Supabase** — DB, Auth (incl. Google OAuth — must be enabled in dashboard), Storage (`brand-assets`).
- **Stripe** — checkout sessions, membership, Connect (broker/seller payouts), `webhooks/stripe`
  flips card orders to `paid`. Price IDs pending (STANDARD €79 / PRO €158 / FULL €210).
- **Resend / Nodemailer** — transactional + notification email; logged in `email_log`.
- **OpenAI** — translation fill (gpt-4o-mini, key in `app_settings.translation_openai_key`) + assistant.
- **WhatsApp** — currently tap-to-send `wa.me` links; Business API not yet wired (see TODO).

---

## 7. Authentication & Authorization

- **Auth:** Supabase Auth (email/password + Google OAuth). Session via `@supabase/ssr` cookies.
  Registration writes the chosen role into user metadata; middleware self-heals the profile role.
- **Approval flow:** new users reach their dashboard immediately (so admins get their details) but
  are blocked from commerce until `approval_status = approved`. Rejected → `/account-rejected`.
- **Roles:** `buyer`, `business_client`, `supplier`, `broker`, `admin`. Admin is never
  self-assignable via signup metadata.
- **Authorization layers:** (1) middleware route gates; (2) Supabase RLS per table;
  (3) `business-chain.ts` visibility + tier matrix for what content/directories render.
- **RLS gotcha:** ACTIVE suppliers cannot self-update their `suppliers` row from the client
  (policy only allows PENDING/UNDER_REVIEW) — route through `/api/supplier/brand` (admin client +
  field whitelist). Same for admin editing other users' `profiles` (`/api/admin/user-update`).

---

## 8. i18n

- Locked to **en + es** (`SUPPORTED_LOCALES` in `lib/i18n/locales.ts`); other locales wired but
  disabled. Cookie `TTAI_LOCALE`. Default `en`.
- **Server UI** → `localizeUI(texts, locale)` → `tt(s)`; reads `content_translations`, auto-fills
  misses in background via OpenAI.
- **Dynamic content** (product/category names) → `translateCached` / `localizeNames`.
- **Client UI** → `useT()` → `t('key')`; English string used AS a top-level key in `es.ts`
  (only works if the string has no dots). Falls back to the key (= English) on miss.
- AST tooling in `scripts/` (`i18n-ast.js`, `i18n-ast-client.js`, `strings-to-es.js`, `warm-list.js`).
- **CRITICAL build gotcha:** a server-only import leaking into a module reachable by a `'use client'`
  file breaks `next build` (tsc won't catch it). Always check whole-file client-reachability.

---

## 9. Features Implemented

- **Matchmaking & tiers** — chain-level directory gating (Suppliers/Distributors/Factories) with
  per-level free direct relationship + paid upgrades; `/pricing` plans.
- **Marketplace** (9-phase roadmap shipped) — Products/Shops tabs, Europe country banner, retail
  location hierarchy (Spain), business-type badges, region config (`market-regions.ts`).
- **Master/offer model** — one master product, many supplier offers; dedupe + ranking; `/p/[id]`.
- **Brand profiles** — one shared `/brand/[slug]` template (hero, tabs, sidebar, documents, videos,
  reviews, POS, channel, distribution-network tab).
- **Distribution Network** — invitation-only manufacturer program (`/factories`); recursive
  per-supplier hub-and-spoke network circle; supplier editor; invite-by-email accept flow.
- **Outlet Zone** (`/outlet`) — clearance/returns B2B with full filters + trade board (`/outlet/board`).
- **Broker Network** (`/broker`) — referrals, points, levels (Bronze→Platinum), deals, Connect payouts.
- **Control Center** (`/admin/control-center`) — ticket CRM over 3 departments; public `/api/ticket`.
- **Storefronts** — `/store` (retail, allowlisted online shops), `/b2b` Trade Hub (house brand),
  shopping mall, checkout (Stripe + bank transfer + COD).
- **Channels / WhatsApp groups**, **Industrial Park**, **AI Assistant**, **admin suite** (users,
  suppliers, products, pricing, translations, registrations, orders, transactions, audit log).
- **i18n** — full en/es wiring across all pages + components.
- **Auth gating** — `useAuthGate` (browse free, sign-in to act).

---

## 10. Current Roadmap (high-level — details in TODO.md)

1. **Home-page channel model** (`docs/homepage-arrangement.md`) — Trade Hub 2-card B2B/Online split,
   TTAIEMA company profile page, wire the 3 channel cards + STEP 01–04 cards, Live Channels banner.
2. **Automated dispatch** — replace tap-to-send WhatsApp/email links with server-side sending
   (Resend + WhatsApp Business API / Twilio).
3. **Supplier "Mark as paid"** for bank-transfer/COD orders.
4. **Stripe Connect** seller onboarding (Retail/Business shops paid directly) + membership price IDs.
5. **Marketplace polish** — per-product delivery_scope radius, business_type on brand header,
   2nd retail market beyond Spain.
6. **Distribution Network** — auto-link a node to a partner's profile on accept.
7. **Broker/Outlet** — TTAIEMA-assigned opportunities feed, admin moderation of board + deals,
   auto-link referred companies on signup.

---

## Maintenance protocol
- **Start of session:** read this file + DECISIONS.md + TODO.md, then inspect relevant code.
- **End of session:** update all three to reflect the new state (what shipped, decisions made,
  todos opened/closed). See CLAUDE.md.
