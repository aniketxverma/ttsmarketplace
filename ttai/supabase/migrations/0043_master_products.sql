-- ── Master Product Database ──────────────────────────────────────────────────
-- A product (e.g. "JBL T110") exists ONCE globally. Suppliers import it into
-- their profile and only add price / stock / SKU / condition / location.
create table if not exists master_products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  brand_name   text,
  category_id  uuid references categories(id),
  family       text,                 -- product family (e.g. Earphones)
  model        text,                 -- model (e.g. T110)
  ean          text,
  description  text,
  specs        jsonb not null default '{}',   -- structured specifications
  image_urls   text[] not null default '{}',
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);
create index if not exists idx_master_ean  on master_products (ean);
create index if not exists idx_master_name on master_products (lower(name));

-- A supplier's listing links back to the master + adds its own commercial fields.
alter table products
  add column if not exists master_product_id  uuid references master_products(id),
  add column if not exists specs              jsonb not null default '{}',
  add column if not exists condition          text,        -- New / Used / Refurbished / Grade A…
  add column if not exists warehouse_location text;

-- ── Category templates ───────────────────────────────────────────────────────
-- Per-category spec fields (e.g. Mobile Phones → Brand, Model, Storage, RAM…).
alter table categories
  add column if not exists template_fields jsonb not null default '[]';
