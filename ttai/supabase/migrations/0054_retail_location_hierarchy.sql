-- Phases 5 & 6 — Retail Shop local commerce hierarchy.
-- Existing geo: countries, cities (country_id). This adds the missing levels so the
-- Retail Shop can filter Country → Province → City → Town → Neighborhood.
--
--   country (countries)
--     └─ province (provinces)            NEW
--          └─ city (cities)              + province_id  NEW
--               └─ town (towns)          NEW
--                    └─ neighborhood     NEW

-- ── Provinces (under a country) ──────────────────────────────────────────────
create table if not exists provinces (
  id         uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  name       text not null,
  slug       text not null,
  created_at timestamptz not null default now(),
  unique (country_id, slug)
);

-- Cities gain a province link (nullable so existing rows keep working).
alter table cities add column if not exists province_id uuid references provinces(id) on delete set null;

-- ── Towns (under a city) ─────────────────────────────────────────────────────
create table if not exists towns (
  id         uuid primary key default gen_random_uuid(),
  city_id    uuid not null references cities(id) on delete cascade,
  name       text not null,
  slug       text not null,
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);

-- ── Neighborhoods (under a town) ─────────────────────────────────────────────
create table if not exists neighborhoods (
  id         uuid primary key default gen_random_uuid(),
  town_id    uuid not null references towns(id) on delete cascade,
  name       text not null,
  slug       text not null,
  created_at timestamptz not null default now(),
  unique (town_id, slug)
);

-- ── Retail seller location (on suppliers — a retail shop is a supplier) ───────
alter table suppliers add column if not exists province_id        uuid references provinces(id) on delete set null;
alter table suppliers add column if not exists town_id            uuid references towns(id) on delete set null;
alter table suppliers add column if not exists neighborhood_id    uuid references neighborhoods(id) on delete set null;
alter table suppliers add column if not exists delivery_radius_km integer;

-- ── Product retail availability + delivery area ──────────────────────────────
-- Products otherwise inherit the supplier's location (Phase 7). These let a seller
-- mark a product as locally available and scope its delivery reach.
alter table products add column if not exists retail_available boolean not null default true;
-- How far this product delivers: 'neighborhood' | 'town' | 'city' | 'province' | 'country'
alter table products add column if not exists delivery_scope text not null default 'city';

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_provinces_country     on provinces(country_id);
create index if not exists idx_cities_province        on cities(province_id);
create index if not exists idx_towns_city             on towns(city_id);
create index if not exists idx_neighborhoods_town     on neighborhoods(town_id);
create index if not exists idx_suppliers_province     on suppliers(province_id);
create index if not exists idx_suppliers_town         on suppliers(town_id);
create index if not exists idx_suppliers_neighborhood on suppliers(neighborhood_id);

-- ── RLS: geo tables are public reference data (needed by the retail selectors) ─
alter table provinces     enable row level security;
alter table towns         enable row level security;
alter table neighborhoods enable row level security;

drop policy if exists "provinces_public_read"     on provinces;
drop policy if exists "towns_public_read"          on towns;
drop policy if exists "neighborhoods_public_read"  on neighborhoods;

create policy "provinces_public_read"    on provinces     for select using (true);
create policy "towns_public_read"        on towns         for select using (true);
create policy "neighborhoods_public_read" on neighborhoods for select using (true);

-- Admin-only writes (geo data is curated). Adjust if sellers self-add towns later.
drop policy if exists "provinces_admin_write"     on provinces;
drop policy if exists "towns_admin_write"          on towns;
drop policy if exists "neighborhoods_admin_write"  on neighborhoods;

create policy "provinces_admin_write"     on provinces     for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy "towns_admin_write"         on towns          for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
create policy "neighborhoods_admin_write" on neighborhoods  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
