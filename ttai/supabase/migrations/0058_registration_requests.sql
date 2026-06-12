-- Store every registration request (TTAI EMA + TTAIMA) so the admin sees them all
-- in the dashboard, not just by email. Written server-side by /api/register-notify.
create table if not exists registration_requests (
  id              uuid primary key default gen_random_uuid(),
  full_name       text,
  company_name    text,
  email           text,
  phone           text,
  country_name    text,
  city            text,
  account_type    text,
  business_type   text,
  message         text,
  source_platform text not null default 'TTAI EMA',
  created_at      timestamptz not null default now()
);

alter table registration_requests enable row level security;

-- Admin-only (inserts happen via the service-role server endpoint, bypassing RLS).
drop policy if exists "regreq_admin_all" on registration_requests;
create policy "regreq_admin_all" on registration_requests
  for all using (current_user_role() = 'admin');

create index if not exists idx_registration_requests_created on registration_requests(created_at desc);
