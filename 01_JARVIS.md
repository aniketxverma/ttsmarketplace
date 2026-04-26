# ════════════════════════════════════════════════════════════════
# JARVIS — TTAI FOUNDATION & DATABASE
# Packet 1 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the foundation layer of the TTAI marketplace. Execute this packet end-to-end. Do not ask questions mid-build. Do not skip files. Do not improvise schemas — use exactly what is specified.

## MISSION
Scaffold a Next.js 14 (App Router) application with Supabase as the database and auth provider. Set up the complete database schema, Row Level Security (RLS) policies, and seed data for the TTAI marketplace.

## STACK
- Next.js 14 (App Router, TypeScript)
- Supabase (Postgres + Auth + Storage)
- Tailwind CSS
- Stripe (installed, not yet wired)
- Resend (installed, not yet wired)
- Zod (validation)

## DEPENDENCIES
None. This is the first packet.

## FILES TO CREATE

### Root config
- `package.json` — dependencies listed in Specifications
- `next.config.js` — image remote patterns for `**.supabase.co` and `**.r2.cloudflarestorage.com`
- `tsconfig.json` — strict mode, path alias `@/*`
- `tailwind.config.ts` — with shadcn/ui design tokens (HSL CSS vars)
- `.env.local.example` — all env vars commented and grouped
- `.gitignore` — standard Next.js + `.env.local`
- `postcss.config.js` — tailwindcss + autoprefixer

### App scaffolding
- `app/layout.tsx` — root layout with Inter font
- `app/globals.css` — Tailwind directives + CSS variables for theme

### Supabase clients
- `lib/supabase/client.ts` — browser client using `createBrowserClient` from `@supabase/ssr`
- `lib/supabase/server.ts` — server client using `createServerClient` with cookies
- `lib/supabase/admin.ts` — service-role client (bypasses RLS, server-only)

### Middleware
- `middleware.ts` — refresh Supabase session on every request, protect `/supplier`, `/broker`, `/buyer`, `/admin` routes by redirecting unauthenticated users to `/login`

### Database migrations
- `supabase/migrations/0001_initial_schema.sql` — all tables, enums, indexes, triggers
- `supabase/migrations/0002_rls_policies.sql` — RLS policies for every table
- `supabase/migrations/0003_functions.sql` — helper SQL functions (e.g. `current_user_role()`)
- `supabase/migrations/0004_seed_data.sql` — countries, cities, categories
- `supabase/config.toml` — local dev config

### Type definitions
- `types/database.ts` — Supabase-generated types (placeholder; will be regenerated via CLI)
- `types/domain.ts` — shared domain types (UserRole, MarketplaceContext, etc.)

## SPECIFICATIONS

### package.json dependencies (exact)
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@stripe/stripe-js": "^3.0.0",
    "@supabase/ssr": "^0.4.0",
    "@supabase/supabase-js": "^2.43.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.383.0",
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7.51.5",
    "resend": "^3.2.0",
    "stripe": "^15.7.0",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.6.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "postcss": "^8",
    "supabase": "^1.178.2",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

### Environment variables (.env.local.example)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=development

# Email
RESEND_API_KEY=
EMAIL_FROM=noreply@ttai.com

# Storage (Cloudflare R2 optional)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=ttai-assets

# AI
ANTHROPIC_API_KEY=

