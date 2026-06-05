-- ────────────────────────────────────────────────────────────────────────────
-- 0029 — Remaining spec fields: carton net weight, pallet height, EXW price
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS carton_net_weight_kg NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pallet_height_cm      INT,
  ADD COLUMN IF NOT EXISTS exw_price_cents       INT;

COMMENT ON COLUMN products.exw_price_cents IS 'Ex Works (EXW) per-unit price for B2B quotes.';
