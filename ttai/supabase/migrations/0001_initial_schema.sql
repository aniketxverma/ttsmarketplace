-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('buyer', 'business_client', 'supplier', 'broker', 'admin');
CREATE TYPE marketplace_context AS ENUM ('wholesale', 'retail', 'both');
CREATE TYPE supplier_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED');
CREATE TYPE reliability_tier AS ENUM ('UNVERIFIED', 'BRONZE', 'SILVER', 'GOLD');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'fulfilled', 'delivered', 'cancelled', 'refunded', 'disputed');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending_conditions', 'issued', 'paid', 'void');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ─── TABLES ──────────────────────────────────────────────────────────────────

-- 1. countries
CREATE TABLE countries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code      CHAR(2) NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  currency_code CHAR(3),
  vat_rate      NUMERIC(5,2),
  is_eu         BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. cities
CREATE TABLE cities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id     UUID NOT NULL REFERENCES countries(id),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL,
  retail_active  BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (country_id, slug)
);

-- 3. profiles
CREATE TABLE profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role               user_role NOT NULL DEFAULT 'buyer',
  full_name          TEXT,
  phone              TEXT,
  preferred_language CHAR(2) DEFAULT 'en',
  country_id         UUID REFERENCES countries(id),
  city_id            UUID REFERENCES cities(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. suppliers
CREATE TABLE suppliers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES profiles(id),
  legal_name          TEXT NOT NULL,
  trade_name          TEXT,
  tax_id              TEXT NOT NULL,
  vat_number          TEXT,
  country_id          UUID NOT NULL REFERENCES countries(id),
  city_id             UUID REFERENCES cities(id),
  address_line1       TEXT,
  address_line2       TEXT,
  postal_code         TEXT,
  status              supplier_status NOT NULL DEFAULT 'PENDING',
  reliability_tier    reliability_tier NOT NULL DEFAULT 'UNVERIFIED',
  marketplace_context marketplace_context NOT NULL DEFAULT 'wholesale',
  description         TEXT,
  logo_url            TEXT,
  admin_notes         TEXT,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. supplier_documents
CREATE TABLE supplier_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. supplier_state_audit
CREATE TABLE supplier_state_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  from_status supplier_status,
  to_status   supplier_status NOT NULL,
  reason      TEXT,
  actor_id    UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. brokers
CREATE TABLE brokers (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL UNIQUE REFERENCES profiles(id),
  legal_name                 TEXT NOT NULL,
  tax_id                     TEXT NOT NULL,
  vat_number                 TEXT,
  tax_jurisdiction           CHAR(2) NOT NULL DEFAULT 'ES',
  stripe_account_id          TEXT UNIQUE,
  stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  commission_pct             NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  fixed_fee_cents            INT NOT NULL DEFAULT 100,
  broker_share_pct           NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  status                     TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','SUSPENDED')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. broker_supplier_assignments
CREATE TABLE broker_supplier_assignments (
  broker_id   UUID NOT NULL REFERENCES brokers(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (broker_id, supplier_id)
);

-- 9. categories
CREATE TABLE categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id           UUID REFERENCES categories(id),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  marketplace_context marketplace_context NOT NULL DEFAULT 'both',
  depth               INT NOT NULL DEFAULT 0,
  sort_order          INT NOT NULL DEFAULT 0,
  UNIQUE (parent_id, slug)
);

-- 10. products
CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id         UUID NOT NULL REFERENCES suppliers(id),
  category_id         UUID NOT NULL REFERENCES categories(id),
  marketplace_context marketplace_context NOT NULL,
  city_id             UUID REFERENCES cities(id),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  description         TEXT,
  sku                 TEXT,
  price_cents         INT NOT NULL,
  currency_code       CHAR(3) NOT NULL DEFAULT 'EUR',
  min_order_qty       INT NOT NULL DEFAULT 1,
  stock_qty           INT NOT NULL DEFAULT 0,
  is_published        BOOLEAN NOT NULL DEFAULT false,
  vat_rate            NUMERIC(5,2),
  weight_grams        INT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, slug)
);

-- 11. product_images
CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 12. broker_promotions
CREATE TABLE broker_promotions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id      UUID NOT NULL REFERENCES brokers(id),
  product_id     UUID NOT NULL REFERENCES products(id),
  promotion_slot INT NOT NULL,
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ NOT NULL,
  custom_pitch   TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. orders
CREATE TABLE orders (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                   UUID NOT NULL REFERENCES profiles(id),
  supplier_id                UUID NOT NULL REFERENCES suppliers(id),
  broker_id                  UUID REFERENCES brokers(id),
  marketplace_context        marketplace_context NOT NULL,
  status                     order_status NOT NULL DEFAULT 'pending',
  subtotal_cents             INT NOT NULL,
  vat_cents                  INT NOT NULL DEFAULT 0,
  shipping_cents             INT NOT NULL DEFAULT 0,
  total_cents                INT NOT NULL,
  currency_code              CHAR(3) NOT NULL DEFAULT 'EUR',
  buyer_country_id           UUID REFERENCES countries(id),
  shipping_address           JSONB,
  stripe_payment_intent_id   TEXT,
  stripe_checkout_session_id TEXT,
  idempotency_key            TEXT UNIQUE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. order_items
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  quantity        INT NOT NULL,
  unit_price_cents INT NOT NULL,
  vat_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_total_cents INT NOT NULL
);

-- 15. invoices
CREATE TABLE invoices (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL UNIQUE REFERENCES orders(id),
  supplier_id          UUID REFERENCES suppliers(id),
  broker_id            UUID REFERENCES brokers(id),
  invoice_number       TEXT NOT NULL UNIQUE,
  status               invoice_status NOT NULL DEFAULT 'draft',
  amount_cents         INT NOT NULL DEFAULT 0,
  currency_code        CHAR(3) NOT NULL DEFAULT 'EUR',
  conditions_passed    BOOLEAN,
  conditions_payload   JSONB,
  buyer_country        CHAR(2),
  buyer_vat_number     TEXT,
  vat_treatment        TEXT CHECK (vat_treatment IN ('standard','reverse_charge','oss','export')),
  pdf_url              TEXT,
  issued_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. transaction_ledger
CREATE TABLE transaction_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id),
  gross_cents           INT NOT NULL,
  processor_fee_cents   INT NOT NULL DEFAULT 0,
  ttai_fixed_cents      INT NOT NULL DEFAULT 0,
  ttai_commission_cents INT NOT NULL DEFAULT 0,
  broker_net_cents      INT NOT NULL DEFAULT 0,
  supplier_net_cents    INT NOT NULL DEFAULT 0,
  vat_collected_cents   INT NOT NULL DEFAULT 0,
  currency_code         CHAR(3) NOT NULL DEFAULT 'EUR',
  settled_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. payouts
CREATE TABLE payouts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type     TEXT NOT NULL CHECK (recipient_type IN ('broker','supplier')),
  recipient_id       UUID NOT NULL,
  amount_cents       INT NOT NULL,
  currency_code      CHAR(3) NOT NULL DEFAULT 'EUR',
  stripe_transfer_id TEXT,
  status             payout_status NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ
);

-- 18. admin_audit_log (append-only)
CREATE TABLE admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

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

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_brokers_updated_at
  BEFORE UPDATE ON brokers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'buyer',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
