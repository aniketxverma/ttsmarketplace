-- ── Client Shops & Private POS Contacts ──────────────────────────────────────
-- Adds retail shop activation to supplier_pos and a private contact table
-- for wholesale-only phone visibility.

-- 1. Add shop columns to supplier_pos
ALTER TABLE supplier_pos
  ADD COLUMN IF NOT EXISTS shop_active  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_slug    TEXT,
  ADD COLUMN IF NOT EXISTS shop_name    TEXT,
  ADD COLUMN IF NOT EXISTS shop_tagline TEXT,
  ADD COLUMN IF NOT EXISTS shop_logo    TEXT;

-- Unique index on shop_slug (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_pos_shop_slug
  ON supplier_pos (shop_slug)
  WHERE shop_slug IS NOT NULL;

-- 2. Add manager_name to pos_details if missing (safe, column may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_details' AND column_name = 'manager_name'
  ) THEN
    ALTER TABLE pos_details ADD COLUMN manager_name TEXT;
  END IF;
END $$;

-- 3. Private contact details — only authenticated users (wholesale buyers) can read
CREATE TABLE IF NOT EXISTS pos_private_details (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_id   UUID NOT NULL REFERENCES supplier_pos(id) ON DELETE CASCADE UNIQUE,
  phone    TEXT,
  whatsapp TEXT,
  notes    TEXT
);

ALTER TABLE pos_private_details ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can see private contact details
CREATE POLICY "pos_priv_auth_read" ON pos_private_details
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Suppliers manage their own
CREATE POLICY "pos_priv_supplier_write" ON pos_private_details FOR ALL
  USING  (pos_id IN (
    SELECT sp.id FROM supplier_pos sp
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE s.owner_id = auth.uid()
  ))
  WITH CHECK (pos_id IN (
    SELECT sp.id FROM supplier_pos sp
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE s.owner_id = auth.uid()
  ));
