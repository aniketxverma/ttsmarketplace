-- ── Brand management + product provenance / traceability foundation ──────────
-- Brands: separate branded / OEM / private-label products and enable future
-- sponsored-brand positioning.
create table if not exists brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  kind        text not null default 'brand' check (kind in ('brand', 'oem', 'private_label')),
  created_at  timestamptz not null default now()
);

-- Per-product brand + full provenance so a product's origin is always known,
-- no matter how many times it's imported/shared between suppliers.
alter table products
  add column if not exists brand_id              uuid references brands(id),
  add column if not exists brand_name            text,                                  -- denormalised (import convenience)
  add column if not exists source_type           text,                                  -- Factory / Supplier / Distributor / TTAIEMA
  add column if not exists original_factory_id   uuid references suppliers(id),
  add column if not exists original_supplier_id  uuid references suppliers(id),
  add column if not exists current_owner_id      uuid references suppliers(id),
  add column if not exists catalogue_id          uuid,
  add column if not exists imported_from_product_id uuid references products(id),
  add column if not exists import_date           timestamptz,
  add column if not exists created_by            uuid references profiles(id),
  add column if not exists updated_by            uuid references profiles(id);

create index if not exists idx_products_brand   on products (brand_id);
create index if not exists idx_products_owner    on products (current_owner_id);
create index if not exists idx_products_orig_sup on products (original_supplier_id);
