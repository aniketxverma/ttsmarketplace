-- ── supplier_regions — tracks which regions/countries each supplier serves ──
-- region_key examples: "middle-east"  (whole region)
--                      "middle-east:dubai-uae" (specific country)

CREATE TABLE IF NOT EXISTS supplier_regions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  region_key  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (supplier_id, region_key)
);

CREATE INDEX IF NOT EXISTS idx_supplier_regions_supplier ON supplier_regions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_regions_key      ON supplier_regions(region_key);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE supplier_regions ENABLE ROW LEVEL SECURITY;

-- Public can read (needed for marketplace region pages)
CREATE POLICY "public read supplier_regions"
  ON supplier_regions FOR SELECT
  USING (true);

-- Suppliers can manage their own rows
CREATE POLICY "supplier manage own regions"
  ON supplier_regions FOR ALL
  USING  (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()));
