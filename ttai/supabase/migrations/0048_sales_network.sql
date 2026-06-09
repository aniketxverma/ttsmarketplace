-- Sales Network System — suppliers/brands invite companies to join their official
-- sales network. Each row is an invitation that becomes a membership once accepted.
create table if not exists sales_network (
  id                  uuid primary key default gen_random_uuid(),
  inviter_supplier_id uuid not null references suppliers(id) on delete cascade,
  member_supplier_id  uuid references suppliers(id) on delete set null, -- set on accept
  member_user_id      uuid,                                             -- accepter's auth user
  company_name        text not null,
  contact_person      text,
  email               text,
  whatsapp            text,
  country             text,
  city                text,
  address             text,
  level               text not null default 'sales_point'
                      check (level in ('customer','sales_point','distributor','master_distributor')),
  status              text not null default 'pending'
                      check (status in ('pending','accepted','revoked')),
  token               text unique not null,
  imported_catalog    boolean default false,
  created_at          timestamptz default now(),
  accepted_at         timestamptz
);

create index if not exists idx_sales_network_inviter on sales_network(inviter_supplier_id);
create index if not exists idx_sales_network_member  on sales_network(member_supplier_id);
create index if not exists idx_sales_network_token   on sales_network(token);

-- All access goes through server routes (admin client + ownership checks), so keep
-- the table private: enable RLS with no public policy (service role bypasses it).
alter table sales_network enable row level security;
