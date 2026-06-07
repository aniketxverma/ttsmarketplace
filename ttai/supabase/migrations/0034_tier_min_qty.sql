-- Per-tier minimum order quantities for the multi-tier (B2C + B2B) pricing system.
-- `min_order_qty` already governs the End-User (piece) tier; these add minimums
-- for each B2B volume tier so suppliers can require e.g. "min 2 pallets".
alter table products
  add column if not exists min_box_qty    integer not null default 1,
  add column if not exists min_pallet_qty integer not null default 1,
  add column if not exists min_truck_qty  integer not null default 1;
