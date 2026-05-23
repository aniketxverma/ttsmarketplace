-- ── Points of Sale + Promotions ───────────────────────────────────────────────

-- 1. supplier_pos
CREATE TABLE IF NOT EXISTS supplier_pos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'shop'
              CHECK (type IN ('shop','warehouse','distributor','pickup_point','franchise','client_store','agent_office','export_hub')),
  status      TEXT        NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','temporarily_closed','closed')),
  is_public   BOOLEAN     DEFAULT true,
  sort_order  INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_pos_supplier ON supplier_pos(supplier_id);

-- 2. pos_locations
CREATE TABLE IF NOT EXISTS pos_locations (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_id        UUID    NOT NULL REFERENCES supplier_pos(id) ON DELETE CASCADE UNIQUE,
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  region        TEXT,
  postal_code   TEXT,
  country       TEXT,
  latitude      NUMERIC(10,7),
  longitude     NUMERIC(10,7),
  plus_code     TEXT
);

-- 3. pos_details
CREATE TABLE IF NOT EXISTS pos_details (
  id               UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_id           UUID      NOT NULL REFERENCES supplier_pos(id) ON DELETE CASCADE UNIQUE,
  manager_name     TEXT,
  phone            TEXT,
  whatsapp         TEXT,
  email            TEXT,
  opening_hours    JSONB     DEFAULT '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"10:00","close":"14:00","closed":false},"sunday":{"open":"","close":"","closed":true}}',
  accepts_walk_ins BOOLEAN   DEFAULT true,
  accepts_orders   BOOLEAN   DEFAULT true,
  services_offered TEXT[]    DEFAULT '{}',
  notes            TEXT,
  logo_url         TEXT,
  images           TEXT[]    DEFAULT '{}'
);

-- 4. supplier_promotions
CREATE TABLE IF NOT EXISTS supplier_promotions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  subtitle    TEXT,
  image_url   TEXT,
  cta_label   TEXT        DEFAULT 'View Offer',
  cta_url     TEXT,
  valid_from  TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active   BOOLEAN     DEFAULT true,
  placement   TEXT        DEFAULT 'profile_top'
              CHECK (placement IN ('profile_top','shop_top','category_page','homepage_featured')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_promos ON supplier_promotions(supplier_id, is_active);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE supplier_pos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_details        ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_promotions ENABLE ROW LEVEL SECURITY;

-- supplier_pos
CREATE POLICY "pos public read"    ON supplier_pos FOR SELECT USING (is_public = true OR supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()));
CREATE POLICY "pos supplier write" ON supplier_pos FOR ALL
  USING  (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()));

-- pos_locations
CREATE POLICY "pos_loc public read" ON pos_locations FOR SELECT USING (true);
CREATE POLICY "pos_loc supplier write" ON pos_locations FOR ALL
  USING  (pos_id IN (SELECT sp.id FROM supplier_pos sp JOIN suppliers s ON s.id = sp.supplier_id WHERE s.owner_id = auth.uid()))
  WITH CHECK (pos_id IN (SELECT sp.id FROM supplier_pos sp JOIN suppliers s ON s.id = sp.supplier_id WHERE s.owner_id = auth.uid()));

-- pos_details
CREATE POLICY "pos_det public read" ON pos_details FOR SELECT USING (true);
CREATE POLICY "pos_det supplier write" ON pos_details FOR ALL
  USING  (pos_id IN (SELECT sp.id FROM supplier_pos sp JOIN suppliers s ON s.id = sp.supplier_id WHERE s.owner_id = auth.uid()))
  WITH CHECK (pos_id IN (SELECT sp.id FROM supplier_pos sp JOIN suppliers s ON s.id = sp.supplier_id WHERE s.owner_id = auth.uid()));

-- promotions
CREATE POLICY "promo public read"    ON supplier_promotions FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));
CREATE POLICY "promo supplier write" ON supplier_promotions FOR ALL
  USING  (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()));
