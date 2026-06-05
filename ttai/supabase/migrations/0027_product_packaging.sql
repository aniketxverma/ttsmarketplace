-- ════════════════════════════════════════════════════════════════════════════
-- 0027 — Product packaging & multi-unit purchasing
--
-- One product, sold by Piece / Box / Pallet / Truck. All packaging & commercial
-- specs live in DB fields (never baked into images). Pallet/truck totals are
-- derived: units_per_pallet = units_per_carton × cartons_per_pallet, etc.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE products
  -- Identity / commercial
  ADD COLUMN IF NOT EXISTS model_name        TEXT,
  ADD COLUMN IF NOT EXISTS reference_number  TEXT,
  ADD COLUMN IF NOT EXISTS ean               TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS lead_time         TEXT,
  -- Unit (1 piece)
  ADD COLUMN IF NOT EXISTS net_content       TEXT,    -- e.g. '5 L'
  ADD COLUMN IF NOT EXISTS unit_weight_kg    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS unit_dimensions   TEXT,    -- e.g. '18.5 x 11.5 x 29.5 cm'
  -- Carton / box
  ADD COLUMN IF NOT EXISTS units_per_carton  INT,
  ADD COLUMN IF NOT EXISTS carton_weight_kg  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS carton_dimensions TEXT,
  -- Pallet
  ADD COLUMN IF NOT EXISTS cartons_per_pallet INT,
  ADD COLUMN IF NOT EXISTS pallet_weight_kg   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pallet_dimensions  TEXT,    -- e.g. '120 x 100 x 160 cm'
  -- Truck
  ADD COLUMN IF NOT EXISTS pallets_per_truck  INT,
  ADD COLUMN IF NOT EXISTS truck_capacity     TEXT,
  -- Per-unit pricing (null → computed from piece price × units in that unit)
  ADD COLUMN IF NOT EXISTS price_per_box_cents    INT,
  ADD COLUMN IF NOT EXISTS price_per_pallet_cents INT,
  ADD COLUMN IF NOT EXISTS price_per_truck_cents  INT,
  -- Which purchase units this product can be bought in
  ADD COLUMN IF NOT EXISTS sell_piece  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sell_box    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sell_pallet BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sell_truck  BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.units_per_carton IS
  'Pieces per box. Pallet/truck totals derive from this + cartons_per_pallet + pallets_per_truck.';
