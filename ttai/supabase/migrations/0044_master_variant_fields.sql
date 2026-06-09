-- Master Product Database — supplier-entry commercial fields.
-- condition, warehouse_location, specs (jsonb) were added in 0043.
-- Add warranty so suppliers can declare a guarantee period per listing.
alter table products add column if not exists warranty text;

-- Structured variant columns on master_products make the cascade picker
-- (Brand → Model → Capacity → Color → Region) fast and duplicate-free.
-- These mirror the most-queried keys inside master_products.specs.
alter table master_products add column if not exists capacity text;
alter table master_products add column if not exists color    text;
alter table master_products add column if not exists region   text;

create index if not exists idx_master_variant
  on master_products (brand_name, model, capacity, color, region);
