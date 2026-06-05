-- ════════════════════════════════════════════════════════════════════════════
-- 0030 — Per-shop product images + marketing media + HS code
--
-- image_role lets a supplier tag each photo for the retail shop (the bottle) or
-- the B2B / bulk view (box / pallet / truck). NULL = shown in both.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS image_role TEXT;  -- 'retail' | 'b2b' | NULL (both)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hs_code       TEXT,
  ADD COLUMN IF NOT EXISTS catalogue_url TEXT,   -- product catalogue PDF
  ADD COLUMN IF NOT EXISTS video_url     TEXT;    -- product video (file or link)

COMMENT ON COLUMN product_images.image_role IS
  'retail = online-shop photos (the unit), b2b = bulk photos (box/pallet/truck), NULL = both.';
