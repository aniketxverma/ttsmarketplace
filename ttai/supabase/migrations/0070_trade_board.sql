-- ─────────────────────────────────────────────────────────────────────────────
-- OUTLET ZONE — Trade Board. Buying requests & selling opportunities posted by
-- brokers, suppliers, distributors and outlet buyers. Public read; any logged-in
-- user can post their own.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists trade_requests (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references auth.users(id) on delete set null,
  kind             text not null default 'buy' check (kind in ('buy','sell')),  -- buying request | selling opportunity
  title            text not null,
  company_name     text,
  category         text,
  brand            text,
  condition        text,   -- outlet condition key (see lib/outlet)
  selling_unit     text,   -- unit | box | pallet | container | truck
  quantity         text,   -- free text e.g. "5 pallets", "1x40ft"
  budget           text,   -- free text price / budget
  country_name     text,
  description      text,
  contact_email    text,
  contact_whatsapp text,
  status           text not null default 'open' check (status in ('open','closed')),
  created_at       timestamptz not null default now()
);

create index if not exists idx_trade_requests_open on trade_requests(created_at desc) where status = 'open';
create index if not exists idx_trade_requests_kind on trade_requests(kind);

alter table trade_requests enable row level security;

-- Anyone can read open posts.
drop policy if exists "trade_public_read" on trade_requests;
create policy "trade_public_read" on trade_requests
  for select using (status = 'open');

-- A logged-in user can create posts they own.
drop policy if exists "trade_insert_own" on trade_requests;
create policy "trade_insert_own" on trade_requests
  for insert with check (auth.uid() = owner_id);

-- Owner (or admin) can update / close their own posts.
drop policy if exists "trade_update_own" on trade_requests;
create policy "trade_update_own" on trade_requests
  for update using (auth.uid() = owner_id or current_user_role() = 'admin');

drop policy if exists "trade_delete_own" on trade_requests;
create policy "trade_delete_own" on trade_requests
  for delete using (auth.uid() = owner_id or current_user_role() = 'admin');
