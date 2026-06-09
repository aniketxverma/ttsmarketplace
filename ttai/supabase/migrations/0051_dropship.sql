-- Auto-dropship: when a sales point imports a mother brand's catalogue, each cloned
-- product remembers who fulfills it (the mother brand) and the cost it pays them.
-- When an end customer buys it from the sales point, the order is forwarded to the
-- mother brand to ship directly — the sales point keeps the margin.
alter table products add column if not exists dropship_supplier_id uuid references suppliers(id) on delete set null;
alter table products add column if not exists dropship_cost_cents integer;

-- Link a forwarded supply order back to the customer order that triggered it.
alter table orders add column if not exists source_order_id uuid references orders(id) on delete set null;

create index if not exists idx_products_dropship on products(dropship_supplier_id) where dropship_supplier_id is not null;
