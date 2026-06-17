-- ─────────────────────────────────────────────────────────────────────────────
-- TTAIEMA Control Center / Admin Center
-- One central inbox for every client request across the three departments:
--   • Marketplace  → manager Ane
--   • Logistics    → manager Eva
--   • Consulting   → manager Zain
-- Any form on the website (or the separate Marketplace server) posts a ticket
-- here via the service-role endpoint /api/ticket. The owner/admin sees everything;
-- each department manager is the assignee. WhatsApp / live-chat plug in later.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists tickets (
  id              uuid primary key default gen_random_uuid(),
  ticket_no       bigint generated always as identity,   -- human-friendly #
  -- Client
  client_name     text,
  company_name    text,
  email           text,
  phone           text,                                  -- phone / whatsapp
  country_name    text,
  -- Routing
  department      text not null default 'marketplace'    -- marketplace | logistics | consulting
                    check (department in ('marketplace','logistics','consulting')),
  assigned_to     text,                                  -- Ane | Eva | Zain (free text so it can be reassigned)
  status          text not null default 'new'            -- new | in_progress | waiting | closed
                    check (status in ('new','in_progress','waiting','closed')),
  -- Payload
  subject         text,
  message         text,
  attachment_url  text,
  source_platform text not null default 'TTAI EMA',      -- which site/form created it
  source_form     text,                                  -- e.g. quote, contact, supplier-onboarding
  -- Meta
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_tickets_created    on tickets(created_at desc);
create index if not exists idx_tickets_department on tickets(department);
create index if not exists idx_tickets_status     on tickets(status);
create index if not exists idx_tickets_assigned   on tickets(assigned_to);

-- Internal notes (collaboration thread between admin and the managers).
create table if not exists ticket_notes (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  author      text,                                      -- who wrote the note
  note        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_ticket_notes_ticket on ticket_notes(ticket_id, created_at);

-- Keep updated_at fresh on any change.
create or replace function tickets_touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_tickets_touch on tickets;
create trigger trg_tickets_touch before update on tickets
  for each row execute function tickets_touch_updated_at();

-- RLS: admin-only via the dashboard. All client-side inserts go through the
-- service-role endpoint (/api/ticket), which bypasses RLS.
alter table tickets      enable row level security;
alter table ticket_notes enable row level security;

drop policy if exists "tickets_admin_all" on tickets;
create policy "tickets_admin_all" on tickets
  for all using (current_user_role() = 'admin');

drop policy if exists "ticket_notes_admin_all" on ticket_notes;
create policy "ticket_notes_admin_all" on ticket_notes
  for all using (current_user_role() = 'admin');
