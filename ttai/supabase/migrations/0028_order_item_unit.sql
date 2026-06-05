-- ────────────────────────────────────────────────────────────────────────────
-- 0028 — Purchase unit on order lines
-- Records whether a line was bought by piece / box / pallet / truck.
-- unit_price_cents + quantity are already in the unit's terms.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS purchase_unit TEXT NOT NULL DEFAULT 'piece';
