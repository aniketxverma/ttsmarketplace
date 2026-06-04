-- ────────────────────────────────────────────────────────────────────────────
-- Product line / family
--
-- Lets a supplier group several products under one "type" (e.g. "Rozil
-- Detergents"). The marketplace shows ONE card per family with a single image;
-- opening it lists the individual variants. When product_line is empty the
-- product is grouped by supplier + category as a fallback (see lib/product-family.ts).
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_line TEXT;

CREATE INDEX IF NOT EXISTS idx_products_line ON products(supplier_id, product_line);

COMMENT ON COLUMN products.product_line IS
  'Optional family/type name. Products sharing supplier_id + product_line collapse into one card in the marketplace.';
