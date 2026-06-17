-- ─────────────────────────────────────────────────────────────────────────────
-- BROKER NETWORK — protected referrals, connection points, levels & invoicing.
-- Builds on the existing brokers table (0001). A broker registers Supplier and
-- Buyer references; every company stays permanently linked to that broker (the
-- referrer). Each successful registration earns Connection Points, which drive
-- the broker level (Bronze → Platinum).
-- ─────────────────────────────────────────────────────────────────────────────

-- Broker identity + score.
alter table brokers add column if not exists broker_code      text unique;  -- public Broker ID (e.g. BRK-7F3K9A)
alter table brokers add column if not exists connection_points int not null default 0;

-- Companies a broker brings to the platform (suppliers & buyers). Permanently
-- linked — this protects the broker's network.
create table if not exists broker_referrals (
  id             uuid primary key default gen_random_uuid(a),
  broker_id      uuid not null references brokers(id) on delete cascade,
  company_type   text not null default 'supplier' check (company_type in ('supplier','buyer')),
  company_name   text not null,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  country_name   text,
  category       text,
  notes          text,
  -- Links once the referred company actually registers an account on TTAIEMA.
  ref_supplier_id uuid references suppliers(id) on delete set null,
  ref_profile_id  uuid references profiles(id)  on delete set null,
  status         text not null default 'registered' check (status in ('pending','registered','active')),
  points         int  not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_broker_referrals_broker on broker_referrals(broker_id, created_at desc);
create index if not exists idx_broker_referrals_type   on broker_referrals(company_type);

-- Broker deals — used by the optional invoicing service + commission history.
create table if not exists broker_deals (
  id             uuid primary key default gen_random_uuid(),
  broker_id      uuid not null references brokers(id) on delete cascade,
  supplier_ref   text not null,   -- supplier reference (name or Broker reference)
  buyer_ref      text not null,   -- buyer / client reference
  product        text not null,
  quantity       text,
  price_cents    bigint,
  currency_code  text not null default 'EUR',
  commission_pct numeric(5,2),
  commission_cents bigint,
  needs_invoicing boolean not null default false,  -- broker asked TTAIEMA to invoice
  status         text not null default 'open' check (status in ('open','invoiced','paid','closed','cancelled')),
  source         text not null default 'broker' check (source in ('broker','ttaiema')),  -- broker's own client vs platform opportunity
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_broker_deals_broker on broker_deals(broker_id, created_at desc);

-- RLS — a broker manages their own rows; admin sees everything.
alter table broker_referrals enable row level security;
alter table broker_deals     enable row level security;

drop policy if exists "broker_referrals_own" on broker_referrals;
create policy "broker_referrals_own" on broker_referrals
  for all using (broker_id in (select id from brokers where user_id = auth.uid()) or current_user_role() = 'admin');

drop policy if exists "broker_deals_own" on broker_deals;
create policy "broker_deals_own" on broker_deals
  for all using (broker_id in (select id from brokers where user_id = auth.uid()) or current_user_role() = 'admin');
