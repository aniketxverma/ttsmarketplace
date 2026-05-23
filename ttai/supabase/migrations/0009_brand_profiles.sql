-- ── Brand Profile System — extends suppliers + adds gallery/certs/reviews ────

-- 1. Extend suppliers table with brand profile fields
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS brand_slug         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tagline            TEXT,
  ADD COLUMN IF NOT EXISTS banner_image       TEXT,
  ADD COLUMN IF NOT EXISTS about_company      TEXT,
  ADD COLUMN IF NOT EXISTS founded_year       INT,
  ADD COLUMN IF NOT EXISTS employee_count     INT,
  ADD COLUMN IF NOT EXISTS years_experience   INT,
  ADD COLUMN IF NOT EXISTS countries_served   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website            TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp           TEXT,
  ADD COLUMN IF NOT EXISTS business_email     TEXT,
  ADD COLUMN IF NOT EXISTS working_hours      TEXT,
  ADD COLUMN IF NOT EXISTS google_map_link    TEXT,
  ADD COLUMN IF NOT EXISTS instagram          TEXT,
  ADD COLUMN IF NOT EXISTS facebook           TEXT,
  ADD COLUMN IF NOT EXISTS linkedin           TEXT,
  ADD COLUMN IF NOT EXISTS twitter            TEXT,
  ADD COLUMN IF NOT EXISTS youtube            TEXT,
  ADD COLUMN IF NOT EXISTS seo_title          TEXT,
  ADD COLUMN IF NOT EXISTS seo_description    TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords       TEXT,
  ADD COLUMN IF NOT EXISTS og_image           TEXT,
  ADD COLUMN IF NOT EXISTS is_featured        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS badges             TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS section_visibility JSONB   DEFAULT '{"gallery":true,"certifications":true,"documents":true,"reviews":true}',
  ADD COLUMN IF NOT EXISTS theme_settings     JSONB   DEFAULT '{"primaryColor":"#0B1F4D","accentColor":"#F5A623"}';

CREATE INDEX IF NOT EXISTS idx_suppliers_brand_slug ON suppliers(brand_slug);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_featured ON suppliers(is_featured) WHERE is_featured = true;

-- 2. Brand gallery
CREATE TABLE IF NOT EXISTS brand_gallery (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  caption     TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_gallery_supplier ON brand_gallery(supplier_id, sort_order);

-- 3. Brand certifications
CREATE TABLE IF NOT EXISTS brand_certifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  issuer      TEXT,
  issued_date DATE,
  expiry_date DATE,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_certs_supplier ON brand_certifications(supplier_id);

-- 4. Brand reviews
CREATE TABLE IF NOT EXISTS brand_reviews (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id       UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating            INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  verified_purchase BOOLEAN     DEFAULT false,
  supplier_reply    TEXT,
  replied_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (supplier_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_reviews_supplier ON brand_reviews(supplier_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE brand_gallery       ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reviews        ENABLE ROW LEVEL SECURITY;

-- Gallery
CREATE POLICY "brand_gallery public read"    ON brand_gallery FOR SELECT USING (true);
CREATE POLICY "brand_gallery supplier write" ON brand_gallery FOR ALL
  USING  (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()));

-- Certifications
CREATE POLICY "brand_certs public read"    ON brand_certifications FOR SELECT USING (true);
CREATE POLICY "brand_certs supplier write" ON brand_certifications FOR ALL
  USING  (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()));

-- Reviews
CREATE POLICY "brand_reviews public read"     ON brand_reviews FOR SELECT USING (true);
CREATE POLICY "brand_reviews user insert"     ON brand_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "brand_reviews supplier update" ON brand_reviews FOR UPDATE
  USING (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()));
