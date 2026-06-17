-- ─────────────────────────────────────────────────────────────────────────────
-- OUTLET ZONE — clearance / returns / liquidation B2B marketplace.
-- Builds on migration 0060 (is_outlet, outlet_source, lot_type). Adds the
-- per-offer condition + selling unit, and the supplier's outlet role so buyers
-- can filter by who they're dealing with (direct supplier, chain, distributor,
-- broker, outlet shop).
-- ─────────────────────────────────────────────────────────────────────────────

-- Per-offer fields.
alter table products add column if not exists condition    text;  -- brand_new | clearance | outlet | overstock | return_a..return_d | refurbished | cosmetic_defect | functional_defect | mixed
alter table products add column if not exists selling_unit text;  -- unit | box | pallet | container | truck

create index if not exists idx_products_condition    on products(condition)    where condition is not null;
create index if not exists idx_products_selling_unit on products(selling_unit) where selling_unit is not null;

-- Supplier's role in the Outlet Zone (also used as the "Supplier Type" filter).
alter table suppliers add column if not exists outlet_role text;  -- direct_supplier | retail_chain | distributor | broker | outlet_shop

create index if not exists idx_suppliers_outlet_role on suppliers(outlet_role) where outlet_role is not null;