# Sentry
SENTRY_DSN=
```

### Database schema — ENUMS
```sql
CREATE TYPE user_role AS ENUM ('buyer', 'business_client', 'supplier', 'broker', 'admin');
CREATE TYPE marketplace_context AS ENUM ('wholesale', 'retail', 'both');
CREATE TYPE supplier_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED');
CREATE TYPE reliability_tier AS ENUM ('UNVERIFIED', 'BRONZE', 'SILVER', 'GOLD');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'fulfilled', 'delivered', 'cancelled', 'refunded', 'disputed');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending_conditions', 'issued', 'paid', 'void');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
```

### Database schema — TABLES (build in this exact order)

1. **countries** (id, iso_code unique, name, currency_code, vat_rate, is_eu bool, is_active bool, created_at)
2. **cities** (id, country_id FK, name, slug, retail_active bool, unique on country_id+slug)
3. **profiles** (id PK FK to auth.users, role enum default 'buyer', full_name, phone, preferred_language CHAR(2), country_id FK, city_id FK, created_at, updated_at)
4. **suppliers** (id, owner_id FK profiles, legal_name, trade_name, tax_id, vat_number, country_id FK, city_id FK, address_line1, address_line2, postal_code, status enum default PENDING, reliability_tier enum default UNVERIFIED, marketplace_context enum default wholesale, description, logo_url, admin_notes, verified_at, created_at, updated_at)
5. **supplier_documents** (id, supplier_id FK cascade, doc_type, file_url, uploaded_at)
6. **supplier_state_audit** (id, supplier_id FK, from_status, to_status, reason, actor_id FK profiles, created_at)
7. **brokers** (id, user_id FK profiles unique, legal_name, tax_id, vat_number, tax_jurisdiction CHAR(2) default 'ES', stripe_account_id unique, stripe_onboarding_complete bool, commission_pct NUMERIC(5,2) default 5.00, fixed_fee_cents INT default 100, broker_share_pct NUMERIC(5,2) default 10.00, status check ('PENDING','ACTIVE','SUSPENDED'), created_at, updated_at)
8. **broker_supplier_assignments** (broker_id, supplier_id, assigned_at, PK on both)
9. **categories** (id, parent_id self-FK, name, slug, marketplace_context enum default both, depth INT default 0, sort_order INT default 0, unique on parent_id+slug)
10. **products** (id, supplier_id FK, category_id FK, marketplace_context enum, city_id FK, name, slug, description, sku, price_cents INT, currency_code CHAR(3) default 'EUR', min_order_qty INT default 1, stock_qty INT default 0, is_published bool default false, vat_rate NUMERIC(5,2), weight_grams INT, created_at, updated_at)
11. **product_images** (id, product_id FK cascade, url, sort_order INT default 0)
12. **broker_promotions** (id, broker_id FK, product_id FK, promotion_slot INT, starts_at, ends_at, custom_pitch, is_active bool default true, created_at)
13. **orders** (id, buyer_id FK profiles, supplier_id FK, broker_id FK nullable, marketplace_context enum, status enum default pending, subtotal_cents, vat_cents default 0, shipping_cents default 0, total_cents, currency_code default 'EUR', buyer_country_id FK, shipping_address JSONB, stripe_payment_intent_id, stripe_checkout_session_id, idempotency_key TEXT UNIQUE, created_at, updated_at)
14. **order_items** (id, order_id FK cascade, product_id FK, quantity INT, unit_price_cents INT, vat_rate NUMERIC(5,2), line_total_cents INT)
15. **invoices** (id, order_id FK unique, broker_id FK nullable, invoice_number unique, status enum default draft, conditions_passed bool, conditions_payload JSONB, buyer_country CHAR(2), buyer_vat_number, vat_treatment check ('standard','reverse_charge','oss','export'), pdf_url, issued_at, created_at)
16. **transaction_ledger** (id, order_id FK, gross_cents, processor_fee_cents default 0, ttai_fixed_cents default 0, ttai_commission_cents default 0, broker_net_cents default 0, supplier_net_cents default 0, vat_collected_cents default 0, currency_code default 'EUR', settled_at, created_at)
17. **payouts** (id, recipient_type check ('broker','supplier'), recipient_id, amount_cents, currency_code default 'EUR', stripe_transfer_id, status enum default pending, created_at, completed_at)
18. **admin_audit_log** (id, actor_id FK profiles, action, target_type, target_id, payload JSONB, created_at) — append-only

### Indexes (mandatory)
```sql
CREATE INDEX idx_products_supplier     ON products(supplier_id);
CREATE INDEX idx_products_category     ON products(category_id);
CREATE INDEX idx_products_context      ON products(marketplace_context, is_published);
CREATE INDEX idx_products_city         ON products(city_id) WHERE marketplace_context = 'retail';
CREATE INDEX idx_orders_buyer          ON orders(buyer_id);
CREATE INDEX idx_orders_supplier       ON orders(supplier_id);
CREATE INDEX idx_orders_broker         ON orders(broker_id);
CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_suppliers_status      ON suppliers(status);
CREATE INDEX idx_suppliers_owner       ON suppliers(owner_id);
CREATE INDEX idx_audit_target          ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_invoices_order        ON invoices(order_id);
CREATE INDEX idx_ledger_order          ON transaction_ledger(order_id);
CREATE INDEX idx_payouts_recipient     ON payouts(recipient_type, recipient_id);
```

### Triggers (mandatory)
- `update_updated_at()` function + triggers on profiles, suppliers, products, orders, brokers
- `handle_new_user()` function + trigger on auth.users INSERT — auto-creates profiles row with role='buyer'

### RLS policies (key rules — implement all of these)
- Enable RLS on all 18 tables
- Helper function `current_user_role()` returns user's role from profiles, SECURITY DEFINER
- **profiles:** users can SELECT/UPDATE own; admin can SELECT all
- **countries/cities/categories:** public SELECT; admin full access
- **suppliers:** public SELECT where status='ACTIVE'; owner SELECT/INSERT/UPDATE (UPDATE only when status IN PENDING or UNDER_REVIEW); admin full access
- **supplier_documents:** owner full access on own; admin SELECT
- **supplier_state_audit:** admin SELECT; system INSERT
- **brokers:** owner SELECT/INSERT/UPDATE; admin full access
- **products:** public SELECT where is_published=true AND supplier.status='ACTIVE'; supplier full access on own; broker SELECT on assigned suppliers' products; admin full access
- **product_images:** public SELECT; supplier full access on own products
- **broker_promotions:** public SELECT where is_active AND ends_at>now(); broker full access on own; admin full access
- **orders:** buyer SELECT own; supplier SELECT own; broker SELECT own brokered; system INSERT/UPDATE; admin full access
- **order_items:** participants SELECT
- **invoices:** broker SELECT own; admin full access
- **transaction_ledger:** broker SELECT own (via order); admin full access
- **payouts:** recipient SELECT own; admin full access
- **admin_audit_log:** admin SELECT; system INSERT

### Seed data (0004_seed_data.sql)
Insert these countries with VAT rates:
- EU: ES(21), DE(19), FR(20), IT(22), PT(23), NL(21), BE(21), AT(20), PL(23), SE(25), DK(25), FI(24), IE(23), CZ(21), RO(19), HU(27), GR(24), HR(25), SK(20), BG(20)
- Non-EU: GB(20), US(null), CN(null), AE(5), TR(20), MA(20), SA(15), JP(10), IN(18), BR(null)

Spanish cities: Madrid, Barcelona, Valencia, Seville (retail_active=true); Bilbao, Málaga (retail_active=false).

Root categories (depth=0): Agriculture & Food, Textiles & Apparel, Electronics & Technology, Construction & Materials, Health & Beauty, Automotive & Transport, Home & Garden, Industrial & Machinery, Sports & Leisure, Office & Stationery. Set marketplace_context appropriately.

Sub-categories under Agriculture: Fresh Produce, Processed Foods, Beverages, Grains & Cereals.

### types/domain.ts
Export TypeScript types matching the enums:
```typescript
export type UserRole = 'buyer' | 'business_client' | 'supplier' | 'broker' | 'admin'
export type MarketplaceContext = 'wholesale' | 'retail' | 'both'
export type SupplierStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACTIVE' | 'SUSPENDED'
export type ReliabilityTier = 'UNVERIFIED' | 'BRONZE' | 'SILVER' | 'GOLD'
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'delivered' | 'cancelled' | 'refunded' | 'disputed'
export type InvoiceStatus = 'draft' | 'pending_conditions' | 'issued' | 'paid' | 'void'
export type VatTreatment = 'standard' | 'reverse_charge' | 'oss' | 'export'
```

## ACCEPTANCE CRITERIA
- [ ] `npm install` runs cleanly
- [ ] `npm run dev` starts without errors
- [ ] Supabase migrations 0001-0004 run successfully against a fresh project
- [ ] All 18 tables exist with correct columns
- [ ] All RLS policies are enabled and active
- [ ] Seed data appears: 30 countries, 6 cities, 10+ categories
- [ ] `auth.users` INSERT triggers profile creation
- [ ] `npm run db:types` regenerates `types/database.ts` successfully
- [ ] Visiting `/` renders the empty default Next.js page (or blank — UI comes in next packet)

## HAND-OFF TO NEXT PACKET (EDITH)
- Working Next.js app with all dependencies
- Live Supabase project with full schema
- All three Supabase clients ready to import
- Middleware shell ready to extend with auth gating
- TypeScript types generated

## EXECUTION COMMAND
Build all files in the order listed above. After completion, run the migrations against your Supabase project and confirm acceptance criteria. Report back with PASS/FAIL on each criterion.
