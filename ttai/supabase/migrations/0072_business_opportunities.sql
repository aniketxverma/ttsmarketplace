-- ─────────────────────────────────────────────────────────────────────────────
-- BUSINESS OPPORTUNITIES — factories & suppliers publish what they're looking for
-- ("Chtaura looking for distributors in Spain/Portugal/Africa", "Rozil looking for
-- distributors + local clients") or a promotion. Visibility follows the trade
-- chain: the poster picks the target audience, so a retail shop sees a supplier's
-- opportunity but never a factory's (factory = same level as supplier).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists business_opportunities (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references profiles(id) on delete set null,
  supplier_id      uuid references suppliers(id) on delete set null,
  company_name     text,
  poster_role      text not null default 'supplier' check (poster_role in ('factory','supplier','distributor','retail')),
  kind             text not null default 'looking'  check (kind in ('looking','promotion')),
  looking_for      text,   -- distributor | retail | supplier | client | agent | importer
  audience         text[] not null default '{}',   -- which chain roles can see it
  title            text not null,
  description      text,
  product          text,
  category         text,
  country_target   text,   -- free text e.g. "Spain, Portugal, Africa"
  image_url        text,
  contact_email    text,
  contact_whatsapp text,
  status           text not null default 'open' check (status in ('open','closed')),
  created_at       timestamptz not null default now()
);

create index if not exists idx_opps_open     on business_opportunities(created_at desc) where status = 'open';
create index if not exists idx_opps_audience on business_opportunities using gin (audience);

alter table business_opportunities enable row level security;

drop policy if exists "opps_public_read" on business_opportunities;
create policy "opps_public_read" on business_opportunities
  for select using (status = 'open');

drop policy if exists "opps_insert_own" on business_opportunities;
create policy "opps_insert_own" on business_opportunities
  for insert with check (auth.uid() = owner_id);

drop policy if exists "opps_update_own" on business_opportunities;
create policy "opps_update_own" on business_opportunities
  for update using (auth.uid() = owner_id or current_user_role() = 'admin');

drop policy if exists "opps_delete_own" on business_opportunities;
create policy "opps_delete_own" on business_opportunities
  for delete using (auth.uid() = owner_id or current_user_role() = 'admin');
