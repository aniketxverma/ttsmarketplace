-- Outlet & Return Goods Hub. A product can be flagged as an outlet / liquidation /
-- return-goods lot (sold by pallet, truckload, container, warehouse stock — usually
-- via Excel lists + video rather than single product photos).
alter table products add column if not exists is_outlet     boolean not null default false;
alter table products add column if not exists outlet_source text;  -- e.g. 'Amazon Returns', 'Lidl Returns', 'Bosch', 'Overstock'
alter table products add column if not exists lot_type      text;  -- 'pallet' | 'truckload' | 'container' | 'stock' | 'mixed'

create index if not exists idx_products_outlet on products(is_outlet) where is_outlet = true;
