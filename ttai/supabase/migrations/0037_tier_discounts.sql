-- Optional per-tier volume discount (% off the wholesale base price). Used to
-- compute box/pallet/truck prices when no explicit tier price is set, so a
-- supplier can either type each price OR just say "10% off for a box", etc.
alter table products
  add column if not exists box_discount_pct    numeric(5,2) not null default 0,
  add column if not exists pallet_discount_pct numeric(5,2) not null default 0,
  add column if not exists truck_discount_pct  numeric(5,2) not null default 0;
