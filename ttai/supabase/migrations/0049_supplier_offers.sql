-- Supplier "Send Offer" broadcasts: a supplier/sales point composes a promotion
-- (selected products + message + discount) and shares it with their clients/network
-- by WhatsApp or email. Each offer has a public page at /o/[token].
create table if not exists supplier_offers (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references suppliers(id) on delete cascade,
  token        text unique not null,
  title        text not null,
  message      text,
  discount_pct numeric,
  product_ids  uuid[] default '{}',
  audience     text default 'all'    -- all | customer | sales_point | distributor | retail | b2b | end_user
               check (audience in ('all','customer','sales_point','distributor','master_distributor','retail','b2b','end_user')),
  sent_count   int default 0,
  created_at   timestamptz default now()
);

create index if not exists idx_supplier_offers_supplier on supplier_offers(supplier_id);
create index if not exists idx_supplier_offers_token on supplier_offers(token);

-- Access via server routes (admin client + ownership) — keep the table private.
alter table supplier_offers enable row level security;
