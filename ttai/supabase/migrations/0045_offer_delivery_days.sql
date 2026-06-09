-- One master product, many supplier offers. Each supplier's products row IS their
-- offer; they're grouped by master_product_id (added in 0043) into a single listing.

-- Numeric delivery time so offers can be ranked "fastest delivery" (lead_time is free text).
alter table products add column if not exists delivery_days integer;

-- Fast lookup of all offers attached to a master product.
create index if not exists idx_products_master
  on products (master_product_id)
  where master_product_id is not null;
