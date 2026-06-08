-- ── Phase 3: Catalogues — a Factory/Supplier/TTAIEMA upload is an owned catalogue.
create table if not exists catalogues (
  id                uuid primary key default gen_random_uuid(),
  owner_supplier_id uuid references suppliers(id) on delete cascade,
  name              text not null,
  source_type       text,
  product_count     int not null default 0,
  created_by        uuid references profiles(id),
  created_at        timestamptz not null default now()
);

-- ── Phase 6: Sponsored placements — paid positions inside categories.
create table if not exists sponsored_placements (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('product', 'brand', 'supplier')),
  product_id   uuid references products(id)   on delete cascade,
  brand_id     uuid references brands(id)     on delete cascade,
  supplier_id  uuid references suppliers(id)  on delete cascade,
  category_id  uuid references categories(id) on delete set null,
  weight       int  not null default 100,        -- higher = shown first
  starts_at    timestamptz,
  ends_at      timestamptz,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_sponsored_active on sponsored_placements (is_active, category_id);
