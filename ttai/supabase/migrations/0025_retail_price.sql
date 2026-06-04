-- ────────────────────────────────────────────────────────────────────────────
-- Separate online-shop (retail) price
--
-- `price_cents` stays the wholesale / B2B price (shown ex-VAT, with MOQ).
-- `retail_price_cents` is the per-piece Online Shop price a consumer pays.
-- When null, retail surfaces fall back to price_cents.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS retail_price_cents INT;

COMMENT ON COLUMN products.retail_price_cents IS
  'Online Shop (retail) per-piece price. Wholesale price stays in price_cents. Null → fall back to price_cents.';
