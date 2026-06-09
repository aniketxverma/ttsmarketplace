-- Per-offer shipping cost so the multi-seller comparison can show
-- Product price + Shipping = Total (like the marketplace "Available Sellers" table).
alter table products add column if not exists shipping_cents integer;
