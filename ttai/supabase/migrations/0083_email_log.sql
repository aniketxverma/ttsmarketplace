-- Email log — every transactional email is recorded here so admins can see
-- what was sent, to whom, from which mailbox, and whether it succeeded.

create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),
  to_email    text not null,
  subject     text,
  mailbox     text,                       -- info | contact | support (sender role)
  provider    text,                       -- smtp | resend | dev
  status      text not null default 'sent', -- sent | failed
  error       text,
  message_id  text,
  created_at  timestamptz not null default now()
);

create index if not exists email_log_created_idx on public.email_log (created_at desc);
create index if not exists email_log_to_idx      on public.email_log (to_email);
create index if not exists email_log_status_idx  on public.email_log (status);

alter table public.email_log enable row level security;

-- Admins can read; writes happen via the service role (bypasses RLS).
drop policy if exists email_log_admin_read on public.email_log;
create policy email_log_admin_read on public.email_log
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
